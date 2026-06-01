'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

export default function LikesPage() {
  const { currentUser, listings, loadListings, isAuthenticated } = useStore();

  useEffect(() => {
    loadListings();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to see your likes</h2>
        <p className="text-gray-500 mb-6">Save your favourite items and come back to them anytime.</p>
        <Link href="/auth/login" className="px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  const likedIds = new Set(currentUser?.likedListings ?? []);
  const likedListings = listings.filter(l => likedIds.has(l.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Items You Like</h1>
        <p className="text-sm text-gray-500 mt-1">
          {likedListings.length} {likedListings.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {likedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No liked items yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Tap the heart on any listing to save it here.
          </p>
          <Link href="/search" className="px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {likedListings.map(listing => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
