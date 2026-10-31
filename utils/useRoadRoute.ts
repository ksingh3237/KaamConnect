// The road route from the worker to the job, fetched sparingly (a routing request costs money and time):
//  - once when both points are known (and again for a new destination);
//  - again only if the worker is more than OFF_ROUTE_M from the line (took another road), at most every MIN_REFETCH_MS;
//  - if a fetch failed, it is retried at the same pace.
// Between fetches the line is simply cut to the part still ahead of the worker, and the distance and arrival time are
// read off that remaining part - so both keep moving with the worker without another request.
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchRoadRoute, type RoadRoute } from './directions';
import { endAtDestination, offRouteMeters, pathLengthKm, remainingPath } from './route';
import { distanceKm, roadTrip, type LatLng, type RoadTrip } from './trip';

export const OFF_ROUTE_M = 150;
/**
 * Closer than this to the address, a road route says nothing useful (it would be snapped to some road around the
 * corner and wander off): the map shows the short direct line to the pin instead.
 */
export const NEAR_DESTINATION_M = 200;
export const MIN_REFETCH_MS = 30_000;

/** The road still to drive: the line, its length and the arrival time. Null while there is no route. */
export interface RemainingRoad extends RoadTrip {
  path: LatLng[];
}

export function useRoadRoute(worker: LatLng | null, destination: LatLng | null): RemainingRoad | null {
  const [route, setRoute] = useState<RoadRoute | null>(null);
  const alive = useRef(true);
  const forDestination = useRef<string | null>(null);
  const lastFetchAt = useRef(0);
  const inFlight = useRef(false);

  const destKey = destination ? `${destination.lat},${destination.lng}` : null;
  const currentDest = useRef(destKey);
  currentDest.current = destKey;
  const workerLat = worker?.lat;
  const workerLng = worker?.lng;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!worker || !destination || !destKey) {
      setRoute(null);
      forDestination.current = null;
      return undefined;
    }
    if (distanceKm(worker, destination) * 1000 < NEAR_DESTINATION_M) return undefined; // see the memo below
    const destinationChanged = forDestination.current !== destKey;
    const due = destinationChanged || route === null || offRouteMeters(route.path, worker) > OFF_ROUTE_M;
    if (!due || inFlight.current) return undefined;
    if (!destinationChanged && Date.now() - lastFetchAt.current < MIN_REFETCH_MS) return undefined;

    inFlight.current = true;
    lastFetchAt.current = Date.now();
    void fetchRoadRoute(worker, destination).then((found) => {
      inFlight.current = false;
      if (!alive.current || currentDest.current !== destKey) return; // closed, or the destination moved on meanwhile
      forDestination.current = destKey;
      setRoute(found);
    });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerLat, workerLng, destKey]);

  return useMemo(() => {
    if (!route || !destination) return null;
    if (worker && distanceKm(worker, destination) * 1000 < NEAR_DESTINATION_M) return null;
    const path = endAtDestination(worker ? remainingPath(route.path, worker) : route.path, destination);
    return { path, ...roadTrip(route, pathLengthKm(path)) };
  }, [route, workerLat, workerLng, destKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
