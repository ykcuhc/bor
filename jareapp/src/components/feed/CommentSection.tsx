'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { Comment } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { DUMMY_USERS } from '@/lib/data/dummy-data';

interface CommentSectionProps {
  postId:        string;
  comments:      Comment[];
  currentUserId: string;
  isDemoMode?:   boolean;
  onNewComment?: (c: Comment) => void;
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  isDemoMode = false,
  onNewComment,
}: CommentSectionProps) {
  const { profile }      = useAuth();
  const currentUser      = profile ?? DUMMY_USERS.find(u => u.id === currentUserId) ?? DUMMY_USERS[0];
  const [local, setLocal] = useState<Comment[]>(comments);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newBody.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError('');

    // Optimistic insert shown immediately
    const optimistic: Comment = {
      id:         `temp-${Date.now()}`,
      post_id:    postId,
      author_id:  currentUser.id,
      parent_id:  null,
      body:       trimmed,
      is_removed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author:     currentUser,
    };
    setLocal(prev => [...prev, optimistic]);
    setNewBody('');

    if (isDemoMode) { setSubmitting(false); onNewComment?.(optimistic); return; }

    try {
      const res = await fetch(`/api/comments/${postId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: Comment = await res.json();
      // Replace optimistic row with the server-confirmed row
      setLocal(prev => prev.map(c => c.id === optimistic.id ? saved : c));
      onNewComment?.(saved);
    } catch (err) {
      setLocal(prev => prev.filter(c => c.id !== optimistic.id));
      setNewBody(trimmed);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {local.map(comment => (
        <div key={comment.id} className="flex items-start gap-2.5">
          <Avatar
            src={comment.author?.avatar_url}
            name={comment.author?.full_name ?? 'User'}
            size="xs"
          />
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-gray-900">{comment.author?.full_name}</p>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.body}</p>
            </div>
            <time className="text-xs text-gray-400 ml-1 mt-0.5 block">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-500 ml-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-start gap-2.5">
        <Avatar src={currentUser.avatar_url} name={currentUser.full_name} size="xs" />
        <div className="flex-1 flex items-end gap-2">
          <textarea
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder="Write a comment…"
            rows={1}
            onKeyDown={e => {
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
