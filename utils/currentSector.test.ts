import { describe, expect, it, vi } from 'vitest';
import type { LocationCity } from '../api/types';
import { placeFromExpo, resolveDetected, withTimeout } from './currentSector';
import { flattenSectors } from './sectors';

const locations: LocationCity[] = [
  { id: 1, name: 'Chandigarh', areas: [{ id: 10, name: 'Sector 35' }, { id: 11, name: 'Sector 22' }, { id: 12, name: 'Other area' }] },
  { id: 2, name: 'Mohali (SAS Nagar)', areas: [{ id: 20, name: 'Phase 7' }, { id: 22, name: 'Other area' }] },
];
const items = flattenSectors(locations);

describe('placeFromExpo', () => {
  it('shapes an expo address like a Google result', () => {
    const p = placeFromExpo(30.7, 76.7, [{ name: '1234', street: 'Sector 35-C', district: 'Sector 35', city: 'Chandigarh', subregion: null, region: 'Chandigarh' }]);
    expect(p.formattedAddress).toBe('1234, Sector 35-C, Sector 35, Chandigarh, Chandigarh');
    expect(p.components).toContainEqual({ name: 'Chandigarh', types: ['locality'] });
    expect(p.components).toContainEqual({ name: 'Sector 35', types: ['sublocality_level_1'] });
  });
  it('copes with no address at all', () => {
    expect(placeFromExpo(1, 2, [])).toEqual({ lat: 1, lng: 2, formattedAddress: '', components: [] });
  });
});

describe('withTimeout', () => {
  it('passes the result through when the step finishes in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });
  it('passes the step\'s own error through', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });
  it('rejects with TIMEOUT when the step never settles', async () => {
    vi.useFakeTimers();
    try {
      const pending = expect(withTimeout(new Promise<never>(() => {}), 15_000)).rejects.toThrow('TIMEOUT');
      await vi.advanceTimersByTimeAsync(15_000);
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('resolveDetected', () => {
  it('selects the listed sector', () => {
    const place = placeFromExpo(0, 0, [{ district: 'Sector 35', city: 'Chandigarh' }]);
    expect(resolveDetected(locations, items, place)).toMatchObject({ kind: 'sector', item: { id: 10 } });
  });
  it('falls back to the city "Other area" with the neighbourhood as locality', () => {
    const place = placeFromExpo(0, 0, [{ district: 'Peer Muchalla', city: 'Zirakpur', region: 'Punjab' }]);
    expect(resolveDetected(locations, items, place)).toEqual({ kind: 'custom', areaId: 22, locality: 'Peer Muchalla', city: 'Mohali' });
  });
  it('reports nothing when the fix is in a city we do not list', () => {
    const place = placeFromExpo(0, 0, [{ district: 'Model Town', city: 'Ludhiana', region: 'Punjab' }]);
    expect(resolveDetected(locations, items, place)).toEqual({ kind: 'none' });
  });
});
