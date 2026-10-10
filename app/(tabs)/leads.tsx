import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Compass, Play, ChevronRight, Zap, Droplet, Wind, Hammer, Paintbrush, Sparkles, Tv, Truck } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { WORKER_ACTIVE_LEADS, SERVICE_CATEGORIES, CustomerLead } from '../../constants/mockData';
import { useStore } from '../../store/useStore';

const LEAD_FILTERS: { id: string; label: string; showCount?: boolean; match: (lead: CustomerLead) => boolean }[] = [
  { id: 'all', label: 'All Leads', showCount: true, match: () => true },
  { id: 'immediate', label: 'Immediate', showCount: true, match: (lead) => lead.urgency.startsWith('Immediate') },
  { id: 'plumbing', label: 'Plumbing', match: (lead) => lead.category === 'Plumbing' },
  { id: 'electrician', label: 'Electrician', match: (lead) => lead.category === 'Electrician' }
];

export default function LeadsScreen() {
  const router = useRouter();
  const { role, toggleRole, setSelectedCategory } = useStore();
  const isWorker = role === 'worker';
  const [leadFilter, setLeadFilter] = useState('all');

  const activeFilter = LEAD_FILTERS.find((f) => f.id === leadFilter) ?? LEAD_FILTERS[0];
  const visibleLeads = WORKER_ACTIVE_LEADS.filter(activeFilter.match);

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {isWorker ? 'Leads Radar • काम रडार' : 'Browse Services • सेवाएं'}
            </Text>
            <Text style={styles.headerSub}>Chandigarh • Mohali • Panchkula</Text>
          </View>
          <TouchableOpacity style={styles.toggleBtn} onPress={toggleRole}>
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
                Real-time repair requests within 5 km of your location. Tap to quote directly!
              </Text>
            </View>

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
                      {filter.showCount ? ` (${WORKER_ACTIVE_LEADS.filter(filter.match).length})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {visibleLeads.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No {activeFilter.label.toLowerCase()} leads right now. New requests appear here live.</Text>
              </View>
            )}

            {/* Leads Cards */}
            {visibleLeads.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catPill}><Text style={styles.catPillText}>{lead.category}</Text></View>
                    <Text style={styles.leadTitle}>{lead.title}</Text>
                  </View>
                  <View style={styles.timeTag}><Text style={styles.timeTagText}>{lead.postedAgo}</Text></View>
                </View>

                <Text style={styles.leadNotes}>"{lead.notes}"</Text>

                {lead.hasAudio && (
                  <TouchableOpacity
                    style={styles.audioBox}
                    onPress={() => Alert.alert('🔊 Voice Note', 'Playing customer audio memo in Hindi: "Under-sink pipe burst..."')}
                  >
                    <Play color="#0284C7" size={14} />
                    <Text style={styles.audioBoxText}>Customer Voice Note (14s) • Tap to listen</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.leadFooter}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadLoc}>📍 {lead.sector} ({lead.distance})</Text>
                    <Text style={styles.leadBudget}>Budget: {lead.budget}</Text>
                  </View>
                  <TouchableOpacity style={styles.quoteBtn} onPress={() => router.push({ pathname: '/lead-offer', params: { id: lead.id } })}>
                    <Text style={styles.quoteBtnText}>Send Quote →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* CUSTOMER MODE: Service Category Directory */
          <View style={styles.catDirectory}>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catDirCard}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  router.push('/(tabs)/post-job');
                }}
              >
                <View style={[styles.catDirIcon, { backgroundColor: cat.bgColor }]}>
                  {renderIcon(cat.iconName, cat.color)}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.catDirTitle}>{cat.title}</Text>
                    <Text style={styles.catDirFee}>From {cat.baseFee}</Text>
                  </View>
                  <Text style={styles.catDirVernacular}>{cat.hindi} • {cat.punjabi}</Text>
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
