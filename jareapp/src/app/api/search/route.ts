import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { IS_DEMO } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q              = (searchParams.get('q') ?? '').trim();
  const neighborhoodId = searchParams.get('neighborhoodId') ?? '';
  const governorateId  = searchParams.get('governorateId')  ?? '';
  const type           = searchParams.get('type') ?? 'all'; // 'all' | 'posts' | 'businesses' | 'people'

  if (!q || q.length < 2) {
    return NextResponse.json({ posts: [], businesses: [], users: [] });
  }

  if (IS_DEMO) {
    return NextResponse.json({ posts: [], businesses: [], users: [] });
  }

  const supabase = await createClient();
  const like     = `%${q}%`;

  const results: { posts: unknown[]; businesses: unknown[]; users: unknown[] } =
    { posts: [], businesses: [], users: [] };

  // Get sibling neighborhoods for geographical scope
  const { data: sibs } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('governorate_id', governorateId);
  const neighborhoodIds = [neighborhoodId, ...((sibs ?? []).map((n: { id: string }) => n.id))];

  if (type === 'all' || type === 'posts') {
    const { data } = await supabase
      .from('posts')
      .select(`
        id, title, body, category, created_at,
        author:users!posts_author_id_fkey(id, full_name, avatar_url),
        neighborhood:neighborhoods!posts_neighborhood_id_fkey(id, name_en)
      `)
      .eq('is_removed', false)
      .in('neighborhood_id', neighborhoodIds)
      .or(`title.ilike.${like},body.ilike.${like}`)
      .order('created_at', { ascending: false })
      .limit(10);
    results.posts = data ?? [];
  }

  if (type === 'all' || type === 'businesses') {
    const { data } = await supabase
      .from('businesses')
      .select(`
        id, name, category, description, is_verified, is_premium, rating_sum, rating_count,
        neighborhood:neighborhoods!businesses_neighborhood_id_fkey(id, name_en)
      `)
      .in('neighborhood_id', neighborhoodIds)
      .or(`name.ilike.${like},description.ilike.${like}`)
      .limit(10);
    results.businesses = data ?? [];
  }

  if (type === 'all' || type === 'people') {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url, verification_status, neighborhood_id')
      .in('neighborhood_id', neighborhoodIds)
      .or(`full_name.ilike.${like},username.ilike.${like}`)
      .limit(10);
    results.users = data ?? [];
  }

  return NextResponse.json(results);
}
