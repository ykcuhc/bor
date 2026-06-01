'use client';

import { useState } from 'react';
import { X, ChevronDown, Globe, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import ImageUploader from '@/components/ui/ImageUploader';
import type { PostCategory, GeographicalScope, Post } from '@/lib/types';
import { POST_CATEGORY_META } from '@/lib/types';
import { DUMMY_USERS, DUMMY_NEIGHBORHOODS } from '@/lib/data/dummy-data';
import { useAuth } from '@/context/AuthContext';

interface CreatePostFormProps {
  neighborhoodId:  string;
  governorateId:   string;
  onPostCreated:   (post: Post) => void;
  onClose?:        () => void;
  isDemoMode?:     boolean;
}

const CATEGORY_OPTIONS = Object.entries(POST_CATEGORY_META) as [PostCategory, typeof POST_CATEGORY_META[PostCategory]][];

export default function CreatePostForm({
  neighborhoodId,
  governorateId,
  onPostCreated,
  onClose,
  isDemoMode = false,
}: CreatePostFormProps) {
  const { profile } = useAuth();

  // In demo mode fall back to dummy user/neighborhood so the form renders
  const currentUser = profile ?? DUMMY_USERS[0];
  const neighborhoodName = profile?.neighborhood?.name_en
    ?? DUMMY_NEIGHBORHOODS.find(n => n.id === neighborhoodId)?.name_en
    ?? 'Your Neighborhood';
  const governorateName = profile?.governorate?.name_en ?? 'Your Governorate';

  const [category,    setCategory]   = useState<PostCategory>('general');
  const [scope,       setScope]      = useState<GeographicalScope>('neighborhood');
  const [title,       setTitle]      = useState('');
  const [body,        setBody]       = useState('');
  const [imageUrls,   setImageUrls]  = useState<string[]>([]);
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]      = useState('');

  const showTitle = category === 'classifieds' || category === 'events' || category === 'safety';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) { setError('Please write something before posting.'); return; }
    setError('');
    setSubmitting(true);

    if (isDemoMode) {
      // Optimistic demo post — no network call needed
      const newPost: Post = {
        id:                 `post-${Date.now()}`,
        author_id:          currentUser.id,
        neighborhood_id:    neighborhoodId,
        title:              title.trim() || null,
        body:               body.trim(),
        image_urls:         imageUrls.length ? imageUrls : null,
        category,
        geographical_scope: scope,
        is_pinned:          false,
        is_removed:         false,
        comment_count:      0,
        reaction_count:     0,
        created_at:         new Date().toISOString(),
        updated_at:         new Date().toISOString(),
        author:             currentUser,
        neighborhood:       profile?.neighborhood ?? DUMMY_NEIGHBORHOODS[0],
        user_reaction:      null,
      };
      onPostCreated(newPost);
      reset();
      return;
    }

    try {
      const res = await fetch('/api/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          neighborhood_id:    neighborhoodId,
          body:               body.trim(),
          title:              title.trim() || null,
          image_urls:         imageUrls.length ? imageUrls : null,
          category,
          geographical_scope: scope,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? 'Failed to post');
      }

      const post: Post = await res.json();
      onPostCreated(post);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setBody('');
    setTitle('');
    setImageUrls([]);
    setCategory('general');
    setScope('neighborhood');
    setSubmitting(false);
    onClose?.();
  }

  void governorateId; // used for context, not rendered directly here

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Post to Neighborhood</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Author row + scope toggle */}
        <div className="flex items-center gap-3">
          <Avatar src={currentUser.avatar_url} name={currentUser.full_name} size="md" />
          <div>
            <p className="font-medium text-sm text-gray-900">{currentUser.full_name}</p>
            <button
              type="button"
              onClick={() => setScope(s => s === 'neighborhood' ? 'governorate' : 'neighborhood')}
              className={clsx(
                'flex items-center gap-1 text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full transition-colors',
                scope === 'neighborhood'
                  ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
            >
              {scope === 'neighborhood'
                ? <><Lock className="w-2.5 h-2.5" /> {neighborhoodName}</>
                : <><Globe className="w-2.5 h-2.5" /> {governorateName} (Governorate-wide)</>
              }
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div>
          <p className="label">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map(([cat, meta]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={clsx(
                  'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all',
                  category === cat
                    ? `${meta.color} border-current shadow-sm`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                )}
              >
                <span>{meta.icon}</span> {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional title */}
        {showTitle && (
          <div>
            <label className="label">
              Title <span className="text-gray-400">(recommended)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                category === 'classifieds' ? 'e.g. iPhone 15 for sale — 200 KD'
                : category === 'events'    ? 'e.g. Community cleanup this Saturday'
                :                            'e.g. Suspicious vehicle on Block 3'
              }
              className="input"
              maxLength={120}
            />
          </div>
        )}

        {/* Body */}
        <div>
          <label className="label">
            {category === 'general' ? "What's happening in your neighborhood?" : 'Details'}
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              category === 'safety'          ? 'Describe what happened, when, and where…'
              : category === 'recommendation' ? 'Who are you recommending and why?'
              : category === 'classifieds'    ? 'Describe the item, condition, and price…'
              : category === 'lost_found'     ? 'Describe the item/pet and where last seen…'
              : 'Share with your neighbors…'
            }
            rows={4}
            className="input resize-none"
            maxLength={2000}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{body.length}/2000</p>
        </div>

        {/* Image upload */}
        <ImageUploader
          bucket="post-images"
          maxImages={5}
          isDemoMode={isDemoMode}
          onUrlsChange={setImageUrls}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          {onClose && (
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          )}
          <button type="submit" disabled={submitting || !body.trim()} className="btn-primary text-sm">
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
