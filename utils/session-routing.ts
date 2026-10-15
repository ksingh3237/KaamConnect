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
  // Both land on Home: it shows the customer marketplace or the worker dashboard depending on the role
  return { href: '/(tabs)/home', role };
}

export const profileOf = (me: MeView) => ({ hasCustomerProfile: me.customer !== null, hasWorkerProfile: me.worker !== null });

/** Screens a signed-out person may see. Everything else needs a login. */
export const PUBLIC_SEGMENTS = new Set(['', 'index', 'language', 'login', 'otp', 'carousel', 'legal']);

/** Public screens a signed-in person may also open (from the app's menu) without being sent to their marketplace. */
export const OPEN_TO_ALL_SEGMENTS = new Set(['language', 'legal']);

/**
 * The role to open with after a restart: the remembered one if the person has that profile, otherwise the one they
 * do have. Someone with neither keeps the remembered (or default) role until they finish setup.
 */
export function resolveRole(remembered: UserRole | null, hasCustomer: boolean, hasWorker: boolean): UserRole {
  const wanted: UserRole = remembered ?? 'customer';
  if (wanted === 'worker' && !hasWorker && hasCustomer) return 'customer';
  if (wanted === 'customer' && !hasCustomer && hasWorker) return 'worker';
  return wanted;
}
