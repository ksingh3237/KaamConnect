import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin, Bell, Volume2, Search, Mic, Menu, X,
  ShieldCheck, Zap, Wallet, ClipboardList, PhoneCall, BadgeIndianRupee, ArrowRight,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, noFocusRing } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { getCategories } from '../../api/endpoints';
import ServiceCard from '../../components/ServiceCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StateBlocks';
import { notify } from '../../utils/dialog';
import AppMenu from '../../components/AppMenu';
import WorkerHome from '../../components/WorkerHome';

/** How many services Home shows before "View all" (searching shows every match). */
const HOME_SERVICES = 6;

const STEPS = [
  { icon: ClipboardList, title: 'Select a service or post your job', hi: 'सेवा चुनें या काम पोस्ट करें' },
  { icon: PhoneCall, title: 'Get direct calls & quotes from nearby mistris', hi: 'आस-पास के मिस्त्री से सीधे कोट पाएं' },
  { icon: Wallet, title: 'Pay the worker directly by cash or UPI (0% commission)', hi: 'सीधे कैश/UPI से भुगतान करें' },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Aadhaar verified workers', hi: 'आधार सत्यापित कारीगर', color: '#7C3AED', bg: '#F3E8FF' },
  { icon: Zap, title: '15 min arrival in Chandigarh, Mohali & Panchkula', hi: 'ट्राईसिटी में 15 मिनट में पहुंच', color: '#D97706', bg: '#FEF3C7' },
  { icon: BadgeIndianRupee, title: '100% direct P2P payment', hi: 'पूरा पैसा सीधे कारीगर को', color: '#047857', bg: '#D1FAE5' },
];

/** Home is the customer marketplace or the worker's dashboard, by the role in use. */
export default function HomeScreen() {
  const role = useStore((s) => s.role);
  return role === 'worker' ? <WorkerHome /> : <CustomerHome />;
}

function CustomerHome() {
  const router = useRouter();
  const { selectedSector, setSelectedCategory } = useStore();
  const { customerProfile } = useSession();
  const primaryAddress = customerProfile?.addresses.find((a) => a.isPrimary) ?? customerProfile?.addresses[0] ?? null;
  const sectorLabel = selectedSector || (primaryAddress ? `${primaryAddress.locality ?? primaryAddress.area.name}, ${primaryAddress.city.name.replace(/\s*\(.*\)/, '')}` : 'Choose your sector');
  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const [query, setQuery] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);

  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const all = categories.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, HOME_SERVICES);
    return all.filter((c) => [c.title.en, c.title.hi, c.title.pa, c.examples].some((t) => t.toLowerCase().includes(q)));
  }, [categories.data, query]);

  // Tabs are switched with navigate (jump to the existing tab), never pushed, so Back never has duplicates to unwind
  const handleCategoryPress = useCallback((catId: string) => {
    setSelectedCategory(catId);
    router.navigate('/(tabs)/post-job');
  }, [router, setSelectedCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Open menu">
              <Menu color={Colors.textMain} size={26} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.brandTitle}>
                Kaam<Text style={{ color: Colors.primary }}>Connect</Text>
              </Text>
              <TouchableOpacity style={styles.locSelector} onPress={() => router.push('/customer-onboarding')} activeOpacity={0.7} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change location">
                <MapPin color={Colors.tertiaryDark} size={14} />
                <Text style={styles.locText} numberOfLines={1}>{sectorLabel} ▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => void notify('Audio help / आवाज़ सहायता', 'Spoken instructions are coming soon. / बोलकर निर्देश जल्द आ रहे हैं।')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Audio assistance">
              <Volume2 color={Colors.textMain} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.navigate('/(tabs)/activity')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Notifications">
              <Bell color={Colors.textMain} size={20} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search: filters the services below as you type */}
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={20} />
          <TextInput
            style={[styles.searchInput, noFocusRing]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search electrician, plumber, AC, RO…"
            placeholderTextColor={Colors.textSubtle}
            returnKeyType="search"
            accessibilityLabel="Search services"
          />
          {searching ? (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear search">
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} onPress={() => router.navigate('/(tabs)/post-job')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Post a job">
              <Mic color="#FFFFFF" size={18} />
            </TouchableOpacity>
          )}
        </View>

        {!searching && (
          <>
            {/* Emergency banner */}
            <TouchableOpacity style={styles.sosBanner} onPress={() => router.navigate('/(tabs)/post-job')} activeOpacity={0.8} accessibilityRole="button">
              <View style={styles.sosIcon}><Text style={{ fontSize: 20 }}>⚡</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sosTitle}>Need an urgent mistri?</Text>
                  <View style={styles.sosBadge}><Text style={styles.sosBadgeText}>15 MIN ETA</Text></View>
                </View>
                <Text style={styles.sosSub}>Post an immediate job and nearby pros respond fast.</Text>
              </View>
            </TouchableOpacity>

            {/* 0% Platform Fee Banner */}
            <View style={styles.zeroFeeCard}>
              <Text style={{ fontSize: 26 }}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.zeroFeeTitle}>0% Platform Fee Guarantee</Text>
                <Text style={styles.zeroFeeSub}>Pay 100% directly to the technician by UPI or cash. No middleman.</Text>
              </View>
            </View>
          </>
        )}

        {/* Services grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{searching ? `Results for “${query.trim()}”` : 'Popular Services in Tricity'}</Text>
          {!searching && (
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/leads')} activeOpacity={0.7} hitSlop={10} accessibilityRole="button">
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          )}
        </View>

        {categories.loading && <LoadingBlock label="Loading services… / सेवाएँ लोड हो रही हैं…" />}
        {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
        {searching && categories.data && shown.length === 0 && (
          <EmptyBlock title="No matching service" hint="Try another word, or post your job and nearby pros will quote. / काम पोस्ट करें" />
        )}
        <View style={styles.grid}>
          {shown.map((cat) => (
            <ServiceCard key={cat.id} category={cat} onPress={handleCategoryPress} />
          ))}
        </View>

        {!searching && categories.data && categories.data.length > HOME_SERVICES && (
          <TouchableOpacity style={styles.allServicesBtn} onPress={() => router.navigate('/(tabs)/leads')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.allServicesText}>Explore all {categories.data.length}+ Services / सभी सेवाएं</Text>
            <ArrowRight color={Colors.primaryDark} size={18} />
          </TouchableOpacity>
        )}

        {!searching && (
          <>
            {/* Post a Job Quick Prompt */}
            <View style={styles.postJobCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.postJobTitle}>Got a specific repair job?</Text>
                <Text style={styles.postJobSub}>Post details and get quotes from nearby mistris.</Text>
              </View>
              <TouchableOpacity style={styles.postJobBtn} onPress={() => router.navigate('/(tabs)/post-job')} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.postJobBtnText}>+ Post Job</Text>
              </TouchableOpacity>
            </View>

            {/* How it works */}
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>How KaamConnect Works • 3 आसान कदम</Text>
            <View style={styles.stepsCard}>
              {STEPS.map((step, i) => (
                <View key={step.title} style={[styles.stepRow, i < STEPS.length - 1 && styles.stepDivider]}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepHi}>{step.hi}</Text>
                  </View>
                  <step.icon color={Colors.primary} size={24} />
                </View>
              ))}
            </View>

            {/* Trust badges */}
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Tricity Direct Trust • भरोसा</Text>
            <View style={styles.trustList}>
              {TRUST.map((t) => (
                <View key={t.title} style={styles.trustCard}>
                  <View style={[styles.trustIcon, { backgroundColor: t.bg }]}>
                    <t.icon color={t.color} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trustTitle}>{t.title}</Text>
                    <Text style={styles.trustHi}>{t.hi}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 32 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 4 },
  menuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  brandTitle: { fontSize: 20, fontWeight: '800', color: Colors.textMain },
  locSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 3,
  },
  locText: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: Colors.tertiaryDark },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.secondary },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingLeft: 14,
    paddingRight: 6,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, color: Colors.textMain, height: '100%' },
  micBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  sosBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  sosIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  sosTitle: { flexShrink: 1, fontSize: 16, fontWeight: '800', color: '#92400E' },
  sosBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sosBadgeText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  sosSub: { fontSize: 13, color: '#92400E', marginTop: 3, lineHeight: 18 },
  zeroFeeCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  zeroFeeTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  zeroFeeSub: { color: '#FFFFFF', fontSize: 13, marginTop: 3, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textMain },
  viewAllText: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  allServicesBtn: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  allServicesText: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  postJobCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  postJobTitle: { fontSize: 16, fontWeight: '800', color: '#065F46' },
  postJobSub: { fontSize: 13, color: '#047857', marginTop: 3, lineHeight: 18 },
  postJobBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center', borderRadius: Radius.md },
  postJobBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    marginBottom: Spacing.xl,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceVariant },
  stepNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain, lineHeight: 20 },
  stepHi: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  trustList: { gap: 10 },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
  },
  trustIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 15, fontWeight: '700', color: Colors.textMain, lineHeight: 20 },
  trustHi: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
