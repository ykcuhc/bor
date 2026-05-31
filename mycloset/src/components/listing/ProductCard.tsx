'use client';

import Link from 'next/link';
import { Heart, Share2, BadgeCheck } from 'lucide-react';
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

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/listings/${listing.id}`);
    showToast('Link copied!', 'success');
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
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
            <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Action buttons — appear on hover */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleLike}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all',
                isLiked
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:text-brand-600'
              )}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white text-gray-600 hover:text-brand-600 flex items-center justify-center shadow-md transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Card body ───────────────────────────────────────────────── */}
        <div className="p-3">
          {/* Seller */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <img
              src={listing.seller.avatar}
              alt={listing.seller.username}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs text-gray-500 font-medium truncate">
              @{listing.seller.username}
            </span>
            {listing.seller.isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 mb-1">
            {listing.title}
          </h3>

          {/* Brand + Size */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            {listing.brand && <span className="font-medium">{listing.brand}</span>}
            {listing.brand && listing.size && <span>·</span>}
            {listing.size && <span>Size {listing.size}</span>}
          </div>

          {/* Pricing row */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatKWD(listing.listingPrice)}
              </span>
              {listing.originalPrice > listing.listingPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {formatKWD(listing.originalPrice)}
                </span>
              )}
            </div>

            {/* Like count */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-brand-400 text-brand-400')} />
              <span>{listing.likesCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
