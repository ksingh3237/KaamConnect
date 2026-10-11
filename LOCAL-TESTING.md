# Running KaamConnect locally (frontend + backend)

Everything below is for **local development only**. Nothing here is a production setup.

## 1. Backend (KaamConnectBackendAPI)

```
npm install
# local PostgreSQL database "KaamConnect" must exist, DATABASE_URL in .env, then:
npm run db:migrate          # applies the migrations (6 as of 2026-10-12)
npm run db:seed             # reference data only: cities, areas, service categories
npm run build
npm run dev:local           # API on http://localhost:3000, refuses production and non-local databases
npm run mock:sos            # in a second terminal: stand-in safety desk on http://localhost:4010/sos
```

`dev:local` turns on the **development OTP**: no SMS is sent and **the code is `123456` for every number**. The API
says so in every OTP response and the app shows a yellow "DEVELOPMENT" banner. The setting is refused by the
configuration check in production, so it cannot reach a real deployment.

Limits that still apply locally (they are real protections): 20 OTP requests per hour per IP, and a 30 s wait between
codes for one number. If you hit the hourly limit while testing, restart `dev:local` (the counters are in memory).

## 2. Frontend (this folder)

```
npm install
set EXPO_PUBLIC_API_URL=http://localhost:3000     (Android emulator: http://10.0.2.2:3000, a phone: your PC's LAN address)
npx expo start --web --port 8081                  (the API allows the origin http://localhost:8081)
```

If Metro serves an old screen after you edit files (its file watcher can miss changes on this machine), stop it and
start it again with `--clear`.

## 3. Try it as two people (two browser windows or profiles)

1. Window A: Get Started → language → number `9000000001` → **Fill test code 123456** → "I Provide a Service" → fill the
   worker profile, add two Aadhaar photos (any PNG/JPEG), tick the agreement. In the local profile the worker is verified
   at once (`WORKER_VERIFICATION_MODE=auto`); in production an admin decides.
2. Window B: number `9000000002` → "I Need a Service" → name, sector, address.
3. B: **Post** a job (photo optional). A: Leads → **Send Quote**. B: **Accept**.
4. B: tracking shows the **arrival code** and the red **SOS** button (the alert appears in the mock-desk terminal).
5. A: Leads → active job → enter the code → add a bill line → **Save bill**. B: **Approve cost**. A: **Work finished**.
   B: **Paid** → rate. A: Activity shows today's earnings.
6. B: Profile → **Delete my account** → Send code → 123456. (Refused while a job is open or an SOS is still open.)

Photos use the **local file store** (`.local-storage/` in the backend, signed URLs under `/dev-storage`). The three
temporary placeholder images in `assets/images/` stand in until real artwork exists.

## 4. Automated checks

Frontend: `npx tsc --noEmit`, `npx expo export --platform web`. Backend: `npm run lint`, `npm run typecheck`,
`npm run build`, `npm test`, `npm run test:e2e`, `npm run test:cov`.
