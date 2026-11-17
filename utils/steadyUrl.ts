// Photos come as signed links that the server re-signs from time to time (a new `exp`/`sig` or X-Amz-* query). To an
// <Image> a new link is a new picture: it drops the one on screen and downloads again, which on a screen that polls
// every few seconds looks like the photo blinking. This keeps handing out the link already in use for the same file
// until it is about to expire. Pure apart from its small cache, so it is unit tested (steadyUrl.test.ts).

/** Swap to the new link this long before the one in use expires. */
export const RENEW_BEFORE_MS = 60_000;

/** The file behind a link: everything but the query. Also the right React key for an image. */
export function mediaPath(url: string): string {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}

/** When a signed link stops working (ms), or null when it does not say. */
export function expiresAt(url: string): number | null {
  const q = url.indexOf('?');
  if (q === -1) return null;
  const params = new URLSearchParams(url.slice(q + 1));
  const exp = params.get('exp'); // development storage: seconds since 1970
  if (exp && /^\d+$/.test(exp)) return Number(exp) * 1000;
  const date = params.get('X-Amz-Date'); // S3: 20261102T100000Z + X-Amz-Expires seconds
  const ttl = params.get('X-Amz-Expires');
  const m = date ? /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(date) : null;
  if (m && ttl && /^\d+$/.test(ttl)) {
    return Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!) + Number(ttl) * 1000;
  }
  return null;
}

const inUse = new Map<string, string>();
const MAX_ENTRIES = 300;

/** The link to show for this file: the one already showing while it is still good, else this new one. */
export function steadyUrl(url: string, now: number = Date.now()): string {
  const path = mediaPath(url);
  if (path === url) return url; // not a signed link
  const current = inUse.get(path);
  if (current && current !== url) {
    const until = expiresAt(current);
    if (until !== null && until - now > RENEW_BEFORE_MS) return current;
  }
  if (inUse.size >= MAX_ENTRIES && !inUse.has(path)) inUse.delete(inUse.keys().next().value!);
  inUse.set(path, url);
  return url;
}

/** Tests only. */
export function resetSteadyUrls(): void {
  inUse.clear();
}
