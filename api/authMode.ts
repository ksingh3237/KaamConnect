// Which way the app proves a phone number: Firebase Phone Authentication, or the original development OTP
// (the server's fixed code 123456 / SMS code). Pure on purpose: the rule is tested without React Native.
//
//   web                         -> 'otp'      (React Native Firebase has no web build; Expo web is a development tool)
//   native, release build       -> 'firebase' ALWAYS (the development OTP can never ship in a store build)
//   native, development build   -> 'firebase' when EXPO_PUBLIC_AUTH_MODE=firebase, otherwise 'otp'
//
// Expo Go cannot load React Native Firebase, so in Expo Go leave EXPO_PUBLIC_AUTH_MODE unset and use 'otp'.

export type AuthMode = 'firebase' | 'otp';

export function resolveAuthMode(configured: string | undefined, platformOS: string, isDevelopmentBuild: boolean): AuthMode {
  if (platformOS === 'web') return 'otp';
  if (!isDevelopmentBuild) return 'firebase';
  return configured?.trim().toLowerCase() === 'firebase' ? 'firebase' : 'otp';
}
