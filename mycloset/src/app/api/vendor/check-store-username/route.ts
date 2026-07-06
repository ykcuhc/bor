import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const rlMap = new Map<string, number[]>();
const RL_MAX = 40;
const RL_WIN = 60_000;

function rateLimit(ip: string): boolean {
  const now  = Date.now();
  const prev = (rlMap.get(ip) ?? []).filter(t => now - t < RL_WIN);
  if (prev.length >= RL_MAX) return true;
  rlMap.set(ip, [...prev, now]);
  return false;
}

const RESERVED = new Set([
  'admin', 'api', 'vendor', 'vendors', 'support', 'help', 'about',
  'terms', 'privacy', 'legal', 'miova', 'store', 'stores', 'shop',
  'marketplace', 'register', 'login', 'signup', 'auth', 'settings',
  'dashboard', 'sell', 'buy', 'search', 'notifications', 'profile',
  'feed', 'home', 'explore', 'discover', 'trending', 'new', 'sale',
]);

function validateStoreUsername(username: string): string | null {
  const u = username.toLowerCase();
  if (u.length < 3 || u.length > 30)        return 'Username must be 3–30 characters';
  if (!/^[a-z0-9][a-z0-9_.]*[a-z0-9]$/.test(u) && u.length > 1)
                                             return 'Only letters, numbers, underscores, and periods';
  if (/[_.]{2}/.test(u))                    return 'No consecutive special characters';
  if (RESERVED.has(u))                      return 'This username is reserved';
  return null;
}

export async function GET(request: NextRequest) {
  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await getSupabaseServerClient().then(async (s) => {
    const { data: { session } } = await s.auth.getSession();
    return session?.user ?? null;
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const username = request.nextUrl.searchParams.get('username')?.toLowerCase().trim() ?? '';
  if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

  const formatError = validateStoreUsername(username);
  if (formatError) return NextResponse.json({ available: false, error: formatError }, { status: 200 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vendor_applications')
    .select('store_username, user_id')
    .eq('store_username', username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Username is available if: no record exists, or it belongs to the current user
  const available = !data || data.user_id === user.id;
  return NextResponse.json({ available });
}
