// Full-screen look at one picture: an Aadhaar photo the worker just picked, a job photo, a before/after work proof.
// Screens use useImageViewer(): `show(uri, title)` opens it, `modal` is rendered once in the screen.
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  uri: string | null;
  title?: string;
  onClose: () => void;
}

export default function ImageViewerModal({ uri, title, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* A tap anywhere closes; the picture itself is not interactive */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close the picture">
        <View style={[styles.bar, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.title} numberOfLines={1}>{title ?? ''}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
            <X color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => {
              setLoading(true);
              setFailed(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            accessibilityIgnoresInvertColors
          />
        ) : null}
        {loading && !failed ? <ActivityIndicator color="#FFFFFF" style={styles.centred} /> : null}
        {failed ? <Text style={[styles.centred, styles.error]}>This picture could not be opened. / यह फ़ोटो नहीं खुल सकी</Text> : null}
      </Pressable>
    </Modal>
  );
}

/** `show(uri, title)` opens the viewer. Render `modal` once in the screen. */
export function useImageViewer() {
  const [shown, setShown] = useState<{ uri: string; title?: string } | null>(null);
  const show = useCallback((uri: string, title?: string) => setShown({ uri, title }), []);
  const hide = useCallback(() => setShown(null), []);
  const modal = <ImageViewerModal uri={shown?.uri ?? null} title={shown?.title} onClose={hide} />;
  return { show, hide, modal };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    zIndex: 2,
  },
  title: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '80%' },
  centred: { position: 'absolute', alignSelf: 'center' },
  error: { color: Colors.surface, textAlign: 'center', paddingHorizontal: Spacing.xl, fontSize: 14, fontWeight: '600' },
});
