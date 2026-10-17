// The unread count shown on the bell. One shared value so every bell (Home, Leads) agrees; the notification list itself
// is fetched by the inbox modal and never kept here. The server is the source of truth: after any local change we
// re-read the count.
import { create } from 'zustand';
import { getUnreadCount } from '../api/endpoints';

interface NotificationsState {
  unread: number;
  refreshUnread: () => Promise<void>;
  /** Optimistic local change after the person read something; a refresh reconciles with the server. */
  setUnread: (count: number) => void;
}

export const useNotifications = create<NotificationsState>((set) => ({
  unread: 0,
  setUnread: (count) => set({ unread: Math.max(0, count) }),
  refreshUnread: async () => {
    try {
      const { count } = await getUnreadCount();
      set({ unread: count });
    } catch {
      /* keep the last known count; the next poll or push tries again */
    }
  },
}));
