// Shimmer primitives for skeleton loaders. A light band sweeps across a grey block (native driver, no extra deps).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, DimensionValue, Easing, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const BASE = '#E2E8F0';
const HIGHLIGHT = '#F8FAFC';
const SWEEP_MS = 1100;

interface ShimmerBlockProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function ShimmerBlock({ width = '100%', height = 12, radius = 6, style }: ShimmerBlockProps) {
  const [w, setW] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: SWEEP_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const band = Math.max(w * 0.6, 40);
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-band, w] });
  const opacity = sweep.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.9, 0.2] });

  return (
    <View
      onLayout={onLayout}
      style={[{ width, height, borderRadius: radius, backgroundColor: BASE, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {w > 0 && <Animated.View style={[styles.band, { width: band, opacity, transform: [{ translateX }] }]} />}
    </View>
  );
}

export function ShimmerCircle({ size, style }: { size: number; style?: StyleProp<ViewStyle> }) {
  return <ShimmerBlock width={size} height={size} radius={size / 2} style={style} />;
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: HIGHLIGHT },
});
