import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Compass, Play } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { acceptDirect, declineDirect, getCategories, listLeads, listWorkerJobs } from '../../api/endpoints';
import { userMessage } from '../../api/errors';
import { useWorkerTracking } from '../../utils/useWorkerTracking';
import { notify } from '../../utils/dialog';
import { timeAgo, whenLabel } from '../../utils/time';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StateBlocks';
import { LeadCardSkeleton } from '../../components/skeletons/LeadCardSkeleton';
import ServiceCard from '../../components/ServiceCard';
import NotificationBell from '../../components/NotificationBell';
import { pick } from '../../i18n';
import { categoryTitle } from '../../i18n/categories';
import { useLang, useT } from '../../i18n/useT';

const LEADS_POLL_MS = 15000; // new requests show up while the radar is open

export default function LeadsScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const { role, setRole, setSelectedCategory, setActiveJobId } = useStore();
  const leadFilters: { id: 'all' | 'immediate' | 'scheduled'; label: string; empty: string }[] = [
    { id: 'all', label: t('All Leads'), empty: t('No leads right now. New requests appear here by themselves.') },
    { id: 'immediate', label: t('Immediate'), empty: t('No immediate leads right now. New requests appear here by themselves.') },
    { id: 'scheduled', label: t('Scheduled'), empty: t('No scheduled leads right now. New requests appear here by themselves.') },
  ];
  const statusLabel: Partial<Record<string, string>> = { ASSIGNED: t('ON THE WAY'), ARRIVED: t('ARRIVED'), IN_PROGRESS: t('IN PROGRESS'), WORK_COMPLETED: t('BILL READY') };
  const { me } = useSession();
  const isWorker = role === 'worker';
  const [leadFilter, setLeadFilter] = useState<'all' | 'immediate' | 'scheduled'>('all');
  const [directBusy, setDirectBusy] = useState<string | null>(null);

  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const leads = useAsync(() => (isWorker ? listLeads({ filter: leadFilter }) : Promise.resolve(null)), [isWorker, leadFilter], { pollMs: isWorker ? LEADS_POLL_MS : undefined });
  const myJobs = useAsync(() => (isWorker ? listWorkerJobs('ongoing') : Promise.resolve(null)), [isWorker], { pollMs: isWorker ? LEADS_POLL_MS : undefined });
  const visibleLeads = leads.data?.items ?? [];
  const activeJobs = myJobs.data?.items ?? [];
  // Share the device position while a job is on the way, so the customer's tracker can move (utils/workerTracking.ts)
  useWorkerTracking(!isWorker || !myJobs.data ? undefined : (activeJobs.find((j) => j.status === 'ASSIGNED')?.id ?? null));

  const answerDirect = async (jobId: string, accept: boolean) => {
    if (directBusy) return;
    setDirectBusy(jobId);
    try {
      if (accept) {
        await acceptDirect(jobId);
        setActiveJobId(jobId);
        router.push('/job-progress');
      } else {
        await declineDirect(jobId);
      }
      void leads.reload();
      void myJobs.reload();
    } catch (error) {
      notify(accept ? t('Could not accept') : t('Could not decline'), userMessage(error));
      void leads.reload();
    } finally {
      setDirectBusy(null);
    }
  };

  // Tabs are switched with navigate (jump to the existing tab), never pushed
  const openService = useCallback((id: string) => {
    setSelectedCategory(id);
    router.navigate('/(tabs)/post-job');
  }, [router, setSelectedCategory]);

  const openJob = (jobId: string) => {
    setActiveJobId(jobId);
    router.push('/job-progress');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={isWorker ? <RefreshControl refreshing={leads.refreshing} onRefresh={() => { void leads.reload(); void myJobs.reload(); }} /> : undefined}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isWorker ? t('Leads Radar') : t('Browse Services')}
            </Text>
            <Text style={styles.headerSub}>{t('Chandigarh • Mohali • Panchkula')}</Text>
          </View>
          <NotificationBell />
        </View>

        {isWorker ? (
          /* WORKER MODE: Live Customer Leads Radar */
          <View>
            <View style={styles.radarHero}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={styles.radarDot} />
                  <Text style={styles.radarHeroTitle}>{t('Live Customer Job Radar')}</Text>
                </View>
                <View style={styles.zeroDeductBadge}>
                  <Text style={styles.zeroDeductText}>{t('0% DEDUCTION')}</Text>
                </View>
              </View>
              <Text style={styles.radarHeroSub}>
                {t('Repair requests near your base area. Tap to quote directly!')}
              </Text>
            </View>

            {/* Jobs the worker is already on */}
            {activeJobs.length > 0 && (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={[styles.leadTitle, { marginBottom: 6 }]}>{t('Your active jobs')}</Text>
                {activeJobs.map((job) => (
                  <TouchableOpacity key={job.id} style={[styles.leadCard, { marginBottom: 8 }]} onPress={() => openJob(job.id)} accessibilityRole="button">
                    <View style={styles.leadHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.catPill}><Text style={styles.catPillText}>{categoryTitle(job.category.id, job.category.title, lang)}</Text></View>
                        <Text style={styles.leadTitle}>{job.title}</Text>
                        <Text style={styles.leadLoc}>{job.customerName} • {job.area}</Text>
                      </View>
                      <View style={styles.timeTag}><Text style={styles.timeTagText}>{statusLabel[job.status] ?? job.status.replace('_', ' ')}</Text></View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
            >
              {leadFilters.map((filter) => {
                const isActive = filter.id === leadFilter;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLeadFilter(filter.id)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8 }}
                    accessibilityRole="button"
                    aria-selected={isActive}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {leads.loading && <LeadCardSkeleton />}
            {leads.error && !leads.data && <ErrorBlock message={leads.error} onRetry={() => void leads.reload()} />}
            {leads.errorCode === 'WORKER_NOT_VERIFIED' && <EmptyBlock title={t('Profile under review')} hint={t('Leads open up once the team has verified your Aadhaar.')} />}
            {leads.data && visibleLeads.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{leadFilters.find((x) => x.id === leadFilter)?.empty}</Text>
              </View>
            )}

            {/* Leads Cards */}
            {visibleLeads.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catPill}><Text style={styles.catPillText}>{pick(lead.category.title, lang)}{lead.isDirect ? ` • ${t('Direct request')}` : ''}</Text></View>
                    <Text style={styles.leadTitle}>{lead.title}</Text>
                  </View>
                  <View style={styles.timeTag}><Text style={styles.timeTagText}>{timeAgo(lead.postedAt)}</Text></View>
                </View>

                {lead.notes ? <Text style={styles.leadNotes}>"{lead.notes}"</Text> : null}

                {lead.hasVoiceNote && (
                  <View style={styles.audioBox}>
                    <Play color="#0284C7" size={14} />
                    <Text style={styles.audioBoxText}>{t('Customer left a voice note • open the lead to listen')}</Text>
                  </View>
                )}

                <View style={styles.leadFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadLoc}>📍 {lead.areaName}{lead.distanceKm !== null ? ` (${t('{km} km', { km: lead.distanceKm })})` : ''}</Text>
                    <Text style={styles.leadBudget}>
                      {lead.urgency === 'IMMEDIATE' ? t('Immediate') : lead.scheduledFor ? whenLabel(lead.scheduledFor) : lead.urgency === 'AFTERNOON' ? t('Afternoon') : lead.urgency === 'TOMORROW' ? t('Tomorrow') : t('Scheduled')} • {t('Visit from ₹{fee}', { fee: lead.baseVisitFee })}
                    </Text>
                    {lead.myOffer && <Text style={styles.leadBudget}>{t('Your quote: ₹{fee} • {min} min', { fee: lead.myOffer.visitFee, min: lead.myOffer.etaMinutes })}</Text>}
                  </View>
                  {lead.isDirect && lead.leadState === 'NEW' ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity style={[styles.quoteBtn, directBusy !== null && { opacity: 0.6 }]} disabled={directBusy !== null} onPress={() => void answerDirect(lead.id, true)} accessibilityRole="button">
                        <Text style={styles.quoteBtnText}>{directBusy === lead.id ? '…' : t('Accept')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.quoteBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.borderDark }, directBusy !== null && { opacity: 0.6 }]} disabled={directBusy !== null} onPress={() => void answerDirect(lead.id, false)} accessibilityRole="button">
                        <Text style={[styles.quoteBtnText, { color: Colors.textMain }]}>{t('Decline')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.quoteBtn} onPress={() => router.push({ pathname: '/lead-offer', params: { id: lead.id } })} accessibilityRole="button">
                      <Text style={styles.quoteBtnText}>{lead.myOffer ? t('View Quote →') : t('Send Quote →')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* CUSTOMER MODE: Service Category Directory */
          <View>
            <Text style={styles.catIntro}>{t('Tap a service to post your job • 0% commission, pay the worker directly')}</Text>
            {categories.loading && <LoadingBlock label={t('Loading services…')} />}
            {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
            <View style={styles.catGrid}>
              {(categories.data ?? []).map((cat) => (
                <ServiceCard key={cat.id} category={cat} onPress={openService} />
              ))}
            </View>
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
  scrollContent: {
    padding: Spacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  radarHero: {
    backgroundColor: '#065F46',
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: Spacing.md
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success
  },
  radarHeroTitle: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  zeroDeductBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  zeroDeductText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '800'
  },
  radarHeroSub: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2
  },
  chipsScroll: {
    flexGrow: 0,
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.md
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.lg
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: 32,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full
  },
  chipActive: {
    backgroundColor: Colors.textMain,
    borderColor: Colors.textMain
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  chipTextActive: {
    color: '#FFFFFF'
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14,
    marginBottom: Spacing.md
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  catPillText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800'
  },
  leadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain
  },
  timeTag: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  timeTagText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700'
  },
  leadNotes: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 8
  },
  audioBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: Radius.md,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  audioBoxText: {
    flexShrink: 1,
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700'
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#E2E8F0'
  },
  leadLoc: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  leadBudget: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2
  },
  quoteBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md
  },
  quoteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  catIntro: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 12
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12
  }
});
