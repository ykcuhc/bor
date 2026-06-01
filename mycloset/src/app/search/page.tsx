'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';
import FilterSidebar from '@/components/listing/FilterSidebar';
import type { Category } from '@/types';
import { SlidersHorizontal } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const { setFilters, filteredListings, loadListings } = useStore();

  // Sync URL params → store filters on mount and when params change
  useEffect(() => {
    const q        = searchParams.get('q')        || '';
    const category = searchParams.get('category') as Category | null;
    const sortBy   = searchParams.get('sortBy')   as 'newest' | 'price_asc' | 'price_desc' | 'most_liked' | null;

    setFilters({
      query:    q,
      category: category || undefined,
      sortBy:   sortBy   || 'newest',
    });
    loadListings();
  }, [searchParams]);

  const results = filteredListings();
  const query   = searchParams.get('q') || '';
  const cat     = searchParams.get('category') || '';

  const heading = query
    ? `Results for "${query}"`
    : cat
    ? cat
    : 'All Items';

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {results.length} {results.length === 1 ? 'item' : 'items'} found
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">👀</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 max-w-sm">
            Try adjusting your filters or search for something else.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map(listing => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <FilterSidebar className="w-56 flex-shrink-0" />

        {/* Results */}
        <Suspense fallback={
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
