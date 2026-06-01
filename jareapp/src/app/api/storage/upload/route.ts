// POST /api/storage/upload — Secure server-side image upload
//
// Why server-side? The Supabase Storage upload policy uses auth.uid()
// to scope file paths (/<user-id>/filename). Routing through here
// means we can:
//  1. Validate auth before touching Storage.
//  2. Enforce path conventions (userId prefix).
//  3. Never expose the service-role key to the browser.

import { NextRequest, NextResponse } from 'next/server';
import { createClient }  from '@/lib/supabase/server';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE      = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form   = await request.formData();
    const file   = form.get('file')   as File | null;
    const bucket = form.get('bucket') as string | null;

    if (!file)   return NextResponse.json({ error: 'No file provided' },   { status: 400 });
    if (!bucket) return NextResponse.json({ error: 'No bucket specified' }, { status: 400 });
    if (!['post-images', 'avatars'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 422 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 422 });
    }

    // Path: <userId>/<timestamp>-<originalName>
    // Prefixing with userId lets the storage delete policy work.
    const ext      = file.name.split('.').pop() ?? 'jpg';
    const path     = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({
      url:      publicUrl,
      path,
      size:     file.size,
      mimeType: file.type,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
