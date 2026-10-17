// Pure helpers that turn a Google place (address components + formatted address) into one of our Tricity areas.
// Google gives free text ("Sector 22-A, Chandigarh"); the server wants an areaId from GET /locations, so we match by
// name. A place in a city but outside the listed sectors falls back to that city's seeded "Other area" plus the
// neighbourhood name as the typed locality, exactly like the manual "Add custom area" flow.
import type { LocationCity } from '../api/types';
import { OTHER_AREA_NAME, shortCity } from './sectors';

export interface GeoComponent {
  name: string;
  types: string[];
}

export interface AreaMatch {
  /** null when the place is outside Tricity or no area could be matched. */
  areaId: number | null;
  localityName: string | null;
  /** Short city name ("Chandigarh", "Mohali", "Panchkula") when one was recognised. */
  city: string | null;
}

/** The Tricity box used to restrict search and to reject pins dropped elsewhere. */
export const TRICITY_BOUNDS = { south: 30.6, west: 76.6, north: 30.88, east: 76.98 } as const;
export const TRICITY_CENTER = { lat: 30.7333, lng: 76.7794 } as const;

export function inTricity(lat: number, lng: number): boolean {
  return lat >= TRICITY_BOUNDS.south && lat <= TRICITY_BOUNDS.north && lng >= TRICITY_BOUNDS.west && lng <= TRICITY_BOUNDS.east;
}

const CITY_PATTERNS: [string, RegExp][] = [
  ['Mohali', /mohali|sahibzada|s\.?\s?a\.?\s?s\.?\s+nagar|kharar|zirakpur/i],
  ['Panchkula', /panchkula/i],
  ['Chandigarh', /chandigarh/i],
];

/** The short city name in `text`: the Tricity aliases first (Kharar is Mohali), then any other city the server lists. */
function cityFrom(text: string, locations: LocationCity[]): string | null {
  const aliased = CITY_PATTERNS.find(([, re]) => re.test(text))?.[0];
  if (aliased) return aliased;
  const lower = text.toLowerCase();
  return locations.map((c) => shortCity(c.name)).find((name) => name !== '' && lower.includes(name.toLowerCase())) ?? null;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Areas named like a sector, phase or MDC sector: matched by number (areaKeys), not by name. */
const SECTOR_LIKE = /^(sector|phase|mdc)\b/i;

/** "Sector 22-A" -> sector22a, "Phase-3B2" -> phase3b2; MDC addresses try "mdcsectorN" first. */
export function areaKeys(text: string): string[] {
  const keys: string[] = [];
  const mdc = /\bmdc\b/i.test(text);
  for (const m of text.matchAll(/\bsec(?:tor)?\.?\s*[-.]?\s*(\d+(?:-?[a-z])?)(?![a-z])/gi)) {
    if (mdc) keys.push(`mdcsector${squash(m[1]!)}`);
    keys.push(`sector${squash(m[1]!)}`);
  }
  // "Industrial Area Phase 1" is an industrial estate, not Mohali's residential Phase 1
  const phases = text.replace(/\bindustrial\s+area\s*,?\s*phase\.?\s*[-.]?\s*\d+[a-z]?\d*/gi, ' ');
  for (const m of phases.matchAll(/\bphase\.?\s*[-.]?\s*(\d+[a-z]?\d*)(?![a-z])/gi)) keys.push(`phase${squash(m[1]!)}`);
  return keys;
}

const isLocalitySource = (c: GeoComponent) => c.types.some((t) => t.startsWith('sublocality') || t === 'neighborhood');

export function matchArea(locations: LocationCity[], components: GeoComponent[], formattedAddress: string): AreaMatch {
  const cityComponent = components.find((c) => c.types.includes('locality'));
  const city =
    (cityComponent ? cityFrom(cityComponent.name, locations) : null) ??
    cityFrom(components.filter((c) => c.types.some((t) => t.startsWith('administrative_area_level_'))).map((c) => c.name).join(' | '), locations) ??
    cityFrom(formattedAddress, locations);

  // Most specific text first: the neighbourhood components, then the whole address, then the rest
  const sources = [...components.filter(isLocalitySource).map((c) => c.name), formattedAddress, ...components.map((c) => c.name)];
  const keys = [...new Set(sources.flatMap(areaKeys))];

  const cities = city ? locations.filter((c) => shortCity(c.name) === city) : locations;
  // A named area ("Manimajra", "Zirakpur", "Industrial Area Phase 1") is matched by its exact name, before the sector /
  // phase keys, so "Industrial Area Phase 1" is not read as Mohali's "Phase 1"
  const named = cities.flatMap((c) =>
    c.areas.filter((a) => a.name !== OTHER_AREA_NAME && !SECTOR_LIKE.test(a.name)).map((a) => ({ id: a.id, key: squash(a.name), city: shortCity(c.name) })),
  );
  for (const name of new Set([...components.filter(isLocalitySource), ...components].map((c) => squash(c.name)))) {
    const hits = named.filter((n) => n.key === name);
    if (hits.length === 1) return { areaId: hits[0]!.id, localityName: null, city: hits[0]!.city };
  }
  for (const key of keys) {
    const hits = cities.flatMap((c) => c.areas.filter((a) => a.name !== OTHER_AREA_NAME && squash(a.name) === key).map((a) => ({ id: a.id, city: shortCity(c.name) })));
    // Without a recognised city, "Sector 22" exists in all three: only accept an unambiguous hit
    if (hits.length === 1) return { areaId: hits[0]!.id, localityName: null, city: hits[0]!.city };
  }

  if (!city) return { areaId: null, localityName: null, city: null };
  const other = cities[0]?.areas.find((a) => a.name === OTHER_AREA_NAME);
  if (!other) return { areaId: null, localityName: null, city };
  const raw = components.find(isLocalitySource)?.name ?? formattedAddress.split(',')[0] ?? '';
  const locality = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
  return { areaId: other.id, localityName: locality.length >= 2 ? locality : null, city };
}

/** The address line we send: Google's text without the trailing country, within the server's 200 characters. */
export function cleanLine(formattedAddress: string): string {
  return formattedAddress.replace(/,\s*India\s*$/i, '').trim().slice(0, 200);
}
