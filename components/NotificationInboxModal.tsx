// The bell's inbox: newest notifications first, unread ones marked with a dot. Tapping a row marks it read and opens
// the screen it is about. Loaded each time it opens, so it never shows a stale list.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeIndianRupee, Briefcase, CalendarCheck, CheckCheck, CircleCheck, CircleX, MapPin, Navigation, Receipt, X, type LucideIcon } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { NotificationItem, NotificationType } from '../api/types';
import { useNotifications } from '../store/useNotifications';
import { openNotification } from '../utils/openNotification';
import { timeAgo } from '../utils/time';
import { EmptyBlock, ErrorBlock } from './StateBlocks';

const ICONS: Record<NotificationType, { Icon: LucideIcon; color: string; bg: string }> = {
  NEW_LEAD: { Icon: Briefcase, color: '#047857', bg: '#D1FAE5' },
  DIRECT_REQUEST: { Icon: Briefcase, color: '#7C3AED', bg: '#F3E8FF' },
  NEW_QUOTE: { Icon: BadgeIndianRupee, color: '#D97706', bg: '#FEF3C7' },
  BOOKING_CONFIRMED: { Icon: CalendarCheck, color: '#0369A1', bg: '#E0F2FE' },
  WORKER_EN_ROUTE: { Icon: Navigation, color: '#0369A1', bg: '#E0F2FE' },
  WORKER_ARRIVED: { Icon: MapPin, color: '#047857', bg: '#D1FAE5' },
  BILL_CREATED: { Icon: Receipt, color: '#D97706', bg: '#FEF3C7' },
  WORK_COMPLETED: { Icon: CircleCheck, color: '#047857', bg: '#D1FAE5' },
  JOB_CANCELLED_BY_CUSTOMER: { Icon: CircleX, color: '#B91C1C', bg: '#FEE2E2' },
  JOB_CANCELLED_BY_WORKER: { Icon: CircleX, color: '#B91C1C', bg: '#FEE2E2' },
};
const FALLBACK_ICON = { Icon: Briefcase, color: Colors.textMuted, bg: Colors.surfaceVariant };

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationInboxModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const unread = useNotifications((s) => s.unread);
  const setUnread = useNotifications((s) => s.setUnread);
  const refreshUnread = useNotifications((s) => s.refreshUnread);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ignores an answer that arrives after a newer request (pull to refresh while the first load is still running)
  const seq = useRef(0);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    const mine = ++seq.current;
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    try {
      const page = await listNotifications();
      if (mine !== seq.current) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setError(null);
    } catch (e) {
      if (mine === seq.current) setError(userMessage(e));
    } finally {
      if (mine === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void load('initial');
      void refreshUnread();
    }
  }, [visible, load, refreshUnread]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    const mine = seq.current;
    setLoadingMore(true);
    try {
      const page = await listNotifications(cursor);
      if (mine !== seq.current) return; // a refresh replaced the list while this page was on its way
      setItems((current) => [...current, ...page.items.filter((n) => !current.some((c) => c.id === n.id))]);
      setCursor(page.nextCursor);
    } catch {
      /* the footer stays; scrolling again retries */
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, loading]);

  const markAll = async () => {
    const before = items;
    setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setItems(before); // the server did not take it: show the truth
      void refreshUnread();
    }
  };

  const onPressRow = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnread(unread - 1);
      void markNotificationRead(item.id)
        .catch(() => undefined)
        .finally(() => void refreshUnread());
    }
    onClose();
    // iOS cannot show a screen change underneath a Modal that is still closing
    if (Platform.OS === 'ios') await new Promise((resolve) => setTimeout(resolve, 300));
    openNotification(item.type, item.data);
  };

  // The count covers pages not loaded yet, so older unread rows still offer the action
  const hasUnread = unread > 0 || items.some((n) => !n.isRead);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications / सूचनाएं</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close notifications">
            <X color={Colors.textMain} size={22} />
          </TouchableOpacity>
        </View>

        {hasUnread && (
          <TouchableOpacity style={styles.markAll} onPress={() => void markAll()} activeOpacity={0.7} accessibilityRole="button">
            <CheckCheck color={Colors.primaryDark} size={18} />
            <Text style={styles.markAllText}>Mark all as read / सब पढ़ा हुआ करें</Text>
          </TouchableOpacity>
        )}

        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : error && items.length === 0 ? (
          <View style={styles.pad}>
            <ErrorBlock message={error} onRetry={() => void load('initial')} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(n) => n.id}
            contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.md }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.4}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            ListEmptyComponent={<EmptyBlock title="No notifications yet / अभी कोई सूचना नहीं" hint="New quotes, bookings and job updates will show up here." />}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginTop: Spacing.md }} color={Colors.primary} /> : null}
            renderItem={({ item }) => <Row item={item} onPress={() => void onPressRow(item)} />}
          />
        )}
      </View>
    </Modal>
  );
}

function Row({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const { Icon, color, bg } = ICONS[item.type] ?? FALLBACK_ICON;
  return (
    <TouchableOpacity
      style={[styles.row, !item.isRead && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? '' : 'Unread. '}${item.title}. ${item.body}`}
    >
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Icon color={color} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, !item.isRead && { fontWeight: '800' }]} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rowBody} numberOfLines={3}>{item.body}</Text>
        <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textMain },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  markAll: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 44, marginHorizontal: Spacing.lg, paddingHorizontal: 12, borderRadius: Radius.full, backgroundColor: Colors.primaryLight },
  markAllText: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: Spacing.lg },
  list: { padding: Spacing.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  rowUnread: { borderColor: Colors.primary, backgroundColor: '#F4FBF8' },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  rowBody: { fontSize: 14, lineHeight: 20, color: Colors.textMuted, marginTop: 2 },
  rowTime: { fontSize: 13, color: Colors.textSubtle, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});
