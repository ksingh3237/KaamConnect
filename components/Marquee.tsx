// An endless right-to-left strip. The children are drawn twice side by side and slid left by one copy's width, so the
// loop has no visible seam. The slide runs on the native driver (no JS work per frame). With `swipeable`, a horizontal
// drag takes over (the strip follows the finger) and the motion resumes from there shortly after release.
// Respects the system "reduce motion" setting: the strip then stays still (and can still be swiped).
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Pixels per second. */
  speed?: number;
  swipeable?: boolean;
  /** Space between the two copies; match the gap between items for an even rhythm. */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

const NATIVE = Platform.OS !== 'web';
const RESUME_AFTER_MS = 1500;

export default function Marquee({ children, speed = 30, swipeable = false, gap = 0, style }: Props) {
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const x = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widthRef = useRef(0);
  const motionRef = useRef(true);

  /** Keeps the offset inside (-width, 0], where the two copies cover the strip. */
  const wrap = (v: number) => {
    const w = widthRef.current;
    if (!w) return 0;
    let r = v % w;
    if (r > 0) r -= w;
    return r;
  };

  const run = (from: number) => {
    const w = widthRef.current;
    if (!w || !motionRef.current) return;
    const start = wrap(from);
    x.setValue(start);
    Animated.timing(x, {
      toValue: -w,
      duration: ((w + start) / speed) * 1000,
      easing: Easing.linear,
      useNativeDriver: NATIVE,
      isInteraction: false,
    }).start(({ finished }) => {
      if (finished) run(0);
    });
  };

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => alive && setReduceMotion(on))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    widthRef.current = width;
    motionRef.current = !reduceMotion;
    if (width && !reduceMotion) x.stopAnimation((v) => run(v));
    else x.stopAnimation();
    return () => x.stopAnimation();
  }, [width, reduceMotion, speed]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        x.stopAnimation((v) => {
          dragStart.current = v;
        });
      },
      onPanResponderMove: (_e, g) => x.setValue(wrap(dragStart.current + g.dx)),
      onPanResponderRelease: () => {
        resumeTimer.current = setTimeout(() => x.stopAnimation((v) => run(v)), RESUME_AFTER_MS);
      },
      onPanResponderTerminate: () => {
        resumeTimer.current = setTimeout(() => x.stopAnimation((v) => run(v)), RESUME_AFTER_MS);
      },
    }),
  ).current;

  return (
    <View style={[styles.clip, style]} {...(swipeable ? pan.panHandlers : {})}>
      <Animated.View style={[styles.row, { transform: [{ translateX: x }] }]}>
        <View style={[styles.row, { paddingRight: gap }]} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
          {children}
        </View>
        <View style={[styles.row, { paddingRight: gap }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignSelf: 'flex-start' },
});
