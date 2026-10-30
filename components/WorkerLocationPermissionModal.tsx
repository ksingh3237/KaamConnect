// Explains WHY a worker's location is needed before the phone's own permission dialogs appear (people tap "Deny" on a
// dialog they do not understand). "Allow" then runs the system flow (utils/locationPermission.ts); "Not Now" just closes.
// The system flow shows its own in-app notices (DialogHost), which cannot draw over a native Modal, so this modal steps
// aside while it runs.
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BatteryCharging, Clock, MapPin } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { requestWorkerLocationAccess, type LocationAccess } from '../utils/locationPermission';
import { useT } from '../i18n/useT';

interface Props {
  visible: boolean;
  /** Called when the flow is over: the final access state, or 'skipped' for "Not Now". The parent hides the modal. */
  onDone: (result: LocationAccess | 'skipped') => void;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function WorkerLocationPermissionModal({ visible, onDone }: Props) {
  const t = useT();
  const [running, setRunning] = useState(false);
  const reasons = [
    { Icon: MapPin, title: t('Local Tricity Leads'), text: t('Keep location on to get jobs near you in Chandigarh, Mohali and Panchkula.') },
    { Icon: Clock, title: t('Live Arrival ETA'), text: t('When you leave for a job, the customer sees when you will arrive.') },
    { Icon: BatteryCharging, title: t('Battery-Safe'), text: t('Location is used only while the app is open and you are taking jobs, or during a trip. It will not drain your battery.') },
  ];

  const allow = async () => {
    if (running) return;
    setRunning(true);
    await pause(250); // let the native modal finish closing before any notice or system dialog opens
    const result = await requestWorkerLocationAccess();
    setRunning(false);
    onDone(result);
  };

  return (
    <Modal visible={visible && !running} transparent animationType="fade" onRequestClose={() => onDone('skipped')}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.iconBox}>
            <MapPin color={Colors.primary} size={34} />
          </View>
          <Text style={styles.title}>{t('Allow your location')}</Text>

          <View style={styles.reasons}>
            {reasons.map(({ Icon, title, text }, index) => (
              <View key={index} style={styles.reason}>
                <View style={styles.reasonIcon}>
                  <Icon color={Colors.primaryDark} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reasonTitle}>{title}</Text>
                  <Text style={styles.reasonText}>{text}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.allowBtn} onPress={() => void allow()} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.allowText}>{t('Allow Location')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={() => onDone('skipped')} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.laterText}>{t('Not Now')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(17,28,45,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 420, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textMain, textAlign: 'center', marginBottom: Spacing.lg },
  reasons: { width: '100%', gap: Spacing.md, marginBottom: Spacing.xl },
  reason: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  reasonIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  reasonTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMain },
  reasonText: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginTop: 1 },
  allowBtn: { width: '100%', minHeight: 48, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  allowText: { fontSize: 15, fontWeight: '800', color: Colors.onPrimary, textAlign: 'center' },
  laterBtn: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
  laterText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
});
