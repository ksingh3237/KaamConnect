import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone, FileText, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { VERIFIED_WORKERS } from '../../constants/mockData';

export default function ActivityScreen() {
  const router = useRouter();
  const { role } = useStore();
  const isWorker = role === 'worker';

  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'cancelled'>('ongoing');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {isWorker ? 'Worker Earnings & Jobs' : 'My Jobs & Activity'}
          </Text>
          <Text style={styles.headerSubtitle}>Chandigarh Tricity Bookings</Text>
        </View>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>
            {isWorker ? '₹1,450 Earned Today' : '0% App Fees'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Segmented Filter Tabs */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'ongoing' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('ongoing')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'ongoing' && styles.segmentTextActive
              ]}
            >
              Ongoing (1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'completed' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('completed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'completed' && styles.segmentTextActive
              ]}
            >
              Completed (8)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'cancelled' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('cancelled')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'cancelled' && styles.segmentTextActive
              ]}
            >
              Cancelled (0)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Worker Earnings Metrics Card */}
        {isWorker && (
          <View style={styles.earningsCard}>
            <Text style={styles.earningsSub}>TODAY'S DIRECT EARNINGS (सीधी कमाई)</Text>
            <Text style={styles.earningsValue}>₹1,450.00</Text>
            <View style={styles.earningsMeta}>
              <Text style={styles.earningsMetaItem}>
                Jobs Done: <Text style={{ fontWeight: '800' }}>4</Text>
              </Text>
              <Text style={styles.earningsMetaItem}>
                Platform Fee: <Text style={{ fontWeight: '800' }}>₹0.00 (Zero Cut)</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Active/Ongoing Job Card */}
        {activeTab === 'ongoing' && (
          <View style={[styles.card, styles.ongoingCard]}>
            <View style={styles.ongoingHeader}>
              <View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE REPAIR</Text>
                </View>
                <Text style={styles.jobTitle}>Kitchen Pipe Leakage & Replacement</Text>
                <Text style={styles.jobSubtitle}>Sector 22-B • Today at 11:30 AM</Text>
              </View>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillText}>₹430 Settled</Text>
              </View>
            </View>

            <View style={styles.workerStrip}>
              <Image source={{ uri: VERIFIED_WORKERS[0].avatar }} style={styles.stripAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stripName}>
                  {VERIFIED_WORKERS[0].name} (Master Electrician & Plumber)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.stripCallBtn}
                onPress={() =>
                  alert(`Calling ${VERIFIED_WORKERS[0].name} at ${VERIFIED_WORKERS[0].phone}`)
                }
                activeOpacity={0.8}
              >
                <Phone color="#065F46" size={13} />
                <Text style={styles.stripCallText}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => router.push('/tracking')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnSecondaryText}>Track Status →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => router.push('/rating')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnPrimaryText}>Leave Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Past Completed Jobs */}
        {(activeTab === 'ongoing' || activeTab === 'completed') && (
          <>
            <Text style={styles.sectionHeading}>PAST COMPLETED JOBS (पिछले काम)</Text>

            {/* Past Job 1 */}
            <View style={styles.card}>
              <View style={styles.pastJobHeader}>
                <Text style={styles.pastJobTitle}>Split AC Filter Cleaning & Gas Check</Text>
                <Text style={styles.pastJobPrice}>₹299</Text>
              </View>
              <Text style={styles.pastJobMeta}>
                Completed by Amit Sharma on Oct 4 • Rated 5.0 ★
              </Text>
              <View style={styles.pastJobActions}>
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => alert('Downloading official GST/Direct invoice #KC-99238')}
                  activeOpacity={0.7}
                >
                  <FileText color={Colors.tertiary} size={14} />
                  <Text style={styles.receiptBtnText}>Download Receipt (0% Tax)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rebookBtn}
                  onPress={() => router.push('/(tabs)/post-job')}
                  activeOpacity={0.7}
                >
                  <RotateCcw color={Colors.primary} size={14} />
                  <Text style={styles.rebookBtnText}>Re-Book Worker ↻</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Past Job 2 */}
            <View style={styles.card}>
              <View style={styles.pastJobHeader}>
                <Text style={styles.pastJobTitle}>Main Switchboard MCB Trip Fix</Text>
                <Text style={styles.pastJobPrice}>₹200</Text>
              </View>
              <Text style={styles.pastJobMeta}>
                Completed by Rajesh Kumar on Sep 28 • Rated 5.0 ★
              </Text>
              <View style={styles.pastJobActions}>
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => alert('Downloading official invoice #KC-98114')}
                  activeOpacity={0.7}
                >
                  <FileText color={Colors.tertiary} size={14} />
                  <Text style={styles.receiptBtnText}>Download Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rebookBtn}
                  onPress={() => router.push('/(tabs)/post-job')}
                  activeOpacity={0.7}
                >
                  <RotateCcw color={Colors.primary} size={14} />
                  <Text style={styles.rebookBtnText}>Re-Book Worker ↻</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === 'cancelled' && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 13, color: Colors.textMuted }}>
              No cancelled jobs found. You have a 100% completion record!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted
  },
  headerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.xs
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center'
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted
  },
  segmentTextActive: {
    fontWeight: '800',
    color: Colors.textMain
  },
  earningsCard: {
    backgroundColor: '#065F46',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xs
  },
  earningsSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700'
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4
  },
  earningsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)'
  },
  earningsMetaItem: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  ongoingCard: {
    borderWidth: 2,
    borderColor: Colors.primary
  },
  ongoingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm
  },
  activePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    marginBottom: 4
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  jobSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2
  },
  amountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondaryLight
  },
  amountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryDark
  },
  workerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    marginVertical: Spacing.sm
  },
  stripAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full
  },
  stripName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMain
  },
  stripCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  stripCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46'
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs
  },
  actionBtnSecondary: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  actionBtnPrimary: {
    flex: 1,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    marginTop: Spacing.sm
  },
  pastJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  pastJobTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain
  },
  pastJobPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary
  },
  pastJobMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.md
  },
  pastJobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiary
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rebookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary
  }
});
