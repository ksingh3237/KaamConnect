import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ShieldCheck, User, Wrench, Zap, Monitor, Droplet, Hammer,
  Medal, Minus, Plus, X, Globe, Check, CheckCircle2, PlusCircle, MapPin, Lock, CreditCard, Save, Camera, IdCard, Phone, Shield,
  Wind, Paintbrush, Sparkles, Tv, Truck
} from 'lucide-react-native';
import ModeSwitchCard from '../components/ModeSwitchCard';
import { useStore } from '../store/useStore';
import { resetTo } from '../utils/navigation';
import { useSession } from '../store/useSession';
import { useAsync } from '../api/useAsync';
import { getCategories, getLocations, putWorker, putWorkerDocument } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { uploadFile, type PickedFile } from '../api/upload';
import { pickImage } from '../utils/pickImage';
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import type { DocumentType, Lang, VerificationStatus } from '../api/types';

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

const ICONS: Record<string, typeof Zap> = { Zap, Droplet, Wind, Hammer, Paintbrush, Sparkles, Tv, Truck, Monitor };
const MAX_TRADES = 2;

export default function WorkerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [exp, setExp] = useState(existing?.experienceYears ?? 3);
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [languages, setLanguages] = useState<Lang[]>(existing?.languages ?? ['hi']);
  const [baseAreaId, setBaseAreaId] = useState<number | null>(existing?.baseArea.id ?? null);
  const [pickingBase, setPickingBase] = useState(false);
  const [radius, setRadius] = useState(existing ? `${existing.radiusKm} km` : '6 km');
  const [vehicle, setVehicle] = useState(existing?.vehicle ?? '');
  const [upiId, setUpiId] = useState(existing?.upiId ?? '');
  const [visitingFee, setVisitingFee] = useState(existing?.visitingFee ? String(existing.visitingFee) : '');
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      if (area) return { title: `Base: ${area.name}, ${city.name.replace(/\s*\(.*\)/, '')}`, city: city.name };
    }
    return null;
  }, [locations.data, baseAreaId]);

  const displayPhone = (user?.phone ?? '').replace(/^\+91/, '');

  const toggleTrade = (id: string) => {
    setTrades((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id); // at least one is checked again on save
      return prev.length < MAX_TRADES ? [...prev, id] : [prev[0]!, id];
    });
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
        radiusKm: parseInt(radius, 10) as 3 | 6 | 12,
        ...(upiId.trim() ? { upiId: upiId.trim() } : {}),
        ...(vehicle.trim() ? { vehicle: vehicle.trim() } : {}),
        ...(visitingFee !== '' ? { visitingFee: parseInt(visitingFee, 10) } : {}),
        termsAccepted: true,
      });
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

  // replace (not push) so Back from the other setup screen returns to Role Selection
  const handleSwitchToCustomer = () => {
    setRole('customer');
    router.replace('/customer-onboarding');
  };

  const handleGoDashboard = () => {
    setShowModal(false);
    setRole('worker');
    resetTo('/(tabs)/leads');
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
          <Text style={styles.headerTitle} numberOfLines={1}>Worker Detail Direct Call</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tricityBadge}><Text style={styles.tricityBadgeText}>Tricity</Text></View>
          <View style={styles.headerAvatar}><User color={HtmlColors.onPrimary} size={18} /></View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subtle Trust Banner Header */}
        <View style={styles.trustBanner}>
          <View style={styles.trustBannerLeft}>
            <ShieldCheck color={HtmlColors.primary} size={20} />
            <Text style={styles.trustBannerText}>Zero Commission Guarantee</Text>
          </View>
          <View style={styles.tricityVerified}><Text style={styles.tricityVerifiedText}>Tricity Verified</Text></View>
        </View>

        {/* Worker Mode Card */}
        <ModeSwitchCard mode="worker" onSwitch={handleSwitchToCustomer} />

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
            <View style={styles.inputWrapper}>
              <User color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name / ਪੂਰਾ ਨਾਂ" placeholderTextColor={HtmlColors.outline} maxLength={80} />
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

        {/* Section 3: Primary Trade */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={styles.cardHeaderMain}>
              <Wrench color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Primary Trade (मुख्य काम)</Text>
            </View>
            <Text style={styles.maxText}>Max 2</Text>
          </View>
          <View style={styles.chipsWrap}>
            {categories.loading && <LoadingBlock label="Loading trades… / काम लोड हो रहे हैं…" />}
            {categories.error && !categories.data && <ErrorBlock message={categories.error} onRetry={() => void categories.reload()} />}
            {(categories.data ?? []).map((cat) => {
              const id = cat.id;
              const label = `${cat.title.en} (${cat.title.hi})`;
              const Icon = ICONS[cat.iconKey] ?? Wrench;
              const isPrimary = trades[0] === id;
              const isSecondary = !isPrimary && trades.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.tradeChip, isPrimary && styles.tradeChipActive, isSecondary && styles.tradeChipSecondary]}
                  onPress={() => toggleTrade(id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  aria-selected={isPrimary || isSecondary}
                >
                  <Icon color={isPrimary ? HtmlColors.onPrimary : isSecondary ? HtmlColors.onSurface : HtmlColors.onSurfaceVariant} size={18} />
                  <Text style={[styles.tradeChipText, isPrimary && styles.tradeChipTextActive, isSecondary && { color: HtmlColors.onSurface }]}>
                    {label}
                  </Text>
                  {isPrimary && <CheckCircle2 color={HtmlColors.onPrimary} size={16} />}
                  {isSecondary && <CheckCircle2 color={HtmlColors.primary} size={16} />}
                  {!isPrimary && !isSecondary && <Plus color={HtmlColors.primary} size={16} />}
                </TouchableOpacity>
              );
            })}
          </View>
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
                  style={[styles.addSkillChipText, { minWidth: 120, padding: 4 }]}
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
              {(locations.data ?? []).map((city) => (
                <View key={city.id} style={{ marginBottom: 8 }}>
                  <Text style={styles.labelHighlight}>{city.name.toUpperCase()}</Text>
                  <View style={styles.chipsWrap}>
                    {city.areas.map((area) => {
                      const on = baseAreaId === area.id;
                      return (
                        <TouchableOpacity
                          key={area.id}
                          style={[styles.skillChip, on && { backgroundColor: HtmlColors.primaryContainer }]}
                          onPress={() => { setBaseAreaId(area.id); setPickingBase(false); }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                        >
                          <Text style={styles.skillChipText}>{area.name.replace('Sector', 'Sec')} {on ? '✓' : ''}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.labelRow, { marginTop: 12, marginBottom: 8 }]}>
            <Text style={styles.label}>Job Alert Radius (कार्य क्षेत्र):</Text>
            <Text style={styles.radiusLabelHighlight}>{radius} {radius === '6 km' && '(Recommended)'}</Text>
          </View>
          <View style={styles.radiusGrid}>
            {['3 km', '6 km', '12 km'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r} {r === '6 km' && '★'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.radiusNote}>Higher radius means more customer call notifications across Mohali & Panchkula.</Text>
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
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={visitingFee} onChangeText={(t) => setVisitingFee(t.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="e.g. 200" placeholderTextColor={HtmlColors.outline} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI ID / यूपीआई आईडी</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="name@bank" placeholderTextColor={HtmlColors.outline} autoCapitalize="none" maxLength={80} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle / वाहन</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={vehicle} onChangeText={setVehicle} placeholder="e.g. Hero Splendor (CH 01 AB 1234)" placeholderTextColor={HtmlColors.outline} maxLength={80} />
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

            <TouchableOpacity style={styles.modalBtn} onPress={handleGoDashboard}>
              <Text style={styles.modalBtnText}>Open Worker Radar (राडार खोलें)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HtmlColors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 12
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
    color: HtmlColors.onSurface
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
    fontSize: 11,
    fontWeight: '700',
    color: HtmlColors.primary
  },
  maxText: {
    fontSize: 11,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: HtmlColors.surfaceContainerLow
  },
  tradeChipActive: {
    backgroundColor: HtmlColors.primary
  },
  tradeChipSecondary: {
    backgroundColor: HtmlColors.surfaceContainer
  },
  tradeChipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurfaceVariant
  },
  tradeChipTextActive: {
    color: HtmlColors.onPrimary
  },
  expBadge: {
    backgroundColor: HtmlColors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16
  },
  expBadgeText: {
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
    color: HtmlColors.onSurfaceVariant,
    backgroundColor: HtmlColors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8
  },
  idBoxActionPrimary: {
    fontSize: 11,
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
    fontSize: 11,
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
  }
});
