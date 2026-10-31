// Pure helpers for road routes: decoding what the routing services send, keeping only the part of the route still ahead of
// the worker, noticing that the worker left the route, and cutting a route into evenly spaced points (the dev simulator
// drives along them). No network and no React here, so it is unit tested (route.test.ts).
import { distanceKm, type LatLng } from './trip';

/** What a routing service answered: the road line, and how long that road is / takes. */
export interface ParsedRoute {
  path: LatLng[];
  /** Road distance of the WHOLE route. Null when the service only gave a line. */
  distanceKm: number | null;
  /** The service's own driving time for the whole route, in minutes. Null when it gave none. */
  durationMinutes: number | null;
}

/** Google's encoded polyline format (precision 5), as returned by the Routes and Directions APIs. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const readValue = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += readValue();
    lng += readValue();
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Google Routes API (computeRoutes) answer -> route, or null when it holds no route. */
export function parseGoogleRoute(json: unknown): ParsedRoute | null {
  const route = (json as { routes?: { polyline?: { encodedPolyline?: unknown }; distanceMeters?: unknown; duration?: unknown }[] } | null)?.routes?.[0];
  const encoded = route?.polyline?.encodedPolyline;
  if (typeof encoded !== 'string' || encoded === '') return null;
  const path = decodePolyline(encoded);
  if (path.length < 2) return null;
  return {
    path,
    distanceKm: typeof route?.distanceMeters === 'number' ? route.distanceMeters / 1000 : null,
    // Google writes a duration as seconds with a trailing "s" ("843s")
    durationMinutes: secondsToMinutes(typeof route?.duration === 'string' ? Number.parseFloat(route.duration) : null),
  };
}

/** OSRM route answer (geometries=geojson, [lng, lat] pairs) -> route, or null. */
export function parseOsrmRoute(json: unknown): ParsedRoute | null {
  const body = json as { code?: unknown; routes?: { geometry?: { coordinates?: unknown }; distance?: unknown; duration?: unknown }[] } | null;
  const route = body?.routes?.[0];
  const coordinates = route?.geometry?.coordinates;
  if (body?.code !== 'Ok' || !Array.isArray(coordinates)) return null;
  const path = coordinates.flatMap((c) => (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number' ? [{ lat: c[1], lng: c[0] }] : []));
  if (path.length < 2) return null;
  return {
    path,
    distanceKm: typeof route?.distance === 'number' ? route.distance / 1000 : null,
    durationMinutes: secondsToMinutes(typeof route?.duration === 'number' ? route.duration : null),
  };
}

/** Both services answer in seconds; a negative or unreadable value is "no time given". */
function secondsToMinutes(seconds: number | null): number | null {
  return seconds !== null && Number.isFinite(seconds) && seconds >= 0 ? seconds / 60 : null;
}

// Flat-earth maths is exact enough over a few kilometres
const metresPerDegLat = 110_540;
const metresPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

interface Nearest {
  /** Index of the segment (path[i] -> path[i + 1]) closest to the point. */
  segment: number;
  metres: number;
}

function nearestSegment(path: LatLng[], point: LatLng): Nearest {
  const kx = metresPerDegLng(point.lat);
  let best: Nearest = { segment: 0, metres: Infinity };
  for (let i = 0; i < path.length - 1; i++) {
    const ax = (path[i].lng - point.lng) * kx;
    const ay = (path[i].lat - point.lat) * metresPerDegLat;
    const bx = (path[i + 1].lng - point.lng) * kx;
    const by = (path[i + 1].lat - point.lat) * metresPerDegLat;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const metres = Math.hypot(ax + t * dx, ay + t * dy);
    if (metres < best.metres) best = { segment: i, metres };
  }
  return best;
}

/** How far the point is from the route line, in metres. */
export function offRouteMeters(path: LatLng[], point: LatLng): number {
  return path.length < 2 ? Infinity : nearestSegment(path, point).metres;
}

/** The route from the worker's current spot onward: what was already driven is dropped. */
export function remainingPath(path: LatLng[], point: LatLng): LatLng[] {
  if (path.length < 2) return path;
  return [point, ...path.slice(nearestSegment(path, point).segment + 1)];
}

/**
 * Routing services snap both ends to the nearest road, so a route can stop short of the house or run past it to a
 * road on the other side. The line on the map must still end on the red pin: append the address when the route's
 * last point is more than ARRIVE_GAP_M away from it.
 */
export const ARRIVE_GAP_M = 15;
export function endAtDestination(path: LatLng[], destination: LatLng): LatLng[] {
  const last = path[path.length - 1];
  if (!last) return [destination];
  return distanceKm(last, destination) * 1000 > ARRIVE_GAP_M ? [...path, destination] : path;
}

/** How long a path is along its own segments, in kilometres. */
export function pathLengthKm(path: LatLng[]): number {
  let km = 0;
  for (let i = 0; i < path.length - 1; i++) km += distanceKm(path[i], path[i + 1]);
  return km;
}

/** Points along the path about `stepMeters` apart, ending exactly on its last point. */
export function resample(path: LatLng[], stepMeters: number): LatLng[] {
  if (path.length < 2 || stepMeters <= 0) return path.slice();
  const out: LatLng[] = [path[0]];
  let carried = 0; // distance walked since the last emitted point
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const segment = distanceKm(a, b) * 1000;
    let at = stepMeters - carried;
    while (at <= segment) {
      const f = at / segment;
      out.push({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f });
      at += stepMeters;
    }
    carried = segment - (at - stepMeters);
  }
  const last = path[path.length - 1];
  const tail = out[out.length - 1];
  if (tail.lat !== last.lat || tail.lng !== last.lng) out.push(last);
  return out;
}
