'use client';

import { useState } from 'react';
import { Search, Plus, Crown } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import BusinessCard from '@/components/services/BusinessCard';
import { DUMMY_BUSINESSES, BUSINESS_CATEGORIES } from '@/lib/data/dummy-data';
import type { Business } from '@/lib/types';

export default function ServicesPage() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter businesses by category + search query
  // Premium businesses are sorted to the top within each filter result.
  function getFilteredBusinesses(): Business[] {
    let results = DUMMY_BUSINESSES;

    if (activeCategory !== 'all') {
      results = results.filter(b => b.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        b =>
          b.name.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    // Premium businesses first, then by rating
    return results.sort((a, b) => {
      if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
      const ratingA = a.rating_count > 0 ? a.rating_sum / a.rating_count : 0;
      const ratingB = b.rating_count > 0 ? b.rating_sum / b.rating_count : 0;
      return ratingB - ratingA;
    });
  }

  const businesses = getFilteredBusinesses();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 space-y-4">

          {/* ── Header ──────────────────────────────────────── */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Local Services</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Businesses and services in your neighborhood, recommended by neighbors.
                </p>
              </div>
              <button className="btn-primary text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add Business
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses, services…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9"
              />
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {BUSINESS_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat.value
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300 bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Premium spotlight ────────────────────────────── */}
          {activeCategory === 'all' && !searchQuery && (
            <div className="card p-4 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-sm text-amber-800">Featured Businesses</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {DUMMY_BUSINESSES.filter(b => b.is_premium).map(b => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            </div>
          )}

          {/* ── Business grid ────────────────────────────────── */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {businesses.length} {businesses.length === 1 ? 'result' : 'results'}
              {activeCategory !== 'all' && ` in ${BUSINESS_CATEGORIES.find(c => c.value === activeCategory)?.label}`}
            </p>

            {businesses.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">🏪</p>
                <p className="font-semibold text-gray-700">No businesses found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to add a business in this category!
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {businesses.map(b => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
