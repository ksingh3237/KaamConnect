// Where the API lives. Override with EXPO_PUBLIC_API_URL (the server origin, no path), for example:
//   EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npx expo start      (a real phone on the same Wi-Fi)
// Defaults for a developer machine: the Android emulator reaches the host as 10.0.2.2; web and the iOS simulator
// use localhost.
import { Platform } from 'react-native';

const fromEnv = process.env.EXPO_PUBLIC_API_URL;

function defaultOrigin(): string {
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_ORIGIN = (fromEnv && fromEnv.trim() !== '' ? fromEnv : defaultOrigin()).replace(/\/+$/, '');
export const API_BASE = `${API_ORIGIN}/api/v1`;

/** How long a request may take before the app gives up and says so. */
export const REQUEST_TIMEOUT_MS = 20_000;
