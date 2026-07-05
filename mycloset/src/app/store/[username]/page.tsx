'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, MapPin, Calendar, Star, Share2, Flag, MessageSquare,
  Settings, Package, BarChart3, Tag, ChevronRight, ChevronDown,
  Filter, X, ShoppingBag, Users, Clock, Shield, CheckCircle2,
  Award, Zap, TrendingUp, AlertCircle, Copy, Check, Building2,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';
import { cn, formatKWD, formatRelativeTime, getDiscountPercent } from '@/lib/utils';
import type { User, Listing } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

type StoreTab = 'all' | 'new' | 'bestsellers' | 'sale' | 'outofstock';
type StoreSort = 'newest' | 'popular' | 'price_asc' | 'price_desc';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const NEW_ARRIVALS_DAYS = 30;

const STORE_POLICIES = {
  shipping: 'Orders are typically processed and shipped within 1–3 business days. Shipping rates are calculated at checkout based on your location. We ship across Kuwait with same-day delivery available in select areas.',
  returns:  'We accept returns within 7 days of delivery for items not as described. Items must be returned in their original condition. Contact us via message to initiate a return.',
  warranty: 'Electronics and branded items include manufacturer warranty where applicable. Please check individual product listings for full warranty details.',
  contact:  'We typically respond to messages within 2 hours during business hours (9 am – 9 pm). Reach us directly through the Miova messaging platform.',
} as const;

type PolicyKey = keyof typeof STORE_POLICIES;

const REPORT_REASONS = [
  'Counterfeit / fake items',
  'Misleading product listings',
  'Spam or scam activity',
  'Inappropriate content',
  'Harassment',
  'Other',
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function storeAge(iso: string): string {
  const ms    = Date.now() - new Date(iso).getTime();
  const years = Math.floor(ms / (365.25 * 86_400_000));
  const months= Math.floor(ms / (30.44  * 86_400_000));
  if (years  >= 1) return `${years} yr${years  > 1 ? 's' : ''}`;
  if (months >= 1) return `${months} mo`;
  return 'New';
}

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KW', { year: 'numeric', month: 'long' });
}

function responseRate(rating: number): string {
  if (rating >= 4.8) return '99%';
  if (rating >= 4.5) return '96%';
  if (rating >= 4.0) return '90%';
  return '82%';
}

function avgResponseTime(sold: number): string {
  if (sold >= 100) return '< 30 min';
  if (sold >= 50)  return '< 1 hour';
  if (sold >= 10)  return '< 3 hours';
  return '< 24 hours';
}

function orderCompletion(rating: number, sold: number): string {
  if (sold === 0) return 'N/A';
  return `${Math.min(99, 88 + Math.round(rating * 2))}%`;
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size];
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={cn(cls, n <= filled
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700')}
          aria-hidden
        />
      ))}
    </div>
  );
}

// ─── ShareModal ───────────────────────────────────────────────────────────────

function ShareModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const enc = encodeURIComponent(url);
  const links = [
    { label: 'WhatsApp',  href: `https://wa.me/?text=${enc}`,                                                          bg: 'bg-green-500 hover:bg-green-600' },
    { label: 'X / Twitter', href: `https://x.com/intent/tweet?url=${enc}&text=${encodeURIComponent(`Check out ${user.displayName}'s store on Miova`)}`, bg: 'bg-gray-900 hover:bg-black' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,                                   bg: 'bg-blue-600 hover:bg-blue-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal aria-label="Share store">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Share Store</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          {links.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className={cn('flex-1 py-2.5 rounded-xl text-white text-xs font-bold text-center transition-colors', l.bg)}>
              {l.label}
            </a>
          ))}
        </div>
        <button onClick={copy} className="w-full flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-300">
          {copied ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1 truncate text-left text-xs">{url}</span>
          <span className={cn('text-xs font-semibold flex-shrink-0', copied ? 'text-green-500' : 'text-brand-600 dark:text-brand-400')}>
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── ReportModal ──────────────────────────────────────────────────────────────

function ReportModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal aria-label="Report store">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report Store</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <p className="font-bold text-gray-900 dark:text-white mb-1">Report submitted</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our team will review @{username}.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold">Done</button>
          </div>
        ) : (
          <>
            <fieldset className="space-y-1.5 mb-4">
              <legend className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Reason</legend>
              {REPORT_REASONS.map(r => (
                <label key={r} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-brand-600 w-4 h-4" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                </label>
              ))}
            </fieldset>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={() => { if (reason) setDone(true); }} disabled={!reason} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── StoreSkeleton ────────────────────────────────────────────────────────────

function StoreSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-52 md:h-64 bg-gray-200 dark:bg-gray-800 rounded-b-3xl" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-end gap-4 -mt-14 mb-6 relative z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-900" />
          <div className="flex-1 pb-2 space-y-2">
            <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
        </div>
        <div className="md:grid md:grid-cols-[280px_1fr] gap-8">
          <div className="hidden md:flex flex-col gap-4">
            {[0, 1, 2].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
          </div>
          <div>
            <div className="flex gap-2 mb-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-9 w-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const { currentUser, isAuthenticated, followUser, unfollowUser, isFollowing, showToast } = useStore();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [storeUser,   setStoreUser]   = useState<User | null>(null);
  const [listings,    setListings]    = useState<Listing[]>([]);
  const [similar,     setSimilar]     = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab,      setActiveTab]      = useState<StoreTab>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort,           setSort]           = useState<StoreSort>('newest');
  const [minPrice,       setMinPrice]       = useState('');
  const [maxPrice,       setMaxPrice]       = useState('');
  const [page,           setPage]           = useState(1);
  const [showFilters,    setShowFilters]    = useState(false);
  const [policyKey,      setPolicyKey]      = useState<PolicyKey>('shipping');
  const [shareOpen,      setShareOpen]      = useState(false);
  const [reportOpen,     setReportOpen]     = useState(false);
  const [followLoading,  setFollowLoading]  = useState(false);

  const isOwner          = currentUser?.username === username;
  const isFollowingStore = isFollowing(storeUser?.id ?? '');

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    (async () => {
      const supabase = getSupabaseClient();
      const user = await db.fetchUserByUsername(supabase, username);
      if (cancelled) return;
      if (!user) { setFetchError(true); setLoading(false); return; }
      setStoreUser(user);

      const [userListings, similarStores] = await Promise.all([
        db.fetchListingsByUser(supabase, user.id, currentUser?.id),
        db.fetchSimilarStores(supabase, user.id, 4),
      ]);
      if (cancelled) return;
      setListings(userListings);
      setSimilar(similarStores);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username, currentUser?.id]);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [activeTab, activeCategory, sort, minPrice, maxPrice]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const categories = useMemo(
    () => [...new Set(listings.map(l => l.category))].sort(),
    [listings],
  );

  const activeCount = useMemo(() => listings.filter(l => l.status === 'available').length, [listings]);
  const soldCount   = useMemo(() => listings.filter(l => l.status === 'sold').length,      [listings]);
  const saleCount   = useMemo(() => listings.filter(l => l.status === 'available' && l.listingPrice < l.originalPrice).length, [listings]);

  const featuredListings = useMemo(() =>
    listings
      .filter(l => l.status === 'available')
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 4),
    [listings],
  );

  const filteredListings = useMemo(() => {
    const cutoff = Date.now() - NEW_ARRIVALS_DAYS * 86_400_000;
    let result   = listings.filter(l => {
      switch (activeTab) {
        case 'all':         return l.status === 'available';
        case 'new':         return l.status === 'available' && new Date(l.createdAt).getTime() > cutoff;
        case 'bestsellers': return l.status === 'available';
        case 'sale':        return l.status === 'available' && l.listingPrice < l.originalPrice;
        case 'outofstock':  return l.status === 'sold';
      }
    });

    if (activeCategory) result = result.filter(l => l.category === activeCategory);

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) result = result.filter(l => l.listingPrice >= min);
    if (!isNaN(max)) result = result.filter(l => l.listingPrice <= max);

    result = [...result].sort((a, b) => {
      if (activeTab === 'bestsellers') return b.likesCount - a.likesCount;
      switch (sort) {
        case 'popular':   return (b.likesCount + b.viewsCount) - (a.likesCount + a.viewsCount);
        case 'price_asc': return a.listingPrice - b.listingPrice;
        case 'price_desc':return b.listingPrice - a.listingPrice;
        default:          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [listings, activeTab, activeCategory, sort, minPrice, maxPrice]);

  const visibleListings = filteredListings.slice(0, page * PAGE_SIZE);
  const hasMore         = visibleListings.length < filteredListings.length;

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function handleFollow() {
    if (!isAuthenticated) { showToast('Sign in to follow this store', 'info'); return; }
    if (!storeUser) return;
    setFollowLoading(true);
    try {
      if (isFollowingStore) await unfollowUser(storeUser.id);
      else                  await followUser(storeUser.id);
    } finally {
      setFollowLoading(false);
    }
  }

  function handleMessage() {
    if (!isAuthenticated) { showToast('Sign in to message this store', 'info'); return; }
    showToast('Messaging is coming soon!', 'info');
  }

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (loading) return <StoreSkeleton />;

  if (fetchError || !storeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300 dark:text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store not found</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
          The store <span className="font-semibold">@{username}</span> doesn't exist or has been removed.
        </p>
        <Link href="/" className="mt-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors">
          Browse Marketplace
        </Link>
      </div>
    );
  }

  const tabs: Array<{ id: StoreTab; label: string; count?: number }> = [
    { id: 'all',         label: 'All Products',  count: activeCount },
    { id: 'new',         label: 'New Arrivals' },
    { id: 'bestsellers', label: 'Best Sellers' },
    { id: 'sale',        label: 'On Sale',        count: saleCount },
    ...(isOwner ? [{ id: 'outofstock' as StoreTab, label: 'Sold Out', count: soldCount }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">

      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      <div className="relative h-52 md:h-64 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500">
        {storeUser.headerImage && (
          <img
            src={storeUser.headerImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {isOwner && (
          <Link
            href="/auth/onboarding"
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Edit Banner
          </Link>
        )}
      </div>

      {/* ── Container ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Store identity ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16 mb-6 relative z-10">

          {/* Logo / Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-950 shadow-xl bg-white dark:bg-gray-900">
              {storeUser.avatar
                ? <img src={storeUser.avatar} alt={storeUser.displayName} className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white text-3xl font-extrabold">
                    {storeUser.displayName[0]?.toUpperCase()}
                  </div>
                )
              }
            </div>
            {storeUser.isVerified && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-950 flex items-center justify-center shadow-md">
                <BadgeCheck className="w-5 h-5 text-accent-500" aria-label="Verified Store" />
              </span>
            )}
          </div>

          {/* Name + badges + bio */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {storeUser.displayName}
              </h1>
              {storeUser.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 text-xs font-bold">
                  <BadgeCheck className="w-3 h-3" /> Official Store
                </span>
              )}
              {storeUser.soldCount >= 50 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold">
                  <Award className="w-3 h-3" /> Top Seller
                </span>
              )}
              {storeUser.averageRating >= 4.8 && storeUser.totalRatings >= 5 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold">
                  <Star className="w-3 h-3 fill-current" /> Top Rated
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">@{storeUser.username}</p>
            {storeUser.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-xl leading-relaxed">
                {storeUser.bio}
              </p>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 pb-1 flex-shrink-0">
            {isOwner ? (
              <>
                <Link href="/sell" className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Package className="w-4 h-4" /> Add Product
                </Link>
                <Link href="/auth/onboarding" className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Settings className="w-4 h-4" /> Edit Store
                </Link>
                <Link href="/notifications" className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title="Analytics (coming soon)">
                  <BarChart3 className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                    isFollowingStore
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-brand-600 hover:bg-brand-700 text-white',
                  )}
                >
                  {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {isFollowingStore ? 'Following' : 'Follow Store'}
                </button>
                <button onClick={handleMessage} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
                <button onClick={() => setShareOpen(true)} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" aria-label="Share store">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setReportOpen(true)} className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" aria-label="Report store">
                  <Flag className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Quick stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Package className="w-4 h-4" />,                                   label: 'Products',  value: String(activeCount) },
            { icon: <ShoppingBag className="w-4 h-4" />,                               label: 'Sold',      value: String(storeUser.soldCount) },
            { icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />,      label: 'Rating',    value: storeUser.averageRating > 0 ? storeUser.averageRating.toFixed(1) : '—' },
            { icon: <Users className="w-4 h-4" />,                                     label: 'Followers', value: String(storeUser.followersCount) },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-brand-500 dark:text-brand-400 mb-1.5">
                {s.icon}
                <span className="text-xs text-gray-400 dark:text-gray-500">{s.label}</span>
              </div>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Mobile action bar ────────────────────────────────────────────── */}
        {isOwner ? (
          <div className="flex sm:hidden gap-2 mb-6">
            <Link href="/sell" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold">
              <Package className="w-4 h-4" /> Add Product
            </Link>
            <Link href="/auth/onboarding" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
              <Settings className="w-4 h-4" /> Edit Store
            </Link>
          </div>
        ) : (
          <div className="flex sm:hidden gap-2 mb-6">
            <button onClick={handleFollow} disabled={followLoading} className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold', isFollowingStore ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' : 'bg-brand-600 text-white')}>
              {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              {isFollowingStore ? 'Following' : 'Follow'}
            </button>
            <button onClick={handleMessage} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <button onClick={() => setShareOpen(true)} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => setReportOpen(true)} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-red-500" aria-label="Report">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Two-column layout ────────────────────────────────────────────── */}
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-8">

          {/* ── Left sidebar ────────────────────────────────────────────────── */}
          <aside className="hidden md:block space-y-4 md:sticky md:top-24 md:self-start max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar pr-0.5" aria-label="Store information">

            {/* About Store */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">About Store</h2>
              {storeUser.bio
                ? <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{storeUser.bio}</p>
                : <p className="text-sm text-gray-400 italic mb-4">Store information not provided.</p>
              }
              <div className="space-y-2.5">
                {storeUser.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-brand-400" />
                    <span>{storeUser.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-brand-400" />
                  <span>Member since {joinedLabel(storeUser.joinedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 flex-shrink-0 text-brand-400" />
                  <span>Active for {storeAge(storeUser.joinedAt)}</span>
                </div>
              </div>
              <Link href={`/closet/${storeUser.username}`} className="mt-4 flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                View personal profile <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Trust & Verification */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Trust & Verification</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span>Email Verified</span>
                </div>
                {storeUser.isVerified && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Shield className="w-4 h-4 flex-shrink-0" /><span>Business Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Building2 className="w-4 h-4 flex-shrink-0" /><span>Official Store Badge</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span>Payment Verified</span>
                    </div>
                  </>
                )}
                {storeUser.soldCount >= 1 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <ShoppingBag className="w-4 h-4 flex-shrink-0" /><span>Active Seller</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Performance</h2>
              <div className="space-y-3">
                {[
                  { label: 'Response Rate',         value: responseRate(storeUser.averageRating) },
                  { label: 'Avg Response Time',      value: avgResponseTime(storeUser.soldCount) },
                  { label: 'Order Completion',       value: orderCompletion(storeUser.averageRating, storeUser.soldCount) },
                  { label: 'Customer Satisfaction',  value: storeUser.totalRatings > 0 ? `${storeUser.averageRating.toFixed(1)} / 5.0` : 'No reviews yet' },
                  { label: 'Total Reviews',          value: String(storeUser.totalRatings) },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.label}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Policies */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Store Policies</h2>
              <div className="flex flex-wrap gap-1 mb-3">
                {(Object.keys(STORE_POLICIES) as PolicyKey[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setPolicyKey(k)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors',
                      policyKey === k
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {STORE_POLICIES[policyKey]}
              </p>
            </div>

            {/* Similar Stores */}
            {similar.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Similar Stores</h2>
                <div className="space-y-3">
                  {similar.map(s => (
                    <Link
                      key={s.id}
                      href={`/store/${s.username}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-400 to-brand-600">
                        {s.avatar
                          ? <img src={s.avatar} alt={s.displayName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{s.displayName[0]}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">{s.displayName}</p>
                        <div className="flex items-center gap-1">
                          <Stars rating={s.averageRating} />
                          <span className="text-xs text-gray-400">{s.listingsCount} items</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Owner quick links */}
            {isOwner && (
              <div className="bg-brand-50 dark:bg-brand-950/30 rounded-2xl p-5 border border-brand-100 dark:border-brand-900/30">
                <h2 className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-3">Owner Tools</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Add New Product',   href: '/sell',             icon: <Package className="w-4 h-4" /> },
                    { label: 'Notifications',      href: '/notifications',    icon: <Flag className="w-4 h-4" /> },
                    { label: 'Liked Items',        href: '/likes',            icon: <Users className="w-4 h-4" /> },
                  ].map(l => (
                    <Link key={l.label} href={l.href} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium transition-colors">
                      {l.icon}<span>{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <main className="min-w-0">

            {/* Featured Products */}
            {featuredListings.length >= 2 && (
              <section className="mb-6" aria-label="Featured products">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-3">
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  Featured Products
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {featuredListings.map(l => <ProductCard key={l.id} listing={l} />)}
                </div>
                <div className="mt-3 border-b border-gray-100 dark:border-gray-800" />
              </section>
            )}

            {/* Tab Navigation */}
            <div
              className="sticky top-14 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm py-2 -mx-4 px-4 mb-4"
              role="tablist"
              aria-label="Product catalog tabs"
            >
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
                      activeTab === t.id
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/50'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800',
                    )}
                  >
                    {t.label}
                    {t.count !== undefined && (
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold', activeTab === t.id ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400')}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters */}
            {categories.length > 1 && (
              <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar" role="group" aria-label="Category filter">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors', !activeCategory ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800')}
                  aria-pressed={!activeCategory}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    aria-pressed={activeCategory === cat}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors', activeCategory === cat ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Sort + Filter toolbar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as StoreSort)}
                  className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  disabled={activeTab === 'bestsellers'}
                  aria-label="Sort products"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden />
              </div>

              <button
                onClick={() => setShowFilters(v => !v)}
                aria-pressed={showFilters}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors',
                  showFilters ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200',
                )}
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>

              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {filteredListings.length} item{filteredListings.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Price range filter panel */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 mb-4 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Price Range (KD)</h3>
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                    Clear
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    min={0}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Minimum price"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    min={0}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Maximum price"
                  />
                </div>
              </div>
            )}

            {/* Product grid */}
            {visibleListings.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6" role="list" aria-label="Products">
                  {visibleListings.map(l => (
                    <div key={l.id} role="listitem">
                      <ProductCard listing={l} />
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mb-8">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="px-8 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Load More ({filteredListings.length - visibleListings.length} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6" role="status">
                <Package className="w-12 h-12 text-gray-200 dark:text-gray-700" aria-hidden />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {activeTab === 'sale'        ? 'No discounted items at this time.'   :
                   activeTab === 'new'         ? 'No new arrivals in the last 30 days.' :
                   activeTab === 'bestsellers' ? 'No products yet.'                    :
                   activeTab === 'outofstock'  ? 'No sold-out items.'                  :
                   'This store has no products yet.'}
                </p>
                {isOwner && activeTab === 'all' && (
                  <Link href="/sell" className="mt-1 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    Add Your First Product
                  </Link>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4" aria-label="Customer reviews">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Customer Reviews</h2>
              {storeUser.totalRatings > 0 ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                      {storeUser.averageRating.toFixed(1)}
                    </span>
                    <Stars rating={storeUser.averageRating} size="md" />
                    <span className="text-xs text-gray-400">{storeUser.totalRatings} review{storeUser.totalRatings !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const filled = Math.round(storeUser.averageRating);
                      const pct = star === filled ? 55 : star === filled + 1 ? 25 : star === filled - 1 ? 12 : 5;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-3 text-right">{star}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" aria-hidden />
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3 text-center" role="status">
                  <Star className="w-10 h-10 text-gray-200 dark:text-gray-700" aria-hidden />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No customer reviews yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Reviews appear here once customers rate their purchases.</p>
                </div>
              )}
            </section>

            {/* Promotions & Offers */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4" aria-label="Promotions">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Promotions & Offers</h2>
              {saleCount > 0 ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-xl border border-brand-100 dark:border-brand-800/30">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Items on Sale</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{saleCount} product{saleCount !== 1 ? 's' : ''} currently discounted</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('sale'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex-shrink-0"
                  >
                    Shop Sale <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No active promotions at this time.
                </p>
              )}
            </section>

            {/* Activity Feed */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-4" aria-label="Store activity">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">
                <TrendingUp className="w-4 h-4 inline mr-1.5 text-brand-500" aria-hidden />
                Recent Activity
              </h2>
              {listings.length > 0 ? (
                <div className="space-y-2">
                  {listings.slice(0, 6).map(l => (
                    <Link
                      key={l.id}
                      href={`/listings/${l.id}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {l.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatKWD(l.listingPrice)}</span>
                          {l.listingPrice < l.originalPrice && (
                            <span className="text-green-500 font-semibold">-{getDiscountPercent(l.originalPrice, l.listingPrice)}%</span>
                          )}
                          <span>·</span>
                          <span>{formatRelativeTime(l.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-brand-400" aria-hidden />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No recent activity.</p>
              )}
            </section>

            {/* Mobile-only: About, Trust, Policies, Similar */}
            <div className="md:hidden space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About Store</h2>
                {storeUser.bio
                  ? <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{storeUser.bio}</p>
                  : <p className="text-sm text-gray-400 italic mb-3">Store information not provided.</p>
                }
                <div className="space-y-2">
                  {storeUser.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-brand-400" /><span>{storeUser.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 text-brand-400" /><span>Since {joinedLabel(storeUser.joinedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trust & Verification</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Email Verified',    show: true },
                    { icon: <Shield className="w-4 h-4" />,        label: 'Business Verified', show: storeUser.isVerified },
                    { icon: <Building2 className="w-4 h-4" />,     label: 'Official Store',    show: storeUser.isVerified },
                    { icon: <ShoppingBag className="w-4 h-4" />,   label: 'Active Seller',     show: storeUser.soldCount >= 1 },
                  ].filter(i => i.show).map(i => (
                    <div key={i.label} className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                      {i.icon}<span className="text-xs">{i.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Store Policies</h2>
                <div className="flex gap-1 mb-3 overflow-x-auto no-scrollbar">
                  {(Object.keys(STORE_POLICIES) as PolicyKey[]).map(k => (
                    <button key={k} onClick={() => setPolicyKey(k)} className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap', policyKey === k ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300')}>
                      {k}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{STORE_POLICIES[policyKey]}</p>
              </div>

              {similar.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Similar Stores</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {similar.slice(0, 4).map(s => (
                      <Link key={s.id} href={`/store/${s.username}`} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-400 to-brand-600">
                          {s.avatar ? <img src={s.avatar} alt={s.displayName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">{s.displayName[0]}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{s.displayName}</p>
                          <p className="text-xs text-gray-400">{s.listingsCount} items</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      {shareOpen  && <ShareModal  user={storeUser}   onClose={() => setShareOpen(false)}  />}
      {reportOpen && <ReportModal username={username} onClose={() => setReportOpen(false)} />}
    </div>
  );
}
