import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Verified, Camera, CameraIcon, BadgeInfo, UserCircle, MapPin, Building, Mic, PhoneCall, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import LanguageToggle, { FULL_LANG_LABELS } from '../components/LanguageToggle';
import ModeSwitchCard from '../components/ModeSwitchCard';
import { useStore } from '../store/useStore';
import { resetTo } from '../utils/navigation';

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customerName, mobile, selectedSector, setSelectedSector, setRole } = useStore();
  const [name, setName] = useState(customerName || 'Sunita Sharma');
  const [nameError, setNameError] = useState(false);
  const [address, setAddress] = useState('House #1402, Near Subhash Park');
  const [directCall, setDirectCall] = useState(true);
  const [commLang, setCommLang] = useState('hi');
  const [detectedLoc, setDetectedLoc] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const personalCardY = useRef(0);

  // Store holds "Sector 22, Chandigarh" while the chips are labelled "Sec 22"
  const activeChip = selectedSector.split(',')[0].replace('Sector', 'Sec').trim();

  const handleGpsDetect = () => {
    setDetectedLoc(true);
    setSelectedSector('Sector 22');
    setAddress('Booth 45, Near Kiran Cinema, Sector 22-B');
  };

  // replace (not push) so Back from the other setup screen returns to Role Selection
  const handleSwitchToWorker = () => {
    setRole('worker');
    router.replace('/worker-onboarding');
  };

  const handleComplete = () => {
    if (!name.trim()) {
      setNameError(true);
      scrollRef.current?.scrollTo({ y: personalCardY.current, animated: true });
      return;
    }
    // In a real app, save to DB here.
    resetTo('/(tabs)/home');
  };

  const sectors = {
    'CHANDIGARH': ['Sec 35', 'Sec 22', 'Sec 15', 'Sec 43'],
    'MOHALI (SAS NAGAR)': ['Phase 7', 'Phase 3B2', 'Phase 5', 'Sec 70'],
    'PANCHKULA': ['Sec 11', 'Sec 20', 'MDC Sec 4']
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/role')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#111c2d" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Worker Detail Direct Call</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tricityHeaderPill}>
            <Text style={styles.tricityHeaderPillText}>Tricity</Text>
          </View>
          <View style={styles.headerAvatar}>
            <User color="#ffffff" size={18} strokeWidth={2.5} />
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Step Banner & Lang Switcher */}
        <View style={styles.stepBannerRow}>
          <View style={styles.stepBadge}>
            <View style={styles.pingDot} />
            <Text style={styles.stepBadgeText}>STEP 2 OF 2 • ग्राहक प्रोफ़ाइल (Customer Setup)</Text>
          </View>
          <LanguageToggle variant="soft" labels={FULL_LANG_LABELS} style={styles.langToggle} />
        </View>

        {/* Customer Mode Card */}
        <ModeSwitchCard mode="customer" onSwitch={handleSwitchToWorker} />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
            <Verified color="#ffffff" size={22} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>100% Free • No Middleman Fees</Text>
            <Text style={styles.infoSub}>Direct Cash/UPI to workers • 0% commission forever</Text>
          </View>
        </View>

        {/* Avatar Upload */}
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarCircleWrap} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              <Camera color="#6c7a70" size={36} strokeWidth={1.5} />
              <Text style={styles.avatarUploadText}>Upload</Text>
            </View>
            <View style={styles.avatarBadge}>
              <CameraIcon color="#ffffff" size={18} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={styles.avatarTitle}>Add Profile Photo (फ़ोटो जोड़ें)</Text>
            <Text style={styles.avatarSubtitle}>Optional — helps verified workers recognize your home safely</Text>
          </View>
        </View>

        {/* Personal Details */}
        <View
          style={styles.formCard}
          onLayout={(e) => {
            personalCardY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.cardHeader}>
            <BadgeInfo color="#006c46" size={22} strokeWidth={2} />
            <Text style={styles.cardTitle}>Personal Details (व्यक्तिगत विवरण)</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Full Name / पूरा नाम <Text style={{ color: '#ba1a1a' }}>*</Text></Text>
              <Text style={styles.hintText}>e.g. Sunita Sharma</Text>
            </View>
            <View style={styles.inputWrap}>
              <UserCircle color="#6c7a70" size={20} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, nameError && styles.textInputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setNameError(false);
                }}
                placeholder="Enter full name / ਨਾਮ ਦਰਜ ਕਰੋ"
                placeholderTextColor="#6c7a70"
              />
            </View>
            {nameError && (
              <Text style={styles.errorText}>Please enter your full name / कृपया अपना नाम दर्ज करें</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Mobile Number / फ़ोन नंबर</Text>
              <View style={styles.verifiedOtp}>
                <Verified color="#006c46" size={16} strokeWidth={2.5} />
                <Text style={styles.verifiedOtpText}>Verified OTP ✓</Text>
              </View>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: '#f0f3ff', padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                <Text style={styles.mobileText}>+91 {mobile || '98765 43210'}</Text>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              </View>
            </View>
            <Text style={styles.mobileHelper}>Linked to your instant direct call connect system</Text>
          </View>
        </View>

        {/* Primary Address */}
        <View style={styles.formCard}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MapPin color="#006c46" size={22} strokeWidth={2} />
              <Text style={styles.cardTitle}>Primary Address (घर का पता)</Text>
            </View>
            <View style={styles.tricityBadge}>
              <Text style={styles.tricityBadgeText}>Tricity</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.gpsBtn} onPress={handleGpsDetect} activeOpacity={0.8}>
            <MapPin color="#006c46" size={20} strokeWidth={2} />
            <Text style={styles.gpsBtnText}>{detectedLoc ? 'Sector 22-B Detected ✓' : 'Auto-Detect GPS Location / वर्तमान स्थान'}</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>House / Flat / Landmark</Text>
            <View style={styles.inputWrap}>
              <Building color="#6c7a70" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. Flat 302, Royal Residency"
                placeholderTextColor="#6c7a70"
              />
            </View>
          </View>

          <View style={styles.sectorSelectionWrap}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Select Tricity Hub & Sector</Text>
              <Text style={styles.hintText}>Tap to pinpoint</Text>
            </View>

            {Object.entries(sectors).map(([city, list]) => (
              <View key={city} style={{ marginTop: 10 }}>
                <Text style={styles.cityHeading}>{city}</Text>
                <View style={styles.chipsWrap}>
                  {list.map(sec => {
                    const isActive = activeChip === sec;
                    return (
                      <TouchableOpacity
                        key={sec}
                        style={[styles.sectorChip, isActive && styles.sectorChipActive]}
                        onPress={() => setSelectedSector(sec)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sectorChipText, isActive && styles.sectorChipTextActive]}>
                          {sec} {isActive ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Placeholder Map View */}
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapOverlay}>
              <View style={styles.mapTextRow}>
                <MapPin color="#53de9e" size={20} strokeWidth={2.5} />
                <Text style={styles.mapText}>{detectedLoc ? 'Sector 22-B Market Area, Chandigarh' : 'Sector 22, Chandigarh, India'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Communication Preferences */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Mic color="#006c46" size={22} strokeWidth={2} />
            <Text style={styles.cardTitle}>Communication Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>Preferred Language with Workers (बातचीत की भाषा)</Text>
            <View style={styles.commGrid}>
              <TouchableOpacity style={[styles.commBtn, commLang === 'hi' && styles.commBtnActive]} onPress={() => setCommLang('hi')}>
                <Text style={[styles.commBtnTitle, commLang === 'hi' && styles.commBtnTitleActive]}>Hindi</Text>
                <Text style={[styles.commBtnSub, commLang === 'hi' && styles.commBtnSubActive]}>हिंदी</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commBtn, commLang === 'pa' && styles.commBtnActive]} onPress={() => setCommLang('pa')}>
                <Text style={[styles.commBtnTitle, commLang === 'pa' && styles.commBtnTitleActive]}>Punjabi</Text>
                <Text style={[styles.commBtnSub, commLang === 'pa' && styles.commBtnSubActive]}>ਪੰਜਾਬੀ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commBtn, commLang === 'en' && styles.commBtnActive]} onPress={() => setCommLang('en')}>
                <Text style={[styles.commBtnTitle, commLang === 'en' && styles.commBtnTitleActive]}>English</Text>
                <Text style={[styles.commBtnSub, commLang === 'en' && styles.commBtnSubActive]}>अंग्रेज़ी</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
              <View style={styles.toggleIconBox}>
                <PhoneCall color="#006c46" size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Direct Call Access</Text>
                <Text style={styles.toggleSub}>Allow verified local artisans to call your phone directly</Text>
              </View>
            </View>
            <Switch
              value={directCall}
              onValueChange={setDirectCall}
              trackColor={{ false: '#bccabf', true: '#00b074' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Shield Info */}
        <View style={styles.shieldCard}>
          <View style={styles.shieldIconBox}>
            <ShieldCheck color="#ffffff" size={20} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldTitle}>Tricity Trust & Privacy Shield</Text>
            <Text style={styles.shieldSub}>
              Your exact flat number is <Text style={{ fontWeight: '700', color: '#111c2d' }}>never broadcasted</Text> publicly. It is shared only after you confirm an artisan's visit. No spam marketing, ever.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Container */}
      <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>Save & Go to Marketplace • प्रोफ़ाइल पूरा करें</Text>
          <ArrowRight color="#ffffff" size={22} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <CheckCircle2 color="#006c46" size={16} strokeWidth={2.5} />
          <Text style={styles.footerNoteText}>Aadhaar-free instant signup for Chandigarh, Mohali & Panchkula</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9ff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 8 : 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(249, 249, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    zIndex: 50
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f3ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111c2d',
    flexShrink: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  tricityHeaderPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#f0f3ff'
  },
  tricityHeaderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3d4a41'
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006c46',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: 16
  },
  stepBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#dee8ff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b074'
  },
  stepBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#111c2d',
    letterSpacing: 0.5
  },
  langToggle: {
    backgroundColor: '#dee8ff'
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#00b074',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  infoSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 16
  },
  avatarCircleWrap: {
    position: 'relative',
    marginBottom: 12
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dee8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#d8e3fb'
  },
  avatarUploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6c7a70',
    marginTop: 4
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111c2d'
  },
  avatarSubtitle: {
    fontSize: 12,
    color: '#3d4a41',
    textAlign: 'center'
  },
  formCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111c2d'
  },
  inputGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  labelText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111c2d'
  },
  hintText: {
    fontSize: 12,
    color: '#3d4a41'
  },
  verifiedOtp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  verifiedOtpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006c46'
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 10
  },
  textInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#f0f3ff',
    borderRadius: 8,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    color: '#111c2d',
    fontWeight: '500'
  },
  textInputError: {
    borderWidth: 1.5,
    borderColor: '#ba1a1a'
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
    marginTop: 6
  },
  mobileText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111c2d',
    letterSpacing: 0.5
  },
  primaryBadge: {
    marginLeft: 'auto',
    backgroundColor: '#73fbb8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002112'
  },
  mobileHelper: {
    fontSize: 12,
    color: '#3d4a41',
    marginTop: 6
  },
  tricityBadge: {
    backgroundColor: '#e7eeff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  tricityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111c2d'
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#dee8ff',
    borderRadius: 8,
    marginBottom: 16
  },
  gpsBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#006c46'
  },
  sectorSelectionWrap: {
    marginTop: 8
  },
  cityHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3d4a41',
    marginBottom: 6
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  sectorChip: {
    backgroundColor: '#f0f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  sectorChipActive: {
    backgroundColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111c2d'
  },
  sectorChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  mapPlaceholder: {
    width: '100%',
    height: 144,
    backgroundColor: '#e7eeff', // solid fallback
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(38, 49, 67, 0.5)',
    justifyContent: 'flex-end',
    padding: 12
  },
  mapTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mapText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff'
  },
  commGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  commBtn: {
    flex: 1,
    backgroundColor: '#f0f3ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  commBtnActive: {
    backgroundColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  commBtnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111c2d'
  },
  commBtnTitleActive: {
    fontWeight: '700',
    color: '#ffffff'
  },
  commBtnSub: {
    fontSize: 11,
    color: '#3d4a41',
    marginTop: 2
  },
  commBtnSubActive: {
    color: 'rgba(255,255,255,0.9)'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#f0f3ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 16
  },
  toggleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d8e3fb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111c2d'
  },
  toggleSub: {
    fontSize: 12,
    color: '#3d4a41',
    marginTop: 2
  },
  shieldCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#dee8ff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  shieldIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#006c46',
    alignItems: 'center',
    justifyContent: 'center'
  },
  shieldTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111c2d',
    marginBottom: 4
  },
  shieldSub: {
    fontSize: 12,
    color: '#3d4a41',
    lineHeight: 18
  },
  footerWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 50
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#00b074',
    borderRadius: 12,
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  primaryBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8
  },
  footerNoteText: {
    flexShrink: 1,
    fontSize: 12,
    color: '#3d4a41'
  }
});
