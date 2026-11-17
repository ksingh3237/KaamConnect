// The worker's Wallet: what they have earned (lifetime, today, this week, this month) and the paid jobs behind it, plus
// a Top Up tab that is not built yet. Customers pay workers directly and KaamConnect holds no money, so this is a view of
// earnings, not a balance: nothing here can be withdrawn.
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, BadgeIndianRupee, Wallet } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useAsync } from '../api/useAsync';
import { getEarnings, listEarningJobs } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { EarningJob } from '../api/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { whenLabel } from '../utils/time';
import { pick } from '../i18n';
import { useLang, useT } from '../i18n/useT';

type WalletTab = 'earnings' | 'topup';

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function WalletScreen() {
  const t = useT();
  const [tab, setTab] = useState<WalletTab>('earnings');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
        >
          <ArrowLeft color={Colors.textMain} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('Wallet')}</Text>
          <Text style={styles.headerSub}>{t('Your earnings on KaamConnect')}</Text>
        </View>
      </View>

      <View style={styles.segmentContainer}>
        {(
          [
            ['earnings', t('Total Earnings')],
            ['topup', t('Top Up')],
          ] as const
        ).map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.segmentBtn, tab === id && styles.segmentBtnActive]}
            onPress={() => setTab(id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === id }}
          >
            <Text style={[styles.segmentText, tab === id && styles.segmentTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'earnings' ? <EarningsTab /> : <TopUpTab />}
    </SafeAreaView>
  );
}

function EarningsTab() {
  const t = useT();
  const lang = useLang();
  // The four totals in one go: they are shown together and come from the same paid jobs
  const totals = useAsync(async () => {
    const [all, today, week, month] = await Promise.all([getEarnings('all'), getEarnings('today'), getEarnings('week'), getEarnings('month')]);
    return { all, today, week, month };
  }, []);
  const firstPage = useAsync(() => listEarningJobs(), []);
  // Further pages, added by "Show more"; reset whenever the first page is read again
  const [more, setMore] = useState<{ items: EarningJob[]; nextCursor: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const jobs = [...(firstPage.data?.items ?? []), ...(more?.items ?? [])];
  const nextCursor = more ? more.nextCursor : (firstPage.data?.nextCursor ?? null);

  const refresh = () => {
    setMore(null);
    setMoreError(null);
    void totals.reload();
    void firstPage.reload();
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await listEarningJobs(nextCursor);
      setMore((prev) => ({ items: [...(prev?.items ?? []), ...page.items], nextCursor: page.nextCursor }));
    } catch (error) {
      setMoreError(userMessage(error));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={totals.refreshing || firstPage.refreshing} onRefresh={refresh} />}
    >
      {totals.loading && <LoadingBlock />}
      {totals.error && !totals.data && <ErrorBlock message={totals.error} onRetry={() => void totals.reload()} />}
      {totals.data && (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('LIFETIME EARNINGS')}</Text>
            <Text style={styles.totalAmount} accessibilityLabel={t('Lifetime earnings {amount}', { amount: rupees(totals.data.all.amount) })}>
              {rupees(totals.data.all.amount)}
            </Text>
            <Text style={styles.totalSub}>
              {totals.data.all.jobsDone === 1 ? t('From 1 paid job • 0% commission') : t('From {count} paid jobs • 0% commission', { count: totals.data.all.jobsDone })}
            </Text>
          </View>

          <View style={styles.periodRow}>
            {(
              [
                [t('Today'), totals.data.today],
                [t('This week'), totals.data.week],
                [t('This month'), totals.data.month],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={styles.periodTile}>
                <Text style={styles.periodLabel}>{label}</Text>
                <Text style={styles.periodAmount}>{rupees(value.amount)}</Text>
                <Text style={styles.periodJobs}>{value.jobsDone === 1 ? t('1 job') : t('{count} jobs', { count: value.jobsDone })}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.honestNote}>{t('Customers pay you directly. KaamConnect does not hold your money, so there is nothing to withdraw here.')}</Text>
        </>
      )}

      <Text style={styles.sectionTitle}>{t('Paid jobs')}</Text>
      {firstPage.loading && <LoadingBlock />}
      {firstPage.error && !firstPage.data && <ErrorBlock message={firstPage.error} onRetry={() => void firstPage.reload()} />}
      {firstPage.data && jobs.length === 0 && <EmptyBlock title={t('No paid jobs yet')} hint={t('Jobs appear here once the customer has paid.')} />}
      {jobs.map((job) => (
        <View key={job.jobId} style={styles.jobRow}>
          <View style={styles.jobIcon}>
            <BadgeIndianRupee color={Colors.primary} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.jobMeta} numberOfLines={1}>
              {pick(job.category.title, lang)} • {job.customerName} • {job.area}
            </Text>
            <Text style={styles.jobMeta}>
              {whenLabel(job.completedAt)} • {job.method === 'CASH' ? t('Cash') : t('UPI')} • {job.reference}
            </Text>
          </View>
          <Text style={styles.jobAmount}>{rupees(job.amount)}</Text>
        </View>
      ))}
      {moreError && <ErrorBlock message={moreError} onRetry={() => void loadMore()} />}
      {nextCursor && !moreError && (
        <TouchableOpacity style={styles.moreBtn} onPress={() => void loadMore()} disabled={loadingMore} activeOpacity={0.8} accessibilityRole="button">
          {loadingMore ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.moreBtnText}>{t('Show more')}</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function TopUpTab() {
  const t = useT();
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.soonCard}>
        <View style={styles.soonIcon}>
          <Wallet color="#FFFFFF" size={28} />
        </View>
        <Text style={styles.soonTitle}>{t('Coming Soon')}</Text>
        <Text style={styles.soonText}>{t('Adding money to your KaamConnect wallet is on its way. Until then, nothing to do here: customers keep paying you directly.')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  headerSub: { fontSize: 13, color: Colors.textMuted },
  segmentContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: Radius.md, padding: 3, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { fontWeight: '800', color: Colors.textMain },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.sm },
  totalCard: { backgroundColor: '#065F46', borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  totalLabel: { fontSize: 12, fontWeight: '800', color: '#A7F3D0', letterSpacing: 0.5 },
  totalAmount: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', marginVertical: 4 },
  totalSub: { fontSize: 13, color: '#D1FAE5' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  periodTile: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 10 },
  periodLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  periodAmount: { fontSize: 16, fontWeight: '800', color: Colors.textMain, marginTop: 2 },
  periodJobs: { fontSize: 12, color: Colors.textSubtle },
  honestNote: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMain, marginBottom: 8 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 },
  jobIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  jobMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  jobAmount: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  moreBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDark, backgroundColor: '#FFFFFF', marginTop: 4 },
  moreBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textMain },
  soonCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginTop: Spacing.md },
  soonIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  soonTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain, marginBottom: 6 },
  soonText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
