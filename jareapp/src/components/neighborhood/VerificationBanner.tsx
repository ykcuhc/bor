'use client';

import Link from 'next/link';
import { ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';
import type { VerificationStatus } from '@/lib/types';

interface VerificationBannerProps {
  status: VerificationStatus;
}

export default function VerificationBanner({ status }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (status === 'verified' || dismissed) return null;

  const isPending = status === 'pending';

  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm
      ${isPending
        ? 'bg-blue-50 border border-blue-200'
        : 'bg-amber-50 border border-amber-200'
      }`}
    >
      <ShieldAlert className={`w-4.5 h-4.5 flex-shrink-0 mt-0.5 ${isPending ? 'text-blue-500' : 'text-amber-500'}`} />
      <div className="flex-1">
        <p className={`font-semibold ${isPending ? 'text-blue-800' : 'text-amber-800'}`}>
          {isPending ? 'Verification in progress' : 'Verify your address'}
        </p>
        <p className={`text-xs mt-0.5 ${isPending ? 'text-blue-600' : 'text-amber-600'}`}>
          {isPending
            ? 'We received your request. You\'ll get full access within 24 hours.'
            : 'Verified neighbors get a ✓ badge and unlock governorate-wide posts.'}
        </p>
        {!isPending && (
          <Link
            href="/verify"
            className="inline-block mt-1.5 text-xs font-semibold text-amber-700 underline hover:text-amber-800"
          >
            Verify now →
          </Link>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 hover:bg-white/50 rounded"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  );
}
