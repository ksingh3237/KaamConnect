// Opens the screen a notification is about. Shared by a tap on a system notification (PushHost) and a tap on a row of
// the inbox (NotificationInboxModal). Returns false when there is nowhere to go (unknown type, no job, or the person
// has no profile on the side the screen belongs to), so the caller can just leave the person where they are.
import { router } from 'expo-router';
import { useSession } from '../store/useSession';
import { useStore } from '../store/useStore';
import { notificationTarget } from './notificationRoutes';

export function openNotification(type: string, data: Record<string, unknown> | null | undefined): boolean {
  const target = notificationTarget(type, data);
  if (!target) return false;
  const me = useSession.getState().me;
  // A worker-only account has no customer screens and the other way round
  if (!me || (target.side === 'worker' ? !me.worker : !me.customer)) return false;

  const store = useStore.getState();
  if (store.role !== target.side) store.setRole(target.side);
  if (target.jobId) store.setActiveJobId(target.jobId);
  router.push(target.href);
  return true;
}
