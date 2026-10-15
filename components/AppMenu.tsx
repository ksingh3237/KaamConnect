// The side menu opened from the ☰ button on Home (customer and worker alike): profile, help, language, terms, privacy.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, FileText, Globe, HelpCircle, Lock, Settings, User as UserIcon, X } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { notify } from '../utils/dialog';

const NATIVE = Platform.OS !== 'web';

export default function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  // Stays mounted while the closing slide runs
  const [shown, setShown] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShown(true);
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: NATIVE }).start();
    } else if (shown) {
      Animated.timing(slide, { toValue: -Dimensions.get('window').width, duration: 200, useNativeDriver: NATIVE }).start(() => setShown(false));
    }
  }, [visible, shown, slide]);

  // Close first, then act, so the next screen does not open under a sliding menu
  const go = (action: () => void) => {
    onClose();
    setTimeout(action, 220);
  };

  const items: { icon: typeof UserIcon; title: string; sub: string; onPress: () => void }[] = [
    { icon: UserIcon, title: 'Profile', sub: 'प्रोफ़ाइल / ਪ੍ਰੋਫਾਈਲ', onPress: () => router.navigate('/(tabs)/profile') },
    { icon: HelpCircle, title: 'Help & Support', sub: 'सहायता / ਮਦਦ', onPress: () => void notify('Help & Support / सहायता', 'For help with a job, open it from Activity. During a job, use the SOS button if you feel unsafe.') },
    { icon: Globe, title: 'Language', sub: 'भाषा / ਭਾਸ਼ਾ', onPress: () => router.push({ pathname: '/language', params: { from: 'app' } }) },
    { icon: FileText, title: 'Terms & Conditions', sub: 'नियम और शर्तें', onPress: () => router.push({ pathname: '/legal', params: { doc: 'terms' } }) },
    { icon: Lock, title: 'Privacy Policy', sub: 'गोपनीयता नीति', onPress: () => router.push({ pathname: '/legal', params: { doc: 'privacy' } }) },
    { icon: Settings, title: 'Settings', sub: 'सेटिंग्स / ਸੈਟਿੰਗਜ਼', onPress: () => router.navigate('/(tabs)/profile') },
  ];

  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.panel, { transform: [{ translateX: slide }] }]}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View>
              <Text style={styles.title}>Menu</Text>
              <Text style={styles.sub}>KaamConnect Tricity</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close menu">
              <X color={Colors.textMain} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
            {items.map((item) => (
              <TouchableOpacity key={item.title} style={styles.item} onPress={() => go(item.onPress)} activeOpacity={0.7} accessibilityRole="button">
                <item.icon color={Colors.primary} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.sub}</Text>
                </View>
                <ChevronRight color={Colors.textSubtle} size={18} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    width: '80%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textMain },
  sub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  scroll: { paddingHorizontal: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  itemTitle: { fontSize: 16, fontWeight: '700', color: Colors.textMain },
  itemSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
