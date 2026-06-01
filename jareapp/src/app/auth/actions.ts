'use server';

// ============================================================
// Auth Server Actions
// Called directly from Client Components via form actions.
// Server Actions run on the server — safe to use service-role
// operations and redirect() here.
// ============================================================

import { revalidatePath } from 'next/cache';
import { redirect }        from 'next/navigation';
import { createClient }    from '@/lib/supabase/server';

// ── Sign In ──────────────────────────────────────────────────
export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  });

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/');
}

// ── Sign Up ───────────────────────────────────────────────────
// Two-phase: creates auth user then inserts the public profile row
// with the neighbourhood that was selected during onboarding.
// The neighborhood_id is the cornerstone of geographical fencing.
export async function signUp(params: {
  email:          string;
  password:       string;
  fullName:       string;
  username:       string;
  neighborhoodId: string;   // UUID from the neighborhoods table
  governorateId:  string;   // UUID from the governorates table
}): Promise<{ error: string | null; userId?: string }> {
  const supabase = await createClient();

  // 1. Create the auth.users row
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    params.email,
    password: params.password,
    options:  { data: { full_name: params.fullName } },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Signup failed. Please try again.' };
  }

  // 2. Insert the public users profile row.
  //    This is what the RLS policies read to scope the feed.
  const { error: profileError } = await supabase.from('users').insert({
    id:                  authData.user.id,
    full_name:           params.fullName,
    username:            params.username.toLowerCase().trim(),
    neighborhood_id:     params.neighborhoodId,
    governorate_id:      params.governorateId,
    verification_status: 'unverified',
    is_premium:          false,
  });

  if (profileError) {
    // Roll back: delete the auth user so signup can be retried cleanly
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  return { error: null, userId: authData.user.id };
}

// ── Sign Out ─────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

// ── Update Profile ────────────────────────────────────────────
export async function updateProfile(
  _prevState: { error: string; success: boolean } | null,
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated', success: false };

  const { error } = await supabase
    .from('users')
    .update({
      full_name: formData.get('full_name') as string,
      bio:       formData.get('bio')       as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { error: error.message, success: false };

  revalidatePath('/profile/' + user.id);
  return { error: '', success: true };
}
