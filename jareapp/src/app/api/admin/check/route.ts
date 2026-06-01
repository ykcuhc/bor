import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const neighborhoodId = req.nextUrl.searchParams.get('neighborhoodId');
  if (!neighborhoodId) return NextResponse.json({ isAdmin: false });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ isAdmin: false });

  const { data } = await supabase
    .from('neighborhood_admins')
    .select('id')
    .eq('neighborhood_id', neighborhoodId)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ isAdmin: !!data });
}
