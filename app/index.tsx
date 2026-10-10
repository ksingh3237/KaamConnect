import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Zap, Droplet, Wind, Truck, ArrowRight, Check, CheckCircle2, ChevronRight, CheckCircle, Shield } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function SplashScreen() {
  const router = useRouter();
  const { language, setLanguage } = useStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Bar: Status Indicator & Language Pill */}
        <View style={styles.topBar}>
          <View style={styles.livePill}>
            <View style={styles.liveDotWrap}>
              <View style={[styles.liveDot, { position: 'absolute', opacity: 0.3, transform: [{ scale: 1.5 }] }]} />
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.livePillText}>Tricity Live • चंडीगढ़ • मोहाली • पंचकूला</Text>
          </View>

          <View style={styles.langSelector}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
              onPress={() => setLanguage('hi')}
            >
              <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हिंदी</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'pa' && styles.langBtnActive]}
              onPress={() => setLanguage('pa')}
            >
              <Text style={[styles.langText, language === 'pa' && styles.langTextActive]}>ਪੰਜਾਬੀ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brand Hero Section */}
        <View style={styles.brandHero}>
          {/* App Emblem with Verification Badge */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <ShieldCheck color="#FFFFFF" size={44} strokeWidth={2.5} />
            </View>
            <View style={styles.verifiedDot}>
              <View style={styles.verifiedDotInner}>
                <Check color="#FFFFFF" size={14} strokeWidth={3} />
              </View>
            </View>
          </View>

          {/* Main Headline with Dot Accent */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={styles.brandTitle}>KaamConnect</Text>
            <View style={styles.brandDot} />
          </View>

          {/* Regional Subtitle */}
          <Text style={styles.brandSubtitle}>
            Chandigarh • Mohali • Panchkula's Direct Service Marketplace
          </Text>

          {/* Trust Highlight Pill */}
          <View style={styles.trustPill}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00b074' }} />
            <Text style={styles.trustTag}>0% Commission</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>•</Text>
            <Text style={styles.trustSub}>सीधा भुगतान (Zero Middleman)</Text>
          </View>
        </View>

        {/* Tricity Verified Pros Preview Card */}
        <View style={styles.prosCard}>
          <View style={styles.prosHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 16, borderRadius: 4, backgroundColor: '#00b074' }} />
              <Text style={styles.prosTitle}>Tricity Verified Pros</Text>
            </View>
            <View style={styles.p2pBadge}>
              <ShieldCheck color="#059669" size={12} />
              <Text style={styles.p2pText}>100% Direct P2P Settlement</Text>
            </View>
          </View>

          {/* 4 Trade Quick Cards */}
          <View style={styles.categoryRow}>
            {/* 1. Electrician */}
            <View style={styles.miniCatTile}>
              <View style={[styles.catIconWrap, { backgroundColor: '#fffbeb', borderColor: 'rgba(253, 230, 138, 0.7)' }]}>
                <Zap color="#d97706" size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.catName}>Electrician</Text>
              <Text style={styles.catSector}>Sec 22, Chd</Text>
            </View>

            {/* 2. Plumber */}
            <View style={styles.miniCatTile}>
              <View style={[styles.catIconWrap, { backgroundColor: '#f0f9ff', borderColor: 'rgba(186, 230, 253, 0.7)' }]}>
                <Droplet color="#0284c7" size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.catName}>Plumber</Text>
              <Text style={styles.catSector}>Ph 7, Mohali</Text>
            </View>

            {/* 3. AC Repair */}
            <View style={styles.miniCatTile}>
              <View style={[styles.catIconWrap, { backgroundColor: '#f0fdfa', borderColor: 'rgba(153, 246, 228, 0.7)' }]}>
                <Wind color="#0d9488" size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.catName}>AC Repair</Text>
              <Text style={styles.catSector}>Sec 11, PKL</Text>
            </View>

            {/* 4. Car Wash */}
            <View style={styles.miniCatTile}>
              <View style={[styles.catIconWrap, { backgroundColor: '#eef2ff', borderColor: 'rgba(199, 210, 254, 0.7)' }]}>
                <Truck color="#4f46e5" size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.catName}>Car Wash</Text>
              <Text style={styles.catSector}>Sec 35, Chd</Text>
            </View>
          </View>

          {/* Rating & Speed Footer */}
          <View style={styles.prosFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#f59e0b', fontSize: 12 }}>★</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>4.9 / 5</Text>
              <Text style={{ color: '#94a3b8' }}>•</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>14,200+ Reviews</Text>
            </View>
            <View style={styles.speedBadge}>
              <CheckCircle2 color="#059669" size={14} strokeWidth={2.2} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#047857' }}>15 Min Arrival</Text>
            </View>
          </View>
        </View>

        {/* Key Value Propositions */}
        <View style={styles.bulletList}>
          {/* 1. Zero Commission */}
          <View style={styles.bulletCard}>
            <View style={[styles.bulletIcon, { backgroundColor: 'rgba(209, 250, 229, 0.7)' }]}>
              <Zap color="#047857" size={20} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bulletTitleRow}>
                <Text style={styles.bulletTitle}>0% Platform Fee • No Commission</Text>
                <View style={[styles.tagBadge, { backgroundColor: '#059669' }]}>
                  <Text style={[styles.tagText, { color: '#FFFFFF' }]}>FREE</Text>
                </View>
              </View>
              <Text style={styles.bulletDesc}>
                पूरा पैसा कारीगर का — no hidden cut for app or middlemen. Customers get honest, fair pricing.
              </Text>
            </View>
          </View>

          {/* 2. Direct Cash/UPI */}
          <View style={styles.bulletCard}>
            <View style={[styles.bulletIcon, { backgroundColor: 'rgba(219, 234, 254, 0.7)' }]}>
              <View style={{ width: 20, height: 14, borderRadius: 2, borderWidth: 2, borderColor: '#1d4ed8' }} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bulletTitleRow}>
                <Text style={styles.bulletTitle}>Direct Cash / UPI Settlement</Text>
                <View style={[styles.tagBadge, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 }]}>
                  <Text style={[styles.tagText, { color: '#1d4ed8' }]}>DIRECT</Text>
                </View>
              </View>
              <Text style={styles.bulletDesc}>
                Pay worker directly on completion via GPay, PhonePe, Paytm or Cash. Zero holding period.
              </Text>
            </View>
          </View>

          {/* 3. Verified Pros */}
          <View style={styles.bulletCard}>
            <View style={[styles.bulletIcon, { backgroundColor: 'rgba(243, 232, 255, 0.7)' }]}>
              <Shield color="#7e22ce" size={20} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.bulletTitleRow}>
                <Text style={styles.bulletTitle}>Verified Tricity Pros</Text>
                <View style={[styles.tagBadge, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff', borderWidth: 1 }]}>
                  <Text style={[styles.tagText, { color: '#7e22ce' }]}>AADHAAR</Text>
                </View>
              </View>
              <Text style={styles.bulletDesc}>
                चंडीगढ़, मोहाली, पंचकूला local background-checked workers with genuine ratings.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky / Fixed Bottom Action Section */}
      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/language')} activeOpacity={0.9}>
          <ShieldCheck color="#d1fae5" size={20} />
          <Text style={styles.primaryBtnText}>Get Started • शुरू करें</Text>
          <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.footnoteContainer}>
          <ShieldCheck color="#059669" size={16} strokeWidth={2} />
          <Text style={styles.footnote}>
            Empowering 5,000+ Tricity Technicians & Households
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 12 : 24,
    paddingBottom: 16
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(167, 243, 208, 0.8)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  liveDotWrap: {
    position: 'relative',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669'
  },
  livePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
    letterSpacing: -0.2
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  langBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  langTextActive: {
    fontWeight: '700',
    color: '#FFFFFF'
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  logoWrap: {
    position: 'relative',
    marginBottom: 12
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ecfdf5',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    padding: 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2
  },
  verifiedDotInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00b074',
    marginLeft: 4,
    marginBottom: 4
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center'
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  trustTag: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  trustSub: {
    color: '#e2e8f0',
    fontSize: 12
  },
  prosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12
  },
  prosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  prosTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  p2pBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    gap: 4
  },
  p2pText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46'
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12
  },
  miniCatTile: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center'
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center'
  },
  catSector: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center'
  },
  prosFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4
  },
  bulletList: {
    gap: 10,
    marginBottom: 10
  },
  bulletCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bulletTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  bulletTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  bulletDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },
  footerBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.9)',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 5
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#00b074',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  footnoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 2,
    marginTop: 8
  },
  footnote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b'
  }
});
