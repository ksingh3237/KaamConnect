import { beforeEach, describe, expect, it } from 'vitest';
import { RENEW_BEFORE_MS, expiresAt, mediaPath, resetSteadyUrls, steadyUrl } from './steadyUrl';

const FILE = 'http://api.test/api/v1/dev-storage/media/u/1/WORK_PROOF/a.jpg';
const local = (expSec: number, sig = 'abc') => `${FILE}?exp=${expSec}&sig=${sig}`;
const NOW = Date.parse('2026-11-02T10:00:00Z');
const sec = (ms: number) => Math.floor(ms / 1000);

beforeEach(() => resetSteadyUrls());

describe('expiresAt', () => {
  it('reads the development link and the S3 link', () => {
    expect(expiresAt(local(1_800_000_000))).toBe(1_800_000_000_000);
    const s3 = 'https://b.s3.amazonaws.com/u/1/a.jpg?X-Amz-Algorithm=AWS4&X-Amz-Date=20261102T100000Z&X-Amz-Expires=900&X-Amz-Signature=f';
    expect(expiresAt(s3)).toBe(Date.parse('2026-11-02T10:15:00Z'));
    expect(expiresAt(FILE)).toBeNull();
    expect(expiresAt(`${FILE}?v=2`)).toBeNull();
  });

  it('mediaPath drops the query', () => {
    expect(mediaPath(local(1))).toBe(FILE);
  });
});

describe('steadyUrl', () => {
  it('keeps the link already on screen when the server re-signs the same photo (the blinking)', () => {
    const first = local(sec(NOW) + 600, 'one');
    expect(steadyUrl(first, NOW)).toBe(first);
    // 6 seconds later the poll brings a new signature for the same file
    expect(steadyUrl(local(sec(NOW) + 606, 'two'), NOW + 6000)).toBe(first);
  });

  it('moves to the new link shortly before the old one expires', () => {
    const first = local(sec(NOW) + 600, 'one');
    steadyUrl(first, NOW);
    const later = NOW + 600_000 - RENEW_BEFORE_MS + 1;
    const fresh = local(sec(later) + 600, 'two');
    expect(steadyUrl(fresh, later)).toBe(fresh);
    expect(steadyUrl(local(sec(later) + 610, 'three'), later + 5000)).toBe(fresh);
  });

  it('a different photo is never swapped for another, and a plain link passes through', () => {
    const a = local(sec(NOW) + 600);
    const b = `${FILE.replace('a.jpg', 'b.jpg')}?exp=${sec(NOW) + 600}&sig=x`;
    expect(steadyUrl(a, NOW)).toBe(a);
    expect(steadyUrl(b, NOW)).toBe(b);
    expect(steadyUrl(FILE, NOW)).toBe(FILE);
  });
});
