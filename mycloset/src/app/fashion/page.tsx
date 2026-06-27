'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const SUBCATEGORY_BANNERS = [
  {
    label: 'Women',
    href: '/fashion/women',
    image: 'https://picsum.photos/seed/fashion-women/900/600',
    desc: 'Dresses, tops, abayas & more',
    gradient: 'from-rose-900/80 via-rose-800/50 to-transparent',
    accent: 'text-rose-300',
  },
  {
    label: 'Men',
    href: '/fashion/men',
    image: 'https://picsum.photos/seed/fashion-men/900/600',
    desc: 'Shirts, thobes, streetwear & more',
    gradient: 'from-brand-900/80 via-brand-800/50 to-transparent',
    accent: 'text-accent-300',
  },
  {
    label: 'Kids',
    href: '/fashion/kids',
    image: 'https://picsum.photos/seed/fashion-kids/900/600',
    desc: 'Clothing for boys, girls & babies',
    gradient: 'from-amber-900/80 via-amber-800/50 to-transparent',
    accent: 'text-amber-300',
  },
];

export default function FashionPage() {
  const { filteredListings, loadListings, setFilters } = useStore();

  useEffect(() => {
    loadListings();
    setFilters({ query: '', category: undefined, sortBy: 'newest' });
  }, []);

  const allListings = filteredListings().filter(
    l => l.category === 'Women' || l.category === 'Men' || l.category === 'Kids'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Page title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Fashion</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Browse by category or scroll to see all items</p>
      </div>

      {/* Subcategory banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUBCATEGORY_BANNERS.map(cat => (
          <Link
            key={cat.label}
            href={cat.href}
            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            style={{ aspectRatio: '3/4' }}
          >
            {/* Full-bleed image */}
            <img
              src={cat.image}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />

            {/* Strong bottom gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <p className="font-code text-xs text-white/60 uppercase tracking-widest mb-1">{cat.desc}</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight leading-none mb-4">
                {cat.label}
              </h2>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold rounded-full group-hover:bg-white group-hover:text-gray-900 transition-all duration-300">
                Shop Now <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* All products */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">All Fashion</h2>
          <span className="font-code text-xs text-gray-400 tracking-wide">{allListings.length} items</span>
        </div>

        {allListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No items found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {allListings.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
