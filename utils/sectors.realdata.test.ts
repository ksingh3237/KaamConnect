// Opt-in check of the picker helpers against the REAL GET /locations data (never invented sectors).
//   Make the snapshot (read-only):  node <script> locations.json   -> [{ id, name, areas: [{ id, name }] }]
//   Run:  LOCATIONS_SNAPSHOT=/path/to/locations.json npx vitest run utils/sectors.realdata.test.ts
// Without the variable the whole file is skipped, so CI and normal runs are unaffected.
import { describe, expect, it } from 'vitest';
import type { LocationCity } from '../api/types';
import { placeFromExpo, resolveDetected } from './currentSector';
import { OTHER_AREA_NAME, QUICK_PICKS, cityNames, citiesWithOtherArea, flattenSectors, otherAreaId, quickPicks, searchSectors, shortCity } from './sectors';

const file = process.env.LOCATIONS_SNAPSHOT;
// A dynamic JSON import, so this file needs no Node type definitions (the app's tsconfig has none)
const locations: LocationCity[] = file ? ((await import(/* @vite-ignore */ file)) as { default: LocationCity[] }).default : [];

describe.skipIf(!file)('picker helpers on the real backend areas', () => {
  const items = flattenSectors(locations);
  const cityOf = new Map(locations.flatMap((c) => c.areas.map((a) => [a.id, shortCity(c.name)] as const)));

  it('lists every city with its own "Other area" and every other area exactly once', () => {
    expect(cityNames(items)).toEqual(locations.map((c) => shortCity(c.name)));
    expect(citiesWithOtherArea(locations)).toEqual(cityNames(items));
    const listed = locations.reduce((n, c) => n + c.areas.filter((a) => a.name !== OTHER_AREA_NAME).length, 0);
    expect(items).toHaveLength(listed);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const c of locations) expect(cityOf.get(otherAreaId(locations, shortCity(c.name))!)).toBe(shortCity(c.name));
  });

  it('every configured quick pick exists with its own city, and only valid ids are offered', () => {
    for (const [city, name] of QUICK_PICKS) {
      const hit = items.find((i) => i.city === city && i.name === name);
      expect(hit, `${city} / ${name} is not in the backend list`).toBeDefined();
      expect(cityOf.get(hit!.id)).toBe(city);
    }
    const picks = quickPicks(items);
    expect(picks).toHaveLength(5);
    for (const p of picks) expect(cityOf.get(p.id)).toBe(p.city);
  });

  it('searching each area by its own name (and "sec"/"ph" forms) finds that exact area', () => {
    for (const item of items) {
      expect(searchSectors(items, item.name).map((i) => i.id), item.name).toContain(item.id);
      const short = item.name.replace(/^Sector /, 'sec ').replace(/^Phase /, 'ph ');
      expect(searchSectors(items, `${short} ${item.city}`).map((i) => i.id), `${short} ${item.city}`).toContain(item.id);
    }
    // "35" ranks the exact number first and never Sector 135-style names
    expect(searchSectors(items, '35')[0]!.name).toBe('Sector 35');
  }, 30_000);

  it('a GPS fix described like each area resolves to that exact id (never another city\'s same-named sector)', () => {
    const wrong: string[] = [];
    for (const item of items) {
      const place = placeFromExpo(0, 0, [{ district: item.name, city: item.city, region: 'Punjab' }]);
      const r = resolveDetected(locations, items, place);
      if (!(r.kind === 'sector' && r.item.id === item.id)) wrong.push(`${item.city} / ${item.name} -> ${r.kind === 'sector' ? `${r.item.city} / ${r.item.name}` : r.kind}`);
    }
    expect(wrong).toEqual([]);
  });
});
