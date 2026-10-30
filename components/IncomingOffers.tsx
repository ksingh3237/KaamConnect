// The customer's Home, top of the page: the quotes workers sent for the customer's open requests, with Call / Decline /
// Accept right there, the way a worker sees new leads on their Home. A request with no quote yet shows a small
// "finding workers" line, so the customer knows it is live. Nothing is shown when no request is open.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useAsync } from '../api/useAsync';
import { listMyJobs, listOffers } from '../api/endpoints';
import type { JobListItem, OfferForCustomer } from '../api/types';
import { useStore } from '../store/useStore';
import { useT } from '../i18n/useT';
import OfferCard, { useOfferActions } from './OfferCard';

const POLL_MS = 10000;
/** A customer rarely has more than one or two requests open; past this many, Activity lists the rest. */
const MAX_REQUESTS = 4;
/** Quotes shown per request on Home before "See all". */
const MAX_OFFERS = 3;

interface RequestOffers {
  job: JobListItem;
  offers: OfferForCustomer[];
}

async function loadIncoming(): Promise<RequestOffers[]> {
  const page = await listMyJobs('ongoing');
  // A direct request goes to one chosen worker, who accepts it; it never collects quotes
  const open = page.items.filter((j) => j.status === 'OPEN' && !j.isDirect).slice(0, MAX_REQUESTS);
  return Promise.all(
    open.map(async (job) => ({
      job,
      offers: job.offersCount > 0 ? (await listOffers(job.id, 'fee')).filter((o) => o.status === 'PENDING') : [],
    })),
  );
}

export default function IncomingOffers() {
  const router = useRouter();
  const t = useT();
  const setActiveJobId = useStore((s) => s.setActiveJobId);
  const feed = useAsync(loadIncoming, [], { pollMs: POLL_MS });
  const { busy, accept, decline } = useOfferActions(() => void feed.reload(), () => router.push('/tracking'));

  const requests = feed.data ?? [];
  if (requests.length === 0) return null;
  const total = requests.reduce((n, r) => n + r.offers.length, 0);

  const openAll = (jobId: string) => {
    setActiveJobId(jobId);
    router.push('/compare-offers');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.liveDot} />
        <Text style={styles.title}>{total > 0 ? t('Offers for your requests') : t('Your open requests')}</Text>
        {total > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{total === 1 ? t('1 Offer') : t('{count} Offers', { count: total })}</Text>
          </View>
        )}
      </View>

      {requests.map(({ job, offers }) => {
        const place = `${job.area}, ${job.city.replace(/\s*\(.*\)/, '')}`;
        if (offers.length === 0) {
          return (
            <TouchableOpacity key={job.id} style={styles.waitingCard} onPress={() => openAll(job.id)} activeOpacity={0.85} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={styles.waitingTitle} numberOfLines={1}>{t('Finding workers for “{title}”', { title: job.title })}</Text>
                <Text style={styles.waitingSub}>{t('Nearby workers have been told. Their offers will appear here.')}</Text>
              </View>
              <ChevronRight color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          );
        }
        const fastestId = offers.find((o) => o.isFastest)?.offerId ?? null;
        return (
          <View key={job.id} style={styles.request}>
            <Text style={styles.requestTitle} numberOfLines={1}>
              {job.title} <Text style={styles.requestPlace}>• {place}</Text>
            </Text>
            <View style={{ gap: 16 }}>
              {offers.slice(0, MAX_OFFERS).map((offer) => (
                <OfferCard
                  key={offer.offerId}
                  offer={offer}
                  fastest={offer.offerId === fastestId && offers.length > 1}
                  busy={busy}
                  onAccept={() => void accept(job.id, offer)}
                  onDecline={() => void decline(job.id, offer)}
                />
              ))}
            </View>
            {offers.length > MAX_OFFERS && (
              <TouchableOpacity style={styles.seeAll} onPress={() => openAll(job.id)} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.seeAllText}>{t('See all {count} offers', { count: offers.length })}</Text>
                <ChevronRight color={Colors.primaryDark} size={18} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textMain },
  countPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  countText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  request: { gap: 12 },
  requestTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  requestPlace: { fontWeight: '600', color: Colors.textMuted },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
  },
  waitingTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  waitingSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44 },
  seeAllText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
});
