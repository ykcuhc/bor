// ============================================================
// Supabase Storage Utilities
//
// All uploads are routed through the server-side API route
// (/api/storage/upload) so the service role key never reaches
// the browser. The public anon key can only read, not write,
// which prevents unauthorized uploads.
// ============================================================

import { createClient } from '@/lib/supabase/client';
import type { UploadedImage } from '@/lib/types/notifications';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and GIF images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`;
  }
  return null;
}

/**
 * Upload a single image via the secure server-side API route.
 * Returns the public URL and storage path on success.
 */
export async function uploadImage(
  file:   File,
  bucket: 'post-images' | 'avatars',
  onProgress?: (pct: number) => void
): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const form = new FormData();
  form.append('file',   file);
  form.append('bucket', bucket);

  // XMLHttpRequest gives us upload progress; fetch() does not
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadedImage);
      } else {
        try {
          const { error } = JSON.parse(xhr.responseText);
          reject(new Error(error ?? 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.open('POST', '/api/storage/upload');
    xhr.send(form);
  });
}

/**
 * Delete an image from Supabase Storage by its path.
 * Used when a post is deleted or an image is removed.
 */
export async function deleteImage(bucket: 'post-images' | 'avatars', path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Get a temporary signed URL for a private file.
 * (Not needed for public buckets — used only if you make a bucket private.)
 */
export async function getSignedUrl(
  bucket:    'post-images' | 'avatars',
  path:      string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}
