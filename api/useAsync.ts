// A small hook for "load this when the screen opens (and again on demand)", so every screen shows the same three
// states: loading, failed (with a retry), and the data. It also reloads when the screen regains focus, which is how
// the app stays current without a socket: REST is the source of truth (docs/03-api-spec.md section 6).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { isApiError, userMessage } from './errors';

export interface AsyncState<T> {
  data: T | null;
  /** True only for the first load; a refresh keeps showing the old data. */
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** The error code (NETWORK, NOT_FOUND, ...) for screens that treat some failures specially. */
  errorCode: string | null;
  reload: () => Promise<void>;
}

export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[] = [], options: { reloadOnFocus?: boolean; pollMs?: number } = {}): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const alive = useRef(true);
  const seq = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(async (initial: boolean) => {
    const mine = ++seq.current; // ignore an older request that finishes after a newer one
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const value = await loadRef.current();
      if (!alive.current || mine !== seq.current) return;
      setData(value);
      setError(null);
      setErrorCode(null);
    } catch (e) {
      if (!alive.current || mine !== seq.current) return;
      setError(userMessage(e));
      setErrorCode(isApiError(e) ? e.code : null);
    } finally {
      if (alive.current && mine === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    alive.current = true;
    void run(true);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      if (options.reloadOnFocus !== false) void run(false);
      if (!options.pollMs) return undefined;
      const timer = setInterval(() => void run(false), options.pollMs);
      return () => clearInterval(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, options.pollMs, options.reloadOnFocus]),
  );

  return { data, loading, refreshing, error, errorCode, reload: () => run(false) };
}
