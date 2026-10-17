// Renders nothing. While someone is signed in it keeps the bell's unread count current and handles taps on system
// notifications. Mounted once in app/_layout.tsx.
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSession } from '../store/useSession';
import { useNotifications } from '../store/useNotifications';
import { openNotification } from '../utils/openNotification';
import { registerForPush } from '../utils/pushRegistration';

const UNREAD_POLL_MS = 30_000;
const native = Platform.OS === 'android' || Platform.OS === 'ios';

// A tap can be reported twice (the live listener and the launch notification), so each is opened only once
const opened = new Set<string>();

function openFromResponse(response: Notifications.NotificationResponse): void {
  const key = `${response.notification.request.identifier}|${response.notification.date}|${response.actionIdentifier}`;
  if (opened.has(key)) return;
  opened.add(key);
  if (opened.size > 50) opened.delete(opened.values().next().value as string);
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const type = typeof data?.type === 'string' ? data.type : '';
  openNotification(type, data);
}

export default function PushHost() {
  const signedIn = useSession((s) => s.status === 'signedIn');
  const refreshUnread = useNotifications((s) => s.refreshUnread);
  const setUnread = useNotifications((s) => s.setUnread);

  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return undefined;
    }
    void refreshUnread();
    const timer = setInterval(() => void refreshUnread(), UNREAD_POLL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshUnread();
    });
    return () => {
      clearInterval(timer);
      appState.remove();
    };
  }, [signedIn, refreshUnread, setUnread]);

  useEffect(() => {
    if (!signedIn || !native) return undefined;
    // A push arrived while the app is open: the bell shows it straight away
    const received = Notifications.addNotificationReceivedListener(() => void refreshUnread());
    // A tap while the app was running or in the background
    const tapped = Notifications.addNotificationResponseReceivedListener(openFromResponse);
    // FCM rotated the token: give the server the new one
    const rotated = Notifications.addPushTokenListener(() => void registerForPush());
    // A tap that launched the app from closed (handled once, then cleared so a restart does not repeat it)
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      Notifications.clearLastNotificationResponse();
      setTimeout(() => openFromResponse(response), 500); // let the navigator finish mounting after a cold start
    });
    return () => {
      received.remove();
      tapped.remove();
      rotated.remove();
    };
  }, [signedIn, refreshUnread]);

  return null;
}
