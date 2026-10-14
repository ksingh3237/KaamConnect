// The Firebase phone sign-in flow, written against two small dependencies so it can be tested without React Native or a
// network: `phoneAuth` (api/phoneAuth*.ts) and `exchange` (POST /auth/firebase/verify).
//
//   requestCode -> Firebase sends the SMS
//   signIn      -> the SMS code becomes a Firebase ID token, the server trades that for OUR session, Firebase is signed out
//   proveOwnership -> the same first half, for account deletion (the server checks the token itself)
//
// Failures from Firebase are turned into ApiError by firebaseErrors.ts, so the screens have one error path.
import { EXCHANGE_NEEDS_NEW_CODE, toPhoneAuthError } from './firebaseErrors';
import { toE164 } from './phone';
import type { PhoneAuth } from './phoneAuthTypes';
import type { OtpRequestResult, VerifyResult } from './types';

/** Firebase throttles sending itself; this only paces the "Resend" button. */
export const FIREBASE_RESEND_SEC = 30;

export interface FirebasePhoneDeps {
  phoneAuth: PhoneAuth;
  exchange: (idToken: string) => Promise<VerifyResult>;
}

export function createFirebasePhoneFlow({ phoneAuth, exchange }: FirebasePhoneDeps) {
  return {
    async requestCode(phone: string): Promise<OtpRequestResult> {
      try {
        await phoneAuth.sendCode(toE164(phone));
      } catch (error) {
        throw toPhoneAuthError(error);
      }
      // expiresInSec 0 = unknown: Firebase does not tell the app how long the SMS code lives.
      return { resendAfterSec: FIREBASE_RESEND_SEC, expiresInSec: 0 };
    },

    async signIn(code: string): Promise<VerifyResult> {
      let idToken: string;
      try {
        idToken = await phoneAuth.confirm(code);
      } catch (error) {
        // A wrong code leaves the pending verification in place so the person can type another one.
        throw toPhoneAuthError(error);
      }
      try {
        const result = await exchange(idToken);
        await phoneAuth.signOut(); // our session is what the app uses from here on
        return result;
      } catch (error) {
        const mapped = toPhoneAuthError(error);
        // Stale or rejected token: the Firebase sign-in is useless now, so the next attempt must ask for a new SMS.
        // A network failure keeps it, so retrying does not spend another code.
        if (EXCHANGE_NEEDS_NEW_CODE.has(mapped.code)) await phoneAuth.signOut();
        throw mapped;
      }
    },

    /** For account deletion: a fresh Firebase ID token for the number just verified. Call `finish()` afterwards. */
    async proveOwnership(code: string): Promise<string> {
      try {
        return await phoneAuth.confirm(code);
      } catch (error) {
        throw toPhoneAuthError(error);
      }
    },

    /** Forget the Firebase sign-in (after a deletion attempt, or when a stale token means starting over). */
    finish(): Promise<void> {
      return phoneAuth.signOut();
    },

    /** Android auto-verification: calls back when the number was verified without typing the code. */
    onAutoVerified(callback: () => void): () => void {
      return phoneAuth.onAutoVerified(callback);
    },
  };
}

export type FirebasePhoneFlow = ReturnType<typeof createFirebasePhoneFlow>;
