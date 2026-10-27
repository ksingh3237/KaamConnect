// Travel radii a worker can pick. The server (worker.dto.ts SCHEDULED_RADII, BR-20) accepts 3/6/12/25/50 for future
// bookings and never a scheduled radius smaller than the live one; the live radius itself is 3, 6 or 12.
export const LIVE_RADII = [3, 6, 12] as const;
export const SCHEDULED_RADII = [3, 6, 12, 25, 50] as const;

/** The scheduled-radius choices that are allowed next to this live radius (never smaller than it). */
export function scheduledRadiusChoices(radiusKm: number): number[] {
  return SCHEDULED_RADII.filter((km) => km > radiusKm);
}

/** Keeps a chosen scheduled radius only while it is still larger than the live radius; otherwise it falls back to "same". */
export function reconcileScheduledRadius(scheduledKm: number | null, radiusKm: number): number | null {
  return scheduledKm !== null && scheduledKm > radiusKm ? scheduledKm : null;
}
