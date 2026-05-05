import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  neighborhoodId?: string;
  preferredLanguage: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  pendingPhone: string | null;
  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  setPendingPhone: (phone: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      pendingPhone: null,
      setAuth: (user, token, refreshToken) => set({ user, token, refreshToken }),
      setUser: (user) => set({ user }),
      setPendingPhone: (phone) => set({ pendingPhone: phone }),
      logout: () => set({ user: null, token: null, refreshToken: null, pendingPhone: null }),
    }),
    { name: 'jareapp-auth' }
  )
);
