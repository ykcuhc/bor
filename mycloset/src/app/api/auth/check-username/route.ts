import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory rate limiting ─────────────────────────────────────────────────

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 30;
const WINDOW_MS  = 60_000;

function isRateLimited(ip: string): boolean {
  const now        = Date.now();
  const prev       = (rateLimitMap.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (prev.length >= RATE_LIMIT) return true;
  rateLimitMap.set(ip, [...prev, now]);
  return false;
}

// ─── Username format validation ──────────────────────────────────────────────

function validateUsernameFormat(username: string): string | null {
  if (username.length < 3 || username.length > 20) {
    return 'Username must be 3–20 characters';
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    return 'Username may only contain letters, numbers, underscores, and periods';
  }
  if (username.startsWith('.') || username.endsWith('.')) {
    return 'Username cannot start or end with a period';
  }
  if (/\.\./.test(username)) {
    return 'Username cannot contain consecutive periods';
  }
  return null;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429 },
    );
  }

  const username = request.nextUrl.searchParams.get('username') ?? '';

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return NextResponse.json({ error: formatError }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Service unavailable. Please try again.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ available: data === null });
}
