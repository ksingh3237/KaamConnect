import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Wrench, Volume2, ChevronRight, Check, ArrowRight, ShieldCheck, Info } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { useSession } from '../store/useSession';
import { patchMe } from '../api/endpoints';

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage } = useStore();
  const signedIn = useSession((st) => st.status === 'signedIn');
  const insets = useSafeAreaInsets();
  // 'app' when opened from Profile or the Home menu by a signed-in user
  const { from } = useLocalSearchParams<{ from?: string }>();

  const handleContinue = () => {
    if (from === 'app' && router.canGoBack()) {
      // Remember the choice on the account too (best effort: the app already switched)
      if (signedIn) patchMe({ language }).catch(() => undefined);
      router.back();
    } else {
      router.push('/login');
    }
  };

  const handleSpeaker = () => {
    Alert.alert('🔊 Audio Assistance', 'Playing audio instructions in your chosen language.');
  };

  const ctaLabels = {
    en: "Continue in English • Continue",
    hi: "Continue in Selected Language • आगे बढ़ें",
    pa: "ਪੰਜਾਬੀ ਵਿੱਚ ਅੱਗੇ ਵਧੋ • ਅੱਗੇ ਵਧੋ"
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar: Logo & Tricity Region Badge */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBox}>
                <Wrench color="#FFFFFF" size={24} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.brandTitle}>
                  Kaam<Text style={{ color: '#00b074' }}>Connect</Text>
                </Text>
                <Text style={styles.brandSubtitle}>DIRECT MARKETPLACE</Text>
              </View>
            </View>

            {/* Tricity Badge */}
            <View style={styles.tricityBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.tricityBadgeText} numberOfLines={1}>Chd • Mohali • Pkl</Text>
            </View>
          </View>

          {/* Audio / Voice Guidance Helper Banner */}
          <TouchableOpacity style={styles.audioBanner} onPress={handleSpeaker} activeOpacity={0.9}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={styles.speakerIconBox}>
                <Volume2 color="#FFFFFF" size={20} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.audioTitle}>Tap speaker to hear instructions</Text>
                  <Text style={{ fontSize: 14 }}>🔊</Text>
                </View>
                <Text style={styles.audioSub}>बोलकर सुनने के लिए टैप करें • ਸੁਣਨ ਲਈ ਦਬਾਓ</Text>
              </View>
            </View>
            <ChevronRight color="#059669" size={20} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Main Title & Subtitle Section */}
          <View style={styles.titleSection}>
            <Text style={styles.titleMain}>Choose Your Language</Text>
            <Text style={styles.titleVernacular}>अपनी भाषा चुनें • ਆਪਣੀ ਬੋਲੀ ਚੁਣੋ</Text>
            <View style={styles.infoRow}>
              <Info color="#6c7a70" size={15} strokeWidth={2} />
              <Text style={styles.infoText}>
                You can change this anytime from Settings (सेटिंग्स से कभी भी बदल सकते हैं)
              </Text>
            </View>
          </View>

          {/* 3 Large Interactive Selectable Language Cards */}
          <View style={styles.cardsWrap}>
            {/* English */}
            <TouchableOpacity
              style={[styles.langCard, language === 'en' ? styles.cardActive : styles.cardInactive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.9}
            >
              <View style={styles.cardInner}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  <View style={[styles.langIconBox, language === 'en' ? styles.iconBoxActive : { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }]}>
                    <Text style={[styles.langIconText, language === 'en' ? { color: '#FFFFFF' } : { color: '#1e293b', fontSize: 18 }]}>
                      EN
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.langName, language === 'en' && { color: '#003a23' }]}>English</Text>
                      <View style={[styles.badge, language === 'en' ? styles.badgeActive : { backgroundColor: '#f1f5f9' }]}>
                        <Text style={[styles.badgeText, language === 'en' ? styles.badgeTextActive : { color: '#475569' }]}>
                          {language === 'en' ? 'Selected' : 'Default'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.langDesc, language === 'en' && { color: '#065f46' }]}>Default interface</Text>
                    <Text style={styles.langQuote}>"Post jobs and get direct calls"</Text>
                  </View>
                </View>
                <View style={[styles.radioCircle, language === 'en' ? styles.radioActive : styles.radioInactive]}>
                  {language === 'en' && <Check color="#FFFFFF" size={18} strokeWidth={3} />}
                  {language !== 'en' && <Check color="transparent" size={18} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Hindi */}
            <TouchableOpacity
              style={[styles.langCard, language === 'hi' ? styles.cardActive : styles.cardInactive]}
              onPress={() => setLanguage('hi')}
              activeOpacity={0.9}
            >
              <View style={styles.cardInner}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  <View style={[styles.langIconBox, language === 'hi' ? styles.iconBoxActive : { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }]}>
                    <Text style={[styles.langIconText, language === 'hi' ? { color: '#FFFFFF' } : { color: '#1e293b', fontSize: 24 }]}>
                      अ
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.langName, language === 'hi' && { color: '#003a23' }]}>हिंदी (Hindi)</Text>
                      {language === 'hi' && (
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeTextActive}>चयनित</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.langDesc, language === 'hi' && { color: '#065f46' }]}>आसान हिंदी माध्यम</Text>
                    <Text style={styles.langQuote}>"काम पोस्ट करें और सीधे कारीगर से बात करें"</Text>
                  </View>
                </View>
                <View style={[styles.radioCircle, language === 'hi' ? styles.radioActive : styles.radioInactive]}>
                  {language === 'hi' && <Check color="#FFFFFF" size={18} strokeWidth={3} />}
                  {language !== 'hi' && <Check color="transparent" size={18} />}
                </View>
              </View>
            </TouchableOpacity>

            {/* Punjabi */}
            <TouchableOpacity
              style={[styles.langCard, language === 'pa' ? styles.cardActive : styles.cardInactive]}
              onPress={() => setLanguage('pa')}
              activeOpacity={0.9}
            >
              <View style={styles.cardInner}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  <View style={[styles.langIconBox, language === 'pa' ? styles.iconBoxActive : { backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1 }]}>
                    <Text style={[styles.langIconText, language === 'pa' ? { color: '#FFFFFF' } : { color: '#78350f', fontSize: 24 }]}>
                      ੳ
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.langName, language === 'pa' && { color: '#003a23' }]}>ਪੰਜਾਬੀ (Punjabi)</Text>
                      <View style={[styles.badge, language === 'pa' ? styles.badgeActive : { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }]}>
                        <Text style={[styles.badgeText, language === 'pa' ? styles.badgeTextActive : { color: '#92400e' }]}>
                          {language === 'pa' ? 'ਚੁਣੀ ਗਈ' : 'ਖੇਤਰੀ'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.langDesc, language === 'pa' && { color: '#065f46' }]}>ਸੌਖੀ ਪੰਜਾਬੀ</Text>
                    <Text style={styles.langQuote}>"ਕੰਮ ਪੋਸਟ ਕਰੋ ਅਤੇ ਸਿੱਧਾ ਕਾਰੀਗਰ ਨਾਲ ਗੱਲ ਕਰੋ"</Text>
                  </View>
                </View>
                <View style={[styles.radioCircle, language === 'pa' ? styles.radioActive : styles.radioInactive]}>
                  {language === 'pa' && <Check color="#FFFFFF" size={18} strokeWidth={3} />}
                  {language !== 'pa' && <Check color="transparent" size={18} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Action Sticky Container */}
        <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.assuranceWrap}>
            <ShieldCheck color="#00b074" size={16} />
            <Text style={styles.assuranceText}>
              100% Free Direct Connect • ਕੋਈ ਕਮਿਸ਼ਨ ਨਹੀਂ • शून्य कमीशन
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>{ctaLabels[language]}</Text>
            <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
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
  mainWrapper: {
    flex: 1,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 8 : 16
  },
  scrollContent: {
    paddingBottom: 24
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111c2d',
    letterSpacing: -0.5,
    lineHeight: 20
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c7a70',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2
  },
  tricityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: 'rgba(167, 243, 208, 0.8)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexShrink: 1,
    maxWidth: '50%'
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b074'
  },
  tricityBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2
  },
  audioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdf4', // Simplified gradient to light emerald
    borderColor: '#a7f3d0',
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  speakerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  audioTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#022c22'
  },
  audioSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#047857',
    marginTop: 2
  },
  titleSection: {
    marginBottom: 16
  },
  titleMain: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111c2d',
    lineHeight: 24,
    marginBottom: 6
  },
  titleVernacular: {
    fontSize: 17,
    fontWeight: '700',
    color: '#006c46',
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#3d4a41',
    lineHeight: 18
  },
  cardsWrap: {
    gap: 14
  },
  langCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2
  },
  cardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardActive: {
    backgroundColor: 'rgba(236, 253, 245, 0.5)',
    borderColor: '#00b074',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  langIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBoxActive: {
    backgroundColor: '#00b074',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1
  },
  langIconText: {
    fontWeight: '800',
    fontFamily: 'sans-serif'
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  langName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111c2d',
    letterSpacing: -0.2
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999
  },
  badgeActive: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600'
  },
  badgeTextActive: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  langDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b'
  },
  langQuote: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginTop: 4,
    lineHeight: 18
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  radioInactive: {
    borderColor: '#cbd5e1',
    backgroundColor: 'transparent'
  },
  radioActive: {
    borderColor: '#00b074',
    backgroundColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  bottomContainer: {
    backgroundColor: '#f9f9ff'
  },
  assuranceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12
  },
  assuranceText: {
    flexShrink: 1,
    fontSize: 12,
    color: '#64748b'
  },
  primaryBtn: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#00b074',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10
  },
  primaryBtnText: {
    flexShrink: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3
  }
});
