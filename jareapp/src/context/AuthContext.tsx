'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import { DUMMY_USERS } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

interface AuthContextValue {
  session:       Session | null;
  supabaseUser:  SupabaseUser | null;
  profile:       User | null;
  loading:       boolean;
  isDemoMode:    boolean;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profile,      setProfile]      = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);

  // In demo mode we always use the first dummy user so every page renders
  useEffect(() => {
    if (IS_DEMO) {
      setProfile(DUMMY_USERS[0]);
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('users')
      .select(`
        *,
        neighborhood:neighborhoods!users_neighborhood_id_fkey(
          id, name_en, name_ar, governorate_id,
          governorate:governorates!neighborhoods_governorate_id_fkey(id, name_en, name_ar, code)
        ),
        governorate:governorates!users_governorate_id_fkey(id, name_en, name_ar, code)
      `)
      .eq('id', userId)
      .single();

    if (data) setProfile(data as User);
  }, []);

  useEffect(() => {
    if (IS_DEMO) return;

    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  async function signOut() {
    if (IS_DEMO) return;
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setSupabaseUser(null);
  }

  async function refreshProfile() {
    if (supabaseUser) await fetchProfile(supabaseUser.id);
  }

  return (
    <AuthContext.Provider value={{
      session, supabaseUser, profile, loading, isDemoMode: IS_DEMO, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
