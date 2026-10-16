import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../../constants/theme';
import { ShimmerBlock, ShimmerCircle } from '../Shimmer';

export function WorkerCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Finding artisans">
          <View style={styles.top}>
            <ShimmerCircle size={52} />
            <View style={styles.info}>
              <ShimmerBlock width="55%" height={14} />
              <ShimmerBlock width={80} height={18} radius={Radius.full} />
              <ShimmerBlock width="40%" height={11} />
            </View>
          </View>
          <View style={styles.actions}>
            <ShimmerBlock width="48%" height={40} radius={Radius.md} />
            <ShimmerBlock width="48%" height={40} radius={Radius.md} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: 14 },
  top: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  info: { flex: 1, gap: 7, justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
});
