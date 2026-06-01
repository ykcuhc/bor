'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Crown } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import BusinessCard from '@/components/services/BusinessCard';
import DemoModeBanner from '@/components/ui/DemoModeBanner';
import { BusinessCardSkeleton } from '@/components/ui/Skeleton';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAuth } from '@/context/AuthContext';
import { DUMMY_BUSINESSES, BUSINESS_CATEGORIES } from '@/lib/data/dummy-data';
import type { Business } from '@/lib/types';

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co';

export default function ServicesPage() {
  const { profile } = useAuth();
  const [searchQuery,     setSearchQuery]     = useState('');
  const [activeCategory,  setActiveCategory]  = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const neighborhoodId = profile?.neighborhood_id ?? 'nh-1';
  const governorateId  = profile?.governorate_id  ?? 'gov-2';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const { businesses: liveBusinesses, loading } = useBusinesses(
    neighborhoodId,
    governorateId,
    { category: activeCategory, search: debouncedSearch },
    IS_DEMO
  );

  // In demo mode apply filtering client-side on the static dummy data
  function getDemoBusinesses(): Business[] {
    let results = DUMMY_BUSINESSES;
    if (activeCategory !== 'all') results = results.filter(b => b.category === activeCategory);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      results = results.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => {
      if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
      const rA = a.rating_count > 0 ? a.rating_sum / a.rating_count : 0;
      const rB = b.rating_count > 0 ? b.rating_sum / b.rating_count : 0;
      return rB - rA;
    });
  }

  const businesses = IS_DEMO ? getDemoBusinesses() : liveBusinesses;
  const featured   = businesses.filter(b => b.is_premium);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 space-y-4">
          {IS_DEMO && <DemoModeBanner />}

          {/* ── Header card ──────────────────────────────────── */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Local Services</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Businesses trusted by your neighbors — recommended by the community.
                </p>
              </div>
              <Link href="/business/new" className="btn-primary text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Business
              </Link>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses and services…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9"
              />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {BUSINESS_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat.value
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300 bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Featured / Premium ───────────────────────────── */}
          {activeCategory === 'all' && !debouncedSearch && featured.length > 0 && (
            <div className="card p-4 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-sm text-amber-800">Featured Businesses</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {featured.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            </div>
          )}

          {/* ── All results ──────────────────────────────────── */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {loading ? 'Loading…' : (
                <>
                  {businesses.length} {businesses.length === 1 ? 'result' : 'results'}
                  {activeCategory !== 'all' && ` in ${BUSINESS_CATEGORIES.find(c => c.value === activeCategory)?.label}`}
                </>
              )}
            </p>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <BusinessCardSkeleton key={i} />)}
              </div>
            ) : businesses.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">🏪</p>
                <p className="font-semibold text-gray-700">No businesses found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to add a listing in this category!
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {businesses.map(b => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
