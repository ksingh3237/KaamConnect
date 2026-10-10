// KaamConnect Screen Renderers
// Renders all 18 Screens with exact Stitch tokens and vernacular support

import { ICONS } from './icons.js';
import {
  SERVICE_CATEGORIES,
  VERIFIED_WORKERS,
  WORKER_ACTIVE_LEADS,
  TRICITY_LOCATIONS,
  TRANSLATIONS
} from './data.js';

export function getT(state) {
  return TRANSLATIONS[state.language] || TRANSLATIONS.en;
}

// -----------------------------------------------------------------------------
// Screen 1: Splash & Welcome (082afb)
// -----------------------------------------------------------------------------
export function renderSplash(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 20px 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <!-- Top Status Pill & Vernacular Switch -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div class="kc-pill kc-pill-emerald" style="font-size: 11px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
            Tricity Live • चंडीगढ़ • मोहाली • पंचकूला
          </div>
          <div class="vernacular-mini-selector">
            <button class="vernacular-mini-btn ${state.language === 'en' ? 'active' : ''}" onclick="window.setLanguage('en')">EN</button>
            <button class="vernacular-mini-btn ${state.language === 'hi' ? 'active' : ''}" onclick="window.setLanguage('hi')">हिन्दी</button>
            <button class="vernacular-mini-btn ${state.language === 'pa' ? 'active' : ''}" onclick="window.setLanguage('pa')">ਪੰਜਾਬੀ</button>
          </div>
        </div>

        <!-- Brand Handshake Icon & Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 72px; height: 72px; margin: 0 auto 14px; position: relative;" class="pulse-anim">
            ${ICONS.logo}
            <div style="position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px;">
              ${ICONS.verifiedBadge}
            </div>
          </div>
          <h1 style="font-family: var(--font-headline); font-size: 28px; font-weight: 800; color: var(--text-main); line-height: 1.1; margin-bottom: 6px;">
            Kaam<span style="color: var(--primary);">Connect</span>
          </h1>
          <p style="font-size: 12px; font-weight: 600; color: var(--text-muted); line-height: 1.4; padding: 0 10px;">
            ${t.tagline}
          </p>
          <div style="margin-top: 10px;">
            <span class="kc-pill kc-pill-emerald" style="font-size: 12px; padding: 6px 14px;">
              💵 0% Commission • सीधा भुगतान (Zero Middleman)
            </span>
          </div>
        </div>

        <!-- Verified Pros Spotlight Card -->
        <div class="kc-card" style="padding: 14px; border: 1.5px solid #A7F3D0; background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #065F46; font-family: var(--font-headline);">
              ${ICONS.shieldCheck} Tricity Verified Pros
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 10px;">🔒 100% Direct P2P</span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center;">
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 4px;">
              <div style="color: #F59E0B; margin-bottom: 4px; display: flex; justify-content: center;">${ICONS.zap}</div>
              <div style="font-size: 11px; font-weight: 700; font-family: var(--font-headline);">Electrician</div>
              <div style="font-size: 9px; color: #64748B;">Sec 22, Chd</div>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 4px;">
              <div style="color: #0284C7; margin-bottom: 4px; display: flex; justify-content: center;">${ICONS.droplet}</div>
              <div style="font-size: 11px; font-weight: 700; font-family: var(--font-headline);">Plumber</div>
              <div style="font-size: 9px; color: #64748B;">Ph 7, Mohali</div>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 4px;">
              <div style="color: #00B074; margin-bottom: 4px; display: flex; justify-content: center;">${ICONS.wind}</div>
              <div style="font-size: 11px; font-weight: 700; font-family: var(--font-headline);">AC Repair</div>
              <div style="font-size: 9px; color: #64748B;">Sec 11, PKL</div>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 4px;">
              <div style="color: #0D9488; margin-bottom: 4px; display: flex; justify-content: center;">${ICONS.truck}</div>
              <div style="font-size: 11px; font-weight: 700; font-family: var(--font-headline);">Car Wash</div>
              <div style="font-size: 9px; color: #64748B;">Sec 35, Chd</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 11px; color: #475569; padding-top: 8px; border-top: 1px dashed #CBD5E1;">
            <div>⭐ <b>4.9 / 5</b> • 14,200+ Reviews</div>
            <div>⏱️ <b>15 Min Arrival</b></div>
          </div>
        </div>

        <!-- 3 Feature Bullets -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
          <div class="kc-card" style="padding: 12px; margin-bottom: 0; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #E6F7F0; color: #00B074; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${ICONS.zap}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; font-weight: 700; font-family: var(--font-headline); display: flex; justify-content: space-between;">
                <span>0% Platform Fee • No Commission</span>
                <span class="kc-pill kc-pill-emerald" style="font-size: 9px; padding: 2px 6px;">FREE</span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                पूरा पैसा कारीगर का — no hidden cut for app or middleman.
              </div>
            </div>
          </div>

          <div class="kc-card" style="padding: 12px; margin-bottom: 0; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${ICONS.volume2}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; font-weight: 700; font-family: var(--font-headline); display: flex; justify-content: space-between;">
                <span>Direct Cash / UPI Settlement</span>
                <span class="kc-pill kc-pill-sky" style="font-size: 9px; padding: 2px 6px;">DIRECT</span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                Pay worker directly on completion via GPay, PhonePe or Cash.
              </div>
            </div>
          </div>

          <div class="kc-card" style="padding: 12px; margin-bottom: 0; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #EDE9FE; color: #8B5CF6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${ICONS.shieldCheck}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 12px; font-weight: 700; font-family: var(--font-headline); display: flex; justify-content: space-between;">
                <span>Verified Tricity Pros</span>
                <span class="kc-pill kc-pill-amber" style="font-size: 9px; padding: 2px 6px;">AADHAAR</span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                चंडीगढ़, मोहाली, पंचकूला local background-verified workers.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button class="btn-primary" onclick="window.navigate('language')" style="margin-bottom: 10px;">
          ${ICONS.zap} ${t.getStarted} ${ICONS.arrowRight}
        </button>
        <div style="text-align: center; font-size: 11px; color: #64748B;">
          👥 Empowering 5,000+ Tricity Technicians & Households
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 2: Language Selection (982aa6)
// -----------------------------------------------------------------------------
export function renderLanguage(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <!-- Top bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #00B074; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
              ${ICONS.handshake}
            </div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; line-height: 1;">
                Kaam<span style="color: var(--primary);">Connect</span>
              </div>
              <div style="font-size: 9px; color: #64748B; letter-spacing: 0.05em; font-weight: 700;">DIRECT MARKETPLACE</div>
            </div>
          </div>
          <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">
            Chandigarh • Mohali • Panchkula
          </div>
        </div>

        <!-- Speaker Assistance Banner with Audio Trigger -->
        <div class="kc-banner-trust" style="cursor: pointer; background: #E6F7F0; border-color: #A7F3D0;" onclick="window.playAudioHelp()">
          <div class="kc-banner-icon" style="background: #00B074; color: white;">
            ${ICONS.volume2}
          </div>
          <div class="kc-banner-text">
            <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px; color: #065F46;">
              Tap speaker to hear instructions 🔊
            </div>
            <div style="font-size: 11px; color: #047857;">
              बोलकर सुनने के लिए टैप करें • ਸੁਣਨ ਲਈ ਦਬਾਓ
            </div>
          </div>
          <div style="color: #00B074;">${ICONS.chevronRight}</div>
        </div>

        <div style="margin: 20px 0 16px;">
          <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
            ${t.chooseLanguage}
          </h2>
          <div style="font-size: 14px; font-weight: 700; color: var(--primary); font-family: var(--font-headline); margin-bottom: 6px;">
            अपनी भाषा चुनें • ਆਪਣੀ ਬੋਲੀ ਚੁਣੋ
          </div>
          <div style="font-size: 11px; color: #64748B; display: flex; align-items: center; gap: 4px;">
            ℹ️ You can change this anytime from Settings (सेटिंग्स से कभी भी बदल सकते हैं)
          </div>
        </div>

        <!-- Language Choice Cards -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          <!-- English -->
          <div class="kc-card" style="padding: 16px; margin-bottom: 0; cursor: pointer; border: ${state.language === 'en' ? '2px solid #00B074' : '1px solid #E2E8F0'}; background: ${state.language === 'en' ? '#F0FDF4' : '#FFFFFF'}; display: flex; align-items: center; justify-content: space-between;" onclick="window.setLanguage('en')">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-family: var(--font-headline); font-weight: 800; font-size: 16px; color: #1E293B;">
                EN
              </div>
              <div>
                <div style="font-family: var(--font-headline); font-size: 15px; font-weight: 800; color: #1E293B;">
                  English <span class="kc-pill" style="font-size: 10px; background: #F1F5F9; color: #64748B; margin-left: 6px;">Default</span>
                </div>
                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
                  Default interface • "Post jobs and get direct calls"
                </div>
              </div>
            </div>
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.language === 'en' ? '#00B074' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; background: ${state.language === 'en' ? '#00B074' : 'transparent'}; color: white;">
              ${state.language === 'en' ? ICONS.check : ''}
            </div>
          </div>

          <!-- Hindi -->
          <div class="kc-card" style="padding: 16px; margin-bottom: 0; cursor: pointer; border: ${state.language === 'hi' ? '2px solid #00B074' : '1px solid #E2E8F0'}; background: ${state.language === 'hi' ? '#F0FDF4' : '#FFFFFF'}; display: flex; align-items: center; justify-content: space-between;" onclick="window.setLanguage('hi')">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; font-family: var(--font-headline); font-weight: 800; font-size: 20px;">
                अ
              </div>
              <div>
                <div style="font-family: var(--font-headline); font-size: 15px; font-weight: 800; color: #1E293B;">
                  हिंदी (Hindi) <span class="kc-pill kc-pill-emerald" style="font-size: 10px; margin-left: 6px;">चयनित</span>
                </div>
                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
                  आसान हिंदी माध्यम • "काम पोस्ट करें और सीधे कारीगर से बात करें"
                </div>
              </div>
            </div>
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.language === 'hi' ? '#00B074' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; background: ${state.language === 'hi' ? '#00B074' : 'transparent'}; color: white;">
              ${state.language === 'hi' ? ICONS.check : ''}
            </div>
          </div>

          <!-- Punjabi -->
          <div class="kc-card" style="padding: 16px; margin-bottom: 0; cursor: pointer; border: ${state.language === 'pa' ? '2px solid #00B074' : '1px solid #E2E8F0'}; background: ${state.language === 'pa' ? '#F0FDF4' : '#FFFFFF'}; display: flex; align-items: center; justify-content: space-between;" onclick="window.setLanguage('pa')">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: #FEF3C7; color: #92400E; display: flex; align-items: center; justify-content: center; font-family: var(--font-headline); font-weight: 800; font-size: 20px;">
                ੳ
              </div>
              <div>
                <div style="font-family: var(--font-headline); font-size: 15px; font-weight: 800; color: #1E293B;">
                  ਪੰਜਾਬੀ (Punjabi) <span class="kc-pill kc-pill-amber" style="font-size: 10px; margin-left: 6px;">ਮੋਹਰੀ</span>
                </div>
                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
                  ਸੌਖੀ ਪੰਜਾਬੀ • "ਕੰਮ ਪੋਸਟ ਕਰੋ ਅਤੇ ਸਿੱਧਾ ਕਾਰੀਗਰ ਨਾਲ ਗੱਲ ਕਰੋ"
                </div>
              </div>
            </div>
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.language === 'pa' ? '#00B074' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; background: ${state.language === 'pa' ? '#00B074' : 'transparent'}; color: white;">
              ${state.language === 'pa' ? ICONS.check : ''}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style="text-align: center; margin-bottom: 12px; font-size: 11px; color: #64748B;">
          🛡️ 100% Free Direct Connect • ਕੋਈ ਕਮਿਸ਼ਨ ਨਹੀਂ • शून्य कमीशन
        </div>
        <button class="btn-primary" onclick="window.navigate('login')">
          Continue in Selected Language • आगे बढ़ें ${ICONS.arrowRight}
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 3: Mobile Login (a3473c)
// -----------------------------------------------------------------------------
export function renderLogin(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <!-- Top App Bar with Back Button -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <button class="back-btn-circle" onclick="window.navigate('language')">
            ${ICONS.arrowLeft}
          </button>
          <div style="text-align: center;">
            <div style="font-family: var(--font-headline); font-size: 14px; font-weight: 800; color: var(--primary);">
              KAAMCONNECT
            </div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600;">Chandigarh Tricity</div>
          </div>
          <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">
            ✓ 0% Commission
          </div>
        </div>

        <!-- Direct Connect Banner -->
        <div class="kc-banner-trust" style="margin-bottom: 20px;">
          <div style="font-size: 20px;">🇮🇳</div>
          <div class="kc-banner-text">
            <div style="font-size: 12px; font-weight: 700; color: #065F46;">
              Direct Local Connect • Verified Workers
            </div>
            <div style="font-size: 11px; color: #047857;">Active across CHD, Mohali, Panchkula</div>
          </div>
          <span class="kc-pill kc-pill-dark" style="font-size: 9px;">Active CHD</span>
        </div>

        <!-- Fast OTP Badge & Heading -->
        <div style="margin-bottom: 20px;">
          <span class="kc-pill kc-pill-sky" style="font-size: 11px; margin-bottom: 8px;">
            📱 FAST OTP LOGIN
          </span>
          <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: var(--text-main); margin-top: 6px;">
            Enter Mobile Number <span style="color: var(--primary);">/ मोबाइल नंबर</span>
          </h2>
          <p style="font-size: 12px; color: #64748B; margin-top: 4px; line-height: 1.4;">
            ${t.mobileSub}
          </p>
        </div>

        <!-- Phone Input Box Card -->
        <div class="kc-card" style="padding: 16px; margin-bottom: 16px;">
          <div class="form-label">
            <span>PHONE NUMBER / फ़ोन नंबर</span>
            <span class="form-label-hint" style="color: var(--primary);">10-Digit Indian Mobile</span>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; font-size: 14px; font-weight: 700;">
              <span>🇮🇳</span>
              <span>+91</span>
              <span style="font-size: 10px; color: #64748B;">▾</span>
            </div>
            <input type="tel" id="mobileNumberInput" class="form-input" placeholder="98765 43210" value="${state.mobileNumber || '9876543210'}" maxlength="10" style="font-size: 16px; font-weight: 700; letter-spacing: 0.05em;" />
          </div>

          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #047857; margin-top: 10px;">
            🔒 Encrypted & Safe • No password needed
          </div>
        </div>

        <!-- Informative Security Checklist -->
        <div class="kc-card" style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <div style="font-size: 12px; font-weight: 800; font-family: var(--font-headline); color: #1E293B;">
              🛡️ WHY MOBILE LOGIN? / क्यों जरूरी है?
            </div>
            <span class="kc-pill kc-pill-sky" style="font-size: 9px;">Trusted</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: #475569; line-height: 1.4;">
            <div style="display: flex; gap: 8px;">
              <span style="color: #00B074;">📞</span>
              <div><b>Direct Calling:</b> Talk directly to skilled mistris & workers without call masking or middleman blocks.</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <span style="color: #0284C7;">🛡️</span>
              <div><b>Instant OTP Booking:</b> Safe 1-tap verification protects both consumer and worker during home visits.</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <span style="color: #10B981;">💵</span>
              <div><b>0% Middleman Charges:</b> Pay worker directly via cash or UPI. KaamConnect charges ₹0 fee.</div>
            </div>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #CBD5E1; display: flex; justify-content: space-between; font-size: 10px; color: #64748B;">
            <span>📍 Coverage: CHD • Mohali • Panchkula</span>
            <span style="font-weight: 700; color: var(--tertiary);">Tricity Wide</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn-primary" onclick="window.submitMobile()">
          Get OTP / ओटीपी प्राप्त करें ${ICONS.arrowRight}
        </button>
        <div style="text-align: center; font-size: 10px; color: #94A3B8; margin-top: 8px; line-height: 1.3;">
          By proceeding, you agree to KaamConnect's <a href="#" style="color: var(--primary);">Terms of Service</a> & Direct Payment Charter. No hidden commission, ever.
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 4: OTP Verification (d232f9)
// -----------------------------------------------------------------------------
export function renderOtp(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <!-- Top bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <button class="back-btn-circle" onclick="window.navigate('login')">
            ${ICONS.arrowLeft}
          </button>
          <div class="kc-pill kc-pill-sky" style="font-size: 11px;">
            ${ICONS.mapPin} Tricity Chandigarh • Mohali • Panchkula
          </div>
          <div class="vernacular-mini-selector">
            <button class="vernacular-mini-btn active">EN</button>
            <button class="vernacular-mini-btn">हिं</button>
            <button class="vernacular-mini-btn">ਪੰ</button>
          </div>
        </div>

        <!-- Network Banner -->
        <div class="kc-card" style="background: #F0FDF4; border-color: #BBF7D0; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${ICONS.shieldCheck}
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #065F46; font-family: var(--font-headline);">
              • DIRECT WORKER NETWORK
            </div>
            <div style="font-size: 11px; color: #047857;">
              Instant Verification • 0% Commission Platform
            </div>
          </div>
        </div>

        <!-- Heading -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: var(--text-main);">
            Verify Phone Number <span style="color: var(--primary);">/ ओटीपी सत्यापन</span>
          </h2>
          <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
            Enter 6-digit code sent to <b>+91 ${state.mobileNumber || '98765 43210'}</b>
          </div>
          <button style="background: none; border: none; color: var(--primary); font-size: 12px; font-weight: 700; cursor: pointer; padding: 0; margin-top: 4px;" onclick="window.navigate('login')">
            ✏️ Edit Number (बदलें)
          </button>
        </div>

        <!-- 6 OTP Boxes -->
        <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 16px;">
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0;" value="4" maxlength="1" />
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0;" value="9" maxlength="1" />
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0;" value="2" maxlength="1" />
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0;" value="1" maxlength="1" />
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0; border-color: var(--primary); background: #F0FDF4;" value="•" maxlength="1" />
          <input type="text" class="form-input" style="width: 44px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; padding: 0;" placeholder=" " maxlength="1" />
        </div>

        <!-- Audio Code Assistance -->
        <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 16px;" onclick="window.playOtpAudio()">
          <div style="color: #0284C7;">${ICONS.volume2}</div>
          <div style="font-size: 12px; font-weight: 700; color: #1E40AF; flex: 1;">
            Audio code help available / आवाज द्वारा ओटीपी सुनें 🔊
          </div>
        </div>

        <!-- Resend and WhatsApp Options -->
        <div class="kc-card" style="padding: 14px; background: #F8FAFC; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
            <span style="color: #64748B;">⏱️ Didn't receive SMS?</span>
            <span class="kc-pill kc-pill-sky" style="font-size: 11px;">Resend OTP in 0:26s</span>
          </div>

          <button style="width: 100%; padding: 10px; background: #FFFFFF; border: 1.5px solid #86EFAC; border-radius: 12px; font-size: 13px; font-weight: 700; color: #166534; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            💬 Get OTP on WhatsApp / व्हाट्सएप पर पाएं
          </button>
        </div>
      </div>

      <div>
        <button class="btn-primary" onclick="window.navigate('role')">
          ${ICONS.checkCircle} Verify & Continue / सत्यापित करें
        </button>
        <div style="text-align: center; font-size: 11px; color: #94A3B8; margin-top: 8px;">
          🔒 Automatic SIM reading supported • Safe Tricity Login
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 5: Role Selection (6cbd7c)
// -----------------------------------------------------------------------------
export function renderRole(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <!-- Top bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #00B074; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
              ${ICONS.handshake}
            </div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; line-height: 1;">
                Kaam<span style="color: var(--primary);">Connect</span>
              </div>
              <div style="font-size: 9px; color: #64748B; font-weight: 600;">Tricity • CHD • Mohali • PKL</div>
            </div>
          </div>
          <div class="vernacular-mini-selector">
            <button class="vernacular-mini-btn active">ENG</button>
            <button class="vernacular-mini-btn">हिंदी</button>
            <button class="vernacular-mini-btn">ਪੰਜਾਬੀ</button>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <span class="kc-pill kc-pill-sky" style="font-size: 10px; margin-bottom: 6px;">
            🧰 STEP 1 OF 2 • भूमिका चयन
          </span>
          <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: var(--text-main); margin-top: 4px;">
            How will you use KaamConnect?
          </h2>
          <div style="font-size: 14px; font-weight: 700; color: var(--primary); margin-top: 2px;">
            आप ऐप का उपयोग कैसे करेंगे?
          </div>
          <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
            ${t.roleSub}
          </div>
        </div>

        <!-- Role Option 1: Customer -->
        <div class="kc-card" style="padding: 18px; margin-bottom: 14px; cursor: pointer; border: ${state.role === 'customer' ? '2.5px solid #00B074' : '1px solid #E2E8F0'}; background: ${state.role === 'customer' ? '#F0FDF4' : '#FFFFFF'};" onclick="window.selectRole('customer')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                👤
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #0284C7; text-transform: uppercase;">
                  CUSTOMER / ग्राहक
                </div>
                <div style="font-family: var(--font-headline); font-size: 18px; font-weight: 800; color: #1E293B;">
                  I Need a Service
                </div>
                <div style="font-size: 12px; color: #64748B; font-weight: 600;">मुझे काम करवाना है</div>
              </div>
            </div>
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.role === 'customer' ? '#00B074' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; background: ${state.role === 'customer' ? '#00B074' : 'transparent'}; color: white;">
              ${state.role === 'customer' ? ICONS.check : ''}
            </div>
          </div>

          <div style="background: #F8FAFC; border-radius: 10px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; font-weight: 600; color: #0369A1;">
            ⚡ Find Electrician, Plumber, Cleaner & more
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #475569;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> Post free jobs & get fast Tricity responses
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> Receive competitive worker bids with verified ratings
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> 0% commission • Pay worker directly via Cash / UPI
            </div>
          </div>
        </div>

        <!-- Role Option 2: Worker (Recommended) -->
        <div class="kc-card" style="padding: 18px; margin-bottom: 16px; cursor: pointer; position: relative; border: ${state.role === 'worker' ? '2.5px solid #00B074' : '1px solid #E2E8F0'}; background: ${state.role === 'worker' ? '#F0FDF4' : '#FFFFFF'};" onclick="window.selectRole('worker')">
          <div style="position: absolute; top: -10px; right: 16px;">
            <span class="kc-pill kc-pill-emerald" style="font-size: 10px; background: #00B074; color: white;">✓ RECOMMENDED</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                🛠️
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #008E5D; text-transform: uppercase;">
                  WORKER / SKILLED PROFESSIONAL (कारीगर)
                </div>
                <div style="font-family: var(--font-headline); font-size: 18px; font-weight: 800; color: #1E293B;">
                  I Provide a Service
                </div>
                <div style="font-size: 12px; color: #64748B; font-weight: 600;">मैं कारीगर / काम करता हूँ</div>
              </div>
            </div>
            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.role === 'worker' ? '#00B074' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; background: ${state.role === 'worker' ? '#00B074' : 'transparent'}; color: white;">
              ${state.role === 'worker' ? ICONS.check : ''}
            </div>
          </div>

          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: #065F46;">
            💵 0% Commission • 100% सीधा मुनाफा
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #475569;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> Get direct local customer leads in Chandigarh Tricity
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> Keep 100% of your earnings • Set your own price
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #00B074;">✓</span> Direct customer calling with no middleman cuts
            </div>
          </div>
        </div>
      </div>

      <div>
        <button class="btn-primary" onclick="window.confirmRole()">
          Continue as ${state.role === 'worker' ? 'Worker • आगे बढ़ें' : 'Customer • आगे बढ़ें'} ${ICONS.arrowRight}
        </button>
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 10px; font-size: 11px; color: #64748B;">
          <span>🔄 Toggle freely anytime</span>
          <span>•</span>
          <span>🛡️ Aadhaar-verified community</span>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 6: Customer Profile Onboarding (61189f)
// -----------------------------------------------------------------------------
export function renderCustomerOnboarding(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px;">
      <!-- Top Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <button class="back-btn-circle" onclick="window.navigate('role')">
          ${ICONS.arrowLeft}
        </button>
        <div style="text-align: center;">
          <div style="font-family: var(--font-headline); font-size: 14px; font-weight: 800;">
            Customer Profile Setup
          </div>
          <div style="font-size: 10px; color: #64748B;">STEP 2 OF 2 • ग्राहक सेटअप</div>
        </div>
        <div class="vernacular-mini-selector">
          <button class="vernacular-mini-btn active">EN</button>
          <button class="vernacular-mini-btn">हिं</button>
        </div>
      </div>

      <!-- Customer Mode pill with toggle -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #00B074; color: white; display: flex; align-items: center; justify-content: center;">
            👤
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 800; font-family: var(--font-headline);">
              Customer Mode <span class="kc-pill kc-pill-sky" style="font-size: 9px;">NEW</span>
            </div>
            <div style="font-size: 10px; color: #64748B;">Looking for trusted local handyman</div>
          </div>
        </div>
        <button class="kc-pill kc-pill-emerald" style="cursor: pointer;" onclick="window.navigate('worker_onboarding')">
          Switch 🔄
        </button>
      </div>

      <!-- Trust banner -->
      <div class="kc-banner-trust" style="background: #00B074; color: white; border: none; margin-bottom: 16px;">
        <div style="font-size: 20px;">🛡️</div>
        <div>
          <div style="font-size: 12px; font-weight: 800;">100% Free • No Middleman Fees</div>
          <div style="font-size: 11px; opacity: 0.9;">Direct Cash/UPI to workers • 0% commission forever</div>
        </div>
      </div>

      <!-- Profile Photo Circle -->
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: #E0F2FE; margin: 0 auto 8px; position: relative; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 2px dashed #0284C7;">
          📷
          <div style="position: absolute; bottom: 0; right: 0; width: 26px; height: 26px; border-radius: 50%; background: #00B074; color: white; display: flex; align-items: center; justify-content: center;">
            +
          </div>
        </div>
        <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">Add Profile Photo (फ़ोटो जोड़ें)</div>
        <div style="font-size: 11px; color: #64748B;">Optional — helps verified workers recognize your home safely</div>
      </div>

      <!-- Personal Details Form -->
      <div class="kc-card">
        <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          🪪 Personal Details (व्यक्तिगत विवरण)
        </div>

        <div class="form-group">
          <label class="form-label">
            <span>Full Name / पूरा नाम *</span>
            <span class="form-label-hint">e.g. Sunita Sharma</span>
          </label>
          <input type="text" class="form-input" value="Sunita Sharma" />
        </div>

        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label">
            <span>Mobile Number / फ़ोन नंबर</span>
            <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">Verified OTP ✓</span>
          </label>
          <div style="display: flex; gap: 8px;">
            <input type="text" class="form-input" value="+91 98765 43210" disabled style="background: #F8FAFC;" />
            <span class="kc-pill kc-pill-emerald" style="align-self: center;">Primary</span>
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Unlocks your instant direct call connect system</div>
        </div>
      </div>

      <!-- Primary Address Form -->
      <div class="kc-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            📍 Primary Address (निवास पता)
          </div>
          <span class="kc-pill kc-pill-sky" style="font-size: 9px;">Tricity</span>
        </div>

        <button style="width: 100%; padding: 10px; background: #E0F2FE; border: 1.5px solid #0284C7; border-radius: 12px; font-size: 13px; font-weight: 700; color: #0284C7; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
          🌐 Auto-Detect GPS Location / वर्तमान स्थान
        </button>

        <div class="form-group">
          <label class="form-label">House / Flat / Landmark</label>
          <input type="text" class="form-input" value="House #1402, Near Subhash Park" />
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Select Tricity Hub & Sector (Tap to pinpoint):</div>
          
          <div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 4px;">CHANDIGARH:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            <span class="sector-chip">Sec 35</span>
            <span class="sector-chip active" style="background: #00B074; color: white;">Sec 22 ✓</span>
            <span class="sector-chip">Sec 15</span>
            <span class="sector-chip">Sec 43</span>
          </div>

          <div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 4px;">MOHALI (SAS NAGAR):</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            <span class="sector-chip">Phase 7</span>
            <span class="sector-chip">Phase 3B2</span>
            <span class="sector-chip">Phase 5</span>
            <span class="sector-chip">Sec 70</span>
          </div>

          <div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 4px;">PANCHKULA:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            <span class="sector-chip">Sec 11</span>
            <span class="sector-chip">Sec 20</span>
            <span class="sector-chip">MDC Sec 4</span>
          </div>
        </div>

        <!-- Mini map preview card -->
        <div style="height: 100px; border-radius: 12px; background: #E2E8F0; overflow: hidden; position: relative; border: 1px solid #CBD5E1;">
          <div style="position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80') center/cover opacity 0.5;"></div>
          <div style="position: absolute; inset: 0; background: rgba(0, 176, 116, 0.15);"></div>
          <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: rgba(255, 255, 255, 0.95); padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <span style="color: #00B074;">📍</span> Sector 22-B Market Area, Chandigarh
          </div>
        </div>
      </div>

      <!-- Communication Preferences -->
      <div class="kc-card">
        <div style="font-family: var(--font-headline); font-weight: 800; font-size: 13px; margin-bottom: 8px;">
          🗣️ Communication Preferences
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Preferred Language with Workers (बातचीत की भाषा):</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px;">
          <button style="padding: 8px; border-radius: 10px; border: 2px solid #00B074; background: #00B074; color: white; font-weight: 700; font-size: 11px;">Hindi (हिंदी)</button>
          <button style="padding: 8px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">Punjabi (ਪੰਜਾਬੀ)</button>
          <button style="padding: 8px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">English (अंग्रेज़ी)</button>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #E2E8F0;">
          <div style="font-size: 11px;">
            <div style="font-weight: 700; color: #1E293B;">Direct Call Access</div>
            <div style="color: #64748B;">Allow verified local artisans to call your phone directly</div>
          </div>
          <input type="checkbox" checked style="width: 20px; height: 20px; accent-color: #00B074;" />
        </div>
      </div>

      <!-- Privacy Shield Card -->
      <div class="kc-card" style="background: #F0FDF4; border-color: #A7F3D0; font-size: 11px; color: #065F46; line-height: 1.4;">
        🛡️ <b>Tricity Trust & Privacy Shield:</b> Your exact flat number is <b>never broadcasted</b> publicly. It is shared only after you confirm an artisan's visit.
      </div>

      <button class="btn-primary" onclick="window.navigate('home')">
        Save & Go to Marketplace • प्रोफाइल पूरा करें ${ICONS.arrowRight}
      </button>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 7: Worker Profile Setup (c858bd)
// -----------------------------------------------------------------------------
export function renderWorkerOnboarding(state) {
  const t = getT(state);
  return `
    <div class="screen-container no-nav" style="padding: 16px;">
      <!-- Top Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <button class="back-btn-circle" onclick="window.navigate('role')">
          ${ICONS.arrowLeft}
        </button>
        <div style="text-align: center;">
          <div style="font-family: var(--font-headline); font-size: 14px; font-weight: 800;">
            Worker Profile Setup
          </div>
          <div style="font-size: 10px; color: #64748B;">STEP 2 OF 2 • कारीगर हुनर सेटअप</div>
        </div>
        <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">
          0% Commission
        </div>
      </div>

      <!-- Direct Earnings Promise Banner -->
      <div class="kc-banner-trust" style="background: #065F46; color: white; border: none; margin-bottom: 16px;">
        <div style="font-size: 24px;">🛠️</div>
        <div>
          <div style="font-size: 13px; font-weight: 800;">Keep 100% of What You Charge!</div>
          <div style="font-size: 11px; opacity: 0.9;">No lead fees, no monthly cuts. Direct cash/UPI from Tricity families.</div>
        </div>
      </div>

      <!-- Trade Selection -->
      <div class="kc-card">
        <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 4px;">
          Select Your Primary Trade (आपका मुख्य काम) *
        </div>
        <div style="font-size: 11px; color: #64748B; margin-bottom: 12px;">You can add secondary trades later</div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div style="border: 2px solid #00B074; background: #F0FDF4; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <div style="color: #F59E0B;">${ICONS.zap}</div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 800; font-size: 13px;">Electrician</div>
              <div style="font-size: 10px; color: #00B074; font-weight: 700;">विद्युत कारीगर ✓</div>
            </div>
          </div>

          <div style="border: 1px solid #E2E8F0; background: white; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <div style="color: #0284C7;">${ICONS.droplet}</div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">Plumber</div>
              <div style="font-size: 10px; color: #64748B;">प्लंबर / नलसाज</div>
            </div>
          </div>

          <div style="border: 1px solid #E2E8F0; background: white; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <div style="color: #00B074;">${ICONS.wind}</div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">AC Tech</div>
              <div style="font-size: 10px; color: #64748B;">एसी रिपेयर</div>
            </div>
          </div>

          <div style="border: 1px solid #E2E8F0; background: white; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <div style="color: #B45309;">${ICONS.hammer}</div>
            <div>
              <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">Carpenter</div>
              <div style="font-size: 10px; color: #64748B;">बढ़ई / कारपेंटर</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Experience & Visiting Fee -->
      <div class="kc-card">
        <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 12px;">
          Rate & Experience (अनुभव और फीस)
        </div>

        <div class="form-group">
          <label class="form-label">
            <span>Standard Visiting / Inspection Fee (विज़िट फीस) *</span>
            <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">Recommended: ₹200 - ₹300</span>
          </label>
          <div style="display: flex; gap: 8px;">
            <span style="display: flex; align-items: center; padding: 0 14px; background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; font-weight: 800;">₹</span>
            <input type="number" class="form-input" value="250" style="font-weight: 800; font-size: 16px;" />
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Customer pays this directly at your arrival for inspection.</div>
        </div>

        <div class="form-group" style="margin-bottom: 4px;">
          <label class="form-label">Years of Experience in Tricity</label>
          <select class="form-input" style="font-weight: 700;">
            <option>8+ Years in Chandigarh & Mohali</option>
            <option>5-8 Years</option>
            <option>2-5 Years</option>
            <option>1-2 Years</option>
          </select>
        </div>
      </div>

      <!-- Verification Badge Upload -->
      <div class="kc-card" style="border: 1.5px dashed #0284C7; background: #F0F9FF;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 13px; color: #0369A1; font-family: var(--font-headline);">
            ${ICONS.shieldCheck} Aadhaar & Police Verification Badge
          </div>
          <span class="kc-pill kc-pill-sky" style="font-size: 9px;">GET VERIFIED</span>
        </div>
        <div style="font-size: 11px; color: #0284C7; margin-bottom: 10px; line-height: 1.4;">
          Verified technicians receive <b>4x more direct calls</b> from residential sectors.
        </div>
        <button style="width: 100%; padding: 10px; background: #FFFFFF; border: 1px solid #0284C7; border-radius: 10px; font-size: 12px; font-weight: 700; color: #0284C7; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          📁 Upload Aadhaar Card / ID Proof (सुरक्षित अपलोड)
        </button>
      </div>

      <!-- Operating Sectors & Radius -->
      <div class="kc-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px;">
            Service Radius: <span style="color: var(--primary);">8 km</span>
          </div>
          <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">Active GPS</span>
        </div>
        <input type="range" min="2" max="25" value="8" style="width: 100%; accent-color: #00B074; margin-bottom: 8px;" />
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748B;">
          <span>2 km (Local Sector)</span>
          <span>8 km (Whole City)</span>
          <span>25 km (Entire Tricity)</span>
        </div>
      </div>

      <button class="btn-primary" onclick="window.navigate('leads_discovery')">
        Start Receiving Leads • काम शुरू करें ${ICONS.arrowRight}
      </button>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 8: Home Dashboard (7e78e9)
// -----------------------------------------------------------------------------
export function renderHome(state) {
  const t = getT(state);
  return `
    <div class="screen-container">
      <!-- Fixed Header Bar -->
      <div class="app-header-bar">
        <div class="app-header-left">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${ICONS.handshake}
          </div>
          <div class="header-brand-group">
            <div class="header-brand-name">Kaam<span>Connect</span></div>
            <div class="header-location-pill" onclick="window.navigate('customer_onboarding')">
              ${ICONS.mapPin} Sector 22, Chandigarh ▾
            </div>
          </div>
        </div>
        <div class="header-actions">
          <div class="icon-btn-circle" onclick="window.playAudioHelp()">
            ${ICONS.volume2}
          </div>
          <div class="icon-btn-circle" onclick="window.navigate('my_jobs')">
            ${ICONS.bell}
            <span class="badge-dot"></span>
          </div>
        </div>
      </div>

      <div style="padding: 16px;">
        <!-- Emergency SOS 15-Min Arrival Banner -->
        <div class="kc-banner-trust" style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border-color: #FCD34D; margin-bottom: 16px;">
          <div class="kc-banner-icon" style="background: #F59E0B; color: white;">
            ⚡
          </div>
          <div class="kc-banner-text">
            <div style="font-size: 13px; font-weight: 800; color: #92400E; font-family: var(--font-headline); display: flex; justify-content: space-between;">
              <span>Need Urgent Mistri?</span>
              <span class="kc-pill kc-pill-amber" style="font-size: 9px;">15 MIN ETA</span>
            </div>
            <div style="font-size: 11px; color: #B45309; margin-top: 2px;">
              Emergency breakdown? Direct technician dispatch in Sector 22/35/Mohali.
            </div>
          </div>
        </div>

        <!-- Universal Search Bar -->
        <div class="form-group" style="margin-bottom: 16px;">
          <div class="input-with-icon">
            <div class="input-icon-left">${ICONS.search}</div>
            <input type="text" class="form-input" placeholder="${t.searchPlaceholder}" style="border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); font-size: 13px;" />
            <button style="position: absolute; right: 10px; background: #00B074; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="window.navigate('post_job')">
              ${ICONS.mic}
            </button>
          </div>
        </div>

        <!-- 0% Commission Direct Charter Banner -->
        <div class="kc-banner-trust" style="background: #00B074; color: white; border: none; margin-bottom: 18px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;">
            💵
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 800; font-family: var(--font-headline);">
              0% Platform Fee Guarantee
            </div>
            <div style="font-size: 11px; opacity: 0.95;">
              You pay 100% directly to the technician via UPI/Cash. Zero middleman surcharge.
            </div>
          </div>
        </div>

        <!-- Service Categories Grid -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-family: var(--font-headline); font-size: 15px; font-weight: 800; color: var(--text-main);">
              ${t.popularServices}
            </div>
            <a href="#" style="font-size: 12px; font-weight: 700; color: var(--primary); text-decoration: none;" onclick="window.navigate('leads_discovery'); return false;">
              View All →
            </a>
          </div>

          <div class="category-grid">
            ${SERVICE_CATEGORIES.map(cat => `
              <div class="category-tile" onclick="window.selectCategory('${cat.id}')">
                <div class="category-icon-box" style="background: ${cat.bgColor}; color: ${cat.color};">
                  ${ICONS[cat.icon] || ICONS.zap}
                </div>
                <div class="category-tile-name">${cat.title}</div>
                <div class="category-tile-fee">${cat.baseFee} visit</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Post a Job Quick Prompt -->
        <div class="kc-card" style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1.5px solid #86EFAC; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; color: #065F46;">
              Got a specific repair job?
            </div>
            <div style="font-size: 11px; color: #047857; margin-top: 2px;">
              Post details & receive instant quotes from nearby mistris!
            </div>
          </div>
          <button class="btn-primary" style="width: auto; min-height: 40px; padding: 0 16px; font-size: 12px;" onclick="window.navigate('post_job')">
            + Post Job
          </button>
        </div>

        <!-- Verified Technicians Near You Section -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-family: var(--font-headline); font-size: 15px; font-weight: 800; color: var(--text-main);">
              ${t.verifiedNearYou}
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 10px;">• 24 Online</span>
          </div>

          <!-- Sector quick filter chips -->
          <div class="sector-chips-row">
            <span class="sector-chip active">All Tricity</span>
            <span class="sector-chip">Sector 22</span>
            <span class="sector-chip">Sector 35</span>
            <span class="sector-chip">Mohali Ph 7</span>
            <span class="sector-chip">PKL Sec 11</span>
          </div>

          <!-- Worker Cards List -->
          <div>
            ${VERIFIED_WORKERS.map(w => `
              <div class="worker-card">
                <div class="worker-header">
                  <div class="worker-avatar-wrap">
                    <img src="${w.avatar}" class="worker-avatar" alt="${w.name}" />
                    <span class="worker-status-dot"></span>
                  </div>
                  <div class="worker-info">
                    <div class="worker-name-row">
                      <span class="worker-name">${w.name}</span>
                      ${ICONS.verifiedBadge}
                    </div>
                    <div class="worker-trade">${w.trade}</div>
                    <div class="worker-meta-row">
                      <span class="worker-rating-badge">
                        ${ICONS.star} ${w.rating} (${w.reviewsCount})
                      </span>
                      <span>📍 ${w.distance}</span>
                      <span>⏱️ ${w.etaMinutes}m ETA</span>
                    </div>
                  </div>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                  ${w.skills.slice(0, 3).map(skill => `
                    <span style="font-size: 10px; background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 500;">
                      ${skill}
                    </span>
                  `).join('')}
                </div>

                <div class="worker-footer">
                  <div class="worker-fee-box">
                    <span class="worker-fee-label">Visiting Charge</span>
                    <span class="worker-fee-val">₹${w.visitingFee} <span style="font-size: 11px; font-weight: 500; color: #00B074;">(₹0 App Cut)</span></span>
                  </div>
                  <div class="worker-actions">
                    <button class="btn-call-direct" onclick="window.callWorker('${w.phone}', '${w.name}')">
                      ${ICONS.phone} Call Directly
                    </button>
                    <button style="background: #F1F5F9; border: 1px solid #CBD5E1; color: #1E293B; border-radius: 10px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer;" onclick="window.startBooking('${w.id}')">
                      Book Pro
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 9: Services & Leads Discovery (925480)
// -----------------------------------------------------------------------------
export function renderLeadsDiscovery(state) {
  const isWorker = state.role === 'worker';
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <button class="back-btn-circle" onclick="window.navigate('home')">
            ${ICONS.arrowLeft}
          </button>
          <div class="header-brand-group">
            <div class="header-brand-name">
              ${isWorker ? 'Leads Radar • काम रडार' : 'Browse Services • सेवाएं'}
            </div>
            <div style="font-size: 10px; color: #64748B;">Chandigarh • Mohali • Panchkula</div>
          </div>
        </div>
        <div class="header-actions">
          <div class="icon-btn-circle" onclick="window.toggleRole()">
            ${ICONS.refresh}
          </div>
        </div>
      </div>

      <div style="padding: 16px;">
        ${isWorker ? `
          <!-- Worker Mode: Live Customer Leads Radar -->
          <div class="kc-card" style="background: #065F46; color: white; border: none; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-headline); font-weight: 800; font-size: 15px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; display: inline-block;"></span>
                Live Customer Job Radar
              </div>
              <span class="kc-pill kc-pill-emerald" style="font-size: 10px;">0% DEDUCTION</span>
            </div>
            <div style="font-size: 12px; opacity: 0.9;">
              Real-time repair requests within 5 km of your current location. Tap to quote!
            </div>
          </div>

          <div class="sector-chips-row">
            <span class="sector-chip active">All Leads (3)</span>
            <span class="sector-chip">Immediate (1)</span>
            <span class="sector-chip">Electrician</span>
            <span class="sector-chip">Plumbing</span>
          </div>

          <!-- Lead Cards -->
          <div>
            ${WORKER_ACTIVE_LEADS.map(lead => `
              <div class="kc-card" style="border-left: 4px solid #00B074; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <span class="kc-pill kc-pill-sky" style="font-size: 10px; margin-bottom: 4px;">
                      ${lead.category}
                    </span>
                    <h3 style="font-family: var(--font-headline); font-size: 14px; font-weight: 800; color: var(--text-main); line-height: 1.3;">
                      ${lead.title}
                    </h3>
                  </div>
                  <span class="kc-pill kc-pill-amber" style="font-size: 9px; flex-shrink: 0;">
                    ${lead.postedAgo}
                  </span>
                </div>

                <div style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.4;">
                  "${lead.notes}"
                </div>

                ${lead.hasAudio ? `
                  <div style="background: #E0F2FE; border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer;" onclick="window.playAudioHelp()">
                    <div style="color: #0284C7;">${ICONS.play}</div>
                    <div style="font-size: 11px; font-weight: 700; color: #0369A1; flex: 1;">
                      Customer Voice Note (${lead.audioDuration}) - Tap to listen
                    </div>
                  </div>
                ` : ''}

                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px dashed #E2E8F0; font-size: 11px;">
                  <div>
                    <div style="font-weight: 700; color: #1E293B;">📍 ${lead.sector} (${lead.distance})</div>
                    <div style="color: #00B074; font-weight: 700;">Customer Budget: ${lead.budget}</div>
                  </div>
                  <button class="btn-primary" style="width: auto; min-height: 38px; padding: 0 14px; font-size: 12px;" onclick="window.viewLeadDetails('${lead.id}')">
                    Send Quote →
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <!-- Customer Mode: Category Browser -->
          <div style="margin-bottom: 16px;">
            <div class="form-group">
              <div class="input-with-icon">
                <div class="input-icon-left">${ICONS.search}</div>
                <input type="text" class="form-input" placeholder="Search categories, mistris, or parts..." />
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${SERVICE_CATEGORIES.map(cat => `
              <div class="kc-card" style="display: flex; align-items: center; gap: 14px; cursor: pointer;" onclick="window.selectCategory('${cat.id}')">
                <div style="width: 52px; height: 52px; border-radius: 14px; background: ${cat.bgColor}; color: ${cat.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${ICONS[cat.icon]}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-family: var(--font-headline); font-weight: 800; font-size: 15px; color: #1E293B;">
                      ${cat.title}
                    </div>
                    <div style="font-weight: 700; color: var(--primary); font-size: 12px;">
                      From ${cat.baseFee}
                    </div>
                  </div>
                  <div style="font-size: 11px; color: #00B074; font-weight: 600;">
                    ${cat.hindi} • ${cat.punjabi}
                  </div>
                  <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                    ${cat.examples}
                  </div>
                </div>
                <div style="color: #CBD5E1;">${ICONS.chevronRight}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 10: Post Job & Details (2c2c13)
// -----------------------------------------------------------------------------
export function renderPostJob(state) {
  const t = getT(state);
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <button class="back-btn-circle" onclick="window.navigate('home')">
            ${ICONS.arrowLeft}
          </button>
          <div class="header-brand-group">
            <div class="header-brand-name">${t.postJobTitle}</div>
            <div style="font-size: 10px; color: #64748B;">Broadcast Direct to Tricity Workers</div>
          </div>
        </div>
        <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">FREE POST</div>
      </div>

      <div style="padding: 16px;">
        <div class="kc-banner-trust" style="background: #F0FDF4; border-color: #BBF7D0; margin-bottom: 16px;">
          <div style="font-size: 20px;">📢</div>
          <div class="kc-banner-text">
            <div style="font-size: 12px; font-weight: 700; color: #065F46;">
              ${t.postJobSub}
            </div>
            <div style="font-size: 11px; color: #047857;">Zero commission deducted from technician or customer.</div>
          </div>
        </div>

        <!-- Service Category Selector -->
        <div class="form-group">
          <label class="form-label">Service Type / सेवा का प्रकार *</label>
          <select class="form-input" style="font-weight: 700;">
            <option>Electrician (विद्युत समस्या)</option>
            <option selected>Plumber (पानी / लीकेज समस्या)</option>
            <option>AC & Cooling Service (एसी रिपेयर)</option>
            <option>Carpenter (लकड़ी व फर्नीचर)</option>
            <option>Home Painting & Polish</option>
            <option>Deep Cleaning & Sanitation</option>
          </select>
        </div>

        <!-- Problem Title -->
        <div class="form-group">
          <label class="form-label">Problem Heading / मुख्य समस्या *</label>
          <input type="text" class="form-input" value="Kitchen Sink Under-pipe Burst & Water Flow" placeholder="e.g. Geyser not turning on, Water pipe burst" style="font-weight: 600;" />
        </div>

        <!-- Voice Note Recording Card -->
        <div class="kc-card" style="border: 2px dashed #00B074; background: #F0FDF4; text-align: center; padding: 18px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; color: #065F46; margin-bottom: 4px;">
            🎙️ ${t.recordVoice}
          </div>
          <div style="font-size: 11px; color: #047857; margin-bottom: 14px;">
            ${t.recordSub}
          </div>

          <div style="display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 10px;">
            <button id="voiceRecordBtn" style="width: 56px; height: 56px; border-radius: 50%; background: #00B074; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 176, 116, 0.4);" onclick="window.toggleVoiceRecording()">
              ${ICONS.mic}
            </button>
            <div id="voiceWaveform" style="display: flex; align-items: center; gap: 3px; height: 30px;">
              <span class="audio-bar"></span>
              <span class="audio-bar"></span>
              <span class="audio-bar"></span>
              <span class="audio-bar"></span>
              <span class="audio-bar"></span>
            </div>
            <div id="voiceDuration" style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; color: #065F46;">
              0:14
            </div>
          </div>
          <div style="font-size: 10px; color: #059669; font-weight: 600;">Audio Attached: "Under sink PVC pipe cracked, need emergency fix" ✓</div>
        </div>

        <!-- Problem Description Area -->
        <div class="form-group">
          <label class="form-label">Additional Details / अधिक जानकारी</label>
          <textarea class="form-input" rows="3" style="resize: none;" placeholder="Provide any details like floor number, brand name (e.g. Havells, Jaquar)...">PVC pipe under the kitchen sink cracked suddenly, water is spreading on floor. Need someone with replacement pipe immediately.</textarea>
        </div>

        <!-- Photos Upload Preview -->
        <div class="form-group">
          <label class="form-label">Attach Photos (फ़ोटो जोड़ें)</label>
          <div style="display: flex; gap: 10px;">
            <div style="width: 70px; height: 70px; border-radius: 12px; border: 1.5px dashed #CBD5E1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748B; font-size: 10px; cursor: pointer; background: #FFFFFF;">
              ${ICONS.camera}
              <span>Add</span>
            </div>
            <div style="width: 70px; height: 70px; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid #E2E8F0;">
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80" style="width: 100%; height: 100%; object-fit: cover;" />
              <span style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">✕</span>
            </div>
          </div>
        </div>

        <!-- When needed -->
        <div class="form-group">
          <label class="form-label">Preferred Timing / कब चाहिए? *</label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <button style="padding: 10px 6px; border-radius: 10px; border: 2px solid #00B074; background: #F0FDF4; color: #065F46; font-weight: 800; font-size: 11px;">Immediate (30 min)</button>
            <button style="padding: 10px 6px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">Today Afternoon</button>
            <button style="padding: 10px 6px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">Tomorrow</button>
          </div>
        </div>

        <button class="btn-primary" onclick="window.broadcastJobSuccess()" style="margin-top: 10px;">
          ${ICONS.navigation} Broadcast Request to Nearby Pros (Free)
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 11: Lead Details & Send Offer - Worker (659bbf)
// -----------------------------------------------------------------------------
export function renderLeadOffer(state) {
  const lead = WORKER_ACTIVE_LEADS[0];
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <button class="back-btn-circle" onclick="window.navigate('leads_discovery')">
            ${ICONS.arrowLeft}
          </button>
          <div class="header-brand-group">
            <div class="header-brand-name">Lead Details & Send Quote</div>
            <div style="font-size: 10px; color: #64748B;">Direct Customer Connect • 0% Fee</div>
          </div>
        </div>
        <div class="kc-pill kc-pill-amber" style="font-size: 10px;">URGENT LEAD</div>
      </div>

      <div style="padding: 16px;">
        <!-- Customer & Location Header -->
        <div class="kc-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="kc-pill kc-pill-sky" style="font-size: 10px; margin-bottom: 4px;">${lead.category}</span>
              <h2 style="font-family: var(--font-headline); font-size: 16px; font-weight: 800; color: #1E293B; line-height: 1.3;">
                ${lead.title}
              </h2>
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 10px;">${lead.distance}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #F8FAFC; border-radius: 10px; margin-bottom: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #E0F2FE; color: #0284C7; display: flex; align-items: center; justify-content: center; font-weight: 800;">
              SS
            </div>
            <div style="flex: 1;">
              <div style="font-family: var(--font-headline); font-size: 13px; font-weight: 700;">${lead.customer}</div>
              <div style="font-size: 11px; color: #64748B;">📍 ${lead.sector} • House #1402</div>
            </div>
            <div class="kc-pill kc-pill-emerald" style="font-size: 9px;">Verified Customer</div>
          </div>

          <!-- Customer Voice Note Player -->
          <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 12px; cursor: pointer;" onclick="window.playAudioHelp()">
            <button style="width: 40px; height: 40px; border-radius: 50%; background: #00B074; border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${ICONS.play}
            </button>
            <div style="flex: 1;">
              <div style="font-family: var(--font-headline); font-weight: 800; font-size: 12px; color: #065F46;">
                Listen to Customer Voice Note (14s)
              </div>
              <div style="font-size: 10px; color: #059669;">Recorded in Hindi • "Under sink pipe cracked..."</div>
            </div>
          </div>

          <div style="font-size: 12px; color: #475569; line-height: 1.4; margin-bottom: 10px;">
            <b>Description:</b> "${lead.notes}"
          </div>

          <!-- Attached Photo -->
          <div style="margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Customer Attached Photo:</div>
            <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; border: 1px solid #CBD5E1;" />
          </div>
        </div>

        <!-- Worker Quote Form -->
        <div class="kc-card" style="border: 2px solid #00B074; background: #FFFFFF;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 15px; margin-bottom: 4px; color: #065F46;">
            Your Quote to Customer (आपका ऑफर)
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 14px;">
            Set your inspection rate & earliest arrival time.
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>Visiting & Inspection Fee (विज़िट व जांच फीस) *</span>
              <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">100% Direct Payout</span>
            </label>
            <div style="display: flex; gap: 8px;">
              <span style="display: flex; align-items: center; padding: 0 14px; background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; font-weight: 800;">₹</span>
              <input type="number" class="form-input" value="250" style="font-size: 18px; font-weight: 800; color: #065F46;" />
            </div>
            <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Material/parts costs will be extra with customer approval.</div>
          </div>

          <div class="form-group">
            <label class="form-label">How quickly can you arrive?</label>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
              <button style="padding: 10px 4px; border-radius: 10px; border: 2px solid #00B074; background: #F0FDF4; color: #065F46; font-weight: 800; font-size: 11px;">15 Mins (Fast)</button>
              <button style="padding: 10px 4px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">30 Mins</button>
              <button style="padding: 10px 4px; border-radius: 10px; border: 1px solid #CBD5E1; background: white; color: #1E293B; font-weight: 600; font-size: 11px;">45 Mins</button>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 6px;">
            <label class="form-label">Message to Customer (Optional)</label>
            <input type="text" class="form-input" value="I have PVC replacement pipes in stock. Can arrive in 15 mins." style="font-size: 12px;" />
          </div>
        </div>

        <button class="btn-primary" onclick="window.sendOfferSuccess()">
          ${ICONS.navigation} Send Direct Quote to Customer (0% Commission)
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 12: Compare Offers & Worker Profiles (f875b7)
// -----------------------------------------------------------------------------
export function renderCompareOffers(state) {
  const t = getT(state);
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <button class="back-btn-circle" onclick="window.navigate('home')">
            ${ICONS.arrowLeft}
          </button>
          <div class="header-brand-group">
            <div class="header-brand-name">${t.compareBids}</div>
            <div style="font-size: 10px; color: #64748B;">3 Verified Workers Responded</div>
          </div>
        </div>
        <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">LIVE OFFERS</div>
      </div>

      <div style="padding: 16px;">
        <!-- Active Request Recap -->
        <div class="kc-banner-trust" style="background: #F8FAFC; border-color: #CBD5E1; margin-bottom: 16px;">
          <div style="font-size: 20px;">🚰</div>
          <div class="kc-banner-text">
            <div style="font-size: 12px; font-weight: 800; color: #1E293B;">
              Kitchen Sink Under-pipe Burst
            </div>
            <div style="font-size: 11px; color: #64748B;">Sector 22-B, Chandigarh • Posted 12m ago</div>
          </div>
          <span class="kc-pill kc-pill-amber" style="font-size: 9px;">3 Offers</span>
        </div>

        <div style="font-family: var(--font-headline); font-size: 14px; font-weight: 800; color: var(--text-main); margin-bottom: 10px;">
          Select an Artisan & Confirm Arrival:
        </div>

        <!-- 3 Incoming Offer Cards -->
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <!-- Pro 1: Rajesh Kumar (Best Match) -->
          <div class="kc-card" style="border: 2px solid #00B074; background: #FFFFFF; position: relative;">
            <div style="position: absolute; top: -10px; right: 14px;">
              <span class="kc-pill kc-pill-emerald" style="font-size: 9px; background: #00B074; color: white;">FASTEST ARRIVAL (12 MIN)</span>
            </div>

            <div class="worker-header">
              <div class="worker-avatar-wrap">
                <img src="${VERIFIED_WORKERS[0].avatar}" class="worker-avatar" />
                <span class="worker-status-dot"></span>
              </div>
              <div class="worker-info">
                <div class="worker-name-row">
                  <span class="worker-name">${VERIFIED_WORKERS[0].name}</span>
                  ${ICONS.verifiedBadge}
                </div>
                <div class="worker-trade">${VERIFIED_WORKERS[0].trade}</div>
                <div class="worker-meta-row">
                  <span class="worker-rating-badge">⭐ 4.9 (420)</span>
                  <span>📍 0.9 km</span>
                  <span>⏱️ 12 Min ETA</span>
                </div>
              </div>
            </div>

            <div style="background: #F0FDF4; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px; font-size: 11px; color: #065F46;">
              💬 "Nearby in Sec 22 Market. Carrying standard PVC pipes & sealant tools."
            </div>

            <div class="worker-footer">
              <div class="worker-fee-box">
                <span class="worker-fee-label">Offered Visit Fee</span>
                <span class="worker-fee-val">₹200 <span style="font-size: 10px; color: #00B074;">(0% App Fee)</span></span>
              </div>
              <div class="worker-actions">
                <button class="btn-call-direct" onclick="window.callWorker('${VERIFIED_WORKERS[0].phone}', '${VERIFIED_WORKERS[0].name}')">
                  ${ICONS.phone} Direct Call
                </button>
                <button class="btn-primary" style="width: auto; min-height: 38px; padding: 0 14px; font-size: 12px;" onclick="window.acceptOffer('${VERIFIED_WORKERS[0].id}')">
                  Accept Offer ✓
                </button>
              </div>
            </div>
          </div>

          <!-- Pro 2: Gurpreet Singh -->
          <div class="kc-card">
            <div class="worker-header">
              <div class="worker-avatar-wrap">
                <img src="${VERIFIED_WORKERS[1].avatar}" class="worker-avatar" />
                <span class="worker-status-dot"></span>
              </div>
              <div class="worker-info">
                <div class="worker-name-row">
                  <span class="worker-name">${VERIFIED_WORKERS[1].name}</span>
                  ${ICONS.verifiedBadge}
                </div>
                <div class="worker-trade">${VERIFIED_WORKERS[1].trade}</div>
                <div class="worker-meta-row">
                  <span class="worker-rating-badge">⭐ 4.8 (312)</span>
                  <span>📍 1.4 km</span>
                  <span>⏱️ 18 Min ETA</span>
                </div>
              </div>
            </div>

            <div class="worker-footer">
              <div class="worker-fee-box">
                <span class="worker-fee-label">Offered Visit Fee</span>
                <span class="worker-fee-val">₹250</span>
              </div>
              <div class="worker-actions">
                <button class="btn-call-direct" onclick="window.callWorker('${VERIFIED_WORKERS[1].phone}', '${VERIFIED_WORKERS[1].name}')">
                  ${ICONS.phone} Call
                </button>
                <button class="btn-primary" style="width: auto; min-height: 38px; padding: 0 14px; font-size: 12px;" onclick="window.acceptOffer('${VERIFIED_WORKERS[1].id}')">
                  Accept
                </button>
              </div>
            </div>
          </div>

          <!-- Pro 3: Amit Sharma -->
          <div class="kc-card">
            <div class="worker-header">
              <div class="worker-avatar-wrap">
                <img src="${VERIFIED_WORKERS[2].avatar}" class="worker-avatar" />
                <span class="worker-status-dot"></span>
              </div>
              <div class="worker-info">
                <div class="worker-name-row">
                  <span class="worker-name">${VERIFIED_WORKERS[2].name}</span>
                  ${ICONS.verifiedBadge}
                </div>
                <div class="worker-trade">${VERIFIED_WORKERS[2].trade}</div>
                <div class="worker-meta-row">
                  <span class="worker-rating-badge">⭐ 4.9 (285)</span>
                  <span>📍 1.8 km</span>
                  <span>⏱️ 22 Min ETA</span>
                </div>
              </div>
            </div>

            <div class="worker-footer">
              <div class="worker-fee-box">
                <span class="worker-fee-label">Offered Visit Fee</span>
                <span class="worker-fee-val">₹250</span>
              </div>
              <div class="worker-actions">
                <button class="btn-call-direct" onclick="window.callWorker('${VERIFIED_WORKERS[2].phone}', '${VERIFIED_WORKERS[2].name}')">
                  ${ICONS.phone} Call
                </button>
                <button class="btn-primary" style="width: auto; min-height: 38px; padding: 0 14px; font-size: 12px;" onclick="window.acceptOffer('${VERIFIED_WORKERS[2].id}')">
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 13: Active Job & Live GPS Tracking (9839f0)
// -----------------------------------------------------------------------------
export function renderActiveTracking(state) {
  const worker = VERIFIED_WORKERS[0];
  return `
    <div class="screen-container no-nav" style="padding: 0; display: flex; flex-direction: column; height: 100%;">
      <!-- Floating Top Bar -->
      <div style="position: absolute; top: 12px; left: 16px; right: 16px; z-index: 50; display: flex; align-items: center; justify-content: space-between;">
        <button class="back-btn-circle" style="box-shadow: var(--shadow-md); background: white;" onclick="window.navigate('home')">
          ${ICONS.arrowLeft}
        </button>
        <div class="kc-pill kc-pill-emerald" style="box-shadow: var(--shadow-md); font-size: 11px;">
          • LIVE GPS TRACKER
        </div>
        <div class="icon-btn-circle" style="box-shadow: var(--shadow-md); background: #EF4444; color: white;" onclick="alert('Emergency SOS dispatched to Tricity Safety Desk & Family Contact')">
          🚨
        </div>
      </div>

      <!-- Interactive Animated Map Canvas -->
      <div style="flex: 1; min-height: 360px; background: #E2E8F0; position: relative; overflow: hidden;">
        <!-- Simulated Map Graphic -->
        <svg viewBox="0 0 400 450" style="width: 100%; height: 100%; object-fit: cover;">
          <!-- Map Background -->
          <rect width="400" height="450" fill="#E8EEF5"/>
          <!-- Parks -->
          <rect x="20" y="30" width="100" height="70" rx="12" fill="#D1E7DD"/>
          <text x="35" y="70" fill="#4A7C59" font-size="10" font-family="sans-serif" font-weight="bold">Rose Garden</text>
          
          <rect x="260" y="180" width="110" height="80" rx="12" fill="#D1E7DD"/>
          <text x="275" y="225" fill="#4A7C59" font-size="10" font-family="sans-serif" font-weight="bold">Sector 22 Market</text>

          <!-- Roads Grid -->
          <path d="M 0 140 L 400 140" stroke="#FFFFFF" stroke-width="14"/>
          <path d="M 0 140 L 400 140" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,6"/>
          
          <path d="M 180 0 L 180 450" stroke="#FFFFFF" stroke-width="16"/>
          <path d="M 180 0 L 180 450" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,6"/>

          <path d="M 0 320 L 400 320" stroke="#FFFFFF" stroke-width="14"/>
          
          <!-- Route Path from Worker to Customer -->
          <path d="M 90 140 L 180 140 L 180 280 L 250 280" fill="none" stroke="#00B074" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Customer Destination Pin -->
          <circle cx="250" cy="280" r="14" fill="#0284C7"/>
          <circle cx="250" cy="280" r="6" fill="#FFFFFF"/>
          <text x="230" y="310" fill="#0F172A" font-size="11" font-weight="bold" font-family="sans-serif">Your Home (Sec 22-B)</text>

          <!-- Technician Motorbike Pin Moving Radar -->
          <g transform="translate(130, 140)">
            <circle cx="0" cy="0" r="22" fill="rgba(0, 176, 116, 0.25)" class="pulse-anim"/>
            <circle cx="0" cy="0" r="14" fill="#00B074"/>
            <text x="-7" y="5" font-size="12">🏍️</text>
          </g>
        </svg>

        <!-- Floating ETA Badge -->
        <div style="position: absolute; top: 70px; left: 50%; transform: translateX(-50%); background: #1E293B; color: white; padding: 8px 18px; border-radius: 100px; display: flex; align-items: center; gap: 8px; box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 800; font-family: var(--font-headline); white-space: nowrap;">
          <span style="color: #00B074;">⚡</span> Arriving in 11 Mins • 1.1 km away
        </div>
      </div>

      <!-- Live Technician Drawer Card -->
      <div style="background: white; border-top-left-radius: 28px; border-top-right-radius: 28px; padding: 18px 16px 24px; box-shadow: 0 -8px 24px rgba(0,0,0,0.12); position: relative; z-index: 40;">
        <div style="width: 40px; height: 4px; background: #CBD5E1; border-radius: 100px; margin: 0 auto 14px;"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="worker-avatar-wrap">
              <img src="${worker.avatar}" class="worker-avatar" />
              <span class="worker-status-dot"></span>
            </div>
            <div>
              <div class="worker-name-row">
                <span class="worker-name">${worker.name}</span>
                ${ICONS.verifiedBadge}
              </div>
              <div style="font-size: 11px; color: #00B074; font-weight: 700;">${worker.vehicle}</div>
              <div style="font-size: 11px; color: #64748B;">Master Electrician • Aadhaar Verified</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 700;">Arrival Code</div>
            <div style="font-family: var(--font-headline); font-size: 20px; font-weight: 800; color: #00B074; letter-spacing: 0.05em;">
              8421
            </div>
          </div>
        </div>

        <div style="background: #F8FAFC; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
          <span style="color: #475569;">Share arrival code <b>8421</b> with worker upon entry.</span>
          <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">Zero Cash Advance</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <button class="btn-primary" onclick="window.callWorker('${worker.phone}', '${worker.name}')">
            ${ICONS.phone} Call Worker
          </button>
          <button class="btn-secondary" onclick="window.navigate('job_progress')">
            View Job Progress →
          </button>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 14: Job Progress & Completion (4d3a91)
// -----------------------------------------------------------------------------
export function renderJobProgress(state) {
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <button class="back-btn-circle" onclick="window.navigate('active_tracking')">
            ${ICONS.arrowLeft}
          </button>
          <div class="header-brand-group">
            <div class="header-brand-name">Job Progress & Completion</div>
            <div style="font-size: 10px; color: #64748B;">Booking #KC-88421 • Direct Settlement</div>
          </div>
        </div>
        <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">IN PROGRESS</div>
      </div>

      <div style="padding: 16px;">
        <!-- Live Milestones Stepper -->
        <div class="kc-card" style="margin-bottom: 16px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 12px;">
            Service Milestones (कार्य प्रगति)
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; position: relative;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;">✓</div>
              <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700;">Technician Arrived at Location</div>
                <div style="font-size: 10px; color: #64748B;">Sector 22-B • OTP 8421 Verified at 11:42 AM</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;">✓</div>
              <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700;">Fault Inspected & Cost Approved</div>
                <div style="font-size: 10px; color: #64748B;">Replaced Cracked PVC Drainage Pipe</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: #0284C7; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800;">3</div>
              <div style="flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: #0284C7;">Water Pressure Testing Complete</div>
                <div style="font-size: 10px; color: #64748B;">Ready for bill settlement</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Before & After Work Photos -->
        <div class="kc-card" style="margin-bottom: 16px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 10px;">
            Work Proof Photos (मरम्मत फ़ोटो)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <div style="font-size: 10px; font-weight: 700; color: #EF4444; margin-bottom: 4px;">BEFORE (लीकेज)</div>
              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=250&auto=format&fit=crop&q=80" style="width: 100%; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid #CBD5E1;" />
            </div>
            <div>
              <div style="font-size: 10px; font-weight: 700; color: #00B074; margin-bottom: 4px;">AFTER (मरम्मत पूर्ण)</div>
              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=250&auto=format&fit=crop&q=80" style="width: 100%; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid #CBD5E1;" />
            </div>
          </div>
        </div>

        <!-- Transparent Bill Breakdown -->
        <div class="kc-card" style="border: 2px solid #00B074;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-family: var(--font-headline); font-weight: 800; font-size: 15px;">
              Transparent Bill (बिल विवरण)
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">0% APP CUT</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Visiting & Inspection Fee</span>
            <span style="font-weight: 700;">₹200.00</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Heavy-Duty PVC Drain Pipe (New)</span>
            <span style="font-weight: 700;">₹180.00</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Teflon Sealant & Labour</span>
            <span style="font-weight: 700;">₹50.00</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; color: #00B074; font-weight: 700;">
            <span>KaamConnect Platform Commission</span>
            <span>₹0.00 (FREE)</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; padding-top: 10px; border-top: 2px solid #E2E8F0; font-family: var(--font-headline);">
            <span>Total Payable to Worker</span>
            <span style="color: #065F46;">₹430.00</span>
          </div>
        </div>

        <!-- Direct UPI / Cash QR Payment Box -->
        <div class="kc-card" style="background: #F8FAFC; text-align: center; padding: 18px; margin-bottom: 20px;">
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px; margin-bottom: 4px;">
            Scan & Pay Directly to Rajesh Kumar
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 12px;">
            UPI ID: <b>rajesh.tricity@upi</b> (GPay / PhonePe / Paytm / Cash)
          </div>

          <div style="width: 140px; height: 140px; background: white; border: 2px solid #CBD5E1; border-radius: 14px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
            ${ICONS.qrcode}
          </div>

          <div style="display: flex; justify-content: center; gap: 8px;">
            <button class="btn-primary" style="width: auto; min-height: 40px; padding: 0 16px; font-size: 12px;" onclick="window.navigate('rating_review')">
              Paid ₹430 via UPI ✓
            </button>
            <button class="btn-secondary" style="width: auto; min-height: 40px; padding: 0 16px; font-size: 12px;" onclick="window.navigate('rating_review')">
              Paid in Cash 💵
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 15: Rating & Review (65fadf)
// -----------------------------------------------------------------------------
export function renderRatingReview(state) {
  const worker = VERIFIED_WORKERS[0];
  return `
    <div class="screen-container no-nav" style="padding: 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <button class="back-btn-circle" onclick="window.navigate('home')">
            ${ICONS.arrowLeft}
          </button>
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 15px;">
            Rate & Review / रेटिंग दें
          </div>
          <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">JOB #88421</div>
        </div>

        <!-- Worker Summary -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="worker-avatar-wrap" style="width: 72px; height: 72px; margin: 0 auto 10px;">
            <img src="${worker.avatar}" class="worker-avatar" />
            <span class="worker-status-dot"></span>
          </div>
          <h2 style="font-family: var(--font-headline); font-size: 18px; font-weight: 800; color: #1E293B;">
            ${worker.name}
          </h2>
          <div style="font-size: 12px; color: var(--primary); font-weight: 700;">
            ${worker.trade} • Chandigarh
          </div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
            Completed Plumbing Pipe Fix in Sector 22-B
          </div>
        </div>

        <!-- Interactive 5-Star Selector -->
        <div class="kc-card" style="text-align: center; padding: 18px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 10px;">
            HOW WAS YOUR SERVICE EXPERIENCE?
          </div>
          <div style="display: flex; justify-content: center; gap: 8px; font-size: 32px; color: #F59E0B; cursor: pointer; margin-bottom: 8px;">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
          <div style="font-family: var(--font-headline); font-weight: 800; font-size: 16px; color: #065F46;">
            Excellent Work! (उत्कृष्ट कार्य)
          </div>
        </div>

        <!-- Quick Appreciation Tags -->
        <div class="kc-card" style="margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px;">What did you like the most?</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span class="sector-chip active" style="background: #00B074; color: white;">⚡ Punctual / समय पर ✓</span>
            <span class="sector-chip active" style="background: #00B074; color: white;">💵 Fair Price / वाजिब दाम ✓</span>
            <span class="sector-chip">🧼 Clean Work / साफ़ काम</span>
            <span class="sector-chip">🤝 Polite / विनम्र व्यवहार</span>
            <span class="sector-chip">🛠️ Expert Skill / हुनरमंद</span>
          </div>
        </div>

        <!-- Optional Tip to Worker -->
        <div class="kc-card" style="background: #FFFBEB; border-color: #FDE68A;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-family: var(--font-headline); font-weight: 800; font-size: 13px; color: #92400E;">
              Add a Direct Tip for Rajesh? (कारीगर को टिप)
            </div>
            <span class="kc-pill kc-pill-amber" style="font-size: 9px;">100% to Worker</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
            <button style="padding: 8px; border-radius: 8px; border: 1px solid #CBD5E1; background: white; font-weight: 800; font-size: 12px;">₹20</button>
            <button style="padding: 8px; border-radius: 8px; border: 2px solid #F59E0B; background: #FEF3C7; color: #92400E; font-weight: 800; font-size: 12px;">₹50 ✓</button>
            <button style="padding: 8px; border-radius: 8px; border: 1px solid #CBD5E1; background: white; font-weight: 800; font-size: 12px;">₹100</button>
            <button style="padding: 8px; border-radius: 8px; border: 1px solid #CBD5E1; background: white; font-weight: 800; font-size: 12px;">Custom</button>
          </div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <button class="btn-primary" onclick="window.navigate('my_jobs')">
          Submit Review & Complete • सबमिट करें ${ICONS.arrowRight}
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 16: My Jobs & Activity (e64013)
// -----------------------------------------------------------------------------
export function renderMyJobs(state) {
  const isWorker = state.role === 'worker';
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <div class="header-brand-group">
            <div class="header-brand-name">
              ${isWorker ? 'Worker Earnings & Jobs' : 'My Jobs & Activity'}
            </div>
            <div style="font-size: 10px; color: #64748B;">Chandigarh Tricity Bookings</div>
          </div>
        </div>
        <div class="kc-pill kc-pill-emerald" style="font-size: 10px;">
          ${isWorker ? '₹1,450 Earned Today' : '0% App Fees'}
        </div>
      </div>

      <div style="padding: 16px;">
        <!-- Segmented Filter Tabs -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); background: #F1F5F9; border-radius: 12px; padding: 3px; margin-bottom: 16px;">
          <button style="padding: 8px; border: none; background: #FFFFFF; border-radius: 10px; font-weight: 800; font-size: 12px; color: #1E293B; box-shadow: var(--shadow-sm);">Ongoing (1)</button>
          <button style="padding: 8px; border: none; background: transparent; font-weight: 600; font-size: 12px; color: #64748B;">Completed (8)</button>
          <button style="padding: 8px; border: none; background: transparent; font-weight: 600; font-size: 12px; color: #64748B;">Cancelled (0)</button>
        </div>

        ${isWorker ? `
          <!-- Worker Earnings Metrics Card -->
          <div class="kc-card" style="background: linear-gradient(135deg, #065F46 0%, #047857 100%); color: white; border: none; margin-bottom: 16px;">
            <div style="font-size: 11px; opacity: 0.9; text-transform: uppercase; font-weight: 700;">Today's Direct Earnings (सीधी कमाई)</div>
            <div style="font-family: var(--font-headline); font-size: 28px; font-weight: 800; margin: 4px 0 10px;">
              ₹1,450.00
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
              <span>Jobs Done: <b>4</b></span>
              <span>Platform Fee Paid: <b>₹0.00 (Zero Cut)</b></span>
            </div>
          </div>
        ` : ''}

        <!-- Active/Ongoing Job Item -->
        <div class="kc-card" style="border: 2px solid #00B074; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="kc-pill kc-pill-emerald" style="font-size: 9px; margin-bottom: 4px;">ACTIVE REPAIR</span>
              <div style="font-family: var(--font-headline); font-weight: 800; font-size: 14px;">Kitchen Pipe Leakage & Replacement</div>
              <div style="font-size: 11px; color: #64748B;">Sector 22-B • Today at 11:30 AM</div>
            </div>
            <span class="kc-pill kc-pill-amber" style="font-size: 10px;">₹430 Settled</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #F0FDF4; border-radius: 10px; margin-bottom: 10px;">
            <img src="${VERIFIED_WORKERS[0].avatar}" style="width: 32px; height: 32px; border-radius: 50%;" />
            <div style="flex: 1; font-size: 11px;">
              <b>Rajesh Kumar</b> (Master Electrician & Plumber)
            </div>
            <button class="btn-call-direct" style="padding: 4px 8px; font-size: 11px;" onclick="window.callWorker('${VERIFIED_WORKERS[0].phone}', '${VERIFIED_WORKERS[0].name}')">
              ${ICONS.phone} Call
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="flex: 1; min-height: 38px; font-size: 12px;" onclick="window.navigate('active_tracking')">
              Track Status →
            </button>
            <button class="btn-primary" style="flex: 1; min-height: 38px; font-size: 12px;" onclick="window.navigate('rating_review')">
              Leave Review
            </button>
          </div>
        </div>

        <!-- Past Completed Jobs -->
        <div style="font-family: var(--font-headline); font-size: 13px; font-weight: 800; color: #64748B; margin-bottom: 10px;">
          PAST COMPLETED JOBS (पिछले काम)
        </div>

        <div class="kc-card" style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">Split AC Filter Cleaning & Gas Check</div>
            <span style="font-size: 11px; font-weight: 700; color: #00B074;">₹299</span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Completed by Amit Sharma on Oct 4 • Rated 5.0 ★</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <button style="border: none; background: none; color: var(--tertiary); font-weight: 700; cursor: pointer; padding: 0;">
              📄 Download Receipt (0% Tax)
            </button>
            <button style="border: none; background: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0;" onclick="window.navigate('post_job')">
              Re-Book Worker ↻
            </button>
          </div>
        </div>

        <div class="kc-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-family: var(--font-headline); font-weight: 700; font-size: 13px;">Main Switchboard MCB Trip Fix</div>
            <span style="font-size: 11px; font-weight: 700; color: #00B074;">₹200</span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Completed by Rajesh Kumar on Sep 28 • Rated 5.0 ★</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <button style="border: none; background: none; color: var(--tertiary); font-weight: 700; cursor: pointer; padding: 0;">
              📄 Download Receipt
            </button>
            <button style="border: none; background: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 0;" onclick="window.navigate('post_job')">
              Re-Book Worker ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 17: Profile, Settings & Wallet (d97067)
// -----------------------------------------------------------------------------
export function renderProfileWallet(state) {
  const isWorker = state.role === 'worker';
  return `
    <div class="screen-container">
      <div class="app-header-bar">
        <div class="app-header-left">
          <div class="header-brand-group">
            <div class="header-brand-name">Profile & Settings</div>
            <div style="font-size: 10px; color: #64748B;">KaamConnect Direct Account</div>
          </div>
        </div>
        <div class="vernacular-mini-selector">
          <button class="vernacular-mini-btn ${state.language === 'en' ? 'active' : ''}" onclick="window.setLanguage('en')">EN</button>
          <button class="vernacular-mini-btn ${state.language === 'hi' ? 'active' : ''}" onclick="window.setLanguage('hi')">हिं</button>
          <button class="vernacular-mini-btn ${state.language === 'pa' ? 'active' : ''}" onclick="window.setLanguage('pa')">ਪੰ</button>
        </div>
      </div>

      <div style="padding: 16px;">
        <!-- User Profile Card -->
        <div class="kc-card" style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: #00B074; color: white; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 2px solid #FFFFFF; box-shadow: var(--shadow-sm);">
            ${isWorker ? '🛠️' : '👤'}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: var(--font-headline); font-size: 16px; font-weight: 800;">
                ${isWorker ? 'Rajesh Kumar (Worker)' : 'Sunita Sharma (Customer)'}
              </span>
              ${ICONS.verifiedBadge}
            </div>
            <div style="font-size: 12px; color: #64748B; margin-top: 2px;">
              +91 98765 43210 • Sector 22, Chandigarh
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 9px; margin-top: 4px;">
              Aadhaar Verified Citizen
            </span>
          </div>
        </div>

        <!-- Zero-Commission Cumulative Savings Banner -->
        <div class="kc-card" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1.5px solid #86EFAC; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-family: var(--font-headline); font-weight: 800; font-size: 13px; color: #065F46;">
              0% Commission Charter Savings
            </div>
            <span class="kc-pill kc-pill-emerald" style="font-size: 9px;">TOTAL SAVED</span>
          </div>
          <div style="font-family: var(--font-headline); font-size: 26px; font-weight: 800; color: #047857;">
            ₹4,200.00
          </div>
          <div style="font-size: 11px; color: #065F46; margin-top: 4px;">
            Money saved by connecting directly with local artisans without middleman commission!
          </div>
        </div>

        <!-- Role Toggle Section -->
        <div class="kc-card" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-family: var(--font-headline); font-size: 13px; font-weight: 800;">
                Active App Mode: <span style="color: var(--primary);">${isWorker ? 'Worker Pro (कारीगर)' : 'Customer (ग्राहक)'}</span>
              </div>
              <div style="font-size: 11px; color: #64748B;">Switch anytime between providing and ordering services</div>
            </div>
            <button class="kc-pill kc-pill-dark" style="cursor: pointer; padding: 6px 12px;" onclick="window.toggleRole()">
              Switch 🔄
            </button>
          </div>
        </div>

        <!-- Settings Options List -->
        <div class="kc-card" style="padding: 6px 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; cursor: pointer;" onclick="window.navigate('customer_onboarding')">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>📍</span>
              <span style="font-size: 13px; font-weight: 700;">Saved Tricity Addresses (पता प्रबंधन)</span>
            </div>
            <span style="color: #94A3B8;">›</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; cursor: pointer;" onclick="window.navigate('language')">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>🌐</span>
              <span style="font-size: 13px; font-weight: 700;">Language: <b>${state.language.toUpperCase()}</b> (भाषा बदलें)</span>
            </div>
            <span style="color: #94A3B8;">›</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; cursor: pointer;" onclick="window.navigate('carousel')">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>✨</span>
              <span style="font-size: 13px; font-weight: 700;">Welcome Highlights & Tutorial</span>
            </div>
            <span style="color: #94A3B8;">›</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; cursor: pointer;" onclick="alert('Calling Tricity Helpline: 1800-KAAM-CONNECT')">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>📞</span>
              <span style="font-size: 13px; font-weight: 700;">24x7 Tricity Safety & Support Helpline</span>
            </div>
            <span style="color: #94A3B8;">›</span>
          </div>
        </div>

        <!-- Logout / Reset -->
        <button class="btn-secondary" style="border-color: #EF4444; color: #EF4444;" onclick="window.navigate('splash')">
          Log Out of KaamConnect
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Screen 18: Welcome Highlights Carousel (3ea173)
// -----------------------------------------------------------------------------
export function renderCarousel(state) {
  const currentSlide = state.carouselSlide || 0;
  const slides = [
    {
      title: '0% Platform Fee • सीधा मुनाफ़ा',
      subtitle: 'No middlemen cuts, no lead fees. 100% of the customer payment goes straight into the technician\'s hands.',
      badge: 'Zero Middleman Guarantee',
      color: '#00B074',
      icon: '💵'
    },
    {
      title: 'Aadhaar Verified Local Pros',
      subtitle: 'Background-checked electricians, plumbers, and carpenters from your local sector in Chandigarh, Mohali, and Panchkula.',
      badge: 'Civic Trust & Safety',
      color: '#0284C7',
      icon: '🛡️'
    },
    {
      title: 'Direct Phone & Instant UPI',
      subtitle: 'Speak directly with mistris before arrival and settle bills via Cash, Google Pay, or PhonePe without app withholding.',
      badge: 'Frictionless Experience',
      color: '#F59E0B',
      icon: '⚡'
    }
  ];

  const slide = slides[currentSlide];

  return `
    <div class="screen-container no-nav" style="padding: 20px 16px; display: flex; flex-direction: column; min-height: 100%; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <button style="border: none; background: none; font-size: 13px; font-weight: 700; color: #64748B; cursor: pointer;" onclick="window.navigate('home')">
            Skip to App →
          </button>
        </div>

        <!-- Big Highlight Illustration Card -->
        <div class="kc-card" style="padding: 30px 20px; text-align: center; border-radius: 32px; margin-bottom: 24px; background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);">
          <div style="width: 100px; height: 100px; border-radius: 30px; background: ${slide.color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 44px; margin: 0 auto 20px; box-shadow: 0 10px 25px rgba(0, 176, 116, 0.3);">
            ${slide.icon}
          </div>
          <span class="kc-pill kc-pill-emerald" style="font-size: 11px; margin-bottom: 12px;">
            ${slide.badge}
          </span>
          <h2 style="font-family: var(--font-headline); font-size: 22px; font-weight: 800; color: #1E293B; margin-bottom: 10px;">
            ${slide.title}
          </h2>
          <p style="font-size: 13px; color: #64748B; line-height: 1.5; padding: 0 10px;">
            ${slide.subtitle}
          </p>
        </div>

        <!-- Carousel Indicators -->
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 24px;">
          <span style="width: ${currentSlide === 0 ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${currentSlide === 0 ? '#00B074' : '#CBD5E1'}; transition: all 0.2s;"></span>
          <span style="width: ${currentSlide === 1 ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${currentSlide === 1 ? '#00B074' : '#CBD5E1'}; transition: all 0.2s;"></span>
          <span style="width: ${currentSlide === 2 ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${currentSlide === 2 ? '#00B074' : '#CBD5E1'}; transition: all 0.2s;"></span>
        </div>
      </div>

      <div>
        <button class="btn-primary" onclick="window.nextCarouselSlide()">
          ${currentSlide === 2 ? 'Get Started in Tricity • शुरू करें' : 'Next Benefit →'}
        </button>
      </div>
    </div>
  `;
}
