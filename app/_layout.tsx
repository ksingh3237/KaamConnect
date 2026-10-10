import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: 'slide_from_right'
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
    </SafeAreaProvider>
  );
}
