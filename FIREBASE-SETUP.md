# Firebase phone sign-in: setup, builds and manual testing

How the app signs in with **Firebase Phone Authentication**, how to build it for Android and iOS, and how to test it by hand.
The server side is in the backend repo: `docs/13-firebase-phone-auth.md`.

## How it works

1. `api/phoneAuth.native.ts` asks Firebase to SMS a code to the number (React Native Firebase, modular API).
2. The person types the code; Firebase returns a **Firebase ID token**.
3. `api/firebasePhone.ts` sends that token to `POST /auth/firebase/verify`. The server checks it and replies with **its own** session
   (the same reply as the development OTP). The app then signs out of Firebase: from here on the app uses our tokens only.
4. Account deletion proves the number the same way (`DELETE /me` with `firebaseIdToken` instead of `code`).

Which mode runs is decided by `api/authMode.ts`:

| Where the app runs | Mode |
|---|---|
| Web (Expo web, the local testing tool) | development OTP, always |
| Expo Go | development OTP (React Native Firebase cannot load in Expo Go) |
| **Release build on a phone** (`eas build --profile preview` / `production`) | **Firebase, always**: the development OTP cannot ship in a store build |
| Development build on a phone | development OTP unless `EXPO_PUBLIC_AUTH_MODE=firebase` |

The two Firebase config files (`google-services.json`, `GoogleService-Info.plist`) are **committed**: they hold public client
identifiers, not secrets. What protects them are the API-key restrictions below. The server's service-account key is a different
thing and is never in this repository or the app.

## One-time Firebase console steps

Project `kaamconnect-a829d`. Apps registered: Android `com.kaamconnect.app`, iOS `com.kaamconnect.app`.

1. Authentication > Sign-in method > **Phone: enable**.
2. Authentication > Settings > **SMS region policy: allow India (+91) only**.
3. Authentication > Phone > **Phone numbers for testing**: add a fictional number and a fixed code (for example `+91 90000 00001` / `123456`).
   Test numbers send no SMS, cost nothing and work on simulators, emulators and in CI-free manual tests.
4. Enable **App Check** (Play Integrity for Android, App Attest/DeviceCheck for iOS) and enforce it for Authentication before launch.
5. Google Cloud console > APIs & Services > Credentials: **restrict both client API keys** (Android: package `com.kaamconnect.app` + SHA-1;
   iOS: bundle id `com.kaamconnect.app`; limit to the APIs the app uses).
6. Billing: SMS volume on the free plan is small; production needs the pay-as-you-go plan. Check the limits in the console.

## Android (EAS Build)

Phone Authentication on Android needs your **signing certificate fingerprints** registered in Firebase. Without them the SMS flow
fails with `auth/app-not-authorized` or falls back to a browser reCAPTCHA. (`google-services.json` currently has no OAuth clients,
which is the sign that no fingerprint has been added yet.)

1. `eas credentials --platform android` > pick the build profile > note the keystore's **SHA-1 and SHA-256**.
   Do this for every profile you will install (development, preview, production if they use different keystores).
2. Firebase console > Project settings > Your apps > Android > **Add fingerprint** (SHA-1 and SHA-256).
3. If you publish through Google Play: also add the **Play App Signing** SHA-1/SHA-256 (Play console > Setup > App integrity).
4. **Download `google-services.json` again** (it now lists the fingerprints) and replace the one in the project root. Commit it.
5. Build a development client: `eas build --profile development --platform android`, install the APK.
6. Start Metro against that build:
   ```
   set EXPO_PUBLIC_AUTH_MODE=firebase
   set EXPO_PUBLIC_API_URL=http://<your PC's LAN address>:3000
   npx expo start --dev-client
   ```
   (`EXPO_PUBLIC_API_URL`: an Android phone cannot use `localhost`; the emulator uses `10.0.2.2`.)
7. For `preview` / `production` builds the mode is Firebase automatically. Set the API address for those builds with
   `eas env:create` (name `EXPO_PUBLIC_API_URL`, **https**: release Android builds block plain `http://`).

If you built a development client before React Native Firebase was added, uninstall it first (otherwise: `RNFBAppModule not found`).

## iOS (EAS cloud build, no Mac needed)

* An **Apple Developer Program** account is required. EAS creates the bundle id, certificates and profiles when you run
  `eas build --platform ios` and sign in with Apple.
* Install on a real device: `eas device:create` (registers the iPhone), then `eas build --profile development --platform ios`.
* `app.json` sets `expo-build-properties` > `ios.useFrameworks: "dynamic"`, which React Native Firebase needs with the default
  Swift Package Manager setup. Builds take longer because of it.
* The reCAPTCHA URL scheme (the "encoded app ID" from `GOOGLE_APP_ID` in the plist) is added by the `@react-native-firebase/auth`
  config plugin. **Not verified from this Windows machine**: prebuild for iOS only runs on macOS or EAS. After the first EAS iOS build,
  check the build log, or run `npx expo prebuild --platform ios` on a Mac and look for `CFBundleURLSchemes` in `Info.plist`
  (it should contain `app-1-...-ios-...`).
* **Silent push (optional but better UX):** Firebase verifies the device with a silent APNs push. Upload an **APNs authentication key
  (.p8)** in Firebase console > Project settings > Cloud Messaging > Apple app configuration, and make sure the build has the Push
  Notifications capability. Without it Firebase falls back to a reCAPTCHA web view: it still works, it is just slower.
* The iOS **Simulator cannot receive push**: it always uses the reCAPTCHA fallback. Use a test phone number from the console.
* `iOS` was not built or run as part of this change.

## Running it locally against the real backend

Backend (`KaamConnectBackendAPI/.env`, a developer machine only):

```
FIREBASE_AUTH_ENABLED=true
FIREBASE_SERVICE_ACCOUNT_PATH=<absolute path to the service-account JSON, kept OUTSIDE the repository>
LEGACY_OTP_ENABLED=true        # keeps the web testing flow (fixed code 123456) working next to Firebase
```
then `npm run dev:local`. The server refuses to start if the key cannot be read, so a typo is visible immediately.

## Manual test checklist (Android first, then iOS)

Use a Firebase **test number** first, then a real number you own.

1. Fresh install > Get Started > enter the number > the OTP screen shows **no** yellow "DEVELOPMENT" banner.
2. Wrong code > a clear error, the boxes clear, you can type again (no new SMS needed).
3. Correct code > you land on role selection (new number) or the marketplace (returning number).
4. Close the app completely and reopen > still signed in (our refresh token, not Firebase).
5. Profile > Log out > sign in again with the same number > same account (not a new one).
6. Request a code, wait for the "Resend" timer, resend > a new SMS arrives; the old code stops working.
7. Airplane mode on the OTP screen > "Cannot reach the server" style message; turn it off, press Verify again > works without a new SMS.
8. Stale path: stop the API, type the correct code (the server call fails), wait 6 minutes, start the API, press Verify >
   "That verification is too old. Request a new code", and Verify no longer works until you resend.
9. Android only: on a device with SMS auto-retrieval, the screen may finish by itself before you type anything. That is expected.
10. Profile > Delete my account > Send code > enter it > the account is deleted and you are signed out. With an open job it refuses first.
11. Backend log while doing all this: no Firebase token, no full phone number.

## Automated checks (what they do and do not prove)

* `npm test` (Vitest): sign-in mode selection, Firebase error mapping, the sign-in/deletion flow against a fake Firebase.
* `npx tsc --noEmit`, `npx expo export --platform web` (the web bundle contains no Firebase code) and
  `npx expo export --platform android` (it does).
* They do **not** prove that a real SMS is sent or that your fingerprints are registered: only the manual checklist does.
