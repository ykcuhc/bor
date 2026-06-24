'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, Share2, Tag, ShoppingBag, ChevronLeft,
  ChevronRight, BadgeCheck, MapPin, Star, Eye,
  MessageCircle, Shield, Truck, RefreshCcw,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatKWD, formatRelativeTime, getDiscountPercent } from '@/lib/utils';
import { calcEarnings, SHIPPING_FEE_KWD } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types';

// ── Comment section ────────────────────────────────────────────────────────────

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
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-brand-600" />
        Comments ({listingComments.length})
      </h3>

      {/* Comment list */}
      <div className="space-y-4 mb-5">
        {listingComments.length === 0 && (
          <p className="text-sm text-gray-400 italic">No comments yet. Ask the seller a question!</p>
        )}
        {listingComments.map(c => (
          <div key={c.id} className="flex gap-3">
            <img src={c.author.avatar} alt={c.author.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-baseline gap-2 mb-1">
                <Link href={`/closet/${c.author.username}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                  @{c.author.username}
                </Link>
                <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {/* Render @mentions as links */}
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

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isAuthenticated ? 'Ask the seller a question or leave a comment...' : 'Sign in to comment'}
          disabled={!isAuthenticated}
          rows={2}
          maxLength={500}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none
                     focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                     disabled:bg-gray-50 disabled:text-gray-400 transition-all"
        />
        <button
          type="submit"
          disabled={!isAuthenticated || !body.trim()}
          className="px-5 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl
                     hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex-shrink-0"
        >
          Post
        </button>
      </form>
    </div>
  );
}

// ── Image gallery ──────────────────────────────────────────────────────────────

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
        <img src={images[activeIdx]} alt={title} className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(images.length - 1, i + 1))}
              disabled={activeIdx === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {activeIdx + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all',
                activeIdx === i ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img src={img} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main listing detail page ───────────────────────────────────────────────────

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getListing, toggleLike, openOfferModal, isAuthenticated, showToast, incrementViews, currentUser, loadListings, listingsLoaded } = useStore();
  const [localListing, setLocalListing] = useState<Listing | null>(null);
  const [fetchError, setFetchError]     = useState(false);

  // Load listing from store cache; if missing, fetch directly from Supabase
  useEffect(() => {
    const fromStore = getListing(id);
    if (fromStore) {
      setLocalListing(fromStore);
      incrementViews(id);
      return;
    }
    // Not in store yet — fetch directly
    import('@/lib/supabase/client').then(({ getSupabaseClient }) =>
      import('@/lib/supabase/queries').then(({ fetchListingById }) =>
        fetchListingById(getSupabaseClient(), id, currentUser?.id)
          .then(l => { if (l) { setLocalListing(l); incrementViews(id); } else setFetchError(true); })
          .catch(() => setFetchError(true))
      )
    );
  }, [id, listingsLoaded]);

  const listing = localListing ?? getListing(id);
  const isLiked = currentUser?.likedListings.includes(id) ?? listing?.isLikedByCurrentUser ?? false;

  if (!listing && !fetchError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (fetchError || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Listing not found</h2>
        <p className="text-gray-500 mb-6">This item may have been removed or sold.</p>
        <Link href="/" className="text-brand-600 font-semibold hover:underline">Back to Home</Link>
      </div>
    );
  }

  const discount  = getDiscountPercent(listing.originalPrice, listing.listingPrice);
  const { sellerEarnings } = calcEarnings(listing.listingPrice);
  const isSold    = listing.status === 'sold';

  function handleBuyNow() {
    if (!isAuthenticated) { showToast('Please sign in to purchase', 'info'); return; }
    if (isSold) { showToast('This item has already been sold', 'error'); return; }
    showToast('Redirecting to checkout...', 'success');
  }

  function handleOffer() {
    if (!isAuthenticated) { showToast('Please sign in to make an offer', 'info'); return; }
    if (isSold) { showToast('This item has already been sold', 'error'); return; }
    openOfferModal(id);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/search?category=${listing.category}`} className="hover:text-brand-600 transition-colors">{listing.category}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-48">{listing.title}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-2 gap-12">
        {/* Left — Images */}
        <ImageGallery images={listing.images} title={listing.title} />

        {/* Right — Details */}
        <div className="mt-8 lg:mt-0">
          {/* Title + Like/Share */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => isAuthenticated ? toggleLike(id) : showToast('Sign in to like items', 'info')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all',
                  isLiked
                    ? 'bg-brand-50 border-brand-200 text-brand-600'
                    : 'border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-600'
                )}
              >
                <Heart className={cn('w-4 h-4', isLiked && 'fill-brand-600')} />
                <span>{listing.likesCount}</span>
              </button>
              <button onClick={handleShare} className="p-2 rounded-full border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-all">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Brand + Size + Condition row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {listing.brand && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{listing.brand}</span>
            )}
            {listing.size && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Size {listing.size}</span>
            )}
            <span className={cn(
              'px-3 py-1 text-xs font-medium rounded-full',
              listing.condition === 'NWT'  ? 'bg-green-50  text-green-700'  :
              listing.condition === 'NWOT' ? 'bg-blue-50   text-blue-700'   :
              listing.condition === 'Excellent' ? 'bg-purple-50 text-purple-700' :
              'bg-gray-100 text-gray-700'
            )}>
              {listing.condition === 'NWT'  ? '✨ New With Tags'     :
               listing.condition === 'NWOT' ? '🏷️ New Without Tags' :
               listing.condition}
            </span>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-3 mb-6">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{formatKWD(listing.listingPrice)}</span>
            {listing.originalPrice > listing.listingPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatKWD(listing.originalPrice)}</span>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          {/* Sold badge */}
          {isSold && (
            <div className="mb-5 px-4 py-3 bg-gray-100 rounded-xl text-center">
              <span className="text-sm font-bold text-gray-700">This item has been sold</span>
            </div>
          )}

          {/* Action buttons */}
          {!isSold && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-brand-600 text-white font-bold text-base rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-5 h-5" /> Buy Now · {formatKWD(listing.listingPrice)}
              </button>
              <button
                onClick={handleOffer}
                className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-brand-600 text-brand-600 font-bold text-base rounded-xl hover:bg-brand-50 transition-colors"
              >
                <Tag className="w-5 h-5" /> Make Offer
              </button>
            </div>
          )}

          {/* Shipping + Earnings info */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span>Shipping: <strong className="text-gray-900">{formatKWD(SHIPPING_FEE_KWD)}</strong> flat rate</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>Protected by <strong className="text-gray-900">Miova Buyer Guarantee</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-gray-400" />
              <span>Returns accepted within 3 days if item differs from listing</span>
            </div>
          </div>

          {/* Seller card */}
          <Link href={`/closet/${listing.seller.username}`} className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors mb-6 group">
            <img src={listing.seller.avatar} alt={listing.seller.username} className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                  {listing.seller.displayName}
                </span>
                {listing.seller.isVerified && <BadgeCheck className="w-4 h-4 text-brand-500" />}
              </div>
              <p className="text-xs text-gray-500">@{listing.seller.username} · View Closet</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </Link>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Details table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Category',    listing.subCategory || listing.category],
                  ['Brand',       listing.brand       || 'Unbranded'],
                  ['Size',        listing.size        || 'One Size'],
                  ['Condition',   listing.condition],
                  ['Color',       listing.color.join(', ') || '—'],
                  ['Views',       listing.viewsCount.toString()],
                  ['Listed',      formatRelativeTime(listing.createdAt)],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2.5 text-gray-500 font-medium w-32">{label}</td>
                    <td className="px-4 py-2.5 text-gray-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/search?q=${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-brand-50 hover:text-brand-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="mt-12 max-w-2xl">
        <CommentSection listingId={id} />
      </div>
    </div>
  );
}
