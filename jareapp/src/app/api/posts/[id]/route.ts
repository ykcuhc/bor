// GET    /api/posts/[id]  — Fetch a single post with joins
// DELETE /api/posts/[id]  — Soft-delete (author or moderator only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient }  from '@/lib/supabase/server';
import { fetchPost }     from '@/lib/supabase/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const post     = await fetchPost(supabase, id);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch the post first to check ownership
    const post = await fetchPost(supabase, id);
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (post.author_id !== user.id) {
      // Allow neighborhood admins to remove any post in their neighborhood
      const { data: admin } = await supabase
        .from('neighborhood_admins')
        .select('id')
        .eq('neighborhood_id', post.neighborhood_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete — keeps the row for audit/moderation purposes
    await supabase.from('posts').update({ is_removed: true }).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
