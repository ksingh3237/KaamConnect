// Logic behind the worker's trade picker: which tab a category sits in, searching (English, Hindi, Punjabi and the
// way people type Hindi in Latin letters), and the "at most two trades" rule. Kept free of React so it can be tested.
import type { ServiceCategory } from '../api/types';

export const MAX_TRADES = 2;

export type TradeGroupId = 'all' | 'electrical' | 'civil' | 'cleaning' | 'vehicles' | 'other';

export const TRADE_GROUPS: { id: TradeGroupId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'electrical', label: 'Electrical & AC' },
  { id: 'civil', label: 'Plumbing & Civil' },
  { id: 'cleaning', label: 'Cleaning & Washing' },
  { id: 'vehicles', label: 'Vehicles & Moving' },
  { id: 'other', label: 'More' },
];

// The catalogue comes from the server, so a category added later has no entry here and lands in "More".
const GROUP_OF: Record<string, Exclude<TradeGroupId, 'all'>> = {
  electrician: 'electrical',
  ac_repair: 'electrical',
  appliance: 'electrical',
  ro_service: 'electrical',
  tv_repair: 'electrical',
  fridge_repair: 'electrical',
  generator_service: 'electrical',
  cctv_security: 'electrical',
  computer_it: 'electrical',
  plumber: 'civil',
  carpenter: 'civil',
  painter: 'civil',
  civil_construction: 'civil',
  glass_works: 'civil',
  cleaner: 'cleaning',
  car_wash: 'cleaning',
  vehicle_repair: 'vehicles',
  packers_movers: 'vehicles',
};

/** Extra words people search by: Hindi/Punjabi typed in English letters, and common slang. */
const ALIASES: Record<string, string> = {
  electrician: 'bijli bijli wala wiring light pankha board switch',
  plumber: 'nal pipe paani pani tonti tanki geyser',
  ac_repair: 'cooler cooling air conditioner thanda split window',
  carpenter: 'badhai barhai lakdi furniture almari darwaza',
  painter: 'rang colour color putai paint',
  cleaner: 'safai saaf jhadu pocha sofa bathroom',
  appliance: 'washing machine microwave mixer iron geyser oven',
  car_wash: 'gaadi gadi dhulai bike wash',
  vehicle_repair: 'mechanic gaadi gadi bike scooter car puncture',
  ro_service: 'ro water purifier filter paani pani',
  tv_repair: 'television led lcd screen',
  fridge_repair: 'fridge refrigerator freezer thanda',
  packers_movers: 'shifting saman samaan tempo transport',
  glass_works: 'sheesha kaanch kanch window mirror',
  generator_service: 'genset inverter diesel',
  gardening: 'mali bagwani bagicha lawn plant ped',
  computer_it: 'laptop wifi router printer pc',
  civil_construction: 'mistri raj mistri rajmistri mason tile plaster marble chunai',
  catering_food: 'halwai khana cook chef party',
  cctv_security: 'camera security dvr intercom',
};

export function tradeGroupOf(categoryId: string): Exclude<TradeGroupId, 'all'> {
  return GROUP_OF[categoryId] ?? 'other';
}

/** The tabs to show, each with how many categories it holds; empty tabs (e.g. "More" with no strays) are left out. */
export function tradeTabs(categories: ServiceCategory[]): { id: TradeGroupId; label: string; count: number }[] {
  return TRADE_GROUPS.map((g) => ({
    ...g,
    count: g.id === 'all' ? categories.length : categories.filter((c) => tradeGroupOf(c.id) === g.id).length,
  })).filter((t) => t.id === 'all' || t.count > 0);
}

const haystack = (c: ServiceCategory) =>
  [c.title.en, c.title.hi, c.title.pa, c.examples, ALIASES[c.id] ?? ''].join(' ').toLowerCase();

/** Categories in the chosen tab whose names, examples or aliases contain every word typed. */
export function filterTrades(categories: ServiceCategory[], group: TradeGroupId, query: string): ServiceCategory[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return categories.filter((c) => (group === 'all' || tradeGroupOf(c.id) === group) && words.every((w) => haystack(c).includes(w)));
}

export interface TradeToggle {
  ids: string[];
  /** The 2nd trade that was pushed out because two were already chosen. */
  replaced: string | null;
  /** The 2nd trade moved up to Primary because the Primary was removed. */
  promoted: string | null;
}

/** Tap on a category: remove it if chosen, add it if there is room, otherwise it takes the 2nd slot. First entry is the Primary. */
export function toggleTrade(ids: string[], id: string): TradeToggle {
  if (ids.includes(id)) {
    const next = ids.filter((t) => t !== id);
    return { ids: next, replaced: null, promoted: ids[0] === id && next.length > 0 ? next[0]! : null };
  }
  if (ids.length < MAX_TRADES) return { ids: [...ids, id], replaced: null, promoted: null };
  return { ids: [ids[0]!, id], replaced: ids[1]!, promoted: null };
}
