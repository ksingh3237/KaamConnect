// "Use current location" in the sector sheet: turn what a reverse geocoder says about the GPS fix into one of our areas.
// Pure on purpose (the expo-location / Google calls live in the component) so it can be tested.
import type { LocationCity } from '../api/types';
import type { ResolvedPlace } from './googlePlaces';
import { matchArea } from './placeMatch';
import type { SectorItem } from './sectors';

/** The fields expo-location's reverseGeocodeAsync returns that matter for matching. */
export interface ExpoAddress {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
}

/** Shape an expo-location address like a Google result so matchArea can read it. */
export function placeFromExpo(lat: number, lng: number, addresses: ExpoAddress[]): ResolvedPlace {
  const line = (a: ExpoAddress) => [a.name, a.street, a.district, a.city, a.subregion, a.region].filter((p): p is string => !!p && p.trim() !== '');
  const components = addresses.flatMap((a) => [
    ...(a.district ? [{ name: a.district, types: ['sublocality_level_1'] }] : []),
    ...(a.city ? [{ name: a.city, types: ['locality'] }] : []),
    ...(a.subregion ? [{ name: a.subregion, types: ['administrative_area_level_2'] }] : []),
    ...(a.region ? [{ name: a.region, types: ['administrative_area_level_1'] }] : []),
  ]);
  return { lat, lng, formattedAddress: addresses[0] ? line(addresses[0]).join(', ') : '', components };
}

/** Rejects with Error('TIMEOUT') if `promise` has not settled after `ms`: no GPS step may leave the sheet loading forever. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export type DetectedSector =
  | { kind: 'sector'; item: SectorItem }
  /** In a listed city but not a listed sector: the city's "Other area" plus the neighbourhood name. */
  | { kind: 'custom'; areaId: number; locality: string; city: string }
  | { kind: 'none' };

export function resolveDetected(locations: LocationCity[], items: SectorItem[], place: ResolvedPlace): DetectedSector {
  const match = matchArea(locations, place.components, place.formattedAddress);
  if (match.areaId === null) return { kind: 'none' };
  const item = items.find((i) => i.id === match.areaId);
  if (item) return { kind: 'sector', item };
  if (match.localityName && match.city) return { kind: 'custom', areaId: match.areaId, locality: match.localityName, city: match.city };
  return { kind: 'none' };
}
