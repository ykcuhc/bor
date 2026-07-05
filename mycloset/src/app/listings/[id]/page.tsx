'use client';

import {
  useEffect, useState, useRef, useCallback, use, useMemo
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, Share2, Tag, ShoppingBag, ChevronLeft, ChevronRight,
  BadgeCheck, Star, Eye, MessageCircle, Shield, Truck, RefreshCcw,
  ZoomIn, X, Maximize2, Copy, Check, Flag, ChevronDown, ChevronUp,
  Search, ThumbsUp, Camera, Send, Minus, Plus, MapPin, Clock,
  Package, Store, ArrowRight, AlertCircle, CheckCircle2, Info,
  MessageSquare, Users, Loader2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  formatKWD, formatRelativeTime, getDiscountPercent, cn
} from '@/lib/utils';
import { SHIPPING_FEE_KWD } from '@/lib/mockData';
import type { Listing } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import { fetchListingById } from '@/lib/supabase/queries';

// ── Analytics helper ───────────────────────────────────────────────────────────

function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  // Ready for: window.gtag?.('event', event, data);
  console.log('[Analytics]', event, data ?? {});
}

// ── Recently viewed (localStorage) ────────────────────────────────────────────

const RV_KEY = 'miova_recently_viewed';

function addRecentlyViewed(id: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(RV_KEY) ?? '[]');
    const updated = [id, ...existing.filter(x => x !== id)].slice(0, 20);
    localStorage.setItem(RV_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RV_KEY) ?? '[]');
  } catch { return []; }
}

// ── Mock data generators ───────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  {
    id: 'r1', author: 'Layla A.', avatar: 'https://i.pravatar.cc/48?img=47',
    rating: 5, date: '2025-11-10', title: 'Exactly as described!',
    body: 'Item arrived quickly and was in perfect condition. The seller was very responsive. Would definitely buy from this store again.',
    verified: true, helpful: 24, images: ['https://picsum.photos/seed/rev1a/200/200'],
  },
  {
    id: 'r2', author: 'Khalid M.', avatar: 'https://i.pravatar.cc/48?img=12',
    rating: 4, date: '2025-11-05', title: 'Good quality, fast shipping',
    body: 'Packaging was excellent, item was well protected. Very happy with the purchase. Only minor issue was color was slightly different from photos.',
    verified: true, helpful: 17, images: [],
  },
  {
    id: 'r3', author: 'Noura H.', avatar: 'https://i.pravatar.cc/48?img=32',
    rating: 5, date: '2025-10-28', title: 'Outstanding seller!',
    body: 'Seller went above and beyond to answer all my questions before I purchased. Very trustworthy. Highly recommend.',
    verified: false, helpful: 9, images: ['https://picsum.photos/seed/rev3a/200/200', 'https://picsum.photos/seed/rev3b/200/200'],
  },
  {
    id: 'r4', author: 'Sara K.', avatar: 'https://i.pravatar.cc/48?img=23',
    rating: 3, date: '2025-10-15', title: 'Good but took a few days',
    body: 'Product is as described. The shipping took a little longer than expected but everything arrived in great condition.',
    verified: true, helpful: 5, images: [],
  },
  {
    id: 'r5', author: 'Ahmed R.', avatar: 'https://i.pravatar.cc/48?img=11',
    rating: 5, date: '2025-09-30', title: 'Perfect purchase!',
    body: "Couldn't be happier with this purchase. Authentic, fast, and the seller was incredibly communicative throughout the whole process.",
    verified: true, helpful: 31, images: [],
  },
];

const MOCK_QA = [
  {
    id: 'q1',
    question: 'Is this item authentic? Do you have any proof of authenticity?',
    asker: 'Buyer_Q8',
    askedAt: '2025-11-12',
    answer: 'Yes! All items are 100% authentic. I have original receipts and authenticity cards available for inspection. Feel free to message me for more details.',
    answeredAt: '2025-11-12',
  },
  {
    id: 'q2',
    question: 'Can you ship to Jahra? How long will delivery take?',
    asker: 'shopper_kw',
    askedAt: '2025-11-08',
    answer: 'Yes, I ship to all areas of Kuwait. Delivery typically takes 1-2 business days via Aramex or SMSA. I\'ll send tracking info once shipped.',
    answeredAt: '2025-11-09',
  },
  {
    id: 'q3',
    question: 'Is the price negotiable? I am buying 2 items from your store.',
    asker: 'fashion_lover',
    askedAt: '2025-10-30',
    answer: 'For bundle purchases, I\'m happy to offer a discount! Send me a message with what you\'re interested in and we can work something out.',
    answeredAt: '2025-10-30',
  },
];

const HIGHLIGHTS_BY_CATEGORY: Record<string, string[]> = {
  Beauty:      ['100% Authentic Product', 'Sealed & Unused', 'Fast Delivery', 'Easy Returns within 3 days'],
  Electronics: ['Genuine Product', 'Warranty Included', 'Tested & Working', 'Secure Packaging'],
  Women:       ['Authentic Item', 'As Described in Photos', 'Miova Buyer Protection', 'Fast Shipping'],
  Men:         ['Authentic Item', 'As Described in Photos', 'Miova Buyer Protection', 'Fast Shipping'],
  default:     ['Authentic Product', 'Verified Seller', 'Buyer Protection', 'Fast Delivery'],
};

const WHATS_INCLUDED_BY_CATEGORY: Record<string, string[]> = {
  Electronics: ['1× Main Device', 'Original Charging Cable', 'User Manual', 'Original Box'],
  Beauty:      ['1× Product', 'Original Packaging'],
  default:     ['1× Item as shown', 'Secure packaging'],
};

const TRUST_BADGES = [
  { icon: BadgeCheck, label: 'Verified Seller',      color: 'text-brand-600' },
  { icon: Shield,     label: 'Secure Payments',       color: 'text-green-600' },
  { icon: CheckCircle2, label: 'Authentic Product',   color: 'text-blue-600' },
  { icon: RefreshCcw, label: 'Money-Back Guarantee',  color: 'text-amber-600' },
  { icon: Truck,      label: 'Fast Shipping',         color: 'text-purple-600' },
];

// ── Image Gallery ──────────────────────────────────────────────────────────────

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomed, setZoomed]         = useState(false);
  const [zoomPos, setZoomPos]       = useState({ x: 50, y: 50 });
  const touchStart = useRef<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  function prev() { setActiveIdx(i => Math.max(0, i - 1)); }
  function next() { setActiveIdx(i => Math.min(images.length - 1, i + 1)); }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (diff > 50) prev();
    else if (diff < -50) next();
    touchStart.current = null;
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    setZoomPos({ x, y });
  }

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     setFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, activeIdx]);

  return (
    <>
      <div className="space-y-3 select-none">
        {/* Main image */}
        <div
          ref={imgRef}
          className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => setZoomed(false)}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setZoomed(false)}
          onClick={() => { track('gallery_open', { idx: activeIdx }); setFullscreen(true); }}
          role="button"
          aria-label="Open fullscreen gallery"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setFullscreen(true)}
        >
          <img
            src={images[activeIdx]}
            alt={`${title} — photo ${activeIdx + 1}`}
            className="w-full h-full object-cover transition-transform duration-300"
            style={zoomed ? { transform: `scale(2) translate(${50 - zoomPos.x}%, ${50 - zoomPos.y}%)` } : undefined}
            loading="eager"
          />

          {/* Controls */}
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev(); }}
                disabled={activeIdx === 0}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={e => { e.stopPropagation(); next(); }}
                disabled={activeIdx === images.length - 1}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center disabled:opacity-30 hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-400">
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 right-12 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                {activeIdx + 1}/{images.length}
              </span>
            </>
          )}
          <button
            onClick={e => { e.stopPropagation(); setFullscreen(true); }}
            aria-label="Fullscreen"
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Image thumbnails">
            {images.map((img, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={activeIdx === i}
                onClick={() => { setActiveIdx(i); track('gallery_thumb', { idx: i }); }}
                className={cn(
                  'w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400',
                  activeIdx === i ? 'border-brand-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                )}
              >
                <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen gallery"
        >
          <button
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <button onClick={prev} disabled={activeIdx === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-20 hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <img
            src={images[activeIdx]}
            alt={`${title} — ${activeIdx + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          <button onClick={next} disabled={activeIdx === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-20 hover:bg-white/30 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={cn('w-2 h-2 rounded-full transition-all', i === activeIdx ? 'bg-white w-5' : 'bg-white/40')} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Quantity Selector ──────────────────────────────────────────────────────────

function QuantitySelector({
  value, max, onChange,
}: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0" role="group" aria-label="Quantity selector">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="w-10 h-10 rounded-l-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:z-10"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="w-14 h-10 border-t border-b border-gray-200 flex items-center justify-center text-sm font-bold text-gray-900">
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="w-10 h-10 rounded-r-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:z-10"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Stars display ──────────────────────────────────────────────────────────────

function StarsDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(cls, i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200')} />
      ))}
    </span>
  );
}

// ── Reviews Section ────────────────────────────────────────────────────────────

function ReviewsSection({ listingId }: { listingId: string }) {
  const [sortBy, setSortBy]         = useState<'newest' | 'helpful' | 'highest' | 'lowest' | 'photos'>('newest');
  const [filterVerified, setFilter] = useState(false);
  const [search, setSearch]         = useState('');
  const [helpfulVoted, setVoted]    = useState<Set<string>>(new Set());
  const [showAll, setShowAll]       = useState(false);
  const [activePhoto, setPhoto]     = useState<string | null>(null);

  const avgRating = useMemo(() => {
    const sum = MOCK_REVIEWS.reduce((a, r) => a + r.rating, 0);
    return sum / MOCK_REVIEWS.length;
  }, []);

  const distribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    MOCK_REVIEWS.forEach(r => { counts[r.rating] = (counts[r.rating] ?? 0) + 1; });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let list = [...MOCK_REVIEWS];
    if (filterVerified) list = list.filter(r => r.verified);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.body.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
    }
    if (sortBy === 'photos')  list = list.filter(r => r.images.length > 0);
    if (sortBy === 'helpful') list.sort((a, b) => b.helpful - a.helpful);
    if (sortBy === 'highest') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'lowest')  list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [sortBy, filterVerified, search]);

  const displayed = showAll ? filtered : filtered.slice(0, 3);

  function voteHelpful(id: string) {
    setVoted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    track('review_helpful', { reviewId: id });
  }

  return (
    <section aria-labelledby="reviews-heading" className="mt-12">
      <h2 id="reviews-heading" className="text-xl font-extrabold text-gray-900 uppercase tracking-wide mb-6">
        Customer Reviews
      </h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-white rounded-2xl border border-gray-100">
        <div className="text-center flex-shrink-0">
          <div className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</div>
          <StarsDisplay rating={avgRating} size="md" />
          <p className="text-xs text-gray-400 mt-1">{MOCK_REVIEWS.length} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution[star] ?? 0;
            const pct = MOCK_REVIEWS.length ? (count / MOCK_REVIEWS.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">{star}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews…"
            aria-label="Search reviews"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          aria-label="Sort reviews"
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 bg-white"
        >
          <option value="newest">Newest</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
          <option value="photos">With Photos</option>
        </select>
        <button
          onClick={() => setFilter(v => !v)}
          className={cn(
            'px-3 py-2 text-sm rounded-xl border transition-all',
            filterVerified ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-300'
          )}
        >
          Verified Only
        </button>
      </div>

      {/* Review list */}
      {displayed.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No reviews match your filters.</p>
      ) : (
        <div className="space-y-5">
          {displayed.map(review => (
            <article key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={review.avatar} alt={review.author} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.author}</p>
                    <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('en-KW', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <StarsDisplay rating={review.rating} />
                  {review.verified && (
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5 flex items-center gap-0.5 justify-end">
                      <BadgeCheck className="w-3 h-3" /> Verified Purchase
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.body}</p>

              {review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((img, i) => (
                    <button key={i} onClick={() => setPhoto(img)} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-400">
                      <img src={img} alt="Review photo" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Helpful?</span>
                <button
                  onClick={() => voteHelpful(review.id)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-xs font-medium',
                    helpfulVoted.has(review.id) ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50 text-gray-400'
                  )}
                  aria-label={`Mark review as helpful. ${review.helpful + (helpfulVoted.has(review.id) ? 1 : 0)} people found this helpful`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {review.helpful + (helpfulVoted.has(review.id) ? 1 : 0)}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {filtered.length > 3 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-4 w-full py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          {showAll ? (<><ChevronUp className="w-4 h-4" /> Show less</>) : (<><ChevronDown className="w-4 h-4" /> Show all {filtered.length} reviews</>)}
        </button>
      )}

      {/* Photo lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <button onClick={() => setPhoto(null)} aria-label="Close" className="absolute top-4 right-4 text-white w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <img src={activePhoto} alt="Review photo" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
        </div>
      )}
    </section>
  );
}

// ── Q&A Section ────────────────────────────────────────────────────────────────

function QASection({ isAuthenticated, onSignInPrompt }: { isAuthenticated: boolean; onSignInPrompt: () => void }) {
  const [search,   setSearch]   = useState('');
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set(['q1']));

  const filtered = MOCK_QA.filter(q =>
    !search.trim() || q.question.toLowerCase().includes(search.toLowerCase())
  );

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { onSignInPrompt(); return; }
    if (!question.trim()) return;
    setSubmitted(true);
    setQuestion('');
    track('qa_submitted', {});
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <section aria-labelledby="qa-heading" className="mt-12">
      <h2 id="qa-heading" className="text-xl font-extrabold text-gray-900 uppercase tracking-wide mb-6">
        Questions & Answers
      </h2>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search questions"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
      </div>

      {/* Q&A list */}
      <div className="space-y-3 mb-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No matching questions.</p>
        ) : filtered.map(qa => (
          <div key={qa.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleExpand(qa.id)}
              className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={expanded.has(qa.id)}
            >
              <div className="flex gap-2">
                <span className="text-brand-600 font-bold text-sm flex-shrink-0">Q</span>
                <p className="text-sm font-medium text-gray-900">{qa.question}</p>
              </div>
              {expanded.has(qa.id) ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {expanded.has(qa.id) && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="flex gap-2 pt-3">
                  <span className="text-green-600 font-bold text-sm flex-shrink-0">A</span>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">{qa.answer}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Answered by seller · {new Date(qa.answeredAt).toLocaleDateString('en-KW', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ask question */}
      {submitted ? (
        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Your question has been submitted. The seller will respond soon.
        </div>
      ) : (
        <form onSubmit={handleAsk} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ask the seller</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={isAuthenticated ? 'Type your question…' : 'Sign in to ask a question'}
              disabled={!isAuthenticated}
              rows={2}
              maxLength={300}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!isAuthenticated || !question.trim()}
            className="flex-shrink-0 px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Ask
          </button>
        </form>
      )}
    </section>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────────────

function ShareModal({ open, onClose, title, url }: {
  open: boolean; onClose: () => void; title: string; url: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    track('share', { method: 'copy_link' });
    setTimeout(() => setCopied(false), 2000);
  }

  const shareChannels = [
    { label: 'WhatsApp',  color: 'bg-green-500',   emoji: '💬', href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
    { label: 'X (Twitter)', color: 'bg-gray-900',  emoji: '𝕏',  href: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: 'Facebook',  color: 'bg-blue-600',    emoji: 'f',  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'Instagram', color: 'bg-gradient-to-br from-purple-600 to-pink-500', emoji: '📸', href: '#' },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Share product">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Share this product</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {shareChannels.map(ch => (
            <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer"
              onClick={() => track('share', { method: ch.label.toLowerCase() })}
              className="flex flex-col items-center gap-1.5 group">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold group-hover:scale-105 transition-transform', ch.color)}>
                {ch.emoji}
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight">{ch.label}</span>
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 px-3 py-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl truncate focus:outline-none"
          />
          <button
            onClick={copy}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
              copied ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
            )}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Modal ───────────────────────────────────────────────────────────────

function ReportModal({ open, onClose, listingId }: { open: boolean; onClose: () => void; listingId: string }) {
  const [reason,    setReason]    = useState('');
  const [details,   setDetails]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  const REASONS = [
    'Counterfeit or fake product',
    'Incorrect or misleading information',
    'Spam or duplicate listing',
    'Illegal or prohibited product',
    'Inappropriate content',
    'Other',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    track('report_submitted', { listingId, reason });
    setSubmitted(true);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label="Report product">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Report this listing</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Report submitted</p>
            <p className="text-xs text-gray-500 mt-1">Thank you. We'll review this listing within 24 hours.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for reporting</label>
              <div className="space-y-2">
                {REASONS.map(r => (
                  <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-brand-600"
                    />
                    <span className="text-sm text-gray-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Provide any additional information…"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!reason}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              Submit Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Related Products ───────────────────────────────────────────────────────────

function RelatedProductsSection({ currentId, category }: { currentId: string; category: string }) {
  const { filteredListings } = useStore();

  const related = useMemo(() => {
    return filteredListings()
      .filter(l => l.id !== currentId && l.status === 'available' && l.category === category)
      .slice(0, 8);
  }, [currentId, category]);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 id="related-heading" className="text-xl font-extrabold text-gray-900 uppercase tracking-wide">
          Similar Products
        </h2>
        <Link href={`/search?category=${category}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {related.map(l => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex-shrink-0 w-40 sm:w-48 snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="aspect-square overflow-hidden bg-gray-50 relative">
              <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              {l.originalPrice > l.listingPrice && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  -{getDiscountPercent(l.originalPrice, l.listingPrice)}%
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">{l.title}</p>
              <p className="text-sm font-bold text-gray-900">{formatKWD(l.listingPrice)}</p>
              {l.originalPrice > l.listingPrice && (
                <p className="text-[10px] text-gray-400 line-through">{formatKWD(l.originalPrice)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Recently Viewed ────────────────────────────────────────────────────────────

function RecentlyViewedSection({ currentId }: { currentId: string }) {
  const { filteredListings } = useStore();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const rv = getRecentlyViewed().filter(id => id !== currentId).slice(0, 8);
    setIds(rv);
  }, [currentId]);

  const listings = useMemo(() => {
    const all = filteredListings();
    return ids.map(id => all.find(l => l.id === id)).filter(Boolean) as typeof all;
  }, [ids, filteredListings]);

  if (listings.length === 0) return null;

  return (
    <section aria-labelledby="rv-heading" className="mt-12">
      <h2 id="rv-heading" className="text-xl font-extrabold text-gray-900 uppercase tracking-wide mb-5">
        Recently Viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {listings.map(l => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex-shrink-0 w-32 sm:w-40 snap-start group"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
              <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            </div>
            <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight mb-0.5">{l.title}</p>
            <p className="text-xs font-bold text-gray-900">{formatKWD(l.listingPrice)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Sticky Purchase Bar ────────────────────────────────────────────────────────

function StickyBar({
  listing, qty, isSold, visible, onAddToCart, onBuyNow,
}: {
  listing: Listing; qty: number; isSold: boolean;
  visible: boolean; onAddToCart: () => void; onBuyNow: () => void;
}) {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg transition-transform duration-300',
      visible ? 'translate-y-0' : 'translate-y-full'
    )} aria-hidden={!visible}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <div className="hidden sm:block flex-shrink-0">
          <img src={listing.images[0]} alt={listing.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="text-xs font-semibold text-gray-900 truncate">{listing.title}</p>
          <p className="text-sm font-extrabold text-gray-900">{formatKWD(listing.listingPrice)}</p>
        </div>
        <div className="sm:hidden">
          <p className="text-base font-extrabold text-gray-900">{formatKWD(listing.listingPrice)} × {qty}</p>
        </div>
        {isSold ? (
          <span className="px-6 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl text-sm">Sold</span>
        ) : (
          <div className="flex gap-2">
            <button onClick={onAddToCart}
              className="px-4 sm:px-6 py-3 border-2 border-brand-600 text-brand-600 font-bold rounded-xl text-sm hover:bg-brand-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-400">
              Add to Cart
            </button>
            <button onClick={onBuyNow}
              className="px-4 sm:px-6 py-3 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-400">
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function PDPSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
      <div className="flex gap-2 mb-6">
        {[80, 60, 100, 140].map(w => <div key={w} className="h-4 bg-gray-100 rounded" style={{ width: w }} />)}
      </div>
      <div className="lg:grid lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="mt-8 lg:mt-0 space-y-4">
          <div className="h-8 bg-gray-100 rounded w-4/5" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-10 bg-gray-100 rounded w-2/5" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getListing, toggleLike, openOfferModal, isAuthenticated,
    showToast, incrementViews, currentUser, filteredListings, listingsLoaded,
  } = useStore();

  const [listing,     setListing]     = useState<Listing | null>(null);
  const [fetchError,  setFetchError]  = useState(false);
  const [qty,         setQty]         = useState(1);
  const [showShare,   setShowShare]   = useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [stickyVisible, setSticky]    = useState(false);
  const [cartAdded,   setCartAdded]   = useState(false);
  const [activeTab,   setTab]         = useState<'description' | 'specs' | 'reviews' | 'qa'>('description');

  const actionsRef  = useRef<HTMLDivElement>(null);

  // Load listing
  useEffect(() => {
    const fromStore = getListing(id);
    if (fromStore) {
      setListing(fromStore);
      incrementViews(id);
      addRecentlyViewed(id);
      track('product_view', { id, title: fromStore.title });
      return;
    }
    fetchListingById(getSupabaseClient(), id, currentUser?.id)
      .then(l => {
        if (l) {
          setListing(l);
          incrementViews(id);
          addRecentlyViewed(id);
          track('product_view', { id, title: l.title });
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true));
  }, [id, listingsLoaded]);

  // Sticky bar via IntersectionObserver
  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [listing]);

  // JSON-LD schema
  useEffect(() => {
    if (!listing) return;
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: window.location.origin },
          { '@type': 'ListItem', position: 2, name: listing.category, item: `${window.location.origin}/search?category=${listing.category}` },
          { '@type': 'ListItem', position: 3, name: listing.title },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description,
        image: listing.images,
        brand: { '@type': 'Brand', name: listing.brand || 'Miova.' },
        offers: {
          '@type': 'Offer',
          price: listing.listingPrice.toFixed(3),
          priceCurrency: 'KWD',
          availability: listing.status === 'available'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
          url: window.location.href,
          seller: { '@type': 'Person', name: listing.seller.displayName },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.4',
          reviewCount: MOCK_REVIEWS.length.toString(),
        },
      },
    ];
    document.title = `${listing.title} — Miova.`;
    let el = document.getElementById('pdp-schema');
    if (!el) { const s = document.createElement('script'); s.id = 'pdp-schema'; s.type = 'application/ld+json'; document.head.appendChild(s); el = s; }
    el.textContent = JSON.stringify(schemas);
    return () => { document.getElementById('pdp-schema')?.remove(); };
  }, [listing]);

  const localListing = listing ?? getListing(id);
  const isLiked  = currentUser?.likedListings.includes(id) ?? localListing?.isLikedByCurrentUser ?? false;

  if (!localListing && !fetchError) return <PDPSkeleton />;

  if (fetchError || !localListing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center" role="main">
        <div className="text-6xl mb-4" aria-hidden="true">🔍</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Listing not found</h1>
        <p className="text-gray-500 mb-6">This item may have been removed or sold.</p>
        <Link href="/" className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </Link>
      </div>
    );
  }

  const l         = localListing;
  const discount  = getDiscountPercent(l.originalPrice, l.listingPrice);
  const savings   = l.originalPrice - l.listingPrice;
  const isSold    = l.status === 'sold';
  const stockLeft = l.quantity;
  const isLowStock = stockLeft > 0 && stockLeft <= 5;
  const avgRating = 4.4;
  const reviewCount = MOCK_REVIEWS.length;
  const highlights = HIGHLIGHTS_BY_CATEGORY[l.category] ?? HIGHLIGHTS_BY_CATEGORY.default;
  const whatsIncluded = WHATS_INCLUDED_BY_CATEGORY[l.category] ?? WHATS_INCLUDED_BY_CATEGORY.default;

  const DELIVERY_DAYS_MIN = 1;
  const DELIVERY_DAYS_MAX = 3;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + DELIVERY_DAYS_MAX);
  const deliveryLabel = deliveryDate.toLocaleDateString('en-KW', { weekday: 'long', month: 'short', day: 'numeric' });

  const specs: [string, string][] = [
    ['Brand',      l.brand         || '—'],
    ['Category',   l.subCategory   || l.category],
    ['Size',       l.size          || 'One Size'],
    ['Condition',  l.condition],
    ['Color',      l.color.join(', ') || '—'],
    ['SKU',        `MV-${l.id.slice(0, 8).toUpperCase()}`],
    ['Listed',     formatRelativeTime(l.createdAt)],
    ['Views',      l.viewsCount.toLocaleString()],
  ];

  function requireAuth(action: () => void) {
    if (!isAuthenticated) { showToast('Please sign in to continue', 'info'); return; }
    action();
  }

  function handleAddToCart() {
    requireAuth(() => {
      if (isSold) { showToast('This item has already been sold', 'error'); return; }
      setCartAdded(true);
      track('add_to_cart', { id: l.id, qty, price: l.listingPrice });
      showToast(`Added to cart (${qty}×)`, 'success');
      setTimeout(() => setCartAdded(false), 3000);
    });
  }

  function handleBuyNow() {
    requireAuth(() => {
      if (isSold) { showToast('This item has already been sold', 'error'); return; }
      track('buy_now', { id: l.id, price: l.listingPrice });
      showToast('Redirecting to checkout…', 'success');
    });
  }

  function handleWishlist() {
    requireAuth(() => {
      toggleLike(id);
      track('wishlist', { id, action: isLiked ? 'remove' : 'add' });
    });
  }

  function handleShare() {
    track('share_open', { id });
    setShowShare(true);
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://miova.moe-akbar95.workers.dev/listings/${id}`;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-28">

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-gray-400 mb-5">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <Link href={`/search?category=${l.category}`} className="hover:text-brand-600 transition-colors">{l.category}</Link>
          {l.subCategory && (
            <>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              <Link href={`/search?subCategory=${l.subCategory}`} className="hover:text-brand-600 transition-colors">{l.subCategory}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="text-gray-900 font-medium truncate max-w-40">{l.title}</span>
        </nav>

        {/* ── Main 2-col grid ─────────────────────────────────────────────────── */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-14">

          {/* Left — Gallery */}
          <div>
            <ImageGallery images={l.images} title={l.title} />

            {/* Trust badges — desktop below gallery */}
            <div className="hidden lg:grid grid-cols-5 gap-2 mt-4">
              {TRUST_BADGES.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-gray-100 text-center">
                  <Icon className={cn('w-5 h-5', color)} aria-hidden="true" />
                  <span className="text-[10px] text-gray-500 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Product info */}
          <div className="mt-6 lg:mt-0">

            {/* Title + actions */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight flex-1">{l.title}</h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleWishlist}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-400',
                    isLiked ? 'bg-brand-50 border-brand-200 text-brand-600' : 'border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-600'
                  )}
                >
                  <Heart className={cn('w-4 h-4', isLiked && 'fill-brand-600')} aria-hidden="true" />
                  <span>{l.likesCount}</span>
                </button>
                <button onClick={handleShare} aria-label="Share this product"
                  className="p-2 rounded-full border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400">
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button onClick={() => setShowReport(true)} aria-label="Report this listing"
                  className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-300">
                  <Flag className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Brand + Store + Rating */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {l.brand && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">{l.brand}</span>
              )}
              <div className="flex items-center gap-1">
                <Link href={`/closet/${l.seller.username}`} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5">
                  <Store className="w-3 h-3" aria-hidden="true" />
                  {l.seller.displayName}
                </Link>
                {l.seller.isVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-brand-500" aria-label="Verified seller" />
                )}
              </div>
            </div>

            {/* Rating + stats */}
            <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
              <div className="flex items-center gap-1.5">
                <StarsDisplay rating={avgRating} />
                <span className="font-semibold text-gray-900">{avgRating}</span>
                <button onClick={() => setTab('reviews')} className="text-gray-400 hover:text-brand-600 transition-colors">
                  ({reviewCount} reviews)
                </button>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{l.viewsCount.toLocaleString()} views</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-gray-500">
                <Heart className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{l.likesCount.toLocaleString()} liked</span>
              </div>
            </div>

            {/* Condition chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {l.size && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Size {l.size}</span>
              )}
              <span className={cn(
                'px-3 py-1 text-xs font-semibold rounded-full',
                l.condition === 'NWT'       ? 'bg-green-50  text-green-700'  :
                l.condition === 'NWOT'      ? 'bg-blue-50   text-blue-700'   :
                l.condition === 'Excellent' ? 'bg-purple-50 text-purple-700' :
                l.condition === 'Good'      ? 'bg-amber-50  text-amber-700'  :
                'bg-gray-100 text-gray-600'
              )}>
                {l.condition === 'NWT'  ? '✨ New With Tags'     :
                 l.condition === 'NWOT' ? '🏷️ New Without Tags' :
                 l.condition}
              </span>
              {l.color.map(c => (
                <span key={c} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{c}</span>
              ))}
            </div>

            {/* ── Pricing ──────────────────────────────────────────────────── */}
            <div className="p-4 bg-gray-50 rounded-2xl mb-4">
              <div className="flex items-baseline gap-3 flex-wrap mb-1">
                <span className="text-3xl font-extrabold text-gray-900" aria-label={`Current price: ${formatKWD(l.listingPrice)}`}>
                  {formatKWD(l.listingPrice)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through" aria-label={`Original price: ${formatKWD(l.originalPrice)}`}>
                      {formatKWD(l.originalPrice)}
                    </span>
                    <span className="text-sm font-bold text-white bg-red-500 px-2.5 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              {discount > 0 && (
                <p className="text-sm text-green-600 font-semibold">
                  You save {formatKWD(savings)} 🎉
                </p>
              )}
            </div>

            {/* Stock status */}
            <div className="mb-4">
              {isSold ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                  Sold
                </div>
              ) : isLowStock ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  Only {stockLeft} left — order soon!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  In Stock
                </div>
              )}
            </div>

            {/* Quantity + Purchase actions */}
            <div ref={actionsRef}>
              {!isSold && (
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Quantity</label>
                    <QuantitySelector value={qty} max={Math.max(1, stockLeft)} onChange={setQty} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-extrabold text-gray-900">{formatKWD(l.listingPrice * qty)}</p>
                  </div>
                </div>
              )}

              {isSold ? (
                <div className="p-4 bg-gray-100 rounded-2xl text-center mb-4">
                  <p className="text-sm font-bold text-gray-600">This item has been sold</p>
                  <Link href={`/search?category=${l.category}`} className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                    Browse similar items →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-brand-600 text-white font-bold text-base rounded-2xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                    aria-label={`Buy Now for ${formatKWD(l.listingPrice * qty)}`}
                  >
                    <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-4 border-2 border-brand-600 font-bold text-base rounded-2xl active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
                      cartAdded ? 'bg-green-50 border-green-500 text-green-700' : 'text-brand-600 hover:bg-brand-50'
                    )}
                    aria-label={cartAdded ? 'Added to cart' : 'Add to cart'}
                  >
                    {cartAdded ? <Check className="w-5 h-5" /> : <Tag className="w-5 h-5" aria-hidden="true" />}
                    {cartAdded ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              )}

              {!isSold && (
                <button
                  onClick={() => requireAuth(() => { if (!isSold) openOfferModal(id); })}
                  className="w-full py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  💬 Make an Offer
                </button>
              )}
            </div>

            {/* Delivery */}
            <div className="p-4 bg-white border border-gray-100 rounded-2xl space-y-3 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Delivery</h3>
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm text-gray-700">
                    Estimated delivery by <strong>{deliveryLabel}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Flat rate: <strong className="text-gray-700">{formatKWD(SHIPPING_FEE_KWD)}</strong> · Kuwait-wide delivery
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-gray-500">
                  Delivery available to all governorates · Express next-day available
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-gray-700">
                  <strong>Miova Buyer Guarantee</strong> — Your payment is held securely until you confirm receipt
                </p>
              </div>
            </div>

            {/* Product highlights */}
            <div className="p-4 bg-white border border-gray-100 rounded-2xl mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Product Highlights</h3>
              <ul className="space-y-2" aria-label="Product highlights">
                {highlights.map(h => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* What's included */}
            <div className="p-4 bg-white border border-gray-100 rounded-2xl mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" aria-hidden="true" />
                What's Included
              </h3>
              <ul className="space-y-1.5" aria-label="Box contents">
                {whatsIncluded.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warranty + Returns */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" /> Warranty
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Coverage as described by seller. Platform dispute resolution available.
                </p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <RefreshCcw className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" /> Returns
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  3-day return window if item significantly differs from listing.
                </p>
              </div>
            </div>

            {/* Seller card */}
            <div className="border border-gray-100 rounded-2xl p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Sold by</h3>
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/closet/${l.seller.username}`} className="flex-shrink-0">
                  <img src={l.seller.avatar} alt={l.seller.displayName} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-100" loading="lazy" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/closet/${l.seller.username}`} className="text-sm font-bold text-gray-900 hover:text-brand-600 transition-colors">
                      {l.seller.displayName}
                    </Link>
                    {l.seller.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" aria-label="Verified seller" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">@{l.seller.username}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <strong>4.9</strong> rating
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      Fast replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" aria-hidden="true" />
                      203 sales
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/closet/${l.seller.username}`}
                  className="flex-1 text-center py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Visit Store
                </Link>
                <button
                  onClick={() => requireAuth(() => showToast('Message sent to seller', 'success'))}
                  className="flex-1 py-2.5 bg-brand-50 text-brand-700 text-sm font-semibold rounded-xl hover:bg-brand-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" /> Message
                </button>
              </div>
            </div>

            {/* Tags */}
            {l.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {l.tags.map(tag => (
                  <Link key={tag} href={`/search?q=${tag}`}
                    className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabbed content ──────────────────────────────────────────────────── */}
        <div className="mt-12">
          {/* Trust badges mobile */}
          <div className="lg:hidden grid grid-cols-5 gap-2 mb-8">
            {TRUST_BADGES.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-gray-100 text-center">
                <Icon className={cn('w-5 h-5', color)} aria-hidden="true" />
                <span className="text-[9px] text-gray-500 leading-tight text-center">{label}</span>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Product information tabs">
            {([
              { id: 'description', label: 'Description' },
              { id: 'specs',       label: 'Specifications' },
              { id: 'reviews',     label: `Reviews (${reviewCount})` },
              { id: 'qa',          label: 'Q&A' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tab-panel-${tab.id}`}
                onClick={() => setTab(tab.id)}
                className={cn(
                  'flex-shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div id="tab-panel-description" role="tabpanel" hidden={activeTab !== 'description'}>
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Description</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{l.description}</p>

              {/* SKU + info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
                <p>SKU: <strong className="text-gray-700">MV-{l.id.slice(0, 8).toUpperCase()}</strong></p>
                <p>Listed: <strong className="text-gray-700">{formatRelativeTime(l.createdAt)}</strong></p>
                <p>Last updated: <strong className="text-gray-700">{formatRelativeTime(l.updatedAt)}</strong></p>
              </div>
            </div>
          </div>

          <div id="tab-panel-specs" role="tabpanel" hidden={activeTab !== 'specs'}>
            <div className="max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm" aria-label="Product specifications">
                  <tbody>
                    {specs.map(([label, value], i) => (
                      <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <th scope="row" className="px-5 py-3 text-gray-500 font-semibold w-36 text-left">{label}</th>
                        <td className="px-5 py-3 text-gray-900">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seller policies */}
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'Shipping Policy',  icon: Truck,      text: `Flat rate ${formatKWD(SHIPPING_FEE_KWD)} · Delivered within ${DELIVERY_DAYS_MIN}–${DELIVERY_DAYS_MAX} business days across Kuwait.` },
                  { title: 'Return Policy',    icon: RefreshCcw, text: '3-day return window from delivery date. Item must be in original condition as listed.' },
                  { title: 'Authenticity',     icon: BadgeCheck, text: 'Seller guarantees all items are authentic and accurately described. Disputes handled by Miova.' },
                  { title: 'Support',          icon: MessageCircle, text: 'Message the seller directly through Miova. Typical response time: under 1 hour.' },
                ].map(({ title, icon: Icon, text }) => (
                  <div key={title} className="p-4 bg-white border border-gray-100 rounded-2xl">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" /> {title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="tab-panel-reviews" role="tabpanel" hidden={activeTab !== 'reviews'}>
            <ReviewsSection listingId={l.id} />
          </div>

          <div id="tab-panel-qa" role="tabpanel" hidden={activeTab !== 'qa'}>
            <QASection
              isAuthenticated={isAuthenticated}
              onSignInPrompt={() => showToast('Sign in to ask a question', 'info')}
            />
          </div>
        </div>

        {/* ── Related Products ─────────────────────────────────────────────────── */}
        <RelatedProductsSection currentId={l.id} category={l.category} />

        {/* ── Recently Viewed ──────────────────────────────────────────────────── */}
        <RecentlyViewedSection currentId={l.id} />

        {/* ── Comments (legacy, shown below tab content) ────────────────────────── */}
        <section className="mt-12 max-w-3xl" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="text-xl font-extrabold text-gray-900 uppercase tracking-wide mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-brand-600" aria-hidden="true" />
            Comments ({l.commentsCount})
          </h2>
          <CommentSection listingId={l.id} />
        </section>

      </main>

      {/* ── Sticky bar ──────────────────────────────────────────────────────────── */}
      <StickyBar
        listing={l}
        qty={qty}
        isSold={isSold}
        visible={stickyVisible}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        title={l.title}
        url={pageUrl}
      />
      <ReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        listingId={l.id}
      />
    </>
  );
}

// ── Comment Section (preserved from original) ─────────────────────────────────

function CommentSection({ listingId }: { listingId: string }) {
  const { comments, loadComments, addComment, isAuthenticated, showToast } = useStore();
  const [body, setBody] = useState('');
  const listingComments = comments.filter(c => c.listingId === listingId);

  useEffect(() => { loadComments(listingId); }, [listingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { showToast('Sign in to comment', 'info'); return; }
    if (!body.trim()) return;
    await addComment(listingId, body.trim());
    setBody('');
    track('comment_submitted', { listingId });
  }

  return (
    <div>
      <div className="space-y-4 mb-5">
        {listingComments.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4 text-center">No comments yet. Be the first to ask the seller a question!</p>
        )}
        {listingComments.map(c => (
          <div key={c.id} className="flex gap-3">
            <img src={c.author.avatar} alt={c.author.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" loading="lazy" />
            <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
              <div className="flex items-baseline gap-2 mb-1">
                <Link href={`/closet/${c.author.username}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                  @{c.author.username}
                </Link>
                <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {c.body.split(/(@\w+)/g).map((part, i) =>
                  part.startsWith('@')
                    ? <Link key={i} href={`/closet/${part.slice(1)}`} className="text-brand-600 font-medium hover:underline">{part}</Link>
                    : <span key={i}>{part}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isAuthenticated ? 'Ask the seller a question…' : 'Sign in to comment'}
          disabled={!isAuthenticated}
          rows={2}
          maxLength={500}
          aria-label="Comment input"
          className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
        />
        <button
          type="submit"
          disabled={!isAuthenticated || !body.trim()}
          className="px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex-shrink-0 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" aria-hidden="true" /> Post
        </button>
      </form>
    </div>
  );
}
