'use client';

// useReaction — manages reaction state for a single post.
// Uses optimistic updates: the UI updates instantly, then
// confirms/rolls back based on the server response.

import { useState } from 'react';
import { useFeedStore } from '@/store/feedStore';
import type { ReactionType } from '@/lib/types';

export function useReaction(
  postId:          string,
  initialReaction: ReactionType | null,
  initialCount:    number,
  isDemoMode = false
) {
  const store = useFeedStore();
  const [active, setActive] = useState<ReactionType | null>(initialReaction);
  const [count,  setCount]  = useState(initialCount);

  async function react(reaction: ReactionType) {
    const prev     = active;
    const isToggle = prev === reaction;
    const next     = isToggle ? null : reaction;

    // Optimistic UI
    setActive(next);
    setCount(c => c + (next === null ? -1 : prev === null ? 1 : 0));
    store.applyReaction(postId, next, prev);

    if (isDemoMode) return;

    try {
      const method = next === null ? 'DELETE' : 'POST';
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: next ?? prev }),
      });

      if (!res.ok) throw new Error(await res.text());
    } catch {
      // Roll back on failure
      setActive(prev);
      setCount(c => c - (next === null ? -1 : prev === null ? 1 : 0));
      store.applyReaction(postId, prev, next);
    }
  }

  return { active, count, react };
}
