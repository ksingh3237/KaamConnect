// Thin client for Google Places (New) autocomplete / details and the Geocoding API. Works on native and web (both
// answer browser requests). The key is EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: it ships inside the app, so restrict it in
// Google Cloud (Android package + SHA-1, iOS bundle id, and only the Places / Geocoding / Maps SDK APIs).
import { TRICITY_BOUNDS, type GeoComponent } from './placeMatch';

export const GOOGLE_MAPS_KEY = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
export const mapsConfigured = GOOGLE_MAPS_KEY !== '';

export interface Suggestion {
  placeId: string;
  title: string;
  subtitle: string;
}
export interface ResolvedPlace {
  lat: number;
  lng: number;
  formattedAddress: string;
  components: GeoComponent[];
}

const TIMEOUT_MS = 10_000;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw new Error(`MAPS_HTTP_${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Places session tokens group the typing and the final details call into one billed session. */
export function newSessionToken(): string {
  let t = '';
  for (let i = 0; i < 32; i++) t += Math.floor(Math.random() * 16).toString(16);
  return t;
}

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }[];
}

export async function autocomplete(input: string, sessionToken: string): Promise<Suggestion[]> {
  const body = {
    input,
    sessionToken,
    languageCode: 'en',
    includedRegionCodes: ['in'],
    // A hard restriction (not a bias): nothing outside Chandigarh, Mohali and Panchkula is offered
    locationRestriction: {
      rectangle: {
        low: { latitude: TRICITY_BOUNDS.south, longitude: TRICITY_BOUNDS.west },
        high: { latitude: TRICITY_BOUNDS.north, longitude: TRICITY_BOUNDS.east },
      },
    },
  };
  const data = await request<AutocompleteResponse>('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_MAPS_KEY },
    body: JSON.stringify(body),
  });
  return (data.suggestions ?? []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p) return [];
    const title = p.structuredFormat?.mainText?.text ?? p.text?.text ?? '';
    return [{ placeId: p.placeId, title, subtitle: p.structuredFormat?.secondaryText?.text ?? '' }];
  });
}

interface DetailsResponse {
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: { longText: string; types: string[] }[];
}

export async function placeDetails(placeId: string, sessionToken: string): Promise<ResolvedPlace> {
  const data = await request<DetailsResponse>(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${sessionToken}&languageCode=en`,
    { headers: { 'X-Goog-Api-Key': GOOGLE_MAPS_KEY, 'X-Goog-FieldMask': 'formattedAddress,location,addressComponents' } },
  );
  if (!data.location) throw new Error('MAPS_NO_LOCATION');
  return {
    lat: data.location.latitude,
    lng: data.location.longitude,
    formattedAddress: data.formattedAddress ?? '',
    components: (data.addressComponents ?? []).map((c) => ({ name: c.longText, types: c.types })),
  };
}

interface GeocodeResponse {
  status: string;
  results: { formatted_address: string; types: string[]; address_components: { long_name: string; types: string[] }[] }[];
}

export async function reverseGeocode(lat: number, lng: number): Promise<ResolvedPlace> {
  const data = await request<GeocodeResponse>(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${GOOGLE_MAPS_KEY}`,
  );
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(`MAPS_${data.status}`);
  // The first result is often a bare plus-code; the sector shows up in the next ones, so merge the first three
  const useful = data.results.slice(0, 3);
  const best = useful.find((r) => !r.types.includes('plus_code')) ?? useful[0];
  return {
    lat,
    lng,
    formattedAddress: best?.formatted_address ?? '',
    components: useful.flatMap((r) => r.address_components.map((c) => ({ name: c.long_name, types: c.types }))),
  };
}
