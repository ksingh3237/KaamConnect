// MSG91 OTP widget configuration. Read from environment variables that Expo inlines at build time:
//   EXPO_PUBLIC_MSG91_WIDGET_ID    the widget id (dashboard > OTP > your widget)
//   EXPO_PUBLIC_MSG91_TOKEN_AUTH   the widget token (dashboard > OTP > Token)
//
// SECURITY: anything named EXPO_PUBLIC_* is compiled into the app and can be extracted by anyone with the app file. It
// is not a secret vault. MSG91 issues this token for exactly that use (it only works for this widget's send/verify
// calls) and keeps the account Authkey separate. The Authkey is NEVER put here: it lives on the server only.
// Set the values in a git-ignored .env.local (see .env.example); never commit real ones.
import { Platform } from 'react-native';

const clean = (value: string | undefined): string => (value ?? '').trim();

export const MSG91_WIDGET_ID = clean(process.env.EXPO_PUBLIC_MSG91_WIDGET_ID);
export const MSG91_TOKEN_AUTH = clean(process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH);

/** How long to wait for MSG91 before giving up (the SDK itself has no timeout). */
export const MSG91_TIMEOUT_MS = 15_000;

/**
 * True when real MSG91 sign-in should be used. MSG91's mobile widget does not work on the web, and without the two
 * values there is nothing to call; in both cases the app keeps using the backend's own OTP flow (the development OTP).
 */
export function isMsg91WidgetConfigured(): boolean {
  return Platform.OS !== 'web' && MSG91_WIDGET_ID !== '' && MSG91_TOKEN_AUTH !== '';
}
