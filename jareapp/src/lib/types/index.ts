// ============================================================
// JareApp — Core TypeScript Types
// These mirror the Supabase database schema exactly so that
// query results are fully typed throughout the app.
// ============================================================

export type VerificationStatus = 'unverified' | 'pending' | 'verified';
export type PostCategory = 'general' | 'safety' | 'recommendation' | 'classifieds' | 'lost_found' | 'events' | 'question';
export type GeographicalScope = 'neighborhood' | 'governorate';
export type ReactionType = 'like' | 'helpful' | 'thank' | 'agree' | 'sad';
export type MembershipTier = 'free' | 'premium' | 'business';

// ── Governorate ──────────────────────────────────────────────
export interface Governorate {
  id: string;
  name_en: string;
  name_ar: string;
  code: string;
  created_at: string;
}

// ── Neighborhood ─────────────────────────────────────────────
export interface Neighborhood {
  id: string;
  governorate_id: string;
  name_en: string;
  name_ar: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  // Joined relation (not in DB column, added by query)
  governorate?: Governorate;
}

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  neighborhood_id: string | null;
  governorate_id: string | null;
  verification_status: VerificationStatus;
  is_premium: boolean;
  membership_tier?: MembershipTier;
  phone: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  neighborhood?: Neighborhood;
  governorate?: Governorate;
}

// ── Post ─────────────────────────────────────────────────────
export interface Post {
  id: string;
  author_id: string;
  neighborhood_id: string;
  title: string | null;
  body: string;
  image_urls: string[] | null;
  category: PostCategory;
  geographical_scope: GeographicalScope;
  is_pinned: boolean;
  is_removed: boolean;
  comment_count: number;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  // Joined relations (populated by queries)
  author?: User;
  neighborhood?: Neighborhood;
  user_reaction?: ReactionType | null; // Current user's reaction, if any
}

// ── Comment ──────────────────────────────────────────────────
export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  author?: User;
  replies?: Comment[];
}

// ── Reaction ─────────────────────────────────────────────────
export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

// ── Direct Message ───────────────────────────────────────────
export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: User;
  recipient?: User;
}

// ── Business ─────────────────────────────────────────────────
export interface Business {
  id: string;
  owner_id: string | null;
  neighborhood_id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  image_urls: string[] | null;
  is_premium: boolean;
  is_verified: boolean;
  rating_sum: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  neighborhood?: Neighborhood;
}

// ── UI helpers ───────────────────────────────────────────────

// Category display metadata used in the UI
export const POST_CATEGORY_META: Record<PostCategory, { label: string; color: string; icon: string }> = {
  general:        { label: 'General',        color: 'bg-gray-100 text-gray-700',    icon: '💬' },
  safety:         { label: 'Safety',         color: 'bg-red-100 text-red-700',      icon: '🚨' },
  recommendation: { label: 'Recommendation', color: 'bg-blue-100 text-blue-700',    icon: '👍' },
  classifieds:    { label: 'Classifieds',    color: 'bg-amber-100 text-amber-700',  icon: '🏷️' },
  lost_found:     { label: 'Lost & Found',   color: 'bg-purple-100 text-purple-700',icon: '🔍' },
  events:         { label: 'Events',         color: 'bg-green-100 text-green-700',  icon: '📅' },
  question:       { label: 'Question',       color: 'bg-teal-100 text-teal-700',    icon: '❓' },
};

// Reaction display metadata
export const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  like:    { emoji: '👍', label: 'Like' },
  helpful: { emoji: '🙌', label: 'Helpful' },
  thank:   { emoji: '🙏', label: 'Thank' },
  agree:   { emoji: '✅', label: 'Agree' },
  sad:     { emoji: '😢', label: 'Sad' },
};
