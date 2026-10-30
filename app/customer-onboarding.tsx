import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Verified, Camera, CameraIcon, BadgeInfo, UserCircle, MapPin, Building, Mic, PhoneCall, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import LanguageToggle, { FULL_LANG_LABELS, LANGUAGE_NAMES } from '../components/LanguageToggle';
import { useStore } from '../store/useStore';
import { resetTo } from '../utils/navigation';
import { useSession } from '../store/useSession';
import { useAsync } from '../api/useAsync';
import { getLocations, putCustomer } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { uploadFile } from '../api/upload';
import { useImagePicker } from '../components/ImageSourceModal';
import { useImageViewer } from '../components/ImageViewerModal';
import type { Position } from '../utils/position';
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import SectorPicker from '../components/SectorPicker';
import GoogleLocationPicker, { type PickedLocation } from '../components/GoogleLocationPicker';
import { useT } from '../i18n/useT';

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { pick: pickImage, modal: imageSourceModal } = useImagePicker();
  const { show: viewImage, modal: imageViewer } = useImageViewer();
  const { selectedAreaId, setSelectedSector, setRole } = useStore();
  const { customerProfile, user, refreshMe } = useSession();
  const locations = useAsync(() => getLocations(), [], { reloadOnFocus: false });

  // Coming back from "Change location" on Home: show what is already saved
  const existing = customerProfile;
  const primary = existing?.addresses.find((a) => a.isPrimary) ?? existing?.addresses[0] ?? null;

  const [name, setName] = useState(existing?.fullName ?? '');
  const [nameError, setNameError] = useState(false);
  const [address, setAddress] = useState(primary?.line ?? '');
  const [areaId, setAreaId] = useState<number | null>(selectedAreaId ?? primary?.area.id ?? null);
  // Typed locality when the person's pocket is not in the list (areaId is then the city's "Other area")
  const [localityName, setLocalityName] = useState<string | null>(
    selectedAreaId === null || selectedAreaId === primary?.area.id ? primary?.locality ?? null : null,
  );
  const [directCall, setDirectCall] = useState(existing?.allowDirectCalls ?? true);
  const [commLang, setCommLang] = useState<'en' | 'hi' | 'pa'>(existing?.commLanguage ?? 'hi');
  // The photo already saved on the account, until a new one is picked: editing the profile should not look empty
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUrl ?? null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [coords, setCoords] = useState<Position | null>(null);
  // The address text the map filled in; while the field still equals it we remind the person to add the flat number
  const [autoLine, setAutoLine] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const personalCardY = useRef(0);

  // "Sector 22, Chandigarh" for an area, built from the server's list
  const labelOf = (id: number, locality: string | null) => {
    for (const city of locations.data ?? []) {
      const area = city.areas.find((a) => a.id === id);
      if (area) return `${locality ?? area.name}, ${city.name.replace(/\s*\(.*\)/, '')}`;
    }
    return '';
  };

  const displayPhone = (user?.phone ?? '').replace(/^\+91/, '');

  const chooseArea = (id: number, label: string, locality: string | null) => {
    setAreaId(id);
    setLocalityName(locality);
    setFormError(null);
    setSelectedSector(label, id);
  };

  // The map/search/GPS picker found a place: keep its coordinates, select the matching sector (when it found one) and
  // fill the address line unless the person has already typed their own.
  const handlePicked = (loc: PickedLocation) => {
    setCoords({ lat: loc.lat, lng: loc.lng });
    if (loc.areaId !== null) chooseArea(loc.areaId, labelOf(loc.areaId, loc.localityName), loc.localityName);
    setAddress((prev) => (prev.trim() === '' || prev === autoLine ? loc.line : prev));
    setAutoLine(loc.line);
    setFormError(null);
  };

  const handlePickPhoto = async () => {
    if (photoBusy) return;
    setFormError(null);
    try {
      const picked = await pickImage();
      if (!picked) return;
      setPhotoBusy(true);
      setPhotoUri(picked.uri);
      setPhotoKey(await uploadFile('PROFILE_PHOTO', picked));
    } catch (error) {
      setPhotoUri(null);
      setPhotoKey(null);
      setFormError(error instanceof Error && !isApiError(error) ? error.message : userMessage(error));
    } finally {
      setPhotoBusy(false);
    }
  };

  // replace (not push) so Back from the other setup screen returns to Role Selection
  const handleComplete = async () => {
    if (saving || photoBusy) return;
    setFormError(null);
    if (!name.trim()) {
      setNameError(true);
      scrollRef.current?.scrollTo({ y: personalCardY.current, animated: true });
      return;
    }
    if (areaId === null) {
      setFormError(t('Choose your sector below.'));
      return;
    }
    if (!address.trim()) {
      setFormError(t('Enter your house / flat / landmark.'));
      return;
    }
    setSaving(true);
    try {
      await putCustomer({
        fullName: name.trim(),
        ...(photoKey ? { photoKey } : {}),
        commLanguage: commLang,
        allowDirectCalls: directCall,
        address: { areaId, line: address.trim(), ...(localityName ? { localityName } : {}), ...(coords ?? {}) },
      });
      await refreshMe();
      setRole('customer');
      resetTo('/(tabs)/home');
    } catch (error) {
      const fields = isApiError(error) ? error.details.map((d) => `${d.field}: ${d.issue}`).join('; ') : '';
      setFormError(userMessage(error) + (fields ? ` (${fields})` : ''));
    } finally {
      setSaving(false);
    }
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
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color="#111c2d" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('Your Profile')}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tricityHeaderPill}>
            <Text style={styles.tricityHeaderPillText}>{t('Tricity')}</Text>
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
            <Text style={styles.stepBadgeText}>{t('STEP 2 OF 2 • Customer Setup')}</Text>
          </View>
          <LanguageToggle variant="soft" labels={FULL_LANG_LABELS} style={styles.langToggle} />
        </View>

        {/* Customer Mode Card */}
        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
            <Verified color="#ffffff" size={22} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>{t('100% Free • No Middleman Fees')}</Text>
            <Text style={styles.infoSub}>{t('Direct Cash/UPI to workers • 0% commission forever')}</Text>
          </View>
        </View>

        {/* Avatar Upload */}
        <View style={styles.avatarCard}>
          {/* With a photo on it, the circle opens it full screen; the camera badge is how it is changed. */}
          <TouchableOpacity
            style={styles.avatarCircleWrap}
            activeOpacity={0.8}
            onPress={() => (photoUri ? viewImage(photoUri, t('Profile photo')) : void handlePickPhoto())}
            disabled={photoBusy}
            accessibilityRole={photoUri ? 'imagebutton' : 'button'}
            accessibilityLabel={photoUri ? t('View your profile photo full screen') : t('Add profile photo')}
          >
            <View style={[styles.avatarCircle, { overflow: 'hidden' }]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, opacity: photoBusy ? 0.5 : 1 }} />
              ) : (
                <>
                  <Camera color="#6c7a70" size={36} strokeWidth={1.5} />
                  <Text style={styles.avatarUploadText}>{t('Upload')}</Text>
                </>
              )}
              {photoBusy && <ActivityIndicator color="#00b074" style={{ position: 'absolute' }} />}
            </View>
            <TouchableOpacity
              style={styles.avatarBadge}
              onPress={() => void handlePickPhoto()}
              disabled={photoBusy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={photoUri ? t('Change your profile photo') : t('Add profile photo')}
            >
              <CameraIcon color="#ffffff" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={styles.avatarTitle}>{t('Add Profile Photo')}</Text>
            <Text style={styles.avatarSubtitle}>{t('Optional: helps verified workers recognise your home safely')}</Text>
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
            <Text style={styles.cardTitle}>{t('Personal Details')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>{t('Full Name')} <Text style={{ color: '#ba1a1a' }}>*</Text></Text>
              <Text style={styles.hintText}>{t('e.g. Sunita Sharma')}</Text>
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
                placeholder={t('Enter full name')}
                placeholderTextColor="#6c7a70"
              />
            </View>
            {nameError && (
              <Text style={styles.errorText}>{t('Please enter your full name.')}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>{t('Mobile Number')}</Text>
              <View style={styles.verifiedOtp}>
                <Verified color="#006c46" size={16} strokeWidth={2.5} />
                <Text style={styles.verifiedOtpText}>{t('Verified OTP ✓')}</Text>
              </View>
            </View>
            <View style={[styles.inputWrap, { backgroundColor: '#f0f3ff', padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                <Text style={styles.mobileText}>+91 {displayPhone}</Text>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>{t('Primary')}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.mobileHelper}>{t('Workers you book call you on this number')}</Text>
          </View>
        </View>

        {/* Primary Address */}
        <View style={styles.formCard}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MapPin color="#006c46" size={22} strokeWidth={2} />
              <Text style={styles.cardTitle}>{t('Primary Address')}</Text>
            </View>
            <View style={styles.tricityBadge}>
              <Text style={styles.tricityBadgeText}>{t('Tricity')}</Text>
            </View>
          </View>

          {locations.data && (
            <View style={{ marginBottom: 16 }}>
              <GoogleLocationPicker
                locations={locations.data}
                onChange={handlePicked}
                initial={primary?.lat != null && primary?.lng != null ? { lat: primary.lat, lng: primary.lng } : null}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>{t('House / Flat / Landmark')}</Text>
            <View style={styles.inputWrap}>
              <Building color="#6c7a70" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder={t('e.g. Flat 302, Royal Residency')}
                placeholderTextColor="#6c7a70"
              />
            </View>
            {address !== '' && address === autoLine && (
              <Text style={styles.hintText}>{t('Filled from the map. Add your house / flat number at the start.')}</Text>
            )}
          </View>

          <View style={styles.sectorSelectionWrap}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>{t('Select Tricity Hub & Sector')}</Text>
              <Text style={styles.hintText}>{t('Search or tap')}</Text>
            </View>
            {locations.loading && <LoadingBlock label={t('Loading sectors…')} />}
            {locations.error && !locations.data && <ErrorBlock message={locations.error} onRetry={() => void locations.reload()} />}
            {locations.data && (
              <View style={{ marginTop: 10 }}>
                <SectorPicker locations={locations.data} value={areaId} locality={localityName} onChange={chooseArea} />
              </View>
            )}
          </View>
        </View>

        {/* Communication Preferences */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Mic color="#006c46" size={22} strokeWidth={2} />
            <Text style={styles.cardTitle}>{t('Communication Preferences')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelText}>{t('Preferred Language with Workers')}</Text>
            <View style={styles.commGrid}>
              <TouchableOpacity style={[styles.commBtn, commLang === 'hi' && styles.commBtnActive]} onPress={() => setCommLang('hi')}>
                <Text style={[styles.commBtnTitle, commLang === 'hi' && styles.commBtnTitleActive]}>{LANGUAGE_NAMES.hi}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commBtn, commLang === 'pa' && styles.commBtnActive]} onPress={() => setCommLang('pa')}>
                <Text style={[styles.commBtnTitle, commLang === 'pa' && styles.commBtnTitleActive]}>{LANGUAGE_NAMES.pa}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.commBtn, commLang === 'en' && styles.commBtnActive]} onPress={() => setCommLang('en')}>
                <Text style={[styles.commBtnTitle, commLang === 'en' && styles.commBtnTitleActive]}>{LANGUAGE_NAMES.en}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
              <View style={styles.toggleIconBox}>
                <PhoneCall color="#006c46" size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>{t('Direct Call Access')}</Text>
                <Text style={styles.toggleSub}>{t('Allow verified local artisans to call your phone directly')}</Text>
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
            <Text style={styles.shieldTitle}>{t('Tricity Trust & Privacy Shield')}</Text>
            <Text style={styles.shieldSub}>
              {t('Your exact flat number is never shown publicly. It is shared only after you confirm a worker’s visit. No spam marketing, ever.')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Container */}
      <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {formError && (
          <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]} accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <TouchableOpacity style={[styles.primaryBtn, (saving || photoBusy) && { opacity: 0.7 }]} onPress={() => void handleComplete()} activeOpacity={0.9} disabled={saving || photoBusy}>
          <Text style={styles.primaryBtnText}>{saving ? t('Saving…') : t('Save & Go to Marketplace')}</Text>
          <ArrowRight color="#ffffff" size={22} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <CheckCircle2 color="#006c46" size={16} strokeWidth={2.5} />
          <Text style={styles.footerNoteText}>{t('Aadhaar-free instant signup for Chandigarh, Mohali & Panchkula')}</Text>
        </View>
      </View>
      {imageSourceModal}
      {imageViewer}
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#111c2d'
  },
  sectorSelectionWrap: {
    marginTop: 8
  },
  cityHeading: {
    fontSize: 13,
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
    fontSize: 13,
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
