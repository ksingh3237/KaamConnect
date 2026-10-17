// The interactive Google map of GoogleLocationPicker: the pin stays in the middle and the person moves the map under
// it (the way ride apps do), which is far steadier with a thumb than dragging a marker. onSettle fires when a
// gesture ends. `focus` moves the map from outside (a searched place, the GPS fix); a new object means "go there".
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { Colors, Radius } from '../constants/theme';

export interface MapFocus {
  lat: number;
  lng: number;
}
interface Props {
  initial: MapFocus;
  focus: MapFocus | null;
  onSettle: (lat: number, lng: number) => void;
  height?: number;
}

const CLOSE = 0.006; // about 600 m across: street level

export default function PickerMap({ initial, focus, onSettle, height = 220 }: Props) {
  const ref = useRef<MapView>(null);

  useEffect(() => {
    if (focus) ref.current?.animateToRegion({ latitude: focus.lat, longitude: focus.lng, latitudeDelta: CLOSE, longitudeDelta: CLOSE }, 400);
  }, [focus]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: initial.lat, longitude: initial.lng, latitudeDelta: CLOSE * 4, longitudeDelta: CLOSE * 4 }}
        onRegionChangeComplete={(region, details) => {
          // Moves we made ourselves (animateToRegion) already carry their address; only react to fingers
          if (details?.isGesture === false) return;
          onSettle(region.latitude, region.longitude);
        }}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsMyLocationButton={false}
      />
      {/* The pin's tip sits on the exact centre of the map */}
      <View pointerEvents="none" style={styles.pinWrap}>
        <MapPin color={Colors.error} fill={Colors.errorLight} size={38} strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceVariant,
  },
  pinWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 38, // lifts the icon so its tip, not its middle, marks the centre
  },
});
