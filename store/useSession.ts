// Who is signed in. The tokens live in api/client.ts (and secure storage); this store holds what the screens need to
// decide where to go, and the actions that change it.
import { create } from 'zustand';
import * as endpoints from '../api/endpoints';
import { getRefreshToken, hasTokens, onSessionEnded, restoreTokens, setTokens } from '../api/client';
import { isApiError } from '../api/errors';
import type { CustomerView, MeView, OtpRequestResult, SessionUser, WorkerView } from '../api/types';

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

  bootstrap: () => Promise<void>;
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
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

export const useSession = create<SessionState>((set, get) => ({
  status: 'booting',
  user: null,
  me: null,
  customerProfile: null,
  workerProfile: null,
  devNotice: null,
  resendAfterSec: 30,

  bootstrap: async () => {
    onSessionEnded(() => set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null }));
    const found = await restoreTokens();
    if (!found) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      const me = await endpoints.getMe();
      const profiles = await loadProfiles(me);
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
    const result = await endpoints.requestOtp(phone);
    set({ devNotice: result.devNotice ?? null, resendAfterSec: result.resendAfterSec });
    return result;
  },

  verifyOtp: async (phone, code) => {
    const result = await endpoints.verifyOtp(phone, code);
    await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    set({ status: 'signedIn', user: result.user });
    try {
      const me = await endpoints.getMe();
      set({ me, ...(await loadProfiles(me)) });
    } catch {
      /* the screens refetch; the login itself succeeded */
    }
    return { isNewUser: result.isNewUser, user: result.user };
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
    await setTokens(null);
    set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null });
  },

  clearLocal: async () => {
    await setTokens(null);
    set({ status: 'signedOut', user: null, me: null, customerProfile: null, workerProfile: null });
  },
}));
