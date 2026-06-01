// ============================================================
// Zustand Feed Store
//
// Manages the client-side post list with optimistic mutations.
// Why Zustand here vs React state?
//  - Optimistic updates need to be applied instantly, then
//    confirmed or rolled back when the server responds.
//  - Multiple components (CreatePostForm, FeedPostCard,
//    ReactionButton) all mutate the same list — lifting state
//    to a parent would make the Home page component too large.
// ============================================================

import { create } from 'zustand';
import type { Post, ReactionType } from '@/lib/types';

interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  // Actions
  setPosts:        (posts: Post[])             => void;
  appendPosts:     (posts: Post[])             => void;
  prependPost:     (post: Post)                => void;
  removePost:      (postId: string)            => void;
  setLoading:      (loading: boolean)          => void;
  setError:        (error: string | null)      => void;
  setHasMore:      (hasMore: boolean)          => void;
  // Optimistic reaction update
  applyReaction:   (postId: string, reaction: ReactionType | null, prevReaction: ReactionType | null) => void;
  // Realtime: insert a post received via Supabase Realtime
  insertRealtimePost: (post: Post) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts:   [],
  loading: true,
  error:   null,
  hasMore: true,

  setPosts:    (posts)    => set({ posts, loading: false, error: null }),
  appendPosts: (posts)    => set(s => ({ posts: [...s.posts, ...posts], loading: false })),
  prependPost: (post)     => set(s => ({ posts: [post, ...s.posts] })),
  removePost:  (postId)   => set(s => ({ posts: s.posts.filter(p => p.id !== postId) })),
  setLoading:  (loading)  => set({ loading }),
  setError:    (error)    => set({ error, loading: false }),
  setHasMore:  (hasMore)  => set({ hasMore }),

  applyReaction: (postId, reaction, prevReaction) =>
    set(s => ({
      posts: s.posts.map(p => {
        if (p.id !== postId) return p;
        // Calculate counter delta:
        //  null → reaction = +1 (new reaction)
        //  reaction → null = -1 (remove reaction)
        //  reaction → different reaction = 0 (swap, count stays same)
        const delta = reaction === null ? -1 : prevReaction === null ? 1 : 0;
        return {
          ...p,
          user_reaction:  reaction,
          reaction_count: Math.max(0, p.reaction_count + delta),
        };
      }),
    })),

  insertRealtimePost: (post) =>
    set(s => {
      // Avoid duplicates if our own optimistic insert is already there
      if (s.posts.some(p => p.id === post.id)) return s;
      return { posts: [post, ...s.posts] };
    }),
}));
