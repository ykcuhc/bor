'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const SUBCATEGORIES = [
  {
    label: 'Face',
    image: 'https://picsum.photos/seed/mk-face/600/800',
    q: 'face+makeup',
    items: [
      'Foundation', 'Face Primer', 'Highlighter', 'BB & CC Cream',
      'Blush & Tint', 'Bronzer', 'Contour', 'Color Corrector',
      'Setting Spray & Powder', 'Loose Powder', 'Compact Powder',
    ],
  },
  {
    label: 'Eyes',
    image: 'https://picsum.photos/seed/mk-eyes/600/800',
    q: 'eye+makeup',
    items: ['Mascara', 'Eyebrows', 'Eyeliner', 'Eye Shadow', 'Eye Primer', 'Concealer'],
  },
  {
    label: 'Lips',
    image: 'https://picsum.photos/seed/mk-lips/600/800',
    q: 'lip+makeup',
    items: ['Lipsticks', 'Liquid Lipsticks', 'Lip Tint', 'Lip Liner', 'Lip Gloss', 'Lip Plumper'],
  },
  {
    label: 'Eyelashes',
    image: 'https://picsum.photos/seed/mk-lashes/600/800',
    q: 'eyelashes',
    items: [],
  },
  {
    label: 'Brushes & Accessories',
    image: 'https://picsum.photos/seed/mk-brushes/600/800',
    q: 'makeup+brushes',
    items: [
      'Face Brushes', 'Eye Brushes', 'Lip Brushes',
      'Sponges & Applicators', 'Brush Sets', 'Tools & Accessories',
    ],
  },
  {
    label: 'Makeup Palettes',
    image: 'https://picsum.photos/seed/mk-palettes/600/800',
    q: 'makeup+palettes',
    items: ['Face Palettes', 'Eye Palettes'],
  },
];

export default function MakeupPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/beauty" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Beauty
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Makeup</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Makeup</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Shop by category</p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
        {SUBCATEGORIES.map(cat => (
          <div
            key={cat.label}
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ aspectRatio: '3/4' }}
          >
            {/* Image */}
            <img
              src={cat.image}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Gradient — strong bottom to let text breathe */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/10" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2.5">

              {/* Sub-items */}
              {cat.items.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {cat.items.map(item => (
                    <Link
                      key={item}
                      href={`/search?category=Beauty&q=${encodeURIComponent(item)}`}
                      className="text-[10px] sm:text-[11px] text-white/55 hover:text-white transition-colors leading-tight"
                      onClick={e => e.stopPropagation()}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              )}

              {/* Category name + shop all */}
              <div>
                <p className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wide leading-tight">
                  {cat.label}
                </p>
                <Link
                  href={`/search?category=Beauty&q=${cat.q}`}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] sm:text-xs font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Shop all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
