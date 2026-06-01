// POST /api/profile/verify — Submit a neighbourhood address verification request

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { address, block, method } = await request.json();
    if (!address?.trim()) return NextResponse.json({ error: 'address is required' }, { status: 400 });

    // Mark the user's verification as pending so the badge updates immediately
    const { error } = await supabase
      .from('users')
      .update({ verification_status: 'pending' })
      .eq('id', user.id);

    if (error) throw error;

    // TODO: persist verification_requests table row for manual review workflow
    // For now the pending status is the signal to the admin panel

    return NextResponse.json({ success: true, method, address: address.trim(), block: block?.trim() ?? null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
