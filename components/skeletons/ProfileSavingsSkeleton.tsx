import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '../../constants/theme';
import { ShimmerBlock } from '../Shimmer';

// Stands in for the whole green savings banner while the savings figure loads.
export function ProfileSavingsSkeleton() {
  return (
    <View style={styles.banner} accessibilityRole="progressbar" accessibilityLabel="Loading savings">
      <View style={styles.header}>
        <ShimmerBlock width="55%" height={13} />
        <ShimmerBlock width={72} height={18} radius={Radius.full} />
      </View>
      <ShimmerBlock width="40%" height={28} style={styles.amount} />
      <ShimmerBlock width="100%" height={10} />
      <ShimmerBlock width="70%" height={10} style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#ECFDF5', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1.5, borderColor: '#86EFAC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  amount: { marginVertical: 10 },
  line: { marginTop: 6 },
});
