// The timing rules for the worker's "I am here" reports (utils/presence.ts), kept free of native modules so they can be tested.

/** How often a worker who keeps the app open is re-reported. Far below the server's 30 minutes (LOCATION_FRESH_MS). */
export const PRESENCE_INTERVAL_MS = 5 * 60 * 1000;
/** Coming back to the app never re-reports more often than this. */
export const PRESENCE_MIN_GAP_MS = 60 * 1000;

/** True when no report has gone out yet or the last one is at least `gapMs` old. */
export function isPresenceDue(lastSentAt: number | null, now: number, gapMs: number): boolean {
  return lastSentAt === null || now - lastSentAt >= gapMs;
}
