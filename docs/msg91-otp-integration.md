# MSG91 OTP sign-in (mobile app + backend)

Real SMS sign-in through the **MSG91 OTP Widget**, using the official `@msg91comm/sendotp-react-native` SDK (3.1.0,
exact pin). Status as of 2026-10-15: **code complete and unit/e2e tested; never run against the real MSG91 service,
never built natively** (see "Test results" and "Known limitations").

## How it works

```
App                               MSG91                         Our backend
 │ sendOTP(91XXXXXXXXXX) ───────────▶│
 │◀── reqId  (or access-token if invisible OTP verified the number)
 │ verifyOTP(reqId, code) ───────────▶│
 │◀── access-token (JWT)              │
 │ POST /auth/msg91/verify {accessToken} ────────────────────────────▶│
 │                                    │◀── verifyAccessToken(authkey, token)
 │                                    │──▶ { type:"success", message:"<number>" }
 │◀──────────────────────── our own access + refresh tokens (existing session flow)
```

- The phone number that signs in is the one **MSG91 reports for the token**. The app never tells the backend which
  number it is; a `phone` field in the request is rejected (e2e-tested).
- A successful `verifyOTP` or `sendOTP` response proves nothing to us by itself. Only the backend's check with MSG91
  (using the server-held Authkey) creates a session.
- The existing session machinery is reused unchanged: `TokenService`, refresh rotation, `expo-secure-store`.
- When the two `EXPO_PUBLIC_MSG91_*` values are empty, or on web, the app keeps using the backend's own OTP flow (the
  marked development code). Nothing else changed for that path.

## Files

Mobile (`KaamConnect`)

| File | Purpose |
| --- | --- |
| `api/msg91/config.ts` | Reads `EXPO_PUBLIC_MSG91_WIDGET_ID` / `_TOKEN_AUTH`; `isMsg91WidgetConfigured()` |
| `api/msg91/responses.ts` | Pure: number formatting, send/verify/retry/config response handling, error classification |
| `api/msg91/widgetClient.ts` | One OTP session: init once, config check, send/retry/verify, timeout, de-duplicated calls |
| `api/msg91/sdk.native.ts` / `sdk.ts` | Real SDK on Android/iOS; stub on web (SDK is not in the web bundle) |
| `api/msg91/index.ts` | App-wide client |
| `store/useSession.ts` | `requestOtp` / `resendOtp` / `verifyOtp` choose MSG91 or legacy; shared `finishSignIn` |
| `app/login.tsx`, `app/otp.tsx` | Double-tap guards, invisible-OTP skip, widget-driven code length, deadline-based resend timer |
| `api/endpoints.ts`, `api/errors.ts`, `api/types.ts` | `msg91Verify`, user messages (English + Hindi), types |
| `.env.example`, `.gitignore` | Config template; `.env*` ignored |
| `api/msg91/*.test.ts`, `vitest.config.mts` | 53 unit tests |

Backend (`KaamConnectBackendAPI`)

| File | Purpose |
| --- | --- |
| `src/modules/auth/msg91/msg91-token-verifier.ts` | Calls MSG91 `verifyAccessToken`; fails closed on any unexpected answer |
| `src/modules/auth/auth.service.ts` / `auth.controller.ts` | `POST /api/v1/auth/msg91/verify`; shared `startSession` with the existing OTP door |
| `src/config/env.validation.ts`, `.env.example` | `MSG91_WIDGET_ENABLED`, `MSG91_AUTHKEY` (required when enabled) |
| specs + `test/msg91-signin.e2e-spec.ts` | Parser, verifier HTTP behaviour, endpoint behaviour |

## Dashboard checklist (you must do these; I cannot see your account)

Mandatory:

1. OTP > your widget: **Mobile Integration = ON** (off by default; every mobile call fails otherwise). The app checks
   this at runtime and reports a configuration error before sending anything.
2. A **token** generated and enabled in the widget's Token section. Its value is `EXPO_PUBLIC_MSG91_TOKEN_AUTH`.
3. The widget id (`EXPO_PUBLIC_MSG91_WIDGET_ID`).
4. Widget is **OTP** (not magic link), contact point includes **mobile**, primary channel **SMS** with an approved
   template. For India, DLT sender-id and template registration are normally required for SMS to be delivered.
5. An account **Authkey** for the backend (`MSG91_AUTHKEY`). If the Authkey has IP security on, add the backend's
   outbound IP.
6. Country restriction (recommended): India only, matching the backend's Indian-number rule.
7. Check the Free Plan's limits and any activation/approval for your account.

Optional: Invisible OTP (mobile only; the app handles both outcomes), WhatsApp/voice retry channels (the app retries on
the widget's default channel), CAPTCHA (leave off for mobile: the SDK does not support it), webhook, demo credentials.

OTP length, resend interval, retry count and expiry are **read from the widget at runtime**, not hardcoded.

## Configuration

Mobile: copy `.env.example` to `.env.local` (git-ignored) and fill in. Use a separate widget per environment and set
the values in each EAS build profile (`eas.json` `env`) for staging/production. **Everything `EXPO_PUBLIC_*` is
compiled into the app and extractable**; it is configuration, not a vault. MSG91 designed the widget token for this use
(it works only for this widget's send/verify calls). The Authkey is a real secret and exists **only** on the backend.

Backend: in `.env` (git-ignored) set `MSG91_WIDGET_ENABLED=true` and `MSG91_AUTHKEY=...`. Startup refuses to boot with
the flag on and no key. In production inject the key from your secret store.

## Commands

```
# mobile, one-time
npm install
npx expo prebuild                    # generates android/ and ios/ (the SDK has native code: Expo Go cannot run it)

# Android (needs JDK 17 + Android SDK)
npx expo run:android
# iOS (needs a Mac with Xcode; CocoaPods runs as part of prebuild / run:ios)
npx expo run:ios
cd ios && pod install                # only if you need to re-run CocoaPods by hand

# checks
npm run typecheck
npm test
npx expo export --platform android   # JS bundle
```

Backend: `npm run build && npm run start:prod` (or `npm run dev:local`, which keeps the development OTP and does **not**
enable the widget).

## Manual test checklist (use your own number or MSG91's demo credentials; never other people's numbers)

1. Valid number, tap Send: one SMS arrives; OTP screen shows the widget's code length and resend timer.
2. Tap Send twice quickly: only one SMS, one navigation.
3. Invalid number (`12345`, `5876543210`): button reports an error, nothing is sent.
4. Correct code: signed in, lands on role selection (new) or home (existing).
5. Wrong code: "wrong or expired" message, boxes cleared, can retry.
6. Wait past the expiry, enter the code: expired message; Resend gets a new one.
7. Resend: disabled until the timer ends; works once; repeated resends eventually show the limit message.
8. Airplane mode on Send, then off and retry; airplane mode on Verify (message, code kept, retry works).
9. Background the app for a minute on the OTP screen: the timer shows the true remaining time; the code still works.
10. Kill the app on the OTP screen and reopen: returned to the number screen (the request lived only in memory).
11. Wrong `EXPO_PUBLIC_MSG91_TOKEN_AUTH`: "not set up correctly" message, no crash.
12. Invisible OTP (if enabled, on mobile data): no OTP screen; signed in directly. On Wi-Fi: normal OTP flow.
13. Backend down after a correct code: "service not reachable"; once it is back, tapping Verify again signs in without
    a second SMS (the access token is held in memory meanwhile; this path is type-checked but has no automated test).
14. Disabled account: "account disabled" message.

## Test results (what was actually run)

| Check | Result |
| --- | --- |
| Backend `tsc --noEmit`, `oxlint`, prettier on changed files | passed |
| Backend unit tests (`npm test`) | 352 passed |
| Backend e2e: new MSG91 spec + existing auth and account-deletion specs (real PostgreSQL test DB) | 71 passed |
| Mobile `tsc --noEmit` | passed |
| Mobile unit tests (`npm test`) | 53 passed |
| Mutation checks (broke the code on purpose, test failed, restored) | backend fail-closed rule; mobile single-use request id |
| `expo export --platform android` | passed; SDK present in the bundle |
| `expo export --platform web` | passed; SDK absent from the bundle |
| Expo autolinking, Android | detects the SDK's native package |
| **Android native build / run on emulator or device** | **not run** (no JDK/Android SDK on this machine) |
| **iOS build, CocoaPods install** | **not run** (needs macOS) |
| **Any real MSG91 call (send, verify, `verifyAccessToken`)** | **not run** (no widget id/token/Authkey available) |
| ESLint, Jest | not applicable: the mobile project has neither (Vitest was added for the pure logic) |

## Known limitations and risks

1. **Unverified against the real service.** SDK response shapes are taken from the SDK 3.1.0 source and README. MSG91
   does not publish the error text or the `verifyAccessToken` response schema. The backend expects
   `{ "type": "success", "message": "<91XXXXXXXXXX>" }` (as reported by the widget docs and other integrators) and
   **fails closed** on anything else, so a different real shape shows up as `OTP_PROVIDER_ERROR` (502), never as a
   wrong login. Confirm the shape with the first real call and against the server-side snippet in your widget's
   dashboard page. Error classification from MSG91's message text is heuristic; unknown text falls back to a generic
   message.
2. **SDK / React Native 0.86 compatibility is unproven.** The SDK is old-style (legacy `NativeModules`, Gradle
   AGP 8.1.0, compileSdk 34) and declares `react-native: "*"`. Its built-in default widget UI (not used here) fails
   type-checking on RN 0.86 (`StyleSheet.absoluteFillObject` no longer exists). The native build is the first thing to
   try on a machine with the Android SDK / Xcode. If it fails, fall back to calling the same three documented HTTP
   endpoints with `fetch` (the adapter in `widgetClient.ts` is the only place that would change).
3. **Access-token replay.** The backend does not record used tokens; a token stolen from a device could be replayed
   until MSG91 expires it. Recommended follow-up: a table of hashed used tokens (needs a migration, which needs your
   approval).
4. **Account deletion still uses the old OTP code** (`DELETE /me`, `POST /auth/deletion-requests`). In production with
   no SMS provider behind the old OTP route, deletion cannot re-verify the number. Needs a decision: accept an MSG91
   access token there too (same pattern as sign-in).
5. **Production boot:** `SMS_PROVIDER=console` is still rejected in production and `msg91` for the old OTP route is not
   implemented, so production does not start until the legacy OTP routes are switched off or implemented. Not changed
   here.
6. No Truecaller, WhatsApp or voice retry channel (default channel only); no web support (MSG91 limitation).
7. The SDK logs failures with `console.error` (it does not log the OTP or numbers in the code I read); do not enable
   verbose network logging in release builds.
