// Pure helpers for the sector picker: flatten the server's city/area list, sort it the way people expect
// (Sector 2 before Sector 10), and search it forgivingly ("35", "sec 35", "ph 7", "mdc", "kharar").
import type { LocationCity } from '../api/types';

export interface SectorItem {
  id: number;
  name: string;
  cityId: number;
  /** "Chandigarh", "Mohali", "Panchkula" (the "(SAS Nagar)" suffix dropped) */
  city: string;
}

/** Quick picks shown before anyone types, by city name prefix. Only names that exist on the server are shown. */
export const POPULAR_SECTORS: Record<string, string[]> = {
  Chandigarh: ['Sector 15', 'Sector 22', 'Sector 35', 'Sector 43'],
  Mohali: ['Phase 3B2', 'Phase 5', 'Phase 7', 'Sector 70'],
  Panchkula: ['Sector 11', 'Sector 20', 'MDC Sector 4'],
};

export const shortCity = (name: string) => name.replace(/\s*\(.*\)/, '').trim();

/** The seeded per-city anchor for a locality the person types themself; never listed as a choice. */
export const OTHER_AREA_NAME = 'Other area';

/** Id of a city's "Other area" (by short city name: "Chandigarh", "Mohali", "Panchkula"), or null if not seeded. */
export function otherAreaId(cities: LocationCity[], city: string): number | null {
  const c = cities.find((x) => shortCity(x.name) === city);
  return c?.areas.find((a) => a.name === OTHER_AREA_NAME)?.id ?? null;
}

/** Cities that can take a typed locality (their "Other area" is seeded). */
export function citiesWithOtherArea(cities: LocationCity[]): string[] {
  return cities.filter((c) => c.areas.some((a) => a.name === OTHER_AREA_NAME)).map((c) => shortCity(c.name));
}

/** "Sector 2" < "Sector 10" < "Sector 12A"; words before numbers ("IT Park" after the sectors is fine). */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

export function flattenSectors(cities: LocationCity[]): SectorItem[] {
  return cities.flatMap((c) =>
    c.areas
      .filter((a) => a.name !== OTHER_AREA_NAME)
      .sort((x, y) => sectorRank(x.name) - sectorRank(y.name) || naturalCompare(x.name, y.name))
      .map((a) => ({ id: a.id, name: a.name, cityId: c.id, city: shortCity(c.name) })),
  );
}

/** Phases first (how Mohali is usually named), then sectors, then MDC, then named localities. */
function sectorRank(name: string): number {
  if (/^phase\b/i.test(name)) return 0;
  if (/^sector\b/i.test(name)) return 1;
  if (/^mdc\b/i.test(name)) return 2;
  return 3;
}

/** Lower-case, expand "sec"/"ph" abbreviations, squash spaces. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\bsec(tor)?\.?\s*/g, 'sector ')
    .replace(/\bph(ase)?\.?\s*/g, 'phase ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Items matching the query, best first: an exact number or name ("35" -> Sector 35, not Sector 135), then names that
 * start with it, then any word that starts with it, then anything containing it.
 */
export function searchSectors(items: SectorItem[], query: string): SectorItem[] {
  const q = normalise(query);
  if (!q) return items;
  // "35" must not find Sector 135: numbers only match from the start of a word
  const numberLike = /^\d/.test(q.split(' ').pop() ?? '');
  const scored: { item: SectorItem; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const name = normalise(item.name);
    const full = `${name} ${item.city.toLowerCase()}`;
    const words = full.split(' ');
    let score = -1;
    if (name === q || words.includes(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (words.some((w) => w.startsWith(q))) score = 2;
    else if (!numberLike && full.includes(q)) score = 3;
    if (score >= 0) scored.push({ item, score, index });
  });
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.item);
}

export function popularSectors(items: SectorItem[], city: string | null): SectorItem[] {
  return Object.entries(POPULAR_SECTORS)
    .filter(([c]) => !city || c === city)
    .flatMap(([c, names]) => names.map((n) => items.find((i) => i.city === c && i.name === n)))
    .filter((i): i is SectorItem => i !== undefined);
}

export function sectorLabel(item: Pick<SectorItem, 'name' | 'city'>): string {
  return `${item.name}, ${item.city}`;
}
