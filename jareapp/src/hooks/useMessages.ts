'use client';

// useMessages — DM thread list and per-conversation messages.
// Subscribes to realtime inserts for instant delivery.

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DMMessage {
  id:           string;
  sender_id:    string;
  recipient_id: string;
  body:         string;
  read_at:      string | null;
  created_at:   string;
  sender?:      { id: string; full_name: string; avatar_url: string | null };
  recipient?:   { id: string; full_name: string; avatar_url: string | null };
}

export function useMessages(
  currentUserId: string,
  otherUserId:   string | null,
  isDemoMode = false
) {
  const supabase   = createClient();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [sending,  setSending]  = useState(false);

  const loadMessages = useCallback(async () => {
    if (!otherUserId || isDemoMode) return;
    const { data } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:users!direct_messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:users!direct_messages_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) setMessages(data as DMMessage[]);

    // Mark received messages as read
    await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', currentUserId)
      .is('read_at', null);
  }, [supabase, currentUserId, otherUserId, isDemoMode]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription — receive new DMs instantly
  useEffect(() => {
    if (!otherUserId || isDemoMode) return;

    const channel = supabase
      .channel(`dm:${[currentUserId, otherUserId].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'direct_messages',
          // Only fire for this conversation
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as DMMessage;
          if (msg.sender_id === otherUserId) {
            setMessages(prev => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, currentUserId, otherUserId, isDemoMode]);

  async function send(body: string): Promise<boolean> {
    if (!otherUserId || !body.trim()) return false;
    setSending(true);

    // Optimistic insert
    const optimistic: DMMessage = {
      id:           `temp-${Date.now()}`,
      sender_id:    currentUserId,
      recipient_id: otherUserId,
      body:         body.trim(),
      read_at:      null,
      created_at:   new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    if (isDemoMode) { setSending(false); return true; }

    try {
      const res = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ recipient_id: otherUserId, body }),
      });

      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        return false;
      }

      const saved: DMMessage = await res.json();
      // Replace optimistic with real row (gets the server-generated ID)
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
      return true;
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      return false;
    } finally {
      setSending(false);
    }
  }

  return { messages, sending, send };
}
