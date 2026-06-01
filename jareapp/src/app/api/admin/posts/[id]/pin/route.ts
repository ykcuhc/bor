import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const { is_pinned }  = await req.json() as { is_pinned: boolean };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get the post's neighborhood to verify admin access
  const { data: post } = await supabase
    .from('posts')
    .select('neighborhood_id')
    .eq('id', postId)
    .single();
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: admin } = await supabase
    .from('neighborhood_admins')
    .select('id')
    .eq('neighborhood_id', post.neighborhood_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned })
    .eq('id', postId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, is_pinned });
}
