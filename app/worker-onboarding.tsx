import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ShieldCheck, User, Wrench, Zap, Monitor, Droplet, Hammer,
  Medal, Minus, Plus, X, Globe, Check, CheckCircle2, PlusCircle, MapPin, Lock, CreditCard, Save, Camera, IdCard, Phone, Shield,
  Wind, Paintbrush, Sparkles, Tv, Truck, Star, Pencil
} from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { resetTo } from '../utils/navigation';
import { useSession } from '../store/useSession';
import { useAsync } from '../api/useAsync';
import { getCategories, getLocations, patchWorker, putWorker, putWorkerDocument } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { uploadFile, type PickedFile } from '../api/upload';
import { useImagePicker } from '../components/ImageSourceModal';
import { getLocationAccess } from '../utils/locationPermission';
import WorkerLocationPermissionModal from '../components/WorkerLocationPermissionModal';
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import SectorPicker from '../components/SectorPicker';
import TradePickerModal from '../components/TradePickerModal';
import GoogleLocationPicker, { type PickedLocation } from '../components/GoogleLocationPicker';
import { serviceIcon } from '../constants/services';
import { noFocusRing } from '../constants/theme';
import { reconcileScheduledRadius, scheduledRadiusChoices } from '../utils/radius';
import type { DocumentType, Lang, ServiceCategory, VerificationStatus } from '../api/types';

const ID_PLACEHOLDER = require('../assets/images/id-card-placeholder.png');
const AVATAR_PLACEHOLDER = require('../assets/images/avatar-placeholder.png');

// We map HTML colors to local constants to match the design perfectly
const HtmlColors = {
  primary: '#006c46',
  onPrimary: '#ffffff',
  primaryContainer: '#00b074',
  onPrimaryContainer: '#003a23',
  surface: '#f9f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainer: '#e7eeff',
  surfaceContainerHigh: '#dee8ff',
  onSurface: '#111c2d',
  onSurfaceVariant: '#3d4a41',
  outline: '#6c7a70',
  error: '#ba1a1a'
};

export default function WorkerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pick: pickImage, modal: imageSourceModal } = useImagePicker();
  const { setRole } = useStore();
  const { workerProfile, user, refreshMe } = useSession();
  const scrollRef = useRef<ScrollView>(null);
  const categories = useAsync(() => getCategories(), [], { reloadOnFocus: false });
  const locations = useAsync(() => getLocations(), [], { reloadOnFocus: false });

  // A returning worker sees what is already saved
  const existing = workerProfile;

  const [name, setName] = useState(existing?.fullName ?? '');
  // First entry is the primary trade, the optional second one is the secondary
  const [trades, setTrades] = useState<string[]>(existing?.trades.map((t) => t.categoryId) ?? []);
  const [pickingTrades, setPickingTrades] = useState(false);
  // The grey box around an input shows the focus border, not the browser's ring on the smaller input inside it
  const [focused, setFocused] = useState<string | null>(null);
  const focusProps = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((cur) => (cur === key ? null : cur)),
  });
  const wrapStyle = (key: string) => [styles.inputWrapper, focused === key && styles.inputWrapperFocus];
  const [exp, setExp] = useState(existing?.experienceYears ?? 3);
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [languages, setLanguages] = useState<Lang[]>(existing?.languages ?? ['hi']);
  const [baseAreaId, setBaseAreaId] = useState<number | null>(existing?.baseArea.id ?? null);
  // Typed locality when the base is not in the list (baseAreaId is then the city's "Other area")
  const [localityName, setLocalityName] = useState<string | null>(existing?.locality ?? null);
  const [shopAddress, setShopAddress] = useState(existing?.addressLine ?? '');
  const [pickingBase, setPickingBase] = useState(false);
  // The address text the map filled in, so a later pick can replace it but never the person's own typing
  const [autoLine, setAutoLine] = useState('');
  const [radius, setRadius] = useState(existing ? `${existing.radiusKm} km` : '6 km');
  // null = the same as the radius above (what the server stores as no value)
  const [scheduledRadius, setScheduledRadius] = useState<number | null>(existing?.scheduledRadiusKm ?? null);
  const [vehicle, setVehicle] = useState(existing?.vehicle ?? '');
  const [upiId, setUpiId] = useState(existing?.upiId ?? '');
  const [visitingFee, setVisitingFee] = useState(existing?.visitingFee ? String(existing.visitingFee) : '');
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [resultStatus, setResultStatus] = useState<VerificationStatus>('PENDING');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  // Aadhaar images are chosen now and uploaded when the profile is saved (the server needs the profile to exist first)
  const [docs, setDocs] = useState<Partial<Record<DocumentType, PickedFile>>>({});

  const baseLabel = useMemo(() => {
    for (const city of locations.data ?? []) {
      const area = city.areas.find((a) => a.id === baseAreaId);
      if (area) return { title: `Base: ${localityName ?? area.name}, ${city.name.replace(/\s*\(.*\)/, '')}`, city: city.name };
    }
    return null;
  }, [locations.data, baseAreaId, localityName]);

  const displayPhone = (user?.phone ?? '').replace(/^\+91/, '');

  // The map/search/GPS picker found the workshop: select its sector (when matched) and fill the address unless typed.
  // The server keeps the area, locality and address line for a worker; it has no field for the exact pin yet.
  const handlePicked = (loc: PickedLocation) => {
    if (loc.areaId !== null) {
      setBaseAreaId(loc.areaId);
      setLocalityName(loc.localityName);
      setPickingBase(false);
    }
    setShopAddress((prev) => (prev.trim() === '' || prev === autoLine ? loc.line : prev));
    setAutoLine(loc.line);
    setFormError(null);
  };

  const adjustExp = (delta: number) => {
    setExp((prev) => Math.max(1, Math.min(40, prev + delta)));
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((x) => x !== skillToRemove));
  };

  const commitSkill = () => {
    const value = skillDraft.trim().slice(0, 40);
    if (value && !skills.some((x) => x.toLowerCase() === value.toLowerCase()) && skills.length < 15) setSkills([...skills, value]);
    setSkillDraft('');
    setAddingSkill(false);
  };

  const toggleLanguage = (code: Lang) => {
    setLanguages((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));
  };

  const handlePickPhoto = async () => {
    if (photoBusy) return;
    setFormError(null);
    try {
      const picked = await pickImage();
      if (!picked) return;
      setPhotoBusy(true);
      setPhoto(picked);
      setPhotoKey(await uploadFile('PROFILE_PHOTO', picked));
    } catch (error) {
      setPhoto(null);
      setPhotoKey(null);
      setFormError(error instanceof Error && !isApiError(error) ? error.message : userMessage(error));
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePickDoc = async (type: DocumentType) => {
    setFormError(null);
    try {
      const picked = await pickImage();
      if (picked) setDocs((prev) => ({ ...prev, [type]: picked }));
    } catch (error) {
      setFormError(error instanceof Error && !isApiError(error) ? error.message : userMessage(error));
    }
  };

  const handleSubmit = async () => {
    if (saving || photoBusy) return;
    setFormError(null);
    if (!name.trim()) return fail('Enter your full name as on your ID. / पहचान पत्र के अनुसार पूरा नाम लिखें');
    if (trades.length === 0) return fail('Choose at least one trade. / कम से कम एक काम चुनें');
    if (languages.length === 0) return fail('Choose at least one language. / कम से कम एक भाषा चुनें');
    if (baseAreaId === null) return fail('Choose your base sector. / अपना बेस सेक्टर चुनें');
    if (shopAddress.trim().length > 0 && shopAddress.trim().length < 3) return fail('Write your full shop / home address. / पूरा पता लिखें');
    const haveFront = !!docs.AADHAAR_FRONT || !!existing?.documents.AADHAAR_FRONT;
    const haveBack = !!docs.AADHAAR_BACK || !!existing?.documents.AADHAAR_BACK;
    if (!haveFront || !haveBack) return fail('Add both Aadhaar photos (front and back). / आधार की दोनों फ़ोटो जोड़ें');
    if (visitingFee !== '' && !/^[0-9]{1,6}$/.test(visitingFee)) return fail('Visiting fee must be a whole number of rupees. / विज़िटिंग फ़ीस पूरी संख्या में लिखें');
    if (!agreed) {
      setAgreeError(true);
      scrollRef.current?.scrollToEnd({ animated: true });
      return;
    }
    setSaving(true);
    try {
      await putWorker({
        fullName: name.trim(),
        ...(photoKey ? { photoKey } : {}),
        trades,
        experienceYears: exp,
        skills,
        languages,
        baseAreaId,
        ...(localityName ? { localityName } : {}),
        ...(shopAddress.trim() ? { addressLine: shopAddress.trim() } : {}),
        radiusKm: parseInt(radius, 10) as 3 | 6 | 12,
        ...(scheduledRadius ? { scheduledRadiusKm: scheduledRadius } : {}),
        ...(upiId.trim() ? { upiId: upiId.trim() } : {}),
        ...(vehicle.trim() ? { vehicle: vehicle.trim() } : {}),
        ...(visitingFee !== '' ? { visitingFee: parseInt(visitingFee, 10) } : {}),
        termsAccepted: true,
      });
      // The profile save cannot clear a value (null is only accepted by the partial update)
      if (!scheduledRadius && existing?.scheduledRadiusKm) await patchWorker({ scheduledRadiusKm: null });
      for (const type of ['AADHAAR_FRONT', 'AADHAAR_BACK'] as const) {
        const file = docs[type];
        if (file) await putWorkerDocument(type, await uploadFile('AADHAAR', file));
      }
      const fresh = await refreshMe();
      setResultStatus(fresh?.worker?.verificationStatus ?? 'PENDING');
      setShowModal(true);
    } catch (error) {
      const fields = isApiError(error) ? error.details.map((d) => `${d.field}: ${d.issue}`).join('; ') : '';
      setFormError(userMessage(error) + (fields ? ` (${fields})` : ''));
    } finally {
      setSaving(false);
    }
  };

  function fail(message: string) {
    setFormError(message);
  }

  const openDashboard = () => {
    setRole('worker');
    resetTo('/(tabs)/home');
  };

  // Last step of onboarding: explain and ask for the location permission (once), then go to the dashboard
  const handleGoDashboard = async () => {
    setShowModal(false);
    if ((await getLocationAccess()) === 'granted') openDashboard();
    else setShowLocation(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/role')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={HtmlColors.onSurface} size={24} />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Wrench color={HtmlColors.onPrimary} size={18} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>Worker Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tricityBadge}><Text style={styles.tricityBadgeText}>Tricity</Text></View>
          <View style={styles.headerAvatar}><User color={HtmlColors.onPrimary} size={18} /></View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Subtle Trust Banner Header */}
        <View style={styles.trustBanner}>
          <View style={styles.trustBannerLeft}>
            <ShieldCheck color={HtmlColors.primary} size={20} />
            <Text style={styles.trustBannerText}>Zero Commission Guarantee</Text>
          </View>
          <View style={styles.tricityVerified}><Text style={styles.tricityVerifiedText}>Tricity Verified</Text></View>
        </View>

        {/* Worker Mode Card */}
        {/* Header Section & Public Privacy Trust Pill */}
        <View style={styles.formHeader}>
          <View style={styles.formHeaderTitleRow}>
            <Text style={styles.formHeaderTitle}>Worker Profile & Verification</Text>
            <View style={styles.freePill}><Text style={styles.freePillText}>100% Free</Text></View>
          </View>
          <Text style={styles.formHeaderSub}>कारीगर प्रोफाइल एवं पहचान सत्यापन</Text>

          <View style={styles.securityBadge}>
            <View style={styles.securityIconBg}><Shield color={HtmlColors.primary} size={18} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={styles.securityTitle}>Identity Verified on KaamConnect</Text>
                <View style={styles.pulseDot} />
              </View>
              <Text style={styles.securityDesc}>Aadhaar details remain encrypted & are never shown publicly. Only the green verification badge appears to customers.</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Profile Photo */}
        <View style={styles.card}>
          <View style={styles.photoContainer}>
            <View style={styles.avatarWrap}>
              <Image source={photo ? { uri: photo.uri } : AVATAR_PLACEHOLDER} style={[styles.avatarImage, photoBusy && { opacity: 0.5 }]} />
              {photoBusy && <ActivityIndicator color={HtmlColors.primary} style={{ position: 'absolute', alignSelf: 'center', top: '40%' }} />}
              <TouchableOpacity style={styles.cameraBtn} onPress={() => void handlePickPhoto()} disabled={photoBusy} accessibilityRole="button" accessibilityLabel="Add profile photo">
                <Camera color={HtmlColors.onPrimary} size={16} />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoTitle}>Add clear smiling photo</Text>
            <Text style={styles.photoSub}>साफ़ फोटो लगाएं (ग्राहकों का भरोसा बढ़ता है)</Text>
            <View style={styles.photoCheck}>
              <CheckCircle2 color={HtmlColors.primary} size={16} />
              <Text style={styles.photoCheckText}>Face clearly visible</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Personal Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IdCard color={HtmlColors.primary} size={20} />
            <Text style={styles.cardTitle}>Personal Details (निजी विवरण)</Text>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Full Name / ਪੂਰਾ ਨਾਂ</Text>
              <Text style={styles.labelHighlight}>As per Govt ID</Text>
            </View>
            <View style={wrapStyle("name")}>
              <User color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput style={styles.input} {...focusProps("name")} value={name} onChangeText={setName} placeholder="Your full name / ਪੂਰਾ ਨਾਂ" placeholderTextColor={HtmlColors.outline} maxLength={80} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number / ਮੋਬਾਈਲ</Text>
            <View style={styles.inputWrapper}>
              <Phone color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput style={[styles.input, { fontFamily: 'monospace' }]} value={`+91 ${displayPhone}`} editable={false} />
              <View style={styles.verifiedTag}>
                <ShieldCheck color={HtmlColors.primary} size={16} />
                <Text style={styles.verifiedTagText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: Trades. Two slots however long the catalogue is; the full list lives in TradePickerModal */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={styles.cardHeaderMain}>
              <Wrench color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Primary Trade (मुख्य काम)</Text>
            </View>
            <Text style={styles.maxText}>Max 2</Text>
          </View>
          {categories.loading && <LoadingBlock label="Loading trades… / काम लोड हो रहे हैं…" />}
          {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
          {categories.data && (
            <View style={styles.tradeSlots}>
              <TradeSlot kind="primary" id={trades[0]} categories={categories.data} onOpen={() => setPickingTrades(true)} />
              <TradeSlot
                kind="secondary"
                id={trades[1]}
                categories={categories.data}
                onOpen={() => setPickingTrades(true)}
                onRemove={() => setTrades((prev) => prev.slice(0, 1))}
              />
            </View>
          )}
        </View>

        {/* Section 4: Experience & Skills */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={styles.cardHeaderMain}>
              <Medal color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Experience & Skills</Text>
            </View>
            <View style={styles.expBadge}><Text style={styles.expBadgeText}>{exp} Years Exp</Text></View>
          </View>

          <View style={styles.expStepperRow}>
            <Text style={styles.expStepperLabel}>Total Field Experience:</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustExp(-1)}><Minus color={HtmlColors.onSurface} size={18} /></TouchableOpacity>
              <Text style={styles.stepperVal}>{exp} <Text style={styles.stepperUnit}>yrs</Text></Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustExp(1)}><Plus color={HtmlColors.onSurface} size={18} /></TouchableOpacity>
            </View>
          </View>

          <Text style={styles.skillsLabel}>Skills / विशेषज्ञता (Tap to toggle):</Text>
          <View style={styles.chipsWrap}>
            {skills.map((s, i) => (
              <TouchableOpacity key={i} style={styles.skillChip} onPress={() => removeSkill(s)}>
                <Text style={styles.skillChipText}>{s}</Text>
                <X color={HtmlColors.primary} size={14} />
              </TouchableOpacity>
            ))}
            {addingSkill ? (
              <View style={[styles.addSkillChip, { paddingVertical: 4 }]}>
                <TextInput
                  style={[styles.addSkillChipText, { minWidth: 120, padding: 4 }, noFocusRing]}
                  value={skillDraft}
                  onChangeText={setSkillDraft}
                  onSubmitEditing={commitSkill}
                  onBlur={commitSkill}
                  placeholder="e.g. Wiring"
                  placeholderTextColor={HtmlColors.outline}
                  maxLength={40}
                  autoFocus
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.addSkillChip} onPress={() => setAddingSkill(true)} accessibilityRole="button">
                <Plus color={HtmlColors.onSurfaceVariant} size={16} />
                <Text style={styles.addSkillChipText}>Add Skill</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 5: Languages */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Globe color={HtmlColors.primary} size={20} />
            <Text style={styles.cardTitle}>Languages Spoken (भाषाएं)</Text>
          </View>
          <Text style={styles.cardDesc}>Helps customers communicate smoothly with you</Text>
          <View style={styles.langGrid}>
            {([
              ['hi', 'Hindi', 'हिंदी'],
              ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'],
              ['en', 'Basic English', 'ਅੰਗਰੇਜ਼ੀ'],
            ] as const).map(([code, title, sub]) => {
              const on = languages.includes(code);
              return (
                <TouchableOpacity key={code} style={on ? styles.langBoxActive : styles.langBox} onPress={() => toggleLanguage(code)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  {on ? <CheckCircle2 color={HtmlColors.primary} size={20} /> : <PlusCircle color={HtmlColors.primary} size={20} />}
                  <Text style={styles.langTitle}>{title}</Text>
                  <Text style={styles.langSub}>{sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 6: Radius */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={styles.cardHeaderMain}>
              <MapPin color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Service Base & Radius</Text>
            </View>
            <Text style={styles.labelHighlight}>{baseLabel?.city ?? 'Choose base'}</Text>
          </View>

          {locations.data && (
            <View style={{ marginBottom: 12 }}>
              <GoogleLocationPicker locations={locations.data} onChange={handlePicked} />
            </View>
          )}

          <View style={styles.baseSector}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={styles.mapPinBg}><MapPin color={HtmlColors.primary} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.baseTitle}>{baseLabel?.title ?? 'Choose your base sector'}</Text>
                <Text style={styles.baseSub}>Leads near this sector and inside your radius reach you</Text>
              </View>
            </View>
            <TouchableOpacity hitSlop={12} onPress={() => setPickingBase((v) => !v)} accessibilityRole="button"><Text style={styles.changeLink}>{pickingBase ? 'Done' : baseLabel ? 'Change' : 'Choose'}</Text></TouchableOpacity>
          </View>
          {(pickingBase || baseAreaId === null) && (
            <View style={{ marginTop: 10 }}>
              {locations.loading && <LoadingBlock label="Loading sectors… / सेक्टर लोड हो रहे हैं…" />}
              {locations.error && !locations.data && <ErrorBlock message={locations.error} onRetry={() => void locations.reload()} />}
              {locations.data && (
                <SectorPicker
                  locations={locations.data}
                  value={baseAreaId}
                  locality={localityName}
                  onChange={(id, _label, locality) => { setBaseAreaId(id); setLocalityName(locality); setPickingBase(false); }}
                  placeholder="Choose your base sector / बेस सेक्टर चुनें"
                />
              )}
            </View>
          )}

          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Address / Workshop / Shop (दुकान या कार्यशाला का पता)</Text>
            </View>
            <View style={wrapStyle("address")}>
              <MapPin color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input} {...focusProps("address")}
                value={shopAddress}
                onChangeText={setShopAddress}
                placeholder="Shop / house no., street, landmark"
                placeholderTextColor={HtmlColors.outline}
                maxLength={200}
                accessibilityLabel="Address, workshop or shop"
              />
            </View>
            <Text style={styles.addressHint}>Private: only you and the KaamConnect verification team see it. / यह निजी है</Text>
          </View>

          <View style={[styles.labelRow, { marginTop: 12, marginBottom: 8 }]}>
            <Text style={styles.label}>Job Alert Radius (कार्य क्षेत्र):</Text>
            <Text style={styles.radiusLabelHighlight}>{radius} {radius === '6 km' && '(Recommended)'}</Text>
          </View>
          <View style={styles.radiusGrid}>
            {['3 km', '6 km', '12 km'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => {
                  setRadius(r);
                  setScheduledRadius((current) => reconcileScheduledRadius(current, parseInt(r, 10)));
                }}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r} {r === '6 km' && '★'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.radiusNote}>Higher radius means more customer call notifications across Mohali & Panchkula.</Text>

          <View style={[styles.labelRow, { marginTop: 16, marginBottom: 8 }]}>
            <Text style={styles.label}>Future bookings (आगे की बुकिंग):</Text>
            <Text style={styles.radiusLabelHighlight}>{scheduledRadius ? `${scheduledRadius} km` : 'Same as above'}</Text>
          </View>
          <View style={styles.radiusGrid}>
            {[null, ...scheduledRadiusChoices(parseInt(radius, 10))].map((km) => (
              <TouchableOpacity
                key={km ?? 'same'}
                style={[styles.radiusBtn, scheduledRadius === km && styles.radiusBtnActive]}
                onPress={() => setScheduledRadius(km)}
                accessibilityRole="button"
                accessibilityLabel={km ? `Future bookings within ${km} km` : 'Future bookings: same radius as live jobs'}
              >
                <Text style={[styles.radiusBtnText, scheduledRadius === km && styles.radiusBtnTextActive]}>{km ? `${km} km` : 'Same'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.radiusNote}>Jobs booked for a later day are matched from your base sector, so you can accept work farther away.</Text>
        </View>

        {/* Section 7: ID Verification */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={styles.cardHeaderMain}>
              <ShieldCheck color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Govt ID Verification</Text>
            </View>
            <View style={styles.mandatoryBadge}><Text style={styles.mandatoryBadgeText}>Mandatory</Text></View>
          </View>

          <View style={styles.encryptNote}>
            <Lock color={HtmlColors.primary} size={20} />
            <Text style={styles.encryptNoteText}>
              Your Aadhaar number and document images are <Text style={{ fontWeight: '700' }}>AES-256 encrypted</Text>. Customers only see the <Text style={{ color: HtmlColors.primary, fontWeight: '700' }}>"Identity Verified"</Text> checkmark. No card numbers are ever stored publicly.
            </Text>
          </View>

          <View style={styles.idGrid}>
            {(['AADHAAR_FRONT', 'AADHAAR_BACK'] as const).map((type) => {
              const chosen = docs[type];
              const onFile = !!existing?.documents[type];
              const label = type === 'AADHAAR_FRONT' ? 'Aadhaar Front' : 'Aadhaar Back';
              return (
                <TouchableOpacity key={type} style={styles.idCardBox} onPress={() => void handlePickDoc(type)} accessibilityRole="button" accessibilityLabel={`Choose ${label} photo`}>
                  <View style={chosen || onFile ? styles.idIconBg : styles.idIconBgGray}>
                    {chosen || onFile ? <CreditCard color={HtmlColors.primary} size={20} /> : <Camera color={HtmlColors.onSurfaceVariant} size={20} />}
                  </View>
                  <Text style={styles.idBoxTitle}>{label}</Text>
                  {chosen ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <CheckCircle2 color={HtmlColors.primary} size={14} />
                      <Text style={styles.idBoxStatus}>Selected (uploads on save)</Text>
                    </View>
                  ) : onFile ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <CheckCircle2 color={HtmlColors.primary} size={14} />
                      <Text style={styles.idBoxStatus}>Already on file</Text>
                    </View>
                  ) : (
                    <Text style={styles.idBoxStatusGray}>Tap to choose a photo</Text>
                  )}
                  <Text style={chosen || onFile ? styles.idBoxAction : styles.idBoxActionPrimary}>{chosen || onFile ? 'Tap to change' : 'Add photo'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.aadhaarVisual}>
            <Image source={ID_PLACEHOLDER} style={styles.aadhaarImg} />
            <View style={styles.aadhaarOverlay}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck color="#73fbb8" size={16} />
                <Text style={[styles.aadhaarOverlayTitle, { flexShrink: 1 }]}>Reviewed by the KaamConnect team</Text>
              </View>
              <Text style={styles.aadhaarOverlaySub}>Your profile goes live once the review is done</Text>
            </View>
          </View>
        </View>

        {/* Optional details the server stores: vehicle, UPI id and default visiting fee */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard color={HtmlColors.primary} size={20} />
            <Text style={styles.cardTitle}>Payment & Vehicle (optional)</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visiting fee ₹ / विज़िटिंग फ़ीस</Text>
            <View style={wrapStyle("fee")}>
              <TextInput style={styles.input} {...focusProps("fee")} value={visitingFee} onChangeText={(t) => setVisitingFee(t.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="e.g. 200" placeholderTextColor={HtmlColors.outline} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI ID / यूपीआई आईडी</Text>
            <View style={wrapStyle("upi")}>
              <TextInput style={styles.input} {...focusProps("upi")} value={upiId} onChangeText={setUpiId} placeholder="name@bank" placeholderTextColor={HtmlColors.outline} autoCapitalize="none" maxLength={80} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle / वाहन</Text>
            <View style={wrapStyle("vehicle")}>
              <TextInput style={styles.input} {...focusProps("vehicle")} value={vehicle} onChangeText={setVehicle} placeholder="e.g. Hero Splendor (CH 01 AB 1234)" placeholderTextColor={HtmlColors.outline} maxLength={80} />
            </View>
          </View>
        </View>

        {/* Section 8: Agreement Box */}
        <TouchableOpacity
          style={[styles.agreeBox, agreeError && styles.agreeBoxError]}
          onPress={() => {
            setAgreed(!agreed);
            setAgreeError(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          aria-checked={agreed}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive, agreeError && { borderColor: HtmlColors.error }]}>
            {agreed && <Check color={HtmlColors.onPrimary} size={14} strokeWidth={3} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agreeText}>
              I agree to receive direct calls from Tricity residents and keep 100% of my earnings without any middleman commission.
            </Text>
            {agreeError && (
              <Text style={styles.agreeErrorText}>Please tick this box to continue / आगे बढ़ने के लिए सहमति दें</Text>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {formError && (
          <Text style={{ color: HtmlColors.error, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 8 }} accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <TouchableOpacity style={[styles.saveBtn, (saving || photoBusy) && { opacity: 0.7 }]} onPress={() => void handleSubmit()} disabled={saving || photoBusy}>
          <Save color={HtmlColors.onPrimary} size={22} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving… / सहेज रहे हैं…' : 'Save & Go to Dashboard • प्रोफाइल सेव करें'}</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>Tricity Worker Network • Chandigarh, Mohali, Panchkula</Text>
      </View>

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><CheckCircle2 color={HtmlColors.primary} size={36} /></View>
            <Text style={styles.modalTitle}>{resultStatus === 'VERIFIED' ? 'Badhai Ho! (बधाई हो)' : 'Profile submitted (प्रोफ़ाइल जमा हुई)'}</Text>
            <Text style={styles.modalDesc}>
              {resultStatus === 'VERIFIED'
                ? 'Your profile is verified. You are now live on the Tricity Artisan Radar for direct customer calls!'
                : 'Our team will review your Aadhaar photos. Customers can find you and you will see leads once the review is done.'}
            </Text>

            <View style={styles.modalInfoBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Phone color={HtmlColors.primary} size={16} />
                <Text style={styles.modalInfoTitle}>{resultStatus === 'VERIFIED' ? 'Direct Calling Active' : 'Under review'}</Text>
              </View>
              <Text style={styles.modalInfoText}>No commission cuts will ever be deducted from your earnings.</Text>
            </View>

            <TouchableOpacity style={styles.modalBtn} onPress={() => void handleGoDashboard()}>
              <Text style={styles.modalBtnText}>Open my dashboard (डैशबोर्ड खोलें)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <WorkerLocationPermissionModal
        visible={showLocation}
        onDone={() => {
          setShowLocation(false);
          openDashboard();
        }}
      />
      {imageSourceModal}
      {categories.data && (
        <TradePickerModal
          visible={pickingTrades}
          categories={categories.data}
          selectedTradeIds={trades}
          onSave={(ids) => {
            setTrades(ids);
            setFormError(null);
          }}
          onClose={() => setPickingTrades(false)}
        />
      )}
    </SafeAreaView>
  );
}

// One of the two trade rows on the form (50px each, so Section 3 stays about 110px for any catalogue size).
// Empty: a button that opens the picker. Filled: icon, bilingual name, badge, and Edit (Primary) or Remove (Secondary).
function TradeSlot({
  kind, id, categories, onOpen, onRemove,
}: {
  kind: 'primary' | 'secondary';
  id: string | undefined;
  categories: ServiceCategory[];
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const primary = kind === 'primary';
  if (id === undefined) {
    return (
      <TouchableOpacity
        style={[styles.slot, primary ? styles.slotEmptyPrimary : styles.slotEmptySecondary]}
        onPress={onOpen}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={primary ? 'Select primary trade' : 'Add secondary trade, optional'}
      >
        <Plus color={HtmlColors.primary} size={20} />
        <Text style={styles.slotEmptyText} numberOfLines={1}>
          {primary ? 'Select Primary Trade / मुख्य काम चुनें' : 'Add Secondary Trade / दूसरा काम (Optional)'}
        </Text>
      </TouchableOpacity>
    );
  }
  const cat = categories.find((c) => c.id === id);
  const Icon = cat ? serviceIcon(cat.iconKey) : Wrench;
  const title = cat ? `${cat.title.en} (${cat.title.hi})` : id;
  return (
    <View style={[styles.slot, styles.slotFilled]}>
      <TouchableOpacity style={styles.slotMain} onPress={onOpen} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${primary ? 'Primary' : 'Secondary'} trade: ${title}. Change`}>
        <View style={[styles.slotIcon, { backgroundColor: cat?.bgColor ?? HtmlColors.surfaceContainer }]}>
          <Icon color={cat?.color ?? HtmlColors.onSurfaceVariant} size={20} />
        </View>
        <View style={styles.slotBody}>
          <Text style={styles.slotTitle} numberOfLines={1}>{title}</Text>
          <View style={[styles.slotBadge, !primary && styles.slotBadgeSecondary]}>
            {primary && <Star color={HtmlColors.primary} size={12} fill={HtmlColors.primary} />}
            <Text style={[styles.slotBadgeText, !primary && styles.slotBadgeTextSecondary]}>{primary ? 'Primary • मुख्य' : '2nd Trade • दूसरा'}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.slotAction}
        onPress={primary ? onOpen : onRemove}
        hitSlop={{ top: 6, bottom: 6 }}
        accessibilityRole="button"
        accessibilityLabel={primary ? 'Edit trades' : 'Remove secondary trade'}
      >
        {primary ? <Pencil color={HtmlColors.primary} size={14} /> : <X color={HtmlColors.error} size={14} />}
        <Text style={[styles.slotActionText, !primary && { color: HtmlColors.error }]}>{primary ? 'Edit / बदलें' : 'Remove'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HtmlColors.surface
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    zIndex: 50
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HtmlColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: HtmlColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: HtmlColors.onSurface,
    flex: 1
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  tricityBadge: {
    backgroundColor: HtmlColors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16
  },
  tricityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HtmlColors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: 0
  },
  trustBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,108,70,0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  trustBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  trustBannerText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onPrimaryContainer
  },
  tricityVerified: {
    backgroundColor: HtmlColors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16
  },
  tricityVerifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  formHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24
  },
  formHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  formHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: HtmlColors.onSurface
  },
  freePill: {
    backgroundColor: HtmlColors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16
  },
  freePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  formHeaderSub: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    marginTop: 4
  },
  securityBadge: {
    marginTop: 8,
    backgroundColor: HtmlColors.surfaceContainerLowest,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  securityIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,108,70,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  securityTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HtmlColors.primary,
    marginLeft: 6
  },
  securityDesc: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    marginTop: 2
  },
  card: {
    backgroundColor: HtmlColors.surfaceContainerLowest,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16
  },
  photoContainer: {
    alignItems: 'center'
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: HtmlColors.surfaceContainer
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HtmlColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: HtmlColors.surfaceContainerLowest
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: HtmlColors.onSurface
  },
  photoSub: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    marginTop: 2
  },
  photoCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HtmlColors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 12
  },
  photoCheckText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  cardHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: HtmlColors.onSurface
  },
  cardDesc: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    marginTop: -10,
    marginBottom: 12
  },
  inputGroup: {
    marginBottom: 12
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  label: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurfaceVariant
  },
  labelHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HtmlColors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  inputWrapperFocus: {
    borderColor: HtmlColors.primary,
    backgroundColor: HtmlColors.surfaceContainerLowest
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 48,
    fontSize: 16,
    fontWeight: '500',
    color: HtmlColors.onSurface,
    ...noFocusRing
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,108,70,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16
  },
  verifiedTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  maxText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tradeSlots: {
    gap: 8
  },
  slot: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12
  },
  slotEmptyPrimary: {
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: HtmlColors.primary,
    backgroundColor: 'rgba(0,108,70,0.06)'
  },
  slotEmptySecondary: {
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: HtmlColors.outline,
    backgroundColor: HtmlColors.surfaceContainerLow
  },
  slotEmptyText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  slotFilled: {
    paddingLeft: 8,
    paddingRight: 4,
    backgroundColor: HtmlColors.surfaceContainerLow
  },
  slotMain: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  slotIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotBody: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start'
  },
  slotTitle: {
    alignSelf: 'stretch',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: HtmlColors.onSurface
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,108,70,0.12)'
  },
  slotBadgeSecondary: {
    backgroundColor: HtmlColors.surfaceContainerHigh
  },
  slotBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  slotBadgeTextSecondary: {
    color: HtmlColors.onSurfaceVariant
  },
  slotAction: {
    minWidth: 48,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  slotActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  expBadge: {
    backgroundColor: HtmlColors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16
  },
  expBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  expStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 8,
    borderRadius: 12,
    marginBottom: 16
  },
  expStepperLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface,
    paddingLeft: 8
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: HtmlColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperVal: {
    fontSize: 18,
    fontWeight: '700',
    color: HtmlColors.primary,
    minWidth: 32,
    textAlign: 'center'
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: HtmlColors.onSurfaceVariant
  },
  skillsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant,
    marginBottom: 6
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,108,70,0.1)'
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.primary
  },
  addSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: HtmlColors.surfaceContainerLow
  },
  addSkillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurfaceVariant
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  langBox: {
    flex: 1,
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  langBoxActive: {
    flex: 1,
    backgroundColor: 'rgba(0,108,70,0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  langTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface,
    marginTop: 4
  },
  langSub: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant
  },
  baseSector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12
  },
  mapPinBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,108,70,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  baseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface
  },
  baseSub: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary,
    textDecorationLine: 'underline'
  },
  radiusLabelHighlight: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  radiusGrid: {
    flexDirection: 'row',
    gap: 8
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: HtmlColors.surfaceContainerLow,
    borderRadius: 8,
    alignItems: 'center'
  },
  radiusBtnActive: {
    backgroundColor: HtmlColors.primary
  },
  radiusBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface
  },
  radiusBtnTextActive: {
    color: HtmlColors.onPrimary
  },
  radiusNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: HtmlColors.onSurfaceVariant,
    marginTop: 8
  },
  mandatoryBadge: {
    backgroundColor: 'rgba(0,108,70,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16
  },
  mandatoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  encryptNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12
  },
  encryptNoteText: {
    flex: 1,
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    lineHeight: 18
  },
  idGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  idCardBox: {
    flex: 1,
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  idIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,108,70,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  idIconBgGray: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HtmlColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  idBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurface
  },
  idBoxStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: HtmlColors.primary
  },
  idBoxStatusGray: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    marginTop: 4
  },
  idBoxAction: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant,
    backgroundColor: HtmlColors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8
  },
  idBoxActionPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.primary,
    backgroundColor: HtmlColors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8
  },
  aadhaarVisual: {
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  aadhaarImg: {
    width: '100%',
    height: '100%',
    opacity: 0.8
  },
  aadhaarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(17,28,45,0.6)'
  },
  aadhaarOverlayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#73fbb8'
  },
  aadhaarOverlaySub: {
    fontSize: 12,
    color: HtmlColors.surfaceContainerHigh,
    marginTop: 2
  },
  agreeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: HtmlColors.surfaceContainerLow,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  agreeBoxError: {
    borderColor: HtmlColors.error
  },
  agreeErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: HtmlColors.error,
    marginTop: 4
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: HtmlColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  checkboxActive: {
    backgroundColor: HtmlColors.primary,
    borderColor: HtmlColors.primary
  },
  agreeText: {
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    lineHeight: 18
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: HtmlColors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)'
  },
  saveBtn: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: HtmlColors.primaryContainer,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  saveBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: HtmlColors.onPrimary
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant,
    marginTop: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,28,45,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: HtmlColors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,108,70,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: HtmlColors.onSurface,
    marginBottom: 4
  },
  modalDesc: {
    fontSize: 14,
    textAlign: 'center',
    color: HtmlColors.onSurfaceVariant,
    marginBottom: 16
  },
  modalInfoBox: {
    width: '100%',
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  modalInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.primary
  },
  modalInfoText: {
    fontSize: 12,
    color: HtmlColors.onSurface
  },
  modalBtn: {
    width: '100%',
    height: 48,
    backgroundColor: HtmlColors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: HtmlColors.onPrimary
  },
  addressHint: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6
  }
});
