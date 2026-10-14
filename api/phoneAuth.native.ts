// Firebase Phone Authentication through React Native Firebase (modular API). Native builds only: Expo Go cannot load it,
// so the module is required lazily, the first time a Firebase call is made. In Expo Go the app stays in 'otp' mode
// (api/authMode.ts) and this code never runs.
import { ApiError } from './errors';
import type { PhoneAuth } from './phoneAuthTypes';

type AuthModule = typeof import('@react-native-firebase/auth');
type Confirmation = Awaited<ReturnType<AuthModule['signInWithPhoneNumber']>>;

let loaded: AuthModule | null = null;
function firebase(): AuthModule {
  if (!loaded) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('@react-native-firebase/auth') as AuthModule;
    } catch {
      throw new ApiError(0, 'PHONE_AUTH_UNAVAILABLE', 'React Native Firebase is not part of this build (Expo Go?)');
    }
  }
  return loaded;
}

let confirmation: Confirmation | null = null;
let pendingPhone: string | null = null;

// Development builds only: the raw Firebase error goes to the Metro terminal / logcat (it may name the phone number).
function logFailure(step: string, error: unknown): void {
  if (__DEV__) console.warn(`[phoneAuth] ${step} failed:`, (error as { code?: unknown })?.code, (error as { message?: unknown })?.message);
}

async function sendCode(e164: string): Promise<void> {
  const { getAuth, signInWithPhoneNumber } = firebase();
  // A new request replaces the old one; an earlier half-finished sign-in must not leak into this one.
  const auth = getAuth();
  if (auth.currentUser) await auth.signOut();
  confirmation = null;
  pendingPhone = e164;
  try {
    confirmation = await signInWithPhoneNumber(auth, e164);
  } catch (error) {
    logFailure('sendCode', error);
    throw error;
  }
}

async function confirm(code: string): Promise<string> {
  const { getAuth } = firebase();
  const auth = getAuth();
  // Already signed in for THIS number: Android verified it automatically, or the code was accepted on an earlier
  // attempt whose exchange with our server then failed (network). Reuse it instead of spending the code twice.
  const existing = auth.currentUser;
  if (existing && existing.phoneNumber === pendingPhone) return existing.getIdToken(true);

  if (!confirmation) throw new ApiError(401, 'OTP_INVALID', 'No code was requested');
  let credential;
  try {
    credential = await confirmation.confirm(code);
  } catch (error) {
    logFailure('confirm', error);
    throw error;
  }
  if (!credential?.user) throw new ApiError(0, 'PHONE_AUTH_FAILED', 'Phone verification failed');
  return credential.user.getIdToken(true);
}

function onAutoVerified(callback: () => void): () => void {
  let module: AuthModule;
  try {
    module = firebase();
  } catch {
    return () => {};
  }
  const { getAuth, onAuthStateChanged } = module;
  return onAuthStateChanged(getAuth(), (user) => {
    if (user && user.phoneNumber && user.phoneNumber === pendingPhone) callback();
  });
}

async function signOut(): Promise<void> {
  confirmation = null;
  pendingPhone = null;
  if (!loaded) return; // nothing was ever started
  try {
    const { getAuth } = loaded;
    if (getAuth().currentUser) await getAuth().signOut();
  } catch {
    /* nothing useful to do: our own session does not depend on it */
  }
}

export const phoneAuth: PhoneAuth = { sendCode, confirm, onAutoVerified, signOut };
