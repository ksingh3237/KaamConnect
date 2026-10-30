// App-wide notices and confirmations, drawn by components/DialogHost.tsx (mounted once in app/_layout.tsx) as an in-app
// bottom sheet. The same look on Android, iOS and web: no browser window.alert/confirm popups, no platform Alert.
import { Linking } from 'react-native';
import { create } from 'zustand';
import { t } from '../i18n';

export interface DialogRequest {
  id: number;
  title: string;
  message: string;
  /** Present for confirmations; absent for a plain notice (one "OK" button). */
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  resolve: (confirmed: boolean) => void;
}

interface DialogState {
  queue: DialogRequest[];
  push: (request: Omit<DialogRequest, 'id'>) => void;
  /** Closes the front dialog with the person's answer. */
  answer: (confirmed: boolean) => void;
}

let nextId = 1;

export const useDialogs = create<DialogState>((set, get) => ({
  queue: [],
  push: (request) => set((s) => ({ queue: [...s.queue, { ...request, id: nextId++ }] })),
  answer: (confirmed) => {
    const [front, ...rest] = get().queue;
    if (!front) return;
    set({ queue: rest });
    front.resolve(confirmed);
  },
}));

export function notify(title: string, message: string): Promise<void> {
  return new Promise((resolve) => useDialogs.getState().push({ title, message, resolve: () => resolve() }));
}

/** Resolves true only when the person confirms. */
export function confirmAction(title: string, message: string, confirmLabel = t('OK'), destructive = false): Promise<boolean> {
  return new Promise((resolve) => useDialogs.getState().push({ title, message, confirmLabel, cancelLabel: t('Cancel'), destructive, resolve }));
}

/** Asks first, then opens the phone dialler. Calls go straight to the person: no commission, no middleman. */
export async function callPhone(phone: string, name: string): Promise<void> {
  const number = phone.replace(/\s+/g, '');
  const ok = await confirmAction(t('Direct phone call'), t('Call {name} at {phone}?\n0% commission: you talk and pay directly.', { name, phone }), t('Call now'));
  if (!ok) return;
  try {
    await Linking.openURL(`tel:${number}`);
  } catch {
    await notify(t('Could not start the call'), t('Please dial {phone} from your phone.', { phone }));
  }
}
