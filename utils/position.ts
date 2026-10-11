// The device's real position, or a clear "not available". Used where the app can send lat/lng (address, SOS, worker
// pings). It never invents a location: on a device without a position service the caller gets a rejection and shows that.
export interface Position {
  lat: number;
  lng: number;
}

export function currentPosition(timeoutMs = 8000): Promise<Position> {
  return new Promise((resolve, reject) => {
    const geo = (globalThis as { navigator?: { geolocation?: Geolocation } }).navigator?.geolocation;
    if (!geo) {
      reject(new Error('LOCATION_UNAVAILABLE'));
      return;
    }
    geo.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.code === 1 ? 'LOCATION_DENIED' : 'LOCATION_UNAVAILABLE')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
