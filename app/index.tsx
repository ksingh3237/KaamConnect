import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { ShieldCheck, ArrowRight, BadgeIndianRupee, Wallet, Zap, Star } from 'lucide-react-native';
import LanguageToggle, { FULL_LANG_LABELS } from '../components/LanguageToggle';
import Marquee from '../components/Marquee';
import { PREVIEW_SERVICES, SERVICE_PHOTOS, serviceIcon } from '../constants/services';
import { Colors } from '../constants/theme';
import { categoryTitle } from '../i18n/categories';
import { useLang, useT } from '../i18n/useT';

// Two rows of real work photos for the collage; both drift right-to-left at different speeds.
const PHOTO_ROWS: string[][] = [
  ['cleaner', 'electrician', 'plumber', 'ac_repair', 'painter', 'carpenter', 'car_wash'],
  ['vehicle_repair', 'ro_service', 'civil_construction', 'gardening', 'appliance', 'cctv_security', 'catering_food'],
];

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const start = () => router.push('/language');
  const points = [
    { icon: BadgeIndianRupee, title: t('0% commission'), sub: t('All the money goes to the worker'), color: '#047857', bg: '#D1FAE5' },
    { icon: Wallet, title: t('Pay directly by cash / UPI'), sub: t('Direct payment, no middleman'), color: '#1D4ED8', bg: '#DBEAFE' },
    { icon: ShieldCheck, title: t('Aadhaar verified local pros'), sub: t('Chandigarh • Mohali • Panchkula'), color: '#7E22CE', bg: '#F3E8FF' },
  ];

  // Light status-bar icons on the green hero, back to dark for every other screen
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Green hero */}
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText} numberOfLines={1}>{t('Tricity Live')}</Text>
            </View>
            <LanguageToggle variant="soft" labels={FULL_LANG_LABELS} />
          </View>

          <Text style={styles.brand}>KaamConnect</Text>
          <Text style={styles.tagline}>{t('Trusted home services\nin minutes')}</Text>
          <Text style={styles.taglineHi}>{t('0% commission • Pay the worker directly')}</Text>

          <View style={styles.ratingRow}>
            <Star color="#FDE68A" fill="#FDE68A" size={16} />
            <Text style={styles.ratingText}>{t('Chandigarh • Mohali • Panchkula')}</Text>
          </View>
        </View>

        {/* Photo collage (decorative) */}
        <View style={styles.collage} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {PHOTO_ROWS.map((row, r) => (
            <Marquee key={r} speed={r === 0 ? 22 : 16} gap={10} style={{ marginBottom: 10 }}>
              {row.map((id) => (
                <Image key={id} source={SERVICE_PHOTOS[id]} style={[styles.photo, r === 1 && styles.photoTall]} resizeMode="cover" />
              ))}
            </Marquee>
          ))}
        </View>

        {/* Services marquee: moves on its own, swipe to browse */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('20+ services near you')}</Text>
          <Text style={styles.sectionSub}>{t('Swipe')}</Text>
        </View>
        <Marquee speed={28} swipeable gap={10}>
          {PREVIEW_SERVICES.map((s) => {
            const Icon = serviceIcon(s.iconKey);
            const name = categoryTitle(s.id, s.en, lang);
            return (
              <TouchableOpacity key={s.id} style={styles.tile} onPress={start} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={name}>
                <View style={[styles.tileIcon, { backgroundColor: s.bg }]}>
                  <Icon color={s.color} size={24} strokeWidth={2.2} />
                </View>
                <Text style={styles.tileTitle} numberOfLines={2}>{name}</Text>
              </TouchableOpacity>
            );
          })}
        </Marquee>

        {/* Why KaamConnect */}
        <View style={styles.points}>
          {points.map((p, i) => (
            <View key={i} style={styles.point}>
              <View style={[styles.pointIcon, { backgroundColor: p.bg }]}>
                <p.icon color={p.color} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{p.title}</Text>
                <Text style={styles.pointSub}>{p.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky call to action */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={start} activeOpacity={0.85} accessibilityRole="button">
          <Zap color="#FFFFFF" size={20} fill="#FFFFFF" />
          <Text style={styles.primaryBtnText}>{t('Get Started')}</Text>
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.footnote}>{t('Free for customers and workers • No hidden charges')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { backgroundColor: '#F8FAFC', paddingBottom: 20, flexGrow: 1 },
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 18 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#BBF7D0' },
  livePillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  brand: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  tagline: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 6, lineHeight: 30 },
  taglineHi: { color: '#ECFDF5', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  collage: { marginTop: 18 },
  photo: { width: 132, height: 96, borderRadius: 14, marginRight: 10, backgroundColor: '#E2E8F0' },
  photoTall: { width: 112, height: 112 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  sectionSub: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tile: {
    width: 112,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  tileIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  tileTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain, textAlign: 'center' },
  tileHi: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginTop: 1, textAlign: 'center' },
  points: { paddingHorizontal: 16, marginTop: 18, gap: 10 },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  pointIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pointTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain },
  pointSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  footerBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  primaryBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  footnote: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});
