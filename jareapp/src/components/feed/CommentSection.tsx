'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Comment } from '@/lib/types';
import { DUMMY_USERS } from '@/lib/data/dummy-data';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId: string;
}

export default function CommentSection({ postId, comments, currentUserId }: CommentSectionProps) {
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUser = DUMMY_USERS.find(u => u.id === currentUserId) ?? DUMMY_USERS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newBody.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    // Optimistic update — add comment immediately before server confirms.
    // In production: POST to /api/comments or call Supabase directly.
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      author_id: currentUserId,
      parent_id: null,
      body: trimmed,
      is_removed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentUser,
    };

    setLocalComments(prev => [...prev, optimistic]);
    setNewBody('');
    setSubmitting(false);
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* Existing comments */}
      {localComments.map(comment => (
        <div key={comment.id} className="flex items-start gap-2.5">
          <Avatar
            src={comment.author?.avatar_url}
            name={comment.author?.full_name ?? 'User'}
            size="xs"
          />
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-gray-900">
                {comment.author?.full_name}
              </p>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.body}</p>
            </div>
            <time className="text-xs text-gray-400 ml-1 mt-0.5 block">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>
      ))}

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2.5">
        <Avatar src={currentUser.avatar_url} name={currentUser.full_name} size="xs" />
        <div className="flex-1 flex items-end gap-2">
          <textarea
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder="Write a comment…"
            rows={1}
            onKeyDown={e => {
              // Submit on Enter (not Shift+Enter)
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-brand-500
                       focus:border-transparent resize-none bg-gray-50"
          />
          <button
            type="submit"
            disabled={!newBody.trim() || submitting}
            className="p-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Post comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
