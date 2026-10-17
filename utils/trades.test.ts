import { describe, expect, it } from 'vitest';
import type { ServiceCategory } from '../api/types';
import { filterTrades, toggleTrade, tradeGroupOf, tradeTabs } from './trades';

const cat = (id: string, en: string, hi: string, examples = ''): ServiceCategory => ({
  id,
  title: { en, hi, pa: '' },
  iconKey: 'Wrench',
  color: '#000',
  bgColor: '#fff',
  baseVisitFee: 0,
  examples,
});

const categories = [
  cat('electrician', 'Electrician', 'इलेक्ट्रीशियन', 'Short Circuit, Fan, MCB Trip'),
  cat('plumber', 'Plumber', 'प्लंबर', 'Pipe Leakage, Tap, Geyser'),
  cat('ac_repair', 'AC Repair', 'एसी रिपेयर', 'Gas Refill, Service'),
  cat('civil_construction', 'Civil Work', 'राजमिस्त्री', 'Mason / Mistri, Tile Fixing'),
  cat('car_wash', 'Car & Bike Wash', 'कार वॉश'),
  cat('vehicle_repair', 'Vehicle Repair', 'वाहन मैकेनिक'),
  cat('gardening', 'Gardening', 'बागवानी'),
];
const ids = (list: ServiceCategory[]) => list.map((c) => c.id);

describe('trade groups and tabs', () => {
  it('puts known categories in their tab and anything the server adds later in "More"', () => {
    expect(tradeGroupOf('electrician')).toBe('electrical');
    expect(tradeGroupOf('car_wash')).toBe('cleaning');
    expect(tradeGroupOf('brand_new_service')).toBe('other');
  });

  it('counts each tab and leaves out tabs with nothing in them', () => {
    const tabs = tradeTabs(categories.filter((c) => c.id !== 'gardening'));
    expect(tabs.map((t) => [t.id, t.count])).toEqual([['all', 6], ['electrical', 2], ['civil', 2], ['cleaning', 1], ['vehicles', 1]]);
  });
});

describe('trade search', () => {
  it('finds by English, Hindi and Latin-letter Hindi', () => {
    expect(ids(filterTrades(categories, 'all', 'electric'))).toEqual(['electrician']);
    expect(ids(filterTrades(categories, 'all', 'bijli'))).toEqual(['electrician']);
    expect(ids(filterTrades(categories, 'all', 'प्लंबर'))).toEqual(['plumber']);
    expect(ids(filterTrades(categories, 'all', 'cooler'))).toEqual(['ac_repair']);
    expect(ids(filterTrades(categories, 'all', 'pipe'))).toEqual(['plumber']);
    expect(ids(filterTrades(categories, 'all', 'mistri'))).toEqual(['civil_construction']);
  });

  it('needs every typed word to match, ignoring case and extra spaces', () => {
    expect(ids(filterTrades(categories, 'all', '  CAR   wash '))).toEqual(['car_wash']);
    expect(filterTrades(categories, 'all', 'car plumber')).toEqual([]);
  });

  it('applies the tab and the search together', () => {
    expect(ids(filterTrades(categories, 'cleaning', ''))).toEqual(['car_wash']);
    expect(filterTrades(categories, 'electrical', 'plumber')).toEqual([]);
    expect(ids(filterTrades(categories, 'all', ''))).toHaveLength(categories.length);
  });
});

describe('toggleTrade (at most two, first is Primary)', () => {
  it('adds a first and a second trade in order', () => {
    expect(toggleTrade([], 'a').ids).toEqual(['a']);
    expect(toggleTrade(['a'], 'b').ids).toEqual(['a', 'b']);
  });

  it('removes a chosen trade and moves the 2nd up when the Primary goes', () => {
    expect(toggleTrade(['a', 'b'], 'b')).toEqual({ ids: ['a'], replaced: null, promoted: null });
    expect(toggleTrade(['a', 'b'], 'a')).toEqual({ ids: ['b'], replaced: null, promoted: 'b' });
    expect(toggleTrade(['a'], 'a')).toEqual({ ids: [], replaced: null, promoted: null });
  });

  it('a third trade replaces the 2nd, keeps the Primary and says what was dropped', () => {
    expect(toggleTrade(['a', 'b'], 'c')).toEqual({ ids: ['a', 'c'], replaced: 'b', promoted: null });
  });
});
