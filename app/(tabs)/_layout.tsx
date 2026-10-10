import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Compass, Plus, ClipboardList, User } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function TabLayout() {
  const { role } = useStore();
  const isWorker = role === 'worker';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: isWorker ? 'Leads' : 'Services',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: isWorker ? 'Quote' : 'Post',
          tabBarIcon: ({ color }) => (
            <View style={styles.postCta}>
              <Plus color="#FFFFFF" size={26} strokeWidth={3} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            color: Colors.primary
          }
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
