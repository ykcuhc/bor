'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Star, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';
import type { Category } from '@/types';

const HERO_CATEGORIES: { label: string; emoji: string; category: Category; color: string }[] = [
  { label: 'Women',       emoji: '👗', category: 'Women',       color: 'bg-pink-50   hover:bg-pink-100   border-pink-100' },
  { label: 'Men',         emoji: '👔', category: 'Men',         color: 'bg-blue-50   hover:bg-blue-100   border-blue-100' },
  { label: 'Kids',        emoji: '🧸', category: 'Kids',        color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-100' },
  { label: 'Handbags',    emoji: '👜', category: 'Women',       color: 'bg-purple-50 hover:bg-purple-100 border-purple-100' },
  { label: 'Sneakers',    emoji: '👟', category: 'Men',         color: 'bg-green-50  hover:bg-green-100  border-green-100' },
  { label: 'Beauty',      emoji: '💄', category: 'Beauty',      color: 'bg-rose-50   hover:bg-rose-100   border-rose-100' },
  { label: 'Home',        emoji: '🏠', category: 'Home',        color: 'bg-orange-50 hover:bg-orange-100 border-orange-100' },
  { label: 'Electronics', emoji: '📱', category: 'Electronics', color: 'bg-slate-50  hover:bg-slate-100  border-slate-100' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: 'Buyer Protection', desc: 'Every purchase is covered by our guarantee' },
  { icon: Truck,       title: 'Fast Shipping',    desc: 'Speedy delivery across Kuwait' },
  { icon: Star,        title: 'Top Sellers',      desc: 'Verified sellers with 5-star ratings' },
  { icon: TrendingUp,  title: 'Best Prices',      desc: 'Negotiate directly with sellers' },
];

export default function HomePage() {
  const { filteredListings, loadListings, resetFilters, listingsLoaded } = useStore();

  useEffect(() => {
    resetFilters();
    loadListings();
  }, []);

  const allListings = filteredListings();
  const featured    = allListings.filter(l => l.status === 'available').slice(0, 10);
  const trending    = [...allListings].sort((a, b) => b.likesCount - a.likesCount).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 bg-white/10 px-3 py-1 rounded-full mb-5 uppercase tracking-widest">
              🇰🇼 Kuwait&apos;s #1 Fashion Marketplace
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Your Closet.<br />
              Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-100">
                Online Booth.
              </span>
            </h1>
            <p className="text-lg text-brand-100 leading-relaxed mb-8 max-w-xl">
              Buy and sell fashion, accessories, and lifestyle items from thousands of closets across Kuwait —
              no expensive expos, no middlemen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                Open My Closet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category pills ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto py-4">
            {HERO_CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={`/search?category=${cat.category}`}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-all flex-shrink-0 ${cat.color}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* ── Trending now ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Now</h2>
              <p className="text-sm text-gray-500 mt-1">The most-loved items this week</p>
            </div>
            <Link href="/search?sortBy=most_liked" className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trending.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        {/* ── Trust badges ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Just In feed ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Just In</h2>
              <p className="text-sm text-gray-500 mt-1">Fresh listings from across Kuwait</p>
            </div>
            <Link href="/search" className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featured.map(listing => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ready to sell?</h2>
          <p className="text-brand-100 text-lg mb-8 max-w-lg mx-auto">
            Turn your unwanted items into cash. List in minutes, reach thousands of buyers in Kuwait.
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg text-base"
          >
            Open Your Closet — It&apos;s Free <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
