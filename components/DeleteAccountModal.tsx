// "Delete my account": explains what is removed and what stays, asks for a fresh code for the phone number, and only then
// deletes. The server refuses while a job is active and says which (docs/08 section 1). Wording on retention is the
// default in the design and is NOT legal advice: the retention periods are waiting for sign-off.
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { deleteAccount } from '../api/endpoints';
import { isApiError, userMessage } from '../api/errors';
import { useSession } from '../store/useSession';
import { useT } from '../i18n/useT';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after the server confirmed the deletion and the local login was cleared. */
  onDeleted: () => void;
}

export default function DeleteAccountModal({ visible, onClose, onDeleted }: Props) {
  const t = useT();
  const { user, devNotice, requestOtp, clearLocal } = useSession();
  const [step, setStep] = useState<'explain' | 'code'>('explain');
  const [code, setCode] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState<'send' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);

  const reset = () => {
    setStep('explain');
    setCode('');
    setUnderstood(false);
    setBusy(null);
    setError(null);
    setBlockers([]);
  };
  const close = () => {
    if (busy === 'delete') return; // never walk away from a deletion in progress
    reset();
    onClose();
  };

  const sendCode = async () => {
    if (busy || !user) return;
    setBusy('send');
    setError(null);
    try {
      await requestOtp(user.phone);
      setStep('code');
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (busy) return;
    setBusy('delete');
    setError(null);
    setBlockers([]);
    try {
      await deleteAccount(code);
      await clearLocal();
      reset();
      onDeleted();
    } catch (e) {
      if (isApiError(e) && e.code === 'ACTIVE_JOB_BLOCKS_DELETION') {
        // The server refuses before it looks at the code, so the code is NOT spent: stay here, let the person finish or
        // cancel what is open, and press Delete again with the same code.
        setBlockers(e.details.map((d) => d.issue));
      }
      setError(userMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const canDelete = understood && /^\d{6}$/.test(code) && busy === null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <AlertTriangle color={Colors.error} size={20} />
            </View>
            <Text style={styles.title}>{t('Delete my account')}</Text>
            <TouchableOpacity onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Close')}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }} keyboardShouldPersistTaps="handled">
            {step === 'explain' ? (
              <>
                <Text style={styles.lead}>{t('This cannot be undone. Your login ends right away.')}</Text>
                <Text style={styles.sectionLabel}>{t('REMOVED')}</Text>
                <Text style={styles.body}>
                  • {t('Your name, photo and phone number')}{'\n'}• {t('Your saved addresses and the addresses on your past jobs')}{'\n'}• {t('Aadhaar photos, UPI ID and vehicle details (workers)')}{'\n'}• {t('Photos and voice notes you attached to jobs')}
                </Text>
                <Text style={styles.sectionLabel}>{t('KEPT (without your name)')}</Text>
                <Text style={styles.body}>
                  {t('Completed jobs, bills, payments and ratings stay, because the other person and the business still need them. They show you as “Deleted user”. Your phone number becomes free: signing up again later starts a brand-new account.')}
                </Text>
                <Text style={styles.note}>
                  {t('How long these records are kept is still to be confirmed with legal advice; nothing here is a legal statement.')}
                </Text>
                <Text style={styles.body}>{t('You cannot delete while a job is open or in progress, or while an SOS alert of yours is still open. Finish or cancel it first.')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.lead}>{t('Enter the 6-digit code sent to +91 {phone}', { phone: (user?.phone ?? '').replace(/^\+91/, '') })}</Text>
                {devNotice ? (
                  <Text style={styles.devBanner} accessibilityRole="alert">
                    {devNotice}
                  </Text>
                ) : null}
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  placeholderTextColor={Colors.textSubtle}
                  keyboardType="number-pad"
                  maxLength={6}
                  accessibilityLabel={t('Confirmation code')}
                  autoFocus
                />
                <TouchableOpacity style={styles.checkRow} onPress={() => setUnderstood((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: understood }}>
                  <View style={[styles.checkBox, understood && styles.checkBoxOn]}>{understood ? <Text style={styles.tick}>✓</Text> : null}</View>
                  <Text style={styles.checkText}>{t('I understand my account will be deleted and this cannot be undone.')}</Text>
                </TouchableOpacity>
              </>
            )}

            {blockers.length > 0 && (
              <View style={styles.blockerBox} accessibilityRole="alert">
                {error ? <Text style={[styles.blockerText, { fontWeight: '800' }]}>{error}</Text> : null}
                {blockers.map((b) => (
                  <Text key={b} style={styles.blockerText}>
                    • {b}
                  </Text>
                ))}
              </View>
            )}
            {error && blockers.length === 0 ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={close} disabled={busy === 'delete'} accessibilityRole="button">
              <Text style={styles.cancelText}>{t('Keep my account')}</Text>
            </TouchableOpacity>
            {step === 'explain' ? (
              <TouchableOpacity style={[styles.dangerBtn, busy !== null && styles.disabled]} onPress={() => void sendCode()} disabled={busy !== null} accessibilityRole="button">
                {busy === 'send' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerText}>{t('Send code')}</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.dangerBtn, !canDelete && styles.disabled]} onPress={() => void confirmDelete()} disabled={!canDelete} accessibilityRole="button">
                {busy === 'delete' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerText}>{t('Delete my account')}</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: Spacing.lg },
  sheet: { backgroundColor: '#FFFFFF', borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textMain },
  lead: { fontSize: 13, fontWeight: '700', color: Colors.textMain },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.5, marginTop: 4 },
  body: { fontSize: 12, color: Colors.textMain, lineHeight: 18 },
  note: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, fontStyle: 'italic' },
  devBanner: { fontSize: 13, fontWeight: '700', color: '#92400E', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderRadius: Radius.md, padding: 8 },
  input: { borderWidth: 1.5, borderColor: Colors.borderDark, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 18, letterSpacing: 6, textAlign: 'center', color: Colors.textMain },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.borderDark, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: Colors.error, borderColor: Colors.error },
  tick: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  checkText: { flex: 1, fontSize: 12, color: Colors.textMain, lineHeight: 17 },
  blockerBox: { backgroundColor: Colors.errorLight, borderRadius: Radius.md, padding: 10, gap: 4 },
  blockerText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },
  error: { fontSize: 12, fontWeight: '600', color: Colors.error },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.borderDark, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '700', color: Colors.textMain },
  dangerBtn: { flex: 1, backgroundColor: Colors.error, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  dangerText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
});
