// The live trip map shared by the customer's tracking screen and the worker's job screen: the worker's vehicle (it glides
// between fixes and its arrow turns the way they travel), the job's place as a red pin, the viewer's own blue dot, and a
// line between them. How far and how long is shown on a chip in the corner.
// The line follows real roads (utils/directions.ts: Google Routes, else free OSRM); if neither answers it falls back to a
// dotted straight line so the map still shows direction.
// Native only. react-native-maps has no web build; TripMap.web.tsx is shown there instead.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocateFixed, Maximize2, Navigation, X } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { t } from '../i18n';
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
  /** Adds a button that opens the same map full screen, inside the app. */
  expandable?: boolean;
  /** Shown in the full-screen map's bar. */
  title?: string;
  /** When given, the full-screen map offers turn-by-turn in Google Maps as a second step. */
  onNavigate?: () => void;
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

export default function TripMap({
  worker,
  destination,
  vehicle,
  distanceKm = null,
  etaMinutes = null,
  onTrip,
  padding = DEFAULT_PADDING,
  height = 220,
  fill = false,
  expandable = false,
  title,
  onNavigate,
}: TripMapProps) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
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
        <Text style={styles.fallbackText}>{t('Live map needs the Google Maps key. Distance and arrival time below are still live.')}</Text>
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
          <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} anchor={{ x: 0.5, y: 0.95 }} tracksViewChanges={false} title={t('Job location')}>
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
          <Marker coordinate={{ latitude: glided.lat, longitude: glided.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={redraw} zIndex={2} title={t('Worker')}>
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
          {/* Without a road route these are straight-line numbers, so they are marked as approximate */}
          <Text style={styles.chipText}>
            {shownEta !== null ? `${road ? '' : '~'}${t('{min} min', { min: shownEta })}` : t('On the way')}
            {shownKm !== null ? ` • ${road ? '' : '~'}${t('{km} km', { km: shownKm })}` : ''}
          </Text>
        </View>
      )}
      {detached && (
        <TouchableOpacity style={styles.recentre} onPress={() => setDetached(false)} accessibilityRole="button" accessibilityLabel={t('Show worker and destination')}>
          <LocateFixed color={Colors.textMain} size={20} />
        </TouchableOpacity>
      )}
      {/* The whole map, full screen, without leaving KaamConnect. The copy inside the modal is the same component
          with `expandable` off, so it draws the same markers and the same road line. */}
      {expandable && (
        <>
          <TouchableOpacity
            style={styles.expand}
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={t('Open the map full screen')}
          >
            <Maximize2 color={Colors.textMain} size={18} />
          </TouchableOpacity>
          <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)} statusBarTranslucent>
            <View style={styles.full}>
              <TripMap
                worker={worker}
                destination={destination}
                vehicle={vehicle}
                distanceKm={distanceKm}
                etaMinutes={etaMinutes}
                fill
                padding={{ top: insets.top + 80, right: 50, bottom: onNavigate ? 140 : 70, left: 50 }}
              />
              <View style={[styles.fullBar, { paddingTop: insets.top + Spacing.sm }]}>
                <TouchableOpacity style={styles.fullClose} onPress={() => setExpanded(false)} accessibilityRole="button" accessibilityLabel={t('Close the map')}>
                  <X color={Colors.textMain} size={22} />
                </TouchableOpacity>
                <Text style={styles.fullTitle} numberOfLines={1}>{title ?? t('Live map')}</Text>
              </View>
              {onNavigate && (
                <TouchableOpacity
                  style={[styles.fullNav, { bottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm }]}
                  onPress={onNavigate}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Navigation color="#FFFFFF" size={18} />
                  <Text style={styles.fullNavText}>{t('Turn-by-turn in Google Maps')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Modal>
        </>
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
  expand: { position: 'absolute', right: 12, bottom: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  full: { flex: 1, backgroundColor: Colors.surfaceVariant },
  fullBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  fullClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fullTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    overflow: 'hidden',
    elevation: 4,
  },
  fullNav: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    elevation: 6,
  },
  fullNavText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
