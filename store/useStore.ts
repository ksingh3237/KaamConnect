// KaamConnect UI store: preferences and small cross-screen choices. Everything that comes from the server (the user,
// jobs, workers, leads, money figures) is NOT here: it is fetched through api/endpoints.ts and held by the screens, and
// who is signed in lives in store/useSession.ts. No mock data.
import { create } from 'zustand';
import { saveLanguage, saveRole } from '../api/storage';
import { setCurrentLanguage } from '../i18n';

export type Language = 'en' | 'hi' | 'pa';
export type UserRole = 'customer' | 'worker';
export type TrackingIssue = 'PERMISSION' | 'SERVICES_OFF';

interface AppState {
  language: Language;
  role: UserRole;
  /** The phone number being signed in, as typed ("98765 43210"). */
  mobile: string;
  /** The chosen area label ("Sector 22, Chandigarh") and its server id; empty until the customer picks one. */
  selectedSector: string;
  selectedAreaId: number | null;
  /** The service the customer tapped on Home, preselected on Post Job. */
  selectedCategory: string;
  /** The job the customer or worker is currently following (tracking, progress, rating). */
  activeJobId: string | null;
  /** Worker side: the last GPS fix sent while on the way to a job, and whether the GPS is being shared right now. */
  currentLat: number | null;
  currentLng: number | null;
  isTrackingActive: boolean;
  /** Why sharing is paused: the person turned the permission or the phone's location off (null when nothing is wrong). */
  trackingIssue: TrackingIssue | null;

  /** Switches every screen to `lang`. Remembered on the phone unless `remember` is false (restoring the saved one). */
  setLanguage: (lang: Language, remember?: boolean) => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  setMobile: (num: string) => void;
  setSelectedSector: (label: string, areaId?: number | null) => void;
  setSelectedCategory: (cat: string) => void;
  setActiveJobId: (id: string | null) => void;
  setTrackingFix: (lat: number, lng: number) => void;
  setTrackingState: (active: boolean, issue: TrackingIssue | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  role: 'customer',
  mobile: '',
  selectedSector: '',
  selectedAreaId: null,
  selectedCategory: '',
  activeJobId: null,
  currentLat: null,
  currentLng: null,
  isTrackingActive: false,
  trackingIssue: null,

  setLanguage: (lang, remember = true) => {
    setCurrentLanguage(lang); // first, so plain t() calls made during the re-render already use it
    set({ language: lang });
    if (remember) void saveLanguage(lang);
  },
  // Remembered on the device so a restart (or a web reload) reopens the same side
  setRole: (role) => {
    set({ role });
    void saveRole(role);
  },
  toggleRole: () =>
    set((state) => {
      const role: UserRole = state.role === 'worker' ? 'customer' : 'worker';
      void saveRole(role);
      return { role };
    }),
  setMobile: (num) => set({ mobile: num }),
  setSelectedSector: (label, areaId = null) => set({ selectedSector: label, selectedAreaId: areaId }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setActiveJobId: (id) => set({ activeJobId: id }),
  setTrackingFix: (lat, lng) => set({ currentLat: lat, currentLng: lng }),
  // Stopping for good (no issue) also forgets the old fix, so the next trip never starts from a stale dot
  setTrackingState: (active, issue) =>
    set(active ? { isTrackingActive: true, trackingIssue: null } : { isTrackingActive: false, trackingIssue: issue, ...(issue ? {} : { currentLat: null, currentLng: null }) }),
}));
