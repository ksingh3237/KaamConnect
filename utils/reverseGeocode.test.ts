import { beforeEach, describe, expect, it, vi } from 'vitest';

const device = vi.hoisted(() => ({ reverseGeocodeAsync: vi.fn() }));
const google = vi.hoisted(() => ({ mapsConfigured: true, reverseGeocode: vi.fn() }));

vi.mock('expo-location', () => device);
vi.mock('./googlePlaces', () => ({
  get mapsConfigured() {
    return google.mapsConfigured;
  },
  reverseGeocode: google.reverseGeocode,
}));

import { reverseGeocodePlace } from './reverseGeocode';

const sector22 = { name: '12', street: 'Sector 22-A', district: 'Sector 22', city: 'Chandigarh', subregion: null, region: 'Chandigarh' };
const fromGoogle = { lat: 30.7, lng: 76.7, formattedAddress: 'Sector 22, Chandigarh', components: [] };

beforeEach(() => {
  vi.clearAllMocks();
  google.mapsConfigured = true;
  google.reverseGeocode.mockResolvedValue(fromGoogle);
});

describe('reverseGeocodePlace', () => {
  it('uses the phone’s geocoder and never calls Google when it answers', async () => {
    device.reverseGeocodeAsync.mockResolvedValue([sector22]);
    const place = await reverseGeocodePlace(30.7, 76.7);
    expect(place.formattedAddress).toContain('Sector 22');
    expect(place.components).toContainEqual({ name: 'Sector 22', types: ['sublocality_level_1'] });
    expect(google.reverseGeocode).not.toHaveBeenCalled();
  });

  it('falls back to Google when the phone has no geocoder (web) or finds nothing', async () => {
    device.reverseGeocodeAsync.mockRejectedValueOnce(new Error('UnavailabilityError'));
    expect(await reverseGeocodePlace(30.7, 76.7)).toBe(fromGoogle);
    device.reverseGeocodeAsync.mockResolvedValueOnce([]);
    expect(await reverseGeocodePlace(30.7, 76.7)).toBe(fromGoogle);
    expect(google.reverseGeocode).toHaveBeenCalledTimes(2);
  });

  it('fails cleanly (so the screen shows its note) when nothing can answer and there is no key', async () => {
    google.mapsConfigured = false;
    device.reverseGeocodeAsync.mockResolvedValue([]);
    await expect(reverseGeocodePlace(30.7, 76.7)).rejects.toThrow('GEOCODE_UNAVAILABLE');
    expect(google.reverseGeocode).not.toHaveBeenCalled();
  });

  it('fails the same way when Google’s Geocoding API is not enabled', async () => {
    device.reverseGeocodeAsync.mockRejectedValue(new Error('offline'));
    google.reverseGeocode.mockRejectedValue(new Error('MAPS_HTTP_403'));
    await expect(reverseGeocodePlace(30.7, 76.7)).rejects.toThrow('MAPS_HTTP_403');
  });
});
