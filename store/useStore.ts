// KaamConnect Zustand Store
import { create } from 'zustand';
import { WORKER_ACTIVE_LEADS, CustomerLead, WorkerProfile, VERIFIED_WORKERS } from '../constants/mockData';

export type Language = 'en' | 'hi' | 'pa';
export type UserRole = 'customer' | 'worker';

interface AppState {
  language: Language;
  role: UserRole;
  mobile: string;
  customerName: string;
  workerName: string;
  selectedSector: string;
  selectedCategory: string;
  activeBooking: WorkerProfile | null;
  leads: CustomerLead[];
  commissionSaved: number;

  setLanguage: (lang: Language) => void;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  setMobile: (num: string) => void;
  setSelectedSector: (sector: string) => void;
  setSelectedCategory: (cat: string) => void;
  setActiveBooking: (worker: WorkerProfile | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  role: 'customer',
  mobile: '9876543210',
  customerName: 'Sunita Sharma',
  workerName: 'Rajesh Kumar',
  selectedSector: 'Sector 22, Chandigarh',
  selectedCategory: 'plumber',
  activeBooking: VERIFIED_WORKERS[0],
  leads: WORKER_ACTIVE_LEADS,
  commissionSaved: 4200,

  setLanguage: (lang) => set({ language: lang }),
  setRole: (role) => set({ role: role }),
  toggleRole: () => set((state) => ({ role: state.role === 'worker' ? 'customer' : 'worker' })),
  setMobile: (num) => set({ mobile: num }),
  setSelectedSector: (sector) => set({ selectedSector: sector }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setActiveBooking: (worker) => set({ activeBooking: worker })
}));
