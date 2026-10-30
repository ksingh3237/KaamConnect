import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, AppState } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, MailCheck, Edit2, Volume2, Clock, MessageSquare, Verified, Lock, AlertCircle } from 'lucide-react-native';
import LanguageToggle from '../components/LanguageToggle';
import { noFocusRing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useSession } from '../store/useSession';
import { isApiError, userMessage } from '../api/errors';
import { getWidgetClient, isMsg91WidgetConfigured } from '../api/msg91';
import { notify } from '../utils/dialog';
import { useT } from '../i18n/useT';

// Seconds until "resend" is allowed again, from a deadline so the count stays right after the app was in the background.
const secondsUntil = (deadline: number) => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

export default function OtpScreen() {
  const router = useRouter();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { mobile } = useStore();
  const { verifyOtp, resendOtp, devNotice, resendAfterSec, otpLength: OTP_LENGTH } = useSession();
  // The whole code lives in ONE hidden input; the six boxes only display it.
  // Six separate inputs need focus hand-offs, which drop keystrokes when typing fast
  // and leave earlier boxes empty when a box in the middle is tapped first.
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [resendAt, setResendAt] = useState(() => Date.now() + resendAfterSec * 1000);
  const [secondsLeft, setSecondsLeft] = useState(resendAfterSec);
  // A ref, not state: two fast taps would both read the same stale `false` from state.
  const busy = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showError, setShowError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  // The development notice names the fixed code; the button below only fills it in, it never signs anyone in
  const devCode = devNotice?.match(/\b(\d{6})\b/)?.[1] ?? null;

  const input = useRef<TextInput>(null);

  useEffect(() => {
    // No number, or (MSG91) no live request to verify, e.g. the screen was restored after the app was killed
    if (!mobile || (isMsg91WidgetConfigured() && !getWidgetClient().hasRequest())) router.replace('/login');
  }, [mobile, router]);

  // Counts down to a deadline and re-reads the clock when the app returns to the foreground
  useEffect(() => {
    setSecondsLeft(secondsUntil(resendAt));
    const timerId = setInterval(() => setSecondsLeft(secondsUntil(resendAt)), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setSecondsLeft(secondsUntil(resendAt));
    });
    return () => {
      clearInterval(timerId);
      sub.remove();
    };
  }, [resendAt]);

  // Accepts typing, backspace, paste and SMS autofill alike
  const handleCodeChange = (text: string) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
    setShowError(false);
    setApiError(null);
  };

  // On success the session store flips to "signed in" and the root layout moves the person to the right screen
  // (role selection for a new account, the marketplace otherwise), so there is nothing to navigate to here.
  const handleVerify = async () => {
    if (busy.current) return;
    if (code.length < OTP_LENGTH) {
      setShowError(true);
      input.current?.focus();
      return;
    }
    busy.current = true;
    setIsVerifying(true);
    setApiError(null);
    try {
      await verifyOtp(mobile, code);
    } catch (error) {
      setApiError(userMessage(error));
      if (isApiError(error) && ['OTP_INVALID', 'OTP_LOCKED', 'OTP_EXPIRED'].includes(error.code)) setCode('');
      // The MSG91 request is gone (killed app, finished request): nothing left to verify here
      if (isApiError(error) && error.code === 'OTP_SESSION_LOST') router.replace('/login');
      input.current?.focus();
    } finally {
      busy.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (busy.current || secondsLeft > 0) return;
    busy.current = true;
    setIsResending(true);
    setApiError(null);
    setNotice(null);
    try {
      const result = await resendOtp(mobile);
      setCode('');
      setResendAt(Date.now() + result.resendAfterSec * 1000);
      setNotice(t('A new code has been sent.'));
    } catch (error) {
      if (isApiError(error) && error.retryAfterSec) setResendAt(Date.now() + error.retryAfterSec * 1000);
      if (isApiError(error) && error.code === 'OTP_SESSION_LOST') router.replace('/login');
      setApiError(userMessage(error));
    } finally {
      busy.current = false;
      setIsResending(false);
    }
  };

  // Box currently receiving the next digit (the last box once the code is complete)
  const activeIndex = isFocused ? Math.min(code.length, OTP_LENGTH - 1) : -1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar / Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/login')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
          >
            <ArrowLeft color="#111c2d" size={22} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.tricityBadge}>
            <MapPin color="#006c46" size={15} strokeWidth={2.5} />
            <Text style={styles.tricityBadgeText}>{t('Tricity Chandigarh • Mohali • Panchkula')}</Text>
          </View>
        </View>

        <LanguageToggle variant="soft" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header Illustration / Icon Badge */}
        <View style={styles.iconBadgeWrap}>
          <View style={styles.iconBox}>
            <MailCheck color="#ffffff" size={26} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.pingDot} />
              <Text style={styles.iconTitle}>{t('DIRECT WORKER NETWORK')}</Text>
            </View>
            <Text style={styles.iconDesc}>{t('Instant Verification • 0% Commission Platform')}</Text>
          </View>
        </View>

        {/* Title & Subtitle Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('Verify Phone Number')}</Text>
          <Text style={styles.subTitle}>
            {t('Enter the {count}-digit code sent to', { count: OTP_LENGTH })} <Text style={{ fontWeight: '600', color: '#111c2d' }}>+91 {mobile}</Text>
          </Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' }}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/login')}
          >
            <Edit2 color="#006c46" size={15} strokeWidth={2.5} />
            <Text style={styles.editLink}>{t('Edit Number')}</Text>
          </TouchableOpacity>
        </View>

        {devNotice && (
          <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, gap: 6 }} accessibilityRole="alert">
            <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>{t('DEVELOPMENT MODE')}</Text>
            <Text style={{ color: '#92400E', fontSize: 13, lineHeight: 18 }}>{devNotice}</Text>
            {devCode && (
              <TouchableOpacity onPress={() => handleCodeChange(devCode)} accessibilityRole="button" style={{ alignSelf: 'flex-start', backgroundColor: '#F59E0B', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>{t('Fill test code {code}', { code: devCode })}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* OTP input boxes (as many as the code is long) */}
        <View style={styles.otpSection}>
          {Array.from({ length: OTP_LENGTH }, (_, i) => {
            const digit = code[i] ?? '';
            const isActive = activeIndex === i;
            const isFilled = digit.length > 0;
            return (
              <View
                key={i}
                pointerEvents="none"
                style={[
                  styles.otpBoxWrapper,
                  isFilled && styles.otpBoxFilled,
                  showError && !isFilled && styles.otpBoxError,
                  isActive && styles.otpBoxActive
                ]}
              >
                {isFilled && <Text style={styles.otpDigit}>{digit}</Text>}
                {/* Decorative Bottom Dash */}
                <View
                  style={[
                    styles.bottomDash,
                    isFilled ? styles.dashFilled : (isActive ? styles.dashActive : styles.dashEmpty)
                  ]}
                />
                {/* Placeholder Dot if empty and not active */}
                {!isFilled && !isActive && <View style={styles.placeholderDot} />}
              </View>
            );
          })}

          {/* One invisible input covers the whole row, so a tap on ANY box focuses it */}
          <TextInput
            ref={input}
            style={styles.otpHiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            // Caret stays at the end so typing / backspace always act on the last digit
            selection={{ start: code.length, end: code.length }}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            caretHidden
            contextMenuHidden
            accessibilityLabel={t('Enter the {count}-digit OTP', { count: OTP_LENGTH })}
          />
        </View>

        {showError && (
          <View style={styles.otpErrorRow}>
            <AlertCircle color="#ef4444" size={14} />
            <Text style={styles.otpErrorText}>{t('Enter the {count}-digit code', { count: OTP_LENGTH })}</Text>
          </View>
        )}

        {apiError && (
          <View style={styles.otpErrorRow} accessibilityRole="alert">
            <AlertCircle color="#ef4444" size={14} />
            <Text style={styles.otpErrorText}>{apiError}</Text>
          </View>
        )}
        {notice && !apiError && (
          <View style={styles.otpErrorRow}>
            <Text style={[styles.otpErrorText, { color: '#006c46' }]}>{notice}</Text>
          </View>
        )}

        {/* Low-Literacy Audio Assist Pill */}
        <View style={styles.audioWrap}>
          <TouchableOpacity style={styles.audioBtn} activeOpacity={0.8} onPress={() => void notify(t('Audio help'), t('Spoken instructions are coming soon.'))}>
            <Volume2 color="#006c46" size={19} strokeWidth={2.5} />
            <Text style={styles.audioBtnText}>{t('Hear the code read aloud')} 🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Resend Timer & WhatsApp Backup Card */}
        <View style={styles.resendCard}>
          <View style={styles.resendRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock color="#006c46" size={18} strokeWidth={2.5} />
              <Text style={styles.resendLabel}>{t('Did not receive the SMS?')}</Text>
            </View>
            <View style={styles.timerPill}>
              {secondsLeft > 0 ? (
                <Text style={styles.timerPillText}>{t('Resend OTP in {time}', { time: `0:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}` })}</Text>
              ) : (
                <TouchableOpacity onPress={() => void handleResend()} disabled={isResending}>
                  <Text style={[styles.timerPillText, { textDecorationLine: 'underline' }]}>{isResending ? t('Sending…') : t('Resend OTP Now')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.8} onPress={() => setNotice(t('Codes on WhatsApp are not available yet. Use SMS.'))}>
            <MessageSquare color="#25D366" size={20} strokeWidth={2.5} />
            <Text style={styles.whatsappBtnText}>{t('Get OTP on WhatsApp')} 💬</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Container */}
      <View style={[styles.footerAction, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.verifyBtn, isVerifying && { backgroundColor: '#006c46' }]}
          onPress={() => void handleVerify()}
          disabled={isVerifying}
          activeOpacity={0.9}
        >
          {isVerifying ? (
            <Text style={styles.verifyBtnText}>{t('Verifying…')}</Text>
          ) : (
            <>
              <Verified color="#ffffff" size={22} strokeWidth={2} />
              <Text style={styles.verifyBtnText}>{t('Verify & Continue')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Lock color="#006c46" size={15} strokeWidth={2.5} />
          <Text style={styles.securityNoteText}>{t('Automatic SIM reading supported • Safe Tricity Login')}</Text>
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
    backgroundColor: '#f9f9ff'
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  tricityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 176, 116, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 116, 0.2)'
  },
  tricityBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#006c46',
    letterSpacing: -0.2
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8
  },
  iconBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0f3ff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 191, 0.2)',
    marginBottom: 16
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  pingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b074'
  },
  iconTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006c46',
    letterSpacing: 0.5
  },
  iconDesc: {
    fontSize: 13,
    color: '#3d4a41',
    marginTop: 2
  },
  titleSection: {
    marginBottom: 24
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111c2d',
    lineHeight: 32,
    letterSpacing: -0.2
  },
  subTitle: {
    fontSize: 14,
    color: '#3d4a41',
    marginTop: 4,
    lineHeight: 20
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006c46'
  },
  otpSection: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20
  },
  otpBoxWrapper: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#f0f3ff',
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 191, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  otpBoxFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  otpBoxActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
    // Missing the ring effect, but borderWidth=2 approximates it
  },
  otpBoxError: {
    borderColor: '#ef4444'
  },
  otpErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -10,
    marginBottom: 14
  },
  otpErrorText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444'
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111c2d'
  },
  otpHiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    padding: 0,
    ...noFocusRing
  },
  placeholderDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bccabf'
  },
  bottomDash: {
    position: 'absolute',
    bottom: 6,
    height: 2.5,
    borderRadius: 2
  },
  dashFilled: {
    width: 20,
    backgroundColor: '#00b074'
  },
  dashActive: {
    width: 24,
    backgroundColor: '#00b074'
  },
  dashEmpty: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(188, 202, 191, 0.5)'
  },
  audioWrap: {
    alignItems: 'center',
    marginBottom: 20
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e7eeff',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 116, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  audioBtnText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#111c2d'
  },
  resendCard: {
    backgroundColor: '#f0f3ff',
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 191, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14
  },
  resendLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3d4a41'
  },
  timerPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#e7eeff',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(188, 202, 191, 0.2)'
  },
  timerPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#006c46'
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  whatsappBtnText: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111c2d'
  },
  footerAction: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(188, 202, 191, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    backgroundColor: '#00b074',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  securityNoteText: {
    flexShrink: 1,
    fontSize: 13,
    color: '#3d4a41',
    textAlign: 'center'
  }
});
