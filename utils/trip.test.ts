import { describe, expect, it } from 'vitest';
import { AT_THE_DOOR_KM, FALLBACK_SPEED_KMH, bearingDeg, distanceKm, navigationUrls, nextHeading, roadTrip, trackingPill, vehicleEmoji } from './trip';

const sector22 = { lat: 30.7333, lng: 76.7794 };
const north = { lat: 30.7433, lng: 76.7794 };
const east = { lat: 30.7333, lng: 76.7894 };

describe('distanceKm', () => {
  it('is zero for the same point and about 1.1 km per 0.01 degree of latitude', () => {
    expect(distanceKm(sector22, sector22)).toBe(0);
    expect(distanceKm(sector22, north)).toBeGreaterThan(1.05);
    expect(distanceKm(sector22, north)).toBeLessThan(1.15);
  });
});

describe('bearingDeg', () => {
  it('points north, east, south and west', () => {
    expect(Math.round(bearingDeg(sector22, north))).toBe(0);
    expect(Math.round(bearingDeg(sector22, east))).toBe(90);
    expect(Math.round(bearingDeg(north, sector22))).toBe(180);
  });
});

describe('nextHeading', () => {
  it('keeps the old heading until the worker really moves', () => {
    expect(nextHeading(null, north, 42)).toBe(42);
    expect(nextHeading(sector22, { lat: sector22.lat + 0.00001, lng: sector22.lng }, 42)).toBe(42);
    expect(Math.round(nextHeading(sector22, east, 42))).toBe(90);
  });
});

describe('vehicleEmoji', () => {
  it('matches the vehicle text and falls back to a scooter', () => {
    expect(vehicleEmoji('Honda Activa')).toBe('🛵');
    expect(vehicleEmoji('Hero Splendor bike')).toBe('🏍️');
    expect(vehicleEmoji('Maruti Alto car')).toBe('🚗');
    expect(vehicleEmoji('Bicycle')).toBe('🚲');
    expect(vehicleEmoji(null)).toBe('🛵');
    expect(vehicleEmoji('')).toBe('🛵');
  });
});

describe('trackingPill', () => {
  const base = { status: 'ASSIGNED', hasLocation: true, stale: false, etaMinutes: 7, distanceKm: 2.4 };
  it('shows eta and distance while on the way', () => {
    expect(trackingPill(base)).toBe('⚡ Arriving in 7 min • 2.4 km away');
  });
  it('says the location is coming before the first fix', () => {
    expect(trackingPill({ ...base, hasLocation: false, etaMinutes: null, distanceKm: null })).toBe('⏳ Worker on the way • Updating live location...');
  });
  it('does not invent an eta when the job has no coordinates', () => {
    expect(trackingPill({ ...base, etaMinutes: null, distanceKm: null })).toBe('⚡ Worker is on the way • live location on the map');
  });
  it('flags an old fix', () => {
    expect(trackingPill({ ...base, stale: true, lastSeen: '3 min ago' })).toContain('3 min ago');
  });
  it('reports arrival for every status after arrival', () => {
    expect(trackingPill({ ...base, status: 'ARRIVED' })).toBe('📍 Worker has arrived at your location');
    expect(trackingPill({ ...base, status: 'IN_PROGRESS' })).toBe('📍 Worker has arrived at your location');
  });
});

describe('navigationUrls', () => {
  it('tries the native navigation intent first on Android, then the web link', () => {
    expect(navigationUrls(sector22, null, true)).toEqual([
      'google.navigation:q=30.7333,76.7794&mode=d',
      'https://www.google.com/maps/dir/?api=1&destination=30.7333,76.7794&travelmode=driving',
    ]);
  });
  it('uses only the web link elsewhere', () => {
    expect(navigationUrls(sector22, null, false)).toHaveLength(1);
  });
  it('falls back to the address text when the job has no coordinates, and to nothing without either', () => {
    expect(navigationUrls(null, 'House 12, Sector 22', false)[0]).toContain('House%2012%2C%20Sector%2022');
    expect(navigationUrls(null, '  ', true)).toEqual([]);
  });
});

describe('trackingPill at the door', () => {
  const base = { status: 'ASSIGNED', hasLocation: true, stale: false };
  it('drops the countdown once the worker is at the address and asks for the code instead', () => {
    expect(trackingPill({ ...base, etaMinutes: 1, distanceKm: 0.05 })).toContain('at your door');
    expect(trackingPill({ ...base, etaMinutes: 1, distanceKm: AT_THE_DOOR_KM })).toContain('at your door');
  });

  it('still counts down from a street away', () => {
    expect(trackingPill({ ...base, etaMinutes: 2, distanceKm: 0.4 })).toBe('⚡ Arriving in 2 min • 0.4 km away');
  });

  it('does not claim a door when the last fix is old', () => {
    expect(trackingPill({ ...base, stale: true, etaMinutes: null, distanceKm: 0.02, lastSeen: '5 min ago' })).toContain('last seen');
  });
});

describe('roadTrip', () => {
  // Sector 17 -> Sector 43: 3.6 km as the crow flies, about 5 km of road. The straight line this replaced said
  // 11 min at 20 km/h; the routing service's own 15 min for the real road is what the person now sees.
  const wholeRoute = { distanceKm: 5, durationMinutes: 15 };

  it('quotes the service’s own driving time while the whole route is still ahead', () => {
    expect(roadTrip(wholeRoute, 5)).toEqual({ distanceKm: 5, etaMinutes: 15 });
  });

  it('scales the time down as the road is driven, without asking the service again', () => {
    expect(roadTrip(wholeRoute, 2.5)).toEqual({ distanceKm: 2.5, etaMinutes: 8 }); // 7.5 min, rounded up
    expect(roadTrip(wholeRoute, 1)).toEqual({ distanceKm: 1, etaMinutes: 3 });
  });

  it('falls back to the server’s own speed when the service gave no time', () => {
    expect(roadTrip({ distanceKm: 5, durationMinutes: null }, 5)).toEqual({ distanceKm: 5, etaMinutes: 15 });
    expect(FALLBACK_SPEED_KMH).toBe(20);
  });

  it('never promises less than a minute, and never a negative distance', () => {
    expect(roadTrip(wholeRoute, 0)).toEqual({ distanceKm: 0, etaMinutes: 1 });
    expect(roadTrip(wholeRoute, -3)).toEqual({ distanceKm: 0, etaMinutes: 1 });
  });

  it('survives a service that answered a zero-length route', () => {
    expect(roadTrip({ distanceKm: 0, durationMinutes: 9 }, 2)).toEqual({ distanceKm: 2, etaMinutes: 6 });
  });
});
