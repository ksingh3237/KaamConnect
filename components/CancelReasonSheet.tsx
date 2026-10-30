// Bottom sheet asking WHY a job is being cancelled, for the customer and the assigned worker alike.
// Screens use useCancelJob(actor): `await cancel(jobId, stage)` opens the sheet, sends the cancellation and reports a
// failure. Nothing is cancelled until the person has chosen a reason and pressed the confirm button.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { Colors, Radius, Spacing } from '../constants/theme';
import { cancelJob } from '../api/endpoints';
import { userMessage } from '../api/errors';
import type { CancelActor, CancelBody, CancelReasonCode, CancelStage, JobView } from '../api/types';
import { cancelCopy, consequence, needsNote, reasonsFor } from '../utils/cancelReasons';
import { notify } from '../utils/dialog';
import { t } from '../i18n';

const NOTE_MAX = 300;

export interface CancelRequest {
  actor: CancelActor;
  stage: CancelStage;
  /** The worker's visit fee in rupees, when known: shown where it is owed. */
  visitFee?: number | null;
}

interface SheetProps {
  request: CancelRequest | null;
  onConfirm: (answer: CancelBody) => void;
  onClose: () => void;
}

export default function CancelReasonSheet({ request, onConfirm, onClose }: SheetProps) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState<CancelReasonCode | null>(null);
  const [note, setNote] = useState('');

  // Every new question starts with nothing chosen
  useEffect(() => {
    setCode(null);
    setNote('');
  }, [request]);

  // Keep showing the last question while the sheet slides away, so it does not flash empty
  const last = useRef<CancelRequest | null>(null);
  if (request) last.current = request;
  const view = request ?? last.current;
  if (!view) return null;

  const copy = cancelCopy(view.actor, view.stage, view.visitFee);
  const options = reasonsFor(view.actor, view.stage);
  const trimmed = note.trim();
  const ready = code !== null && (!needsNote(code) || trimmed.length > 0);
  const what = consequence(view.actor, view.stage, code, view.visitFee);

  const confirm = () => {
    if (!code || !ready) return;
    onConfirm({ reasonCode: code, ...(trimmed ? { reason: trimmed } : {}) });
  };

  return (
    <Modal visible={request !== null} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel={t('Close')}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
          {/* Swallows taps so touching the sheet itself does not dismiss it */}
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.sm }]} onPress={() => {}} accessibilityViewIsModal>
            <View style={styles.handle} />
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.intro}>{copy.intro}</Text>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.why}>{t('Why?')}</Text>
              {options.map((option) => {
                const selected = option.code === code;
                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[styles.option, selected && styles.optionOn]}
                    onPress={() => setCode(option.code)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                  >
                    <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check color="#FFFFFF" size={13} />}</View>
                    <Text style={[styles.optionText, selected && styles.optionTextOn]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
              {needsNote(code) && (
                <TextInput
                  style={styles.note}
                  value={note}
                  onChangeText={(text) => setNote(text.slice(0, NOTE_MAX))}
                  placeholder={t('Tell us what happened')}
                  placeholderTextColor={Colors.textSubtle}
                  multiline
                  maxLength={NOTE_MAX}
                  accessibilityLabel={t('Describe the reason')}
                />
              )}
              {what ? <Text style={styles.consequence}>{what}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.keep} onPress={onClose} activeOpacity={0.8} accessibilityRole="button">
                <Text style={styles.keepText}>{t('Keep the job')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirm, !ready && styles.confirmOff]}
                onPress={confirm}
                disabled={!ready}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
              >
                <Text style={styles.confirmText}>{copy.confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/** `ask()` shows the sheet and resolves with the reason chosen, or null if the person kept the job. Render `modal` once. */
export function useCancelSheet() {
  const [request, setRequest] = useState<CancelRequest | null>(null);
  const pending = useRef<((answer: CancelBody | null) => void) | null>(null);

  const settle = useCallback((answer: CancelBody | null) => {
    setRequest(null);
    pending.current?.(answer);
    pending.current = null;
  }, []);

  const ask = useCallback((next: CancelRequest) => {
    return new Promise<CancelBody | null>((resolve) => {
      pending.current?.(null);
      pending.current = resolve;
      setRequest(next);
    });
  }, []);

  const modal = <CancelReasonSheet request={request} onConfirm={settle} onClose={() => settle(null)} />;
  return { ask, modal };
}

interface CancelOptions {
  /** The worker's visit fee in rupees, when known (shown where it is owed). */
  visitFee?: number | null;
  /** Runs after the server accepted the cancellation, with the job as the person now sees it. */
  onCancelled?: (job: JobView) => void | Promise<void>;
  /** Runs after the server refused (the job probably just changed): refresh the screen. */
  onFailed?: () => void | Promise<void>;
}

/**
 * The whole cancel flow for one side: ask why, send it, and show a readable message if the server refuses (for example
 * when the other person acted first). `busy` is true while the request is in flight so the button can be disabled.
 */
export function useCancelJob(actor: CancelActor) {
  const { ask, modal } = useCancelSheet();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const cancel = useCallback(
    async (jobId: string, stage: CancelStage, options: CancelOptions = {}): Promise<JobView | null> => {
      if (inFlight.current) return null;
      const answer = await ask({ actor, stage, visitFee: options.visitFee });
      if (!answer) return null;
      inFlight.current = true;
      setBusy(true);
      try {
        const job = await cancelJob(jobId, answer);
        await options.onCancelled?.(job);
        return job;
      } catch (error) {
        void notify(t('Could not cancel'), userMessage(error));
        await options.onFailed?.();
        return null;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [actor, ask],
  );

  return { cancel, busy, modal };
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(17,28,45,0.6)', justifyContent: 'flex-end' },
  avoid: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderDark, marginBottom: Spacing.md },
  title: { fontSize: 17, fontWeight: '800', color: Colors.textMain },
  intro: { fontSize: 13, lineHeight: 19, color: Colors.textMuted, marginTop: 4, marginBottom: Spacing.md },
  list: { flexGrow: 0 },
  why: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, marginBottom: Spacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 8 },
  optionOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryContainer },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.borderDark, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textMain },
  optionTextOn: { color: Colors.primaryDark, fontWeight: '800' },
  note: { minHeight: 72, borderWidth: 1.5, borderColor: Colors.borderDark, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14, color: Colors.textMain, backgroundColor: '#FFFFFF', textAlignVertical: 'top', marginBottom: 8 },
  consequence: { fontSize: 13, lineHeight: 19, color: Colors.secondaryDark, backgroundColor: Colors.secondaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  keep: { flex: 1, minHeight: 50, borderRadius: Radius.md, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  keepText: { fontSize: 14, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  confirm: { flex: 1, minHeight: 50, borderRadius: Radius.md, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  confirmOff: { opacity: 0.4 },
  confirmText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
});
