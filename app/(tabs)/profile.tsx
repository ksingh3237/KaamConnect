import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  MapPin,
  Globe,
  Sparkles,
  PhoneCall,
  ChevronRight,
  RefreshCw,
  LogOut,
  Trash2
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import LanguageToggle from '../../components/LanguageToggle';
import { useStore } from '../../store/useStore';
import { resetTo } from '../../utils/navigation';
import { useSession } from '../../store/useSession';
import { useAsync } from '../../api/useAsync';
import { getSavings } from '../../api/endpoints';
import Avatar from '../../components/Avatar';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { ErrorBlock } from '../../components/StateBlocks';

export default function ProfileScreen() {
  const router = useRouter();
  const { role, setRole, language } = useStore();
  const { me, user, signOut, customerProfile, workerProfile } = useSession();
  const isWorker = role === 'worker';
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savings = useAsync(() => getSavings(isWorker ? 'worker' : 'customer'), [isWorker]);

  const profile = isWorker ? workerProfile : customerProfile;
  const displayName = profile?.fullName ?? (isWorker ? me?.worker?.fullName : me?.customer?.fullName) ?? 'Your name';
  const phone = (user?.phone ?? me?.phone ?? '').replace(/^\+91/, '+91 ');
  const place = isWorker ? workerProfile?.baseArea.name : customerProfile?.addresses.find((a) => a.isPrimary)?.area.name ?? customerProfile?.addresses[0]?.area.name;
  const verified = isWorker ? me?.worker?.verificationStatus === 'VERIFIED' : false;

  // Switching to a side that has no profile yet starts that side's setup instead of showing an empty screen
  const handleSwitchRole = () => {
    const next = isWorker ? 'customer' : 'worker';
    const hasProfile = next === 'worker' ? me?.worker : me?.customer;
    setRole(next);
    if (!hasProfile) router.push(next === 'worker' ? '/worker-onboarding' : '/customer-onboarding');
  };

  // Ends the login on the server too, then resets the stack so Back can't return to a signed-in screen
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    resetTo('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerSubtitle}>KaamConnect Direct Account</Text>
        </View>
        {/* Vernacular Mini Selector */}
        <LanguageToggle style={styles.langSelector} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Avatar uri={profile?.photoUrl} size={52} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {displayName} ({isWorker ? 'Worker' : 'Customer'})
                </Text>
                {verified && <ShieldCheck color={Colors.primary} size={16} />}
              </View>
              <Text style={styles.userPhone}>
                {phone}{place ? ` • ${place}` : ''}
              </Text>
              {isWorker && me?.worker && (
                <View style={styles.aadhaarPill}>
                  <Text style={styles.aadhaarPillText}>
                    {me.worker.verificationStatus === 'VERIFIED' ? 'Aadhaar Verified' : me.worker.verificationStatus === 'REJECTED' ? 'Verification rejected' : 'Verification pending'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Zero-Commission Cumulative Savings Banner */}
        <View style={styles.savingsBanner}>
          <View style={styles.savingsHeader}>
            <Text style={styles.savingsTitle}>0% Commission Charter Savings</Text>
            <View style={styles.savedPill}>
              <Text style={styles.savedPillText}>TOTAL SAVED</Text>
            </View>
          </View>
          {savings.error && !savings.data ? (
            <ErrorBlock message={savings.error} onRetry={() => void savings.reload()} />
          ) : (
            <Text style={styles.savingsAmount}>{savings.data ? `₹${savings.data.commissionSaved.toLocaleString('en-IN')}.00` : '…'}</Text>
          )}
          <Text style={styles.savingsNote}>
            {savings.data
              ? `Across ${savings.data.jobsCount} completed ${savings.data.jobsCount === 1 ? 'job' : 'jobs'}, compared with a typical ${Math.round(savings.data.benchmarkRate * 100)}% marketplace commission.`
              : 'Money saved by connecting directly with local artisans without middleman commission!'}
          </Text>
        </View>

        {/* Role Toggle Section */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
              <Text style={styles.modeTitle}>
                Active App Mode:{' '}
                <Text style={{ color: Colors.primary }}>
                  {isWorker ? 'Worker Pro (कारीगर)' : 'Customer (ग्राहक)'}
                </Text>
              </Text>
              <Text style={styles.modeSubtitle}>
                Switch anytime between providing and ordering services
              </Text>
            </View>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={handleSwitchRole}
              activeOpacity={0.8}
            >
              <RefreshCw color="#FFFFFF" size={13} />
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Navigation List */}
        <View style={[styles.card, { paddingVertical: 4 }]}>
          {/* Saved Addresses */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/customer-onboarding')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#E0F2FE' }]}>
                <MapPin color={Colors.tertiary} size={18} />
              </View>
              <Text style={styles.menuText}>Saved Tricity Addresses (पता प्रबंधन)</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* Change Language */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push({ pathname: '/language', params: { from: 'app' } })}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Globe color={Colors.secondary} size={18} />
              </View>
              <Text style={styles.menuText}>
                Language: <Text style={{ fontWeight: '800' }}>{language.toUpperCase()}</Text> (भाषा बदलें)
              </Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* Welcome Highlights */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/carousel')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#EDE9FE' }]}>
                <Sparkles color="#8B5CF6" size={18} />
              </View>
              <Text style={styles.menuText}>Welcome Highlights & Tutorial</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>

          {/* 24x7 Safety Helpline */}
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => void Linking.openURL('tel:112')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
                <PhoneCall color={Colors.error} size={18} />
              </View>
              <Text style={styles.menuText}>Emergency helpline (112)</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => void handleLogout()}
          disabled={signingOut}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <LogOut color={Colors.error} size={16} />
          <Text style={styles.logoutBtnText}>{signingOut ? 'Logging out…' : 'Log Out of KaamConnect'}</Text>
        </TouchableOpacity>

        {/* Delete account: a quieter, separate action (docs/08 section 1) */}
        <TouchableOpacity
          style={styles.deleteLink}
          onPress={() => setDeleting(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
        >
          <Trash2 color={Colors.textMuted} size={14} />
          <Text style={styles.deleteLinkText}>Delete my account / खाता हटाएं</Text>
        </TouchableOpacity>

        <DeleteAccountModal visible={deleting} onClose={() => setDeleting(false)} onDeleted={() => { setDeleting(false); resetTo('/'); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textMain
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted
  },
  langSelector: {
    backgroundColor: '#F1F5F9',
    borderColor: '#F1F5F9'
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  avatarEmoji: {
    fontSize: 26
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  userName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textMain
  },
  userPhone: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2
  },
  aadhaarPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    marginTop: 6
  },
  aadhaarPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark
  },
  savingsBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#86EFAC'
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4
  },
  savingsTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46'
  },
  savedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary
  },
  savedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  savingsAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#047857',
    marginVertical: 4
  },
  savingsNote: {
    fontSize: 11,
    color: '#065F46'
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMain
  },
  modeSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  menuLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMain
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginTop: Spacing.sm
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.error
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10
  },
  deleteLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textDecorationLine: 'underline'
  }
});
