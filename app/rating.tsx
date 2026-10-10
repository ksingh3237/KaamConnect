import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, ArrowRight, ShieldCheck, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { VERIFIED_WORKERS } from '../constants/mockData';

export default function RatingReviewScreen() {
  const router = useRouter();
  const worker = VERIFIED_WORKERS[0];

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '⚡ Punctual / समय पर',
    '💵 Fair Price / वाजिब दाम'
  ]);
  const [selectedTip, setSelectedTip] = useState<string>('₹50');

  const tags = [
    '⚡ Punctual / समय पर',
    '💵 Fair Price / वाजिब दाम',
    '🧼 Clean Work / साफ़ काम',
    '🤝 Polite / विनम्र व्यवहार',
    '🛠️ Expert Skill / हुनरमंद'
  ];

  const tipOptions = ['₹20', '₹50', '₹100', 'Custom'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    router.push('/(tabs)/activity');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/job-progress')}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#1E293B" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate & Review / रेटिंग दें</Text>
        </View>
        <View style={styles.jobPill}>
          <Text style={styles.jobPillText}>JOB #88421</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Worker Summary Profile */}
        <View style={styles.workerSummary}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: worker.avatar }} style={styles.workerAvatar} />
            <View style={styles.statusDot} />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <ShieldCheck color={Colors.primary} size={18} />
          </View>
          <Text style={styles.workerTrade}>{worker.trade} • Chandigarh</Text>
          <Text style={styles.jobSummaryText}>
            Completed Plumbing Pipe Fix in Sector 22-B
          </Text>
        </View>

        {/* Interactive 5-Star Selector */}
        <View style={styles.card}>
          <Text style={styles.ratingPrompt}>HOW WAS YOUR SERVICE EXPERIENCE?</Text>
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
              ? 'Excellent Work! (उत्कृष्ट कार्य)'
              : rating === 4
              ? 'Very Good Service (बहुत अच्छा)'
              : rating === 3
              ? 'Average Service (सामान्य)'
              : 'Needs Improvement (सुधार आवश्यक)'}
          </Text>
        </View>

        {/* Quick Appreciation Tags */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What did you like the most?</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => {
              const isActive = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isActive && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                    {tag} {isActive ? '✓' : ''}
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
              Add a Direct Tip for {worker.name}? (कारीगर को टिप)
            </Text>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>100% to Worker</Text>
            </View>
          </View>
          <View style={styles.tipsGrid}>
            {tipOptions.map((tip) => {
              const isSelected = selectedTip === tip;
              return (
                <TouchableOpacity
                  key={tip}
                  style={[styles.tipBtn, isSelected && styles.tipBtnActive]}
                  onPress={() => setSelectedTip(tip)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tipBtnText, isSelected && styles.tipBtnTextActive]}>
                    {tip} {isSelected ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Review Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            Submit Review & Complete • सबमिट करें
          </Text>
          <ArrowRight color="#FFFFFF" size={18} />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  headerLeft: {
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
    fontSize: 10,
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
    fontSize: 11,
    color: Colors.textMuted,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 9,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
