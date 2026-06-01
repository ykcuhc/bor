// GET  /api/messages — Fetch DM thread list for the current user
// POST /api/messages — Send a direct message

import { NextRequest, NextResponse } from 'next/server';
import { createClient }        from '@/lib/supabase/server';
import { sendDM, fetchDMThreads } from '@/lib/supabase/queries';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const threads = await fetchDMThreads(supabase, user.id);
    return NextResponse.json(threads);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { recipient_id, body } = await request.json();
    if (!recipient_id) return NextResponse.json({ error: 'recipient_id required' }, { status: 400 });
    if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 });
    if (recipient_id === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

    const message = await sendDM(supabase, user.id, recipient_id, body.trim());
    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
