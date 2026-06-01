// POST   /api/posts/[id]/reactions  — Upsert a reaction
// DELETE /api/posts/[id]/reactions  — Remove the current user's reaction

import { NextRequest, NextResponse } from 'next/server';
import { createClient }     from '@/lib/supabase/server';
import { upsertReaction, deleteReaction } from '@/lib/supabase/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reaction } = await request.json();
    if (!reaction) return NextResponse.json({ error: 'reaction is required' }, { status: 400 });

    await upsertReaction(supabase, postId, user.id, reaction);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await deleteReaction(supabase, postId, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
