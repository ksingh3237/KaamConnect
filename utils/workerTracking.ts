// Streams the worker's GPS to the customer while a job is ASSIGNED (the worker is on the way). One tracking session at a
// time, started by startTracking(jobId) and ended by stopTracking(); nothing runs outside that window.
//  - Fixes come from expo-location's watchPositionAsync: balanced accuracy, at most every 10 s, only after 15 m of movement.
//  - Each fix goes over the socket (`location:update`); if the socket is down, slow or refuses, the same fix goes to
//    `PUT /workers/me/location`. Fixes closer than 3 s together are skipped (the server drops them anyway).
//  - Standing still sends nothing, so a heartbeat re-sends the last fix every 45 s: the customer's map shows "live", not stale.
//  - If the person switches location off or revokes the permission mid-trip, sharing pauses (store.trackingIssue) and
//    resumes by itself when it is back; nothing crashes.
// Limit: this is watchPositionAsync, so it runs while the app process is alive. With the "always" permission it normally
// survives opening Google Maps, but the phone may still freeze or kill the app; a true background service would need
// expo-task-manager + startLocationUpdatesAsync with a foreground-service notification.
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { putWorkerLocation } from '../api/endpoints';
import { connectSocket, emitLocationUpdate } from '../api/socket';
import { useStore } from '../store/useStore';
import { getLocationAccess } from './locationPermission';
import type { LatLng } from './trip';

export const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 10_000,
  distanceInterval: 15,
};
/** Same as the backend's LOCATION_MIN_INTERVAL_MS: sending faster only gets the fix dropped. */
export const MIN_SEND_MS = 3000;
export const HEARTBEAT_MS = 45_000;

interface Session {
  jobId: string;
  subscription: Location.LocationSubscription | null;
  attaching: boolean;
  closed: boolean;
  lastSentAt: number;
  fix: LatLng | null;
}

let session: Session | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

const ui = () => useStore.getState();

async function send(s: Session, fix: LatLng): Promise<void> {
  const now = Date.now();
  if (now - s.lastSentAt < MIN_SEND_MS) return;
  s.lastSentAt = now; // claimed before the first await, so two fixes arriving together cannot both go out
  const ack = await emitLocationUpdate(s.jobId, fix.lat, fix.lng);
  if (ack.delivered || ack.error === 'NOT_FOUND') return; // NOT_FOUND: no longer under way for this worker, the screens will stop us
  try {
    await putWorkerLocation(fix.lat, fix.lng);
  } catch {
    /* offline or refused: the next fix tries again */
  }
}

function onFix(s: Session, location: Location.LocationObject): void {
  if (s.closed) return;
  const fix = { lat: location.coords.latitude, lng: location.coords.longitude };
  s.fix = fix;
  ui().setTrackingFix(fix.lat, fix.lng);
  void send(s, fix);
}

/** Opens the GPS watcher if the permission and the phone's location switch allow it; otherwise records why not. */
async function attach(s: Session): Promise<void> {
  if (s.closed || s.attaching || s.subscription) return;
  s.attaching = true;
  try {
    const access = await getLocationAccess();
    if (s.closed) return;
    if (access !== 'granted') {
      ui().setTrackingState(false, access === 'services_off' ? 'SERVICES_OFF' : 'PERMISSION');
      return;
    }
    const subscription = await Location.watchPositionAsync(WATCH_OPTIONS, (location) => onFix(s, location));
    if (s.closed) {
      subscription.remove();
      return;
    }
    s.subscription = subscription;
    ui().setTrackingState(true, null);
    // The watcher stays quiet until the worker moves 15 m, so ask for one fix now: the customer sees a dot straight away
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((location) => onFix(s, location))
      .catch(() => undefined);
  } catch {
    if (!s.closed) ui().setTrackingState(false, 'PERMISSION');
  } finally {
    s.attaching = false;
  }
}

/** Runs on every heartbeat and whenever the app comes back to the front: notices revoked permission, resumes, re-sends. */
async function checkHealth(s: Session): Promise<void> {
  if (s.closed) return;
  const access = await getLocationAccess();
  if (s.closed) return;
  if (access !== 'granted') {
    s.subscription?.remove();
    s.subscription = null;
    ui().setTrackingState(false, access === 'services_off' ? 'SERVICES_OFF' : 'PERMISSION');
    return;
  }
  if (!s.subscription) {
    await attach(s);
    return;
  }
  if (s.fix && Date.now() - s.lastSentAt >= HEARTBEAT_MS - 1000) void send(s, s.fix);
}

const onAppState = (state: AppStateStatus) => {
  if (state === 'active' && session) void checkHealth(session);
};

/**
 * Begins sharing for this job. Call it only while the job is ASSIGNED. Asking again for the same job is harmless (it also
 * retries a watcher that could not start, which is how "Tap to re-enable" works). Does not show any permission prompt:
 * see requestWorkerLocationAccess for that.
 */
export async function startTracking(jobId: string): Promise<void> {
  if (session && session.jobId !== jobId) stopTracking();
  if (!session) {
    session = { jobId, subscription: null, attaching: false, closed: false, lastSentAt: 0, fix: null };
    connectSocket();
    heartbeat = setInterval(() => session && void checkHealth(session), HEARTBEAT_MS);
    appStateSubscription = AppState.addEventListener('change', onAppState);
  }
  await attach(session);
}

/** Ends the session: GPS watcher, timers and listeners are all released. Safe to call when nothing is running. */
export function stopTracking(): void {
  const s = session;
  session = null;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  if (s) {
    s.closed = true;
    s.subscription?.remove();
    s.subscription = null;
  }
  ui().setTrackingState(false, null);
}

/** The job being shared right now, if any. */
export const trackedJobId = (): string | null => session?.jobId ?? null;

export const workerTracking = { startTracking, stopTracking, trackedJobId };
