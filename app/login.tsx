import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ShieldCheck, Phone, Lock, ChevronDown, CheckCircle2, Shield, MapPin, AlertCircle, Smartphone, XCircle } from 'lucide-react-native';
import LanguageToggle from '../components/LanguageToggle';
import { noFocusRing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useSession } from '../store/useSession';
import { isApiError, userMessage } from '../api/errors';
import { useT } from '../i18n/useT';

// Format exactly as "98765 43210"
const formatPhone = (text: string) => {
  const digits = text.replace(/\D/g, '').substring(0, 10);
  return digits.length > 5 ? digits.substring(0, 5) + ' ' + digits.substring(5) : digits;
};

export default function LoginScreen() {
  const router = useRouter();
  const t = useT();
  const insets = useSafeAreaInsets();
  // Below 360dp the header can't hold brand + badge + language switcher
  const isCompact = useWindowDimensions().width < 360;
  const { mobile, setMobile } = useStore();
  const [phoneVal, setPhoneVal] = useState(formatPhone(mobile || ''));
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const requestOtp = useSession((st) => st.requestOtp);
  // State updates land after the next render, so two fast taps can both pass an isLoading check; a ref cannot.
  const sending = useRef(false);

  const handlePhoneChange = (text: string) => {
    setPhoneVal(formatPhone(text));
    setShowError(false);
    setApiError(null);
  };

  const triggerOtpFlow = async () => {
    if (sending.current) return;
    const digits = phoneVal.replace(/\D/g, '');
    // Indian mobile numbers start with 6-9 (the server enforces the same rule)
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setShowError(true);
      return;
    }
    sending.current = true;
    setIsLoading(true);
    setApiError(null);
    setMobile(phoneVal);
    try {
      const result = await requestOtp(phoneVal);
      // Invisible OTP already verified the number and signed the person in: the root layout moves them on.
      if (!result.signedIn) router.push('/otp');
    } catch (error) {
      // OTP_COOLDOWN means a code was sent a moment ago: the OTP screen can still take it
      if (isApiError(error) && error.code === 'OTP_COOLDOWN') router.push('/otp');
      else setApiError(userMessage(error));
    } finally {
      sending.current = false;
      setIsLoading(false);
    }
  };

  const getValidationMessage = () => {
    const digits = phoneVal.replace(/\D/g, '');
    if (apiError) {
      return (
        <View style={styles.safeNotice} accessibilityRole="alert">
          <AlertCircle color="#ef4444" size={14} />
          <Text style={[styles.safeNoticeText, styles.errorText]}>{apiError}</Text>
        </View>
      );
    }
    if (showError) {
      return (
        <View style={styles.safeNotice}>
          <AlertCircle color="#ef4444" size={14} />
          <Text style={[styles.safeNoticeText, styles.errorText]}>{t('Enter a valid 10-digit mobile number.')}</Text>
        </View>
      );
    }
    if (digits.length === 10) {
      return (
        <View style={styles.safeNotice}>
          <CheckCircle2 color="#00b074" size={14} />
          <Text style={[styles.safeNoticeText, { color: '#00875a', fontWeight: '600' }]}>{t('Valid 10-digit mobile number ready')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.safeNotice}>
        <Lock color="#00b074" size={14} />
        <Text style={styles.safeNoticeText}>🔒 {t('Encrypted & Safe • No password needed')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Fixed App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/language')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color="#475569" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.headerBrand}>KaamConnect</Text>
            <Text style={styles.headerSub}>{t('Chandigarh Tricity')}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {!isCompact && (
            <View style={styles.commBadge}>
              <ShieldCheck color="#00875a" size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <Text style={styles.commBadgeText}>{t('0% Commission')}</Text>
            </View>
          )}
          <LanguageToggle style={styles.langToggle} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Tricity Verified Banner */}
        <View style={styles.verifiedBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Text style={{ fontSize: 16 }}>🇮🇳</Text>
            <Text style={styles.verifiedBannerText}>{t('Direct Local Connect • Verified Workers')}</Text>
          </View>
          <View style={styles.activeChdBadge}>
            <Text style={styles.activeChdText}>{t('Active CHD')}</Text>
          </View>
        </View>

        {/* Screen Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.fastOtpPill}>
            <Smartphone color="#006398" size={14} strokeWidth={2.5} />
            <Text style={styles.fastOtpText}>{t('Fast OTP Login')}</Text>
          </View>
          <Text style={styles.mainTitle}>{t('Enter Mobile Number')}</Text>
          <Text style={styles.titleSub}>
            {t('We will send an OTP verification code. Zero spam, 100% verified Tricity network.')}
          </Text>
        </View>

        {/* Phone Number Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>{t('Phone Number')}</Text>
            <Text style={styles.inputHint}>{t('10-Digit Indian Mobile')}</Text>
          </View>

          <View style={[styles.inputShell, isFocused && styles.inputShellFocused, showError && styles.inputShellError]}>
            <View style={styles.countryCodeWrap}>
              <Text style={{ fontSize: 18 }}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>+91</Text>
              <ChevronDown color="#64748b" size={14} strokeWidth={3} />
            </View>
            <TextInput
              style={[styles.textInput, isCompact && styles.textInputCompact]}
              keyboardType="phone-pad"
              maxLength={11} // 10 digits + 1 space
              value={phoneVal}
              onChangeText={handlePhoneChange}
              placeholder="98765 43210"
              placeholderTextColor="#94a3b8"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {phoneVal.length > 0 && (
              <TouchableOpacity
                onPress={() => handlePhoneChange('')}
                style={{ padding: 4 }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('Clear phone number')}
              >
                <XCircle color="#94a3b8" size={18} />
              </TouchableOpacity>
            )}
          </View>

          {getValidationMessage()}
        </View>

        {/* Why Mobile Login / Trust & Security Card */}
        <View style={styles.whyCard}>
          <View style={styles.whyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <ShieldCheck color="#006398" size={16} strokeWidth={2.5} />
              <Text style={styles.whyTitle}>{t('Why Mobile Login?')}</Text>
            </View>
            <View style={styles.trustedTag}>
              <Text style={styles.trustedTagText}>{t('Trusted')}</Text>
            </View>
          </View>

          <View style={styles.benefitList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Phone color="#00b074" size={14} strokeWidth={2.5} />
              </View>
              <Text style={styles.benefitText}>
                <Text style={{ fontWeight: '700' }}>{t('Direct Calling:')} </Text>
                {t('Talk directly to skilled mistris & workers without agents.')}
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <Shield color="#00b074" size={14} strokeWidth={2.5} />
              </View>
              <Text style={styles.benefitText}>
                <Text style={{ fontWeight: '700' }}>{t('Instant OTP Booking:')} </Text>
                {t('Safe 1-tap verification protects both consumer and worker.')}
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconWrap}>
                <ShieldCheck color="#00b074" size={14} strokeWidth={2.5} />
              </View>
              <Text style={styles.benefitText}>
                <Text style={{ fontWeight: '700' }}>{t('0% Middleman Charges:')} </Text>
                {t('Pay worker directly via cash or UPI. KaamConnect charges ₹0 fee.')}
              </Text>
            </View>
          </View>

          {/* Tricity Coverage Pill inside Card */}
          <View style={styles.coverageRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <MapPin color="#00b074" size={14} strokeWidth={2} />
              <Text style={styles.coverageText}>{t('Coverage: CHD • Mohali • Panchkula')}</Text>
            </View>
            <Text style={styles.tricityWideText}>{t('Tricity Wide')}</Text>
          </View>
        </View>

        {/* Geographic Coverage Footer Ribbon */}
        <View style={styles.footerRibbon}>
          <MapPin color="#00b074" size={14} strokeWidth={2.5} />
          <Text style={styles.footerRibbonText}>{t('Active across Chandigarh, Mohali & Panchkula')}</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Container */}
      <View style={[styles.footerAction, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && { backgroundColor: '#006c46' }]}
          onPress={() => void triggerOtpFlow()}
          disabled={isLoading}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <Text style={styles.primaryBtnText}>{t('Sending OTP…')}</Text>
          ) : (
            <>
              <Text style={styles.primaryBtnText}>{t('Get OTP')}</Text>
              <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          {t('By proceeding, you agree to KaamConnect’s')}{' '}
          <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })} accessibilityRole="link">{t('Terms of Service')}</Text>
          {` ${t('and')} `}
          <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })} accessibilityRole="link">{t('Privacy Policy')}</Text>
          {t('. No hidden commission, ever.')}
        </Text>
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
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'web' ? 8 : 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 20
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  headerBrand: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#00b074'
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 18
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginLeft: 6
  },
  commBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#e8fbf3',
    borderWidth: 1,
    borderColor: '#a3e9cc'
  },
  commBadgeText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#00875a'
  },
  langToggle: {
    backgroundColor: '#f0f3ff',
    borderColor: 'rgba(203, 213, 225, 0.6)'
  },
  scrollContent: {
    padding: 20
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e6f8f0',
    borderWidth: 1,
    borderColor: '#a6ebd0',
    gap: 8,
    marginBottom: 16
  },
  verifiedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#005a39'
  },
  activeChdBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  activeChdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00875a'
  },
  titleSection: {
    marginBottom: 20
  },
  fastOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#f0f3ff',
    marginBottom: 8
  },
  fastOtpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006398',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 30
  },
  mainTitleHindi: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00b074',
    lineHeight: 30
  },
  titleSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    lineHeight: 18
  },
  inputSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  inputLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  inputHint: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
    color: '#00b074'
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  inputShellFocused: {
    borderColor: '#00b074',
    backgroundColor: '#ffffff'
  },
  inputShellError: {
    borderColor: '#ef4444'
  },
  countryCodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    paddingVertical: 6
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b'
  },
  textInput: {
    flex: 1,
    // Web inputs have an intrinsic min width that pushes them out of the shell
    minWidth: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...noFocusRing
  },
  textInputCompact: {
    fontSize: 16,
    letterSpacing: 0,
    paddingHorizontal: 8
  },
  safeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8
  },
  safeNoticeText: {
    flexShrink: 1,
    fontSize: 13,
    color: '#64748b'
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600'
  },
  whyCard: {
    backgroundColor: '#f0f3ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d8e3fb',
    marginBottom: 16
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  whyTitle: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#006398',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  trustedTag: {
    backgroundColor: 'rgba(63, 161, 230, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  trustedTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004b73'
  },
  benefitList: {
    gap: 8,
    marginTop: 10
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  benefitIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginTop: 2
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 16
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#d8e3fb'
  },
  coverageText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#475569'
  },
  tricityWideText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006398'
  },
  footerRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4
  },
  footerRibbonText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  footerAction: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 20
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00b074',
    height: 52,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff'
  },
  termsText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
    paddingHorizontal: 8
  },
  termsLink: {
    color: '#00875a',
    fontWeight: '700',
    textDecorationLine: 'underline'
  }
});
