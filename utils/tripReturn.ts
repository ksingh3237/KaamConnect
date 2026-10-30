// Getting the worker back after they open Google Maps. Android's own navigation fills the screen, and the only way
// back is the notification shade: the location foreground service already puts one there, but only when the service
// could start (it needs the "all the time" permission, and it never runs on iOS). This adds a plain ongoing
// notification that always exists while the worker is en route and has opened navigation, and that leads straight to
// the job screen when tapped (utils/notificationRoutes.ts, type TRIP_RETURN).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DEFAULT_CHANNEL_ID } from './pushChannels';
import { t } from '../i18n';

/** The type carried in the notification's data, routed by utils/notificationRoutes.ts. */
export const TRIP_RETURN_TYPE = 'TRIP_RETURN';

const native = Platform.OS === 'android' || Platform.OS === 'ios';
let shownId: string | null = null;

/** Puts "tap to come back" in the shade. Safe to call again: only one is ever shown. */
export async function showReturnReminder(jobId: string): Promise<void> {
  if (!native || shownId) return;
  try {
    shownId = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('KaamConnect • trip in progress'),
        body: t('Tap to come back to the job and enter the arrival code'),
        data: { type: TRIP_RETURN_TYPE, jobId },
        sticky: true, // Android: the person cannot swipe it away by accident while they drive
        autoDismiss: false,
        ...(Platform.OS === 'android' ? { channelId: DEFAULT_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
  } catch {
    shownId = null; // nothing in the shade: the worker still has the app in recent apps
  }
}

/** Takes it away again: they are back, or the job is no longer on the way. */
export async function clearReturnReminder(): Promise<void> {
  const id = shownId;
  shownId = null;
  if (!id) return;
  try {
    await Notifications.dismissNotificationAsync(id);
  } catch {
    // already gone
  }
}
