import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { VERIFIED_WORKERS } from '../constants/mockData';
import { useStore } from '../store/useStore';

// Optional message a worker attached to their quote
const OFFER_NOTES: Record<string, string> = {
  w1: 'Nearby in Sec 22 Market. Carrying standard PVC pipes & sealant tools.'
};

export default function CompareOffersScreen() {
  const router = useRouter();
  const { setActiveBooking } = useStore();

  const offerCount = VERIFIED_WORKERS.length;
  const fastestId = VERIFIED_WORKERS.reduce((a, b) => (b.etaMinutes < a.etaMinutes ? b : a)).id;

  const handleCall = (phone: string, name: string) => {
    Alert.alert('Direct Phone Call', `Call ${name} directly at ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`) }
    ]);
  };

  const handleAccept = (worker: typeof VERIFIED_WORKERS[0]) => {
    setActiveBooking(worker);
    if (Platform.OS === 'web') {
      window.alert('🎉 Offer Accepted\n\n' + worker.name + ' is on the way! Live GPS tracking activated.');
      router.push('/tracking');
    } else {
      Alert.alert('🎉 Offer Accepted', `${worker.name} is on the way! Live GPS tracking activated.`, [
        { text: 'Track Pro', onPress: () => router.push('/tracking') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.headerSub}>{offerCount} Verified Workers Responded</Text>
          </View>
          <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE OFFERS</Text></View>
        </View>

        {/* Request Recap Card */}
        <View style={styles.recapCard}>
          <Text style={{ fontSize: 20 }}>🚰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.recapTitle}>Kitchen Sink Under-pipe Burst</Text>
            <Text style={styles.recapSub}>Sector 22-B, Chandigarh • Posted 12m ago</Text>
          </View>
          <View style={styles.offersTag}><Text style={styles.offersTagText}>{offerCount} Offers</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Select an Artisan & Confirm Arrival:</Text>

        {/* Offers */}
        <View style={{ gap: 14 }}>
          {VERIFIED_WORKERS.map((worker) => {
            const isFastest = worker.id === fastestId;
            const note = OFFER_NOTES[worker.id];
            return (
              <View key={worker.id} style={[styles.workerCard, isFastest && styles.workerCardFastest]}>
                {isFastest && (
                  <View style={styles.fastestBadge}>
                    <Text style={styles.fastestText}>FASTEST ARRIVAL ({worker.etaMinutes} MIN)</Text>
                  </View>
                )}

                <View style={styles.workerTop}>
                  <Image source={{ uri: worker.avatar }} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text>🛡️</Text>
                    </View>
                    <Text style={styles.workerTrade}>{worker.trade}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.ratingText}>⭐ {worker.rating} ({worker.reviewsCount})</Text>
                      <Text style={styles.metaDim}>📍 {worker.distance.replace(' away', '')}</Text>
                      <Text style={styles.metaDim}>⏱️ {worker.etaMinutes} Min ETA</Text>
                    </View>
                  </View>
                </View>

                {note && (
                  <View style={styles.quoteMsgBox}>
                    <Text style={styles.quoteMsgText}>💬 "{note}"</Text>
                  </View>
                )}

                <View style={styles.workerBottom}>
                  <View>
                    <Text style={styles.feeLabel}>Offered Visit Fee</Text>
                    <Text style={styles.feeAmount}>
                      ₹{worker.visitingFee}
                      {isFastest && <Text style={{ color: Colors.primary, fontSize: 10 }}> (0% App Fee)</Text>}
                    </Text>
                  </View>

                  <View style={styles.actionGroup}>
                    <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(worker.phone, worker.name)}>
                      <Phone color="#FFFFFF" size={13} />
                      <Text style={styles.callBtnText}>{isFastest ? 'Direct Call' : 'Call'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(worker)}>
                      <Text style={styles.acceptBtnText}>{isFastest ? 'Accept Offer ✓' : 'Accept'}</Text>
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
    fontSize: 10,
    color: Colors.textMuted
  },
  liveBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  liveText: {
    fontSize: 9,
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
    fontSize: 10,
    color: Colors.textMuted
  },
  offersTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  offersTagText: {
    fontSize: 9,
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
    fontSize: 9,
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309'
  },
  metaDim: {
    fontSize: 10,
    color: Colors.textMuted
  },
  quoteMsgBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: 8,
    marginBottom: 10
  },
  quoteMsgText: {
    fontSize: 10,
    color: '#065F46',
    lineHeight: 14
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
    fontSize: 9,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '800'
  }
});
