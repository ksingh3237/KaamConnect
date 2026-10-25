// Road route between two points, so the map line follows streets instead of cutting through buildings.
//  1. Google Routes API (needs "Routes API" enabled on EXPO_PUBLIC_GOOGLE_MAPS_API_KEY; TRAFFIC_UNAWARE is the cheapest tier);
//  2. OSRM's public demo server (free, no key, no uptime promise: fine for development, host your own for production);
//  3. null: the map then draws the straight line.
// Never throws.
import { GOOGLE_MAPS_KEY, mapsConfigured } from './googlePlaces';
import { parseGoogleRoute, parseOsrmRoute } from './route';
import type { LatLng } from './trip';

export interface RoadRoute {
  path: LatLng[];
  source: 'google' | 'osrm';
}

const TIMEOUT_MS = 8000;

/** Set once Google answers 403 (Routes API not enabled / key not allowed): no point asking again until the app restarts. */
let googleRoutesDenied = false;

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function googleRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  const point = (p: LatLng) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
  const json = await getJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_MAPS_KEY, 'X-Goog-FieldMask': 'routes.polyline.encodedPolyline' },
    body: JSON.stringify({ origin: point(from), destination: point(to), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE' }),
  });
  return parseGoogleRoute(json);
}

async function osrmRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  const json = await getJson(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
  return parseOsrmRoute(json);
}

export async function fetchRoadRoute(from: LatLng, to: LatLng): Promise<RoadRoute | null> {
  if (mapsConfigured && !googleRoutesDenied) {
    try {
      const path = await googleRoute(from, to);
      if (path) return { path, source: 'google' };
    } catch (error) {
      if (error instanceof Error && error.message === 'HTTP_403') googleRoutesDenied = true;
      /* key not allowed for the Routes API, offline...: try the free service */
    }
  }
  try {
    const path = await osrmRoute(from, to);
    if (path) return { path, source: 'osrm' };
  } catch {
    /* offline: the straight line stays */
  }
  return null;
}
