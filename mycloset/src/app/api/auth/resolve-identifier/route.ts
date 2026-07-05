import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory rate limiting (20 req / 60 s per IP) ─────────────────────────

const rlMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now  = Date.now();
  const prev = (rlMap.get(ip) ?? []).filter(t => now - t < 60_000);
  if (prev.length >= 20) return true;
  rlMap.set(ip, [...prev, now]);
  return false;
}

// ─── Identifier type detection ───────────────────────────────────────────────

function detectType(value: string): 'email' | 'username' {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'email' : 'username';
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const identifier = (request.nextUrl.searchParams.get('identifier') ?? '').trim();

  if (!identifier) {
    return NextResponse.json({ email: null }, { status: 200 });
  }

  const type = detectType(identifier);

  // Email is its own resolved value — no lookup needed
  if (type === 'email') {
    return NextResponse.json({ email: identifier, type: 'email' });
  }

  // Username → look up email in public.users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('username', identifier.toLowerCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  return NextResponse.json({
    email: data?.email ?? null,
    type:  'username',
  });
}
