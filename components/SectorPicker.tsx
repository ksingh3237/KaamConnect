// Choosing a sector / area without drowning the form: one 64px field showing the current choice, a row of quick
// picks under it, and a bottom sheet for everything else.
//   Sheet: sticky search (numbers, "Sec 35", "Ph 7", area and city names, small typos) · "Use current location" ·
//   city chips built from the server's list (any number of cities) · the area list, headed by city / Phases / Sectors /
//   Areas · "Add custom locality" pinned at the bottom.
// Not in the list? The custom form lets the person type their locality and pick the city; the area is then the city's
// seeded "Other area" (what matching uses) and the typed name is what everyone sees.
import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Check, ChevronDown, ChevronRight, LocateFixed, MapPin, PlusCircle, Search, X } from 'lucide-react-native';
import { Colors, Radius, noFocusRing } from '../constants/theme';
import type { LocationCity } from '../api/types';
import { resolveDetected, withTimeout } from '../utils/currentSector';
import { reverseGeocodePlace } from '../utils/reverseGeocode';
import {
  buildRows,
  citiesWithOtherArea,
  cityNames,
  flattenSectors,
  otherAreaId,
  quickPicks,
  searchSectors,
  sectorGroup,
  sectorLabel,
  shortCity,
  type SectorItem,
  type SectorRow,
} from '../utils/sectors';

interface Props {
  locations: LocationCity[];
  value: number | null;
  /** The typed locality that goes with `value` when it is a city's "Other area". */
  locality?: string | null;
  /** `locality` is null for a listed sector, the typed name for a custom area. */
  onChange: (areaId: number, label: string, locality: string | null) => void;
  /** Shown when nothing is chosen yet. */
  placeholder?: string;
  /** Put the cursor in the search box as soon as the sheet opens (raises the keyboard). */
  autoFocusSearch?: boolean;
}

const ALL = 'All';
const NOTES = {
  denied: 'Location permission is off. Allow it in Settings, or search above. / लोकेशन की अनुमति बंद है',
  servicesOff: 'Location is switched off on this phone. Turn it on, or search above. / फ़ोन की लोकेशन बंद है',
  timeout: 'Finding your location is taking too long. Try again or search above. / लोकेशन मिलने में देर हो रही है',
  failed: 'Could not find your location. Search above instead. / लोकेशन नहीं मिली',
  none: "We don't cover your current spot yet. Search or add a custom locality. / आपकी जगह अभी उपलब्ध नहीं",
} as const;

// Every GPS step has a limit, so the card can never spin forever
const FIX_TIMEOUT_MS = 15_000;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60_000;

/** A fresh fix, or (when that times out or fails) the phone's last known one if it is under 10 minutes old. */
async function currentPosition(): Promise<Location.LocationObject> {
  try {
    return await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), FIX_TIMEOUT_MS);
  } catch (error) {
    const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
    if (last) return last;
    throw error;
  }
}

const pillName = (item: SectorItem) => item.name.replace(/^Sector /, 'Sec ');

export default function SectorPicker({
  locations,
  value,
  locality = null,
  onChange,
  placeholder = 'Select Sector / Area • इलाका चुनें',
  autoFocusSearch = false,
}: Props) {
  const items = useMemo(() => flattenSectors(locations), [locations]);
  const cities = useMemo(() => cityNames(items), [items]);
  const customCities = useMemo(() => citiesWithOtherArea(locations), [locations]);
  const quick = useMemo(() => quickPicks(items), [items]);
  const selected = items.find((i) => i.id === value) ?? null;
  // A custom area: value is a city's "Other area" and the typed name comes with it
  const customCity = useMemo(() => {
    if (value === null || !locality) return null;
    const c = locations.find((x) => x.areas.some((a) => a.id === value));
    return c ? shortCity(c.name) : null;
  }, [locations, value, locality]);
  const shownLabel = selected ? sectorLabel(selected) : customCity && locality ? `${locality}, ${customCity}` : null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(ALL);
  const [detecting, setDetecting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // "Add custom locality" form inside the sheet
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCityChoice, setCustomCityChoice] = useState<string | null>(null);

  // Latest values for callbacks that outlive a render (list rows, the GPS lookup, the swipe handler)
  const live = useRef({ onChange, items, locations });
  live.current = { onChange, items, locations };
  const detectSeq = useRef(0);
  // Leaving the screen mid-lookup must not select anything afterwards
  useEffect(
    () => () => {
      detectSeq.current++;
    },
    [],
  );

  // The chip may name a city that a refreshed list no longer has: show everything then
  const city = tab !== ALL && cities.includes(tab) ? tab : null;
  // The box updates at once; the list catches up when the phone has a moment (a long list never makes typing lag)
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim() !== '';
  const results = useMemo(() => searchSectors(city ? items.filter((i) => i.city === city) : items, deferredQuery), [items, city, deferredQuery]);
  const rows = useMemo<SectorRow[]>(() => {
    let headings: 'none' | 'city' | 'group' = 'none';
    if (!searching) {
      if (city) headings = new Set(results.map((i) => sectorGroup(i.name))).size > 1 ? 'group' : 'none';
      else headings = cities.length > 1 ? 'city' : 'none';
    }
    return buildRows(results, headings);
  }, [results, searching, city, cities.length]);
  const showCityOnRow = searching && !city;

  // --- bottom sheet: slides up, closes by backdrop, back button, the X, or a swipe down on the handle ---
  const { height: windowH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(windowH)).current;
  const native = Platform.OS !== 'web';

  const reset = () => {
    detectSeq.current++; // an unfinished GPS lookup must not select anything after the sheet is gone
    setOpen(false);
    setQuery('');
    setCustom(false);
    setNote(null);
    setDetecting(false);
  };
  const dismiss = () => {
    Animated.timing(slide, { toValue: windowH, duration: 200, useNativeDriver: native }).start(reset);
  };
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  const show = () => {
    // Open on the city of the current choice, so changing a sector starts in the right place
    setTab(selected?.city ?? customCity ?? ALL);
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    slide.setValue(windowH);
    Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: native }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on open only, not when the window is resized
  }, [open]);

  const pan = useRef(
    PanResponder.create({
      // Claim the touch on the handle/title at once: waiting for a move let something above it take the gesture on
      // Android (checked on an emulator). The X button is deeper, so it still gets its own taps.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && g.dy > Math.abs(g.dx),
      onPanResponderMove: (_, g) => slide.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.9) dismissRef.current();
        else Animated.spring(slide, { toValue: 0, useNativeDriver: native }).start();
      },
      onPanResponderTerminate: () => Animated.spring(slide, { toValue: 0, useNativeDriver: native }).start(),
    }),
  ).current;

  const choose = useCallback((item: SectorItem) => {
    live.current.onChange(item.id, sectorLabel(item), null);
    dismissRef.current();
  }, []);
  // A quick pick on the form changes the value without ever opening the sheet
  const quickChoose = (item: SectorItem) => live.current.onChange(item.id, sectorLabel(item), null);

  // --- use current location ---
  const detect = async () => {
    if (detecting) return;
    const mine = ++detectSeq.current;
    setDetecting(true);
    setNote(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        if (mine === detectSeq.current) setNote(NOTES.denied);
        return;
      }
      // Location switched off in the phone's quick settings: say so instead of waiting for a fix that never comes
      if (!(await Location.hasServicesEnabledAsync().catch(() => true))) {
        if (mine === detectSeq.current) setNote(NOTES.servicesOff);
        return;
      }
      const pos = await currentPosition();
      const place = await reverseGeocodePlace(pos.coords.latitude, pos.coords.longitude);
      if (mine !== detectSeq.current) return;
      const found = resolveDetected(live.current.locations, live.current.items, place);
      if (found.kind === 'sector') choose(found.item);
      else if (found.kind === 'custom') {
        live.current.onChange(found.areaId, `${found.locality}, ${found.city}`, found.locality);
        dismissRef.current();
      } else setNote(NOTES.none);
    } catch (error) {
      if (mine === detectSeq.current) setNote(error instanceof Error && error.message === 'TIMEOUT' ? NOTES.timeout : NOTES.failed);
    } finally {
      if (mine === detectSeq.current) setDetecting(false);
    }
  };

  // --- custom locality ---
  const startCustom = () => {
    setCustomName(query.trim() || locality || '');
    setCustomCityChoice(city && customCities.includes(city) ? city : customCity && customCities.includes(customCity) ? customCity : (customCities[0] ?? null));
    setCustom(true);
  };
  const customReady = customName.trim().length >= 2 && customCityChoice !== null;
  const saveCustom = () => {
    if (!customReady || !customCityChoice) return;
    const id = otherAreaId(locations, customCityChoice);
    if (id === null) return;
    const name = customName.trim().replace(/\s+/g, ' ').slice(0, 80);
    onChange(id, `${name}, ${customCityChoice}`, name);
    dismiss();
  };

  const renderRow = useCallback(
    ({ item: row }: { item: SectorRow }) =>
      row.kind === 'header' ? (
        <Text style={styles.groupHeading}>{row.title.toUpperCase()}</Text>
      ) : (
        <AreaRow item={row.item} on={row.item.id === value} showCity={showCityOnRow} onPick={choose} />
      ),
    [value, showCityOnRow, choose],
  );

  return (
    <View>
      {/* The field: 64px, tap to open the sheet */}
      <TouchableOpacity
        style={[styles.field, shownLabel !== null && styles.fieldChosen]}
        onPress={show}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={shownLabel ? `Sector: ${shownLabel}. Change` : placeholder}
      >
        <View style={styles.fieldIcon}>
          <MapPin color={Colors.primary} size={20} />
        </View>
        <View style={styles.fieldBody}>
          <Text style={[styles.fieldText, !shownLabel && styles.fieldPlaceholder]} numberOfLines={1}>
            {shownLabel ?? placeholder}
          </Text>
          <Text style={styles.fieldSub} numberOfLines={1}>
            {shownLabel ? 'Tap to change • बदलने के लिए टैप करें' : `${items.length}+ sectors & areas in ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}`}
          </Text>
        </View>
        <ChevronDown color={Colors.textMuted} size={22} />
      </TouchableOpacity>

      {quick.length > 0 && (
        <>
          <Text style={styles.quickLabel}>Quick picks • जल्दी चुनें</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.noGrow} contentContainerStyle={styles.pills}>
            {quick.map((item) => {
              const on = item.id === value;
              return (
                <TouchableOpacity key={item.id} style={[styles.pill, on && styles.pillOn]} onPress={() => quickChoose(item)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={sectorLabel(item)}>
                  <Text style={[styles.pillText, on && styles.pillTextOn]}>
                    {pillName(item)}
                    <Text style={styles.pillCity}> · {item.city.slice(0, 3)}</Text>
                  </Text>
                  {on && <Check color={Colors.primaryDark} size={14} strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Android back: out of the custom form first, then close the sheet */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={custom ? () => setCustom(false) : dismiss} statusBarTranslucent>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" />
          {/* "padding" on both platforms: it lifts the sheet by however far the keyboard actually covers it, so it stays
              right whether or not Android also resizes the window. maxHeight (screen minus the status bar) lets the list
              shrink instead of the top of the sheet running under the status bar. */}
          <KeyboardAvoidingView behavior="padding" style={{ maxHeight: windowH - insets.top }}>
            <Animated.View style={[styles.sheet, { height: Math.round(windowH * 0.9), paddingBottom: insets.bottom, transform: [{ translateY: slide }] }]}>
              <View {...pan.panHandlers}>
                <View style={styles.grabber} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Select Sector / Area • क्षेत्र चुनें</Text>
                  <TouchableOpacity onPress={dismiss} style={styles.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
                    <X color={Colors.textMain} size={24} />
                  </TouchableOpacity>
                </View>
              </View>

              {custom ? (
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.customForm}>
                  <Text style={styles.customLabel}>Your area / locality • आपका इलाका</Text>
                  <TextInput
                    style={[styles.customInput, noFocusRing]}
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder='e.g. "Sector 82 JLPL", "Peer Muchalla", "Dhanas"'
                    placeholderTextColor={Colors.textSubtle}
                    maxLength={80}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveCustom}
                    accessibilityLabel="Your area or locality"
                  />
                  <Text style={styles.customLabel}>City • शहर</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.formChips} contentContainerStyle={styles.chips}>
                    {customCities.map((c) => {
                      const on = c === customCityChoice;
                      return (
                        <Pressable key={c} onPress={() => setCustomCityChoice(c)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.customHint}>Workers across your city will see this name. Your full address stays private. / आपका पूरा पता गोपनीय रहेगा</Text>
                  <TouchableOpacity style={[styles.saveBtn, !customReady && { opacity: 0.5 }]} onPress={saveCustom} disabled={!customReady} activeOpacity={0.8} accessibilityRole="button">
                    <Text style={styles.saveBtnText}>Use this area • यह क्षेत्र चुनें</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.backToList} onPress={() => setCustom(false)} activeOpacity={0.7} accessibilityRole="button">
                    <Text style={styles.backToListText}>← Back to the list</Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <>
                  <View style={styles.searchBox}>
                    <Search color={Colors.textMuted} size={20} />
                    <TextInput
                      style={[styles.searchInput, noFocusRing]}
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search sector / area • खोजें"
                      numberOfLines={1}
                      placeholderTextColor={Colors.textSubtle}
                      autoFocus={autoFocusSearch}
                      autoCorrect={false}
                      autoCapitalize="none"
                      returnKeyType="search"
                      accessibilityLabel="Search sectors and areas"
                    />
                    {query.length > 0 && (
                      <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear search">
                        <X color={Colors.textMuted} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {!searching && (
                    <TouchableOpacity style={styles.gpsCard} onPress={() => void detect()} disabled={detecting} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Use my current location">
                      <View style={styles.gpsIcon}>{detecting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <LocateFixed color="#FFFFFF" size={20} />}</View>
                      <View style={styles.fieldBody}>
                        <Text style={styles.gpsTitle}>{detecting ? 'Finding your sector…' : 'Use current location'}</Text>
                        <Text style={styles.gpsSub}>मेरी लोकेशन से सेक्टर चुनें</Text>
                      </View>
                      <ChevronRight color={Colors.primaryDark} size={18} />
                    </TouchableOpacity>
                  )}
                  {note !== null && (
                    <Text style={styles.noteText} accessibilityRole="alert">
                      {note}
                    </Text>
                  )}

                  {cities.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.noGrow} contentContainerStyle={styles.chips}>
                      {[ALL, ...cities].map((c) => {
                        const on = c === ALL ? city === null : c === city;
                        return (
                          <Pressable key={c} onPress={() => setTab(c)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                            <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                              {c === ALL ? 'All • सभी' : c}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}

                  <FlatList
                    style={styles.list}
                    data={rows}
                    keyExtractor={(row) => row.key}
                    renderItem={renderRow}
                    extraData={value}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    initialNumToRender={20}
                    maxToRenderPerBatch={20}
                    windowSize={9}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                      <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>No area matches “{query.trim()}”</Text>
                        <Text style={styles.emptyHint}>Try only the number (e.g. 35), another spelling, or add it as a custom locality below.</Text>
                      </View>
                    }
                  />

                  {customCities.length > 0 && (
                    <View style={styles.customBar}>
                      <TouchableOpacity style={styles.customBtn} onPress={startCustom} activeOpacity={0.7} accessibilityRole="button">
                        <PlusCircle color={Colors.primaryDark} size={22} />
                        <View style={styles.fieldBody}>
                          <Text style={styles.customBtnTitle}>Can't find your sector? Add custom locality</Text>
                          <Text style={styles.customBtnSub}>अपना इलाका खुद लिखें</Text>
                        </View>
                        <ChevronRight color={Colors.primaryDark} size={18} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const AreaRow = memo(function AreaRow({ item, on, showCity, onPick }: { item: SectorItem; on: boolean; showCity: boolean; onPick: (item: SectorItem) => void }) {
  return (
    <TouchableOpacity style={[styles.row, on && styles.rowOn]} onPress={() => onPick(item)} activeOpacity={0.6} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={sectorLabel(item)}>
      <View style={styles.fieldBody}>
        <Text style={[styles.rowName, on && { color: Colors.primaryDark }]}>{item.name}</Text>
        {showCity && <Text style={styles.rowCity}>{item.city}</Text>}
      </View>
      {on ? <Check color={Colors.primary} size={22} strokeWidth={3} /> : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  fieldBody: { flex: 1, minWidth: 0 },
  noGrow: { flexGrow: 0 },
  // The field
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 64,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.surface,
  },
  fieldChosen: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  fieldIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  fieldText: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  fieldPlaceholder: { color: Colors.textMuted, fontWeight: '600' },
  fieldSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  // Quick picks
  quickLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginTop: 12, marginBottom: 8 },
  pills: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  pillTextOn: { color: Colors.primaryDark },
  pillCity: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  // The sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, backgroundColor: Colors.background, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginTop: 8, backgroundColor: Colors.borderDark },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingTop: 2, paddingBottom: 4 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textMain },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingLeft: 12,
    paddingRight: 4,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  searchInput: { flex: 1, minWidth: 0, height: '100%', fontSize: 16, color: Colors.textMain },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  gpsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  gpsTitle: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  gpsSub: { fontSize: 13, color: Colors.primaryDark, marginTop: 1 },
  noteText: { marginHorizontal: 16, marginTop: 8, fontSize: 13, fontWeight: '600', lineHeight: 18, color: Colors.error },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  // Inside the padded custom form: pull the chips out to the sheet edges so they scroll edge to edge
  formChips: { flexGrow: 0, marginHorizontal: -16, marginTop: -12 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceVariant },
  chipOn: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  chipTextOn: { color: Colors.onPrimary },
  // The list
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingBottom: 12 },
  groupHeading: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: Colors.textMuted, backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    backgroundColor: Colors.surface,
  },
  rowOn: { backgroundColor: '#F0FDF4' },
  rowName: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  rowCity: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  // Custom locality
  customBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  customBtnTitle: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  customBtnSub: { fontSize: 13, color: Colors.primaryDark, marginTop: 1 },
  customForm: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  customLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMain, marginTop: 12, marginBottom: 8 },
  customInput: {
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.textMain,
  },
  customHint: { fontSize: 13, color: Colors.textMuted, marginTop: 12, lineHeight: 18 },
  saveBtn: { marginTop: 18, minHeight: 52, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: Colors.onPrimary, fontSize: 16, fontWeight: '800' },
  backToList: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  backToListText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
});
