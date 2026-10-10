// KaamConnect Main Application Logic & Responsive Studio Controller

import { ICONS } from './icons.js';
import { SCREENS_CATALOG } from './data.js';
import {
  renderSplash,
  renderLanguage,
  renderLogin,
  renderOtp,
  renderRole,
  renderCustomerOnboarding,
  renderWorkerOnboarding,
  renderHome,
  renderLeadsDiscovery,
  renderPostJob,
  renderLeadOffer,
  renderCompareOffers,
  renderActiveTracking,
  renderJobProgress,
  renderRatingReview,
  renderMyJobs,
  renderProfileWallet,
  renderCarousel
} from './screens.js';

// Global Reactive State
export const state = {
  currentScreen: 'splash',
  role: 'customer', // 'customer' or 'worker'
  language: 'en',   // 'en', 'hi', 'pa'
  device: 'iphone', // 'iphone', 'pixel', 'ipad', 'fullscreen'
  carouselSlide: 0,
  mobileNumber: '9876543210',
  isRecordingVoice: false,
  isScreensDrawerOpen: false,
  selectedCategory: 'plumber'
};

const SCREEN_RENDERERS = {
  splash: renderSplash,
  language: renderLanguage,
  login: renderLogin,
  otp: renderOtp,
  role: renderRole,
  customer_onboarding: renderCustomerOnboarding,
  worker_onboarding: renderWorkerOnboarding,
  home: renderHome,
  leads_discovery: renderLeadsDiscovery,
  post_job: renderPostJob,
  lead_offer: renderLeadOffer,
  compare_offers: renderCompareOffers,
  active_tracking: renderActiveTracking,
  job_progress: renderJobProgress,
  rating_review: renderRatingReview,
  my_jobs: renderMyJobs,
  profile_wallet: renderProfileWallet,
  carousel: renderCarousel
};

// Bottom Navigation items to show on main app screens
const IN_APP_SCREENS = ['home', 'leads_discovery', 'post_job', 'my_jobs', 'profile_wallet'];

export function renderBottomNav() {
  if (!IN_APP_SCREENS.includes(state.currentScreen)) {
    return '';
  }

  const isWorker = state.role === 'worker';

  return `
    <nav class="app-bottom-nav">
      <button class="nav-tab-item ${state.currentScreen === 'home' ? 'active' : ''}" onclick="window.navigate('home')">
        ${ICONS.home}
        <span class="nav-tab-label">Home</span>
      </button>

      <button class="nav-tab-item ${state.currentScreen === 'leads_discovery' ? 'active' : ''}" onclick="window.navigate('leads_discovery')">
        ${ICONS.compass}
        <span class="nav-tab-label">${isWorker ? 'Leads' : 'Services'}</span>
      </button>

      <button class="nav-tab-item nav-post-cta" onclick="window.navigate('${isWorker ? 'lead_offer' : 'post_job'}')">
        <div class="nav-post-circle">
          ${isWorker ? ICONS.navigation : ICONS.plusCircle}
        </div>
        <span class="nav-tab-label" style="font-weight: 800; color: var(--primary);">${isWorker ? 'Quote' : 'Post'}</span>
      </button>

      <button class="nav-tab-item ${state.currentScreen === 'my_jobs' ? 'active' : ''}" onclick="window.navigate('my_jobs')">
        ${ICONS.clipboardList}
        <span class="nav-tab-label">Activity</span>
      </button>

      <button class="nav-tab-item ${state.currentScreen === 'profile_wallet' ? 'active' : ''}" onclick="window.navigate('profile_wallet')">
        ${ICONS.user}
        <span class="nav-tab-label">Profile</span>
      </button>
    </nav>
  `;
}

export function updateClock() {
  const clockEl = document.getElementById('statusClock');
  if (clockEl) {
    const now = new Date();
    let hours = now.getHours();
    let mins = now.getMinutes();
    mins = mins < 10 ? '0' + mins : mins;
    clockEl.textContent = `${hours}:${mins}`;
  }
}

export function renderScreensDrawer() {
  const drawerEl = document.getElementById('screensDrawer');
  if (!drawerEl) return;

  drawerEl.innerHTML = `
    <div class="drawer-overlay ${state.isScreensDrawerOpen ? 'open' : ''}" onclick="window.handleDrawerBackdropClick(event)">
      <div class="screens-drawer-modal" onclick="event.stopPropagation()">
        <div class="drawer-header">
          <div class="drawer-title">
            <span style="color: var(--primary);">✦</span> All 18 KaamConnect Project Screens
          </div>
          <button class="drawer-close-btn" onclick="window.toggleScreensDrawer()">
            ✕ Close
          </button>
        </div>

        <div class="screens-grid-content">
          ${SCREENS_CATALOG.map(s => `
            <div class="screen-card-preview ${state.currentScreen === s.key ? 'active' : ''}" onclick="window.jumpToScreen('${s.key}')">
              <div class="screen-num-badge">${s.num}</div>
              <div style="flex: 1;">
                <div class="screen-card-title">${s.title}</div>
                <div class="screen-card-role">Role: ${s.role.toUpperCase()}</div>
              </div>
              <div style="color: var(--primary);">→</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderApp() {
  const appContainer = document.getElementById('appContainer');
  if (!appContainer) return;

  const renderer = SCREEN_RENDERERS[state.currentScreen] || renderSplash;
  const screenHtml = renderer(state);
  const bottomNavHtml = renderBottomNav();

  appContainer.innerHTML = `
    <div class="app-viewport">
      ${screenHtml}
      ${bottomNavHtml}
    </div>
  `;

  // Update Studio Header UI
  updateStudioControls();
  renderScreensDrawer();
}

function updateStudioControls() {
  // Device buttons
  document.querySelectorAll('[data-device-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-device-btn') === state.device);
  });

  // Role button label
  const roleLabel = document.getElementById('studioRoleLabel');
  if (roleLabel) {
    roleLabel.textContent = state.role === 'worker' ? '🛠️ Worker Mode' : '👤 Customer Mode';
  }

  // Active screen title in dropdown button
  const currentScreenObj = SCREENS_CATALOG.find(s => s.key === state.currentScreen);
  const curScreenNameEl = document.getElementById('currentScreenName');
  if (curScreenNameEl && currentScreenObj) {
    curScreenNameEl.textContent = `${currentScreenObj.num}. ${currentScreenObj.title}`;
  }

  // Device frame class
  const frameWrapper = document.getElementById('deviceFrameWrapper');
  if (frameWrapper) {
    frameWrapper.className = `device-frame-wrapper device-${state.device}`;
  }

  // Hardware elements (Dynamic Island vs Punchhole)
  const notchEl = document.getElementById('hardwareNotch');
  if (notchEl) {
    if (state.device === 'iphone') {
      notchEl.innerHTML = `
        <div class="dynamic-island">
          <div class="island-camera"></div>
          <div class="island-sensor"></div>
        </div>
      `;
    } else if (state.device === 'pixel') {
      notchEl.innerHTML = `<div class="pixel-punchhole"></div>`;
    } else {
      notchEl.innerHTML = ``;
    }
  }

  // Bottom hardware indicator
  const hardwareBottom = document.getElementById('hardwareBottomNav');
  if (hardwareBottom) {
    if (state.device === 'iphone') {
      hardwareBottom.innerHTML = `<div class="ios-home-indicator"></div>`;
      hardwareBottom.style.display = 'flex';
    } else if (state.device === 'pixel') {
      hardwareBottom.innerHTML = `<div class="android-nav-pill"></div>`;
      hardwareBottom.style.display = 'flex';
    } else {
      hardwareBottom.style.display = 'none';
    }
  }
}

// -----------------------------------------------------------------------------
// Global Window Event Handlers
// -----------------------------------------------------------------------------
window.navigate = function (screenKey) {
  state.currentScreen = screenKey;
  renderApp();
  // Scroll to top
  const scroller = document.querySelector('.screen-container');
  if (scroller) scroller.scrollTop = 0;
};

window.jumpToScreen = function (screenKey) {
  state.currentScreen = screenKey;
  state.isScreensDrawerOpen = false;
  renderApp();
  const scroller = document.querySelector('.screen-container');
  if (scroller) scroller.scrollTop = 0;
};

window.setDevice = function (deviceName) {
  state.device = deviceName;
  updateStudioControls();
};

window.setLanguage = function (lang) {
  state.language = lang;
  renderApp();
};

window.selectRole = function (role) {
  state.role = role;
  renderApp();
};

window.confirmRole = function () {
  if (state.role === 'worker') {
    state.currentScreen = 'worker_onboarding';
  } else {
    state.currentScreen = 'customer_onboarding';
  }
  renderApp();
};

window.toggleRole = function () {
  state.role = state.role === 'worker' ? 'customer' : 'worker';
  if (state.currentScreen === 'leads_discovery' || state.currentScreen === 'home') {
    renderApp();
  } else {
    state.currentScreen = state.role === 'worker' ? 'leads_discovery' : 'home';
    renderApp();
  }
};

window.submitMobile = function () {
  const input = document.getElementById('mobileNumberInput');
  if (input && input.value) {
    state.mobileNumber = input.value;
  }
  state.currentScreen = 'otp';
  renderApp();
};

window.selectCategory = function (catId) {
  state.selectedCategory = catId;
  state.currentScreen = 'post_job';
  renderApp();
};

window.startBooking = function (workerId) {
  state.currentScreen = 'active_tracking';
  renderApp();
};

window.callWorker = function (phone, name) {
  const choice = confirm(`Calling ${name} at ${phone} directly (0% commission direct dial)? Click OK to connect phone!`);
  if (choice) {
    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  }
};

window.broadcastJobSuccess = function () {
  alert('🎉 Job broadcasted to 24 nearby Tricity technicians in Sector 22 & Mohali! Receiving instant quotes...');
  state.currentScreen = 'compare_offers';
  renderApp();
};

window.viewLeadDetails = function (leadId) {
  state.currentScreen = 'lead_offer';
  renderApp();
};

window.sendOfferSuccess = function () {
  alert('✅ Your quote of ₹250 has been sent directly to Mrs. Sunita Sharma! Customer will call or confirm arrival.');
  state.currentScreen = 'active_tracking';
  renderApp();
};

window.acceptOffer = function (workerId) {
  alert('🎉 Offer Accepted! Technician is en-route with live GPS tracking.');
  state.currentScreen = 'active_tracking';
  renderApp();
};

window.nextCarouselSlide = function () {
  state.carouselSlide = (state.carouselSlide + 1) % 3;
  if (state.carouselSlide === 0) {
    state.currentScreen = 'home';
  }
  renderApp();
};

window.toggleVoiceRecording = function () {
  state.isRecordingVoice = !state.isRecordingVoice;
  const btn = document.getElementById('voiceRecordBtn');
  const duration = document.getElementById('voiceDuration');
  if (btn) {
    if (state.isRecordingVoice) {
      btn.style.background = '#EF4444';
      btn.innerHTML = ICONS.pause;
      if (duration) duration.textContent = 'REC 0:18...';
    } else {
      btn.style.background = '#00B074';
      btn.innerHTML = ICONS.mic;
      if (duration) duration.textContent = '0:18 ✓';
    }
  }
};

window.playAudioHelp = function () {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    let text = 'Welcome to KaamConnect. Zero platform commission. Connect directly with verified plumbers, electricians and technicians across Chandigarh, Mohali and Panchkula.';
    if (state.language === 'hi') {
      text = 'काम-कनेक्ट में आपका स्वागत है। शून्य प्रतिशत कमीशन। चंडीगढ़, मोहाली और पंचकूला में सीधे सत्यापित कारीगरों से संपर्क करें।';
    } else if (state.language === 'pa') {
      text = 'ਕਾਮ-ਕਨੈਕਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਬਿਨਾਂ ਕਿਸੇ ਕਮਿਸ਼ਨ ਤੋਂ ਚੰਡੀਗੜ੍ਹ, ਮੋਹਾਲੀ ਅਤੇ ਪੰਚਕੂਲਾ ਦੇ ਕਾਰੀਗਰਾਂ ਨਾਲ ਸਿੱਧਾ ਸੰਪਰਕ ਕਰੋ।';
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } else {
    alert('Audio assistance enabled!');
  }
};

window.playOtpAudio = function () {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance('Your KaamConnect verification code is 4, 9, 2, 1, 8, 5. आपका ओटीपी कोड है चार नौ दो एक आठ पांच।');
    window.speechSynthesis.speak(utter);
  } else {
    alert('OTP audio: 4-9-2-1-8-5');
  }
};

window.toggleScreensDrawer = function () {
  state.isScreensDrawerOpen = !state.isScreensDrawerOpen;
  renderScreensDrawer();
};

window.handleDrawerBackdropClick = function (e) {
  state.isScreensDrawerOpen = false;
  renderScreensDrawer();
};

// Initial boot
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  updateClock();
  setInterval(updateClock, 30000);
});
