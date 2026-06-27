'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

export default function NailPolishRemoversPage() {
  const { filteredListings, loadListings, setFilters } = useStore();

  useEffect(() => {
    loadListings();
    setFilters({ query: '', category: 'Beauty', sortBy: 'newest' });
  }, []);

  const listings = filteredListings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/beauty" className="hover:text-brand-600 transition-colors">Beauty</Link>
        <span>/</span>
        <Link href="/beauty/nail-care" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Nail Care
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Nail Polish Removers</span>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Nail Polish Removers</h1>
      </div>
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">All Nail Polish Removers</h2>
          <span className="font-code text-xs text-gray-400 tracking-wide">{listings.length} items</span>
        </div>
        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-sm">No items found yet.</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {listings.map(listing => <ProductCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </div>
    </div>
  );
}
