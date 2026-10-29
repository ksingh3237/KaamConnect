// The Android notification channels. Android decides sound, vibration and "pop up on screen" per CHANNEL, and fixes them
// when the channel is first created: the app cannot change an existing channel, and the person can still change it in the
// phone's settings. So a different sound needs a NEW channel id, never an edit of an old one.
//
// The ids are named by the server in every push (KaamConnectBackendAPI src/modules/notifications/push-alert.ts):
//   new_leads_v2 - the moments that must not be missed (a new lead, a direct request, a confirmed booking, a quote
//                  for the customer, the worker arriving): rings the bell and vibrates, even from the lock screen
//   default      - everything else: a normal pop-up with vibration and the phone's own notification sound
//
// The "_v2" is the version of the SETTINGS above, not of the app: phones that created `new_leads` before the bell
// sound existed keep the old silent settings forever, so the loud channel is re-created under a new id and the old
// one deleted. Changing the sound or the vibration again means another id (and the server's must match).
import * as Notifications from 'expo-notifications';

export const DEFAULT_CHANNEL_ID = 'default';
export const LEAD_CHANNEL_ID = 'new_leads_v2';
/** The first loud channel, created before the bell sound shipped. Deleted so it stops showing in phone settings. */
export const RETIRED_CHANNEL_IDS = ['new_leads'];
/** In assets/sounds, copied into the app by the expo-notifications plugin (app.json "sounds"). */
export const LEAD_SOUND_FILE = 'new_lead.wav';

/** Buzz, pause, buzz ... (milliseconds, starting with a pause): long enough to feel in a pocket. */
export const LEAD_VIBRATION = [0, 500, 250, 500, 250, 500, 250, 500];
export const DEFAULT_VIBRATION = [0, 250, 250, 250];

/** Creates (or leaves as they are) both channels, and clears out retired ones. Android only; the caller checks that. */
export async function ensureAndroidChannels(): Promise<void> {
  for (const id of RETIRED_CHANNEL_IDS) {
    await Notifications.deleteNotificationChannelAsync(id).catch(() => undefined);
  }
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'KaamConnect',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: DEFAULT_VIBRATION,
  });
  await Notifications.setNotificationChannelAsync(LEAD_CHANNEL_ID, {
    name: 'New job alerts',
    description: 'Rings a bell and vibrates when a new job, a direct request or a confirmed booking arrives.',
    importance: Notifications.AndroidImportance.MAX,
    sound: LEAD_SOUND_FILE,
    enableVibrate: true,
    vibrationPattern: LEAD_VIBRATION,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    // Follows the phone's ring volume, like an incoming call; on silent it still vibrates
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
    enableLights: true,
    lightColor: '#00B074',
  });
}
