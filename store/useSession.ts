// Who is signed in. The tokens live in api/client.ts (and secure storage); this store holds what the screens need to
// decide where to go, and the actions that change it.
import { create } from 'zustand';
import * as endpoints from '../api/endpoints';
import { getRefreshToken, hasTokens, onSessionEnded, restoreTokens, setTokens } from '../api/client';
import { isApiError } from '../api/errors';
import { getWidgetClient, isMsg91WidgetConfigured } from '../api/msg91';
import type { CustomerView, MeView, OtpRequestResult, SessionUser, VerifyResult, WorkerView } from '../api/types';
import { loadRole } from '../api/storage';
import { resolveRole } from '../utils/session-routing';
import { disconnectSocket } from '../api/socket';
import { stopTracking } from '../utils/workerTracking';
import { useStore } from './useStore';

export type SessionStatus =
  | 'booting' // reading the stored login
  | 'signedOut'
  | 'signedIn'
  | 'unreachable'; // a stored login exists but the server could not be reached

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  me: MeView | null;
  /** Full profiles, present once the person has set them up. */
  customerProfile: CustomerView | null;
  workerProfile: WorkerView | null;
  /** Set by the server only when it runs with the development OTP bypass; shown as a banner on the OTP screens. */
  devNotice: string | null;
  resendAfterSec: number;
  /** Digits in the code the person types: 6 for the backend's own OTP, the widget's setting for MSG91. */
  otpLength: number;

  bootstrap: () => Promise<void>;
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
  /** Asks for the same code again (MSG91: its retry, on the same request; otherwise a fresh request). */
  resendOtp: (phone: string) => Promise<OtpRequestResult>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean; user: SessionUser }>;
  refreshMe: () => Promise<MeView | null>;
  signOut: () => Promise<void>;
  /** Used after account deletion: the server already ended the login. */
  clearLocal: () => Promise<void>;
}

/** The full profiles behind /me (addresses, trades, photo, documents). A failure leaves that profile null; screens refetch. */
async function loadProfiles(me: MeView): Promise<{ customerProfile: CustomerView | null; workerProfile: WorkerView | null }> {
  const [customerProfile, workerProfile] = await Promise.all([
    me.customer ? endpoints.getCustomer().catch(() => null) : Promise.resolve(null),
    me.worker ? endpoints.getWorkerProfile().catch(() => null) : Promise.resolve(null),
  ]);
  return { customerProfile, workerProfile };
}

/** A login ended: nothing may keep sharing the person's location or listening on their behalf. */
function endRealtime(): void {
  stopTracking();
  disconnectSocket();
}

export const useSession = create<SessionState>((set, get) => {
  /** Stores the tokens and signs in. Shared by every sign-in door so the steps (and their order) never differ. */
  const finishSignIn = async (result: VerifyResult) => {
    await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    set({ status: 'signedIn', user: result.user });
    try {
      const me = await endpoints.getMe();
      set({ me, ...(await loadProfiles(me)) });
    } catch {
      /* the screens refetch; the login itself succeeded */
    }
    return { isNewUser: result.isNewUser, user: result.user };
  };

  // The access token from a correct code, held in memory only until our server has accepted or refused it. If the
  // server cannot be reached right after a correct code, a retry reuses it instead of costing the person a second SMS.
  let pendingMsg91Token: string | null = null;

  /** The access token proves nothing by itself: only our server, asking MSG91, can say whose number it is. */
  const signInWithMsg91Token = async (accessToken: string) => {
    pendingMsg91Token = accessToken;
    try {
      const signedIn = await finishSignIn(await endpoints.msg91Verify(accessToken));
      pendingMsg91Token = null;
      return signedIn;
    } catch (error) {
      const outage = isApiError(error) && (error.code === 'NETWORK' || error.code === 'TIMEOUT' || error.status >= 500);
      if (!outage) pendingMsg91Token = null; // refused or invalid: it will never work, do not reuse it
      throw error;
    }
  };

  return {
  status: 'booting',
  user: null,
  me: null,
  customerProfile: null,
  workerProfile: null,
  devNotice: null,
  resendAfterSec: 30,
  otpLength: 6,

  bootstrap: async () => {
    onSessionEnded(() => {
      endRealtime();
      set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null });
    });
    const found = await restoreTokens();
    if (!found) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      const me = await endpoints.getMe();
      const profiles = await loadProfiles(me);
      // Reopen the side used last time, but never one this person has no profile for (a worker-only account
      // must not land on the customer home after a restart, and the other way round)
      useStore.getState().setRole(resolveRole(await loadRole(), me.customer !== null, me.worker !== null));
      set({
        status: 'signedIn',
        me,
        ...profiles,
        user: { id: me.id, phone: me.phone, language: me.language, hasCustomerProfile: me.customer !== null, hasWorkerProfile: me.worker !== null },
      });
    } catch (error) {
      if (isApiError(error) && (error.code === 'NETWORK' || error.code === 'TIMEOUT')) {
        set({ status: 'unreachable' });
        return;
      }
      // 401 after a failed refresh already signed us out through the handler; anything else: treat as signed out
      if (!hasTokens()) set({ status: 'signedOut', user: null, me: null });
      else set({ status: 'unreachable' });
    }
  },

  requestOtp: async (phone) => {
    if (isMsg91WidgetConfigured()) {
      pendingMsg91Token = null; // a new request (maybe another number) must not inherit an old proof
      const { settings, outcome } = await getWidgetClient().start(phone);
      if (outcome.kind === 'verified') {
        // Invisible OTP: MSG91 verified the number without a code. Our server still has to confirm the token.
        await signInWithMsg91Token(outcome.accessToken);
        return { resendAfterSec: settings.retryTimeSec, expiresInSec: settings.expiryMin * 60, otpLength: settings.otpLength, signedIn: true };
      }
      const result = { resendAfterSec: settings.retryTimeSec, expiresInSec: settings.expiryMin * 60, otpLength: settings.otpLength };
      set({ devNotice: null, resendAfterSec: result.resendAfterSec, otpLength: result.otpLength });
      return result;
    }
    const result = await endpoints.requestOtp(phone);
    set({ devNotice: result.devNotice ?? null, resendAfterSec: result.resendAfterSec, otpLength: 6 });
    return result;
  },

  resendOtp: async (phone) => {
    if (!isMsg91WidgetConfigured()) return get().requestOtp(phone);
    const settings = getWidgetClient().settings();
    await getWidgetClient().retry();
    const resendAfterSec = settings?.retryTimeSec ?? get().resendAfterSec;
    return { resendAfterSec, expiresInSec: (settings?.expiryMin ?? 15) * 60, otpLength: get().otpLength };
  },

  verifyOtp: async (phone, code) => {
    if (isMsg91WidgetConfigured()) {
      if (pendingMsg91Token) return signInWithMsg91Token(pendingMsg91Token);
      return signInWithMsg91Token(await getWidgetClient().verify(code));
    }
    return finishSignIn(await endpoints.verifyOtp(phone, code));
  },

  refreshMe: async () => {
    try {
      const me = await endpoints.getMe();
      const profiles = await loadProfiles(me);
      set({
        me,
        ...profiles,
        user: { id: me.id, phone: me.phone, language: me.language, hasCustomerProfile: me.customer !== null, hasWorkerProfile: me.worker !== null },
      });
      return me;
    } catch {
      return get().me;
    }
  },

  signOut: async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await endpoints.logout(refresh);
    } catch {
      /* best effort: the local login is cleared either way */
    }
    endRealtime();
    await setTokens(null);
    set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null });
  },

  clearLocal: async () => {
    endRealtime();
    await setTokens(null);
    set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null });
  },
  };
});
