// GET  /api/comments/[postId]  — Fetch top-level comments for a post
// POST /api/comments/[postId]  — Create a new comment

import { NextRequest, NextResponse } from 'next/server';
import { createClient }      from '@/lib/supabase/server';
import { fetchComments, createComment } from '@/lib/supabase/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    const supabase = await createClient();
    const comments = await fetchComments(supabase, postId);
    return NextResponse.json(comments);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { body, parent_id } = await request.json();
    if (!body?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 });

    const comment = await createComment(supabase, {
      post_id:   postId,
      author_id: user.id,
      body:      body.trim(),
      parent_id: parent_id ?? null,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
