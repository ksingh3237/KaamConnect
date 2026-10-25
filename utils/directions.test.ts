import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./googlePlaces', () => ({ GOOGLE_MAPS_KEY: 'test-key', mapsConfigured: true }));

const osrmBody = { code: 'Ok', routes: [{ geometry: { coordinates: [[76.7, 30.7], [76.8, 30.8]] } }] };
const from = { lat: 30.7, lng: 76.7 };
const to = { lat: 30.8, lng: 76.8 };

const respond = (status: number, body: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const hosts = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.map((c) => new URL(String(c[0])).host);

afterEach(() => vi.unstubAllGlobals());

describe('fetchRoadRoute when the Routes API is not enabled on the key', () => {
  it('falls back to the free road service, and stops asking Google after the first 403', async () => {
    vi.resetModules();
    const fetchMock = vi.fn(async (url: unknown) => (String(url).includes('routes.googleapis.com') ? respond(403) : respond(200, osrmBody)));
    vi.stubGlobal('fetch', fetchMock);
    const { fetchRoadRoute } = await import('./directions');

    const first = await fetchRoadRoute(from, to);
    const second = await fetchRoadRoute(from, to);

    expect(first?.source).toBe('osrm');
    expect(second?.source).toBe('osrm');
    expect(hosts(fetchMock)).toEqual(['routes.googleapis.com', 'router.project-osrm.org', 'router.project-osrm.org']);
  });

  it('keeps asking Google after an error that is not "denied" (offline, 500)', async () => {
    vi.resetModules();
    const fetchMock = vi.fn(async (url: unknown) => (String(url).includes('routes.googleapis.com') ? respond(500) : respond(200, osrmBody)));
    vi.stubGlobal('fetch', fetchMock);
    const { fetchRoadRoute } = await import('./directions');

    await fetchRoadRoute(from, to);
    await fetchRoadRoute(from, to);

    expect(hosts(fetchMock).filter((h) => h === 'routes.googleapis.com')).toHaveLength(2);
  });

  it('returns null (the map draws a straight line) when nothing answers', async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => respond(503)));
    const { fetchRoadRoute } = await import('./directions');
    expect(await fetchRoadRoute(from, to)).toBeNull();
  });
});
