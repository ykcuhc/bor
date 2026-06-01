'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BUSINESS_CATEGORIES } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

type Step = 'form' | 'success';

export default function NewBusinessPage() {
  const router      = useRouter();
  const { profile } = useAuth();

  const [step,        setStep]        = useState<Step>('form');
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [phone,       setPhone]       = useState('');
  const [address,     setAddress]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category) { setError('Please fill in name and category.'); return; }
    setError('');
    setSubmitting(true);

    if (IS_DEMO) {
      await new Promise(r => setTimeout(r, 800));
      setStep('success');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/businesses', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:            name.trim(),
          category,
          description:     description.trim() || null,
          phone:           phone.trim()        || null,
          address:         address.trim()      || null,
          neighborhood_id: profile?.neighborhood_id,
        }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? 'Failed to create listing');
      }
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing submitted!</h1>
          <p className="text-gray-500 text-sm mb-2">
            <strong>{name}</strong> has been submitted for review. It will appear in Local Services once approved.
          </p>
          {IS_DEMO && <p className="text-xs text-amber-600 mb-6">Demo mode — no real listing was created.</p>}
          <div className="flex gap-2 justify-center">
            <Link href="/services" className="btn-primary text-sm">View Services</Link>
            <button onClick={() => { setStep('form'); setName(''); setCategory(''); setDescription(''); setPhone(''); setAddress(''); }} className="btn-secondary text-sm">
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">List your business</h1>
          <p className="text-sm text-gray-500">
            Get discovered by neighbors in {profile?.neighborhood?.name_en ?? 'your area'}.
          </p>
          {IS_DEMO && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl inline-block px-3 py-1.5">
              Demo mode — submission is simulated
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Business name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Al-Rashid Pharmacy"
              className="input"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="select bg-white"
              required
            >
              <option value="">Select a category…</option>
              {BUSINESS_CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe your services…"
              className="input resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                Phone <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+965 XXXX XXXX"
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Address <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Block 5, Street 12"
                className="input"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting…' : 'Submit listing'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Listings are reviewed before appearing publicly. Premium listings get featured placement.
        </p>
      </div>
    </main>
  );
}
