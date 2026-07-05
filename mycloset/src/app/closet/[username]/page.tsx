'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, MapPin, Star, Grid3x3, Archive, Heart,
  Settings, MessageCircle, Share2, Flag, Edit3,
  Users, Package, TrendingUp, Clock, Award,
  Activity, ChevronRight, Copy, Check, Loader2, AlertCircle,
  ShieldCheck, UserCheck, Building2, Mail as MailIcon,
  Phone as PhoneIcon, BarChart3, Eye, ChevronDown,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { User, Listing } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileTab = 'active' | 'sold' | 'favorites';
type ReviewSort = 'newest' | 'highest' | 'lowest';

interface Achievement {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// ─── Achievement system (derived from user stats) ─────────────────────────────

function computeAchievements(user: User): Achievement[] {
  const all: Achievement[] = [
    { id: 'verified',      label: 'Verified Account', icon: '✅', description: 'Identity verified by Miova' },
    { id: 'first_sale',    label: 'First Sale',        icon: '🎉', description: 'Made their first successful sale' },
    { id: 'ten_sales',     label: '10 Sales',          icon: '📦', description: 'Completed 10 successful sales' },
    { id: 'top_seller',    label: 'Top Seller',        icon: '⭐', description: '50+ successful sales on Miova' },
    { id: 'hundred_sales', label: '100 Sales',         icon: '💯', description: '100+ successful sales — legendary!' },
    { id: 'trusted',       label: 'Trusted Seller',    icon: '🛡️', description: 'Maintains a 4.5+ star average rating' },
    { id: 'fast',          label: 'Fast Responder',    icon: '⚡', description: 'Consistently replies within 1 hour' },
    { id: 'listing_pro',   label: 'Listing Pro',       icon: '📸', description: 'Created 25+ high-quality listings' },
    { id: 'five_star',     label: '5-Star Seller',     icon: '🌟', description: 'Perfect 5.0 rating across all reviews' },
    { id: 'veteran',       label: 'Veteran Member',    icon: '🏅', description: 'Active Miova member for over one year' },
  ];

  const earned: Achievement[] = [];
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  if (user.isVerified)                                                earned.push(all[0]);
  if (user.soldCount >= 1)                                            earned.push(all[1]);
  if (user.soldCount >= 10)                                           earned.push(all[2]);
  if (user.soldCount >= 50)                                           earned.push(all[3]);
  if (user.soldCount >= 100)                                          earned.push(all[4]);
  if (user.averageRating >= 4.5 && user.totalRatings >= 5)           earned.push(all[5]);
  if (user.soldCount >= 5)                                            earned.push(all[6]);
  if (user.listingsCount >= 25)                                       earned.push(all[7]);
  if (user.averageRating >= 4.9 && user.totalRatings >= 3)           earned.push(all[8]);
  if (Date.now() - new Date(user.joinedAt).getTime() > yearMs)       earned.push(all[9]);

  return earned;
}

// ─── Stars display ────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating.toFixed(1)} out of 5`} role="img">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn(cls, n <= rounded ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600')} aria-hidden />
      ))}
    </div>
  );
}

// ─── Achievement badge with tooltip ──────────────────────────────────────────

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [tip, setTip] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <button
        type="button"
        onClick={() => setTip(t => !t)}
        aria-label={`${achievement.label}: ${achievement.description}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
      >
        <span className="text-base leading-none" aria-hidden>{achievement.icon}</span>
        {achievement.label}
      </button>
      {tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-48 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-lg pointer-events-none">
          {achievement.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────

function ShareModal({ username, displayName, onClose }: { username: string; displayName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/closet/${username}` : `https://miova.moe-akbar95.workers.dev/closet/${username}`;

  async function copy() {
    try { await navigator.clipboard.writeText(url); } catch { /* fallback silent */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shares = [
    { label: 'WhatsApp', emoji: '📱', href: `https://wa.me/?text=${encodeURIComponent(`Check out ${displayName}'s closet on Miova!\n${url}`)}` },
    { label: 'X',        emoji: '🐦', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${displayName}'s closet on Miova!`)}&url=${encodeURIComponent(url)}` },
    { label: 'Facebook', emoji: '📘', href: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Share profile">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Share Profile</h3>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {shares.map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{s.label}</span>
            </a>
          ))}
        </div>
        <div className="flex gap-2">
          <input readOnly value={url} aria-label="Profile URL"
            className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 truncate focus:outline-none" />
          <button onClick={copy} aria-label={copied ? 'Copied!' : 'Copy link'}
            className={cn('px-4 py-2.5 rounded-xl transition-colors', copied ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-brand-600 text-white hover:bg-brand-700')}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Report modal ─────────────────────────────────────────────────────────────

function ReportModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [reason,    setReason]    = useState('');
  const [details,   setDetails]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const REASONS = [
    'Selling counterfeit items',
    'Scam or fraud',
    'Harassment or abusive behavior',
    'Inappropriate or offensive content',
    'Fake identity or impersonation',
    'Other',
  ];

  async function submit() {
    if (!reason) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Report user">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Report submitted</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Our trust & safety team will review this within 24 hours.</p>
            <button onClick={onClose} className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors">Done</button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Report @{username}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the reason that best describes the issue.</p>
            <fieldset className="space-y-1 mb-4">
              <legend className="sr-only">Report reason</legend>
              {REASONS.map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-brand-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                </label>
              ))}
            </fieldset>
            {reason && (
              <textarea value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Additional details (optional)" rows={3}
                className="w-full px-3 py-2.5 mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:text-white" />
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={!reason || loading}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Reviews section ──────────────────────────────────────────────────────────
// Reviews are not yet in the DB schema. Shows rating summary + empty / placeholder state.

function ReviewsSection({ user }: { user: User }) {
  const [sort, setSort] = useState<ReviewSort>('newest');

  const hasRatings = user.totalRatings > 0;

  return (
    <section aria-labelledby="reviews-heading" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 flex-wrap">
        <h2 id="reviews-heading" className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          Reviews & Ratings
          {hasRatings && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({user.totalRatings})
            </span>
          )}
        </h2>
        {hasRatings && (
          <select value={sort} onChange={e => setSort(e.target.value as ReviewSort)}
            aria-label="Sort reviews"
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        )}
      </div>

      <div className="p-5">
        {!hasRatings ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">No reviews yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Reviews from buyers will appear here after completed purchases.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Rating summary */}
            <div className="flex flex-col items-center justify-center sm:w-32 shrink-0">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white leading-none">
                {user.averageRating.toFixed(1)}
              </span>
              <Stars rating={user.averageRating} size="md" />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                {user.totalRatings} review{user.totalRatings !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(n => {
                // approximate distribution from average
                const avg = user.averageRating;
                const weight = Math.max(0, 1 - Math.abs(n - avg) * 0.4);
                const pct = Math.round((weight / ([5, 4, 3, 2, 1].reduce((s, x) => s + Math.max(0, 1 - Math.abs(x - avg) * 0.4), 0))) * 100);
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-4 text-right">{n}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" aria-hidden />
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-7 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Activity section ─────────────────────────────────────────────────────────

function ActivitySection({ listings }: { listings: Listing[] }) {
  const recent = [...listings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="activity-heading" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 id="activity-heading" className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-500" />
          Recent Activity
        </h2>
      </div>
      <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {recent.map(listing => (
          <li key={listing.id}>
            <Link href={`/listings/${listing.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
              <img src={listing.images[0]} alt={listing.title}
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700" loading="lazy" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {listing.status === 'sold' ? '📦 Sold' : '🛍️ Listed'} {listing.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatRelativeTime(listing.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 shrink-0">
                <Eye className="w-3.5 h-3.5" />
                {listing.viewsCount}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyState({ tab, isOwn }: { tab: ProfileTab; isOwn: boolean }) {
  const STATES: Record<ProfileTab, { emoji: string; title: string; sub: string; cta?: { label: string; href: string } }> = {
    active:    {
      emoji: '🧺',
      title: 'No active listings',
      sub:   isOwn ? 'Start selling by listing your first item.' : 'This seller has no active listings right now.',
      cta:   isOwn ? { label: 'List an Item', href: '/sell' } : undefined,
    },
    sold:      { emoji: '📦', title: 'No sold items yet',  sub: 'Completed sales will appear here.' },
    favorites: { emoji: '❤️', title: 'No favorites yet',   sub: 'Items you like will appear here.' },
  };

  const s = STATES[tab];
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center" role="status">
      <div className="text-5xl mb-4" aria-hidden>{s.emoji}</div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">{s.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{s.sub}</p>
      {s.cta && (
        <Link href={s.cta.href}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors">
          {s.cta.label}
        </Link>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="h-48 md:h-56 bg-gray-200 dark:bg-gray-700" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 -mt-14 pb-12">
          <aside>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 mb-4">
              <div className="flex gap-3 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 pt-2 space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
              </div>
              <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl mb-2" />
              <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </aside>
          <main className="mt-4 md:mt-16 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex gap-1 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                ))}
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClosetPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const {
    currentUser, isAuthenticated,
    followUser, unfollowUser, isFollowing,
    showToast, listings: storeListings,
  } = useStore();

  const [profileUser,  setProfileUser]  = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState<'not_found' | 'error' | null>(null);

  const [tab,         setTab]         = useState<ProfileTab>('active');
  const [showShare,   setShowShare]   = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const isOwnProfile   = currentUser?.username === username;
  const isFollowingUser = isFollowing(profileUser?.id ?? '');

  // ── Data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(null);
      const supabase = getSupabaseClient();

      try {
        const user = await db.fetchUserByUsername(supabase, username);
        if (cancelled) return;

        if (!user) {
          if (currentUser?.username === username) {
            setProfileUser(currentUser);
            const ls = await db.fetchListingsByUser(supabase, currentUser.id, currentUser.id);
            if (!cancelled) { setUserListings(ls); setLoading(false); }
          } else {
            setFetchError('not_found');
            setLoading(false);
          }
          return;
        }

        setProfileUser(user);
        const ls = await db.fetchListingsByUser(supabase, user.id, currentUser?.id);
        if (!cancelled) { setUserListings(ls); setLoading(false); }
      } catch {
        if (!cancelled) { setFetchError('error'); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived data ────────────────────────────────────────────────────────────

  const activeListings    = userListings.filter(l => l.status === 'available');
  const soldListings      = userListings.filter(l => l.status === 'sold');
  const favoriteListings  = isOwnProfile
    ? storeListings.filter(l => currentUser?.likedListings.includes(l.id))
    : [];

  const tabListings = tab === 'active' ? activeListings : tab === 'sold' ? soldListings : favoriteListings;
  const achievements = profileUser ? computeAchievements(profileUser) : [];

  const tabs: { id: ProfileTab; label: string; count: number; ownerOnly?: boolean; icon: React.ReactNode }[] = [
    { id: 'active',    label: 'Active',    count: activeListings.length,   icon: <Grid3x3 className="w-3.5 h-3.5" /> },
    { id: 'sold',      label: 'Sold',      count: soldListings.length,     icon: <Archive className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: 'Favorites', count: favoriteListings.length, icon: <Heart className="w-3.5 h-3.5" />, ownerOnly: true },
  ];
  const visibleTabs = tabs.filter(t => !t.ownerOnly || isOwnProfile);

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) return <ProfileSkeleton />;

  if (fetchError === 'not_found') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">👀</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">This user doesn&apos;t exist on Miova.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-full hover:bg-brand-700 transition-colors">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  if (fetchError === 'error') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-gray-500 dark:text-gray-400">Could not load this profile. Please try again.</p>
      </div>
    );
  }

  if (!profileUser) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const memberSince = new Date(profileUser.joinedAt).toLocaleDateString('en-KW', { month: 'long', year: 'numeric' });
  const bioText     = profileUser.bio ?? '';
  const bioTrunc    = bioText.length > 160 && !bioExpanded ? bioText.slice(0, 160) + '…' : bioText;
  const isBioLong   = bioText.length > 160;

  function handleFollow() {
    if (!isAuthenticated) { showToast('Sign in to follow sellers', 'info'); return; }
    if (isFollowingUser) unfollowUser(profileUser!.id);
    else followUser(profileUser!.id);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ══ Banner ══════════════════════════════════════════════════════════ */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900">
        {profileUser.headerImage && (
          <img src={profileUser.headerImage} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" aria-hidden />
        {isOwnProfile && (
          <Link href="/settings"
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-semibold rounded-full hover:bg-black/50 transition-colors">
            <Edit3 className="w-3.5 h-3.5" aria-hidden /> Edit profile
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 -mt-14 pb-16">

          {/* ══ SIDEBAR ═══════════════════════════════════════════════════════ */}
          <aside className="md:sticky md:top-24 md:self-start space-y-3">

            {/* ── Identity card ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">

              {/* Avatar row */}
              <div className="flex items-end gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  {profileUser.avatar ? (
                    <img src={profileUser.avatar} alt={`${profileUser.displayName}'s avatar`}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-md" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-md" aria-label={profileUser.displayName}>
                      <span className="text-4xl font-black text-white select-none">
                        {profileUser.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {profileUser.isVerified && (
                    <div className="absolute -bottom-1.5 -right-1.5 bg-brand-600 rounded-full p-0.5 ring-2 ring-white dark:ring-gray-800" aria-label="Verified account">
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
                    {profileUser.displayName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{profileUser.username}</p>
                </div>
              </div>

              {/* Inline badges */}
              {(profileUser.isVerified || profileUser.soldCount >= 50 || (profileUser.averageRating >= 4.5 && profileUser.totalRatings >= 5)) && (
                <div className="flex flex-wrap gap-1.5 mb-4" role="list" aria-label="Seller badges">
                  {profileUser.isVerified && (
                    <span role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold rounded-full">
                      <BadgeCheck className="w-3 h-3" aria-hidden /> Verified
                    </span>
                  )}
                  {profileUser.soldCount >= 50 && (
                    <span role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full">
                      <span aria-hidden>⭐</span> Top Seller
                    </span>
                  )}
                  {profileUser.averageRating >= 4.5 && profileUser.totalRatings >= 5 && (
                    <span role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      <span aria-hidden>🛡️</span> Trusted
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {bioText ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                    {bioTrunc}
                  </p>
                  {isBioLong && (
                    <button onClick={() => setBioExpanded(e => !e)}
                      className="mt-1 text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                      {bioExpanded ? 'Show less' : 'Show more'}
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', bioExpanded && 'rotate-180')} />
                    </button>
                  )}
                </div>
              ) : isOwnProfile ? (
                <Link href="/settings"
                  className="block text-sm text-gray-400 dark:text-gray-500 italic mb-4 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Add a bio to tell buyers about you →
                </Link>
              ) : null}

              {/* Meta */}
              <dl className="space-y-1.5 text-sm">
                {profileUser.location && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    <dd>{profileUser.location}</dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  <dd>Member since {memberSince}</dd>
                </div>
                {profileUser.totalRatings > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Stars rating={profileUser.averageRating} />
                    <dd className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {profileUser.averageRating.toFixed(1)}
                      <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">({profileUser.totalRatings})</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 gap-3" role="region" aria-label="Seller statistics">
              {[
                { label: 'Active',    value: activeListings.length,        icon: Package,     color: 'text-brand-500' },
                { label: 'Sold',      value: profileUser.soldCount,         icon: TrendingUp,  color: 'text-green-500' },
                { label: 'Reviews',   value: profileUser.totalRatings,      icon: Star,        color: 'text-yellow-500' },
                { label: 'Followers', value: profileUser.followersCount,    icon: Users,       color: 'text-purple-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                  <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} aria-hidden />
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {value.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <>
                  <Link href="/settings"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    <Edit3 className="w-4 h-4" aria-hidden /> Edit Profile
                  </Link>
                  <Link href="/sell"
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Package className="w-4 h-4" aria-hidden /> New Listing
                  </Link>
                  <button onClick={() => setShowShare(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Share2 className="w-4 h-4" aria-hidden /> Share Profile
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleFollow}
                    aria-pressed={isFollowingUser}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      isFollowingUser
                        ? 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    )}>
                    {isFollowingUser ? 'Following' : 'Follow Seller'}
                  </button>
                  <button onClick={() => showToast('Messaging coming soon!', 'info')}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <MessageCircle className="w-4 h-4" aria-hidden /> Message
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => setShowShare(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm">
                      <Share2 className="w-3.5 h-3.5" aria-hidden /> Share
                    </button>
                    <button onClick={() => setShowReport(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm">
                      <Flag className="w-3.5 h-3.5" aria-hidden /> Report
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Trust & Verification ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-500" aria-hidden /> Trust & Verification
              </h2>
              <ul className="space-y-3" aria-label="Verification badges">
                {/* Email — all registered accounts are email-verified */}
                <li className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
                    <MailIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email Verified</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Confirmed email address</p>
                  </div>
                  <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden />
                </li>

                {profileUser.isVerified && (
                  <>
                    <li className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Identity Verified</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Government ID confirmed</p>
                      </div>
                      <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden />
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
                        <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Official Store</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Verified business account</p>
                      </div>
                      <Check className="w-4 h-4 text-green-500 shrink-0" aria-hidden />
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* ── Seller stats (desktop) ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-500" aria-hidden /> Seller Stats
              </h2>
              <dl className="space-y-2.5">
                {[
                  { label: 'Total Listings',   value: profileUser.listingsCount },
                  { label: 'Active Listings',  value: activeListings.length },
                  { label: 'Items Sold',        value: profileUser.soldCount },
                  { label: 'Member Since',      value: memberSince },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                    <dd className="text-xs font-semibold text-gray-700 dark:text-gray-300">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Achievements (desktop) ── */}
            {achievements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" aria-hidden /> Achievements
                </h2>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Earned achievements">
                  {achievements.map(a => (
                    <div key={a.id} role="listitem">
                      <AchievementBadge achievement={a} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Owner quick links (desktop) ── */}
            {isOwnProfile && (
              <nav aria-label="Profile management" className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hidden md:block">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Manage</h2>
                <ul className="space-y-0.5">
                  {[
                    { label: 'Account Settings',  href: '/settings',      icon: Settings },
                    { label: 'My Listings',        href: '/sell',          icon: Package },
                    { label: 'Orders',             href: '/orders',        icon: Archive },
                    { label: 'Notifications',      href: '/notifications', icon: Activity },
                    { label: 'Likes',              href: '/likes',         icon: Heart },
                  ].map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <Link href={href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Icon className="w-4 h-4" aria-hidden />
                        <span>{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>

          {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
          <main className="mt-4 md:mt-16 space-y-4" id="main-content">

            {/* ── Listings section ── */}
            <section aria-labelledby="listings-heading" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

              {/* Tab bar */}
              <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto" style={{ scrollbarWidth: 'none' }} role="tablist" aria-label="Listing categories">
                {visibleTabs.map(({ id, label, count, icon }) => (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    role="tab"
                    aria-selected={tab === id}
                    aria-controls={`panel-${id}`}
                    onClick={() => setTab(id)}
                    className={cn(
                      'flex items-center gap-1.5 px-5 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0',
                      tab === id
                        ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    )}
                  >
                    <span aria-hidden>{icon}</span>
                    <span id="listings-heading">{label}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      tab === id
                        ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                        : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400'
                    )} aria-label={`${count} items`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div
                id={`panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                className="p-4 sm:p-5"
              >
                {tabListings.length === 0 ? (
                  <EmptyState tab={tab} isOwn={isOwnProfile} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {tabListings.map(listing => (
                      <ProductCard key={listing.id} listing={listing} showSoldBadge={tab === 'sold'} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ── Reviews ── */}
            <ReviewsSection user={profileUser} />

            {/* ── Achievements (mobile only) ── */}
            {achievements.length > 0 && (
              <section aria-labelledby="achievements-mobile" className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 md:hidden">
                <h2 id="achievements-mobile" className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" aria-hidden /> Achievements
                </h2>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Earned achievements">
                  {achievements.map(a => (
                    <div key={a.id} role="listitem">
                      <AchievementBadge achievement={a} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Activity ── */}
            <ActivitySection listings={userListings} />

            {/* ── Owner mobile quick links ── */}
            {isOwnProfile && (
              <nav aria-label="Profile management" className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 md:hidden">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Manage</h2>
                <ul className="space-y-0.5">
                  {[
                    { label: 'Account Settings', href: '/settings',      icon: Settings },
                    { label: 'My Listings',       href: '/sell',          icon: Package },
                    { label: 'Orders',            href: '/orders',        icon: Archive },
                    { label: 'Notifications',     href: '/notifications', icon: Activity },
                    { label: 'Likes',             href: '/likes',         icon: Heart },
                  ].map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <Link href={href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Icon className="w-4 h-4" aria-hidden />
                        <span>{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </main>
        </div>
      </div>

      {/* ── Modals ── */}
      {showShare  && <ShareModal  username={profileUser.username} displayName={profileUser.displayName} onClose={() => setShowShare(false)}  />}
      {showReport && <ReportModal username={profileUser.username}                                        onClose={() => setShowReport(false)} />}
    </div>
  );
}
