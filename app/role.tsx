import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, UserSearch, Wrench, Check, ArrowRight, RefreshCw, BadgeInfo, Zap, CircleDollarSign, Verified, Lock, UserCog } from 'lucide-react-native';
import { useStore, UserRole } from '../store/useStore';

export default function RoleScreen() {
  const router = useRouter();
  const { role, setRole } = useStore();

  const handleContinue = () => {
    if (role === 'worker') {
      router.push('/worker-onboarding');
    } else {
      router.push('/customer-onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Utility Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <UserCog color="#ffffff" size={20} strokeWidth={2} />
          </View>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.headerBrand}>KaamConnect</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <View style={styles.tricityDot} />
              <Text style={styles.headerSub}>Tricity • Chandigarh • Mohali • Panchkula</Text>
            </View>
          </View>
        </View>

        <View style={styles.langToggle}>
          <View style={styles.langPillActive}>
            <Text style={styles.langPillActiveText}>ENG</Text>
          </View>
          <View style={styles.langPillInactive}>
            <Text style={styles.langPillInactiveText}>हिंदी</Text>
          </View>
          <View style={styles.langPillInactive}>
            <Text style={styles.langPillInactiveText}>ਪੰਜਾਬੀ</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Header Section */}
        <View style={styles.titleSection}>
          <View style={styles.stepBadge}>
            <BadgeInfo color="#006c46" size={14} strokeWidth={2.5} />
            <Text style={styles.stepBadgeText}>Step 1 of 2 • भूमिका चयन</Text>
          </View>
          <Text style={styles.mainTitle}>
            How will you use KaamConnect?
          </Text>
          <Text style={styles.mainTitleHindi}>
            आप ऐप का उपयोग कैसे करेंगे?
          </Text>
          <Text style={styles.subTitle}>
            Choose your primary role. You can switch between modes anytime from your profile.
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.cardsWrap}>
          {/* CARD 1: Customer Card */}
          <TouchableOpacity
            style={[styles.roleCard, role === 'customer' ? styles.cardActive : styles.cardInactive]}
            onPress={() => setRole('customer')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={[styles.cardIconBox, { backgroundColor: '#cce5ff' }]}>
                  <UserSearch color="#006398" size={28} strokeWidth={1.5} />
                </View>
                <View>
                  <Text style={[styles.cardTag, { color: '#006398' }]}>Customer / ग्राहक</Text>
                  <Text style={styles.cardTitle}>I Need a Service</Text>
                  <Text style={styles.cardSubtitle}>मुझे काम करवाना है</Text>
                </View>
              </View>

              <View style={[styles.radioCircle, role === 'customer' ? styles.radioActive : styles.radioInactive]}>
                {role === 'customer' && <Check color="#ffffff" size={16} strokeWidth={3} />}
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={[styles.highlightBadge, { backgroundColor: '#f0f3ff' }]}>
                <Zap color="#006398" size={14} strokeWidth={2} />
                <Text style={[styles.highlightBadgeText, { color: '#006398' }]}>
                  Find Electrician, Plumber, Cleaner & more
                </Text>
              </View>
            </View>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={styles.benefitText}>Post free jobs & get fast Tricity responses</Text>
              </View>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={styles.benefitText}>Receive competitive worker bids with verified ratings</Text>
              </View>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={styles.benefitText}>0% commission • Pay worker directly via Cash / UPI</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* CARD 2: Worker Card */}
          <TouchableOpacity
            style={[styles.roleCard, role === 'worker' ? styles.cardActive : styles.cardInactive]}
            onPress={() => setRole('worker')}
            activeOpacity={0.9}
          >
            {/* Ambient Recommended Tag */}
            <View style={styles.recBadge}>
              <Verified color="#ffffff" size={12} strokeWidth={2.5} />
              <Text style={styles.recBadgeText}>Recommended</Text>
            </View>

            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={[styles.cardIconBox, { backgroundColor: '#00b074', shadowColor: '#00b074', shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 }]}>
                  <Wrench color="#ffffff" size={26} strokeWidth={1.5} />
                </View>
                <View>
                  <Text style={[styles.cardTag, { color: '#006c46' }]}>Worker / Skilled Professional (कारीगर)</Text>
                  <Text style={styles.cardTitle}>I Provide a Service</Text>
                  <Text style={styles.cardSubtitle}>मैं कारीगर / काम करता हूँ</Text>
                </View>
              </View>

              <View style={[styles.radioCircle, role === 'worker' ? styles.radioActive : styles.radioInactive]}>
                {role === 'worker' && <Check color="#ffffff" size={16} strokeWidth={3} />}
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={[styles.highlightBadge, { backgroundColor: 'rgba(115, 251, 184, 0.3)', borderColor: 'rgba(0, 176, 116, 0.3)', borderWidth: 1 }]}>
                <CircleDollarSign color="#006c46" size={14} strokeWidth={2} />
                <Text style={[styles.highlightBadgeText, { color: '#003a23' }]}>
                  0% Commission • 100% सीधा मुनाफा
                </Text>
              </View>
            </View>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={[styles.benefitText, { color: '#111c2d', fontWeight: '500' }]}>Get direct local customer leads in Chandigarh Tricity</Text>
              </View>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={[styles.benefitText, { color: '#111c2d', fontWeight: '500' }]}>Keep 100% of your earnings • Set your own price</Text>
              </View>
              <View style={styles.benefitItem}>
                <ShieldCheck color="#00b074" size={16} strokeWidth={2} />
                <Text style={[styles.benefitText, { color: '#111c2d', fontWeight: '500' }]}>Direct customer calling with no middleman cuts</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Container */}
      <View style={styles.footerWrap}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>
            Continue as {role === 'worker' ? 'Worker' : 'Customer'} • आगे बढ़ें
          </Text>
          <ArrowRight color="#ffffff" size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.reassuranceNote}>
          <RefreshCw color="#00b074" size={16} strokeWidth={2} />
          <Text style={styles.reassuranceText}>Toggle freely between Worker and Customer mode anytime</Text>
        </View>

        <View style={styles.trustStamp}>
          <Verified color="#006c46" size={14} strokeWidth={2} />
          <Text style={styles.trustStampText}>Aadhaar-verified & trusted community in Chandigarh, Mohali & Panchkula</Text>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e7eeff'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: '800',
    color: '#006c46',
    letterSpacing: -0.5,
    lineHeight: 18
  },
  tricityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b074'
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6c7a70',
    letterSpacing: 0.5
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#e7eeff',
    borderRadius: 9999
  },
  langPillActive: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  langPillActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006c46'
  },
  langPillInactive: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999
  },
  langPillInactiveText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3d4a41'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 20
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#e7eeff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006c46',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111c2d',
    lineHeight: 28,
    letterSpacing: -0.5
  },
  mainTitleHindi: {
    fontSize: 18,
    fontWeight: '700',
    color: '#006c46',
    lineHeight: 26,
    marginTop: 2
  },
  subTitle: {
    fontSize: 13,
    color: '#3d4a41',
    marginTop: 6,
    lineHeight: 18
  },
  cardsWrap: {
    gap: 16
  },
  roleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    position: 'relative'
  },
  cardInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e7eeff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#00b074',
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8
  },
  recBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00b074',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10
  },
  recBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111c2d',
    lineHeight: 20
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3d4a41',
    marginTop: 2
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  radioInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#bccabf'
  },
  radioActive: {
    backgroundColor: '#00b074',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  highlightBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  benefitsList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f3ff',
    gap: 8
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  benefitText: {
    flex: 1,
    fontSize: 12.5,
    color: '#3d4a41',
    lineHeight: 18
  },
  footerWrap: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'web' ? 12 : 24,
    alignItems: 'center'
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 56,
    backgroundColor: '#00b074',
    borderRadius: 12,
    shadowColor: '#00b074',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  reassuranceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12
  },
  reassuranceText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6c7a70'
  },
  trustStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  trustStampText: {
    fontSize: 11,
    color: '#6c7a70'
  }
});
