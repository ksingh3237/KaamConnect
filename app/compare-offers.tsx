import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { getJob, listOffers } from '../api/endpoints';
import type { JobView, OfferForCustomer } from '../api/types';
import OfferCard, { useOfferActions } from '../components/OfferCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { useT } from '../i18n/useT';

const POLL_MS = 8000; // quotes arrive while the screen is open; REST polling is the baseline, a socket can replace it

/**
 * What to say (and where to send the customer) when the request no longer takes quotes. This screen is also reached
 * from an old "new quote" notification, long after the customer booked someone: it must not offer "Accept" then.
 */
function closedState(job: JobView, now: number, t: (text: string) => string): { message: string; action: string; href: Href } | null {
  const expired = job.status === 'OPEN' && job.expiresAt !== null && Date.parse(job.expiresAt) <= now;
  if (job.status === 'OPEN' && !expired) return null;
  switch (job.status) {
    case 'ASSIGNED':
    case 'ARRIVED':
    case 'IN_PROGRESS':
      return { message: t('You already booked a worker for this request.'), action: t('Track your worker'), href: '/tracking' };
    case 'WORK_COMPLETED':
      return { message: t('The work is done. Review the bill and pay your worker.'), action: t('Review bill & pay'), href: '/job-progress' };
    case 'COMPLETED':
      return { message: t('This job is complete.'), action: t('My requests'), href: '/(tabs)/activity' };
    default: // CANCELLED, or an OPEN request whose time ran out
      return {
        message: expired ? t('This request has expired, so its quotes can no longer be accepted.') : t('This request was cancelled.'),
        action: t('Post a new request'),
        href: '/(tabs)/post-job',
      };
  }
}

export default function CompareOffersScreen() {
  const router = useRouter();
  const t = useT();
  const { activeJobId } = useStore();

  const job = useAsync(() => (activeJobId ? getJob(activeJobId) : Promise.resolve(null)), [activeJobId], { pollMs: POLL_MS });
  const offers = useAsync(() => (activeJobId ? listOffers(activeJobId, 'fee') : Promise.resolve([] as OfferForCustomer[])), [activeJobId], { pollMs: POLL_MS });
  const reload = () => {
    void offers.reload();
    void job.reload();
  };
  const { busy, accept, decline } = useOfferActions(reload, () => router.replace('/tracking'));

  const closed = job.data ? closedState(job.data, Date.now(), t) : null;
  // Once closed, only the quote the customer chose is worth showing
  const list = (offers.data ?? []).filter((o) => !closed || o.status === 'ACCEPTED');
  const offerCount = list.length;
  const fastestId = list.find((o) => o.isFastest)?.offerId ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={offers.refreshing} onRefresh={reload} />}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color={Colors.textMain} size={20} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('Compare Incoming Offers')}</Text>
            <Text style={styles.headerSub}>{offerCount === 1 ? t('1 Verified Worker Responded') : t('{count} Verified Workers Responded', { count: offerCount })}</Text>
          </View>
          {!closed && <View style={styles.liveBadge}><Text style={styles.liveText}>{t('LIVE OFFERS')}</Text></View>}
        </View>

        {/* Request Recap Card */}
        <View style={styles.recapCard}>
          <Text style={{ fontSize: 20 }}>🛠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.recapTitle}>{job.data?.title ?? '…'}</Text>
            <Text style={styles.recapSub}>{job.data ? `${job.data.locality ?? job.data.area.name}, ${job.data.city.name.replace(/\s*\(.*\)/, '')} • ${job.data.reference}` : ''}</Text>
          </View>
          <View style={styles.offersTag}><Text style={styles.offersTagText}>{offerCount === 1 ? t('1 Offer') : t('{count} Offers', { count: offerCount })}</Text></View>
        </View>

        {closed && (
          <View style={styles.closedCard} accessibilityRole="alert">
            <View style={styles.closedRow}>
              <Info color="#92400E" size={18} />
              <Text style={styles.closedText}>{closed.message}</Text>
            </View>
            <TouchableOpacity style={styles.closedBtn} onPress={() => router.replace(closed.href)} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.closedBtnText}>{closed.action}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!closed && <Text style={styles.sectionTitle}>{t('Select an Artisan & Confirm Arrival:')}</Text>}

        {/* Offers */}
        {!activeJobId && (
          <>
            <EmptyBlock title={t('Open a request to see its quotes')} hint={t('Your requests are in Activity.')} />
            <TouchableOpacity style={[styles.closedBtn, { marginTop: 12 }]} onPress={() => router.replace('/(tabs)/activity')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.closedBtnText}>{t('My requests')}</Text>
            </TouchableOpacity>
          </>
        )}
        {activeJobId && offers.loading && <LoadingBlock label={t('Waiting for quotes…')} />}
        {activeJobId && offers.error && !offers.data && <ErrorBlock message={offers.error} onRetry={reload} />}
        {activeJobId && offers.data && offerCount === 0 && !closed && (
          <EmptyBlock title={t('No quotes yet')} hint={t('Nearby artisans have been notified. This page refreshes by itself.')} />
        )}
        <View style={{ gap: 16 }}>
          {list.map((offer) => (
            <OfferCard
              key={offer.offerId}
              offer={offer}
              fastest={offer.offerId === fastestId && offerCount > 1}
              busy={busy}
              onAccept={() => void accept(activeJobId!, offer)}
              onDecline={() => void decline(activeJobId!, offer)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 32 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, marginHorizontal: 10 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMain },
  headerSub: { fontSize: 13, color: Colors.textMuted },
  liveBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  liveText: { fontSize: 12, fontWeight: '800', color: '#065F46' },
  recapCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  recapTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  recapSub: { fontSize: 13, color: Colors.textMuted },
  offersTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  offersTagText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  closedCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: Radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: Spacing.md,
  },
  closedRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  closedText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#92400E', lineHeight: 20 },
  closedBtn: { backgroundColor: '#065F46', minHeight: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  closedBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain, marginBottom: 14 },
});
