import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '../store/useSession';
import { useStore } from '../store/useStore';
import { OPEN_TO_ALL_SEGMENTS, PUBLIC_SEGMENTS, destinationFor } from '../utils/session-routing';
import { resetTo } from '../utils/navigation';
import DialogHost from '../components/DialogHost';

// Restores the stored login once, then keeps the person on the right side of the sign-in wall:
//  - signed out on a screen that needs a login -> the welcome screen;
//  - signed in on a welcome/login screen -> straight to their marketplace (or role selection if they have no profile).
function SessionGate({ children }: { children: React.ReactNode }) {
  const { status, user, bootstrap } = useSession();
  const segments = useSegments();
  const top = (segments[0] as string | undefined) ?? '';
  // The redirect last asked for, so a re-render before the navigation lands cannot fire it twice
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    let target: Href | null = null;
    if (status === 'signedOut' && !PUBLIC_SEGMENTS.has(top)) {
      target = '/';
    } else if (status === 'signedIn' && user && PUBLIC_SEGMENTS.has(top) && !OPEN_TO_ALL_SEGMENTS.has(top)) {
      // Read the role once here (not as a dependency): setting it must not re-run this redirect
      const dest = destinationFor(user, useStore.getState().role);
      if (dest.role) useStore.getState().setRole(dest.role);
      target = dest.href;
    }
    if (!target) {
      lastRedirect.current = null;
      return;
    }
    const key = `${status}|${top}|${JSON.stringify(target)}`;
    if (lastRedirect.current === key) return;
    lastRedirect.current = key;
    // Clear the welcome/login screens (or the signed-in screens) underneath, so Back cannot return into them
    resetTo(target);
  }, [status, user, top]);

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
          <Stack.Screen name="legal" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </SessionGate>
      <DialogHost />
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
