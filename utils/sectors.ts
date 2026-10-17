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

/** True when `areaId` is some city's "Other area": the choice only means something together with a typed locality. */
export function isOtherArea(cities: LocationCity[], areaId: number | null): boolean {
  return areaId !== null && cities.some((c) => c.areas.some((a) => a.id === areaId && a.name === OTHER_AREA_NAME));
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
    .replace(/\bsec(tor)?(?![a-z])\.?\s*/g, 'sector ')
    .replace(/\bph(ase)?(?![a-z])\.?\s*/g, 'phase ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface SearchForm {
  name: string;
  full: string;
  words: string[];
}
// Normalising every name on every keystroke is what makes a long list slow: do it once per item
const forms = new WeakMap<SectorItem, SearchForm>();
function searchForm(item: SectorItem): SearchForm {
  let form = forms.get(item);
  if (!form) {
    const name = normalise(item.name);
    const full = `${name} ${item.city.toLowerCase()}`;
    form = { name, full, words: full.split(' ') };
    forms.set(item, form);
  }
  return form;
}

/**
 * Items matching the query, best first: an exact number or name ("35" -> Sector 35, not Sector 135), then names that
 * start with it, then any word that starts with it, then anything containing it.
 */
export function searchSectors(items: SectorItem[], query: string): SectorItem[] {
  const q = normalise(query);
  if (!q) return items;
  const tokens = q.split(' ');
  // "35" must not find Sector 135: numbers only match from the start of a word
  const numberLike = /^\d/.test(tokens[tokens.length - 1] ?? '');
  const scored: { item: SectorItem; score: number; index: number }[] = [];
  items.forEach((item, index) => {
    const { name, full, words } = searchForm(item);
    let score = -1;
    if (name === q || words.includes(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (words.some((w) => w.startsWith(q))) score = 2;
    // "model town ludhiana", "sector 35 chandigarh": every typed word starts some word of the sector or its city
    else if (tokens.length > 1 && tokens.every((t) => words.some((w) => w.startsWith(t)))) score = 3;
    else if (!numberLike && full.includes(q)) score = 4;
    // "ludhiyana", "sectar 35": one slip in a word of 4+ letters is forgiven
    else if (tokens.every((t) => words.some((w) => w.startsWith(t) || isTypo(w, t)))) score = 5;
    if (score >= 0) scored.push({ item, score, index });
  });
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.item);
}

/** True when `typed` is a word of 4+ letters that is one edit (insert, delete, replace, swap) away from `word`. */
function isTypo(word: string, typed: string): boolean {
  if (typed.length < 4 || /\d/.test(typed) || Math.abs(word.length - typed.length) > 1) return false;
  let i = 0;
  while (i < word.length && i < typed.length && word[i] === typed[i]) i++;
  if (i === word.length && i === typed.length) return true;
  const rest = (s: string, from: number) => s.slice(from);
  if (word.length === typed.length) {
    return rest(word, i + 1) === rest(typed, i + 1) || (word[i] === typed[i + 1] && word[i + 1] === typed[i] && rest(word, i + 2) === rest(typed, i + 2));
  }
  return word.length > typed.length ? rest(word, i + 1) === rest(typed, i) : rest(word, i) === rest(typed, i + 1);
}

export function popularSectors(items: SectorItem[], city: string | null): SectorItem[] {
  return Object.entries(POPULAR_SECTORS)
    .filter(([c]) => !city || c === city)
    .flatMap(([c, names]) => names.map((n) => items.find((i) => i.city === c && i.name === n)))
    .filter((i): i is SectorItem => i !== undefined);
}

/** The one-tap row under the sector field, as [city, name]; add a city's favourites here as it launches. */
export const QUICK_PICKS: [string, string][] = [
  ['Chandigarh', 'Sector 15'],
  ['Chandigarh', 'Sector 22'],
  ['Chandigarh', 'Sector 35'],
  ['Mohali', 'Phase 7'],
  ['Panchkula', 'Sector 20'],
];

/** Up to `limit` quick picks that exist on the server, topped up from the popular list if some are missing. */
export function quickPicks(items: SectorItem[], limit = 5): SectorItem[] {
  const picks = QUICK_PICKS.flatMap(([c, n]) => items.find((i) => i.city === c && i.name === n) ?? []);
  const extra = popularSectors(items, null).filter((i) => !picks.includes(i));
  return [...picks, ...extra].slice(0, limit);
}

/** City names that have at least one listed area, in the server's order: the sheet's city chips. */
export function cityNames(items: SectorItem[]): string[] {
  return [...new Set(items.map((i) => i.city))];
}

/** What the area list shows: a heading or a sector. */
export type SectorRow = { kind: 'header'; key: string; title: string } | { kind: 'item'; key: string; item: SectorItem };

/** "Phases", "Sectors", "MDC", "Areas": the sub-headings inside one city. */
export function sectorGroup(name: string): string {
  return ['Phases', 'Sectors', 'MDC sectors', 'Areas'][sectorRank(name)]!;
}

/**
 * Rows for the list with headings: `city` puts a heading before each city, `group` one before Phases / Sectors / Areas,
 * `none` is a plain list (search results, ranked by match, show their city on the row instead).
 */
export function buildRows(items: SectorItem[], headings: 'none' | 'city' | 'group'): SectorRow[] {
  const rows: SectorRow[] = [];
  let last = '';
  for (const item of items) {
    if (headings !== 'none') {
      const title = headings === 'city' ? item.city : sectorGroup(item.name);
      const key = headings === 'city' ? item.city : title;
      if (key !== last) {
        rows.push({ kind: 'header', key: `h:${key}`, title });
        last = key;
      }
    }
    rows.push({ kind: 'item', key: `i:${item.id}`, item });
  }
  return rows;
}

export function sectorLabel(item: Pick<SectorItem, 'name' | 'city'>): string {
  return `${item.name}, ${item.city}`;
}
