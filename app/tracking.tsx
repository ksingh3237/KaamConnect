import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react-native';
import Svg, { Rect, Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { Colors, Spacing, Radius } from '../constants/theme';
import { VERIFIED_WORKERS } from '../constants/mockData';
import { useStore } from '../store/useStore';

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBooking } = useStore();
  const worker = activeBooking ?? VERIFIED_WORKERS[0];

  const handleSos = () => {
    Alert.alert('🚨 Emergency SOS', 'Alert dispatched to Tricity Safety Response Desk and designated emergency contact.');
  };

  const handleCall = () => {
    Linking.openURL(`tel:${worker.phone.replace(/\s+/g, '')}`);
  };

  return (
    <View style={styles.container}>
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { top: insets.top + 14 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={Colors.textMain} size={20} />
        </TouchableOpacity>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>• LIVE GPS TRACKER</Text>
        </View>
        <TouchableOpacity style={styles.sosBtn} onPress={handleSos} accessibilityRole="button" accessibilityLabel="Emergency SOS">
          <AlertTriangle color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>

      {/* SVG Map Canvas */}
      <View style={styles.mapCanvas}>
        <Svg viewBox="0 0 400 450" style={styles.svgMap}>
          <Rect width="400" height="450" fill="#E8EEF5" />

          {/* Landmarks */}
          <Rect x="20" y="30" width="100" height="70" rx="12" fill="#D1E7DD" />
          <SvgText x="30" y="70" fill="#4A7C59" fontSize="10" fontWeight="bold">Rose Garden</SvgText>

          <Rect x="260" y="180" width="110" height="80" rx="12" fill="#D1E7DD" />
          <SvgText x="270" y="225" fill="#4A7C59" fontSize="10" fontWeight="bold">Sec 22 Market</SvgText>

          {/* Road Grid */}
          <Path d="M 0 140 L 400 140" stroke="#FFFFFF" strokeWidth="14" />
          <Path d="M 180 0 L 180 450" stroke="#FFFFFF" strokeWidth="16" />
          <Path d="M 0 320 L 400 320" stroke="#FFFFFF" strokeWidth="14" />

          {/* Active Navigation Path */}
          <Path
            d="M 90 140 L 180 140 L 180 280 L 250 280"
            fill="none"
            stroke="#00B074"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Destination Pin */}
          <Circle cx="250" cy="280" r="14" fill="#0284C7" />
          <Circle cx="250" cy="280" r="6" fill="#FFFFFF" />
          <SvgText x="210" y="310" fill="#0F172A" fontSize="11" fontWeight="bold">Your Home (Sec 22-B)</SvgText>

          {/* Motorbike Moving Pin */}
          <G transform="translate(130, 140)">
            <Circle cx="0" cy="0" r="20" fill="rgba(0, 176, 116, 0.25)" />
            <Circle cx="0" cy="0" r="14" fill="#00B074" />
            <SvgText x="-6" y="5" fontSize="11">🏍️</SvgText>
          </G>
        </Svg>

        {/* Floating ETA Badge */}
        <View style={[styles.floatingEta, { top: insets.top + 66 }]}>
          <Text style={{ color: Colors.primary, fontWeight: '800' }}>⚡</Text>
          <Text style={styles.floatingEtaText}>Arriving in 11 Mins • 1.1 km away</Text>
        </View>
      </View>

      {/* Technician Bottom Drawer Card */}
      <View style={[styles.bottomDrawer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.drawerHandle} />

        <View style={styles.drawerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Image source={{ uri: worker.avatar }} style={styles.workerAvatar} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text>🛡️</Text>
              </View>
              <Text style={styles.vehicleText}>{worker.vehicle}</Text>
              <Text style={styles.workerSub}>{worker.trade} • Aadhaar Verified</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.codeLabel}>Arrival Code</Text>
            <Text style={styles.codeNumber}>8421</Text>
          </View>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Share arrival code <Text style={{ fontWeight: '800' }}>8421</Text> with worker upon entry.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Phone color="#FFFFFF" size={16} />
            <Text style={styles.callBtnText}>Call Worker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.progressBtn} onPress={() => router.push('/job-progress')}>
            <Text style={styles.progressBtnText}>Job Progress →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EEF5'
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  livePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    elevation: 4
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46'
  },
  sosBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  mapCanvas: {
    flex: 1,
    position: 'relative'
  },
  svgMap: {
    width: '100%',
    height: '100%'
  },
  floatingEta: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 6
  },
  floatingEtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  bottomDrawer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    elevation: 10
  },
  drawerHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  workerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMain
  },
  vehicleText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700'
  },
  workerSub: {
    fontSize: 10,
    color: Colors.textMuted
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted
  },
  codeNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1
  },
  noticeBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 12
  },
  noticeText: {
    fontSize: 11,
    color: Colors.textMuted
  },
  callBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  progressBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDark
  },
  progressBtnText: {
    color: Colors.textMain,
    fontSize: 13,
    fontWeight: '700'
  }
});
