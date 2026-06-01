'use client';

import { useRef, useCallback } from 'react';
import { ImageIcon, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploaderProps {
  bucket?:      'post-images' | 'avatars';
  maxImages?:   number;
  isDemoMode?:  boolean;
  onUrlsChange: (urls: string[]) => void;
}

export default function ImageUploader({
  bucket      = 'post-images',
  maxImages   = 10,
  isDemoMode  = false,
  onUrlsChange,
}: ImageUploaderProps) {
  const { uploads, isUploading, addFiles, removeFile, urls } = useImageUpload(bucket, isDemoMode);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dragActive = useRef(false);

  // Notify parent whenever the URL list changes
  const prevUrls = useRef<string[]>([]);
  if (JSON.stringify(prevUrls.current) !== JSON.stringify(urls)) {
    prevUrls.current = urls;
    onUrlsChange(urls);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragActive.current = false;
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const canAddMore = uploads.length < maxImages;

  return (
    <div className="space-y-2">
      {/* Upload zone */}
      {canAddMore && (
        <div
          onDragOver={e => { e.preventDefault(); dragActive.current = true; }}
          onDragLeave={() => { dragActive.current = false; }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
            'hover:border-brand-400 hover:bg-brand-50',
            'border-gray-200 bg-gray-50'
          )}
        >
          <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">
            <span className="font-medium text-brand-600">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            JPEG, PNG, WebP, GIF — max 5 MB each · {uploads.length}/{maxImages}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {uploads.map((u, i) => (
            <div key={u.preview} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.preview}
                alt={`Upload ${i + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Progress overlay */}
              {u.progress < 100 && !u.error && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <span className="text-white text-xs font-medium">{u.progress}%</span>
                  {/* Progress bar */}
                  <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success indicator */}
              {u.progress === 100 && !u.error && (
                <div className="absolute top-1 left-1 bg-brand-600 rounded-full p-0.5">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Error indicator */}
              {u.error && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
                  <div className="text-center">
                    <AlertCircle className="w-4 h-4 text-white mx-auto" />
                    <p className="text-white text-[10px] mt-0.5 line-clamp-2">{u.error}</p>
                  </div>
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={e => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 bg-gray-900/60 hover:bg-gray-900/80
                           rounded-full p-0.5 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading…
        </p>
      )}
    </div>
  );
}
