'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { getSupabaseClient } from '@/lib/supabase/client';

// Mounts once in the root layout. Re-hydrates auth state from the live
// Supabase session and listens for sign-in / sign-out events.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initAuth, logout } = useStore();

  useEffect(() => {
    // Restore session on first load
    initAuth();

    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN')  initAuth();
      if (event === 'SIGNED_OUT') logout();
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
