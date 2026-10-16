import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../../constants/theme';
import { ShimmerBlock } from '../Shimmer';

// Same 2-column card geometry as ServiceCard on the home tab: photo area, title bars, "Book Direct" button.
export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.grid} accessibilityRole="progressbar" accessibilityLabel="Loading services">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.photo}>
            <ShimmerBlock height="100%" radius={0} />
          </View>
          <View style={styles.body}>
            <ShimmerBlock width="70%" height={13} />
            <ShimmerBlock width="45%" height={10} />
            <ShimmerBlock width="100%" height={10} />
            <ShimmerBlock width="100%" height={34} radius={Radius.md} style={styles.cta} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { width: '48.5%', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  photo: { aspectRatio: 4 / 3 },
  body: { padding: 10, gap: 7 },
  cta: { marginTop: 4 },
});
