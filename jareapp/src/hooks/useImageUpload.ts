'use client';

// ============================================================
// useImageUpload — manage multiple image uploads for a post
//
// Handles: file validation → XHR upload with progress →
//   preview generation → removal → final URL list for the post.
// ============================================================

import { useState, useCallback } from 'react';
import { uploadImage, deleteImage, validateImageFile } from '@/lib/supabase/storage';
import type { UploadedImage } from '@/lib/types/notifications';

interface UploadState {
  file:     File;
  preview:  string;   // object URL for instant preview
  progress: number;   // 0-100
  uploaded?: UploadedImage;
  error?:  string;
}

interface UseImageUploadReturn {
  uploads:    UploadState[];
  isUploading:boolean;
  addFiles:   (files: FileList | File[]) => void;
  removeFile: (index: number) => Promise<void>;
  urls:       string[];  // Final public URLs ready for the post payload
}

const MAX_IMAGES = 10;

export function useImageUpload(
  bucket:     'post-images' | 'avatars' = 'post-images',
  isDemoMode: boolean = false
): UseImageUploadReturn {
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const isUploading = uploads.some(u => u.progress < 100 && !u.error);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_IMAGES - uploads.length);

    arr.forEach(file => {
      const error = validateImageFile(file);
      const preview = URL.createObjectURL(file);
      const state: UploadState = { file, preview, progress: error ? 0 : 1, error: error ?? undefined };

      setUploads(prev => [...prev, state]);
      if (error) return;

      if (isDemoMode) {
        // In demo mode simulate progress and resolve with a placeholder URL
        let pct = 0;
        const iv = setInterval(() => {
          pct = Math.min(100, pct + 20);
          setUploads(prev =>
            prev.map(u => u.preview === preview
              ? { ...u, progress: pct, uploaded: pct === 100 ? { url: preview, path: '', size: file.size, mimeType: file.type } : undefined }
              : u
            )
          );
          if (pct === 100) clearInterval(iv);
        }, 200);
        return;
      }

      uploadImage(file, bucket, pct => {
        setUploads(prev =>
          prev.map(u => u.preview === preview ? { ...u, progress: pct } : u)
        );
      })
        .then(uploaded => {
          setUploads(prev =>
            prev.map(u => u.preview === preview ? { ...u, progress: 100, uploaded } : u)
          );
        })
        .catch(err => {
          setUploads(prev =>
            prev.map(u => u.preview === preview ? { ...u, error: err.message } : u)
          );
        });
    });
  }, [uploads.length, bucket, isDemoMode]);

  async function removeFile(index: number) {
    const target = uploads[index];
    URL.revokeObjectURL(target.preview);

    // Delete from storage if already uploaded
    if (target.uploaded?.path && !isDemoMode) {
      await deleteImage(bucket, target.uploaded.path).catch(() => {});
    }

    setUploads(prev => prev.filter((_, i) => i !== index));
  }

  const urls = uploads
    .filter(u => u.uploaded?.url)
    .map(u => u.uploaded!.url);

  return { uploads, isUploading, addFiles, removeFile, urls };
}
