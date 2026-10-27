// Tells the server where a worker is while the app is open and they are taking jobs, so leads follow the worker and not
// only the sector on their profile. The backend trusts a fix for 30 minutes (LOCATION_FRESH_MS); we refresh well inside
// that. A trip (workerTracking.ts) already sends much faster fixes, so this stays quiet while one is running.
// Foreground only and no permission prompt of its own: the explanation modal + system dialogs live in locationPermission.ts.
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { putWorkerLocation } from '../api/endpoints';
import { getLocationAccess } from './locationPermission';
import { isPresenceDue, PRESENCE_INTERVAL_MS, PRESENCE_MIN_GAP_MS } from './presencePolicy';
import { trackedJobId } from './workerTracking';

let lastSentAt: number | null = null;
let inFlight = false;

/** One report, if the policy and the phone allow it. Never throws; a failure just means the next tick tries again. */
export async function reportPresence(gapMs: number = PRESENCE_MIN_GAP_MS): Promise<boolean> {
  if (inFlight || trackedJobId() !== null) return false; // a trip is already sending fixes
  if (!isPresenceDue(lastSentAt, Date.now(), gapMs)) return false;
  inFlight = true;
  try {
    if ((await getLocationAccess()) !== 'granted') return false;
    const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await putWorkerLocation(here.coords.latitude, here.coords.longitude);
    lastSentAt = Date.now();
    return true;
  } catch {
    return false; // offline, refused (not verified yet), or no fix: nothing to tell the person
  } finally {
    inFlight = false;
  }
}

/** Starts the periodic reporting; returns the function that stops it. */
export function startPresence(): () => void {
  void reportPresence();
  const timer = setInterval(() => void reportPresence(PRESENCE_INTERVAL_MS - 1000), PRESENCE_INTERVAL_MS);
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') void reportPresence();
  });
  return () => {
    clearInterval(timer);
    subscription.remove();
  };
}

/** A new login must not inherit the previous person's timer. */
export function resetPresence(): void {
  lastSentAt = null;
}
