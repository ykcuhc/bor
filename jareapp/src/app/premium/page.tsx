'use client';

import { useState } from 'react';
import { Crown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PricingCard from '@/components/premium/PricingCard';
import { MEMBERSHIP_TIERS } from '@/lib/types/notifications';
import type { MembershipTier } from '@/lib/types/notifications';
import { useAuth } from '@/context/AuthContext';

export default function PremiumPage() {
  const { profile, isDemoMode } = useAuth();
  const currentTier: MembershipTier = (profile?.membership_tier as MembershipTier) ?? 'free';
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [toast, setToast] = useState('');

  function handleSelect(tier: MembershipTier) {
    if (tier === currentTier) return;
    setSelectedTier(tier);

    if (isDemoMode) {
      setToast(`Demo mode: would redirect to ${tier} checkout`);
      setTimeout(() => setToast(''), 3000);
      return;
    }

    // Payment integration not yet wired — inform user
    setToast('Payment coming soon — contact support to upgrade.');
    setTimeout(() => setToast(''), 4000);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to feed
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />
            Upgrade your neighborhood experience
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Choose your plan
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Get more from your community. Premium members enjoy enhanced visibility,
            advanced features, and exclusive neighborhood insights.
          </p>
          {isDemoMode && (
            <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl inline-block px-4 py-2">
              Demo mode — no real payments processed
            </p>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {MEMBERSHIP_TIERS.map(tier => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currentTier={currentTier}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl z-50">
            {toast}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map(item => (
              <div key={item.q} className="card p-4">
                <p className="font-semibold text-sm text-gray-900 mb-1">{item.q}</p>
                <p className="text-sm text-gray-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current plan indicator */}
        {currentTier !== 'free' && (
          <p className="text-center mt-8 text-sm text-gray-500">
            You are currently on the{' '}
            <span className="font-semibold text-brand-700 capitalize">{currentTier}</span> plan.
            {' '}Changes take effect on your next billing cycle.
          </p>
        )}
      </div>
    </main>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Can I cancel at any time?',
    a: 'Yes — cancel any time from your profile settings. You keep premium access until the end of the billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept KNET, Visa, and Mastercard. All payments are processed securely.',
  },
  {
    q: 'Is the Business plan only for registered businesses?',
    a: 'Any neighbor can subscribe to Business, but it\'s designed for shop owners and service providers who want maximum neighborhood visibility.',
  },
  {
    q: 'Do premium features apply to all neighborhoods?',
    a: 'Premium features are active in your registered neighborhood and, for governorate-wide posts, across sibling neighborhoods.',
  },
];
