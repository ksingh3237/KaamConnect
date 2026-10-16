import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { resetTo } from '../utils/navigation';

export default function CarouselScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: '0% Platform Fee • सीधा मुनाफ़ा',
      subtitle:
        "No middlemen cuts, no lead fees. 100% of the customer payment goes straight into the technician's hands.",
      badge: 'Zero Middleman Guarantee',
      color: Colors.primary,
      icon: '💵'
    },
    {
      title: 'Aadhaar Verified Local Pros',
      subtitle:
        'Background-checked electricians, plumbers, and carpenters from your local sector in Chandigarh, Mohali, and Panchkula.',
      badge: 'Civic Trust & Safety',
      color: Colors.tertiary,
      icon: '🛡️'
    },
    {
      title: 'Direct Phone & Instant UPI',
      subtitle:
        'Speak directly with mistris before arrival and settle bills via Cash, Google Pay, or PhonePe without app withholding.',
      badge: 'Frictionless Experience',
      color: Colors.secondary,
      icon: '⚡'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      resetTo('/(tabs)/home');
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topPill}>
          <Sparkles color={Colors.primary} size={14} />
          <Text style={styles.topPillText}>KaamConnect Charter</Text>
        </View>
        <TouchableOpacity
          onPress={() => resetTo('/(tabs)/home')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip to App →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        {/* Highlight Card */}
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: slide.color }]}>
            <Text style={styles.iconEmoji}>{slide.icon}</Text>
          </View>

          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{slide.badge}</Text>
          </View>

          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        </View>

        {/* Indicator Bars */}
        <View style={styles.indicators}>
          {slides.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentSlide(idx)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${idx + 1}`}
              style={[
                styles.indicatorBar,
                idx === currentSlide ? styles.indicatorActive : styles.indicatorInactive
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {isLastSlide
              ? 'Get Started in Tricity • शुरू करें'
              : 'Next Benefit →'}
          </Text>
          {isLastSlide && <ArrowRight color="#FFFFFF" size={18} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    padding: Spacing.lg
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer
  },
  topPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted
  },
  main: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: Spacing.xxl
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  iconEmoji: {
    fontSize: 44
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    marginBottom: Spacing.md
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.sm
  },
  slideSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  indicatorBar: {
    height: 8,
    borderRadius: 4
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.primary
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: Colors.borderDark
  },
  bottomBar: {
    paddingTop: Spacing.md
  },
  actionBtn: {
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
  actionBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
