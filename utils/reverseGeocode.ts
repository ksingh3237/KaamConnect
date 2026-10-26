// GPS point -> address, for "use my current location" and for dropping the pin on the map.
//
// The phone's own geocoder is tried first: it is free and needs no Google API (Android uses the Geocoder service of
// Google Play services, iOS uses Apple's). Google's Geocoding API is only a fallback for where the phone has none
// (the web build, or a phone that returns nothing), and it only works if that API is enabled on the key.
// So the app runs fully on Maps SDK + Places API (New) alone; a failed Google fallback just ends in the same
// "could not find your location" note as before.
import * as Location from 'expo-location';
import { placeFromExpo, withTimeout } from './currentSector';
import { mapsConfigured, reverseGeocode, type ResolvedPlace } from './googlePlaces';

export const GEOCODE_TIMEOUT_MS = 10_000;

export async function reverseGeocodePlace(lat: number, lng: number): Promise<ResolvedPlace> {
  try {
    const found = await withTimeout(Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }), GEOCODE_TIMEOUT_MS);
    if (found.length > 0) return placeFromExpo(lat, lng, found);
  } catch {
    /* no geocoder on this device (web), offline or slow: try Google below */
  }
  if (!mapsConfigured) throw new Error('GEOCODE_UNAVAILABLE');
  return withTimeout(reverseGeocode(lat, lng), GEOCODE_TIMEOUT_MS);
}
