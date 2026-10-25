import { beforeEach, describe, expect, it, vi } from 'vitest';

// The native modules are replaced by fakes: this file tests OUR decisions (when to ask, what to send, what to undo),
// not Expo. Platform and device are variables so each test can be an Android phone, an iOS phone or a simulator.
const env = vi.hoisted(() => ({ os: 'android', isDevice: true }));
const notifications = vi.hoisted(() => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getDevicePushTokenAsync: vi.fn(),
  AndroidImportance: { HIGH: 4 },
}));
const endpoints = vi.hoisted(() => ({
  registerDeviceToken: vi.fn(),
  unregisterDeviceToken: vi.fn(),
}));

const firebase = vi.hoisted(() => ({
  getMessaging: vi.fn(() => ({ fake: 'messaging' })),
  registerDeviceForRemoteMessages: vi.fn(),
  getToken: vi.fn(),
  onTokenRefresh: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return env.os;
    },
  },
}));
vi.mock('expo-device', () => ({
  get isDevice() {
    return env.isDevice;
  },
}));
vi.mock('expo-notifications', () => notifications);
vi.mock('../api/endpoints', () => endpoints);
vi.mock('@react-native-firebase/messaging', () => firebase);

type Module = typeof import('./pushRegistration');
/** A fresh copy of the module (its token bookkeeping is module state), for the platform set in `env`. */
async function load(): Promise<Module> {
  vi.resetModules();
  return import('./pushRegistration');
}

const granted = { status: 'granted' };
const TOKEN_A = 'fcm-token-A-xxxxxxxxxxxxxxxxxxxx';
const TOKEN_B = 'fcm-token-B-xxxxxxxxxxxxxxxxxxxx';
const IOS_FCM_TOKEN = 'fcm-token-IOS-xxxxxxxxxxxxxxxxxxxx';

beforeEach(() => {
  env.os = 'android';
  env.isDevice = true;
  vi.clearAllMocks();
  notifications.setNotificationChannelAsync.mockResolvedValue(undefined);
  notifications.getPermissionsAsync.mockResolvedValue(granted);
  notifications.requestPermissionsAsync.mockResolvedValue(granted);
  notifications.getDevicePushTokenAsync.mockResolvedValue({ type: 'android', data: TOKEN_A });
  endpoints.registerDeviceToken.mockResolvedValue(undefined);
  endpoints.unregisterDeviceToken.mockResolvedValue(undefined);
  firebase.registerDeviceForRemoteMessages.mockResolvedValue(undefined);
  firebase.getToken.mockResolvedValue(IOS_FCM_TOKEN);
  firebase.onTokenRefresh.mockReturnValue(vi.fn());
});

describe('registerForPush', () => {
  it('creates the channel, reads the FCM token and gives it to the server', async () => {
    const { registerForPush } = await load();
    await registerForPush();
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.objectContaining({ importance: 4 }));
    expect(endpoints.registerDeviceToken).toHaveBeenCalledWith(TOKEN_A, 'ANDROID');
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled(); // already allowed: no dialog
  });

  it('asks for permission when it is not decided yet, and registers once allowed', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    const { registerForPush } = await load();
    await registerForPush();
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(endpoints.registerDeviceToken).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when the person says no', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { registerForPush } = await load();
    await registerForPush();
    expect(notifications.getDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(endpoints.registerDeviceToken).not.toHaveBeenCalled();
  });

  it('does nothing on a simulator or on the web', async () => {
    for (const [os, isDevice] of [['android', false], ['ios', false], ['web', true]] as const) {
      env.os = os;
      env.isDevice = isDevice;
      const { registerForPush } = await load();
      await registerForPush();
    }
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(endpoints.registerDeviceToken).not.toHaveBeenCalled();
  });

  it('never touches Firebase Messaging on Android', async () => {
    const { registerForPush } = await load();
    await registerForPush();
    expect(firebase.getToken).not.toHaveBeenCalled();
  });

  it('never throws: Google Play services missing, offline or refused', async () => {
    const { registerForPush } = await load();
    notifications.getDevicePushTokenAsync.mockRejectedValueOnce(new Error('SERVICE_NOT_AVAILABLE'));
    await expect(registerForPush()).resolves.toBeUndefined();
    endpoints.registerDeviceToken.mockRejectedValueOnce(new Error('NETWORK'));
    await expect(registerForPush()).resolves.toBeUndefined();
  });

  it('can run again for a refreshed token', async () => {
    const { registerForPush } = await load();
    await registerForPush();
    notifications.getDevicePushTokenAsync.mockResolvedValue({ type: 'android', data: TOKEN_B });
    await registerForPush();
    expect(endpoints.registerDeviceToken.mock.calls.map((c) => c[0])).toEqual([TOKEN_A, TOKEN_B]);
  });
});

describe('sign-out and switching accounts', () => {
  it('removes this phone’s token from the person who leaves, once', async () => {
    const { registerForPush, unregisterFromPush } = await load();
    await registerForPush();
    await unregisterFromPush();
    await unregisterFromPush();
    expect(endpoints.unregisterDeviceToken).toHaveBeenCalledTimes(1);
    expect(endpoints.unregisterDeviceToken).toHaveBeenCalledWith(TOKEN_A);
  });

  it('still signs out when the server cannot be reached', async () => {
    endpoints.unregisterDeviceToken.mockRejectedValue(new Error('NETWORK'));
    const { registerForPush, unregisterFromPush } = await load();
    await registerForPush();
    await expect(unregisterFromPush()).resolves.toBeUndefined();
  });

  it('a second person signing in on the same phone registers it again', async () => {
    const { registerForPush, unregisterFromPush } = await load();
    await registerForPush(); // person 1
    await unregisterFromPush();
    await registerForPush(); // person 2
    expect(endpoints.registerDeviceToken).toHaveBeenCalledTimes(2);
    expect(endpoints.unregisterDeviceToken).toHaveBeenCalledTimes(1);
  });

  it('waits for a registration that is already on its way, then removes it (no token left behind)', async () => {
    let finish!: () => void;
    endpoints.registerDeviceToken.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { registerForPush, unregisterFromPush } = await load();

    const registering = registerForPush();
    await vi.waitFor(() => expect(endpoints.registerDeviceToken).toHaveBeenCalled());
    const leaving = unregisterFromPush();
    expect(endpoints.unregisterDeviceToken).not.toHaveBeenCalled(); // must not run ahead of the registration
    finish();
    await Promise.all([registering, leaving]);

    expect(endpoints.unregisterDeviceToken).toHaveBeenCalledWith(TOKEN_A);
  });

  it('a person who signs out while the permission dialog is open is never registered afterwards', async () => {
    let answer!: (value: { status: string }) => void;
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    notifications.requestPermissionsAsync.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { registerForPush, unregisterFromPush } = await load();

    const registering = registerForPush();
    await vi.waitFor(() => expect(notifications.requestPermissionsAsync).toHaveBeenCalled());
    await unregisterFromPush(); // signed out meanwhile
    answer(granted);
    await registering;

    expect(endpoints.registerDeviceToken).not.toHaveBeenCalled();
  });

  it('forgetPushToken (account deleted) stops a later unregister from calling the server', async () => {
    const { registerForPush, forgetPushToken, unregisterFromPush } = await load();
    await registerForPush();
    forgetPushToken();
    await unregisterFromPush();
    expect(endpoints.unregisterDeviceToken).not.toHaveBeenCalled();
  });
});

describe('iOS', () => {
  beforeEach(() => {
    env.os = 'ios';
  });

  it('registers the FCM token from Firebase (not the APNs token) as IOS, without an Android channel', async () => {
    const { registerForPush } = await load();
    await registerForPush();
    expect(firebase.registerDeviceForRemoteMessages).toHaveBeenCalledTimes(1);
    expect(endpoints.registerDeviceToken).toHaveBeenCalledWith(IOS_FCM_TOKEN, 'IOS');
    expect(notifications.getDevicePushTokenAsync).not.toHaveBeenCalled(); // that one would be an APNs token
    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('asks for permission first and sends nothing when it is refused', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { registerForPush } = await load();
    await registerForPush();
    expect(firebase.getToken).not.toHaveBeenCalled();
    expect(endpoints.registerDeviceToken).not.toHaveBeenCalled();
  });

  it('never throws when Firebase has no APNs key or the entitlement is missing', async () => {
    firebase.getToken.mockRejectedValue(new Error('messaging/apns-token-not-set'));
    const { registerForPush } = await load();
    await expect(registerForPush()).resolves.toBeUndefined();
    expect(endpoints.registerDeviceToken).not.toHaveBeenCalled();
  });

  it('sign-out removes the iOS token too', async () => {
    const { registerForPush, unregisterFromPush } = await load();
    await registerForPush();
    await unregisterFromPush();
    expect(endpoints.unregisterDeviceToken).toHaveBeenCalledWith(IOS_FCM_TOKEN);
  });

  it('re-registers when Firebase rotates the token, and stops listening on cleanup', async () => {
    const stop = vi.fn();
    firebase.onTokenRefresh.mockReturnValue(stop);
    const { onFcmTokenRefresh } = await load();
    const changed = vi.fn();
    const unsubscribe = onFcmTokenRefresh(changed);
    await vi.waitFor(() => expect(firebase.onTokenRefresh).toHaveBeenCalledWith({ fake: 'messaging' }, changed));
    unsubscribe();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe on Android', async () => {
    env.os = 'android';
    const { onFcmTokenRefresh } = await load();
    const unsubscribe = onFcmTokenRefresh(vi.fn());
    await new Promise((resolve) => setTimeout(resolve, 20)); // a subscription would be made asynchronously
    unsubscribe();
    expect(firebase.onTokenRefresh).not.toHaveBeenCalled();
  });
});
