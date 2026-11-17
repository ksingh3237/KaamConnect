// Post Job's early warning: is any worker there for this service, place and time? The server answers (GET
// /jobs/availability); this builds the question from what the form holds and says the answer in words. Advisory only:
// the customer can always post.
import type { JobTiming, ServiceAvailability } from '../api/types';
import { t } from '../i18n';

export interface AvailabilityQuery {
  categoryId: string;
  areaId: number;
  lat?: number;
  lng?: number;
  timing: JobTiming;
  scheduledFor?: string;
}

/**
 * The question for the form as it stands, or null while it cannot be asked yet (no service, or no place chosen).
 * The time is the appointment hour for Afternoon / Tomorrow, so a worker booked now but free then counts as free.
 */
export function availabilityQuery(form: {
  categoryId: string | null;
  areaId: number | null;
  coords: { lat: number | null; lng: number | null } | null;
  timing: JobTiming;
  slotIso: string | null;
}): AvailabilityQuery | null {
  if (!form.categoryId || form.areaId === null) return null;
  const { lat, lng } = form.coords ?? { lat: null, lng: null };
  return {
    categoryId: form.categoryId,
    areaId: form.areaId,
    ...(lat !== null && lng !== null ? { lat, lng } : {}),
    timing: form.timing,
    ...(form.timing !== 'IMMEDIATE' && form.slotIso ? { scheduledFor: form.slotIso } : {}),
  };
}

/** What to tell the customer; null when someone is available (nothing to warn about). */
export function availabilityNotice(state: ServiceAvailability['state'] | null): { title: string; hint: string } | null {
  switch (state) {
    case 'NONE':
      return {
        title: t('Service Unavailable'),
        hint: t('No worker offers this service in this area yet. You can still post your request.'),
      };
    case 'ALL_BUSY':
      return {
        title: t('Currently Temporarily Unavailable'),
        hint: t('Workers for this service are offline or booked at this time. You can still post, and they will see it.'),
      };
    default:
      return null;
  }
}
