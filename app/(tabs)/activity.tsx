import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone, FileText, RotateCcw } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useAsync } from '../../api/useAsync';
import { cancelJob, getEarnings, getReceipt, listMyJobs, listWorkerJobs } from '../../api/endpoints';
import { userMessage } from '../../api/errors';
import type { JobListItem, JobListPage, JobStatus, JobTab, PendingQuote, WorkerJobItem, WorkerJobsPage } from '../../api/types';
import { callPhone, confirmAction, notify } from '../../utils/dialog';
import { timeAgo, whenLabel } from '../../utils/time';
import { EmptyBlock, ErrorBlock } from '../../components/StateBlocks';
import { ActivityJobSkeleton } from '../../components/skeletons/ActivityJobSkeleton';

const POLL_MS = 12000;
const STATUS_TEXT: Record<JobStatus, string> = {
  OPEN: 'WAITING FOR QUOTES',
  ASSIGNED: 'WORKER ON THE WAY',
  ARRIVED: 'WORKER ARRIVED',
  IN_PROGRESS: 'WORK IN PROGRESS',
  WORK_COMPLETED: 'BILL READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function ActivityScreen() {
  const router = useRouter();
  const { role, setActiveJobId, setSelectedCategory } = useStore();
  const isWorker = role === 'worker';
  const [activeTab, setActiveTab] = useState<JobTab>('ongoing');
  const [busyId, setBusyId] = useState<string | null>(null);

  const jobs = useAsync<JobListPage | WorkerJobsPage>(
    () => (isWorker ? listWorkerJobs(activeTab) : listMyJobs(activeTab)),
    [isWorker, activeTab],
    { pollMs: POLL_MS },
  );
  const earnings = useAsync(() => (isWorker ? getEarnings('today') : Promise.resolve(null)), [isWorker]);

  const counts = jobs.data?.meta.counts;
  const list: (JobListItem | WorkerJobItem)[] = jobs.data?.items ?? [];
  const pendingQuotes: PendingQuote[] = isWorker && activeTab === 'ongoing' && jobs.data && 'pendingQuotes' in jobs.data ? jobs.data.pendingQuotes ?? [] : [];

  const open = (jobId: string, path: '/tracking' | '/job-progress' | '/compare-offers' | '/rating') => {
    setActiveJobId(jobId);
    router.push(path);
  };

  const handleCancel = async (jobId: string) => {
    if (busyId) return;
    const ok = await confirmAction('Cancel this request?', 'Workers who already quoted will be told. You can post it again any time.', 'Yes, cancel', true);
    if (!ok) return;
    setBusyId(jobId);
    try {
      await cancelJob(jobId);
      await jobs.reload();
    } catch (error) {
      notify('Could not cancel', userMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const showReceipt = async (jobId: string) => {
    if (busyId) return;
    setBusyId(jobId);
    try {
      const r = await getReceipt(jobId);
      const lines = r.items.map((i) => `${i.description}: ${money(i.amount)}`).join('\n');
      notify(`Receipt ${r.receiptNo}`, `${r.jobTitle}\n${r.worker.name} → ${r.customer.name}\n\n${lines}\nPlatform fee: ₹0\nTotal: ${money(r.total)} (${r.method === 'UPI' ? 'UPI' : 'cash'})`);
    } catch (error) {
      notify('Receipt not available', userMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const callNumber = (phone: string, name: string) => void callPhone(phone, name);

  const tabLabel = (tab: JobTab, label: string) => `${label}${counts ? ` (${counts[tab]})` : ''}`;

  const renderCustomerCard = (job: JobListItem) => {
    const ongoing = activeTab === 'ongoing';
    return (
      <View key={job.id} style={[styles.card, ongoing && styles.ongoingCard]}>
        <View style={styles.ongoingHeader}>
          <View style={{ flex: 1 }}>
            {ongoing && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{STATUS_TEXT[job.status]}</Text>
              </View>
            )}
            <Text style={ongoing ? styles.jobTitle : styles.pastJobTitle}>{job.title}</Text>
            <Text style={ongoing ? styles.jobSubtitle : styles.pastJobMeta}>
              {job.area} • {job.category.title} • {job.bookedStartAt ? whenLabel(job.bookedStartAt) : timeAgo(job.createdAt)}
              {!ongoing && job.worker ? ` • ${job.worker.name}` : ''}
              {!ongoing && job.rating ? ` • Rated ${job.rating.toFixed(1)} ★` : ''}
            </Text>
          </View>
        </View>

        {ongoing && job.worker && (
          <View style={styles.workerStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.stripName}>{job.worker.name}</Text>
            </View>
            <TouchableOpacity style={styles.stripCallBtn} onPress={() => callNumber(job.worker!.phone, job.worker!.name)} activeOpacity={0.8} accessibilityRole="button">
              <Phone color="#065F46" size={13} />
              <Text style={styles.stripCallText}>Call</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={ongoing ? styles.actionRow : styles.pastJobActions}>
          {ongoing && job.status === 'OPEN' && !job.isDirect && (
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => open(job.id, '/compare-offers')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.actionBtnPrimaryText}>View quotes ({job.offersCount})</Text>
            </TouchableOpacity>
          )}
          {ongoing && job.status === 'OPEN' && job.isDirect && (
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => open(job.id, '/tracking')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.actionBtnSecondaryText}>Waiting for worker →</Text>
            </TouchableOpacity>
          )}
          {ongoing && ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(job.status) && (
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => open(job.id, '/tracking')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.actionBtnSecondaryText}>Track Status →</Text>
            </TouchableOpacity>
          )}
          {ongoing && ['ARRIVED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(job.status) && (
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => open(job.id, '/job-progress')} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.actionBtnPrimaryText}>{job.status === 'WORK_COMPLETED' ? 'Review bill & pay' : 'Job progress'}</Text>
            </TouchableOpacity>
          )}
          {ongoing && ['OPEN', 'ASSIGNED'].includes(job.status) && (
            <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => void handleCancel(job.id)} disabled={busyId !== null} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.actionBtnSecondaryText}>{busyId === job.id ? 'Cancelling…' : 'Cancel'}</Text>
            </TouchableOpacity>
          )}
          {activeTab === 'completed' && (
            <>
              <TouchableOpacity style={styles.receiptBtn} onPress={() => void showReceipt(job.id)} disabled={busyId !== null} activeOpacity={0.7} accessibilityRole="button">
                <FileText color={Colors.tertiary} size={14} />
                <Text style={styles.receiptBtnText}>View Receipt</Text>
              </TouchableOpacity>
              {!job.reviewed && (
                <TouchableOpacity style={styles.rebookBtn} onPress={() => open(job.id, '/rating')} activeOpacity={0.7} accessibilityRole="button">
                  <Text style={styles.rebookBtnText}>Leave Review</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.rebookBtn} onPress={() => { setSelectedCategory(job.category.id); router.navigate('/(tabs)/post-job'); }} activeOpacity={0.7} accessibilityRole="button">
                <RotateCcw color={Colors.primary} size={14} />
                <Text style={styles.rebookBtnText}>Re-Book ↻</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderWorkerCard = (job: WorkerJobItem) => {
    const ongoing = activeTab === 'ongoing';
    return (
      <TouchableOpacity key={job.id} style={[styles.card, ongoing && styles.ongoingCard]} onPress={() => open(job.id, '/job-progress')} activeOpacity={0.85} accessibilityRole="button">
        <View style={styles.ongoingHeader}>
          <View style={{ flex: 1 }}>
            {ongoing && (
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{STATUS_TEXT[job.status]}</Text>
              </View>
            )}
            <Text style={ongoing ? styles.jobTitle : styles.pastJobTitle}>{job.title}</Text>
            <Text style={ongoing ? styles.jobSubtitle : styles.pastJobMeta}>
              {job.area} • {job.customerName} • {job.bookedStartAt ? whenLabel(job.bookedStartAt) : timeAgo(job.createdAt)}
              {job.rating ? ` • Rated ${job.rating.toFixed(1)} ★` : ''}
            </Text>
          </View>
          {job.total > 0 && (
            <View style={styles.amountPill}>
              <Text style={styles.amountPillText}>{money(job.total)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isWorker ? 'Worker Earnings & Jobs' : 'My Jobs & Activity'}</Text>
          <Text style={styles.headerSubtitle}>Chandigarh Tricity Bookings</Text>
        </View>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{isWorker ? `${money(earnings.data?.amount ?? 0)} Earned Today` : '0% App Fees'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={jobs.refreshing} onRefresh={() => { void jobs.reload(); void earnings.reload(); }} />}
      >
        {/* Segmented Filter Tabs */}
        <View style={styles.segmentContainer}>
          {([['ongoing', 'Ongoing'], ['completed', 'Completed'], ['cancelled', 'Cancelled']] as const).map(([tab, label]) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentBtn, activeTab === tab && styles.segmentBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tabLabel(tab, label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Worker Earnings Metrics Card */}
        {isWorker && (
          <View style={styles.earningsCard}>
            <Text style={styles.earningsSub}>TODAY'S DIRECT EARNINGS (सीधी कमाई)</Text>
            <Text style={styles.earningsValue}>{earnings.data ? `${money(earnings.data.amount)}.00` : earnings.error ? '—' : '…'}</Text>
            <View style={styles.earningsMeta}>
              <Text style={styles.earningsMetaItem}>
                Jobs Done: <Text style={{ fontWeight: '800' }}>{earnings.data?.jobsDone ?? 0}</Text>
              </Text>
              <Text style={styles.earningsMetaItem}>
                Platform Fee: <Text style={{ fontWeight: '800' }}>₹0.00 (Zero Cut)</Text>
              </Text>
            </View>
          </View>
        )}

        {jobs.loading && <ActivityJobSkeleton />}
        {jobs.error && !jobs.data && <ErrorBlock message={jobs.error} onRetry={() => void jobs.reload()} />}

        {/* Quotes the worker sent that are still waiting for an answer */}
        {pendingQuotes.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>QUOTES WAITING FOR A REPLY (जवाब का इंतज़ार)</Text>
            {pendingQuotes.map((q) => (
              <View key={q.offerId} style={styles.card}>
                <View style={styles.pastJobHeader}>
                  <Text style={styles.pastJobTitle}>{q.title}</Text>
                  <Text style={styles.pastJobPrice}>{money(q.visitFee)}</Text>
                </View>
                <Text style={styles.pastJobMeta}>{q.reference} • ETA {q.etaMinutes} min • sent {timeAgo(q.createdAt)}</Text>
              </View>
            ))}
          </>
        )}

        {jobs.data && list.length === 0 && pendingQuotes.length === 0 && (
          <EmptyBlock
            title={activeTab === 'ongoing' ? 'Nothing ongoing' : activeTab === 'completed' ? 'No completed jobs yet' : 'No cancelled jobs'}
            hint={isWorker ? 'Jobs you win show up here. / जीते हुए काम यहाँ दिखेंगे' : 'Post a job or book a pro from Home. / होम से काम पोस्ट करें'}
          />
        )}

        {list.map((job) => (isWorker ? renderWorkerCard(job as WorkerJobItem) : renderCustomerCard(job as JobListItem)))}
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
    gap: Spacing.sm,
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
    fontSize: 13,
    color: Colors.textMuted
  },
  headerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  headerPillText: {
    fontSize: 12,
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
    fontSize: 13,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)'
  },
  earningsMetaItem: {
    fontSize: 13,
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
    gap: Spacing.sm,
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
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  jobSubtitle: {
    fontSize: 13,
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
    fontSize: 12,
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
    fontSize: 13,
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
    fontSize: 13,
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
    gap: Spacing.sm,
    marginBottom: 4
  },
  pastJobTitle: {
    flex: 1,
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
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.md
  },
  pastJobActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.tertiary
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  rebookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary
  }
});
