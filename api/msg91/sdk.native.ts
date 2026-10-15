// The real MSG91 SDK. Loaded only on Android and iOS (Metro picks this file there); the web build gets sdk.ts instead.
// The package ships native code, so it needs a development build (expo prebuild), not Expo Go.
//
// Loaded with require() so `tsc` does not type-check the package's own TypeScript source (it targets older React Native
// typings and has errors of its own, for example StyleSheet.absoluteFillObject in its built-in widget UI, which this
// app does not use). The SDK types every method as `any`; the typed surface this app relies on is OtpWidgetSdk.
import type { OtpWidgetSdk } from './widgetClient';

export const sdk: OtpWidgetSdk = require('@msg91comm/sendotp-react-native').OTPWidget;
