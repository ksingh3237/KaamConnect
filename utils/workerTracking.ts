// Streams the worker's GPS to the customer while a job is ASSIGNED (the worker is on the way). One tracking session at a
// time, started by startTracking(jobId) and ended by stopTracking(); nothing runs outside that window.
//
// Where the fixes come from (best first):
//   service - Location.startLocationUpdatesAsync + expo-task-manager. On Android this runs as a foreground service with a
//             persistent "KaamConnect Trip in Progress" notification, so it keeps going when the worker opens Google Maps or
//             locks the phone. Needs the "all the time" location permission.
//   watch   - Location.watchPositionAsync: only while the app is in front / alive. Used when the service cannot start
//             (no background permission, no task manager, Android refusing a service start from the background).
//   sim     - development only: a scripted drive along a road route (startSimulation), no GPS involved.
// All three feed the same pipeline: 10 s / 15 m, socket first (`location:update`) then `PUT /workers/me/location`, never
// faster than the server's 3 s, a 45 s heartbeat for a worker who stands still, and a pause when the person switches
// location off or revokes the permission mid-trip (store.trackingIssue); it resumes by itself.
// The service is started with killServiceOnDestroy: swiping the app away ends the sharing instead of leaving it running.
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { putWorkerLocation } from '../api/endpoints';
import { connectSocket, emitLocationUpdate } from '../api/socket';
import { useStore } from '../store/useStore';
import { fetchRoadRoute } from './directions';
import { getLocationAccess } from './locationPermission';
import { resample } from './route';
import type { LatLng } from './trip';
import { t } from '../i18n';

export const TRACKING_TASK = 'kaamconnect-trip-location';
export const WATCH_OPTIONS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 10_000,
  distanceInterval: 15,
};
/** The phone's "sharing your location" notification, in the person's language at the moment the trip starts. */
export const serviceNotification = () => ({
  notificationTitle: t('KaamConnect Trip in Progress'),
  notificationBody: t('Sharing your live location with the customer'),
  notificationColor: '#00B074',
  killServiceOnDestroy: true,
});
/** Same as the backend's LOCATION_MIN_INTERVAL_MS: sending faster only gets the fix dropped. */
export const MIN_SEND_MS = 3000;
export const HEARTBEAT_MS = 45_000;

type Mode = 'service' | 'watch' | 'sim';

interface Session {
  jobId: string;
  mode: Mode | null;
  subscription: Location.LocationSubscription | null;
  simTimer: ReturnType<typeof setInterval> | null;
  attaching: boolean;
  closed: boolean;
  lastSentAt: number;
  fix: LatLng | null;
}

let session: Session | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;

const ui = () => useStore.getState();
const native = Platform.OS === 'android' || Platform.OS === 'ios';

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

function pushFix(s: Session, fix: LatLng): void {
  if (s.closed) return;
  s.fix = fix;
  ui().setTrackingFix(fix.lat, fix.lng);
  void send(s, fix);
}

const pointOf = (location: Location.LocationObject): LatLng => ({ lat: location.coords.latitude, lng: location.coords.longitude });

// --- the foreground service (must be defined when the app loads, even when it starts headless) ---

if (native) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TRACKING_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const last = data.locations[data.locations.length - 1];
    if (!last) return;
    if (session && !session.closed) pushFix(session, pointOf(last));
    else await stopService(); // a leftover from an earlier run that nothing asked for: shut it down
  });
}

async function backgroundGranted(): Promise<boolean> {
  if (!native) return false;
  try {
    return (await Location.getBackgroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function stopService(): Promise<void> {
  if (!native) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK)) await Location.stopLocationUpdatesAsync(TRACKING_TASK);
  } catch {
    /* already stopped */
  }
}

/** Tries the foreground service. false means "use the watcher instead"; never throws. */
async function startService(s: Session): Promise<boolean> {
  try {
    if (!native || !(await TaskManager.isAvailableAsync()) || !(await backgroundGranted())) return false;
    await Location.startLocationUpdatesAsync(TRACKING_TASK, {
      ...WATCH_OPTIONS,
      foregroundService: serviceNotification(),
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });
    if (s.closed) {
      await stopService(); // stopTracking() ran while the service was starting
      return false;
    }
    s.mode = 'service';
    return true;
  } catch {
    return false; // e.g. Android refuses to start a service from the background
  }
}

async function startWatch(s: Session): Promise<boolean> {
  const subscription = await Location.watchPositionAsync(WATCH_OPTIONS, (location) => pushFix(s, pointOf(location)));
  if (s.closed) {
    subscription.remove();
    return false;
  }
  s.subscription = subscription;
  s.mode = 'watch';
  return true;
}

function release(s: Session): void {
  s.subscription?.remove();
  s.subscription = null;
  if (s.simTimer) clearInterval(s.simTimer);
  s.simTimer = null;
  if (s.mode === 'service') void stopService();
  s.mode = null;
}

/** Starts the best source the permissions allow, or records why nothing could start. */
async function attach(s: Session): Promise<void> {
  if (s.closed || s.attaching || s.mode) return;
  s.attaching = true;
  try {
    const access = await getLocationAccess();
    if (s.closed) return;
    if (access !== 'granted') {
      ui().setTrackingState(false, access === 'services_off' ? 'SERVICES_OFF' : 'PERMISSION');
      return;
    }
    if (!(await startService(s)) && !(await startWatch(s))) return;
    ui().setTrackingState(true, null);
    // The source stays quiet until the worker moves 15 m, so ask for one fix now: the customer sees a dot straight away
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((location) => pushFix(s, pointOf(location)))
      .catch(() => undefined);
  } catch {
    if (!s.closed) ui().setTrackingState(false, 'PERMISSION');
  } finally {
    s.attaching = false;
  }
}

/** Runs on every heartbeat and whenever the app comes back to the front: notices revoked permission, resumes, re-sends. */
async function checkHealth(s: Session): Promise<void> {
  if (s.closed || s.mode === 'sim') return;
  const access = await getLocationAccess();
  if (s.closed) return;
  if (access !== 'granted') {
    release(s);
    ui().setTrackingState(false, access === 'services_off' ? 'SERVICES_OFF' : 'PERMISSION');
    return;
  }
  if (s.mode === 'service' && native && !(await Location.hasStartedLocationUpdatesAsync(TRACKING_TASK).catch(() => false))) s.mode = null; // the system stopped it
  if (!s.mode) {
    await attach(s);
    return;
  }
  if (s.fix && Date.now() - s.lastSentAt >= HEARTBEAT_MS - 1000) void send(s, s.fix);
}

const onAppState = (state: AppStateStatus) => {
  if (state === 'active' && session) void checkHealth(session);
};

function openSession(jobId: string, mode: Mode | null): Session {
  const s: Session = { jobId, mode, subscription: null, simTimer: null, attaching: false, closed: false, lastSentAt: 0, fix: null };
  session = s;
  connectSocket();
  if (mode !== 'sim') {
    heartbeat = setInterval(() => session && void checkHealth(session), HEARTBEAT_MS);
    appStateSubscription = AppState.addEventListener('change', onAppState);
  }
  return s;
}

/**
 * Begins sharing for this job. Call it only while the job is ASSIGNED. Asking again for the same job is harmless: it
 * retries a source that could not start (how "Tap to re-enable" works) and upgrades a watcher to the foreground service
 * once the background permission has been granted. Does not show any permission prompt: see requestWorkerLocationAccess.
 */
export async function startTracking(jobId: string): Promise<void> {
  if (session && session.jobId !== jobId) stopTracking();
  if (session?.mode === 'sim') return; // a scripted drive is running for this job
  if (!session) openSession(jobId, null);
  const s = session as Session | null;
  if (!s) return;
  if (s.mode === 'watch' && (await backgroundGranted())) release(s);
  await attach(s);
}

/** Ends the session: GPS source (watcher or service and its notification), timers and listeners are all released. */
export function stopTracking(): void {
  const s = session;
  session = null;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  if (s) {
    s.closed = true;
    release(s);
  }
  void stopService(); // also covers a service left over from an earlier run of the app
  ui().setTrackingState(false, null);
}

/** Called once at app start: a service from a previous run must not keep the notification and the GPS alive. */
export function releaseOrphanedTask(): void {
  if (!session) void stopService();
}

/** The job being shared right now, if any. */
export const trackedJobId = (): string | null => session?.jobId ?? null;

// --- development: a scripted drive, so both screens can be tested without moving ---

/** Approximate centres: Sector 17 plaza and Sector 22 market, Chandigarh. */
export const SIM_START: LatLng = { lat: 30.7413, lng: 76.7841 };
export const SIM_DEFAULT_DESTINATION: LatLng = { lat: 30.7316, lng: 76.7746 };

export interface SimulationOptions {
  /** Where the drive ends; the job's place when known, otherwise Sector 22. */
  destination?: LatLng | null;
  start?: LatLng;
  /** Distance covered per step. 60 m every 4 s is about 54 km/h. */
  stepMeters?: number;
  tickMs?: number;
}

/**
 * DEV ONLY (does nothing in a release build). Replaces real GPS with a worker driving from Sector 17 to the job along the
 * real road route (straight line if no route can be fetched). The fixes travel the normal pipeline, so the customer's
 * screen sees exactly what it would see for a real trip. Stop with stopTracking() / stopSimulation().
 */
export async function startSimulation(jobId: string, options: SimulationOptions = {}): Promise<boolean> {
  if (!__DEV__) return false;
  stopTracking();
  const start = options.start ?? SIM_START;
  const end = options.destination ?? SIM_DEFAULT_DESTINATION;
  const s = openSession(jobId, 'sim');
  const route = await fetchRoadRoute(start, end);
  if (s.closed) return false; // stopped while the route was loading
  const points = resample(route?.path ?? [start, end], options.stepMeters ?? 60);
  let step = 0;
  ui().setTrackingState(true, null);
  const tick = () => {
    if (s.closed) return;
    pushFix(s, points[step]);
    step += 1;
    if (step >= points.length && s.simTimer) {
      clearInterval(s.simTimer); // parked at the destination until the worker verifies arrival
      s.simTimer = null;
    }
  };
  tick();
  s.simTimer = setInterval(tick, Math.max(options.tickMs ?? 4000, MIN_SEND_MS));
  return true;
}

export const isSimulating = (): boolean => session?.mode === 'sim';
export const stopSimulation = (): void => {
  if (isSimulating()) stopTracking();
};

export const workerTracking = { startTracking, stopTracking, trackedJobId, startSimulation, stopSimulation, isSimulating };
