// Terms & Conditions and Privacy Policy in plain words (?doc=terms | privacy). Reachable from the Home menu and the
// login screen, signed in or not. This is a readable summary of how the app works today; have it reviewed by a
// lawyer before launch. Shown in the language the person chose.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Lock } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useT } from '../i18n/useT';

type Doc = 'terms' | 'privacy';
type Section = { title: string; intro: string; points: { h: string; p: string }[] };

function sections(t: (text: string) => string): Record<Doc, Section> {
  return {
    terms: {
      title: t('Terms & Conditions'),
      intro: t('KaamConnect connects households in Chandigarh, Mohali and Panchkula directly with local workers. By using the app you agree to these simple rules.'),
      points: [
        { h: t('0% platform fee'), p: t('KaamConnect takes no commission from customers or workers. The price you agree with the worker is the price you pay.') },
        {
          h: t('Direct payment'),
          p: t('You pay the worker yourself, in cash or by UPI, when the work is done. KaamConnect never holds or moves your money; it only records that a payment was made.'),
        },
        {
          h: t('Direct contact'),
          p: t('Customers and workers talk to each other directly. Your full address is shown only to the worker you choose, after you accept their offer.'),
        },
        {
          h: t('The agreement is between you and the worker'),
          p: t('Workers are independent, not KaamConnect employees. Agree on the work and the cost before it starts, and check the bill in the app before you approve it.'),
        },
        {
          h: t('Verified workers'),
          p: t('Workers upload Aadhaar for verification before they receive jobs. Verification lowers risk but cannot guarantee the quality of every job, so read ratings and reviews.'),
        },
        {
          h: t('Be fair and safe'),
          p: t('Give honest ratings, do not post fake jobs or offers, and treat each other with respect. Use the SOS button during a job if you feel unsafe. Accounts that misuse the app can be disabled.'),
        },
        { h: t('Cancelling'), p: t('Cancel as early as you can if your plans change, so the other person is not left waiting.') },
        { h: t('Changes'), p: t('These terms may be updated as the app grows. We will show the new version in the app.') },
      ],
    },
    privacy: {
      title: t('Privacy Policy'),
      intro: t('We collect only what is needed to connect you with a worker or a customer, and we never sell your data.'),
      points: [
        {
          h: t('What we collect'),
          p: t('Your mobile number (to sign you in with an OTP), your name, your sector and address, photos you add to a job, and your ratings. Workers also share their trade, experience, profile photo and Aadhaar for verification.'),
        },
        {
          h: t('Location'),
          p: t('Your location is used only to find workers or jobs near you. A worker’s position is shared with the customer only while that worker is on the way to the job.'),
        },
        {
          h: t('Who sees what'),
          p: t('Workers nearby see the job, the sector and the photos, never your phone number or full address. Only the worker whose offer you accept sees your address, and your number too if you allow direct calls. Aadhaar documents are kept in private storage, used only for verification and never shown to customers.'),
        },
        { h: t('No selling, no ads'), p: t('We do not sell or rent your personal data, and we do not share it with advertisers.') },
        { h: t('Security'), p: t('Photos and documents are only available through short-lived private links, and sign-in codes are never stored in readable form.') },
        {
          h: t('Your choices'),
          p: t('You can change your profile at any time, and you can delete your account from Profile. Deleting removes your personal details from the app.'),
        },
        { h: t('Messages'), p: t('We send an SMS only for your sign-in code.') },
      ],
    },
  };
}

export default function LegalScreen() {
  const t = useT();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const which: Doc = doc === 'privacy' ? 'privacy' : 'terms';
  const content = sections(t)[which];
  const Icon = which === 'privacy' ? Lock : FileText;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('Go back')}
        >
          <ArrowLeft color={Colors.textMain} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{content.title}</Text>
          <Text style={styles.headerSub}>KaamConnect</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon color="#FFFFFF" size={26} />
          </View>
          <Text style={styles.intro}>{content.intro}</Text>
        </View>

        {content.points.map((point, i) => (
          <View key={i} style={styles.point}>
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointTitle}>{point.h}</Text>
              <Text style={styles.pointText}>{point.p}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.switch}
          onPress={() => router.setParams({ doc: which === 'terms' ? 'privacy' : 'terms' })}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.switchText}>{which === 'terms' ? t('Read the Privacy Policy →') : t('Read the Terms & Conditions →')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textMain },
  headerSub: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  hero: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { flex: 1, fontSize: 15, lineHeight: 22, color: Colors.onPrimaryContainer, fontWeight: '600' },
  point: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 14, fontWeight: '800', color: Colors.primaryDark },
  pointTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain, marginBottom: 4 },
  pointText: { fontSize: 14, lineHeight: 21, color: Colors.textMuted },
  switch: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  switchText: { fontSize: 14, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
});
