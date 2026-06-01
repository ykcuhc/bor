'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Share2, MoreHorizontal, Pin, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import CommentSection from '@/components/feed/CommentSection';
import type { Post, ReactionType } from '@/lib/types';
import { REACTION_META } from '@/lib/types';
import { DUMMY_COMMENTS } from '@/lib/data/dummy-data';

interface FeedPostCardProps {
  post: Post;
  currentUserId?: string;
}

// The reactions toolbar — mirrors early Nextdoor's "Thank/Like" system.
const REACTION_OPTIONS: ReactionType[] = ['like', 'helpful', 'thank', 'agree', 'sad'];

export default function FeedPostCard({ post, currentUserId }: FeedPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(
    post.user_reaction ?? null
  );
  const [reactionCount, setReactionCount] = useState(post.reaction_count);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const BODY_PREVIEW_CHARS = 280;
  const isLong = post.body.length > BODY_PREVIEW_CHARS;
  const displayBody = isLong && !expanded
    ? post.body.slice(0, BODY_PREVIEW_CHARS) + '…'
    : post.body;

  const postComments = DUMMY_COMMENTS.filter(c => c.post_id === post.id);

  function handleReaction(reaction: ReactionType) {
    if (activeReaction === reaction) {
      // Toggle off
      setActiveReaction(null);
      setReactionCount(c => c - 1);
    } else {
      if (!activeReaction) setReactionCount(c => c + 1);
      setActiveReaction(reaction);
    }
    setShowReactionPicker(false);
    // In production: call supabase to upsert/delete the reaction row
  }

  return (
    <article className="card overflow-hidden">
      {/* ── Pinned banner ────────────────────────────────────── */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 bg-amber-50 border-b border-amber-100
                        px-4 py-2 text-xs font-medium text-amber-700">
          <Pin className="w-3.5 h-3.5" />
          Pinned by neighborhood admin
        </div>
      )}

      <div className="p-4">
        {/* ── Post header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${post.author?.id}`}>
              <Avatar
                src={post.author?.avatar_url}
                name={post.author?.full_name ?? 'Unknown'}
                size="md"
              />
            </Link>
            <div>
              <Link
                href={`/profile/${post.author?.id}`}
                className="font-semibold text-gray-900 text-sm hover:text-brand-700 transition-colors"
              >
                {post.author?.full_name}
              </Link>
              {/* Neighborhood + timestamp row */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                <span className="text-brand-600 font-medium">
                  {post.neighborhood?.name_en}
                </span>
                <span>·</span>
                <time dateTime={post.created_at}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </time>
                {/* Wider-scope indicator */}
                {post.geographical_scope === 'governorate' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-gray-400">
                      <Globe className="w-3 h-3" />
                      Shared with governorate
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category badge + options menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge category={post.category} />
            <button
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Post options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Post body ──────────────────────────────────────────── */}
        {post.title && (
          <h3 className="font-semibold text-gray-900 mb-1 text-base">{post.title}</h3>
        )}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {displayBody}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-1"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* ── Engagement stats row ─────────────────────────────── */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100
                        text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {/* Reaction summary */}
            {reactionCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-base">
                  {activeReaction ? REACTION_META[activeReaction].emoji : '👍'}
                </span>
                {reactionCount}
              </span>
            )}
          </div>
          {post.comment_count > 0 && (
            <button
              onClick={() => setShowComments(s => !s)}
              className="hover:text-brand-600 hover:underline transition-colors"
            >
              {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────── */}
        <div className="flex items-center gap-1 mt-1 -mx-1">
          {/* Reaction button with picker */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(p => !p)}
              onMouseEnter={() => setShowReactionPicker(true)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeReaction
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>{activeReaction ? REACTION_META[activeReaction].emoji : '👍'}</span>
              <span>{activeReaction ? REACTION_META[activeReaction].label : 'React'}</span>
            </button>

            {/* Reaction picker popup */}
            {showReactionPicker && (
              <div
                className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-white
                           rounded-full shadow-lg border border-gray-100 px-3 py-1.5 z-10"
                onMouseLeave={() => setShowReactionPicker(false)}
              >
                {REACTION_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => handleReaction(r)}
                    title={REACTION_META[r].label}
                    className={clsx(
                      'text-xl hover:scale-125 transition-transform',
                      activeReaction === r && 'scale-125'
                    )}
                  >
                    {REACTION_META[r].emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComments(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Comment
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        {/* ── Comment section ──────────────────────────────────── */}
        {showComments && (
          <CommentSection
            postId={post.id}
            comments={postComments}
            currentUserId={currentUserId ?? 'user-1'}
          />
        )}
      </div>
    </article>
  );
}
