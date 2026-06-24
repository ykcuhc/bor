'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ShieldCheck, BadgeCheck, Package,
  ShoppingBag, Shirt, Baby, Watch, Home, Monitor,
  LayoutGrid, UserRound, Footprints, Tag, Users, Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';

const CATEGORIES = [
  { label: 'Women',       icon: UserRound,   href: '/search?category=Women' },
  { label: 'Men',         icon: Shirt,        href: '/search?category=Men' },
  { label: 'Kids',        icon: Baby,         href: '/search?category=Kids' },
  { label: 'Bags',        icon: ShoppingBag,  href: '/search?category=Women' },
  { label: 'Shoes',       icon: Footprints,   href: '/search' },
  { label: 'Watches',     icon: Watch,        href: '/search' },
  { label: 'Home',        icon: Home,         href: '/search?category=Home' },
  { label: 'Electronics', icon: Monitor,      href: '/search?category=Electronics' },
  { label: 'All',         icon: LayoutGrid,   href: '/search' },
];

const SELL_FEATURES = [
  { icon: Tag,    title: "It's free to list",  desc: 'No hidden fees' },
  { icon: Sparkles, title: 'Sell in minutes',  desc: 'Quick and easy listing' },
  { icon: Users,  title: 'Trusted community',  desc: 'Real people, real reviews' },
];

export default function HomePage() {
  const { filteredListings, loadListings, resetFilters } = useStore();

  useEffect(() => {
    resetFilters();
    loadListings();
  }, []);

  const allListings = filteredListings();
  const popular  = [...allListings].filter(l => l.status === 'available').sort((a, b) => b.likesCount - a.likesCount).slice(0, 10);
  const trending = popular.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                🇰🇼 Kuwait&apos;s Fashion Marketplace
              </span>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-brand-900 mb-6">
                My style.<br />
                My closet.<br />
                <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-accent-400 bg-clip-text text-transparent">
                  My way.
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
                Buy, sell, and discover pre-loved treasures from people like you.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-full hover:from-brand-700 hover:to-brand-800 transition-all shadow-lg shadow-brand-200"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-brand-600 text-brand-600 font-semibold rounded-full hover:bg-brand-50 transition-colors"
                >
                  Sell Your Items
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-500" /> Secure Payments
                </span>
                <span className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-accent-500" /> Verified Sellers
                </span>
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent-500" /> Easy Returns
                </span>
              </div>
            </div>

            {/* Right — decorative image panel */}
            <div className="relative hidden lg:flex items-center justify-center h-[420px]">
              {/* Gradient circles */}
              <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 opacity-70 top-10 right-10" />
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-accent-200 to-brand-200 opacity-50 bottom-8 left-8" />
              {/* Clothing rack photo */}
              <img
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=700&q=80&auto=format&fit=crop"
                alt="Fashion closet"
                className="relative z-10 w-[85%] h-[380px] object-cover rounded-3xl shadow-2xl shadow-brand-200/40"
              />
              {/* Floating card */}
              <div className="absolute bottom-12 -left-4 z-20 bg-white rounded-2xl shadow-xl px-5 py-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">New listing</p>
                <p className="text-sm font-bold text-brand-900">Gucci Marmont Bag</p>
                <p className="text-sm font-semibold text-accent-600 mt-0.5">KD 320.000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search + Category Strip ───────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Search */}
            <form
              onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim(); if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`; }}
              className="relative w-full sm:w-64 flex-shrink-0"
            >
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                name="q"
                type="search"
                placeholder="Search for items, brands, or keywords"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </form>

            {/* Category icons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
              {CATEGORIES.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-center gap-1.5 px-3.5 py-2 rounded-xl hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors flex-shrink-0 group"
                >
                  <Icon className="w-5 h-5 transition-colors" />
                  <span className="text-[11px] font-medium whitespace-nowrap">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* ── Popular Picks + Sell card ─────────────────────────── */}
        <section>
          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

            {/* Left: product grid */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Popular Picks</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Most-loved items this week</p>
                </div>
                <Link href="/search?sortBy=most_liked"
                  className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {trending.length > 0
                  ? trending.slice(0, 8).map(l => <ProductCard key={l.id} listing={l} />)
                  : Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
                        <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>

            {/* Right: Sell promo card */}
            <div className="lg:sticky lg:top-24 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-3xl p-7 text-white shadow-2xl shadow-brand-900/30 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -left-6 w-32 h-32 rounded-full bg-accent-500/10" />
              <div className="relative">
                <p className="text-xs font-semibold text-accent-300 uppercase tracking-widest mb-3">For Sellers</p>
                <h3 className="text-2xl font-extrabold leading-tight mb-3">
                  Sell in minutes.<br />
                  <span className="text-accent-300">Earn with ease.</span>
                </h3>
                <p className="text-sm text-brand-200 leading-relaxed mb-6">
                  Join thousands of sellers turning their closet into cash. List your first item for free.
                </p>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 w-full justify-center px-5 py-3 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-full transition-colors shadow-lg shadow-accent-900/30 text-sm mb-6"
                >
                  Start Selling <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="space-y-3 border-t border-white/10 pt-5">
                  {SELL_FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-accent-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="text-xs text-brand-300">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Just In ───────────────────────────────────────────── */}
        {allListings.length > 5 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Just In</h2>
                <p className="text-sm text-gray-400 mt-0.5">Fresh listings from across Kuwait</p>
              </div>
              <Link href="/search"
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allListings.filter(l => l.status === 'available').slice(0, 10).map(l => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ── Gradient CTA Banner ───────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-3xl p-10 md:p-14 text-white text-center shadow-2xl shadow-brand-900/20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-accent-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-brand-600/20 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ready to sell?</h2>
            <p className="text-brand-200 text-lg mb-8 max-w-lg mx-auto">
              Turn your unwanted items into cash. List in minutes, reach thousands of buyers in Kuwait.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg text-base"
            >
              Open Your Closet — It&apos;s Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
