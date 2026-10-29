// Makes the phone noticed while the app is OPEN. Android only rings and vibrates by itself for notifications it
// draws; a push that arrives in the foreground, and anything the app learns over the socket or a poll (the worker
// arrived, the bill is ready, the cost was approved), produced nothing at all. These two calls fix that:
//
//   buzz(level)   - vibration only, for a change the person is already looking at
//   ringAlert(..) - a real heads-up notification on the loud channel, for a change they may have scrolled away from
//
// Vibration comes from React Native itself on purpose: no extra native module, so the existing dev client keeps
// working. It also vibrates with the phone on silent, which is the point.
import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DEFAULT_VIBRATION, LEAD_CHANNEL_ID, LEAD_SOUND_FILE, LEAD_VIBRATION } from './pushChannels';

export type AlertLevel = 'loud' | 'soft';

const native = Platform.OS === 'android' || Platform.OS === 'ios';

/** The notification types the server sends on the loud channel. Keep in step with backend push-alert.ts ALERT_TYPES. */
export const LOUD_TYPES: ReadonlySet<string> = new Set([
  'NEW_LEAD',
  'DIRECT_REQUEST',
  'BOOKING_CONFIRMED',
  'NEW_QUOTE',
  'WORKER_ARRIVED',
]);

export const levelForType = (type: string): AlertLevel => (LOUD_TYPES.has(type) ? 'loud' : 'soft');

/** Vibrate, nothing else. Safe to call anywhere: a no-op on the web and when the phone cannot vibrate. */
export function buzz(level: AlertLevel = 'soft'): void {
  if (!native) return;
  try {
    // iOS ignores the pattern's timings and buzzes once per entry, which is what we want there too
    Vibration.vibrate(level === 'loud' ? LEAD_VIBRATION : DEFAULT_VIBRATION, false);
  } catch {
    // A phone without a vibrator is not a reason to fail whatever called this
  }
}

export interface RingOptions {
  title: string;
  body: string;
  level?: AlertLevel;
  /** Carried into the tap handler (utils/openNotification.ts), same shape as a server push. */
  data?: Record<string, unknown>;
}

/**
 * Buzzes AND draws a notification, so the bell is heard even with the phone face down. Used for the moments the app
 * learns about itself rather than through a push. Never throws: an alert that cannot be shown must not break a screen.
 */
export async function ringAlert({ title, body, level = 'loud', data = {} }: RingOptions): Promise<void> {
  buzz(level);
  if (!native) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: level === 'loud' ? LEAD_SOUND_FILE : undefined,
        ...(Platform.OS === 'android' && level === 'loud' ? { channelId: LEAD_CHANNEL_ID } : {}),
      },
      trigger: null, // now
    });
  } catch {
    // The vibration above already happened; a missing banner is not worth an error on screen
  }
}
