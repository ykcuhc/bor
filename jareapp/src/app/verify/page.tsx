'use client';

import { useState } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, MapPin, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type Step = 'form' | 'success';
type VerificationMethod = 'postcard' | 'bill' | 'lease';

export default function VerifyPage() {
  const { profile, isDemoMode } = useAuth();
  const [step,    setStep]    = useState<Step>('form');
  const [method,  setMethod]  = useState<VerificationMethod>('postcard');
  const [address, setAddress] = useState('');
  const [block,   setBlock]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const neighborhoodName = profile?.neighborhood?.name_en ?? 'Your Neighborhood';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError('Please enter your street address.'); return; }
    setError('');
    setLoading(true);

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1200));
      setStep('success');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/profile/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address, block, method }),
      });
      if (!res.ok) throw new Error('Request failed — please try again.');
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request received!</h1>
          <p className="text-gray-500 mb-2">
            We&apos;ve recorded your verification request for{' '}
            <span className="font-semibold text-gray-700">{neighborhoodName}</span>.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You&apos;ll receive a confirmation and your verified badge within 24 hours.
          </p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to feed
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your address</h1>
          <p className="text-gray-500 text-sm">
            Verified neighbors get a <strong>✓ badge</strong> and can post
            governorate-wide. Verification is manual and takes up to 24 hours.
          </p>
          {isDemoMode && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl inline-block px-3 py-1.5">
              Demo mode — submission is simulated
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {/* Neighborhood display */}
          <div className="flex items-center gap-2 bg-brand-50 rounded-xl px-3 py-2.5 text-sm text-brand-700">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>Verifying membership in <strong>{neighborhoodName}</strong></span>
          </div>

          {/* Verification method */}
          <div>
            <label className="label">Verification method</label>
            <div className="space-y-2">
              {METHODS.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    method === m.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id as VerificationMethod)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="label">Street address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Block 12, Street 34, House 5"
              className="input"
              required
            />
          </div>

          {/* Block number */}
          <div>
            <label className="label">
              Block number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={block}
              onChange={e => setBlock(e.target.value)}
              placeholder="e.g. Block 12"
              className="input"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting…' : 'Submit verification request'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your address is only used for neighborhood verification and is never shown publicly.
        </p>
      </div>
    </main>
  );
}

const METHODS = [
  {
    id:          'postcard',
    label:       'Verification postcard',
    description: 'We mail a postcard to your address. Enter the code online to verify.',
  },
  {
    id:          'bill',
    label:       'Utility bill',
    description: 'Upload a recent utility bill (KAHRAMAA, Zain, etc.) showing your address.',
  },
  {
    id:          'lease',
    label:       'Lease / ownership document',
    description: 'Upload a scan of your rental contract or property title deed.',
  },
] as const;
