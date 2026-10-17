// The one Socket.IO connection to the API's /realtime namespace (backend: realtime.gateway.ts).
//  - one shared socket; it connects when something needs it (a watched job, a location push) and is dropped on sign-out;
//  - the access token is read again for every connection attempt, so a reconnect after a token refresh uses the new one;
//  - the server closes a socket when its token expires and refuses expired tokens: both are healed by making one cheap
//    REST call (the client refreshes the token on a 401) and then connecting again, with a growing delay;
//  - watched jobs are remembered and joined again after every reconnect;
//  - the socket is a convenience, never the source of truth: callers keep a REST fallback (docs/03-api-spec.md section 6).
import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from './config';
import { getAccessToken, hasTokens } from './client';
import { getMe } from './endpoints';
import type { JobLocationPayload } from './types';

// Event names, exactly as the gateway uses them
const EVENT = {
  WATCH: 'job:watch',
  UNWATCH: 'job:unwatch',
  LOCATION_UPDATE: 'location:update',
  JOB_LOCATION: 'job.location',
  JOB_STATUS: 'job.status',
} as const;

const ACK_TIMEOUT_MS = 4000;
const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 30_000;

export interface JobStatusPayload {
  jobId: string;
  status: string;
  at: string;
}
/** What the server answered to a `location:update`. delivered=false means "use the REST fallback". */
export interface LocationAck {
  delivered: boolean;
  /** false when the server dropped the fix because the last one was under 3 s old. */
  accepted?: boolean;
  error?: string;
}

let socket: Socket | null = null;
let wanted = false; // someone needs the connection right now
let authRetries = 0;
let renewing = false;
const watched = new Set<string>();
const connectionListeners = new Set<(up: boolean) => void>();

const announce = (up: boolean) => connectionListeners.forEach((listener) => listener(up));

/** One cheap authenticated call: the REST client refreshes an expired token by itself, then the socket can reconnect. */
async function renewAndReconnect(): Promise<void> {
  if (renewing || !wanted) return;
  renewing = true;
  try {
    await getMe().catch(() => undefined);
    if (!hasTokens()) return; // the login is over: nothing to reconnect with
    const delay = Math.min(RETRY_BASE_MS * 2 ** authRetries, RETRY_MAX_MS);
    authRetries += 1;
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (wanted && socket && !socket.connected && !socket.active) socket.connect();
  } finally {
    renewing = false;
  }
}

function ensureSocket(): Socket {
  if (socket) return socket;
  const created = io(`${API_ORIGIN}/realtime`, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15_000,
    // A function, so every attempt (including automatic reconnects) sends the newest token
    auth: (done) => done({ token: getAccessToken() ?? '' }),
  });
  created.on('connect', () => {
    authRetries = 0;
    watched.forEach((jobId) => created.emit(EVENT.WATCH, { jobId }));
    announce(true);
  });
  created.on('disconnect', (reason) => {
    announce(false);
    // The server ended it (its token expired): socket.io does not retry that by itself
    if (reason === 'io server disconnect') void renewAndReconnect();
  });
  created.on('connect_error', (error) => {
    announce(false);
    // Refused in the handshake: socket.io does not retry that either
    if (error.message === 'token_expired' || error.message === 'unauthorized') void renewAndReconnect();
  });
  socket = created;
  return created;
}

/** Starts the connection if it is not up yet. Safe to call any number of times. */
export function connectSocket(): void {
  if (!hasTokens()) return;
  wanted = true;
  const s = ensureSocket();
  if (!s.connected && !s.active) s.connect();
}

/** Closes the connection and forgets every watched job (sign-out, or nothing left to follow). */
export function disconnectSocket(): void {
  wanted = false;
  watched.clear();
  socket?.disconnect();
}

export const isSocketConnected = (): boolean => socket?.connected === true;

/** Called with true/false whenever the connection comes up or goes down. Returns the way to stop listening. */
export function onConnectionChange(listener: (up: boolean) => void): () => void {
  connectionListeners.add(listener);
  return () => {
    connectionListeners.delete(listener);
  };
}

/** Joins the job's room so `job.location` / `job.status` events arrive. Remembered across reconnects. */
export function watchJob(jobId: string): void {
  watched.add(jobId);
  connectSocket();
  if (socket?.connected) socket.emit(EVENT.WATCH, { jobId });
}

export function unwatchJob(jobId: string): void {
  watched.delete(jobId);
  if (socket?.connected) socket.emit(EVENT.UNWATCH, { jobId });
}

function listen<T>(event: string, callback: (payload: T) => void): () => void {
  const s = ensureSocket();
  s.on(event, callback);
  return () => {
    s.off(event, callback);
  };
}

/** Every `job.location` event (the worker moved). Filter on payload.jobId. Returns the way to stop listening. */
export const onJobLocation = (callback: (payload: JobLocationPayload) => void) => listen<JobLocationPayload>(EVENT.JOB_LOCATION, callback);

/** Every `job.status` event (assigned, arrived, cancelled...). */
export const onJobStatus = (callback: (payload: JobStatusPayload) => void) => listen<JobStatusPayload>(EVENT.JOB_STATUS, callback);

/** Worker side: sends one GPS fix over the socket. Never throws; delivered=false tells the caller to use REST instead. */
export function emitLocationUpdate(jobId: string, lat: number, lng: number): Promise<LocationAck> {
  const s = socket;
  if (!s || !s.connected) return Promise.resolve({ delivered: false, error: 'DISCONNECTED' });
  return new Promise((resolve) => {
    s.timeout(ACK_TIMEOUT_MS).emit(EVENT.LOCATION_UPDATE, { jobId, lat, lng }, (timedOut: Error | null, answer?: { ok: boolean; accepted?: boolean; error?: string }) => {
      if (timedOut || !answer) resolve({ delivered: false, error: 'TIMEOUT' });
      else if (answer.ok) resolve({ delivered: true, accepted: answer.accepted });
      else resolve({ delivered: false, error: answer.error });
    });
  });
}
