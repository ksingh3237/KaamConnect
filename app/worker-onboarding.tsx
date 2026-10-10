import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ShieldCheck, User, Wrench, Zap, Monitor, Droplet, Hammer,
  Medal, Minus, Plus, X, Globe, CheckCircle2, PlusCircle, MapPin, Lock, CreditCard, Save, Camera, Badge, Phone, Shield
} from 'lucide-react-native';
import { useStore } from '../store/useStore';

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
  outline: '#6c7a70'
};

export default function WorkerOnboardingScreen() {
  const router = useRouter();
  const { setRole } = useStore();
  
  const [roleMode, setRoleMode] = useState('worker');
  const [trade, setTrade] = useState('electrician');
  const [secondaryTrade, setSecondaryTrade] = useState('appliance');
  const [exp, setExp] = useState(8);
  const [skills, setSkills] = useState(['Wiring (वायरिंग)', 'MCB Box Repair', 'Inverter / Battery', 'Fan Repair / पंखा']);
  const [radius, setRadius] = useState('6 km');
  const [agreed, setAgreed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const adjustExp = (delta: number) => {
    setExp(prev => Math.max(1, Math.min(40, prev + delta)));
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = () => {
    setShowModal(true);
  };

  const handleGoDashboard = () => {
    setShowModal(false);
    setRole(roleMode as any);
    router.push('/(tabs)/leads');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <ArrowLeft color={HtmlColors.onSurface} size={24} />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida/AEtjO1XczmBh09k5wl0Bntxdg-AlI03bx6carDUzphbv1rmSMDMeqKs0CIa718aK9D21tnLHJLzuICvzkeSV4m2glCf9q2wZs9VeADkSRvpmL-n-xJHGm1jLAH4RPNwyNIGp0LhJK_fCGv34DAK-KNXh_7uHTuV9PrUP3UC5r7WrTc9dwj06y1sc0JTSByNjRzDTIQsK9goI8LaUcUD2PX0VvJB0Tsgvr935sfromAw1Rjpq' }} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.headerTitle} numberOfLines={1}>Worker Detail Direct Call</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tricityBadge}><Text style={styles.tricityBadgeText}>Tricity</Text></View>
          <View style={styles.headerAvatar}><User color={HtmlColors.onPrimary} size={18} /></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subtle Trust Banner Header */}
        <View style={styles.trustBanner}>
          <View style={styles.trustBannerLeft}>
            <ShieldCheck color={HtmlColors.primary} size={20} />
            <Text style={styles.trustBannerText}>Zero Commission Guarantee</Text>
          </View>
          <View style={styles.tricityVerified}><Text style={styles.tricityVerifiedText}>Tricity Verified</Text></View>
        </View>

        {/* Role Selector Switch */}
        <View style={styles.roleSwitchContainer}>
          <TouchableOpacity 
            style={[styles.roleBtn, roleMode === 'worker' && styles.roleBtnActive]} 
            onPress={() => setRoleMode('worker')}
          >
            <Wrench color={roleMode === 'worker' ? HtmlColors.onPrimary : HtmlColors.onSurfaceVariant} size={18} />
            <Text style={[styles.roleBtnText, roleMode === 'worker' && styles.roleBtnTextActive]}>Worker (कारीगर)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, roleMode === 'customer' && styles.roleBtnActive]} 
            onPress={() => setRoleMode('customer')}
          >
            <User color={roleMode === 'customer' ? HtmlColors.onPrimary : HtmlColors.onSurfaceVariant} size={18} />
            <Text style={[styles.roleBtnText, roleMode === 'customer' && styles.roleBtnTextActive]}>Customer (ग्राहक)</Text>
          </TouchableOpacity>
        </View>

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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-dO-2vCzTdR8J3qa4fwcozHNi1Y2k7GAEOQZ8861mCG-0lPq-EqMhT4I0eqB_TXWzLfWheKQTLFYkdjIhvG3l0Kg6YgbYrdiOesAqnW0QHqoTi9LHyeUN2-cwFcrTmETSG9xZR75QB-EaOEC2H0jlgzVSsNjzO6q797nt2vUYMTh6LMfyYHClkq6eOIVMzMrXc22cp2xBnswFRkDdVJCj9ijs9pfs9HLhEItxCsJr' }} 
                style={styles.avatarImage} 
              />
              <View style={styles.cameraBtn}><Camera color={HtmlColors.onPrimary} size={16} /></View>
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
            <Badge color={HtmlColors.primary} size={20} />
            <Text style={styles.cardTitle}>Personal Details (निजी विवरण)</Text>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Full Name / ਪੂਰਾ ਨਾਂ</Text>
              <Text style={styles.labelHighlight}>As per Govt ID</Text>
            </View>
            <View style={styles.inputWrapper}>
              <User color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput style={styles.input} value="Ramesh Kumar / ਰਮੇਸ਼ ਕੁਮਾਰ" editable={false} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number / ਮੋਬਾਈਲ</Text>
            <View style={styles.inputWrapper}>
              <Phone color={HtmlColors.onSurfaceVariant} size={20} style={styles.inputIcon} />
              <TextInput style={[styles.input, { fontFamily: 'monospace' }]} value="+91 98765 43210" editable={false} />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Wrench color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Primary Trade (मुख्य काम)</Text>
            </View>
            <Text style={styles.maxText}>Max 2</Text>
          </View>
          <View style={styles.chipsWrap}>
            <TouchableOpacity style={[styles.tradeChip, trade === 'electrician' && styles.tradeChipActive]} onPress={() => setTrade('electrician')}>
              <Zap color={trade === 'electrician' ? HtmlColors.onPrimary : HtmlColors.onSurfaceVariant} size={18} />
              <Text style={[styles.tradeChipText, trade === 'electrician' && styles.tradeChipTextActive]}>Electrician (इलेक्ट्रीशियन)</Text>
              {trade === 'electrician' && <CheckCircle2 color={HtmlColors.onPrimary} size={16} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.tradeChip, secondaryTrade === 'appliance' ? styles.tradeChipSecondary : null]} onPress={() => setSecondaryTrade(secondaryTrade === 'appliance' ? '' : 'appliance')}>
              <Monitor color={secondaryTrade === 'appliance' ? HtmlColors.onSurface : HtmlColors.onSurfaceVariant} size={18} />
              <Text style={[styles.tradeChipText, secondaryTrade === 'appliance' ? { color: HtmlColors.onSurface } : null]}>Appliance Repair (उपकरण मरम्मत)</Text>
              <Plus color={HtmlColors.primary} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tradeChip}>
              <Droplet color={HtmlColors.onSurfaceVariant} size={18} />
              <Text style={styles.tradeChipText}>Plumber (प्लंबर)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tradeChip}>
              <Hammer color={HtmlColors.onSurfaceVariant} size={18} />
              <Text style={styles.tradeChipText}>Carpenter (बढ़ई)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: Experience & Skills */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            <TouchableOpacity style={styles.addSkillChip}>
              <Plus color={HtmlColors.onSurfaceVariant} size={16} />
              <Text style={styles.addSkillChipText}>Add Skill</Text>
            </TouchableOpacity>
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
            <View style={styles.langBoxActive}>
              <CheckCircle2 color={HtmlColors.primary} size={20} />
              <Text style={styles.langTitle}>Hindi</Text>
              <Text style={styles.langSub}>हिंदी</Text>
            </View>
            <View style={styles.langBoxActive}>
              <CheckCircle2 color={HtmlColors.primary} size={20} />
              <Text style={styles.langTitle}>Punjabi</Text>
              <Text style={styles.langSub}>ਪੰਜਾਬੀ</Text>
            </View>
            <View style={styles.langBox}>
              <PlusCircle color={HtmlColors.primary} size={20} />
              <Text style={styles.langTitle}>Basic English</Text>
              <Text style={styles.langSub}>ਅੰਗਰੇਜ਼ੀ</Text>
            </View>
          </View>
        </View>

        {/* Section 6: Radius */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin color={HtmlColors.primary} size={20} />
              <Text style={styles.cardTitle}>Service Base & Radius</Text>
            </View>
            <Text style={styles.labelHighlight}>Chandigarh Zone</Text>
          </View>

          <View style={styles.baseSector}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.mapPinBg}><MapPin color={HtmlColors.primary} size={18} /></View>
              <View>
                <Text style={styles.baseTitle}>Base: Sector 35 Chandigarh</Text>
                <Text style={styles.baseSub}>Includes Mohali Phase 7 & 3B2 border</Text>
              </View>
            </View>
            <TouchableOpacity><Text style={styles.changeLink}>Change</Text></TouchableOpacity>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            <TouchableOpacity style={styles.idCardBox}>
              <View style={styles.idIconBg}><CreditCard color={HtmlColors.primary} size={20} /></View>
              <Text style={styles.idBoxTitle}>Aadhaar Front</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <CheckCircle2 color={HtmlColors.primary} size={14} />
                <Text style={styles.idBoxStatus}>Uploaded</Text>
              </View>
              <Text style={styles.idBoxAction}>Tap to change</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.idCardBox}>
              <View style={styles.idIconBgGray}><Camera color={HtmlColors.onSurfaceVariant} size={20} /></View>
              <Text style={styles.idBoxTitle}>Aadhaar Back</Text>
              <Text style={styles.idBoxStatusGray}>Tap to capture</Text>
              <Text style={styles.idBoxActionPrimary}>Upload Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.aadhaarVisual}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB95ASKMHdYWtIJYp-3Om9pmSGyOwy-c5-Q9RG9TAKTPVXRk2zEk_U7m5wDxuyX3HsnLyUsP17ltI4TehSx6pb96mutmOejnzTS_tiWq0KY1SUzN1tHerhfarejpEZL1TfeoAoaGL8Wt7n5ONbV_ZMwuv6i8FN02eBTSBHGaSkXpg9UwgRoZsTXM8u2sIjecAif1pr5-zAg-XZuQznN4Fgyv6LZMJwd-S-I9VSEaW9f' }} 
              style={styles.aadhaarImg} 
            />
            <View style={styles.aadhaarOverlay}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ShieldCheck color="#73fbb8" size={16} />
                <Text style={styles.aadhaarOverlayTitle}>Instant 5-min Auto Verification</Text>
              </View>
              <Text style={styles.aadhaarOverlaySub}>UIDAI secure portal integration</Text>
            </View>
          </View>
        </View>

        {/* Section 8: Agreement Box */}
        <TouchableOpacity style={styles.agreeBox} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <CheckCircle2 color={HtmlColors.onPrimary} size={14} />}
          </View>
          <Text style={styles.agreeText}>
            I agree to receive direct calls from Tricity residents and keep 100% of my earnings without any middleman commission.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <Save color={HtmlColors.onPrimary} size={22} />
          <Text style={styles.saveBtnText}>Save & Go to Dashboard • प्रोफाइल सेव करें</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>Tricity Worker Network • Chandigarh, Mohali, Panchkula</Text>
      </View>

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}><CheckCircle2 color={HtmlColors.primary} size={36} /></View>
            <Text style={styles.modalTitle}>Badhai Ho! (बधाई हो)</Text>
            <Text style={styles.modalDesc}>Your profile is verified. You are now live on the Tricity Artisan Radar for direct customer calls!</Text>
            
            <View style={styles.modalInfoBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Phone color={HtmlColors.primary} size={16} />
                <Text style={styles.modalInfoTitle}>Direct Calling Active</Text>
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
    height: 32
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
    paddingBottom: 100
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
    justifyContent: 'space-between'
  },
  trustBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  trustBannerText: {
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
  roleSwitchContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: HtmlColors.surfaceContainerLow,
    padding: 4,
    borderRadius: 12,
    flexDirection: 'row'
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  roleBtnActive: {
    backgroundColor: HtmlColors.primary,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: HtmlColors.onSurfaceVariant
  },
  roleBtnTextActive: {
    color: HtmlColors.onPrimary
  },
  formHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24
  },
  formHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  formHeaderTitle: {
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
  cardTitle: {
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
    marginBottom: 4
  },
  label: {
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
    marginBottom: 24
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
    flex: 1,
    fontSize: 12,
    color: HtmlColors.onSurfaceVariant,
    lineHeight: 18
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24, // SafeArea padding
    backgroundColor: 'rgba(249,249,255,0.95)'
  },
  saveBtn: {
    height: 54,
    backgroundColor: HtmlColors.primaryContainer,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  saveBtnText: {
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
