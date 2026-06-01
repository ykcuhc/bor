'use client';

import { useState } from 'react';
import { Image as ImageIcon, X, ChevronDown, Globe, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import type { PostCategory, GeographicalScope, Post } from '@/lib/types';
import { POST_CATEGORY_META } from '@/lib/types';
import { DUMMY_USERS, DUMMY_NEIGHBORHOODS } from '@/lib/data/dummy-data';

interface CreatePostFormProps {
  onPostCreated: (post: Post) => void;
  onClose?: () => void;
}

const CURRENT_USER = DUMMY_USERS[0];
const CURRENT_NEIGHBORHOOD = DUMMY_NEIGHBORHOODS[0];

// All selectable categories when composing a new post
const CATEGORY_OPTIONS = Object.entries(POST_CATEGORY_META) as [PostCategory, typeof POST_CATEGORY_META[PostCategory]][];

export default function CreatePostForm({ onPostCreated, onClose }: CreatePostFormProps) {
  const [category, setCategory] = useState<PostCategory>('general');
  const [scope, setScope] = useState<GeographicalScope>('neighborhood');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Classifieds and events benefit from a title; others are optional
  const showTitle = category === 'classifieds' || category === 'events' || category === 'safety';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError('Please write something before posting.');
      return;
    }
    setError('');
    setSubmitting(true);

    // Build the new post object optimistically.
    // In production: call Supabase insert on the `posts` table,
    // then use the returned row (which has the server-generated ID and timestamp).
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author_id: CURRENT_USER.id,
      neighborhood_id: CURRENT_NEIGHBORHOOD.id,
      title: title.trim() || null,
      body: body.trim(),
      image_urls: null,
      category,
      geographical_scope: scope,
      is_pinned: false,
      is_removed: false,
      comment_count: 0,
      reaction_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: CURRENT_USER,
      neighborhood: CURRENT_NEIGHBORHOOD,
      user_reaction: null,
    };

    onPostCreated(newPost);
    setSubmitting(false);
    setBody('');
    setTitle('');
    setCategory('general');
    onClose?.();
  }

  return (
    <div className="card p-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Post to Neighborhood</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ── Author row ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Avatar src={CURRENT_USER.avatar_url} name={CURRENT_USER.full_name} size="md" />
          <div>
            <p className="font-medium text-sm text-gray-900">{CURRENT_USER.full_name}</p>
            {/* Scope selector — neighborhood vs. governorate-wide */}
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
                ? <><Lock className="w-2.5 h-2.5" /> {CURRENT_NEIGHBORHOOD.name_en}</>
                : <><Globe className="w-2.5 h-2.5" /> {CURRENT_NEIGHBORHOOD.governorate?.name_en} (Governorate-wide)</>
              }
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ── Category selector ───────────────────────────────── */}
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

        {/* ── Title (conditional) ──────────────────────────────── */}
        {showTitle && (
          <div>
            <label className="label">Title <span className="text-gray-400">(recommended)</span></label>
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

        {/* ── Body ────────────────────────────────────────────── */}
        <div>
          <label className="label">
            {category === 'general' ? "What's happening in your neighborhood?" : 'Details'}
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              category === 'safety'         ? 'Describe what happened, when, and where…'
              : category === 'recommendation' ? 'Who are you recommending and why?'
              : category === 'classifieds'    ? 'Describe the item, condition, and price…'
              : category === 'lost_found'     ? 'Describe the item or pet and where it was last seen…'
              : 'Share with your neighbors…'
            }
            rows={4}
            className="input resize-none"
            maxLength={2000}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{body.length}/2000</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          {/* Image upload placeholder */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Add photo
          </button>

          <div className="flex items-center gap-2">
            {onClose && (
              <button type="button" onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
            )}
            <button type="submit" disabled={submitting || !body.trim()} className="btn-primary text-sm">
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
