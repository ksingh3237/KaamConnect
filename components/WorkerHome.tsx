// The worker's Home: the "taking jobs" switch, their active jobs, the newest leads with a quote button, and today's
// earnings (always 100% theirs). No customer features here: workers never see job posting.
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell, BadgeIndianRupee, Clock, MapPin, Menu, Radar, ShieldAlert, ShieldCheck, Wrench } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useSession } from '../store/useSession';
import { useAsync } from '../api/useAsync';
import { getEarnings, listLeads, listWorkerJobs, patchWorker } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { JobStatus, JobTiming, LeadItem } from '../api/types';
import { notify } from '../utils/dialog';
import { useWorkerTracking } from '../utils/useWorkerTracking';
import { timeAgo, whenLabel } from '../utils/time';
import { ErrorBlock, LoadingBlock } from './StateBlocks';
import AppMenu from './AppMenu';

const POLL_MS = 20000; // new leads appear while the dashboard is open
const PREVIEW_LEADS = 3;

const JOB_STATUS: Partial<Record<JobStatus, string>> = {
  ASSIGNED: 'Go to customer • रास्ते में',
  ARRIVED: 'Arrived • पहुंच गए',
  IN_PROGRESS: 'Work in progress • काम जारी',
  WORK_COMPLETED: 'Collect payment • भुगतान लें',
};

function urgencyOf(lead: Pick<LeadItem, 'urgency' | 'scheduledFor'>): { label: string; urgent: boolean } {
  const byTiming: Record<JobTiming, string> = { IMMEDIATE: 'URGENT', AFTERNOON: 'Afternoon', TOMORROW: 'Tomorrow', SCHEDULED: 'Scheduled' };
  if (lead.urgency === 'SCHEDULED' && lead.scheduledFor) return { label: whenLabel(lead.scheduledFor), urgent: false };
  return { label: byTiming[lead.urgency], urgent: lead.urgency === 'IMMEDIATE' };
}

export default function WorkerHome() {
  const router = useRouter();
  const setActiveJobId = useStore((s) => s.setActiveJobId);
  const { workerProfile, refreshMe } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const verified = workerProfile?.verificationStatus === 'VERIFIED';

  const [available, setAvailable] = useState(workerProfile?.isAvailable ?? true);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    if (workerProfile) setAvailable(workerProfile.isAvailable);
  }, [workerProfile]);

  const leads = useAsync(() => listLeads({ filter: 'all' }), [], { pollMs: POLL_MS });
  const jobs = useAsync(() => listWorkerJobs('ongoing'), [], { pollMs: POLL_MS });
  const earnings = useAsync(() => getEarnings('today'), []);

  const openLeads = (leads.data?.items ?? []).filter((l) => l.leadState !== 'DECLINED');
  const activeJobs = (jobs.data?.items ?? []).filter((j) => j.status in JOB_STATUS);
  // The worker may leave the job screen while driving: sharing GPS follows the job's status, not the open screen
  useWorkerTracking(jobs.data ? (jobs.data.items.find((j) => j.status === 'ASSIGNED')?.id ?? null) : undefined);

  const toggleAvailable = async (next: boolean) => {
    if (switching) return;
    setAvailable(next); // instant feedback; put back if the server refuses
    setSwitching(true);
    try {
      await patchWorker({ isAvailable: next });
      void refreshMe();
    } catch (error) {
      setAvailable(!next);
      void notify('Could not change your status', userMessage(error));
    } finally {
      setSwitching(false);
    }
  };

  const openJob = (id: string) => {
    setActiveJobId(id);
    router.push('/job-progress');
  };

  const refresh = () => {
    void leads.reload();
    void jobs.reload();
    void earnings.reload();
  };

  const firstName = (workerProfile?.fullName ?? '').split(' ')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={leads.refreshing} onRefresh={refresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Open menu">
            <Menu color={Colors.textMain} size={26} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello} numberOfLines={1}>Namaste{firstName ? `, ${firstName}` : ''} 🙏</Text>
            <Text style={styles.helloSub}>Your work dashboard • काम डैशबोर्ड</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.navigate('/(tabs)/activity')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="My jobs">
            <Bell color={Colors.textMain} size={20} />
          </TouchableOpacity>
        </View>

        {/* Verification state comes first: without it no leads arrive */}
        {workerProfile && !verified && (
          <TouchableOpacity style={styles.verifyCard} onPress={() => router.push('/worker-onboarding')} activeOpacity={0.8} accessibilityRole="button">
            <ShieldAlert color="#92400E" size={26} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyTitle}>
                {workerProfile.verificationStatus === 'REJECTED' ? 'Verification needs attention' : 'Verification in progress'}
              </Text>
              <Text style={styles.verifySub}>
                {workerProfile.verificationStatus === 'REJECTED'
                  ? workerProfile.rejectionReason ?? 'Update your profile and Aadhaar photos.'
                  : 'Leads start reaching you once your Aadhaar is verified. / सत्यापन के बाद लीड मिलेंगी'}
              </Text>
            </View>
            <ArrowRight color="#92400E" size={20} />
          </TouchableOpacity>
        )}

        {/* Taking jobs switch */}
        <View style={[styles.dutyCard, available ? styles.dutyOn : styles.dutyOff]}>
          <View style={[styles.dutyDot, { backgroundColor: available ? '#22C55E' : '#94A3B8' }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.dutyTitle, !available && { color: Colors.textMain }]}>
              {available ? 'Available • Taking jobs' : 'Offline • Not taking jobs'}
            </Text>
            <Text style={[styles.dutySub, !available && { color: Colors.textMuted }]}>
              {available ? 'New nearby jobs alert you instantly. / नए काम की सूचना मिलेगी' : 'No new job alerts and customers will not see you. / आप ऑफ़लाइन हैं'}
            </Text>
          </View>
          <Switch
            value={available}
            onValueChange={(v) => void toggleAvailable(v)}
            disabled={switching || !workerProfile}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={available ? Colors.primaryDark : '#F8FAFC'}
            accessibilityLabel="Taking jobs"
          />
        </View>

        {/* Active jobs */}
        {activeJobs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your active jobs • चालू काम</Text>
            {activeJobs.map((job) => (
              <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => openJob(job.id)} activeOpacity={0.8} accessibilityRole="button">
                <View style={styles.jobIcon}>
                  <Wrench color="#FFFFFF" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobStatus}>{JOB_STATUS[job.status]}</Text>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobMeta} numberOfLines={1}>📍 {job.area}, {job.city.replace(/\s*\(.*\)/, '')} • {job.customerName}</Text>
                </View>
                <View style={styles.openPill}>
                  <Text style={styles.openPillText}>Open</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Lead radar preview */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>New job requests • नई लीड</Text>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/leads')} activeOpacity={0.7} hitSlop={10} accessibilityRole="button">
            <Text style={styles.link}>All leads →</Text>
          </TouchableOpacity>
        </View>
        {leads.loading && <LoadingBlock label="Finding jobs near you… / आस-पास काम खोज रहे हैं…" />}
        {leads.error && !leads.data && <ErrorBlock message={leads.error} onRetry={() => void leads.reload()} />}
        {leads.data && openLeads.length === 0 && (
          <View style={styles.emptyCard}>
            <Radar color={Colors.primary} size={32} />
            <Text style={styles.emptyTitle}>No new requests right now</Text>
            <Text style={styles.emptySub}>
              {available ? 'Stay available: new jobs in your trade and area appear here.' : 'You are offline. Switch on to get new job alerts.'}
            </Text>
          </View>
        )}
        {openLeads.slice(0, PREVIEW_LEADS).map((lead) => {
          const u = urgencyOf(lead);
          return (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.leadTop}>
                <View style={[styles.badge, u.urgent ? styles.badgeUrgent : styles.badgeCalm]}>
                  <Clock color={u.urgent ? '#B91C1C' : Colors.tertiaryDark} size={12} />
                  <Text style={[styles.badgeText, { color: u.urgent ? '#B91C1C' : Colors.tertiaryDark }]}>{u.label}</Text>
                </View>
                <Text style={styles.leadAgo}>{timeAgo(lead.postedAt)}</Text>
              </View>
              <Text style={styles.leadCat}>{lead.category.title.en} • {lead.category.title.hi}</Text>
              <Text style={styles.leadTitle} numberOfLines={2}>{lead.title}</Text>
              <View style={styles.leadMetaRow}>
                <MapPin color={Colors.textMuted} size={14} />
                <Text style={styles.leadMeta} numberOfLines={1}>
                  {lead.areaName}, {lead.cityName.replace(/\s*\(.*\)/, '')}
                  {lead.distanceKm !== null ? ` • ${lead.distanceKm} km` : ''}
                  {lead.offersCount > 0 ? ` • ${lead.offersCount} quote${lead.offersCount === 1 ? '' : 's'}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quoteBtn}
                onPress={() => router.push({ pathname: '/lead-offer', params: { id: lead.id } })}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.quoteBtnText}>{lead.myOffer ? 'View / update my quote' : 'Send Quote • कोट भेजें'}</Text>
                <ArrowRight color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Earnings: always 100% the worker's */}
        <View style={styles.earnCard}>
          <BadgeIndianRupee color="#FFFFFF" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={styles.earnLabel}>Today • आज की कमाई</Text>
            <Text style={styles.earnAmount}>
              {earnings.data ? `₹${earnings.data.amount.toLocaleString('en-IN')}` : '—'}
              {earnings.data ? <Text style={styles.earnJobs}>  • {earnings.data.jobsDone} job{earnings.data.jobsDone === 1 ? '' : 's'}</Text> : null}
            </Text>
            <Text style={styles.earnSub}>Customers pay you directly by UPI or cash. 0% platform deduction, ever.</Text>
          </View>
        </View>

        <View style={styles.trustRow}>
          <ShieldCheck color={Colors.primaryDark} size={18} />
          <Text style={styles.trustText}>Direct customer calls • No middleman • सीधा संपर्क</Text>
        </View>
      </ScrollView>
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  hello: { fontSize: 20, fontWeight: '800', color: Colors.textMain },
  helloSub: { fontSize: 13, color: Colors.textMuted, marginTop: 1 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: Spacing.md,
  },
  verifyTitle: { fontSize: 16, fontWeight: '800', color: '#92400E' },
  verifySub: { fontSize: 13, color: '#92400E', marginTop: 2, lineHeight: 18 },
  dutyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: Radius.lg, marginBottom: Spacing.lg, borderWidth: 1.5 },
  dutyOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dutyOff: { backgroundColor: '#FFFFFF', borderColor: Colors.borderDark },
  dutyDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  dutyTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  dutySub: { fontSize: 13, color: '#ECFDF5', marginTop: 3, lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  link: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 10,
  },
  jobIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  jobStatus: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  jobTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, marginTop: 2 },
  jobMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  openPill: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  openPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyCard: {
    alignItems: 'center',
    gap: 6,
    padding: 20,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  leadCard: {
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  leadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  badgeUrgent: { backgroundColor: '#FEE2E2' },
  badgeCalm: { backgroundColor: Colors.tertiaryLight },
  badgeText: { fontSize: 12, fontWeight: '800' },
  leadAgo: { fontSize: 13, color: Colors.textMuted },
  leadCat: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  leadTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, marginTop: 2 },
  leadMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  leadMeta: { flex: 1, fontSize: 13, color: Colors.textMuted },
  quoteBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quoteBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  earnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: '#0F766E',
    marginTop: 8,
  },
  earnLabel: { fontSize: 13, fontWeight: '700', color: '#CCFBF1' },
  earnAmount: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  earnJobs: { fontSize: 14, fontWeight: '700', color: '#CCFBF1' },
  earnSub: { fontSize: 13, color: '#CCFBF1', marginTop: 4, lineHeight: 18 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  trustText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
});
