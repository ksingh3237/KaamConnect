import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { ShimmerBlock } from '../Shimmer';

export function LeadCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Looking for requests">
          <View style={styles.row}>
            <ShimmerBlock width={90} height={18} radius={Radius.full} />
            <ShimmerBlock width={50} height={11} />
          </View>
          <ShimmerBlock width="75%" height={15} style={styles.gap} />
          <ShimmerBlock width="50%" height={11} style={styles.gap} />
          <ShimmerBlock width="100%" height={11} style={styles.gap} />
          <View style={[styles.row, styles.gap]}>
            <ShimmerBlock width="48%" height={42} radius={Radius.md} />
            <ShimmerBlock width="48%" height={42} radius={Radius.md} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderLeftWidth: 4, borderLeftColor: Colors.border, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: 14, marginBottom: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gap: { marginTop: 10 },
});
