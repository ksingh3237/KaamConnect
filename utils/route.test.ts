import { describe, expect, it } from 'vitest';
import { decodePolyline, endAtDestination, offRouteMeters, parseGoogleRoute, parseOsrmRoute, pathLengthKm, remainingPath, resample } from './route';
import { distanceKm } from './trip';

// Straight road going east along one latitude, about 1.1 km long
const road = [
  { lat: 30.7333, lng: 76.77 },
  { lat: 30.7333, lng: 76.775 },
  { lat: 30.7333, lng: 76.78 },
];

describe('decodePolyline', () => {
  it('decodes the example from Google\'s documentation', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });
  it('returns nothing for an empty string', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('route answers', () => {
  it('reads a Google Routes answer and rejects an empty one', () => {
    const line = { polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' } };
    expect(parseGoogleRoute({ routes: [line] })?.path).toHaveLength(2);
    expect(parseGoogleRoute({})).toBeNull();
    expect(parseGoogleRoute({ routes: [{ polyline: { encodedPolyline: '' } }] })).toBeNull();
    expect(parseGoogleRoute(null)).toBeNull();
  });
  it('reads the road length and driving time Google sends beside the line ("843s")', () => {
    const route = parseGoogleRoute({
      routes: [{ polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' }, distanceMeters: 5200, duration: '843s' }],
    });
    expect(route).toMatchObject({ distanceKm: 5.2, durationMinutes: 14.05 });
  });
  it('still gives a line when the service sends no numbers with it', () => {
    const route = parseGoogleRoute({ routes: [{ polyline: { encodedPolyline: '_p~iF~ps|U_ulLnnqC' } }] });
    expect(route).toMatchObject({ distanceKm: null, durationMinutes: null });
  });
  it('reads an OSRM answer (lng first) and rejects errors', () => {
    const ok = { code: 'Ok', routes: [{ geometry: { coordinates: [[76.77, 30.73], [76.78, 30.74]] } }] };
    expect(parseOsrmRoute(ok)?.path).toEqual([{ lat: 30.73, lng: 76.77 }, { lat: 30.74, lng: 76.78 }]);
    expect(parseOsrmRoute({ code: 'NoRoute', routes: [] })).toBeNull();
    expect(parseOsrmRoute({ code: 'Ok', routes: [{ geometry: { coordinates: 'x' } }] })).toBeNull();
  });
  it('reads OSRM metres and seconds', () => {
    const ok = {
      code: 'Ok',
      routes: [{ geometry: { coordinates: [[76.77, 30.73], [76.78, 30.74]] }, distance: 4800, duration: 720 }],
    };
    expect(parseOsrmRoute(ok)).toMatchObject({ distanceKm: 4.8, durationMinutes: 12 });
  });
});

describe('pathLengthKm', () => {
  it('measures along the line, not from end to end', () => {
    // a right-angle detour: 1 km north, then 1 km east. End to end is ~1.41 km, along the road 2 km.
    const corner = { lat: 30.7372, lng: 76.7827 };
    const north = { lat: corner.lat + 1 / 110.574, lng: corner.lng };
    const northEast = { lat: north.lat, lng: north.lng + 1 / (111.32 * Math.cos((north.lat * Math.PI) / 180)) };
    expect(pathLengthKm([corner, north, northEast])).toBeCloseTo(2, 1);
    expect(distanceKm(corner, northEast)).toBeCloseTo(1.41, 1);
  });

  it('is zero for a path that goes nowhere', () => {
    expect(pathLengthKm([])).toBe(0);
    expect(pathLengthKm([{ lat: 30.7, lng: 76.7 }])).toBe(0);
  });
});

describe('offRouteMeters / remainingPath', () => {
  it('is ~0 on the road and grows beside it', () => {
    expect(offRouteMeters(road, { lat: 30.7333, lng: 76.7725 })).toBeLessThan(1);
    const beside = offRouteMeters(road, { lat: 30.7342, lng: 76.7725 }); // 0.0009 deg north is about 100 m
    expect(beside).toBeGreaterThan(90);
    expect(beside).toBeLessThan(110);
    expect(offRouteMeters([road[0]], road[0])).toBe(Infinity);
  });
  it('drops the part already driven and starts at the worker', () => {
    const worker = { lat: 30.7333, lng: 76.7765 };
    expect(remainingPath(road, worker)).toEqual([worker, road[2]]);
  });
});

describe('endAtDestination', () => {
  const pin = { lat: 30.6870, lng: 76.7310 };
  it('finishes the line on the pin when the road route stops on a road away from the house', () => {
    const path = [{ lat: 30.6900, lng: 76.7350 }, { lat: 30.6880, lng: 76.7320 }];
    expect(endAtDestination(path, pin)).toEqual([...path, pin]);
  });
  it('leaves a route that already ends at the pin alone', () => {
    const path = [{ lat: 30.6900, lng: 76.7350 }, { lat: 30.68701, lng: 76.73101 }];
    expect(endAtDestination(path, pin)).toBe(path);
  });
  it('draws straight to the pin when there is no path', () => {
    expect(endAtDestination([], pin)).toEqual([pin]);
  });
});

describe('resample', () => {
  it('spaces points evenly and ends on the last point', () => {
    const points = resample(road, 100);
    expect(points[0]).toEqual(road[0]);
    expect(points[points.length - 1]).toEqual(road[2]);
    for (let i = 1; i < points.length - 1; i++) {
      expect(distanceKm(points[i - 1], points[i]) * 1000).toBeGreaterThan(95);
      expect(distanceKm(points[i - 1], points[i]) * 1000).toBeLessThan(105);
    }
    expect(points.length).toBeGreaterThan(10);
  });
  it('keeps the spacing across a corner', () => {
    const corner = [{ lat: 30.7333, lng: 76.77 }, { lat: 30.7333, lng: 76.7712 }, { lat: 30.7345, lng: 76.7712 }];
    const points = resample(corner, 50);
    for (let i = 1; i < points.length - 1; i++) {
      expect(distanceKm(points[i - 1], points[i]) * 1000).toBeGreaterThan(30); // shorter chord across the corner, never a jump
      expect(distanceKm(points[i - 1], points[i]) * 1000).toBeLessThan(52);
    }
  });
});
