// GET  /api/businesses — Neighbourhood-scoped business directory
// POST /api/businesses — Register a new business listing

import { NextRequest, NextResponse } from 'next/server';
import { createClient }      from '@/lib/supabase/server';
import { fetchBusinesses }   from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const neighborhoodId   = searchParams.get('neighborhoodId') ?? '';
  const governorateId    = searchParams.get('governorateId')  ?? '';
  const category         = searchParams.get('category')       ?? undefined;
  const search           = searchParams.get('search')         ?? undefined;

  if (!neighborhoodId || !governorateId) {
    return NextResponse.json({ error: 'neighborhoodId and governorateId required' }, { status: 400 });
  }

  try {
    const supabase   = await createClient();
    const businesses = await fetchBusinesses(supabase, neighborhoodId, governorateId, { category, search });
    return NextResponse.json(businesses);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.name?.trim())     return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!body.category?.trim()) return NextResponse.json({ error: 'category is required' }, { status: 400 });

    // Resolve submitter's neighborhood (fall back to profile when not sent by client)
    let resolvedNeighborhoodId: string | null = body.neighborhood_id ?? null;
    if (!resolvedNeighborhoodId) {
      const { data: profile } = await supabase
        .from('users')
        .select('neighborhood_id')
        .eq('id', user.id)
        .single();
      resolvedNeighborhoodId = profile?.neighborhood_id ?? null;
    }
    if (!resolvedNeighborhoodId) {
      return NextResponse.json({ error: 'neighborhood_id could not be resolved' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id:        user.id,
        neighborhood_id: resolvedNeighborhoodId,
        name:            body.name.trim(),
        category:        body.category.trim(),
        description:     body.description?.trim() ?? null,
        phone:           body.phone?.trim() ?? null,
        address:         body.address?.trim() ?? null,
        is_verified:     false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
