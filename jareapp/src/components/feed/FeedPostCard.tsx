'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Share2, MoreHorizontal, Pin, Globe, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import CommentSection from '@/components/feed/CommentSection';
import { useReaction } from '@/hooks/useReaction';
import { useFeedStore } from '@/store/feedStore';
import type { Post, ReactionType } from '@/lib/types';
import { REACTION_META } from '@/lib/types';
import { DUMMY_COMMENTS } from '@/lib/data/dummy-data';

interface FeedPostCardProps {
  post:          Post;
  currentUserId: string;
  isDemoMode?:   boolean;
}

const REACTION_OPTIONS: ReactionType[] = ['like', 'helpful', 'thank', 'agree', 'sad'];

export default function FeedPostCard({ post, currentUserId, isDemoMode = false }: FeedPostCardProps) {
  const store = useFeedStore();
  const { active: activeReaction, count: reactionCount, react } = useReaction(
    post.id,
    post.user_reaction ?? null,
    post.reaction_count,
    isDemoMode
  );

  const [expanded,           setExpanded]           = useState(false);
  const [showComments,       setShowComments]       = useState(false);
  const [commentCount,       setCommentCount]       = useState(post.comment_count);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu,           setShowMenu]           = useState(false);
  const [deleting,           setDeleting]           = useState(false);

  const PREVIEW_CHARS = 280;
  const isLong        = post.body.length > PREVIEW_CHARS;
  const displayBody   = isLong && !expanded
    ? post.body.slice(0, PREVIEW_CHARS) + '…'
    : post.body;

  const demoComments   = DUMMY_COMMENTS.filter(c => c.post_id === post.id);
  const isOwnPost      = post.author_id === currentUserId;

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    if (isDemoMode) { store.removePost(post.id); return; }
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) store.removePost(post.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="card overflow-hidden" aria-label={`Post by ${post.author?.full_name}`}>
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 bg-amber-50 border-b border-amber-100
                        px-4 py-2 text-xs font-medium text-amber-700">
          <Pin className="w-3.5 h-3.5" />
          Pinned by neighborhood admin
        </div>
      )}

      <div className="p-4">
        {/* ── Header ─────────────────────────────────────────── */}
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
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                <span className="text-brand-600 font-medium">{post.neighborhood?.name_en}</span>
                <span>·</span>
                <time dateTime={post.created_at}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </time>
                {post.geographical_scope === 'governorate' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-gray-400">
                      <Globe className="w-3 h-3" />
                      Governorate-wide
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge category={post.category} />
            {/* Options menu */}
            <div className="relative">
              <button
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowMenu(m => !m)}
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 bg-white rounded-xl shadow-lg border border-gray-100
                                py-1 w-40 z-20 text-sm">
                  {isOwnPost && (
                    <button
                      onClick={() => { setShowMenu(false); handleDelete(); }}
                      disabled={deleting}
                      className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deleting ? 'Deleting…' : 'Delete post'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    Report post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        {post.title && (
          <h3 className="font-semibold text-gray-900 mb-1 text-base">{post.title}</h3>
        )}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayBody}</p>
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-1"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* ── Engagement stats ─────────────────────────────────── */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {reactionCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-base">
                  {activeReaction ? REACTION_META[activeReaction].emoji : '👍'}
                </span>
                {reactionCount}
              </span>
            )}
          </div>
          {commentCount > 0 && (
            <button
              onClick={() => setShowComments(s => !s)}
              className="hover:text-brand-600 hover:underline transition-colors"
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────── */}
        <div className="flex items-center gap-1 mt-1 -mx-1">
          {/* Reaction button */}
          <div
            className="relative"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            <button
              onClick={() => react(activeReaction ?? 'like')}
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

            {showReactionPicker && (
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-white
                              rounded-full shadow-lg border border-gray-100 px-3 py-1.5 z-10">
                {REACTION_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => react(r)}
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

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                             text-gray-600 hover:bg-gray-50 transition-colors ml-auto">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>

        {/* ── Comments ─────────────────────────────────────────── */}
        {showComments && (
          <CommentSection
            postId={post.id}
            comments={isDemoMode ? demoComments : []}
            currentUserId={currentUserId}
            isDemoMode={isDemoMode}
            onNewComment={() => setCommentCount(c => c + 1)}
          />
        )}
      </div>
    </article>
  );
}
