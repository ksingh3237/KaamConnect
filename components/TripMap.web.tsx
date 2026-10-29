// react-native-maps has no web build, so on web the trip shows its numbers instead of a map. The native app gets the real
// map (see TripMap.tsx). Props mirror TripMap so screens use one component.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';
import { distanceKm as straightLineKm, vehicleEmoji } from '../utils/trip';
import type { TripMapProps } from './TripMap';

export default function TripMap({ worker, destination, vehicle, distanceKm = null, etaMinutes = null, height = 220, fill = false }: TripMapProps) {
  const between = distanceKm ?? (worker && destination ? straightLineKm(worker, destination) : null);
  return (
    <View style={[styles.wrap, fill ? StyleSheet.absoluteFill : { height: Math.min(height, 130) }]}>
      <Navigation color={Colors.primaryDark} size={26} />
      <Text style={styles.text}>The live map is available in the mobile app.</Text>
      {worker && (
        <Text style={styles.coords}>
          {vehicleEmoji(vehicle)} {worker.lat.toFixed(5)}, {worker.lng.toFixed(5)}
          {between !== null ? ` • about ${between.toFixed(1)} km to the job` : ''}
          {etaMinutes !== null ? ` • ${etaMinutes} min` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: Radius.lg, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  text: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  coords: { fontSize: 12, color: Colors.textSubtle, textAlign: 'center' },
});
