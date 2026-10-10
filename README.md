# KaamConnect • Hyperlocal Tricity Marketplace UI

High-fidelity implementation of the **KaamConnect Hyperlocal Marketplace UI** (Chandigarh, Mohali & Panchkula) from Stitch Project `projects/17693208887504642085`.

---

## 🌟 Key Highlights & Features

1. **Exact Stitch Design System & Aesthetic**:
   - **Tricity Emerald (`#00B074`, `#006C46`)**: Core brand color representing direct prosperity and zero fee deduction.
   - **Amber Flare (`#F59E0B`, `#92400E`)**: Urgent job badges, ratings, and alerts.
   - **Verified Azur (`#0284C7`)**: Institutional trust, Aadhaar verification seal, and GPS routes.
   - **Cool Architectural Canvas (`#F8FAFC`)**: Clean background surface preventing sunlight glare.
   - **Modern Typography**: Google Fonts **Plus Jakarta Sans** (headlines & CTAs) and **Inter** (body & tabular data).

2. **Full Responsive Device Studio Simulator**:
   - ** iPhone 15 Pro (iOS)**: Dynamic Island simulation, native iOS status bar (time, 5G, battery), and iOS home indicator.
   - **🤖 Google Pixel 8 (Android)**: Android camera punch-hole, Android status bar, and Android navigation pill.
   - **📱 iPad Mini (Tablet)**: Tablet viewport layout.
   - **🖥️ Fluid Web**: Fullscreen responsive view for all screen widths.

3. **Both Customer and Worker Apps Integrated**:
   - Seamless 1-tap mode switching between **Customer Mode (ग्राहक)** and **Worker Mode (कारीगर)**.
   - Separate onboarding workflows, dedicated dashboards, customer job posting vs worker leads radar, bidding and quote sending, and transparent settlement.

4. **Trilingual Vernacular System**:
   - Full support for **English (EN)**, **हिन्दी (Hindi)**, and **ਪੰਜਾਬੀ (Punjabi)** with real-time UI localization.
   - Interactive audio assistance simulation (using Web Speech API) for voice guidance.

---

## 📱 Complete Directory of All 18 Screens

| Screen # | Key | Screen Name | Role | Core Functionality |
|---|---|---|---|---|
| **1** | `splash` | **Splash & Welcome** | Shared | Handshake brand logo, Tricity live status, category pills, rating badge, 0% platform fee bullets, "Get Started" CTA |
| **2** | `language` | **Language Selection** | Shared | Audio instruction speaker button, 3 language cards (English, हिंदी, ਪੰਜਾਬੀ), verification footnote |
| **3** | `login` | **Mobile Login** | Shared | Country code `+91`, phone number input, "Why Mobile Login?" security benefits checklist, OTP request |
| **4** | `otp` | **OTP Verification** | Shared | 6-box auto-focus code inputs, audio code assistance, resend timer, WhatsApp OTP fallback |
| **5** | `role` | **Role Selection** | Shared | Dual archetype selection: "I Need a Service (Customer)" vs "I Provide a Service (Worker)", benefit checklists |
| **6A** | `customer_onboarding` | **Customer Profile Onboarding** | Customer | Profile photo upload, name, phone, GPS auto-detect, Tricity sector pills (Sec 17/22/35, Ph 7, etc.), privacy shield |
| **6B** | `worker_onboarding` | **Worker Profile Setup** | Worker | Primary trade selection (Electrician, Plumber, AC, Carpenter), visit fee slider, Aadhaar upload slot, travel radius |
| **7** | `home` | **Home Dashboard** | Customer | Tricity sector dropdown, 15-min SOS emergency banner, search bar, 8 service category tiles, nearby verified pros |
| **8** | `leads_discovery` | **Services & Leads Discovery** | Shared | Customer category directory OR Worker Live Leads Radar (incoming repair jobs with distance and estimated payout) |
| **9** | `post_job` | **Post Job & Details** | Customer | Job title, service type, interactive Voice Note Recording with live waveform, photo attachments, broadcast CTA |
| **10** | `lead_offer` | **Lead Details & Send Offer** | Worker | Worker inspects customer problem, listens to voice memo, inspects photos, sets custom quote fee and arrival ETA |
| **11** | `compare_offers` | **Compare Offers & Profiles** | Customer | Real-time incoming bids from verified artisans with ratings, distance, ETA, and direct phone dial / accept button |
| **12** | `active_tracking` | **Active Job & Live GPS Tracking** | Shared | Animated map showing technician route moving in Chandigarh Sector 22, live ETA countdown, arrival code 8421 |
| **13** | `job_progress` | **Job Progress & Completion** | Shared | 3-stage live work stepper, before/after work photos, itemized bill breakdown, instant UPI QR code & Cash options |
| **14** | `rating_review` | **Rating & Review** | Customer | 5-star interactive rating, feedback chips (Punctual, Fair Price, Clean Work), direct worker tipping |
| **15** | `my_jobs` | **My Jobs & Activity** | Shared | Ongoing, completed, and cancelled bookings; receipt download, worker daily earnings counter (₹1,450 earned) |
| **16** | `profile_wallet` | **Profile, Settings & Wallet** | Shared | User profile, Aadhaar badge, cumulative zero-commission savings counter (Saved ₹4,200), address book, helpline |
| **1B** | `carousel` | **Welcome Highlights Carousel** | Shared | 3 interactive feature slides explaining Zero Commission, Verified Pros, and Direct UPI/Cash Payments |

---

## 🚀 Running Locally

To run the dev server:
```bash
npm run dev
```

Visit the app in your browser:
```
http://localhost:3000/
```

To create a production build:
```bash
npm run build
```
