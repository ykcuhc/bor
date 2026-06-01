// Extend the central types file with Notification, ImageUpload, and Premium types
import type { MembershipTier } from '@/lib/types';
export type { MembershipTier };

// ── Notifications ─────────────────────────────────────────────
export type NotificationType = 'comment' | 'reaction' | 'new_neighbor' | 'safety_alert' | 'dm' | 'mention';

export interface Notification {
  id:           string;
  recipient_id: string;
  actor_id:     string | null;
  type:         NotificationType;
  post_id:      string | null;
  comment_id:   string | null;
  message:      string;
  read_at:      string | null;
  created_at:   string;
  // Joined relations
  actor?:       { id: string; full_name: string; avatar_url: string | null };
  post?:        { id: string; title: string | null; body: string };
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  comment:      '💬',
  reaction:     '👍',
  new_neighbor: '👋',
  safety_alert: '🚨',
  dm:           '✉️',
  mention:      '@',
};

// ── Image Upload ──────────────────────────────────────────────
export interface UploadedImage {
  url:      string;  // Public URL from Supabase Storage
  path:     string;  // Storage path (for deletion)
  size:     number;  // bytes
  mimeType: string;
}

// ── Premium Membership ────────────────────────────────────────

export interface PricingFeature {
  label:     string;
  free:      boolean | string;
  premium:   boolean | string;
  business:  boolean | string;
}

export const PRICING_FEATURES: PricingFeature[] = [
  { label: 'Neighbourhood feed',       free: true,        premium: true,          business: true },
  { label: 'Post to neighbourhood',    free: true,        premium: true,          business: true },
  { label: 'Post governorate-wide',    free: false,       premium: true,          business: true },
  { label: 'Direct messages',          free: true,        premium: true,          business: true },
  { label: 'Image uploads per post',   free: '1 image',   premium: '10 images',   business: '20 images' },
  { label: 'Profile verification',     free: 'Standard',  premium: 'Priority',    business: 'Priority' },
  { label: 'Profile badge',            free: false,       premium: '⭐ Premium',   business: '👑 Business' },
  { label: 'Business listing',         free: false,       premium: false,         business: true },
  { label: 'Featured listing',         free: false,       premium: false,         business: true },
  { label: 'Analytics dashboard',      free: false,       premium: false,         business: true },
  { label: 'Ad-free experience',       free: false,       premium: true,          business: true },
  { label: 'Early access to features', free: false,       premium: true,          business: true },
];

export const MEMBERSHIP_TIERS = [
  {
    id:          'free' as MembershipTier,
    name:        'Basic',
    price:       0,
    currency:    'KD',
    period:      'forever',
    description: 'Everything you need to connect with your neighbors.',
    color:       'border-gray-200',
    badge:       null,
    cta:         'Current plan',
  },
  {
    id:          'premium' as MembershipTier,
    name:        'Premium',
    price:       2.5,
    currency:    'KD',
    period:      'month',
    description: 'More reach, more features, a better neighborhood experience.',
    color:       'border-brand-400',
    badge:       '⭐',
    cta:         'Upgrade to Premium',
    highlight:   true,
  },
  {
    id:          'business' as MembershipTier,
    name:        'Business',
    price:       5,
    currency:    'KD',
    period:      'month',
    description: 'Grow your local business and reach every neighbor.',
    color:       'border-amber-400',
    badge:       '👑',
    cta:         'Get Business',
  },
];
