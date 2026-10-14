// Web / fallback implementation. React Native Firebase has no web build, so on the web (the Expo web development
// tool) and wherever this file is resolved instead of phoneAuth.native.ts, Firebase sign-in is simply unavailable.
// api/authMode.ts never selects Firebase for the web, so these refusals are a safety net, not a code path.
import { ApiError } from './errors';
import type { PhoneAuth } from './phoneAuthTypes';

const unavailable = () => new ApiError(0, 'PHONE_AUTH_UNAVAILABLE', 'Firebase phone sign-in is not available on this platform');

export const phoneAuth: PhoneAuth = {
  sendCode: () => Promise.reject(unavailable()),
  confirm: () => Promise.reject(unavailable()),
  onAutoVerified: () => () => {},
  signOut: () => Promise.resolve(),
};
