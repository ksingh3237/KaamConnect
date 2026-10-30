import { t } from '../i18n';
// Small pure helpers behind live tracking: how far the worker moved, which way they face, which icon fits their
// vehicle, what the customer's status pill says and which URL opens turn-by-turn navigation. No React, no native
// modules, so they are unit tested (trip.test.ts).
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass heading from one point to another in degrees (0 = north, 90 = east). */
export function bearingDeg(from: LatLng, to: LatLng): number {
  const dLng = rad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(rad(to.lat));
  const x = Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) - Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/** Below this the GPS wobble is bigger than the movement, so the heading is kept instead of spinning the arrow. */
export const MIN_HEADING_MOVE_M = 5;

/** The new heading, or the previous one when the worker has barely moved. */
export function nextHeading(previous: LatLng | null, next: LatLng, current: number): number {
  if (!previous) return current;
  if (distanceKm(previous, next) * 1000 < MIN_HEADING_MOVE_M) return current;
  return bearingDeg(previous, next);
}

/** The emoji that stands for the worker's vehicle on the map (the free-text `vehicle` field of their profile). */
export function vehicleEmoji(vehicle: string | null | undefined): string {
  const v = (vehicle ?? '').toLowerCase();
  if (/\b(e-?rickshaw|rickshaw|auto|tuk)\b/.test(v)) return '🛺';
  if (/\b(cycle|bicycle|bike cycle)\b/.test(v)) return '🚲';
  if (/\b(car|sedan|suv|hatchback|van|swift|alto|innova|bolero|maruti)\b/.test(v)) return '🚗';
  if (/\b(truck|tempo|pickup|mini ?truck)\b/.test(v)) return '🛻';
  if (/\b(scooter|scooty|activa|moped)\b/.test(v)) return '🛵';
  if (/\b(bike|motorcycle|motorbike|splendor|pulsar|hero|honda|bullet)\b/.test(v)) return '🏍️';
  if (/\b(walk|foot)\b/.test(v)) return '🚶';
  return '🛵';
}

/** Used only when the routing service gave no driving time of its own. Same figure as the server's AVG_SPEED_KMH. */
export const FALLBACK_SPEED_KMH = 20;

/** What the map and the status line quote: how far along the road, and how long that takes. */
export interface RoadTrip {
  /** Road kilometres still to drive, to one decimal. */
  distanceKm: number;
  /** Whole minutes, never below 1 (the same floor the server uses). */
  etaMinutes: number;
}

/**
 * The numbers for the part of the route still ahead. The service's own driving time covers the WHOLE route, so it is
 * scaled by how much of the road is left; without one, the fallback speed stands in. This is what replaced the
 * straight-line estimate: in a grid like the Tricity the road is routinely a third longer than the crow's flight.
 */
export function roadTrip(total: { distanceKm: number | null; durationMinutes: number | null }, remainingKm: number): RoadTrip {
  const left = Math.max(0, remainingKm);
  const paced =
    total.durationMinutes !== null && total.distanceKm !== null && total.distanceKm > 0
      ? (total.durationMinutes * left) / total.distanceKm
      : (left / FALLBACK_SPEED_KMH) * 60;
  return { distanceKm: Math.round(left * 10) / 10, etaMinutes: Math.max(1, Math.ceil(paced)) };
}

export interface PillInput {
  status: string;
  hasLocation: boolean;
  stale: boolean;
  etaMinutes: number | null;
  distanceKm: number | null;
  /** "3 min ago" style text for a stale fix. */
  lastSeen?: string;
}

/** Within this, the worker is at the address rather than on the way to it (the fix's own accuracy is of that order). */
export const AT_THE_DOOR_KM = 0.1;

/** The floating line on the customer's tracking map. */
export function trackingPill(input: PillInput): string {
  if (['ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED', 'COMPLETED'].includes(input.status)) return `📍 ${t('Worker has arrived at your location')}`;
  if (input.status !== 'ASSIGNED') return '';
  if (!input.hasLocation) return `⏳ ${t('Worker on the way • Updating live location...')}`;
  if (input.stale) return `⏳ ${t('Worker on the way • location last seen {ago}', { ago: input.lastSeen ?? t('a while ago') })}`;
  // Close enough that "arriving in 1 min" is useless: what the customer needs is the arrival code in their hand
  if (input.distanceKm !== null && input.distanceKm <= AT_THE_DOOR_KM) return `🚪 ${t('Your worker is at your door • have the arrival code ready')}`;
  if (input.etaMinutes === null) return `⚡ ${t('Worker is on the way • live location on the map')}`;
  return input.distanceKm !== null
    ? `⚡ ${t('Arriving in {min} min • {km} km away', { min: input.etaMinutes, km: input.distanceKm })}`
    : `⚡ ${t('Arriving in {min} min', { min: input.etaMinutes })}`;
}

/** Turn-by-turn navigation. Android opens the Google Maps navigation screen; everything else gets the universal link. */
export function navigationUrls(destination: LatLng | null, addressText: string | null | undefined, android: boolean): string[] {
  const web = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
  if (destination) {
    const point = `${destination.lat},${destination.lng}`;
    return android ? [`google.navigation:q=${point}&mode=d`, web(point)] : [web(point)];
  }
  const text = (addressText ?? '').trim();
  if (!text) return [];
  return android ? [`google.navigation:q=${encodeURIComponent(text)}&mode=d`, web(encodeURIComponent(text))] : [web(encodeURIComponent(text))];
}
