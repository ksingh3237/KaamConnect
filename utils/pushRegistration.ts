// Tells the server which phone to send push notifications to (FCM token), and stops that on sign-out.
//
// Android builds only: there `getDevicePushTokenAsync` returns the FCM token the backend's Firebase Admin sends to.
// On iOS the same call returns an APNs token, which FCM cannot use without the Firebase iOS SDK, so iOS skips push
// for now (the in-app bell still works). Simulators and the web have no push token either.
// Nothing here may ever fail a login: every step is best effort.
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerDeviceToken, unregisterDeviceToken } from '../api/endpoints';

export const ANDROID_CHANNEL_ID = 'default';

const pushSupported = Platform.OS === 'android';

if (pushSupported) {
  // Show alerts even while the app is open (the bell also updates through the received-listener in PushHost)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** The token the server has accepted for the person signed in now. */
let registeredToken: string | null = null;
/** A token whose registration call is on its way; sign-out waits for it so it cannot land after the sign-out. */
let pendingToken: string | null = null;
let posting: Promise<unknown> | null = null;
/** Bumped by every sign-out. A registration that started before it must not register anything afterwards. */
let epoch = 0;

/** Asks for permission if needed, reads the FCM token and gives it to the server. Safe to call again (the server upserts). */
export async function registerForPush(): Promise<void> {
  if (!pushSupported || !Device.isDevice) return;
  const mine = epoch;
  try {
    // Android 8+ needs the channel before the first notification; the backend names this channel in every message
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'KaamConnect',
      importance: Notifications.AndroidImportance.HIGH,
    });
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;
    const { data } = await Notifications.getDevicePushTokenAsync();
    if (typeof data !== 'string' || data.length === 0) return;
    if (mine !== epoch) return; // signed out while the permission dialog or token request was open
    pendingToken = data;
    posting = registerDeviceToken(data, 'ANDROID');
    await posting;
    if (mine === epoch) registeredToken = data;
  } catch {
    /* no Google Play services, offline, or the server refused: the next sign-in or token refresh tries again */
  }
}

/** Sign-out: stop pushes for this phone to the person who just left. Call BEFORE the login is cleared. */
export async function unregisterFromPush(): Promise<void> {
  epoch += 1;
  try {
    await posting; // a registration already sent must finish first, or it would land after this
  } catch {
    /* it failed, so there is nothing to undo */
  }
  const token = registeredToken ?? pendingToken;
  registeredToken = null;
  pendingToken = null;
  posting = null;
  if (!token) return;
  try {
    await unregisterDeviceToken(token);
  } catch {
    /* the server also moves the token to whoever signs in next on this phone */
  }
}

/** Forget the token without calling the server (the account is gone, so are its tokens). */
export function forgetPushToken(): void {
  epoch += 1;
  registeredToken = null;
  pendingToken = null;
  posting = null;
}
