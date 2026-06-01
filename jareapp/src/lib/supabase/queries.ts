// ============================================================
// Centralised Supabase Query Functions (server-side)
//
// All functions accept a Supabase client so they work in both
// Server Components (createClient from server.ts) and
// Route Handlers. They never import 'next/headers' directly —
// that stays in server.ts.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post, Comment, User, Business } from '@/lib/types';

// ── Feed ─────────────────────────────────────────────────────

/**
 * Fetch the neighbourhood feed for a given user.
 *
 * Geographical logic:
 *  - Always include posts from the user's own neighborhood_id.
 *  - Also include posts with geographical_scope='governorate' that
 *    belong to any neighborhood in the same governorate.
 *  - Pinned posts are included regardless of sort.
 *  - Soft-deleted posts (is_removed=true) are excluded.
 */
export async function fetchFeedPosts(
  supabase: SupabaseClient,
  neighborhoodId: string,
  governorateId:  string,
  options: { category?: string; limit?: number; offset?: number } = {}
): Promise<Post[]> {
  const { category, limit = 30, offset = 0 } = options;

  // Get all neighborhood IDs in the same governorate for the wider-scope filter
  const { data: siblingNeighborhoods } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('governorate_id', governorateId);

  const siblingIds = (siblingNeighborhoods ?? []).map((n: { id: string }) => n.id);

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, full_name, username, avatar_url, verification_status, neighborhood_id),
      neighborhood:neighborhoods!posts_neighborhood_id_fkey(id, name_en, name_ar, governorate_id,
        governorate:governorates!neighborhoods_governorate_id_fkey(id, name_en, name_ar, code))
    `)
    .eq('is_removed', false)
    .or(
      // Own neighbourhood OR governorate-wide posts from sibling neighbourhoods
      `neighborhood_id.eq.${neighborhoodId},` +
      `and(geographical_scope.eq.governorate,neighborhood_id.in.(${siblingIds.join(',')}))`
    )
    .order('is_pinned', { ascending: false })   // pinned posts first
    .order('created_at',  { ascending: false }) // then newest
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Feed query failed: ${error.message}`);
  return (data ?? []) as Post[];
}

// ── Single Post + Comments ────────────────────────────────────

export async function fetchPost(
  supabase: SupabaseClient,
  postId: string
): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, full_name, username, avatar_url, verification_status),
      neighborhood:neighborhoods!posts_neighborhood_id_fkey(id, name_en, name_ar,
        governorate:governorates!neighborhoods_governorate_id_fkey(id, name_en, name_ar))
    `)
    .eq('id', postId)
    .eq('is_removed', false)
    .single();

  if (error) return null;
  return data as Post;
}

export async function fetchComments(
  supabase: SupabaseClient,
  postId: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:users!comments_author_id_fkey(id, full_name, username, avatar_url)
    `)
    .eq('post_id', postId)
    .eq('is_removed', false)
    .is('parent_id', null)           // top-level comments only
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Comments query failed: ${error.message}`);
  return (data ?? []) as Comment[];
}

// ── Profile ───────────────────────────────────────────────────

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      neighborhood:neighborhoods!users_neighborhood_id_fkey(id, name_en, name_ar,
        governorate:governorates!neighborhoods_governorate_id_fkey(id, name_en, name_ar, code)),
      governorate:governorates!users_governorate_id_fkey(id, name_en, name_ar, code)
    `)
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as User;
}

export async function fetchUserPosts(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, full_name, username, avatar_url),
      neighborhood:neighborhoods!posts_neighborhood_id_fkey(id, name_en, name_ar)
    `)
    .eq('author_id', userId)
    .eq('is_removed', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`User posts query failed: ${error.message}`);
  return (data ?? []) as Post[];
}

// ── Businesses ────────────────────────────────────────────────

export async function fetchBusinesses(
  supabase: SupabaseClient,
  neighborhoodId: string,
  governorateId:  string,
  options: { category?: string; search?: string; limit?: number } = {}
): Promise<Business[]> {
  const { category, search, limit = 50 } = options;

  // Get sibling neighborhoods in same governorate
  const { data: sibs } = await supabase
    .from('neighborhoods')
    .select('id')
    .eq('governorate_id', governorateId);

  const allIds = [neighborhoodId, ...((sibs ?? []).map((n: { id: string }) => n.id))];

  let query = supabase
    .from('businesses')
    .select('*, neighborhood:neighborhoods!businesses_neighborhood_id_fkey(id, name_en, name_ar)')
    .in('neighborhood_id', allIds)
    .order('is_premium', { ascending: false }) // premium first
    .limit(limit);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Businesses query failed: ${error.message}`);
  return (data ?? []) as Business[];
}

// ── Direct Messages ───────────────────────────────────────────

export async function fetchDMThreads(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  other_user: User;
  last_message: string;
  last_time: string;
  unread_count: number;
}[]> {
  // Get the latest message per conversation partner
  const { data, error } = await supabase.rpc('get_dm_threads', { p_user_id: userId });
  if (error) {
    // Fallback: raw query if RPC not deployed yet
    return [];
  }
  return data ?? [];
}

export async function fetchDMMessages(
  supabase: SupabaseClient,
  userId: string,
  otherUserId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender:users!direct_messages_sender_id_fkey(id, full_name, username, avatar_url),
      recipient:users!direct_messages_recipient_id_fkey(id, full_name, username, avatar_url)
    `)
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`DM query failed: ${error.message}`);
  return data ?? [];
}

// ── Mutations ─────────────────────────────────────────────────

export async function createPost(
  supabase: SupabaseClient,
  payload: {
    author_id:          string;
    neighborhood_id:    string;
    body:               string;
    title?:             string | null;
    category:           string;
    geographical_scope: string;
    image_urls?:        string[] | null;
  }
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select(`
      *,
      author:users!posts_author_id_fkey(id, full_name, username, avatar_url, verification_status),
      neighborhood:neighborhoods!posts_neighborhood_id_fkey(id, name_en, name_ar)
    `)
    .single();

  if (error) throw new Error(`Create post failed: ${error.message}`);
  return data as Post;
}

export async function createComment(
  supabase: SupabaseClient,
  payload: {
    post_id:   string;
    author_id: string;
    body:      string;
    parent_id?: string | null;
  }
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert(payload)
    .select(`
      *,
      author:users!comments_author_id_fkey(id, full_name, username, avatar_url)
    `)
    .single();

  if (error) throw new Error(`Create comment failed: ${error.message}`);
  return data as Comment;
}

export async function upsertReaction(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const { error } = await supabase
    .from('reactions')
    .upsert({ post_id: postId, user_id: userId, reaction }, { onConflict: 'post_id,user_id' });

  if (error) throw new Error(`Reaction upsert failed: ${error.message}`);
}

export async function deleteReaction(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw new Error(`Reaction delete failed: ${error.message}`);
}

export async function getUserReaction(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('reactions')
    .select('reaction')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  return data?.reaction ?? null;
}

export async function sendDM(
  supabase: SupabaseClient,
  senderId: string,
  recipientId: string,
  body: string
) {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body })
    .select()
    .single();

  if (error) throw new Error(`Send DM failed: ${error.message}`);
  return data;
}
