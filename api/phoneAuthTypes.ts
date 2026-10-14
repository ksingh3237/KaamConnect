// The small surface the app needs from Firebase Phone Authentication. Two implementations: phoneAuth.native.ts (the real
// one, React Native Firebase) and phoneAuth.ts (web and anywhere Firebase is not available: every call refuses).
export interface PhoneAuth {
  /** Sends the SMS code to an E.164 number ("+919876543210"). Rejects with a Firebase error. */
  sendCode(e164: string): Promise<void>;
  /**
   * Completes the sign-in with the SMS code and returns a fresh Firebase ID token. If Android already verified the number
   * automatically (SMS retrieval) or an earlier attempt got this far, the existing sign-in is used and `code` may be empty.
   */
  confirm(code: string): Promise<string>;
  /** Android only: calls back when the SMS was read and verified without typing. Returns the unsubscribe function. */
  onAutoVerified(callback: () => void): () => void;
  /** Ends the Firebase sign-in and forgets the pending code. Safe to call at any time. Our own session is separate. */
  signOut(): Promise<void>;
}
