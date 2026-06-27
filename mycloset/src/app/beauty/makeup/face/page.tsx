'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const SUBCATEGORIES = [
  { label: 'Face Primer',          image: 'https://picsum.photos/seed/fc-primer/600/400',    q: 'face+primer'           },
  { label: 'Highlighter',          image: 'https://picsum.photos/seed/fc-highlight/600/400', q: 'highlighter'           },
  { label: 'BB & CC Cream',        image: 'https://picsum.photos/seed/fc-bbcream/600/400',   q: 'bb+cc+cream'           },
  { label: 'Blush & Tint',         image: 'https://picsum.photos/seed/fc-blush/600/400',     q: 'blush+tint'            },
  { label: 'Bronzer',              image: 'https://picsum.photos/seed/fc-bronzer/600/400',   q: 'bronzer'               },
  { label: 'Contour',              image: 'https://picsum.photos/seed/fc-contour/600/400',   q: 'contour'               },
  { label: 'Color Corrector',      image: 'https://picsum.photos/seed/fc-corrector/600/400', q: 'color+corrector'       },
  { label: 'Setting Spray & Powder',image: 'https://picsum.photos/seed/fc-setting/600/400',  q: 'setting+spray+powder'  },
  { label: 'Loose Powder',         image: 'https://picsum.photos/seed/fc-loose/600/400',     q: 'loose+powder'          },
  { label: 'Compact Powder',       image: 'https://picsum.photos/seed/fc-compact/600/400',   q: 'compact+powder'        },
];

export default function MakeupFacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/beauty" className="hover:text-brand-600 transition-colors">Beauty</Link>
        <span>/</span>
        <Link href="/beauty/makeup" className="flex items-center gap-1 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Makeup
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Face</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Face</h1>
        <p className="font-code text-xs text-gray-400 mt-1 tracking-wide">Shop by category</p>
      </div>

      {/* Subcategory banners */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
