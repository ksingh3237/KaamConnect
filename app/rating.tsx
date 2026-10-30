import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, ArrowRight, ShieldCheck, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useStore } from '../store/useStore';
import { resetTo } from '../utils/navigation';
import { useAsync } from '../api/useAsync';
import { getJob, reviewJob } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import type { ReviewTag } from '../api/types';
import Avatar from '../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { categoryTitle } from '../i18n/categories';
import { useLang, useT } from '../i18n/useT';

const TIP_OPTIONS = [0, 20, 50, 100] as const;

export default function RatingReviewScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const tags: { id: ReviewTag; label: string }[] = [
    { id: 'PUNCTUAL', label: `⚡ ${t('Punctual')}` },
    { id: 'FAIR_PRICE', label: `💵 ${t('Fair Price')}` },
    { id: 'CLEAN_WORK', label: `🧼 ${t('Clean Work')}` },
    { id: 'POLITE', label: `🤝 ${t('Polite')}` },
    { id: 'EXPERT_SKILL', label: `🛠️ ${t('Expert Skill')}` },
  ];
  const { activeJobId } = useStore();
  const jobState = useAsync(() => (activeJobId ? getJob(activeJobId) : Promise.resolve(null)), [activeJobId], { reloadOnFocus: false });
  const job = jobState.data;
  const worker = job?.worker ?? null;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
  const [tip, setTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleTag = (tag: ReviewTag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (saving || !activeJobId) return;
    setFormError(null);
    setSaving(true);
    try {
      await reviewJob(activeJobId, { rating, tags: selectedTags, ...(tip > 0 ? { tipAmount: tip } : {}) });
      resetTo('/(tabs)/activity');
    } catch (error) {
      if (isApiError(error) && error.code === 'ALREADY_REVIEWED') {
        resetTo('/(tabs)/activity');
        return;
      }
      setFormError(userMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/job-progress')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('Rate & Review')}</Text>
        </View>
        <View style={styles.jobPill}>
          <Text style={styles.jobPillText}>{job ? job.reference : t('JOB')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Worker Summary Profile */}
        <View style={styles.workerSummary}>
          <View style={styles.avatarWrap}>
            <Avatar uri={worker?.photoUrl} size={80} style={styles.workerAvatar} />
            <View style={styles.statusDot} />
          </View>
          {!activeJobId && <EmptyBlock title={t('No job selected')} hint={t('Open a completed job from Activity.')} />}
          {activeJobId && jobState.loading && <LoadingBlock />}
          {jobState.error && !jobState.data && <ErrorBlock message={jobState.error} onRetry={() => void jobState.reload()} />}
          {job && worker && (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <ShieldCheck color={Colors.primary} size={18} />
              </View>
              <Text style={styles.workerTrade}>{categoryTitle(worker.tradeId, worker.trade, lang)} • {job.city.name.replace(/\s*\(.*\)/, '')}</Text>
              <Text style={styles.jobSummaryText}>{job.title} • {job.locality ?? job.area.name}</Text>
            </>
          )}
        </View>

        {/* Interactive 5-Star Selector */}
        <View style={styles.card}>
          <Text style={styles.ratingPrompt}>{t('HOW WAS YOUR SERVICE EXPERIENCE?')}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starVal) => (
              <TouchableOpacity
                key={starVal}
                onPress={() => setRating(starVal)}
                activeOpacity={0.7}
              >
                <Star
                  size={36}
                  color={starVal <= rating ? '#F59E0B' : '#CBD5E1'}
                  fill={starVal <= rating ? '#F59E0B' : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingFeedback}>
            {rating === 5
              ? t('Excellent Work!')
              : rating === 4
              ? t('Very Good Service')
              : rating === 3
              ? t('Average Service')
              : t('Needs Improvement')}
          </Text>
        </View>

        {/* Quick Appreciation Tags */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('What did you like the most?')}</Text>
          <View style={styles.tagsContainer}>
            {tags.map(({ id, label }) => {
              const isActive = selectedTags.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.tagChip, isActive && styles.tagChipActive]}
                  onPress={() => toggleTag(id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                    {label} {isActive ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Optional Tip to Worker */}
        <View style={[styles.card, styles.tipCard]}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipTitle}>
              {t('Add a Direct Tip for {name}?', { name: worker?.name ?? t('the worker') })}
            </Text>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>{t('100% to Worker')}</Text>
            </View>
          </View>
          <View style={styles.tipsGrid}>
            {TIP_OPTIONS.map((amount) => {
              const isSelected = !customOpen && tip === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipBtn, isSelected && styles.tipBtnActive]}
                  onPress={() => { setTip(amount); setCustomOpen(false); }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.tipBtnText, isSelected && styles.tipBtnTextActive]}>
                    {amount === 0 ? t('No tip') : `₹${amount}`} {isSelected ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.tipBtn, customOpen && styles.tipBtnActive]}
              onPress={() => { setCustomOpen(true); setTip(parseInt(customTip || '0', 10) || 0); }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: customOpen }}
            >
              <Text style={[styles.tipBtnText, customOpen && styles.tipBtnTextActive]}>{t('Custom')} {customOpen ? '✓' : ''}</Text>
            </TouchableOpacity>
          </View>
          {customOpen && (
            <TextInput
              style={{ marginTop: 8, borderWidth: 1.5, borderColor: Colors.borderDark, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Colors.textMain, backgroundColor: '#FFFFFF' }}
              value={customTip}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '').slice(0, 4);
                setCustomTip(digits);
                setTip(parseInt(digits || '0', 10) || 0);
              }}
              placeholder={t('Amount in ₹')}
              placeholderTextColor={Colors.textSubtle}
              keyboardType="number-pad"
              accessibilityLabel={t('Custom tip amount')}
            />
          )}
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 6 }}>{t('The tip is a note for the worker; you hand it over yourself, like the bill.')}</Text>
        </View>

        {/* Submit Review Button */}
        {formError && <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.error, textAlign: 'center', marginBottom: 8 }} accessibilityRole="alert">{formError}</Text>}
        <TouchableOpacity
          style={[styles.submitBtn, (saving || !job) && { opacity: 0.7 }]}
          onPress={() => void handleSubmit()}
          disabled={saving || !job}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.submitBtnText}>
            {saving ? t('Submitting…') : t('Submit Review & Complete')}
          </Text>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <ArrowRight color="#FFFFFF" size={18} />}
        </TouchableOpacity>
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
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain
  },
  jobPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  jobPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg
  },
  workerSummary: {
    alignItems: 'center',
    marginVertical: Spacing.sm
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.sm
  },
  workerAvatar: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  workerName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain
  },
  workerTrade: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary
  },
  jobSummaryText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4
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
  ratingPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 0.5
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md
  },
  ratingFeedback: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain,
    marginBottom: Spacing.md
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tagChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMain
  },
  tagTextActive: {
    color: '#FFFFFF'
  },
  tipCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    flex: 1
  },
  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: '#FEF3C7'
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E'
  },
  tipsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm
  },
  tipBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tipBtnActive: {
    borderColor: Colors.secondary,
    backgroundColor: '#FEF3C7',
    borderWidth: 2
  },
  tipBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMain
  },
  tipBtnTextActive: {
    color: '#92400E'
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
