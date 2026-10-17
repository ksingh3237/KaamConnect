// Choosing a worker's trades (max 2) without a long list on the form: a bottom sheet with search, group tabs and a
// 2-column card grid. The first trade chosen is the Primary, the second is the Secondary. Nothing is saved until
// "Done"; closing the sheet any other way keeps what the form had.
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { Check, Plus, Search, Star, X } from 'lucide-react-native';
import { Colors, Radius, noFocusRing } from '../constants/theme';
import { serviceIcon } from '../constants/services';
import type { ServiceCategory } from '../api/types';
import { MAX_TRADES, filterTrades, toggleTrade, tradeTabs, type TradeGroupId } from '../utils/trades';

interface TradePickerModalProps {
  visible: boolean;
  categories: ServiceCategory[];
  /** [primaryId, secondaryId?] */
  selectedTradeIds: string[];
  onSave: (tradeIds: string[]) => void;
  onClose: () => void;
}

type Slot = 'primary' | 'secondary' | null;
type GridItem = ServiceCategory | { id: '__spacer__' };

const TOAST_MS = 3000;
const SECONDARY = Colors.tertiaryDark;

export default function TradePickerModal({ visible, categories, selectedTradeIds, onSave, onClose }: TradePickerModalProps) {
  const [draft, setDraft] = useState<string[]>(selectedTradeIds);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<TradeGroupId>('all');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();

  // Every opening starts from what the form has, on the first tab, with an empty search
  useEffect(() => {
    if (!visible) return;
    setDraft(selectedTradeIds);
    setQuery('');
    setGroup('all');
    setToast(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only, not when the form's list changes
  }, [visible]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const nameOf = useCallback((id: string) => byId.get(id)?.title.en ?? id, [byId]);
  const tabs = useMemo(() => tradeTabs(categories), [categories]);
  const shown = useMemo(() => filterTrades(categories, group, query), [categories, group, query]);
  // An odd count leaves the last card alone in its row: a spacer keeps it the same width as the others
  const data = useMemo<GridItem[]>(() => (shown.length % 2 === 1 ? [...shown, { id: '__spacer__' }] : shown), [shown]);

  const say = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  // `draft` is read through a ref so the cards (memoised) keep a stable onPress
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const pick = useCallback(
    (id: string) => {
      const change = toggleTrade(draftRef.current, id);
      setDraft(change.ids);
      if (change.replaced) say(`You can pick 2 trades. “${nameOf(id)}” replaced “${nameOf(change.replaced)}” as 2nd. / दूसरा काम बदला गया`);
      else if (change.promoted) say(`“${nameOf(change.promoted)}” is now your Primary trade. / अब यह मुख्य काम है`);
    },
    [nameOf, say],
  );

  const save = () => {
    if (draft.length === 0) return;
    onSave(draft);
    onClose();
  };

  const slotOf = (id: string): Slot => (draft[0] === id ? 'primary' : draft[1] === id ? 'secondary' : null);
  const renderItem = useCallback(
    ({ item }: { item: GridItem }) =>
      'title' in item ? <TradeCard category={item} slot={slotOf(item.id)} onPick={pick} /> : <View style={styles.spacer} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slotOf only reads `draft`
    [draft, pick],
  );

  const count = draft.length;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior="padding" style={{ maxHeight: windowH - insets.top }}>
          <View style={[styles.sheet, { height: Math.round(windowH * 0.9) }]}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Select Your Trades / काम चुनें</Text>
                <View style={styles.subRow}>
                  <Text style={styles.subtitle}>Max {MAX_TRADES} trades allowed •</Text>
                  <View style={[styles.counter, count === MAX_TRADES && styles.counterFull]} accessibilityLabel={`${count} of ${MAX_TRADES} selected`}>
                    <Text style={[styles.counterText, count === MAX_TRADES && styles.counterTextFull]}>{count} / {MAX_TRADES} Selected</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
                <X color={Colors.textMain} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search color={Colors.textMuted} size={20} />
              <TextInput
                style={[styles.searchInput, noFocusRing]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search: electric, bijli, plumber, cooler… / खोजें"
                numberOfLines={1}
                placeholderTextColor={Colors.textSubtle}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search trades"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear search">
                  <X color={Colors.textMuted} size={18} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
              {tabs.map((t) => {
                const on = t.id === group;
                return (
                  <Pressable key={t.id} onPress={() => setGroup(t.id)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                    <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                      {t.label} ({t.id === 'all' && t.count >= 20 ? '20+' : t.count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <FlatList
              style={styles.list}
              data={data}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              extraData={draft}
              columnWrapperStyle={styles.column}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No trade matches “{query.trim()}”</Text>
                  <Text style={styles.emptyHint}>Try another spelling, or look in the “All” tab. / दूसरा नाम लिखकर देखें</Text>
                </View>
              }
            />

            {toast !== null && (
              <View style={[styles.toast, { bottom: 84 + Math.max(insets.bottom, 12) }]} pointerEvents="none" accessibilityLiveRegion="polite">
                <Text style={styles.toastText}>{toast}</Text>
              </View>
            )}

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity
                style={[styles.doneBtn, count === 0 && styles.doneBtnOff]}
                onPress={save}
                disabled={count === 0}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ disabled: count === 0 }}
              >
                <Check color={Colors.onPrimary} size={22} strokeWidth={3} />
                <Text style={styles.doneText} numberOfLines={2}>
                  {count === 0 ? 'Pick at least 1 trade / कम से कम 1 काम चुनें' : `Done / काम सुरक्षित करें (${count}/${MAX_TRADES} Selected)`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const TradeCard = memo(function TradeCard({ category, slot, onPick }: { category: ServiceCategory; slot: Slot; onPick: (id: string) => void }) {
  const Icon = serviceIcon(category.iconKey);
  const status = slot === 'primary' ? 'Primary #1' : slot === 'secondary' ? 'Secondary #2' : 'Select';
  return (
    <TouchableOpacity
      style={[styles.card, slot === 'primary' && styles.cardPrimary, slot === 'secondary' && styles.cardSecondary]}
      onPress={() => onPick(category.id)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: slot !== null }}
      accessibilityLabel={`${category.title.en}, ${category.title.hi}. ${status}`}
    >
      <View style={[styles.iconBox, { backgroundColor: category.bgColor }]}>
        <Icon color={category.color} size={26} strokeWidth={2.2} />
      </View>
      <Text style={styles.cardEn} numberOfLines={2}>{category.title.en}</Text>
      <Text style={styles.cardHi} numberOfLines={1}>{category.title.hi}</Text>
      {category.title.pa !== '' && <Text style={styles.cardPa} numberOfLines={1}>{category.title.pa}</Text>}
      <View style={[styles.badge, slot === 'primary' && styles.badgePrimary, slot === 'secondary' && styles.badgeSecondary]}>
        {slot === 'primary' && <Star color={Colors.onPrimary} size={13} fill={Colors.onPrimary} />}
        {slot === 'secondary' && <Check color={Colors.onPrimary} size={13} strokeWidth={3} />}
        {slot === null && <Plus color={Colors.primaryDark} size={14} strokeWidth={3} />}
        <Text style={[styles.badgeText, slot !== null && styles.badgeTextOn]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, backgroundColor: Colors.background, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginTop: 8, backgroundColor: Colors.borderDark },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 16, paddingRight: 4, paddingTop: 6 },
  headerText: { flex: 1, minWidth: 0, paddingTop: 4 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  subtitle: { fontSize: 13, color: Colors.textMuted },
  counter: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.surfaceVariant },
  counterFull: { backgroundColor: Colors.primaryDark },
  counterText: { fontSize: 13, fontWeight: '800', color: Colors.textMain },
  counterTextFull: { color: Colors.onPrimary },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
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
  tabsScroll: { flexGrow: 0 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  tab: { minHeight: 44, paddingHorizontal: 16, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceVariant },
  tabOn: { backgroundColor: Colors.primaryDark },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  tabTextOn: { color: Colors.onPrimary },
  list: { flex: 1, marginTop: 8 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  column: { gap: 12, marginBottom: 12 },
  spacer: { flex: 1 },
  card: {
    flex: 1,
    minHeight: 150,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardPrimary: { borderColor: Colors.primaryDark, backgroundColor: '#F0FDF4' },
  cardSecondary: { borderColor: SECONDARY, backgroundColor: Colors.tertiaryLight },
  iconBox: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardEn: { fontSize: 15, fontWeight: '800', color: Colors.textMain },
  cardHi: { fontSize: 14, fontWeight: '600', color: Colors.textMain, marginTop: 1 },
  cardPa: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 'auto',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  badgePrimary: { backgroundColor: Colors.primaryDark },
  badgeSecondary: { backgroundColor: SECONDARY },
  badgeText: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  badgeTextOn: { color: Colors.onPrimary },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.textMain,
  },
  toastText: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: Colors.onPrimary },
  bottomBar: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryDark,
  },
  doneBtnOff: { backgroundColor: Colors.textSubtle },
  doneText: { flexShrink: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: Colors.onPrimary },
});
