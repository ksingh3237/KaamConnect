// Turns what Firebase Phone Authentication throws into the app's own ApiError, so the screens keep one error path
// (codes -> text in api/errors.ts). Pure: no React Native imports.
import { ApiError } from './errors';

/** Firebase's code, e.g. "auth/invalid-verification-code", whatever shape the native layer wrapped it in. */
export function firebaseCodeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

// [status, app code]. The status mirrors what the server would have said, so screens can treat both alike.
const MAP: Record<string, [number, string]> = {
  'auth/invalid-phone-number': [422, 'PHONE_INVALID'],
  'auth/missing-phone-number': [422, 'PHONE_INVALID'],
  'auth/invalid-verification-code': [401, 'OTP_INVALID'],
  'auth/missing-verification-code': [401, 'OTP_INVALID'],
  'auth/invalid-verification-id': [401, 'OTP_INVALID'],
  'auth/code-expired': [401, 'OTP_INVALID'],
  'auth/session-expired': [401, 'OTP_INVALID'],
  'auth/too-many-requests': [429, 'TOO_MANY_REQUESTS'],
  'auth/quota-exceeded': [503, 'PHONE_AUTH_QUOTA'],
  'auth/network-request-failed': [0, 'NETWORK'],
  'auth/user-disabled': [403, 'ACCOUNT_DISABLED'],
  // The build or device cannot run phone verification: wrong/missing SHA fingerprint, App Check or Play Integrity
  // refusing the app, reCAPTCHA failing, phone sign-in not enabled in the Firebase console, billing not on.
  'auth/app-not-authorized': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/captcha-check-failed': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/invalid-app-credential': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/missing-client-identifier': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/operation-not-allowed': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/web-internal-error': [503, 'PHONE_AUTH_UNAVAILABLE'],
  'auth/internal-error': [503, 'PHONE_AUTH_UNAVAILABLE'],
};

/** Already an ApiError (from our server) -> unchanged. A Firebase error -> its ApiError. Anything else -> a generic one. */
export function toPhoneAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const code = firebaseCodeOf(error);
  // The Firebase project is on the free plan: real SMS needs the Blaze plan. Firebase spells this a few ways
  // (code "auth/billing-not-enabled", or a BILLING_NOT_ENABLED message inside another code), so match on "billing".
  const text = typeof (error as { message?: unknown })?.message === 'string' ? (error as { message: string }).message : '';
  if (code?.includes('billing') || /billing[_-]?not[_-]?enabled/i.test(text)) {
    return new ApiError(503, 'PHONE_AUTH_BILLING', code ?? 'auth/billing-not-enabled');
  }
  const mapped = code ? MAP[code] : undefined;
  if (mapped) return new ApiError(mapped[0], mapped[1], code ?? mapped[1]);
  // Keep Firebase's code in the message for support, never the raw error text (it can contain the phone number).
  return new ApiError(0, 'PHONE_AUTH_FAILED', code ?? 'Phone verification failed');
}

/** Server answers to the token exchange after which the Firebase sign-in is useless and a new SMS must be requested. */
export const EXCHANGE_NEEDS_NEW_CODE = new Set(['FIREBASE_TOKEN_STALE', 'FIREBASE_TOKEN_INVALID']);
