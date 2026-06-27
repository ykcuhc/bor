'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const SUBCATEGORY_BANNERS = [
  {
    label: 'Women',
    href: '/search?category=Women',
    image: 'https://picsum.photos/seed/fashion-women/800/400',
    desc: 'Dresses, tops, abayas & more',
  },
  {
    label: 'Men',
    href: '/search?category=Men',
    image: 'https://picsum.photos/seed/fashion-men/800/400',
    desc: 'Shirts, thobes, streetwear & more',
  },
  {
    label: 'Kids',
    href: '/search?category=Kids',
    image: 'https://picsum.photos/seed/fashion-kids/800/400',
    desc: 'Clothing for boys, girls & babies',
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
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            style={{ aspectRatio: '4/3' }}
          >
            <img
              src={cat.image}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <p className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-wide">{cat.label}</p>
              <p className="font-code text-xs text-white/70 mt-0.5 tracking-wide">{cat.desc}</p>
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
