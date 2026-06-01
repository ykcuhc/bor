import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { MembershipTier, PricingFeature } from '@/lib/types/notifications';
import { MEMBERSHIP_TIERS, PRICING_FEATURES } from '@/lib/types/notifications';

interface PricingCardProps {
  tier:          (typeof MEMBERSHIP_TIERS)[number];
  currentTier?:  MembershipTier;
  onSelect:      (tier: MembershipTier) => void;
}

export default function PricingCard({ tier, currentTier = 'free', onSelect }: PricingCardProps) {
  const isCurrentTier = currentTier === tier.id;
  const isFree        = tier.id === 'free';

  return (
    <div
      className={clsx(
        'card p-6 flex flex-col relative border-2 transition-all',
        tier.color,
        (tier as { highlight?: boolean }).highlight && 'shadow-lg scale-[1.02]'
      )}
    >
      {(tier as { highlight?: boolean }).highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white
                        text-xs font-bold px-3 py-0.5 rounded-full shadow">
          Most Popular
        </div>
      )}

      {/* Tier header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {tier.badge && <span className="text-2xl">{tier.badge}</span>}
          <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          {isFree ? (
            <span className="text-3xl font-extrabold text-gray-900">Free</span>
          ) : (
            <>
              <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
              <span className="text-gray-500 text-sm">KD / {tier.period}</span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-500">{tier.description}</p>
      </div>

      {/* CTA button */}
      <button
        disabled={isCurrentTier}
        onClick={() => onSelect(tier.id)}
        className={clsx(
          'w-full py-2.5 rounded-xl font-semibold text-sm transition-colors mb-6',
          isCurrentTier
            ? 'bg-gray-100 text-gray-400 cursor-default'
            : (tier as { highlight?: boolean }).highlight
            ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
            : tier.id === 'business'
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'btn-secondary'
        )}
      >
        {isCurrentTier ? 'Current plan ✓' : tier.cta}
      </button>

      {/* Feature list */}
      <div className="space-y-2.5 flex-1">
        {PRICING_FEATURES.map(f => {
          const val = f[tier.id as keyof PricingFeature];
          const on  = val !== false;
          return (
            <div key={f.label} className="flex items-start gap-2.5 text-sm">
              {on ? (
                <Check className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <span className={on ? 'text-gray-800' : 'text-gray-400'}>
                {f.label}
                {typeof val === 'string' && (
                  <span className="ml-1 font-medium text-brand-700">({val})</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
