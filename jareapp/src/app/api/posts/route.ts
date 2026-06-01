// GET  /api/posts  — Paginated neighbourhood feed
// POST /api/posts  — Create a new post

import { NextRequest, NextResponse } from 'next/server';
import { createClient }  from '@/lib/supabase/server';
import { fetchFeedPosts, createPost } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorId         = searchParams.get('authorId')       ?? '';
  const neighborhoodId   = searchParams.get('neighborhoodId') ?? '';
  const governorateId    = searchParams.get('governorateId')  ?? '';
  const category         = searchParams.get('category')       ?? undefined;
  const limit            = parseInt(searchParams.get('limit')  ?? '20', 10);
  const offset           = parseInt(searchParams.get('offset') ?? '0',  10);

  try {
    const supabase = await createClient();

    // Author-scoped query: used by profile pages
    if (authorId) {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:users(*), neighborhood:neighborhoods(*)')
        .eq('author_id', authorId)
        .eq('is_removed', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return NextResponse.json(data ?? []);
    }

    if (!neighborhoodId || !governorateId) {
      return NextResponse.json({ error: 'neighborhoodId and governorateId are required' }, { status: 400 });
    }

    const posts = await fetchFeedPosts(supabase, neighborhoodId, governorateId, { category, limit, offset });
    return NextResponse.json(posts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Validate required fields
    if (!body.body?.trim())          return NextResponse.json({ error: 'body is required' }, { status: 400 });
    if (!body.neighborhood_id)       return NextResponse.json({ error: 'neighborhood_id is required' }, { status: 400 });

    const post = await createPost(supabase, {
      author_id:          user.id,
      neighborhood_id:    body.neighborhood_id,
      body:               body.body.trim(),
      title:              body.title?.trim() || null,
      category:           body.category ?? 'general',
      geographical_scope: body.geographical_scope ?? 'neighborhood',
      image_urls:         body.image_urls ?? null,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
