import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  language: 'ar' | 'en';
  unreadMessages: number;
  unreadNotifications: number;
  activeAlerts: number;
  setLanguage: (lang: 'ar' | 'en') => void;
  setUnreadMessages: (count: number) => void;
  setUnreadNotifications: (count: number) => void;
  setActiveAlerts: (count: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ar',
      unreadMessages: 0,
      unreadNotifications: 0,
      activeAlerts: 0,
      setLanguage: (language) => set({ language }),
      setUnreadMessages: (unreadMessages) => set({ unreadMessages }),
      setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
      setActiveAlerts: (activeAlerts) => set({ activeAlerts }),
    }),
    { name: 'jareapp-app' }
  )
);
