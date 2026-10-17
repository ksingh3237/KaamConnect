// Bottom action sheet asking whether to take a photo with the camera or choose one from the gallery.
// Screens use useImagePicker(): `await pick()` opens the sheet, runs the chosen source and resolves with the photo
// (null on cancel), so each upload point keeps its existing "pick, then upload" flow.
import React, { useCallback, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ImageIcon } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import type { PickedFile } from '../api/upload';
import { captureFromCamera, pickFromGallery } from '../utils/pickImage';

export type ImageSource = 'camera' | 'gallery';

interface Props {
  visible: boolean;
  onSelect: (source: ImageSource) => void;
  onCancel: () => void;
}

export default function ImageSourceModal({ visible, onSelect, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onCancel} accessibilityLabel="Close">
        {/* Swallows taps so touching the sheet itself does not dismiss it */}
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]}
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          <TouchableOpacity style={styles.option} onPress={() => onSelect('camera')} activeOpacity={0.8} accessibilityRole="button">
            <View style={styles.iconBox}><Camera color={Colors.primaryDark} size={22} /></View>
            <Text style={styles.optionText}>Take Photo with Camera / फ़ोटो खींचें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => onSelect('gallery')} activeOpacity={0.8} accessibilityRole="button">
            <View style={styles.iconBox}><ImageIcon color={Colors.primaryDark} size={22} /></View>
            <Text style={styles.optionText}>Choose from Gallery / गैलरी से चुनें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onCancel} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel / रद्द करें</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** `pick()` shows the sheet and resolves with the photo, or null if cancelled. Render `modal` once in the screen. */
export function useImagePicker() {
  const [visible, setVisible] = useState(false);
  const pending = useRef<((source: ImageSource | null) => void) | null>(null);

  const settle = useCallback((source: ImageSource | null) => {
    setVisible(false);
    pending.current?.(source);
    pending.current = null;
  }, []);

  const pick = useCallback(async (): Promise<PickedFile | null> => {
    const source = await new Promise<ImageSource | null>((resolve) => {
      pending.current?.(null);
      pending.current = resolve;
      setVisible(true);
    });
    if (!source) return null;
    if (Platform.OS === 'ios') {
      await pause(300); // let the sheet finish closing; iOS cannot open the camera over a visible Modal
    }
    return source === 'camera' ? captureFromCamera() : pickFromGallery();
  }, []);

  const modal = <ImageSourceModal visible={visible} onSelect={settle} onCancel={() => settle(null)} />;
  return { pick, modal };
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(17,28,45,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderDark, marginBottom: Spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, paddingVertical: Spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textMain },
  cancel: { minHeight: 48, marginTop: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
});
