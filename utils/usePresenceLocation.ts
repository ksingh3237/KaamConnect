// Runs the worker's "I am here" reporting (utils/presence.ts) for as long as the screen that uses it is mounted and
// `enabled` is true (a verified worker who has "taking jobs" switched on).
import { useEffect } from 'react';
import { resetPresence, startPresence } from './presence';

export function usePresenceLocation(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const stop = startPresence();
    return () => {
      stop();
      resetPresence();
    };
  }, [enabled]);
}
