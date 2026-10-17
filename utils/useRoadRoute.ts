// The road route from the worker to the job for the map, fetched sparingly (a routing request costs money and time):
//  - once when both points are known (and again for a new destination);
//  - again only if the worker is more than OFF_ROUTE_M from the line (took another road), at most every MIN_REFETCH_MS;
//  - if a fetch failed, it is retried at the same pace.
// Between fetches the line is simply cut to the part still ahead of the worker.
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchRoadRoute } from './directions';
import { offRouteMeters, remainingPath } from './route';
import type { LatLng } from './trip';

export const OFF_ROUTE_M = 150;
export const MIN_REFETCH_MS = 30_000;

/** The road path still to drive, or null while there is none (the map then falls back to a straight line). */
export function useRoadRoute(worker: LatLng | null, destination: LatLng | null): LatLng[] | null {
  const [route, setRoute] = useState<LatLng[] | null>(null);
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
    const destinationChanged = forDestination.current !== destKey;
    const due = destinationChanged || route === null || offRouteMeters(route, worker) > OFF_ROUTE_M;
    if (!due || inFlight.current) return undefined;
    if (!destinationChanged && Date.now() - lastFetchAt.current < MIN_REFETCH_MS) return undefined;

    inFlight.current = true;
    lastFetchAt.current = Date.now();
    void fetchRoadRoute(worker, destination).then((found) => {
      inFlight.current = false;
      if (!alive.current || currentDest.current !== destKey) return; // closed, or the destination moved on meanwhile
      forDestination.current = destKey;
      setRoute(found ? found.path : null);
    });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerLat, workerLng, destKey]);

  return useMemo(() => (route && worker ? remainingPath(route, worker) : route), [route, workerLat, workerLng]); // eslint-disable-line react-hooks/exhaustive-deps
}
