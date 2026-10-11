// KaamConnect UI store: preferences and small cross-screen choices. Everything that comes from the server (the user,
// jobs, workers, leads, money figures) is NOT here: it is fetched through api/endpoints.ts and held by the screens, and
// who is signed in lives in store/useSession.ts. No mock data.
import { create } from 'zustand';

export type Language = 'en' | 'hi' | 'pa';
export type UserRole = 'customer' | 'worker';

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

  setLanguage: (lang: Language) => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  setMobile: (num: string) => void;
  setSelectedSector: (label: string, areaId?: number | null) => void;
  setSelectedCategory: (cat: string) => void;
  setActiveJobId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  role: 'customer',
  mobile: '',
  selectedSector: '',
  selectedAreaId: null,
  selectedCategory: '',
  activeJobId: null,

  setLanguage: (lang) => set({ language: lang }),
  setRole: (role) => set({ role }),
  toggleRole: () => set((state) => ({ role: state.role === 'worker' ? 'customer' : 'worker' })),
  setMobile: (num) => set({ mobile: num }),
  setSelectedSector: (label, areaId = null) => set({ selectedSector: label, selectedAreaId: areaId }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setActiveJobId: (id) => set({ activeJobId: id }),
}));
