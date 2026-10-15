// Choosing a Tricity sector: the current choice, popular sectors as quick taps, and a searchable sheet with city tabs
// for the full list (180+ sectors, phases and localities). Search accepts "35", "sec 35", "Phase 7", "MDC", "Kharar".
// Not in the list? "Add custom area" lets the person type their locality and pick the city; the area is then the
// city's seeded "Other area" (what matching uses) and the typed name is what everyone sees.
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronRight, MapPin, PlusCircle, Search, X } from 'lucide-react-native';
import { Colors, Radius, noFocusRing } from '../constants/theme';
import type { LocationCity } from '../api/types';
import { citiesWithOtherArea, flattenSectors, otherAreaId, popularSectors, searchSectors, sectorLabel, shortCity, type SectorItem } from '../utils/sectors';

interface Props {
  locations: LocationCity[];
  value: number | null;
  /** The typed locality that goes with `value` when it is a city's "Other area". */
  locality?: string | null;
  /** `locality` is null for a listed sector, the typed name for a custom area. */
  onChange: (areaId: number, label: string, locality: string | null) => void;
  /** Shown when nothing is chosen yet. */
  placeholder?: string;
}

const CITY_TABS = ['All', 'Chandigarh', 'Mohali', 'Panchkula'] as const;
type CityTab = (typeof CITY_TABS)[number];

export default function SectorPicker({ locations, value, locality = null, onChange, placeholder = 'Choose your sector / सेक्टर चुनें' }: Props) {
  const items = useMemo(() => flattenSectors(locations), [locations]);
  const customCities = useMemo(() => citiesWithOtherArea(locations), [locations]);
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
  const [tab, setTab] = useState<CityTab>('All');
  // "Add custom area" form inside the sheet
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCityChoice, setCustomCityChoice] = useState<string | null>(null);

  const city = tab === 'All' ? null : tab;
  const results = useMemo(() => searchSectors(city ? items.filter((i) => i.city === city) : items, query), [items, city, query]);
  const quick = useMemo(() => popularSectors(items, null), [items]);
  const popularInSheet = useMemo(() => popularSectors(items, city), [items, city]);

  const choose = (item: SectorItem) => {
    onChange(item.id, sectorLabel(item), null);
    close();
  };

  const close = () => {
    setOpen(false);
    setQuery('');
    setCustom(false);
  };

  const startCustom = () => {
    setCustomName(query.trim() || locality || '');
    setCustomCityChoice(city ?? customCity ?? customCities[0] ?? null);
    setCustom(true);
  };

  const customReady = customName.trim().length >= 2 && customCityChoice !== null;
  const saveCustom = () => {
    if (!customReady || !customCityChoice) return;
    const id = otherAreaId(locations, customCityChoice);
    if (id === null) return;
    const name = customName.trim().replace(/\s+/g, ' ').slice(0, 80);
    onChange(id, `${name}, ${customCityChoice}`, name);
    close();
  };

  const addCustomButton = customCities.length > 0 && (
    <TouchableOpacity style={styles.customBtn} onPress={startCustom} activeOpacity={0.7} accessibilityRole="button">
      <PlusCircle color={Colors.primaryDark} size={22} />
      <View style={{ flex: 1 }}>
        <Text style={styles.customBtnTitle}>Can't find your sector? Add custom area</Text>
        <Text style={styles.customBtnSub}>अन्य क्षेत्र दर्ज करें</Text>
      </View>
      <ChevronRight color={Colors.primaryDark} size={18} />
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity style={[styles.field, shownLabel !== null && styles.fieldChosen]} onPress={() => setOpen(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={shownLabel ? `Sector: ${shownLabel}. Change` : placeholder}>
        <View style={styles.fieldIcon}>
          <MapPin color={Colors.primaryDark} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldText, !shownLabel && styles.fieldPlaceholder]} numberOfLines={1}>
            {shownLabel ?? placeholder}
          </Text>
          <Text style={styles.fieldSub}>Search {items.length}+ sectors, phases & areas</Text>
        </View>
        <Search color={Colors.textMuted} size={20} />
      </TouchableOpacity>

      <Text style={styles.quickLabel}>Popular • लोकप्रिय</Text>
      <View style={styles.pills}>
        {quick.map((item) => {
          const on = item.id === value;
          return (
            <TouchableOpacity key={item.id} style={[styles.pill, on && styles.pillOn]} onPress={() => choose(item)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.pillText, on && styles.pillTextOn]}>
                {item.name.replace(/^Sector /, 'Sec ')}
                <Text style={styles.pillCity}> · {item.city.slice(0, 3)}</Text>
              </Text>
              {on && <Check color={Colors.primaryDark} size={14} strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select your sector • सेक्टर चुनें</Text>
            <TouchableOpacity onPress={close} style={styles.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
              <X color={Colors.textMain} size={24} />
            </TouchableOpacity>
          </View>

          {custom ? (
            <View style={styles.customForm}>
              <Text style={styles.customLabel}>Your area / locality • आपका क्षेत्र</Text>
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
              <View style={styles.tabs}>
                {customCities.map((c) => {
                  const on = c === customCityChoice;
                  return (
                    <Pressable key={c} onPress={() => setCustomCityChoice(c)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                      <Text style={[styles.tabText, on && styles.tabTextOn]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.customHint}>Workers across your city will see this name. Your full address stays private.</Text>
              <TouchableOpacity style={[styles.saveBtn, !customReady && { opacity: 0.5 }]} onPress={saveCustom} disabled={!customReady} activeOpacity={0.8} accessibilityRole="button">
                <Text style={styles.saveBtnText}>Use this area • यह क्षेत्र चुनें</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backToList} onPress={() => setCustom(false)} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.backToListText}>← Back to the sector list</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <>
          <View style={styles.searchBox}>
            <Search color={Colors.textMuted} size={20} />
            <TextInput
              style={[styles.searchInput, noFocusRing]}
              value={query}
              onChangeText={setQuery}
              placeholder='Try "35", "Phase 7", "MDC", "Kharar"'
              placeholderTextColor={Colors.textSubtle}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel="Search sectors"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear search">
                <X color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabs}>
            {CITY_TABS.map((t) => {
              const on = t === tab;
              return (
                <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                  <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={20}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              !query.trim() && popularInSheet.length > 0 ? (
                <View style={styles.sheetPopular}>
                  <Text style={styles.quickLabel}>Popular • लोकप्रिय</Text>
                  <View style={styles.pills}>
                    {popularInSheet.map((item) => (
                      <TouchableOpacity key={item.id} style={[styles.pill, item.id === value && styles.pillOn]} onPress={() => choose(item)} activeOpacity={0.7} accessibilityRole="button">
                        <Text style={[styles.pillText, item.id === value && styles.pillTextOn]}>
                          {item.name.replace(/^Sector /, 'Sec ')}
                          <Text style={styles.pillCity}> · {item.city.slice(0, 3)}</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ marginTop: 12 }}>{addCustomButton}</View>
                  <Text style={[styles.quickLabel, { marginTop: 14 }]}>All {city ?? 'Tricity'} areas</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No sector matches “{query.trim()}”</Text>
                <Text style={styles.emptyHint}>Try only the number (e.g. 35) or choose the All tab.</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 16 }}>{addCustomButton}</View>
              </View>
            }
            renderItem={({ item }) => {
              const on = item.id === value;
              return (
                <TouchableOpacity style={[styles.row, on && styles.rowOn]} onPress={() => choose(item)} activeOpacity={0.6} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, on && { color: Colors.primaryDark }]}>{item.name}</Text>
                    <Text style={styles.rowCity}>{item.city}</Text>
                  </View>
                  {on ? <Check color={Colors.primary} size={22} strokeWidth={3} /> : <ChevronRight color={Colors.textSubtle} size={18} />}
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={results.length > 0 ? <View style={{ padding: 16 }}>{addCustomButton}</View> : null}
          />
          </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    backgroundColor: '#FFFFFF',
  },
  fieldChosen: { borderColor: Colors.primary, backgroundColor: '#F0FDF4' },
  fieldIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  fieldText: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  fieldPlaceholder: { color: Colors.textMuted, fontWeight: '600' },
  fieldSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginTop: 12, marginBottom: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  pillOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pillText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  pillTextOn: { color: Colors.primaryDark },
  pillCity: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  sheet: { flex: 1, backgroundColor: Colors.background },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingVertical: 4 },
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
    backgroundColor: '#FFFFFF',
  },
  searchInput: { flex: 1, minWidth: 0, height: '100%', fontSize: 16, color: Colors.textMain },
  clearBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 4,
  },
  tabOn: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextOn: { color: '#FFFFFF' },
  sheetPopular: { paddingHorizontal: 16, paddingBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    backgroundColor: '#FFFFFF',
  },
  rowOn: { backgroundColor: '#F0FDF4' },
  rowName: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  rowCity: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  empty: { padding: 24, alignItems: 'center' },
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
  customForm: { paddingHorizontal: 16, paddingTop: 8 },
  customLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMain, marginTop: 12, marginBottom: 8 },
  customInput: {
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.textMain,
  },
  customHint: { fontSize: 13, color: Colors.textMuted, marginTop: 12, lineHeight: 18 },
  saveBtn: { marginTop: 18, minHeight: 52, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  backToList: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  backToListText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});
