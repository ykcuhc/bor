'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const SUBCATEGORIES = [
  { label: 'T-Shirts',        image: 'https://loremflickr.com/600/400/tshirt,men,casual?lock=20',   q: 'tshirts'     },
  { label: 'Shirts',          image: 'https://loremflickr.com/600/400/shirt,men,fashion?lock=21',   q: 'shirts'      },
  { label: 'Pants & Jeans',   image: 'https://loremflickr.com/600/400/jeans,trousers,men?lock=22',  q: 'pants'       },
  { label: 'Shorts',          image: 'https://loremflickr.com/600/400/shorts,men,summer?lock=23',   q: 'shorts'      },
  { label: 'Activewear',      image: 'https://loremflickr.com/600/400/sport,gym,men?lock=24',       q: 'activewear'  },
  { label: 'Outerwear',       image: 'https://loremflickr.com/600/400/jacket,coat,men?lock=25',     q: 'outerwear'   },
  { label: 'Traditional Wear',image: 'https://loremflickr.com/600/400/thobe,arabic,traditional?lock=26',q: 'traditional'},
  { label: 'Socks',           image: 'https://loremflickr.com/600/400/socks,fashion,men?lock=27',   q: 'socks'       },
  { label: 'Suits',           image: 'https://loremflickr.com/600/400/suit,formal,business?lock=28',q: 'suits'       },
];

export default function MenFashionPage() {
  const { filteredListings, loadListings, setFilters } = useStore();

  useEffect(() => {
    loadListings();
    setFilters({ query: '', category: 'Men', sortBy: 'newest' });
  }, []);

  const listings = filteredListings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/fashion" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Fashion
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Men</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Men</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Shop by category</p>
      </div>

      {/* Subcategory banners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {SUBCATEGORIES.map(cat => (
          <Link
            key={cat.label}
            href={`/search?category=Men&q=${encodeURIComponent(cat.q)}`}
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

      {/* All Men products */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">All Men</h2>
          <span className="font-code text-xs text-gray-400 tracking-wide">{listings.length} items</span>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No items found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {listings.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
