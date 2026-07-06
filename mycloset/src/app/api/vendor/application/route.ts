import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rlMap = new Map<string, number[]>();
const RL_MAX = 60;
const RL_WIN = 60_000;

function rateLimit(ip: string): boolean {
  const now  = Date.now();
  const prev = (rlMap.get(ip) ?? []).filter(t => now - t < RL_WIN);
  if (prev.length >= RL_MAX) return true;
  rlMap.set(ip, [...prev, now]);
  return false;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

// ─── Admin client (bypasses RLS for admin ops — not used for user ops) ────────

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── GET — load existing draft for authenticated user ────────────────────────

export async function GET(req: NextRequest) {
  if (rateLimit(clientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vendor_applications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load application' }, { status: 500 });
  }

  return NextResponse.json({ application: data ?? null });
}

// ─── POST — create a new draft ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (rateLimit(clientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getSupabaseServerClient();

  // Check for existing application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Application already exists', applicationId: existing.id, status: existing.status },
      { status: 409 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vendor_applications')
    .insert({ user_id: user.id, status: 'draft', current_step: 1, completed_steps: [] })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }

  return NextResponse.json({ applicationId: data.id }, { status: 201 });
}

// ─── PATCH — autosave / update draft ─────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (rateLimit(clientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Strip fields that must not be user-controlled
  const forbidden = ['id', 'user_id', 'status', 'identity_verification_status',
    'business_verification_status', 'reviewer_notes', 'reviewed_at'];
  forbidden.forEach(f => delete body[f]);

  // Input length guards
  if (typeof body.store_description === 'string' && body.store_description.length > 1000) {
    return NextResponse.json({ error: 'Store description too long' }, { status: 422 });
  }
  if (typeof body.store_tagline === 'string' && body.store_tagline.length > 150) {
    return NextResponse.json({ error: 'Tagline too long' }, { status: 422 });
  }
  if (typeof body.about_store === 'string' && body.about_store.length > 2000) {
    return NextResponse.json({ error: 'About store too long' }, { status: 422 });
  }

  // Sanitize store_username
  if (typeof body.store_username === 'string') {
    body.store_username = body.store_username.toLowerCase().replace(/[^a-z0-9_.]/g, '');
  }

  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vendor_applications')
    .update(body)
    .eq('user_id', user.id)
    .in('status', ['draft', 'additional_info_required'])
    .select('id, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Application not found or cannot be edited' }, { status: 404 });
  }

  return NextResponse.json({ savedAt: data.updated_at });
}

// ─── PUT — submit application ─────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  if (rateLimit(clientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getSupabaseServerClient();

  // Fetch current application
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: app, error: fetchErr } = await (supabase as any)
    .from('vendor_applications')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (app.status !== 'draft' && app.status !== 'additional_info_required') {
    return NextResponse.json({ error: 'Application cannot be submitted in its current state' }, { status: 409 });
  }
  if (!app.terms_accepted) {
    return NextResponse.json({ error: 'You must accept the vendor terms and conditions' }, { status: 422 });
  }

  // Minimum required fields
  const required = ['vendor_type', 'store_name', 'store_username', 'store_description',
    'legal_name', 'date_of_birth', 'identity_doc_path',
    'payout_holder_name', 'payout_bank_name', 'payout_iban',
    'return_policy', 'refund_policy', 'cancellation_policy', 'support_contact'];

  for (const field of required) {
    if (!app[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 422 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (supabase as any)
    .from('vendor_applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: 'submitted' });
}
