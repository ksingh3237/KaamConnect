// Wires the pure pieces to this app: the platform, the build type, the real Firebase module and the real API.
import { Platform } from 'react-native';
import { resolveAuthMode } from './authMode';
import * as endpoints from './endpoints';
import { createFirebasePhoneFlow } from './firebasePhone';
import { phoneAuth } from './phoneAuth';

/** 'firebase' on real device builds (always in release builds); 'otp' = the server's development OTP (web, Expo Go, dev builds by default). */
export const AUTH_MODE = resolveAuthMode(process.env.EXPO_PUBLIC_AUTH_MODE, Platform.OS, __DEV__);

export const firebaseFlow = createFirebasePhoneFlow({ phoneAuth, exchange: endpoints.verifyFirebase });
