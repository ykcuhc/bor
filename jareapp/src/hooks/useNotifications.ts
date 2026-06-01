'use client';

// ============================================================
// useNotifications — Realtime notification bell
//
// On mount: fetch the 20 most recent notifications via the API.
// Subscribe: Supabase Realtime fires on INSERT into notifications
//   filtered to the current user's recipient_id — the bell
//   counter increments instantly without any polling.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  markRead:      (id: string)  => Promise<void>;
  markAllRead:   ()            => Promise<void>;
}

export function useNotifications(
  userId:     string,
  isDemoMode: boolean = false
): UseNotificationsReturn {
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const load = useCallback(async () => {
    if (isDemoMode) {
      // Provide a handful of realistic demo notifications
      setNotifications(DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => { load(); }, [load]);

  // Realtime: receive new notifications instantly
  useEffect(() => {
    if (isDemoMode || !userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, isDemoMode]);

  async function markRead(id: string) {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    if (!isDemoMode) {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      if (!res.ok) {
        // Roll back if the server rejected the update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: null } : n));
      }
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
    if (!isDemoMode) {
      await fetch('/api/notifications', { method: 'PATCH' });
    }
  }

  return { notifications, unreadCount, loading, markRead, markAllRead };
}

// ── Demo data ─────────────────────────────────────────────────
import type { NotificationType } from '@/lib/types/notifications';

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', recipient_id: 'user-1', actor_id: 'user-2', type: 'comment' as NotificationType,
    post_id: 'post-1', comment_id: 'comment-1',
    message: 'Fatima Al-Sabah commented on your post',
    read_at: null,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    actor: { id: 'user-2', full_name: 'Fatima Al-Sabah', avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima' },
  },
  {
    id: 'n2', recipient_id: 'user-1', actor_id: 'user-3', type: 'reaction' as NotificationType,
    post_id: 'post-2', comment_id: null,
    message: 'Mohammed Al-Kandari reacted to your post',
    read_at: null,
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    actor: { id: 'user-3', full_name: 'Mohammed Al-Kandari', avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mohammed' },
  },
  {
    id: 'n3', recipient_id: 'user-1', actor_id: null, type: 'safety_alert' as NotificationType,
    post_id: 'post-1', comment_id: null,
    message: '🚨 Safety alert in Salmiya',
    read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n4', recipient_id: 'user-1', actor_id: 'user-4', type: 'new_neighbor' as NotificationType,
    post_id: null, comment_id: null,
    message: 'Nour Al-Atiqi joined your neighborhood',
    read_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actor: { id: 'user-4', full_name: 'Nour Al-Atiqi', avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nour' },
  },
];
