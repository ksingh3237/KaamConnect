// react-native-maps has no web build, so on web the picker keeps search and "use my location" and shows this card in
// place of the map. The native app gets the real map (see PickerMap.tsx).
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { t } from '../i18n';
import type { MapFocus } from './PickerMap';

interface Props {
  initial: MapFocus;
  focus: MapFocus | null;
  onSettle: (lat: number, lng: number) => void;
  height?: number;
}

export default function PickerMap({ focus, height = 220 }: Props) {
  return (
    <View style={[styles.wrap, { height: Math.min(height, 110) }]}>
      <MapPin color={Colors.primaryDark} size={26} />
      <Text style={styles.text}>{t('Pin on map is available in the mobile app. Search above or use your location.')}</Text>
      {focus && (
        <Text style={styles.coords}>
          {focus.lat.toFixed(5)}, {focus.lng.toFixed(5)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  text: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  coords: { fontSize: 12, color: Colors.textSubtle },
});
