import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Compass, Plus, ClipboardList, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { listLeads } from '../../api/endpoints';
import { useSession } from '../../store/useSession';
import { usePresenceLocation } from '../../utils/usePresenceLocation';
import { useT } from '../../i18n/useT';
import OfferToastHost from '../../components/OfferToastHost';

export default function TabLayout() {
  const { role } = useStore();
  const t = useT();
  const isWorker = role === 'worker';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workerProfile } = useSession();
  // Leads follow where the worker is now, so tell the server while the app is open and they are taking jobs
  usePresenceLocation(isWorker && workerProfile?.verificationStatus === 'VERIFIED' && workerProfile.isAvailable);

  const openNewestLead = async () => {
    try {
      const page = await listLeads({ filter: 'all' });
      const lead = page.items.find((l) => l.leadState !== 'DECLINED');
      if (lead) {
        router.push({ pathname: '/lead-offer', params: { id: lead.id } });
        return;
      }
    } catch {
      // offline or server trouble: the radar shows the error with a retry
    }
    router.navigate('/(tabs)/leads');
  };

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: Colors.border,
            // Icon (28) + label (15) + item padding need ~54px; anything less clips the labels
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 4
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700'
          }
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('Home'),
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="leads"
          options={{
            title: isWorker ? t('Leads') : t('Services'),
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="post-job"
          listeners={{
            // Workers send quotes, they don't post jobs: the middle button opens the quote screen for the newest lead
            // they have not declined, or their lead radar when there is none (a quote always needs a real lead)
            tabPress: (e) => {
              if (isWorker) {
                e.preventDefault();
                void openNewestLead();
              }
            }
          }}
          options={{
            title: isWorker ? t('Quote') : t('Post'),
            tabBarIcon: ({ color }) => (
              <View style={styles.postCta}>
                <Plus color="#FFFFFF" size={26} strokeWidth={3} />
              </View>
            ),
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: '800',
              color: Colors.primary
            }
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: t('Activity'),
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('Profile'),
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />
          }}
        />
      </Tabs>
      {/* Customer side: new quotes pop up over every tab, one at a time */}
      {!isWorker && <OfferToastHost />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  postCta: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  }
});
