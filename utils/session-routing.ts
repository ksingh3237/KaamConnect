// Where a signed-in person should land, decided from what the server says about their profiles.
import type { Href } from 'expo-router';
import type { MeView, SessionUser } from '../api/types';
import type { UserRole } from '../store/useStore';

export interface Destination {
  href: Href;
  /** The role to select, or null to keep the current one. */
  role: UserRole | null;
}

/** Someone with no profile yet chooses a role and fills it in; someone with a profile goes to the marketplace. */
export function destinationFor(profile: Pick<SessionUser, 'hasCustomerProfile' | 'hasWorkerProfile'>, currentRole: UserRole): Destination {
  const { hasCustomerProfile: customer, hasWorkerProfile: worker } = profile;
  if (!customer && !worker) return { href: '/role', role: null };
  // Someone with both profiles keeps the role they last used; otherwise the one profile they have.
  const role: UserRole = customer && worker ? currentRole : customer ? 'customer' : 'worker';
  return { href: role === 'worker' ? '/(tabs)/leads' : '/(tabs)/home', role };
}

export const profileOf = (me: MeView) => ({ hasCustomerProfile: me.customer !== null, hasWorkerProfile: me.worker !== null });

/** Screens a signed-out person may see. Everything else needs a login. */
export const PUBLIC_SEGMENTS = new Set(['', 'index', 'language', 'login', 'otp', 'carousel']);
