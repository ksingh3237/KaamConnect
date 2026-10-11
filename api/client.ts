// The one place that talks HTTP to the KaamConnect API.
//  - attaches the access token;
//  - on a 401 it refreshes the token ONCE (single-flight: two calls that fail together share one refresh, because the
//    server revokes the whole login when a refresh token is used twice, backend note K-6) and retries the call;
//  - turns every failure into an ApiError with the server's machine-readable code;
//  - gives up after REQUEST_TIMEOUT_MS instead of hanging a spinner forever.
import { API_BASE, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, type FieldIssue } from './errors';
import { clearTokens, loadTokens, saveTokens, type StoredTokens } from './storage';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false for the public routes (login, refresh). Default true. */
  auth?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

let tokens: StoredTokens | null = null;
let loaded = false;
let sessionEndedHandler: (() => void) | null = null;
let refreshing: Promise<boolean> | null = null;

/** The app registers what happens when the login can no longer be renewed (it shows the sign-in screen). */
export function onSessionEnded(handler: (() => void) | null): void {
  sessionEndedHandler = handler;
}

export async function restoreTokens(): Promise<boolean> {
  tokens = await loadTokens();
  loaded = true;
  return tokens !== null;
}

export async function setTokens(next: StoredTokens | null): Promise<void> {
  tokens = next;
  loaded = true;
  if (next) await saveTokens(next);
  else await clearTokens();
}

export const hasTokens = (): boolean => tokens !== null;
export const getRefreshToken = (): string | null => tokens?.refreshToken ?? null;
export const getAccessToken = (): string | null => tokens?.accessToken ?? null;

function requestId(): string {
  // 8 to 64 of [A-Za-z0-9._-]: the server keeps it, so a log line can be matched to what the user saw
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `${url}?${parts.join('&')}` : url;
}

async function toApiError(response: Response, id: string): Promise<ApiError> {
  let code = `HTTP_${response.status}`;
  let message = response.statusText || 'Request failed';
  let details: FieldIssue[] = [];
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object') {
      const body = parsed as { code?: unknown; message?: unknown; details?: unknown };
      if (typeof body.code === 'string') code = body.code;
      if (typeof body.message === 'string') message = body.message;
      if (Array.isArray(body.details)) {
        details = body.details.filter(
          (d): d is FieldIssue =>
            typeof d === 'object' && d !== null && typeof (d as FieldIssue).field === 'string' && typeof (d as FieldIssue).issue === 'string',
        );
      }
    }
  } catch {
    /* not JSON (a proxy error page): keep the status line */
  }
  const retry = Number(response.headers.get('retry-after'));
  return new ApiError(
    response.status,
    code,
    message,
    details,
    response.headers.get('x-request-id') ?? id,
    Number.isFinite(retry) && retry > 0 ? retry : undefined,
  );
}

async function send(method: Method, path: string, options: RequestOptions, useToken: boolean): Promise<Response> {
  const id = requestId();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-Id': id,
      ...(options.headers ?? {}),
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (useToken && tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    const response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw await toApiError(response, id);
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'The request timed out', [], id);
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server', [], id);
  } finally {
    clearTimeout(timer);
  }
}

/** Exchanges the refresh token for a new pair. Shared by every caller that needs it at the same moment. */
async function refreshTokens(): Promise<boolean> {
  if (!tokens) return false;
  if (!refreshing) {
    const used = tokens.refreshToken;
    refreshing = (async () => {
      try {
        const response = await send('POST', '/auth/refresh', { body: { refreshToken: used }, auth: false }, false);
        const pair = (await response.json()) as { accessToken: string; refreshToken: string };
        await setTokens({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
        return true;
      } catch (error) {
        // The server said no (401 reuse, 403 disabled): the login is over. A network failure is NOT that: keep it.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          await setTokens(null);
          return false;
        }
        throw error;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  if (!loaded) await restoreTokens();
  const useToken = options.auth !== false;
  try {
    const response = await send(method, path, options, useToken);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (useToken && error instanceof ApiError && error.status === 401 && tokens) {
      const renewed = await refreshTokens();
      if (renewed) {
        const retried = await send(method, path, options, true);
        if (retried.status === 204) return undefined as T;
        return (await retried.json()) as T;
      }
      sessionEndedHandler?.();
    }
    throw error;
  }
}

export const get = <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options);
export const post = <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body: body ?? {} });
export const put = <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body: body ?? {} });
export const patch = <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body: body ?? {} });
export const del = <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options);
