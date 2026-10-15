import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useAsync } from '../api/useAsync';
import { acceptOffer, getJob, listOffers } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { OfferForCustomer } from '../api/types';
import Avatar from '../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { callPhone, notify } from '../utils/dialog';

const POLL_MS = 8000; // quotes arrive while the screen is open; REST polling is the baseline, a socket can replace it

export default function CompareOffersScreen() {
  const router = useRouter();
  const { activeJobId } = useStore();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const job = useAsync(() => (activeJobId ? getJob(activeJobId) : Promise.resolve(null)), [activeJobId]);
  const offers = useAsync(() => (activeJobId ? listOffers(activeJobId, 'fee') : Promise.resolve([] as OfferForCustomer[])), [activeJobId], { pollMs: POLL_MS });

  const list = offers.data ?? [];
  const offerCount = list.length;
  const fastestId = list.find((o) => o.isFastest)?.offerId ?? null;

  const handleCall = (phone: string, name: string) => void callPhone(phone, name);

  const handleAccept = async (offer: OfferForCustomer) => {
    if (acceptingId || !activeJobId) return;
    setAcceptingId(offer.offerId);
    try {
      await acceptOffer(activeJobId, offer.offerId);
      router.replace('/tracking');
    } catch (error) {
      // e.g. the worker was booked meanwhile (OFFER_UNAVAILABLE): show it and refresh the list
      const message = userMessage(error);
      void notify('Could not accept / स्वीकार नहीं हो सका', message);
      void offers.reload();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={offers.refreshing} onRefresh={() => void offers.reload()} />}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/post-job')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={Colors.textMain} size={20} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Compare Incoming Offers</Text>
            <Text style={styles.headerSub}>{offerCount} Verified {offerCount === 1 ? 'Worker' : 'Workers'} Responded</Text>
          </View>
          <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE OFFERS</Text></View>
        </View>

        {/* Request Recap Card */}
        <View style={styles.recapCard}>
          <Text style={{ fontSize: 20 }}>🛠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.recapTitle}>{job.data?.title ?? '…'}</Text>
            <Text style={styles.recapSub}>{job.data ? `${job.data.locality ?? job.data.area.name}, ${job.data.city.name.replace(/\s*\(.*\)/, '')} • ${job.data.reference}` : ''}</Text>
          </View>
          <View style={styles.offersTag}><Text style={styles.offersTagText}>{offerCount} Offers</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Select an Artisan & Confirm Arrival:</Text>

        {/* Offers */}
        {!activeJobId && (
          <>
            <EmptyBlock title="Open a request to see its quotes" hint="Your requests are in Activity. / अपने अनुरोध गतिविधि में देखें" />
            <TouchableOpacity style={[styles.acceptBtn, { marginTop: 12, minHeight: 48, justifyContent: 'center' }]} onPress={() => router.replace('/(tabs)/activity')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.acceptBtnText}>My requests • मेरे अनुरोध</Text>
            </TouchableOpacity>
          </>
        )}
        {activeJobId && offers.loading && <LoadingBlock label="Waiting for quotes… / कोट का इंतज़ार…" />}
        {activeJobId && offers.error && !offers.data && <ErrorBlock message={offers.error} onRetry={() => void offers.reload()} />}
        {activeJobId && offers.data && offerCount === 0 && (
          <EmptyBlock
            title="No quotes yet"
            hint={job.data?.status === 'OPEN' ? 'Nearby artisans have been notified. This page refreshes by itself. / कारीगरों को सूचित किया गया है' : 'This request is no longer open for quotes.'}
          />
        )}
        <View style={{ gap: 14 }}>
          {list.map((offer) => {
            const worker = offer.worker;
            const isFastest = offer.offerId === fastestId;
            return (
              <View key={offer.offerId} style={[styles.workerCard, isFastest && styles.workerCardFastest]}>
                {isFastest && (
                  <View style={styles.fastestBadge}>
                    <Text style={styles.fastestText}>FASTEST ARRIVAL ({offer.etaMinutes} MIN)</Text>
                  </View>
                )}

                <View style={styles.workerTop}>
                  <Avatar uri={worker.photoUrl} size={52} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text>🛡️</Text>
                    </View>
                    <Text style={styles.workerTrade}>{worker.trade}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.ratingText}>⭐ {worker.rating ?? 'New'} ({worker.reviewsCount})</Text>
                      <Text style={styles.metaDim}>📍 {worker.distanceKm !== null ? `${worker.distanceKm} km` : worker.areaName}</Text>
                      <Text style={styles.metaDim}>⏱️ {offer.etaMinutes} Min ETA</Text>
                    </View>
                  </View>
                </View>

                {offer.message && (
                  <View style={styles.quoteMsgBox}>
                    <Text style={styles.quoteMsgText}>💬 "{offer.message}"</Text>
                  </View>
                )}

                <View style={styles.workerBottom}>
                  <View>
                    <Text style={styles.feeLabel}>Offered Visit Fee</Text>
                    <Text style={styles.feeAmount}>
                      ₹{offer.visitFee}
                      <Text style={{ color: Colors.primary, fontSize: 12 }}> (0% App Fee)</Text>
                    </Text>
                  </View>

                  <View style={styles.actionGroup}>
                    <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(worker.phone, worker.name)} accessibilityRole="button">
                      <Phone color="#FFFFFF" size={13} />
                      <Text style={styles.callBtnText}>{isFastest ? 'Direct Call' : 'Call'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.acceptBtn, (!offer.available || acceptingId !== null) && { opacity: 0.6 }]}
                      onPress={() => void handleAccept(offer)}
                      disabled={!offer.available || acceptingId !== null}
                      accessibilityRole="button"
                    >
                      <Text style={styles.acceptBtnText}>{acceptingId === offer.offerId ? 'Accepting…' : !offer.available ? 'Booked' : isFastest ? 'Accept Offer ✓' : 'Accept'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  scrollContent: {
    padding: Spacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    flex: 1,
    marginHorizontal: 10
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted
  },
  liveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46'
  },
  recapCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md
  },
  recapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMain
  },
  recapSub: {
    fontSize: 12,
    color: Colors.textMuted
  },
  offersTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  offersTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: 10
  },
  workerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14
  },
  workerCardFastest: {
    borderColor: Colors.primary,
    borderWidth: 2
  },
  fastestBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  fastestText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  workerTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24
  },
  workerName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain
  },
  workerTrade: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600'
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 2,
    marginTop: 2
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309'
  },
  metaDim: {
    fontSize: 12,
    color: Colors.textMuted
  },
  quoteMsgBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: 8,
    marginBottom: 10
  },
  quoteMsgText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16
  },
  workerBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#E2E8F0'
  },
  feeLabel: {
    fontSize: 12,
    color: Colors.textMuted
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto'
  },
  callBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  acceptBtn: {
    backgroundColor: '#065F46',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
