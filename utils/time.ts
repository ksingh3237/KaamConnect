import { t } from '../i18n';

/** "just now", "12m ago", "3h ago", "2d ago" for a timestamp the server sent. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return t('just now');
  if (minutes < 60) return t('{n}m ago', { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('{n}h ago', { n: hours });
  return t('{n}d ago', { n: Math.round(hours / 24) });
}

/** "Today 4:30 PM" / "Tomorrow 10:00 AM" / "12 Oct, 10:00 AM" in the device's time zone. */
export function whenLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  if (dayDiff === 0) return t('Today {time}', { time });
  if (dayDiff === 1) return t('Tomorrow {time}', { time });
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}
