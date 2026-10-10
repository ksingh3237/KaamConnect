import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
  LogOut
} from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useStore, Language } from '../../store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { role, toggleRole, language, setLanguage, commissionSaved } = useStore();
  const isWorker = role === 'worker';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <Text style={styles.headerSubtitle}>KaamConnect Direct Account</Text>
        </View>
        {/* Vernacular Mini Selector */}
        <View style={styles.langSelector}>
          {(['en', 'hi', 'pa'] as Language[]).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.langBtn,
                language === lang && styles.langBtnActive
              ]}
              onPress={() => setLanguage(lang)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.langBtnText,
                  language === lang && styles.langBtnTextActive
                ]}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'ਪੰ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{isWorker ? '🛠️' : '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>
                  {isWorker ? 'Rajesh Kumar (Worker)' : 'Sunita Sharma (Customer)'}
                </Text>
                <ShieldCheck color={Colors.primary} size={16} />
              </View>
              <Text style={styles.userPhone}>
                +91 98765 43210 • Sector 22, Chandigarh
              </Text>
              <View style={styles.aadhaarPill}>
                <Text style={styles.aadhaarPillText}>Aadhaar Verified Citizen</Text>
              </View>
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
          <Text style={styles.savingsAmount}>₹{commissionSaved.toLocaleString()}.00</Text>
          <Text style={styles.savingsNote}>
            Money saved by connecting directly with local artisans without middleman commission!
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
              onPress={toggleRole}
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
            onPress={() => router.push('/language')}
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
            onPress={() => alert('Dialing Tricity KaamConnect Safety Desk: 1800-KAAM-CONNECT')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: '#FEE2E2' }]}>
                <PhoneCall color={Colors.error} size={18} />
              </View>
              <Text style={styles.menuText}>24x7 Tricity Safety & Support Helpline</Text>
            </View>
            <ChevronRight color="#94A3B8" size={18} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <LogOut color={Colors.error} size={16} />
          <Text style={styles.logoutBtnText}>Log Out of KaamConnect</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    padding: 2
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full
  },
  langBtnActive: {
    backgroundColor: Colors.primary
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted
  },
  langBtnTextActive: {
    color: '#FFFFFF'
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
    marginBottom: 4
  },
  savingsTitle: {
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  menuLeft: {
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
  }
});
