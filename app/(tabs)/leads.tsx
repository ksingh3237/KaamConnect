import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Compass, Play, ChevronRight, Zap, Droplet, Wind, Hammer, Paintbrush, Sparkles, Tv, Truck } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { acceptDirect, declineDirect, getCategories, listLeads, listWorkerJobs, putWorkerLocation } from '../../api/endpoints';
import { userMessage } from '../../api/errors';
import { currentPosition } from '../../utils/position';
import { notify } from '../../utils/dialog';
import { timeAgo, whenLabel } from '../../utils/time';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StateBlocks';

const LEAD_FILTERS: { id: 'all' | 'immediate' | 'scheduled'; label: string }[] = [
  { id: 'all', label: 'All Leads' },
  { id: 'immediate', label: 'Immediate' },
  { id: 'scheduled', label: 'Scheduled' },
];
const LEADS_POLL_MS = 15000; // new requests show up while the radar is open
const PING_MS = 20000; // while a job is on the way, the customer sees the worker move

export default function LeadsScreen() {
  const router = useRouter();
  const { role, setRole, setSelectedCategory, setActiveJobId } = useStore();
  const { me } = useSession();
  const isWorker = role === 'worker';
  const [leadFilter, setLeadFilter] = useState<'all' | 'immediate' | 'scheduled'>('all');
  const [directBusy, setDirectBusy] = useState<string | null>(null);

  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const leads = useAsync(() => (isWorker ? listLeads({ filter: leadFilter }) : Promise.resolve(null)), [isWorker, leadFilter], { pollMs: isWorker ? LEADS_POLL_MS : undefined });
  const myJobs = useAsync(() => (isWorker ? listWorkerJobs('ongoing') : Promise.resolve(null)), [isWorker], { pollMs: isWorker ? LEADS_POLL_MS : undefined });
  const visibleLeads = leads.data?.items ?? [];
  const activeJobs = myJobs.data?.items ?? [];
  const onTheWay = activeJobs.some((j) => j.status === 'ASSIGNED');

  // Best effort: share the device position while a job is on the way, so the customer's tracker can move
  useEffect(() => {
    if (!isWorker || !onTheWay) return undefined;
    let stopped = false;
    const ping = () => {
      currentPosition(5000)
        .then((p) => (stopped ? undefined : putWorkerLocation(p.lat, p.lng)))
        .catch(() => undefined);
    };
    ping();
    const timer = setInterval(ping, PING_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isWorker, onTheWay]);

  const switchRole = () => {
    const next = isWorker ? 'customer' : 'worker';
    const hasProfile = next === 'worker' ? me?.worker : me?.customer;
    setRole(next);
    if (!hasProfile) router.push(next === 'worker' ? '/worker-onboarding' : '/customer-onboarding');
  };

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
      notify(accept ? 'Could not accept' : 'Could not decline', userMessage(error));
      void leads.reload();
    } finally {
      setDirectBusy(null);
    }
  };

  const openJob = (jobId: string) => {
    setActiveJobId(jobId);
    router.push('/job-progress');
  };

  const renderIcon = (name: string, color: string) => {
    switch (name) {
      case 'Zap': return <Zap color={color} size={22} />;
      case 'Droplet': return <Droplet color={color} size={22} />;
      case 'Wind': return <Wind color={color} size={22} />;
      case 'Hammer': return <Hammer color={color} size={22} />;
      case 'Paintbrush': return <Paintbrush color={color} size={22} />;
      case 'Sparkles': return <Sparkles color={color} size={22} />;
      case 'Tv': return <Tv color={color} size={22} />;
      case 'Truck': return <Truck color={color} size={22} />;
      default: return <Zap color={color} size={22} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={isWorker ? <RefreshControl refreshing={leads.refreshing} onRefresh={() => { void leads.reload(); void myJobs.reload(); }} /> : undefined}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isWorker ? 'Leads Radar • काम रडार' : 'Browse Services • सेवाएं'}
            </Text>
            <Text style={styles.headerSub}>Chandigarh • Mohali • Panchkula</Text>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={switchRole} accessibilityRole="button">
            <RefreshCw color={Colors.textMain} size={14} />
            <Text style={styles.toggleBtnText}>{isWorker ? 'Switch Customer' : 'Switch Worker'}</Text>
          </TouchableOpacity>
        </View>

        {isWorker ? (
          /* WORKER MODE: Live Customer Leads Radar */
          <View>
            <View style={styles.radarHero}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={styles.radarDot} />
                  <Text style={styles.radarHeroTitle}>Live Customer Job Radar</Text>
                </View>
                <View style={styles.zeroDeductBadge}>
                  <Text style={styles.zeroDeductText}>0% DEDUCTION</Text>
                </View>
              </View>
              <Text style={styles.radarHeroSub}>
                Repair requests near your base area. Tap to quote directly!
              </Text>
            </View>

            {/* Jobs the worker is already on */}
            {activeJobs.length > 0 && (
              <View style={{ marginBottom: Spacing.md }}>
                <Text style={[styles.leadTitle, { marginBottom: 6 }]}>Your active jobs</Text>
                {activeJobs.map((job) => (
                  <TouchableOpacity key={job.id} style={[styles.leadCard, { marginBottom: 8 }]} onPress={() => openJob(job.id)} accessibilityRole="button">
                    <View style={styles.leadHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.catPill}><Text style={styles.catPillText}>{job.category.title}</Text></View>
                        <Text style={styles.leadTitle}>{job.title}</Text>
                        <Text style={styles.leadLoc}>{job.customerName} • {job.area}</Text>
                      </View>
                      <View style={styles.timeTag}><Text style={styles.timeTagText}>{job.status.replace('_', ' ')}</Text></View>
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
              {LEAD_FILTERS.map((filter) => {
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

            {leads.loading && <LoadingBlock label="Looking for requests… / अनुरोध खोज रहे हैं…" />}
            {leads.error && !leads.data && <ErrorBlock message={leads.error} onRetry={() => void leads.reload()} />}
            {leads.errorCode === 'WORKER_NOT_VERIFIED' && <EmptyBlock title="Profile under review" hint="Leads open up once the team has verified your Aadhaar. / सत्यापन के बाद लीड दिखेंगे" />}
            {leads.data && visibleLeads.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No {LEAD_FILTERS.find((x) => x.id === leadFilter)?.label.toLowerCase()} right now. New requests appear here by themselves.</Text>
              </View>
            )}

            {/* Leads Cards */}
            {visibleLeads.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catPill}><Text style={styles.catPillText}>{lead.category.title.en}{lead.isDirect ? ' • Direct request' : ''}</Text></View>
                    <Text style={styles.leadTitle}>{lead.title}</Text>
                  </View>
                  <View style={styles.timeTag}><Text style={styles.timeTagText}>{timeAgo(lead.postedAt)}</Text></View>
                </View>

                {lead.notes ? <Text style={styles.leadNotes}>"{lead.notes}"</Text> : null}

                {lead.hasVoiceNote && (
                  <View style={styles.audioBox}>
                    <Play color="#0284C7" size={14} />
                    <Text style={styles.audioBoxText}>Customer left a voice note • open the lead to listen</Text>
                  </View>
                )}

                <View style={styles.leadFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadLoc}>📍 {lead.areaName}{lead.distanceKm !== null ? ` (${lead.distanceKm} km)` : ''}</Text>
                    <Text style={styles.leadBudget}>
                      {lead.urgency === 'IMMEDIATE' ? 'Immediate' : lead.scheduledFor ? whenLabel(lead.scheduledFor) : lead.urgency.toLowerCase()} • Visit from ₹{lead.baseVisitFee}
                    </Text>
                    {lead.myOffer && <Text style={styles.leadBudget}>Your quote: ₹{lead.myOffer.visitFee} • {lead.myOffer.etaMinutes} min</Text>}
                  </View>
                  {lead.isDirect && lead.leadState === 'NEW' ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity style={[styles.quoteBtn, directBusy !== null && { opacity: 0.6 }]} disabled={directBusy !== null} onPress={() => void answerDirect(lead.id, true)} accessibilityRole="button">
                        <Text style={styles.quoteBtnText}>{directBusy === lead.id ? '…' : 'Accept'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.quoteBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.borderDark }, directBusy !== null && { opacity: 0.6 }]} disabled={directBusy !== null} onPress={() => void answerDirect(lead.id, false)} accessibilityRole="button">
                        <Text style={[styles.quoteBtnText, { color: Colors.textMain }]}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.quoteBtn} onPress={() => router.push({ pathname: '/lead-offer', params: { id: lead.id } })} accessibilityRole="button">
                      <Text style={styles.quoteBtnText}>{lead.myOffer ? 'View Quote →' : 'Send Quote →'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* CUSTOMER MODE: Service Category Directory */
          <View style={styles.catDirectory}>
            {categories.loading && <LoadingBlock label="Loading services… / सेवाएँ लोड हो रही हैं…" />}
            {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
            {(categories.data ?? []).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catDirCard}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  router.push('/(tabs)/post-job');
                }}
              >
                <View style={[styles.catDirIcon, { backgroundColor: cat.bgColor }]}>
                  {renderIcon(cat.iconKey, cat.color)}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.catDirTitle}>{cat.title.en}</Text>
                    <Text style={styles.catDirFee}>From ₹{cat.baseVisitFee}</Text>
                  </View>
                  <Text style={styles.catDirVernacular}>{cat.title.hi} • {cat.title.pa}</Text>
                  <Text style={styles.catDirExamples}>{cat.examples}</Text>
                </View>
                <ChevronRight color={Colors.textSubtle} size={18} />
              </TouchableOpacity>
            ))}
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
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 9,
    fontWeight: '800'
  },
  radarHeroSub: {
    color: '#FFFFFF',
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 9,
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
    fontSize: 9,
    fontWeight: '700'
  },
  leadNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
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
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMain
  },
  leadBudget: {
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: '800'
  },
  catDirectory: {
    gap: 10
  },
  catDirCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  catDirIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  catDirTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain
  },
  catDirFee: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary
  },
  catDirVernacular: {
    fontSize: 10,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginTop: 1
  },
  catDirExamples: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2
  }
});
