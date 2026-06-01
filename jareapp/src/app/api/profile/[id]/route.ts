// GET   /api/profile/[id]  — Fetch a user's public profile
// PATCH /api/profile/[id]  — Update the authenticated user's own profile

import { NextRequest, NextResponse } from 'next/server';
import { createClient }  from '@/lib/supabase/server';
import { fetchProfile }  from '@/lib/supabase/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const profile  = await fetchProfile(supabase, id);
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.id !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();
    // Whitelist updatable fields — never allow neighborhood_id change here
    const allowed = ['full_name', 'bio', 'avatar_url', 'phone'];
    const safe    = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const { error } = await supabase
      .from('users')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
