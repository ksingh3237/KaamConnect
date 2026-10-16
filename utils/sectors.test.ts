import { describe, expect, it } from 'vitest';
import { citiesWithOtherArea, flattenSectors, normalise, otherAreaId, popularSectors, searchSectors } from './sectors';

const cities = [
  { id: 1, name: 'Chandigarh', areas: [{ id: 10, name: 'Sector 35' }, { id: 11, name: 'Sector 2' }, { id: 12, name: 'Manimajra' }, { id: 13, name: 'Sector 15' }, { id: 14, name: 'Sector 22' }] },
  { id: 2, name: 'Mohali (SAS Nagar)', areas: [{ id: 20, name: 'Phase 7' }, { id: 21, name: 'Sector 70' }, { id: 22, name: 'Sector 135' }, { id: 23, name: 'Kharar' }, { id: 24, name: 'Kharar Road' }, { id: 25, name: 'Other area' }] },
  { id: 3, name: 'Panchkula', areas: [{ id: 30, name: 'MDC Sector 4' }, { id: 31, name: 'Sector 11' }, { id: 32, name: 'Sector 12A' }, { id: 33, name: 'Sector 12' }] },
];
const items = flattenSectors(cities);
const names = (list: { name: string; city: string }[]) => list.map((i) => `${i.city}|${i.name}`);

describe('sector helpers', () => {
  it('never lists the "Other area" anchor, but finds it for a typed locality', () => {
    expect(items.some((i) => i.name === 'Other area')).toBe(false);
    expect(searchSectors(items, 'other')).toEqual([]);
    expect(otherAreaId(cities, 'Mohali')).toBe(25);
    expect(otherAreaId(cities, 'Chandigarh')).toBeNull();
    expect(citiesWithOtherArea(cities)).toEqual(['Mohali']);
  });

  it('sorts naturally (phases, then sectors, MDC, named places) and drops the "(SAS Nagar)" suffix', () => {
    expect(names(items.filter((i) => i.city === 'Mohali'))).toEqual([
      'Mohali|Phase 7',
      'Mohali|Sector 70',
      'Mohali|Sector 135',
      'Mohali|Kharar',
      'Mohali|Kharar Road',
    ]);
    expect(names(items.filter((i) => i.city === 'Chandigarh'))).toEqual([
      'Chandigarh|Sector 2',
      'Chandigarh|Sector 15',
      'Chandigarh|Sector 22',
      'Chandigarh|Sector 35',
      'Chandigarh|Manimajra',
    ]);
    expect(names(items.filter((i) => i.city === 'Panchkula'))).toEqual([
      'Panchkula|Sector 11',
      'Panchkula|Sector 12',
      'Panchkula|Sector 12A',
      'Panchkula|MDC Sector 4',
    ]);
    expect(items.find((i) => i.id === 20)?.city).toBe('Mohali');
  });

  it('expands sec/ph abbreviations', () => {
    expect(normalise('Sec 35')).toBe('sector 35');
    expect(normalise('ph7')).toBe('phase 7');
    expect(normalise('  PHASE   3B2 ')).toBe('phase 3b2');
  });

  it('finds the exact sector number first ("35" is Sector 35, never Sector 135 first)', () => {
    expect(names(searchSectors(items, '35'))[0]).toBe('Chandigarh|Sector 35');
    expect(names(searchSectors(items, '35'))).not.toContain('Mohali|Sector 135');
    expect(names(searchSectors(items, 'sec 35'))[0]).toBe('Chandigarh|Sector 35');
  });

  it('matches phases, MDC, place names and city names', () => {
    expect(names(searchSectors(items, 'Phase 7'))).toEqual(['Mohali|Phase 7']);
    expect(names(searchSectors(items, 'ph 7'))).toEqual(['Mohali|Phase 7']);
    expect(names(searchSectors(items, 'mdc'))).toEqual(['Panchkula|MDC Sector 4']);
    expect(names(searchSectors(items, 'Kharar'))).toEqual(['Mohali|Kharar', 'Mohali|Kharar Road']);
    expect(searchSectors(items, 'panchkula')).toHaveLength(4);
    expect(searchSectors(items, 'zzz')).toEqual([]);
    expect(searchSectors(items, '   ')).toBe(items);
  });

  it('offers only popular sectors that exist, optionally for one city', () => {
    expect(names(popularSectors(items, null))).toEqual([
      'Chandigarh|Sector 15',
      'Chandigarh|Sector 22',
      'Chandigarh|Sector 35',
      'Mohali|Phase 7',
      'Mohali|Sector 70',
      'Panchkula|Sector 11',
      'Panchkula|MDC Sector 4',
    ]);
    expect(names(popularSectors(items, 'Panchkula'))).toEqual(['Panchkula|Sector 11', 'Panchkula|MDC Sector 4']);
  });
});
