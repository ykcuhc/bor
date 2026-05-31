'use client';

import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { calcEarnings, SHIPPING_FEE_KWD } from '@/lib/mockData';
import { cn, formatKWD } from '@/lib/utils';

export default function OfferModal() {
  const { isOfferModalOpen, closeOfferModal, activeOfferListingId, makeOffer, getListing, isAuthenticated } = useStore();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const listing = activeOfferListingId ? getListing(activeOfferListingId) : null;
  if (!isOfferModalOpen || !listing) return null;

  const offerAmount = parseFloat(amount);
  const isValid     = !isNaN(offerAmount) && offerAmount > 0 && offerAmount < listing.listingPrice;
  const minOffer    = Math.round(listing.listingPrice * 0.70 * 1000) / 1000; // min 70% of listing price

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    makeOffer(listing!.id, offerAmount, message || undefined);
    setAmount('');
    setMessage('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeOfferModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-brand-600">
            <Tag className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">Make an Offer</h2>
          </div>
          <button onClick={closeOfferModal} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing preview */}
        <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
          <img src={listing.images[0]} alt={listing.title} className="w-16 h-16 object-cover rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{listing.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{listing.brand} · Size {listing.size}</p>
            <p className="text-base font-bold text-gray-900 mt-1">{formatKWD(listing.listingPrice)}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Offer (KWD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">KD</span>
              <input
                type="number"
                step="0.001"
                min={minOffer}
                max={listing.listingPrice - 0.001}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`e.g. ${(listing.listingPrice * 0.85).toFixed(3)}`}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-gray-900
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Minimum offer: {formatKWD(minOffer)} · Listing price: {formatKWD(listing.listingPrice)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Message to Seller <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="E.g. Hi! I can pick up today in Salmiya if that works."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800
                         focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
            />
          </div>

          {/* Offer info notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
            ⏱ Offers expire after <strong>24 hours</strong>. The seller will be notified immediately.
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={cn(
              'w-full py-3.5 font-bold text-base rounded-xl transition-all',
              isValid
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isValid ? `Send Offer · ${parseFloat(amount).toFixed(3)} KWD` : 'Enter a Valid Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}
