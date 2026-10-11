// The three non-happy states every data screen needs, in the app's own look: loading, failed (with a retry), empty.
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';

export function LoadingBlock({ label = 'Loading… / लोड हो रहा है…' }: { label?: string }) {
  return (
    <View style={styles.box} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={Colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.box, styles.errorBox]} accessibilityRole="alert">
      <AlertCircle color={Colors.error} size={22} />
      <Text style={[styles.text, { color: '#991B1B' }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retry} onPress={onRetry} accessibilityRole="button" accessibilityLabel="Try again">
          <Text style={styles.retryText}>Try again / दोबारा कोशिश करें</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.text}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  errorBox: { backgroundColor: Colors.errorLight, borderColor: '#FCA5A5' },
  text: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyTitle: { color: Colors.textMain, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  retry: { marginTop: Spacing.xs, paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.full, backgroundColor: Colors.primary },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
