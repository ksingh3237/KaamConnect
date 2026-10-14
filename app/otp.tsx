import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, MailCheck, Edit2, Volume2, Clock, MessageSquare, Verified, Lock, AlertCircle } from 'lucide-react-native';
import LanguageToggle from '../components/LanguageToggle';
import { noFocusRing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useSession } from '../store/useSession';
import { isApiError, userMessage } from '../api/errors';
import { AUTH_MODE, firebaseFlow } from '../api/phoneSignIn';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mobile } = useStore();
  const { verifyOtp, requestOtp, devNotice, resendAfterSec } = useSession();
  // The whole code lives in ONE hidden input; the six boxes only display it.
  // Six separate inputs need focus hand-offs, which drop keystrokes when typing fast
  // and leave earlier boxes empty when a box in the middle is tapped first.
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendAfterSec);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showError, setShowError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  // The development notice names the fixed code; the button below only fills it in, it never signs anyone in
  const devCode = devNotice?.match(/\b(\d{6})\b/)?.[1] ?? null;

  const input = useRef<TextInput>(null);
  // Mirrors isVerifying for callbacks that outlive a render (the Android auto-verification listener below)
  const verifying = useRef(false);

  useEffect(() => {
    if (!mobile) router.replace('/login');
  }, [mobile, router]);

  useEffect(() => {
    if (secondsLeft > 0) {
      const timerId = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [secondsLeft]);

  // Accepts typing, backspace, paste and SMS autofill alike
  const handleCodeChange = (text: string) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
    setShowError(false);
    setApiError(null);
  };

  // Android can read the SMS and verify the number by itself. Finish the sign-in then, without waiting for the person to
  // type; `verifying` stops it from racing a manual Verify. The code argument is not needed once Firebase has signed in.
  useEffect(() => {
    if (AUTH_MODE !== 'firebase') return;
    return firebaseFlow.onAutoVerified(() => {
      if (verifying.current) return;
      verifying.current = true;
      setIsVerifying(true);
      setApiError(null);
      verifyOtp(mobile, '')
        .catch((error) => setApiError(userMessage(error)))
        .finally(() => {
          verifying.current = false;
          setIsVerifying(false);
        });
    });
  }, [mobile, verifyOtp]);

  // On success the session store flips to "signed in" and the root layout moves the person to the right screen
  // (role selection for a new account, the marketplace otherwise), so there is nothing to navigate to here.
  const handleVerify = async () => {
    if (isVerifying || verifying.current) return;
    if (code.length < OTP_LENGTH) {
      setShowError(true);
      input.current?.focus();
      return;
    }
    verifying.current = true;
    setIsVerifying(true);
    setApiError(null);
    try {
      await verifyOtp(mobile, code);
    } catch (error) {
      setApiError(userMessage(error));
      if (isApiError(error) && ['OTP_INVALID', 'OTP_LOCKED', 'FIREBASE_TOKEN_STALE', 'FIREBASE_TOKEN_INVALID'].includes(error.code)) setCode('');
      input.current?.focus();
    } finally {
      verifying.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setApiError(null);
    setNotice(null);
    try {
      const result = await requestOtp(mobile);
      setSecondsLeft(result.resendAfterSec);
      setNotice('A new code has been sent. / नया कोड भेज दिया गया');
    } catch (error) {
      if (isApiError(error) && error.retryAfterSec) setSecondsLeft(error.retryAfterSec);
      setApiError(userMessage(error));
    } finally {
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
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#111c2d" size={22} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.tricityBadge}>
            <MapPin color="#006c46" size={15} strokeWidth={2.5} />
            <Text style={styles.tricityBadgeText}>Tricity Chandigarh • Mohali • Panchkula</Text>
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
              <Text style={styles.iconTitle}>DIRECT WORKER NETWORK</Text>
            </View>
            <Text style={styles.iconDesc}>Instant Verification • 0% Commission Platform</Text>
          </View>
        </View>

        {/* Title & Subtitle Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>
            Verify Phone Number <Text style={{ color: '#006c46' }}>/</Text> <Text style={{ fontSize: 20, color: '#3d4a41', fontWeight: '700' }}>ओटीपी सत्यापन</Text>
          </Text>
          <Text style={styles.subTitle}>
            Enter 6-digit code sent to <Text style={{ fontWeight: '600', color: '#111c2d' }}>+91 {mobile}</Text>
          </Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' }}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/login')}
          >
            <Edit2 color="#006c46" size={15} strokeWidth={2.5} />
            <Text style={styles.editLink}>Edit Number (बदलें)</Text>
          </TouchableOpacity>
        </View>

        {devNotice && (
          <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, gap: 6 }} accessibilityRole="alert">
            <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>DEVELOPMENT MODE</Text>
            <Text style={{ color: '#92400E', fontSize: 13, lineHeight: 18 }}>{devNotice}</Text>
            {devCode && (
              <TouchableOpacity onPress={() => handleCodeChange(devCode)} accessibilityRole="button" style={{ alignSelf: 'flex-start', backgroundColor: '#F59E0B', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Fill test code {devCode}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 6-Digit OTP Input Boxes */}
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
            accessibilityLabel="Enter 6-digit OTP"
          />
        </View>

        {showError && (
          <View style={styles.otpErrorRow}>
            <AlertCircle color="#ef4444" size={14} />
            <Text style={styles.otpErrorText}>Enter the 6-digit code / 6 अंकों का कोड डालें</Text>
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
          <TouchableOpacity style={styles.audioBtn} activeOpacity={0.8} onPress={() => Alert.alert('🔊', 'Playing OTP Audio...')}>
            <Volume2 color="#006c46" size={19} strokeWidth={2.5} />
            <Text style={styles.audioBtnText}>Audio code help available / आवाज द्वारा ओटीपी सुनें 🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Resend Timer & WhatsApp Backup Card */}
        <View style={styles.resendCard}>
          <View style={styles.resendRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock color="#006c46" size={18} strokeWidth={2.5} />
              <Text style={styles.resendLabel}>Didn't receive SMS?</Text>
            </View>
            <View style={styles.timerPill}>
              {secondsLeft > 0 ? (
                <Text style={styles.timerPillText}>Resend OTP in 0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}s</Text>
              ) : (
                <TouchableOpacity onPress={() => void handleResend()} disabled={isResending}>
                  <Text style={[styles.timerPillText, { textDecorationLine: 'underline' }]}>{isResending ? 'Sending…' : 'Resend OTP Now'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.8} onPress={() => setNotice('WhatsApp OTP is not available yet. Please use the SMS code. / व्हाट्सएप ओटीपी अभी उपलब्ध नहीं है')}>
            <MessageSquare color="#25D366" size={20} strokeWidth={2.5} />
            <Text style={styles.whatsappBtnText}>Get OTP on WhatsApp / व्हाट्सएप पर पाएं 💬</Text>
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
            <Text style={styles.verifyBtnText}>Verifying / जांच हो रही है...</Text>
          ) : (
            <>
              <Verified color="#ffffff" size={22} strokeWidth={2} />
              <Text style={styles.verifyBtnText}>Verify & Continue / सत्यापित करें</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Lock color="#006c46" size={15} strokeWidth={2.5} />
          <Text style={styles.securityNoteText}>Automatic SIM reading supported • Safe Tricity Login</Text>
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
    fontSize: 11,
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
    lineHeight: 30,
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
    fontSize: 11,
    color: '#3d4a41',
    textAlign: 'center'
  }
});
