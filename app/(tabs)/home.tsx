import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Linking, Alert, Modal, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Bell, Volume2, Search, Mic, Zap, Droplet, Wind, Hammer, Paintbrush, Sparkles, Tv, Truck, Phone, Star, Menu, X, HelpCircle, User as UserIcon, Globe, Settings } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { createDirectBooking, getCategories, listWorkers } from '../../api/endpoints';
import { userMessage } from '../../api/errors';
import type { WorkerCard } from '../../api/types';
import Avatar from '../../components/Avatar';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StateBlocks';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedSector, selectedAreaId, setSelectedCategory, setActiveJobId } = useStore();
  const { customerProfile } = useSession();
  const primaryAddress = customerProfile?.addresses.find((a) => a.isPrimary) ?? customerProfile?.addresses[0] ?? null;
  const areaId = selectedAreaId ?? primaryAddress?.area.id ?? undefined;
  const sectorLabel = selectedSector || (primaryAddress ? `${primaryAddress.area.name}, ${primaryAddress.city.name.replace(/\s*\(.*\)/, '')}` : 'Choose your sector');
  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const workers = useAsync(() => listWorkers({ areaId, sort: 'distance', limit: 10 }), [areaId]);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setIsDrawerOpen(false));
  };

  const handleCategoryPress = (catId: string) => {
    setSelectedCategory(catId);
    router.push('/(tabs)/post-job');
  };

  const handleCall = (phone: string, name: string) => {
    Alert.alert('Direct Phone Call', `Call ${name} directly at ${phone}? (0% commission direct dial)`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', onPress: () => Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`) }
    ]);
  };

  // "Book Pro" asks this one worker, who has to accept. The customer then follows the request on the tracking screen.
  const handleBook = async (worker: WorkerCard) => {
    if (bookingId) return;
    if (!primaryAddress) {
      Alert.alert('Add your address', 'Choose your sector and address first. / पहले अपना पता जोड़ें');
      router.push('/customer-onboarding');
      return;
    }
    setBookingId(worker.id);
    try {
      const job = await createDirectBooking({
        workerId: worker.id,
        categoryId: worker.tradeId,
        title: `${worker.trade} visit`,
        timing: 'IMMEDIATE',
        addressId: primaryAddress.id,
      });
      setActiveJobId(job.id);
      router.push('/tracking');
    } catch (error) {
      Alert.alert('Could not book', userMessage(error));
    } finally {
      setBookingId(null);
    }
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuBtn} activeOpacity={0.7} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open menu">
              <Menu color={Colors.textMain} size={26} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>KC</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.brandTitle}>
                Kaam<Text style={{ color: Colors.primary }}>Connect</Text>
              </Text>
              <TouchableOpacity style={styles.locSelector} onPress={() => router.push('/customer-onboarding')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change location">
                <MapPin color={Colors.tertiary} size={11} />
                <Text style={styles.locText} numberOfLines={1}>{sectorLabel} ▾</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => Alert.alert('🔊 Audio Assistance', 'Welcome to KaamConnect Tricity.')} accessibilityRole="button" accessibilityLabel="Audio assistance">
              <Volume2 color={Colors.textMain} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/(tabs)/activity')} accessibilityRole="button" accessibilityLabel="Notifications">
              <Bell color={Colors.textMain} size={18} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency SOS Banner */}
        <View style={styles.sosBanner}>
          <View style={styles.sosIcon}><Text style={{ fontSize: 18 }}>⚡</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sosTitle}>Need Urgent Mistri?</Text>
              <View style={styles.sosBadge}><Text style={styles.sosBadgeText}>15 MIN ETA</Text></View>
            </View>
            <Text style={styles.sosSub}>Emergency breakdown? Direct technician dispatch in Sector 22/35/Mohali.</Text>
          </View>
        </View>

        {/* Universal Search Input */}
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search electrician, plumber, AC repair in Tricity..."
            placeholderTextColor={Colors.textSubtle}
          />
          <TouchableOpacity style={styles.micBtn} onPress={() => router.push('/(tabs)/post-job')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Post a job by voice">
            <Mic color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>

        {/* 0% Platform Fee Banner */}
        <View style={styles.zeroFeeCard}>
          <Text style={{ fontSize: 22 }}>💵</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.zeroFeeTitle}>0% Platform Fee Guarantee</Text>
            <Text style={styles.zeroFeeSub}>You pay 100% directly to the technician via UPI/Cash. Zero middleman surcharge.</Text>
          </View>
        </View>

        {/* Popular Categories Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services in Chandigarh Tricity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/leads')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.catGrid}>
          {categories.loading && <LoadingBlock label="Loading services… / सेवाएँ लोड हो रही हैं…" />}
          {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
          {(categories.data ?? []).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catTile}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.catIconWrap, { backgroundColor: cat.bgColor }]}>
                {renderIcon(cat.iconKey, cat.color)}
              </View>
              <Text style={styles.catTitle}>{cat.title.en}</Text>
              <Text style={styles.catFee}>₹{cat.baseVisitFee} visit</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post a Job Quick Prompt */}
        <View style={styles.postJobCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.postJobTitle}>Got a specific repair job?</Text>
            <Text style={styles.postJobSub}>Post details & receive instant quotes from nearby mistris!</Text>
          </View>
          <TouchableOpacity style={styles.postJobBtn} onPress={() => router.push('/(tabs)/post-job')}>
            <Text style={styles.postJobBtnText}>+ Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* Verified Artisans List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verified Artisans Near You (0% App Cut)</Text>
          {workers.data && <View style={styles.onlinePill}><Text style={styles.onlinePillText}>• {workers.data.items.length} verified</Text></View>}
        </View>

        <View style={styles.workerList}>
          {workers.loading && <LoadingBlock label="Finding artisans… / कारीगर खोज रहे हैं…" />}
          {workers.error && !workers.data && <ErrorBlock message={workers.error} onRetry={() => void workers.reload()} />}
          {workers.data && workers.data.items.length === 0 && (
            <EmptyBlock title="No verified artisans in this area yet" hint="Post a job and nearby artisans will send quotes. / काम पोस्ट करें, कारीगर कोट भेजेंगे" />
          )}
          {(workers.data?.items ?? []).map((w) => (
            <View key={w.id} style={styles.workerCard}>
              <View style={styles.workerTop}>
                <View style={styles.avatarWrap}>
                  <Avatar uri={w.photoUrl} size={52} />
                  <View style={styles.onlineDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    <Text style={{ fontSize: 12 }}>🛡️</Text>
                  </View>
                  <Text style={styles.workerTrade}>{w.trade}</Text>
                  <View style={styles.workerMeta}>
                    <View style={styles.ratingBadge}>
                      <Star color="#F59E0B" fill="#F59E0B" size={11} />
                      <Text style={styles.ratingText}>{w.rating ?? 'New'} ({w.reviewsCount})</Text>
                    </View>
                    <Text style={styles.metaDim}>📍 {w.distanceKm !== null ? `${w.distanceKm} km` : w.areaName}</Text>
                    {w.etaMinutes !== null && <Text style={styles.metaDim}>⏱️ {w.etaMinutes}m ETA</Text>}
                  </View>
                </View>
              </View>

              <View style={styles.skillsRow}>
                {w.skills.slice(0, 3).map((s) => (
                  <View key={s} style={styles.skillTag}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.workerBottom}>
                <View>
                  <Text style={styles.feeLabel}>Visiting Charge</Text>
                  <Text style={styles.feeAmount}>
                    ₹{w.visitingFee} <Text style={{ color: Colors.primary, fontSize: 10 }}> (₹0 App Cut)</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(w.phone, w.name)}>
                    <Phone color="#FFFFFF" size={14} />
                    <Text style={styles.callBtnText}>Call Directly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bookBtn, bookingId !== null && { opacity: 0.6 }]} onPress={() => void handleBook(w)} disabled={bookingId !== null} accessibilityRole="button">
                    <Text style={styles.bookBtnText}>{bookingId === w.id ? 'Booking…' : 'Book Pro'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Drawer Overlay & Content */}
      <Modal visible={isDrawerOpen} transparent={true} animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.drawerBackground} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}>
            <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
              <View>
                <Text style={styles.drawerTitle}>Menu</Text>
                <Text style={styles.drawerSub}>KaamConnect Tricity</Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={{ padding: 8 }} accessibilityRole="button" accessibilityLabel="Close menu">
                <X color={Colors.textMain} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerScroll}>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); router.push('/(tabs)/profile'); }}>
                <UserIcon color={Colors.primary} size={26} />
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Profile</Text>
                  <Text style={styles.drawerItemSub}>प्रोफ़ाइल / ਪ੍ਰੋਫਾਈਲ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert('Help', 'Support Contact: 1800-123-4567'); }}>
                <HelpCircle color={Colors.primary} size={26} />
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Help & Support</Text>
                  <Text style={styles.drawerItemSub}>सहायता / ਮਦਦ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); router.push({ pathname: '/language', params: { from: 'app' } }); }}>
                <Globe color={Colors.primary} size={26} />
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Language</Text>
                  <Text style={styles.drawerItemSub}>भाषा / ਭਾਸ਼ਾ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert('Settings', 'Settings screen coming soon.'); }}>
                <Settings color={Colors.primary} size={26} />
                <View style={styles.drawerItemTextWrap}>
                  <Text style={styles.drawerItemTitle}>Settings</Text>
                  <Text style={styles.drawerItemSub}>सेटिंग्स / ਸੈਟਿੰਗਜ਼</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
    marginBottom: Spacing.md
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4
  },
  menuBtn: {
    padding: 4
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain
  },
  locSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 2
  },
  locText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiaryDark
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary
  },
  sosBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md
  },
  sosIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sosTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E'
  },
  sosBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  sosBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E'
  },
  sosSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 2
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: Colors.textMain
  },
  micBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  zeroFeeCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg
  },
  zeroFeeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  zeroFeeSub: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.9,
    marginTop: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary
  },
  catGrid: {
    // 4 x 23% tiles; the leftover 8% becomes the gutters, so the row fits at any width
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: Spacing.lg
  },
  catTile: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 8,
    alignItems: 'center'
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  catTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center'
  },
  catFee: {
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 2
  },
  postJobCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing.lg
  },
  postJobTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  postJobSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2
  },
  postJobBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md
  },
  postJobBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  onlinePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full
  },
  onlinePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success
  },
  workerList: {
    gap: 12
  },
  workerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: 14
  },
  workerTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  avatarWrap: {
    width: 52,
    height: 52
  },
  workerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  workerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  workerTrade: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginTop: 1
  },
  workerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 4,
    marginTop: 4
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309'
  },
  metaDim: {
    fontSize: 10,
    color: Colors.textMuted
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10
  },
  skillTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  skillText: {
    fontSize: 9,
    color: Colors.textMuted
  },
  workerBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#E2E8F0'
  },
  feeLabel: {
    fontSize: 9,
    color: Colors.textMuted
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain
  },
  callBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  bookBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark
  },
  bookBtnText: {
    color: Colors.textMain,
    fontSize: 11,
    fontWeight: '700'
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContent: {
    width: '75%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textMain,
  },
  drawerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  drawerScroll: {
    padding: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  drawerItemTextWrap: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMain,
  },
  drawerItemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  }
});
