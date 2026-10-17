// Where a notification leads. Pure (no navigation, no React) so the mapping is unit-tested; the side effects
// (switch side, remember the job, navigate) live in utils/pushNotifications.ts.
//
// /tracking, /compare-offers and /job-progress take no route parameters: they follow `activeJobId` from the store.
import type { Href } from 'expo-router';
import type { NotificationType } from '../api/types';

export type NotificationSide = 'customer' | 'worker';

export interface NotificationTarget {
  /** Which side of the app the screen belongs to (a person with both profiles may be on the other one). */
  side: NotificationSide;
  href: Href;
  /** Becomes the active job before navigating; null for screens that do not follow a job. */
  jobId: string | null;
}

const WORKER_TYPES: ReadonlySet<NotificationType> = new Set(['NEW_LEAD', 'DIRECT_REQUEST', 'BOOKING_CONFIRMED']);

export function notificationSide(type: NotificationType): NotificationSide {
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
  const side = notificationSide(type as NotificationType);
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
      return { side, href: '/job-progress', jobId };
    default:
      return null;
  }
}
