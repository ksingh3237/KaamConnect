// Draws the front request of utils/dialog.ts as a bottom sheet over a dark backdrop. Mounted once, in app/_layout.tsx.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../constants/theme';
import { useDialogs } from '../utils/dialog';
import { t } from '../i18n';

const NATIVE = Platform.OS !== 'web';

export default function DialogHost() {
  const front = useDialogs((s) => s.queue[0] ?? null);
  const answer = useDialogs((s) => s.answer);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!front) return;
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [front, slide]);

  if (!front) return null;
  const isConfirm = front.confirmLabel !== undefined;
  // Tapping outside or Back means "no" for a confirmation and "OK" for a notice
  const dismiss = () => answer(false);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel={t('Close')} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }], opacity: slide },
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{front.title}</Text>
          <Text style={styles.message}>{front.message}</Text>
          <View style={styles.actions}>
            {isConfirm && (
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => answer(false)} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.cancelText}>{front.cancelLabel ?? t('Cancel')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, front.destructive ? styles.danger : styles.primary]}
              onPress={() => answer(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.primaryText}>{front.confirmLabel ?? t('OK')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800', color: Colors.textMain },
  message: { fontSize: 15, lineHeight: 22, color: Colors.textMuted, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, minHeight: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  primary: { backgroundColor: Colors.primary },
  danger: { backgroundColor: Colors.error },
  cancel: { backgroundColor: Colors.surfaceVariant },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  cancelText: { color: Colors.textMain, fontSize: 16, fontWeight: '700' },
});
