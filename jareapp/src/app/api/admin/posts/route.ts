import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const neighborhoodId = req.nextUrl.searchParams.get('neighborhoodId');
  if (!neighborhoodId) return NextResponse.json([]);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify admin
  const { data: admin } = await supabase
    .from('neighborhood_admins')
    .select('id')
    .eq('neighborhood_id', neighborhoodId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, body, category, is_pinned, is_removed,
      comment_count, reaction_count, created_at,
      author:users!posts_author_id_fkey(id, full_name, avatar_url)
    `)
    .eq('neighborhood_id', neighborhoodId)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
