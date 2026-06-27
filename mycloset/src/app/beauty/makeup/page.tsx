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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {SUBCATEGORIES.map(cat => (
          <Link
            key={cat.label}
            href={`/search?category=Beauty&q=${cat.q}`}
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
    </div>
  );
}
