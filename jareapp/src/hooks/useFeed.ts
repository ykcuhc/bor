'use client';

// ============================================================
// useFeed — Live neighbourhood feed with Supabase Realtime
//
// This hook does three things:
//  1. Initial load: fetches posts from the API route (which uses
//     the server-side Supabase client with full RLS enforcement).
//  2. Pagination: exposes a `loadMore` function for infinite scroll.
//  3. Realtime: subscribes to Supabase Realtime on the posts
//     table filtered to the current user's neighborhood_id.
//     New posts from neighbours appear instantly without a refresh.
// ============================================================

import { useEffect, useCallback, useRef } from 'react';
import { createClient }  from '@/lib/supabase/client';
import { useFeedStore }  from '@/store/feedStore';
import type { Post }     from '@/lib/types';

const PAGE_SIZE = 20;

interface UseFeedOptions {
  neighborhoodId: string;
  governorateId:  string;
  category?:      string;
  isDemoMode?:    boolean;
}

export function useFeed({ neighborhoodId, governorateId, category, isDemoMode }: UseFeedOptions) {
  const supabase = createClient();
  const store    = useFeedStore();
  // Track current page offset for pagination
  const offsetRef = useRef(0);

  const loadPosts = useCallback(async (reset = false) => {
    if (isDemoMode) return; // Demo mode uses store pre-populated with dummy data

    store.setLoading(true);
    const offset = reset ? 0 : offsetRef.current;

    try {
      const params = new URLSearchParams({
        neighborhoodId,
        governorateId,
        limit:  String(PAGE_SIZE),
        offset: String(offset),
        ...(category && category !== 'all' ? { category } : {}),
      });

      const res  = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Post[] = await res.json();

      if (reset) {
        store.setPosts(data);
        offsetRef.current = data.length;
      } else {
        store.appendPosts(data);
        offsetRef.current += data.length;
      }

      store.setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to load feed');
    }
  }, [neighborhoodId, governorateId, category, isDemoMode, store]);

  // Initial load + reload when category changes
  useEffect(() => {
    loadPosts(true);
  }, [loadPosts]);

  // Supabase Realtime subscription — filtered to this neighborhood
  useEffect(() => {
    if (isDemoMode || !neighborhoodId) return;

    const channel = supabase
      .channel(`feed:${neighborhoodId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'posts',
          // Only receive posts for this neighborhood so we don't broadcast
          // every post on the platform to every user.
          filter: `neighborhood_id=eq.${neighborhoodId}`,
        },
        async (payload) => {
          // Fetch the full post with author+neighborhood joins
          const res  = await fetch(`/api/posts/${payload.new.id}`);
          if (!res.ok) return;
          const post: Post = await res.json();
          store.insertRealtimePost(post);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, neighborhoodId, isDemoMode, store]);

  return {
    posts:    store.posts,
    loading:  store.loading,
    error:    store.error,
    hasMore:  store.hasMore,
    loadMore: () => loadPosts(false),
    reload:   () => loadPosts(true),
  };
}
