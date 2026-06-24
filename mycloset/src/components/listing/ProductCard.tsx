'use client';

import Link from 'next/link';
import { Heart, BadgeCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Listing } from '@/types';
import { cn, formatKWD, getDiscountPercent } from '@/lib/utils';

interface ProductCardProps {
  listing: Listing;
  showSoldBadge?: boolean;
}

export default function ProductCard({ listing, showSoldBadge = true }: ProductCardProps) {
  const { toggleLike, isAuthenticated, showToast, currentUser } = useStore();
  const isLiked = currentUser?.likedListings.includes(listing.id) ?? listing.isLikedByCurrentUser;
  const discount = getDiscountPercent(listing.originalPrice, listing.listingPrice);

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Sign in to like items', 'info');
      return;
    }
    toggleLike(listing.id);
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-brand-100/40 hover:-translate-y-0.5 transition-all duration-200">
        {/* ── Image container ──────────────────────────────────────────── */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Sold overlay */}
          {listing.status === 'sold' && showSoldBadge && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Sold
              </span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && listing.status !== 'sold' && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}

          {/* Heart — always visible on mobile, hover on desktop */}
          <button
            onClick={handleLike}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all',
              isLiked
                ? 'bg-brand-600 text-white'
                : 'bg-white/90 text-gray-500 hover:text-brand-600 group-hover:opacity-100 opacity-0 sm:opacity-100'
            )}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
          </button>
        </div>

        {/* ── Card body ───────────────────────────────────────────────── */}
        <div className="p-3">
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
            {listing.title}
          </h3>

          {/* Brand */}
          {listing.brand && (
            <p className="text-xs text-gray-400 mb-2 truncate">{listing.brand}</p>
          )}

          {/* Pricing row */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-sm font-bold text-brand-900 whitespace-nowrap">
                {formatKWD(listing.listingPrice)}
              </span>
              {listing.originalPrice > listing.listingPrice && (
                <span className="text-xs text-gray-300 line-through whitespace-nowrap">
                  {formatKWD(listing.originalPrice)}
                </span>
              )}
            </div>
            {listing.seller.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent-600 bg-accent-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <BadgeCheck className="w-3 h-3 flex-shrink-0" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
