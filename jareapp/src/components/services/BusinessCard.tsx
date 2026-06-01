'use client';

import { useState } from 'react';
import { Phone, MapPin, Star, ShieldCheck, Crown, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { Business } from '@/lib/types';

interface BusinessCardProps {
  business: Business;
}

function StarRating({ sum, count }: { sum: number; count: number }) {
  if (count === 0) return <span className="text-xs text-gray-400">No reviews yet</span>;
  const avg  = sum / count;
  const full = Math.floor(avg);
  return (
    <div className="flex items-center gap-1" aria-label={`${avg.toFixed(1)} out of 5 stars, ${count} reviews`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < full ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
      <span className="text-xs text-gray-500 ml-0.5">{avg.toFixed(1)} ({count})</span>
    </div>
  );
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails = !!(business.address || business.description || business.phone || business.neighborhood?.name_en);

  return (
    <div className={clsx('card relative transition-shadow', business.is_premium && 'ring-1 ring-amber-300')}>
      {/* Premium badge */}
      {business.is_premium && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-amber-600
                        bg-amber-50 rounded-full px-2 py-0.5 text-xs font-semibold z-10">
          <Crown className="w-3 h-3" />
          Featured
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo / icon */}
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center
                          text-2xl flex-shrink-0 overflow-hidden">
            {business.logo_url
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
              : CATEGORY_ICONS[business.category] ?? '🏪'
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{business.name}</h3>
              {business.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" aria-label="Verified Business" />
              )}
            </div>

            <StarRating sum={business.rating_sum} count={business.rating_count} />

            <p className="text-xs text-gray-400 mt-0.5 capitalize">{business.category}</p>

            {/* Always-visible phone */}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1.5"
                aria-label={`Call ${business.name}`}
              >
                <Phone className="w-3 h-3" />
                {business.phone}
              </a>
            )}
          </div>
        </div>

        {/* Expand / collapse toggle */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 w-full flex items-center justify-between text-xs text-gray-400
                       hover:text-brand-600 transition-colors pt-2 border-t border-gray-100"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${business.name} details` : `Expand ${business.name} details`}
          >
            <span>{expanded ? 'Show less' : 'More details'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-100">
          {business.description && (
            <p className="text-xs text-gray-600 leading-relaxed">{business.description}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {business.address && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400" />
                {business.address}
              </span>
            )}
            {business.neighborhood && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <ExternalLink className="w-3 h-3 text-gray-400" />
                {business.neighborhood.name_en}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  food:       '🍽️',
  automotive: '🚗',
  cleaning:   '🧹',
  pharmacy:   '💊',
  education:  '📚',
  repair:     '🔧',
  salon:      '✂️',
  grocery:    '🛒',
};
