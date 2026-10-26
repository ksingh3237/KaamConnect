// Tells the server which phone to send push notifications to (an FCM token), and stops that on sign-out.
//
// Both platforms end up with an FCM token, because the backend sends through Firebase Cloud Messaging only:
//  - Android: `getDevicePushTokenAsync` already returns the FCM token.
//  - iOS: the same call returns an APNs token, which FCM cannot use, so the token comes from @react-native-firebase/messaging
//    (it swaps the APNs token for an FCM one). Firebase then delivers through Apple's APNs; this needs the APNs key uploaded
//    to the Firebase console (docs: push notifications setup).
// Simulators and the web have no push token. Nothing here may ever fail a login: every step is best effort.
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerDeviceToken, unregisterDeviceToken } from '../api/endpoints';

export const ANDROID_CHANNEL_ID = 'default';

const platform = Platform.OS === 'android' ? 'ANDROID' : Platform.OS === 'ios' ? 'IOS' : null;

if (platform) {
  // Show alerts even while the app is open (the bell also updates through the received-listener in PushHost)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** The Firebase messaging module, loaded only on iOS so Android and the web never touch it. */
async function firebaseMessaging() {
  const api = await import('@react-native-firebase/messaging');
  return { api, messaging: api.getMessaging() };
}

/** This phone's FCM token, or null when it cannot be had. */
async function readFcmToken(): Promise<string | null> {
  if (platform === 'IOS') {
    const { api, messaging } = await firebaseMessaging();
    await api.registerDeviceForRemoteMessages(messaging); // lets Firebase receive the APNs token (a no-op once done)
    return (await api.getToken(messaging)) || null;
  }
  const { data } = await Notifications.getDevicePushTokenAsync();
  return typeof data === 'string' && data.length > 0 ? data : null;
}

/**
 * Calls `onChange` with the new FCM token when Firebase rotates it. iOS only: there the token listener of
 * expo-notifications reports the APNs token instead, which is useless to FCM. Returns the function that stops listening.
 */
export function onFcmTokenRefresh(onChange: (token: string) => void): () => void {
  if (platform !== 'IOS' || !Device.isDevice) return () => undefined;
  let stop: (() => void) | undefined;
  let cancelled = false;
  void firebaseMessaging()
    .then(({ api, messaging }) => {
      if (!cancelled) stop = api.onTokenRefresh(messaging, onChange);
    })
    .catch(() => undefined);
  return () => {
    cancelled = true;
    stop?.();
  };
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
  if (!platform || !Device.isDevice) return;
  const mine = epoch;
  try {
    if (platform === 'ANDROID') {
      // Android 8+ needs the channel before the first notification; the backend names this channel in every message
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'KaamConnect',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;
    const token = await readFcmToken();
    if (!token) return;
    if (mine !== epoch) return; // signed out while the permission dialog or token request was open
    await submit(token, platform, mine);
  } catch {
    /* no Google Play services / APNs key not set up, offline, or the server refused: the next sign-in or refresh tries again */
  }
}

/**
 * Gives the server a token, unless it already has exactly this one. The skip also makes any repeated call free: this
 * module once looped (expo-notifications reports "new token" every time the token is READ, and reading it started a
 * registration that read it again), so a repeat must never cost a request.
 */
async function submit(token: string, as: 'ANDROID' | 'IOS', mine: number): Promise<void> {
  if (token === registeredToken || token === pendingToken) return;
  pendingToken = token;
  posting = registerDeviceToken(token, as);
  try {
    await posting;
    if (mine === epoch) registeredToken = token;
  } catch (error) {
    if (pendingToken === token) pendingToken = null; // not accepted, so a later attempt may try it again
    throw error;
  }
}

/**
 * The system says the token changed. Uses the token carried by the event and never reads it again (reading is what
 * triggers this event). Ignored when nothing is registered yet (registerForPush decides that) or the token is the same.
 */
export async function onPushTokenChanged(token: string): Promise<void> {
  if (!platform || !Device.isDevice || !token) return;
  if (registeredToken === null && pendingToken === null) return;
  try {
    await submit(token, platform, epoch);
  } catch {
    /* the next sign-in or refresh tries again */
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
