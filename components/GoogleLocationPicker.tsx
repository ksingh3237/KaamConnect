// Pick a place in Tricity (Chandigarh, Mohali, Panchkula): Google Places search restricted to the Tricity box, a map
// with a centre pin, and a "use my GPS" button. Every pick (search result, moved pin, GPS fix) is resolved to an
// address and matched to one of our areas from GET /locations, then handed to the parent:
//   { areaId, line, localityName, lat, lng }
// areaId is null when the place could not be matched (the parent keeps its manual sector chooser for that).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Crosshair, MapPin, Search, X } from 'lucide-react-native';
import { Colors, Radius, noFocusRing } from '../constants/theme';
import type { LocationCity } from '../api/types';
import PickerMap, { type MapFocus } from './PickerMap';
import { autocomplete, mapsConfigured, newSessionToken, placeDetails, reverseGeocode, type ResolvedPlace, type Suggestion } from '../utils/googlePlaces';
import { TRICITY_CENTER, cleanLine, inTricity, matchArea } from '../utils/placeMatch';
import { shortCity } from '../utils/sectors';

export interface PickedLocation {
  areaId: number | null;
  line: string;
  localityName: string | null;
  lat: number;
  lng: number;
}

interface Props {
  locations: LocationCity[];
  onChange: (location: PickedLocation) => void;
  /** Where the map opens (a saved address); defaults to the middle of Chandigarh. */
  initial?: MapFocus | null;
}

const SAME_SPOT_DEG = 0.00008; // about 9 m: a re-centre that did not really move needs no new lookup

const NOTES = {
  outside: 'That spot is outside Chandigarh, Mohali and Panchkula. / यह जगह ट्राईसिटी से बाहर है',
  denied: 'Location permission is off. Allow it in Settings, or search above. / लोकेशन की अनुमति बंद है',
  gps: 'Could not get your location. Search above or move the pin. / लोकेशन नहीं मिली',
  lookup: 'Could not look that up right now. Check your internet and try again. / अभी पता नहीं मिला',
} as const;

export default function GoogleLocationPicker({ locations, onChange, initial }: Props) {
  const start = initial ?? { lat: TRICITY_CENTER.lat, lng: TRICITY_CENTER.lng };
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<'resolve' | 'gps' | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [picked, setPicked] = useState<{ title: string; line: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const session = useRef(newSessionToken());
  const seq = useRef(0); // only the newest lookup may update the screen
  const lastAt = useRef<MapFocus | null>(null);
  const skipSearchFor = useRef<string | null>(null); // the title we just put in the box ourselves

  // Latest props for the async lookups below
  const latest = useRef({ locations, onChange });
  latest.current = { locations, onChange };

  const areaName = useMemo(() => {
    const names = new Map<number, string>();
    for (const c of locations) for (const a of c.areas) names.set(a.id, `${a.name}, ${shortCity(c.name)}`);
    return names;
  }, [locations]);

  const apply = useCallback(
    (place: ResolvedPlace) => {
      if (!inTricity(place.lat, place.lng)) {
        setPicked(null);
        setNote(NOTES.outside);
        return false;
      }
      const match = matchArea(latest.current.locations, place.components, place.formattedAddress);
      const line = cleanLine(place.formattedAddress);
      lastAt.current = { lat: place.lat, lng: place.lng };
      setNote(null);
      setPicked({
        line,
        title: match.areaId === null ? line : match.localityName ? `${match.localityName}, ${match.city}` : (areaName.get(match.areaId) ?? line),
      });
      latest.current.onChange({ areaId: match.areaId, line, localityName: match.localityName, lat: place.lat, lng: place.lng });
      return true;
    },
    [areaName],
  );

  // Search as the person types (after a short pause, from 3 characters)
  useEffect(() => {
    const text = query.trim();
    if (text === skipSearchFor.current) return;
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await autocomplete(text, session.current);
        if (mine === seq.current) setSuggestions(found);
      } catch {
        if (mine === seq.current) {
          setSuggestions([]);
          setNote(NOTES.lookup);
        }
      } finally {
        if (mine === seq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const choose = async (s: Suggestion) => {
    const mine = ++seq.current;
    skipSearchFor.current = s.title.trim();
    setQuery(s.title);
    setSuggestions([]);
    setBusy('resolve');
    try {
      const place = await placeDetails(s.placeId, session.current);
      session.current = newSessionToken(); // the details call closes a billing session
      if (mine !== seq.current) return;
      if (apply(place)) setFocus({ lat: place.lat, lng: place.lng });
    } catch {
      if (mine === seq.current) setNote(NOTES.lookup);
    } finally {
      if (mine === seq.current) setBusy(null);
    }
  };

  const onPinSettled = async (lat: number, lng: number) => {
    const last = lastAt.current;
    if (last && Math.abs(last.lat - lat) < SAME_SPOT_DEG && Math.abs(last.lng - lng) < SAME_SPOT_DEG) return;
    const mine = ++seq.current;
    setBusy('resolve');
    setSuggestions([]);
    try {
      const place = await reverseGeocode(lat, lng);
      if (mine !== seq.current) return;
      if (apply(place)) setQuery('');
    } catch {
      if (mine === seq.current) setNote(NOTES.lookup);
    } finally {
      if (mine === seq.current) setBusy(null);
    }
  };

  const detectGps = async () => {
    if (busy === 'gps') return;
    const mine = ++seq.current;
    setBusy('gps');
    setNote(null);
    setSuggestions([]);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setNote(NOTES.denied);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!inTricity(lat, lng)) {
        if (mine === seq.current) setNote(NOTES.outside);
        return;
      }
      setFocus({ lat, lng });
      const place = await reverseGeocode(lat, lng);
      if (mine !== seq.current) return;
      if (apply(place)) setQuery('');
    } catch (error) {
      if (mine === seq.current) setNote(error instanceof Error && error.message.startsWith('MAPS_') ? NOTES.lookup : NOTES.gps);
    } finally {
      if (mine === seq.current) setBusy(null);
    }
  };

  if (!mapsConfigured) {
    return (
      <View style={styles.notice}>
        <MapPin color={Colors.textMuted} size={18} />
        <Text style={styles.noticeText}>Map search is not set up in this build. Choose your sector below. / नीचे अपना सेक्टर चुनें</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.searchBox}>
        <Search color={Colors.textSubtle} size={18} />
        <TextInput
          style={[styles.searchInput, noFocusRing]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your area, sector or landmark / खोजें"
          placeholderTextColor={Colors.textSubtle}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search a place in Chandigarh, Mohali or Panchkula"
        />
        {searching ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : query !== '' ? (
          <TouchableOpacity hitSlop={10} onPress={() => { setQuery(''); setSuggestions([]); }} accessibilityRole="button" accessibilityLabel="Clear search">
            <X color={Colors.textSubtle} size={18} />
          </TouchableOpacity>
        ) : null}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={s.placeId} style={[styles.suggestion, i > 0 && styles.suggestionDivider]} onPress={() => void choose(s)} accessibilityRole="button">
              <MapPin color={Colors.primaryDark} size={16} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>{s.title}</Text>
                {s.subtitle !== '' && <Text style={styles.suggestionSub} numberOfLines={1}>{s.subtitle}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.gpsBtn, busy === 'gps' && { opacity: 0.7 }]} onPress={() => void detectGps()} disabled={busy === 'gps'} activeOpacity={0.8} accessibilityRole="button">
        {busy === 'gps' ? <ActivityIndicator color={Colors.primaryDark} size="small" /> : <Crosshair color={Colors.primaryDark} size={18} />}
        <Text style={styles.gpsText}>{busy === 'gps' ? 'Finding your location… / लोकेशन खोज रहे हैं…' : 'Detect My Current GPS Location / वर्तमान स्थान'}</Text>
      </TouchableOpacity>

      <PickerMap initial={start} focus={focus} onSettle={(lat, lng) => void onPinSettled(lat, lng)} />

      <View style={styles.status} accessibilityLiveRegion="polite">
        {busy === 'resolve' ? (
          <Text style={styles.statusText}>Finding the address… / पता खोज रहे हैं…</Text>
        ) : note ? (
          <Text style={[styles.statusText, { color: Colors.error }]}>{note}</Text>
        ) : picked ? (
          <>
            <Text style={styles.statusTitle} numberOfLines={2}>{picked.title}</Text>
            {picked.title !== picked.line && <Text style={styles.statusText} numberOfLines={2}>{picked.line}</Text>}
          </>
        ) : (
          <Text style={styles.statusText}>Move the map so the pin sits on your door. / नक्शा हिलाकर पिन अपने घर पर रखें</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: Colors.textMain, paddingVertical: 8 },
  suggestions: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  suggestion: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  suggestionDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  suggestionSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
  },
  gpsText: { flexShrink: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  status: { minHeight: 36, gap: 2 },
  statusTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  statusText: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.textMuted },
});
