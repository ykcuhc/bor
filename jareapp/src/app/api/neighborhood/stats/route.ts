import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const neighborhoodId = req.nextUrl.searchParams.get('neighborhoodId');
  if (!neighborhoodId) return NextResponse.json({ member_count: 0, business_count: 0 });

  const supabase = await createClient();

  const [membersRes, bizRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('neighborhood_id', neighborhoodId),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('neighborhood_id', neighborhoodId),
  ]);

  return NextResponse.json({
    member_count:   membersRes.count  ?? 0,
    business_count: bizRes.count      ?? 0,
  });
}
