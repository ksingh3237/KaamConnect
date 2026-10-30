// Pictures and icons for the service categories. The catalogue itself (titles, fees, order) comes from the server
// (GET /service-categories); this file only maps a category id / iconKey to something to draw, with fallbacks so a
// category added on the server later still renders.
import type { ImageSourcePropType } from 'react-native';
import {
  Building2, Cctv, ChefHat, Droplet, Droplets, Hammer, Laptop, Layers, Package, Paintbrush, PlugZap, Refrigerator,
  Sparkles, Trees, Truck, Tv, Wind, Wrench, Zap, type LucideIcon,
} from 'lucide-react-native';

/** Real work photos (Pexels licence, see assets/images/services/CREDITS.md), keyed by category id. */
export const SERVICE_PHOTOS: Record<string, ImageSourcePropType> = {
  electrician: require('../assets/images/services/electrician.jpg'),
  plumber: require('../assets/images/services/plumber.jpg'),
  ac_repair: require('../assets/images/services/ac_repair.jpg'),
  carpenter: require('../assets/images/services/carpenter.jpg'),
  painter: require('../assets/images/services/painter.jpg'),
  cleaner: require('../assets/images/services/cleaner.jpg'),
  appliance: require('../assets/images/services/appliance.jpg'),
  car_wash: require('../assets/images/services/car_wash.jpg'),
  vehicle_repair: require('../assets/images/services/vehicle_repair.jpg'),
  ro_service: require('../assets/images/services/ro_service.jpg'),
  tv_repair: require('../assets/images/services/tv_repair.jpg'),
  fridge_repair: require('../assets/images/services/fridge_repair.jpg'),
  packers_movers: require('../assets/images/services/packers_movers.jpg'),
  glass_works: require('../assets/images/services/glass_works.jpg'),
  generator_service: require('../assets/images/services/generator_service.jpg'),
  gardening: require('../assets/images/services/gardening.jpg'),
  computer_it: require('../assets/images/services/computer_it.jpg'),
  civil_construction: require('../assets/images/services/civil_construction.jpg'),
  catering_food: require('../assets/images/services/catering_food.jpg'),
  cctv_security: require('../assets/images/services/cctv_security.jpg'),
};

const ICONS: Record<string, LucideIcon> = {
  Zap, Droplet, Droplets, Wind, Hammer, Paintbrush, Sparkles, Tv, Truck, Wrench, Refrigerator, Package, Layers, PlugZap,
  Trees, Laptop, Building2, ChefHat, Cctv,
};

/** The lucide icon for a category's iconKey; a wrench for anything unknown. */
export function serviceIcon(iconKey: string): LucideIcon {
  return ICONS[iconKey] ?? Wrench;
}

/** A short, static preview of the catalogue for the signed-out welcome screen (the API needs a login). */
// Names in the person's language come from i18n/categories.ts (categoryTitle), by id.
export const PREVIEW_SERVICES: { id: string; en: string; iconKey: string; color: string; bg: string }[] = [
  { id: 'electrician', en: 'Electrician', iconKey: 'Zap', color: '#D97706', bg: '#FEF3C7' },
  { id: 'plumber', en: 'Plumber', iconKey: 'Droplet', color: '#0284C7', bg: '#E0F2FE' },
  { id: 'ac_repair', en: 'AC Repair', iconKey: 'Wind', color: '#00B074', bg: '#D1FAE5' },
  { id: 'cleaner', en: 'Cleaning', iconKey: 'Sparkles', color: '#DB2777', bg: '#FCE7F3' },
  { id: 'carpenter', en: 'Carpenter', iconKey: 'Hammer', color: '#B45309', bg: '#FDE68A' },
  { id: 'painter', en: 'Painter', iconKey: 'Paintbrush', color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'ro_service', en: 'RO Service', iconKey: 'Droplets', color: '#0891B2', bg: '#CFFAFE' },
  { id: 'vehicle_repair', en: 'Vehicle Repair', iconKey: 'Wrench', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'fridge_repair', en: 'Fridge Repair', iconKey: 'Refrigerator', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'cctv_security', en: 'CCTV & Camera', iconKey: 'Cctv', color: '#334155', bg: '#E2E8F0' },
  { id: 'packers_movers', en: 'Packers & Movers', iconKey: 'Package', color: '#EA580C', bg: '#FFEDD5' },
  { id: 'computer_it', en: 'Computer & IT', iconKey: 'Laptop', color: '#7C3AED', bg: '#EDE9FE' },
];
