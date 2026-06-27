'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const SUBCATEGORIES = [
  { label: 'Sneakers',            image: 'https://loremflickr.com/600/400/sneakers,shoes,fashion?lock=40',       q: 'sneakers'           },
  { label: 'Sports Shoes',        image: 'https://loremflickr.com/600/400/sport,athletic,shoes?lock=41',         q: 'sports shoes'       },
  { label: 'Sandals & Slides',    image: 'https://loremflickr.com/600/400/sandals,slides,summer?lock=42',        q: 'sandals'            },
  { label: 'Boots',               image: 'https://loremflickr.com/600/400/boots,leather,footwear?lock=43',       q: 'boots'              },
  { label: 'Traditional Footwear',image: 'https://loremflickr.com/600/400/traditional,sandals,arabic?lock=44',   q: 'traditional shoes'  },
  { label: 'Formal Shoes',        image: 'https://loremflickr.com/600/400/formal,shoes,leather,oxford?lock=45',  q: 'formal shoes'       },
  { label: 'Kids Shoes',          image: 'https://loremflickr.com/600/400/children,shoes,kids?lock=46',          q: 'kids shoes'         },
];

export default function FootwearPage() {
  const { filteredListings, loadListings, setFilters } = useStore();

  useEffect(() => {
    loadListings();
    setFilters({ query: 'shoes', category: undefined, sortBy: 'newest' });
  }, []);

  const listings = filteredListings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Footwear</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Shop by category</p>
      </div>

      {/* Subcategory banners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {SUBCATEGORIES.map(cat => (
          <Link
            key={cat.label}
            href={`/search?q=${encodeURIComponent(cat.q)}`}
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

      {/* All listings */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">All Footwear</h2>
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
