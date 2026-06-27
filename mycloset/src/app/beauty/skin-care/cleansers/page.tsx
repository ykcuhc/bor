'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const SUBCATEGORIES = [
  { label: 'Face Wash & Cleansers', image: 'https://picsum.photos/seed/cl-wash/600/400',    href: '/beauty/skin-care/cleansers/face-wash-cleansers' },
  { label: 'Scrubs & Exfoliators',  image: 'https://picsum.photos/seed/cl-scrubs/600/400',  href: '/beauty/skin-care/cleansers/scrubs-exfoliators'  },
  { label: 'Makeup Removers',       image: 'https://picsum.photos/seed/cl-removers/600/400', href: '/beauty/skin-care/cleansers/makeup-removers'     },
  { label: 'Face Wipes',            image: 'https://picsum.photos/seed/cl-wipes/600/400',   href: '/beauty/skin-care/cleansers/face-wipes'          },
  { label: 'Toners',                image: 'https://picsum.photos/seed/cl-toners/600/400',  href: '/beauty/skin-care/cleansers/toners'              },
  { label: 'Blotting Papers',       image: 'https://picsum.photos/seed/cl-blotting/600/400', href: '/beauty/skin-care/cleansers/blotting-papers'    },
];

export default function CleansersPage() {
  const { filteredListings, loadListings, setFilters } = useStore();

  useEffect(() => {
    loadListings();
    setFilters({ query: '', category: 'Beauty', sortBy: 'newest' });
  }, []);

  const listings = filteredListings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/beauty" className="hover:text-brand-600 transition-colors">Beauty</Link>
        <span>/</span>
        <Link href="/beauty/skin-care" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Skin Care
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Cleansers</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Cleansers</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Shop by category</p>
      </div>

      {/* Subcategory banners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {SUBCATEGORIES.map(cat => (
          <Link
            key={cat.label}
            href={cat.href}
            className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={cat.image}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <p className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide leading-tight">
                {cat.label}
              </p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                Shop <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* All Cleansers products */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">All Cleansers</h2>
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
