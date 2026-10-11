import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '../store/useSession';
import { useStore } from '../store/useStore';
import { PUBLIC_SEGMENTS, destinationFor } from '../utils/session-routing';

// Restores the stored login once, then keeps the person on the right side of the sign-in wall:
//  - signed out on a screen that needs a login -> the welcome screen;
//  - signed in on a welcome/login screen -> straight to their marketplace (or role selection if they have no profile).
function SessionGate({ children }: { children: React.ReactNode }) {
  const { status, user, bootstrap } = useSession();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const segments = useSegments();
  const top = (segments[0] as string | undefined) ?? '';

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'signedOut' && !PUBLIC_SEGMENTS.has(top)) {
      router.replace('/');
    } else if (status === 'signedIn' && user && PUBLIC_SEGMENTS.has(top) && top !== 'language') {
      const dest = destinationFor(user, role);
      if (dest.role) setRole(dest.role);
      router.replace(dest.href);
    }
  }, [status, user, top, role, setRole]);

  if (status === 'booting') {
    return (
      <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel="Starting KaamConnect">
        <ActivityIndicator color="#00B074" size="large" />
        <Text style={styles.centerText}>KaamConnect</Text>
      </View>
    );
  }
  if (status === 'unreachable') {
    return (
      <View style={styles.center} accessibilityRole="alert">
        <Text style={styles.centerTitle}>Cannot reach the server</Text>
        <Text style={styles.centerText}>Your login is saved. Check that the backend is running and your connection, then try again.</Text>
        <TouchableOpacity style={styles.retry} onPress={() => void bootstrap()} accessibilityRole="button">
          <Text style={styles.retryText}>Try again / दोबारा कोशिश करें</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FAFC' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="language" />
          <Stack.Screen name="login" />
          <Stack.Screen name="otp" />
          <Stack.Screen name="role" />
          <Stack.Screen name="customer-onboarding" />
          <Stack.Screen name="worker-onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lead-offer" />
          <Stack.Screen name="compare-offers" />
          <Stack.Screen name="tracking" />
          <Stack.Screen name="job-progress" />
          <Stack.Screen name="rating" />
          <Stack.Screen name="carousel" />
        </Stack>
      </SessionGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#F8FAFC' },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#111C2D' },
  centerText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  retry: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 999, backgroundColor: '#00B074' },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
});
