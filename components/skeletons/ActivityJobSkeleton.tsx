import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { ShimmerBlock } from '../Shimmer';

export function ActivityJobSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Loading your jobs">
          <View style={styles.row}>
            <ShimmerBlock width="60%" height={14} />
            <ShimmerBlock width={56} height={18} radius={Radius.full} />
          </View>
          <ShimmerBlock width="45%" height={11} style={styles.gap} />
          <View style={[styles.row, styles.gap]}>
            <ShimmerBlock width="31%" height={34} radius={Radius.md} />
            <ShimmerBlock width="31%" height={34} radius={Radius.md} />
            <ShimmerBlock width="31%" height={34} radius={Radius.md} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  gap: { marginTop: 10 },
});
