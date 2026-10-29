// The live trip map shared by the customer's tracking screen and the worker's job screen: the worker's vehicle (it glides
// between fixes and its arrow turns the way they travel), the job's place as a red pin, the viewer's own blue dot, and a
// line between them. How far and how long is shown on a chip in the corner.
// The line follows real roads (utils/directions.ts: Google Routes, else free OSRM); if neither answers it falls back to a
// dotted straight line so the map still shows direction.
// Native only. react-native-maps has no web build; TripMap.web.tsx is shown there instead.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocateFixed, Navigation } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { nextHeading, vehicleEmoji, type LatLng, type RoadTrip } from '../utils/trip';
import { mapsConfigured } from '../utils/googlePlaces';
import { useRoadRoute } from '../utils/useRoadRoute';

export interface TripMapProps {
  worker: LatLng | null;
  destination: LatLng | null;
  vehicle?: string | null;
  /** The server's straight-line distance and arrival time. Used only until the road route answers, which is better. */
  distanceKm?: number | null;
  etaMinutes?: number | null;
  /** Told the road numbers whenever they change, for a screen that shows them outside the map (the customer's pill). */
  onTrip?: (trip: RoadTrip | null) => void;
  /** Space the fitted view keeps clear of the floating pill (top) and the bottom sheet (bottom). */
  padding?: { top: number; right: number; bottom: number; left: number };
  height?: number;
  /** Fill the parent instead of using `height`. */
  fill?: boolean;
}

const GLIDE_MS = 1000;
const STEP_MS = 100;
const DEFAULT_PADDING = { top: 60, right: 50, bottom: 60, left: 50 };
/** The pin colour every ride app uses for "this is the place". */
const PIN_RED = '#E53935';
const CITY_CENTRE = { latitude: 30.7333, longitude: 76.7794, latitudeDelta: 0.12, longitudeDelta: 0.12 }; // Chandigarh, shown only until a first point exists

/** The worker's dot moves from where it was to where it is over one second instead of jumping. */
function useGlide(target: LatLng | null): LatLng | null {
  const [shown, setShown] = useState<LatLng | null>(target);
  const shownRef = useRef<LatLng | null>(target);
  useEffect(() => {
    if (!target) {
      shownRef.current = null;
      setShown(null);
      return undefined;
    }
    const from = shownRef.current;
    if (!from) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / GLIDE_MS);
      const eased = t * (2 - t);
      const point = { lat: from.lat + (target.lat - from.lat) * eased, lng: from.lng + (target.lng - from.lng) * eased };
      shownRef.current = point;
      setShown(point);
      if (t >= 1) clearInterval(timer);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

export default function TripMap({ worker, destination, vehicle, distanceKm = null, etaMinutes = null, onTrip, padding = DEFAULT_PADDING, height = 220, fill = false }: TripMapProps) {
  const mapRef = useRef<MapView>(null);
  const ready = useRef(false);
  const [detached, setDetached] = useState(false); // the person moved the map themselves: stop re-fitting under their finger
  const [heading, setHeading] = useState(0);
  const lastFix = useRef<LatLng | null>(null);
  const [redraw, setRedraw] = useState(true); // custom marker views are redrawn only while something changed
  const glided = useGlide(worker);
  const road = useRoadRoute(worker, destination);
  // Along the road beats the crow's flight; the server's straight-line numbers stand in until the route answers
  const shownKm = road?.distanceKm ?? distanceKm;
  const shownEta = road?.etaMinutes ?? etaMinutes;

  const reportTrip = useRef(onTrip);
  reportTrip.current = onTrip;
  useEffect(() => {
    reportTrip.current?.(road ? { distanceKm: road.distanceKm, etaMinutes: road.etaMinutes } : null);
  }, [road?.distanceKm, road?.etaMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!worker) return undefined;
    setHeading((h) => nextHeading(lastFix.current, worker, h));
    lastFix.current = worker;
    setRedraw(true);
    const timer = setTimeout(() => setRedraw(false), GLIDE_MS + 400);
    return () => clearTimeout(timer);
  }, [worker?.lat, worker?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const fit = useCallback(() => {
    const points = [worker, destination].filter((p): p is LatLng => p !== null).map((p) => ({ latitude: p.lat, longitude: p.lng }));
    if (!ready.current || points.length === 0) return;
    if (points.length === 1) {
      mapRef.current?.animateToRegion({ latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 400);
      return;
    }
    mapRef.current?.fitToCoordinates(points, { edgePadding: padding, animated: true });
  }, [worker?.lat, worker?.lng, destination?.lat, destination?.lng, padding.top, padding.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!detached) fit();
  }, [fit, detached]);

  if (!mapsConfigured) {
    return (
      <View style={[styles.fallback, fill ? StyleSheet.absoluteFill : { height }]}>
        <Navigation color={Colors.primaryDark} size={26} />
        <Text style={styles.fallbackText}>Live map needs the Google Maps key. Distance and arrival time below are still live.</Text>
      </View>
    );
  }

  const first = worker ?? destination;
  return (
    <View style={fill ? StyleSheet.absoluteFill : [styles.box, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={first ? { latitude: first.lat, longitude: first.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 } : CITY_CENTRE}
        onMapReady={() => {
          ready.current = true;
          fit();
        }}
        onPanDrag={() => setDetached(true)}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // Each side also sees where THEY are, the way every ride app does
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {destination && (
          <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} anchor={{ x: 0.5, y: 0.95 }} tracksViewChanges={false} title="Job location">
            {/* A teardrop pin whose tip sits on the address: a rounded square with one sharp corner, turned 45 degrees */}
            <View style={styles.pinWrap}>
              <View style={styles.pinHead} />
              <View style={styles.pinCore} />
            </View>
          </Marker>
        )}
        {worker && destination && (
          <Polyline
            coordinates={(road?.path ?? [worker, destination]).map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={Colors.primary}
            strokeWidth={5}
            // Solid along real roads; dotted when only the straight line between the two points is known
            lineDashPattern={road ? undefined : [1, 10]}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {glided && (
          <Marker coordinate={{ latitude: glided.lat, longitude: glided.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={redraw} zIndex={2} title="Worker">
            <View style={styles.vehicleWrap}>
              <View style={[styles.arrow, { transform: [{ rotate: `${heading}deg` }] }]}>
                {/* the icon itself points up-right (45 degrees): turn it back so "up" means the travel direction */}
                <View style={{ transform: [{ rotate: '-45deg' }] }}>
                  <Navigation color={Colors.primary} fill={Colors.primary} size={16} />
                </View>
              </View>
              <View style={styles.vehicle}>
                <Text style={styles.vehicleEmoji}>{vehicleEmoji(vehicle)}</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>
      {(shownKm !== null || shownEta !== null) && (
        <View style={styles.chip} accessibilityLiveRegion="polite">
          <Text style={styles.chipText}>
            {shownEta !== null ? `${shownEta} min` : 'On the way'}
            {shownKm !== null ? ` • ${shownKm} km` : ''}
          </Text>
        </View>
      )}
      {detached && (
        <TouchableOpacity style={styles.recentre} onPress={() => setDetached(false)} accessibilityRole="button" accessibilityLabel="Show worker and destination">
          <LocateFixed color={Colors.textMain} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.surfaceVariant },
  fallback: { backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16, borderRadius: Radius.lg },
  fallbackText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  pinWrap: { width: 44, height: 44, alignItems: 'center' },
  pinHead: {
    position: 'absolute',
    top: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderBottomLeftRadius: 0, // the sharp corner; rotating it -45 degrees puts it at the bottom, on the address
    backgroundColor: PIN_RED,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
  },
  pinCore: { position: 'absolute', top: 15, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' },
  chip: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(17,28,45,0.85)',
  },
  chipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  vehicleWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  arrow: { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'flex-start' },
  vehicle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  vehicleEmoji: { fontSize: 19 },
  recentre: { position: 'absolute', right: 12, top: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
