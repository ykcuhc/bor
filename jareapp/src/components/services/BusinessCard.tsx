import { Phone, MapPin, Star, ShieldCheck, Crown } from 'lucide-react';
import type { Business } from '@/lib/types';

interface BusinessCardProps {
  business: Business;
}

function StarRating({ sum, count }: { sum: number; count: number }) {
  if (count === 0) return <span className="text-xs text-gray-400">No reviews yet</span>;
  const avg = sum / count;
  const full = Math.floor(avg);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < full ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-0.5">
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className={`card p-4 relative ${business.is_premium ? 'ring-1 ring-amber-300' : ''}`}>
      {/* Premium badge */}
      {business.is_premium && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-amber-600
                        bg-amber-50 rounded-full px-2 py-0.5 text-xs font-semibold">
          <Crown className="w-3 h-3" />
          Featured
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Logo placeholder */}
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center
                        text-2xl flex-shrink-0 overflow-hidden">
          {business.logo_url
            ? <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
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

          {business.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{business.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                <Phone className="w-3 h-3" />
                {business.phone}
              </a>
            )}
            {business.address && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                {business.address}
              </span>
            )}
          </div>
        </div>
      </div>
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
