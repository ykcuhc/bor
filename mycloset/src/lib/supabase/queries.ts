// ─── All Supabase data access functions ───────────────────────────────────────
// Each function takes a client so it works with both browser and server clients.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { Listing, User, Comment, Notification, SearchFilters } from '@/types';

type Client = SupabaseClient<Database>;

// ─── Shape helpers ────────────────────────────────────────────────────────────
// Map snake_case DB rows → camelCase app types

function rowToUser(row: Database['public']['Tables']['users']['Row']): User {
  return {
    id:             row.id,
    username:       row.username,
    email:          row.email,
    displayName:    row.display_name,
    avatar:         row.avatar         ?? '',
    headerImage:    row.header_image   ?? '',
    bio:            row.bio            ?? '',
    location:       row.location       ?? 'Kuwait',
    followersCount: row.followers_count ?? 0,
    followingCount: row.following_count ?? 0,
    listingsCount:  row.listings_count  ?? 0,
    soldCount:      row.sold_count      ?? 0,
    averageRating:  Number(row.average_rating ?? 0),
    totalRatings:   row.total_ratings   ?? 0,
    joinedAt:       row.created_at      ?? new Date().toISOString(),
    isVerified:     row.is_verified     ?? false,
  };
}

function rowToListing(
  row: Database['public']['Tables']['listings']['Row'],
  seller: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'isVerified'>,
  isLiked = false
): Listing {
  return {
    id:            row.id,
    sellerId:      row.seller_id,
    seller,
    title:         row.title,
    description:   row.description   ?? '',
    images:        row.images,
    category:      row.category,
    subCategory:   row.sub_category  ?? '',
    brand:         row.brand         ?? '',
    size:          row.size          ?? '',
    condition:     row.condition,
    color:         row.color         ?? [],
    originalPrice: Number(row.original_price),
    listingPrice:  Number(row.listing_price),
    quantity:      row.quantity      ?? 1,
    tags:          row.tags          ?? [],
    likesCount:    row.likes_count   ?? 0,
    commentsCount: row.comments_count ?? 0,
    sharesCount:   row.shares_count  ?? 0,
    viewsCount:    row.views_count   ?? 0,
    status:        row.status        ?? 'available',
    createdAt:     row.created_at    ?? new Date().toISOString(),
    updatedAt:     row.updated_at    ?? new Date().toISOString(),
    isLikedByCurrentUser: isLiked,
  };
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function fetchListings(
  client: Client,
  filters: SearchFilters,
  currentUserId?: string
): Promise<Listing[]> {
  let query = client
    .from('listings')
    .select(`*, seller:users!listings_seller_id_fkey(id, username, display_name, avatar, is_verified)`)
    .order('created_at', { ascending: false })
    .limit(60);

  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,brand.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
    );
  }
  if (filters.category)    query = query.eq('category', filters.category);
  if (filters.subCategory) query = query.eq('sub_category', filters.subCategory);
  if (filters.brand)       query = query.ilike('brand', filters.brand);
  if (filters.size)        query = query.eq('size', filters.size);
  if (filters.condition)   query = query.eq('condition', filters.condition);
  if (filters.minPrice !== undefined) query = query.gte('listing_price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('listing_price', filters.maxPrice);
  if (filters.status)      query = query.eq('status', filters.status);
  else                     query = query.neq('status', 'reserved');

  switch (filters.sortBy) {
    case 'price_asc':  query = query.order('listing_price', { ascending: true });  break;
    case 'price_desc': query = query.order('listing_price', { ascending: false }); break;
    case 'most_liked': query = query.order('likes_count',   { ascending: false }); break;
    default:           query = query.order('created_at',    { ascending: false }); break;
  }

  const { data, error } = await query;
  if (error) throw error;

  // Fetch which listings the current user has liked (one query, not N)
  let likedSet = new Set<string>();
  if (currentUserId && data?.length) {
    const ids = data.map(r => r.id);
    const { data: liked } = await client
      .from('likes')
      .select('listing_id')
      .eq('user_id', currentUserId)
      .in('listing_id', ids);
    likedSet = new Set(liked?.map(l => l.listing_id) ?? []);
  }

  return (data ?? []).map(row => {
    const s = Array.isArray(row.seller) ? row.seller[0] : row.seller as any;
    const seller = {
      id:          s?.id          ?? row.seller_id,
      username:    s?.username    ?? '',
      displayName: s?.display_name ?? '',
      avatar:      s?.avatar      ?? '',
      isVerified:  s?.is_verified  ?? false,
    };
    return rowToListing(row, seller, likedSet.has(row.id));
  });
}

export async function fetchListingById(
  client: Client,
  id: string,
  currentUserId?: string
): Promise<Listing | null> {
  const { data, error } = await client
    .from('listings')
    .select(`*, seller:users!listings_seller_id_fkey(id, username, display_name, avatar, is_verified)`)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  let isLiked = false;
  if (currentUserId) {
    const { data: like } = await client
      .from('likes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('listing_id', id)
      .maybeSingle();
    isLiked = !!like;
  }

  const s = Array.isArray(data.seller) ? data.seller[0] : data.seller as any;
  const seller = {
    id:          s?.id           ?? data.seller_id,
    username:    s?.username     ?? '',
    displayName: s?.display_name ?? '',
    avatar:      s?.avatar       ?? '',
    isVerified:  s?.is_verified  ?? false,
  };
  return rowToListing(data, seller, isLiked);
}

export async function fetchListingsByUser(
  client: Client,
  userId: string,
  currentUserId?: string
): Promise<Listing[]> {
  const { data: userData } = await client
    .from('users')
    .select('id, username, display_name, avatar, is_verified')
    .eq('id', userId)
    .single();

  const seller = {
    id:          userData?.id           ?? userId,
    username:    userData?.username     ?? '',
    displayName: userData?.display_name ?? '',
    avatar:      userData?.avatar       ?? '',
    isVerified:  userData?.is_verified  ?? false,
  };

  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  let likedSet = new Set<string>();
  if (currentUserId && data?.length) {
    const { data: liked } = await client
      .from('likes')
      .select('listing_id')
      .eq('user_id', currentUserId)
      .in('listing_id', data.map(r => r.id));
    likedSet = new Set(liked?.map(l => l.listing_id) ?? []);
  }

  return (data ?? []).map(row => rowToListing(row, seller, likedSet.has(row.id)));
}

export async function insertListing(
  client: Client,
  payload: Database['public']['Tables']['listings']['Insert']
): Promise<string> {
  const { data, error } = await client
    .from('listings')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function incrementListingViews(client: Client, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (client as any).rpc('increment_views', { listing_id: id });
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export async function likeListing(client: Client, userId: string, listingId: string) {
  await client.from('likes').insert({ user_id: userId, listing_id: listingId }).throwOnError();
}

export async function unlikeListing(client: Client, userId: string, listingId: string) {
  await client.from('likes').delete()
    .eq('user_id', userId).eq('listing_id', listingId).throwOnError();
}

export async function fetchUserLikedIds(client: Client, userId: string): Promise<string[]> {
  const { data } = await client.from('likes').select('listing_id').eq('user_id', userId);
  return data?.map(r => r.listing_id) ?? [];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function fetchUserByUsername(client: Client, username: string): Promise<User | null> {
  const { data } = await client.from('users').select('*').eq('username', username).single();
  return data ? rowToUser(data) : null;
}

export async function fetchUserById(client: Client, id: string): Promise<User | null> {
  const { data } = await client.from('users').select('*').eq('id', id).single();
  return data ? rowToUser(data) : null;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(client: Client, listingId: string): Promise<Comment[]> {
  const { data, error } = await client
    .from('comments')
    .select(`*, author:users!comments_author_id_fkey(id, username, display_name, avatar)`)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(row => {
    const a = Array.isArray(row.author) ? row.author[0] : row.author as any;
    return {
      id:        row.id,
      listingId: row.listing_id,
      authorId:  row.author_id,
      author: {
        id:          a?.id           ?? row.author_id,
        username:    a?.username     ?? '',
        displayName: a?.display_name ?? '',
        avatar:      a?.avatar       ?? '',
      },
      body:      row.body,
      createdAt: row.created_at ?? new Date().toISOString(),
      mentions:  row.mentions   ?? [],
    } satisfies Comment;
  });
}

export async function insertComment(
  client: Client,
  listingId: string,
  authorId: string,
  body: string
): Promise<void> {
  const mentions = (body.match(/@(\w+)/g) ?? []).map(m => m.slice(1));
  await client.from('comments')
    .insert({ listing_id: listingId, author_id: authorId, body, mentions })
    .throwOnError();
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export async function followUser(client: Client, followerId: string, followingId: string) {
  await client.from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .throwOnError();
}

export async function unfollowUser(client: Client, followerId: string, followingId: string) {
  await client.from('follows').delete()
    .eq('follower_id', followerId).eq('following_id', followingId).throwOnError();
}

export async function fetchFollowingIds(client: Client, userId: string): Promise<string[]> {
  const { data } = await client.from('follows').select('following_id').eq('follower_id', userId);
  return data?.map(r => r.following_id) ?? [];
}

// ─── Offers ───────────────────────────────────────────────────────────────────

export async function insertOffer(
  client: Client,
  listingId: string,
  buyerId: string,
  amount: number,
  message?: string
): Promise<void> {
  await client.from('offers')
    .insert({ listing_id: listingId, buyer_id: buyerId, amount, message })
    .throwOnError();
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function fetchNotifications(client: Client, userId: string): Promise<Notification[]> {
  const { data, error } = await client
    .from('notifications')
    .select(`*, actor:users!notifications_actor_id_fkey(id, username, display_name, avatar),
              listing:listings(id, title, images)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map(row => {
    const a = Array.isArray(row.actor)   ? row.actor[0]   : row.actor   as any;
    const l = Array.isArray(row.listing) ? row.listing[0] : row.listing as any;
    return {
      id:        row.id,
      userId:    row.user_id,
      type:      row.type,
      actorId:   row.actor_id,
      actor: {
        id:          a?.id           ?? row.actor_id,
        username:    a?.username     ?? '',
        displayName: a?.display_name ?? '',
        avatar:      a?.avatar       ?? '',
      },
      listingId: row.listing_id ?? undefined,
      listing:   l ? { id: l.id, title: l.title, images: l.images } : undefined,
      read:      row.read ?? false,
      createdAt: row.created_at ?? new Date().toISOString(),
    } satisfies Notification;
  });
}

export async function markNotificationsRead(client: Client, userId: string) {
  await client.from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .throwOnError();
}
