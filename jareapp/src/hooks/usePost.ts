'use client';

// Single-post data hook — fetches a post and its comments,
// and subscribes to realtime comment inserts on that post.

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Post, Comment } from '@/lib/types';

export function usePost(postId: string, isDemoMode = false) {
  const supabase = createClient();
  const [post,     setPost]     = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isDemoMode) { setLoading(false); return; }
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch(`/api/comments/${postId}`),
      ]);
      if (!postRes.ok)     throw new Error('Post not found');
      if (!commentsRes.ok) throw new Error('Failed to load comments');

      setPost(await postRes.json());
      setComments(await commentsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [postId, isDemoMode]);

  useEffect(() => { load(); }, [load]);

  // Realtime: receive new comments live
  useEffect(() => {
    if (isDemoMode) return;
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (_payload) => {
          const res = await fetch(`/api/comments/${postId}`);
          if (res.ok) setComments(await res.json());
          setPost(p => p ? { ...p, comment_count: p.comment_count + 1 } : p);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, postId, isDemoMode]);

  function addOptimisticComment(comment: Comment) {
    setComments(prev => [...prev, comment]);
    setPost(p => p ? { ...p, comment_count: p.comment_count + 1 } : p);
  }

  return { post, comments, loading, error, reload: load, addOptimisticComment };
}
