// Where a notification leads. Pure (no navigation, no React) so the mapping is unit-tested; the side effects
// (switch side, remember the job, navigate) live in utils/pushNotifications.ts.
//
// /tracking, /compare-offers and /job-progress take no route parameters: they follow `activeJobId` from the store.
import type { Href } from 'expo-router';

export type NotificationSide = 'customer' | 'worker';

export interface NotificationTarget {
  /** Which side of the app the screen belongs to (a person with both profiles may be on the other one). */
  side: NotificationSide;
  href: Href;
  /** Becomes the active job before navigating; null for screens that do not follow a job. */
  jobId: string | null;
}

// TRIP_RETURN is the app's own ongoing "come back from Google Maps" notification (utils/tripReturn.ts), not a server type.
const WORKER_TYPES: ReadonlySet<string> = new Set<string>([
  'TRIP_RETURN',
  'NEW_LEAD',
  'DIRECT_REQUEST',
  'BOOKING_CONFIRMED',
  'JOB_CANCELLED_BY_CUSTOMER',
  'JOB_YOU_ARE_LATE',
  'JOB_NO_SHOW_RELEASED',
]);

export function notificationSide(type: string): NotificationSide {
  return WORKER_TYPES.has(type) ? 'worker' : 'customer';
}

/** The jobId the server put in the notification's data, if it is a usable string. */
export function jobIdOf(data: Record<string, unknown> | null | undefined): string | null {
  const id = data?.jobId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Null when the notification is unknown (a newer server) or lacks the job it points at: the app then just opens the inbox. */
export function notificationTarget(type: string, data: Record<string, unknown> | null | undefined): NotificationTarget | null {
  const jobId = jobIdOf(data);
  if (!jobId) return null;
  const side = notificationSide(type);
  switch (type) {
    case 'NEW_LEAD':
    case 'DIRECT_REQUEST':
      return { side, href: { pathname: '/lead-offer', params: { id: jobId } }, jobId: null };
    case 'NEW_QUOTE':
      return { side, href: '/compare-offers', jobId };
    case 'WORKER_EN_ROUTE':
    case 'WORKER_ARRIVED':
      return { side, href: '/tracking', jobId };
    case 'BOOKING_CONFIRMED':
    case 'BILL_CREATED':
    case 'WORK_COMPLETED':
    case 'JOB_NO_SHOW_RELEASED':
      // A re-opened job has left the worker's list (it is open to others again), so there is nothing to open: go Home.
      // A closed one (a direct booking) stays on their cancelled tab. The pushed flag is the text "true", the inbox keeps the boolean.
      return data?.reopened === true || data?.reopened === 'true' ? { side, href: '/(tabs)/home', jobId: null } : { side, href: '/job-progress', jobId };
    case 'TRIP_RETURN': // the worker tapping their way back out of Google Maps
    case 'JOB_YOU_ARE_LATE':
    case 'JOB_CANCELLED_BY_CUSTOMER': // job progress shows the worker the cancelled summary: who, why, any visit fee
      return { side, href: '/job-progress', jobId };
    case 'JOB_WORKER_LATE':
    case 'DIRECT_DECLINED':
    case 'DIRECT_EXPIRED':
      return { side, href: '/tracking', jobId }; // the cancelled screen says who did not answer and offers another worker
    case 'JOB_CANCELLED_BY_WORKER':
      // Re-opened: the customer's next step is choosing another quote. Closed: the tracking screen explains why.
      // A pushed flag arrives as the text "true" (FCM data is all strings); the inbox row keeps the real boolean.
      return { side, href: data?.reopened === true || data?.reopened === 'true' ? '/compare-offers' : '/tracking', jobId };
    default:
      return null;
  }
}
