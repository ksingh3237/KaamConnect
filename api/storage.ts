// Persists the login between app launches. Native: the OS secure store (Keychain / Keystore). Web: localStorage
// (the browser has no secure store; this is the standard trade-off for a web build and is for local testing here).
// Every call is wrapped: storage can be unavailable (private window, blocked site data) and the app must still work,
// just without remembering the login.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'kaamconnect.session.v1';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function isStoredTokens(value: unknown): value is StoredTokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as StoredTokens).accessToken === 'string' &&
    typeof (value as StoredTokens).refreshToken === 'string'
  );
}

export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(KEY) ?? null
        : await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredTokens(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  try {
    const raw = JSON.stringify(tokens);
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, raw);
    else await SecureStore.setItemAsync(KEY, raw);
  } catch {
    /* not remembered; the in-memory session still works */
  }
}

export async function clearTokens(): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* nothing to clear */
  }
}

const LANGUAGE_KEY = 'kaamconnect.language.v1';

/** The language the person chose ('en' | 'hi' | 'pa'), so a restart keeps it. Not secret. */
export async function loadLanguage(): Promise<'en' | 'hi' | 'pa' | null> {
  try {
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(LANGUAGE_KEY) ?? null : await SecureStore.getItemAsync(LANGUAGE_KEY);
    return raw === 'en' || raw === 'hi' || raw === 'pa' ? raw : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(lang: 'en' | 'hi' | 'pa'): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(LANGUAGE_KEY, lang);
    else await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  } catch {
    /* not remembered; the language still applies for this run */
  }
}

const ROLE_KEY = 'kaamconnect.role.v1';

/** The app mode the person last used ('customer' | 'worker'), so a restart reopens the same side. Not secret. */
export async function loadRole(): Promise<'customer' | 'worker' | null> {
  try {
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(ROLE_KEY) ?? null : await SecureStore.getItemAsync(ROLE_KEY);
    return raw === 'customer' || raw === 'worker' ? raw : null;
  } catch {
    return null;
  }
}

export async function saveRole(role: 'customer' | 'worker'): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(ROLE_KEY, role);
    else await SecureStore.setItemAsync(ROLE_KEY, role);
  } catch {
    /* not remembered; the role still works for this run */
  }
}
