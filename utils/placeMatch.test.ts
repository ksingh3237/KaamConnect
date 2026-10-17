import { describe, expect, it } from 'vitest';
import type { LocationCity } from '../api/types';
import { areaKeys, cleanLine, inTricity, matchArea } from './placeMatch';

const locations: LocationCity[] = [
  { id: 1, name: 'Chandigarh', areas: [{ id: 10, name: 'Sector 22' }, { id: 11, name: 'Sector 22A' }, { id: 12, name: 'Other area' }] },
  { id: 2, name: 'Mohali (SAS Nagar)', areas: [{ id: 20, name: 'Phase 3B2' }, { id: 21, name: 'Sector 70' }, { id: 22, name: 'Other area' }] },
  { id: 3, name: 'Panchkula', areas: [{ id: 30, name: 'Sector 20' }, { id: 31, name: 'MDC Sector 4' }, { id: 32, name: 'Sector 22' }, { id: 33, name: 'Other area' }] },
];
const comp = (name: string, ...types: string[]) => ({ name, types });

describe('areaKeys', () => {
  it('reads sectors, lettered sectors and phases', () => {
    expect(areaKeys('Sector 22-A, Chandigarh')).toEqual(['sector22a']);
    expect(areaKeys('Sec 70, Mohali')).toEqual(['sector70']);
    expect(areaKeys('Phase-3B2, Mohali')).toEqual(['phase3b2']);
  });
  it('does not swallow the first letter of the city', () => {
    expect(areaKeys('Sector 22 Chandigarh')).toEqual(['sector22']);
  });
});

describe('matchArea', () => {
  it('matches a Chandigarh sector from the neighbourhood component', () => {
    const r = matchArea(locations, [comp('Sector 22', 'sublocality_level_1'), comp('Chandigarh', 'locality')], 'Sector 22, Chandigarh, India');
    expect(r).toEqual({ areaId: 10, localityName: null, city: 'Chandigarh' });
  });
  it('tells Sector 22 and Sector 22A apart', () => {
    const r = matchArea(locations, [comp('Chandigarh', 'locality')], 'Sector 22-A, Chandigarh, India');
    expect(r.areaId).toBe(11);
  });
  it('uses the city to pick between same-named sectors', () => {
    const r = matchArea(locations, [comp('Panchkula', 'locality')], 'Sector 22, Panchkula, Haryana');
    expect(r.areaId).toBe(32);
  });
  it('refuses an ambiguous sector when the city is unknown', () => {
    expect(matchArea(locations, [], 'Sector 22').areaId).toBeNull();
  });
  it('recognises Mohali by its official name', () => {
    const r = matchArea(locations, [], 'Sector 70, Sahibzada Ajit Singh Nagar, Punjab');
    expect(r).toMatchObject({ areaId: 21, city: 'Mohali' });
  });
  it('prefers the MDC sector in Panchkula', () => {
    expect(matchArea(locations, [comp('Panchkula', 'locality')], 'Sector 4, MDC, Panchkula').areaId).toBe(31);
  });
  it('falls back to the city "Other area" with the neighbourhood as locality', () => {
    const r = matchArea(locations, [comp('Peer Muchalla', 'sublocality_level_1'), comp('Zirakpur', 'locality')], 'Peer Muchalla, Zirakpur, Punjab');
    expect(r).toEqual({ areaId: 22, localityName: 'Peer Muchalla', city: 'Mohali' });
  });
  it('returns no area outside the three cities', () => {
    expect(matchArea(locations, [comp('Ludhiana', 'locality')], 'Model Town, Ludhiana, Punjab')).toEqual({ areaId: null, localityName: null, city: null });
  });
});

describe('helpers', () => {
  it('bounds', () => {
    expect(inTricity(30.7333, 76.7794)).toBe(true);
    expect(inTricity(28.6139, 77.209)).toBe(false);
  });
  it('cleanLine drops the country and caps at 200', () => {
    expect(cleanLine('Sector 22, Chandigarh, India')).toBe('Sector 22, Chandigarh');
    expect(cleanLine('x'.repeat(300)).length).toBe(200);
  });
});
