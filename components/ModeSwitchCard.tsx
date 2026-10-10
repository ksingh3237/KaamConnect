import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Wrench, RefreshCw } from 'lucide-react-native';
import { UserRole } from '../store/useStore';

const MODES = {
  customer: { Icon: User, title: 'Customer Mode', tag: 'ग्राहक', description: 'Looking for trusted local handymen' },
  worker: { Icon: Wrench, title: 'Worker Mode', tag: 'कारीगर', description: 'Offering skilled services across the Tricity' }
} as const;

interface ModeSwitchCardProps {
  // The mode the user is currently setting up
  mode: UserRole;
  // Called when the user taps Switch to move to the other mode's setup
  onSwitch: () => void;
}

// "<Mode> Mode  [tag]  •  Switch" card shown at the top of both onboarding screens
export default function ModeSwitchCard({ mode, onSwitch }: ModeSwitchCardProps) {
  const { Icon, title, tag, description } = MODES[mode];
  const other = mode === 'customer' ? 'worker' : 'customer';

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.iconBox}>
          <Icon color="#ffffff" size={20} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.switchBtn}
        onPress={onSwitch}
        activeOpacity={0.8}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${other} mode`}
      >
        <Text style={styles.switchText}>Switch</Text>
        <RefreshCw color="#006c46" size={16} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#f0f3ff',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    marginBottom: 16
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00b074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111c2d',
    lineHeight: 24
  },
  tag: {
    backgroundColor: '#d8e3fb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 16
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003a23'
  },
  description: {
    fontSize: 12,
    color: '#3d4a41'
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  switchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006c46'
  }
});
