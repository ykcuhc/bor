'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, ShoppingBag, Shirt,
  Home, Monitor, Heart, Sparkles, ChevronLeft,
  ChevronRight, Wind, Star, Footprints, Gem, Store, BadgePercent,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/listing/ProductCard';
import { cn } from '@/lib/utils';

// ── Static data ────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    id: 1,
    headline: 'Everything Kuwait Loves.',
    accent: 'In One Place.',
    desc: 'Shop from verified stores and community sellers across fashion, electronics, beauty, home, and more.',
    cta1: { label: 'Shop Now', href: '/search' },
    cta2: { label: 'Start Selling', href: '/sell' },
    bg: 'from-brand-900 via-brand-800 to-brand-700',
    image: 'https://picsum.photos/seed/hero-fashion/600/400',
  },
  {
    id: 2,
    headline: 'Flash Deals.',
    accent: 'Up to 70% Off.',
    desc: "Limited-time offers from Kuwait's best verified stores. Grab them before they're gone.",
    cta1: { label: 'Shop Deals', href: '/search?sortBy=price_asc' },
    bg: 'from-red-900 via-red-800 to-accent-700',
    image: 'https://picsum.photos/seed/hero-deals/600/400',
  },
  {
    id: 3,
    headline: 'Open Your Store.',
    accent: 'Earn with Ease.',
    desc: 'Join thousands of sellers reaching buyers across Kuwait. Free to list, fast to sell.',
    cta1: { label: 'Start Selling', href: '/sell' },
    cta2: { label: 'Learn More', href: '/sell' },
    bg: 'from-purple-900 via-brand-800 to-brand-700',
    image: 'https://picsum.photos/seed/hero-sell/600/400',
  },
];

const CATEGORIES = [
  { label: 'Fashion',       icon: Shirt,         href: '/fashion',                     color: 'bg-pink-50    text-pink-500'   },
  { label: 'Footwear',      icon: Footprints,    href: '/footwear',                    color: 'bg-orange-50  text-orange-500' },
  { label: 'Beauty',        icon: Sparkles,      href: '/beauty',                      color: 'bg-rose-50    text-rose-500'   },
  { label: 'Fragrances',    icon: Wind,          href: '/fragrances',                  color: 'bg-purple-50  text-purple-500' },
  { label: 'Electronics',   icon: Monitor,       href: '/electronics',                 color: 'bg-blue-50    text-blue-500'   },
  { label: 'Home & Living', icon: Home,          href: '/home-living',                 color: 'bg-amber-50   text-amber-500'  },
  { label: 'Accessories',   icon: Gem,           href: '/accessories',                 color: 'bg-indigo-50  text-indigo-500' },
  { label: 'Shops',         icon: Store,         href: '/search',                      color: 'bg-teal-50    text-teal-500'   },
  { label: 'Deals',         icon: BadgePercent,  href: '/search?sortBy=price_asc',     color: 'bg-red-50     text-red-500'    },
];

const MOCK_STORES = [
  { id: 1, name: 'Lorem Store',    cover: 'https://picsum.photos/seed/store-a/320/140', logo: 'https://picsum.photos/seed/logo-a/60/60', products: 245  },
  { id: 2, name: 'Ipsum Boutique', cover: 'https://picsum.photos/seed/store-b/320/140', logo: 'https://picsum.photos/seed/logo-b/60/60', products: 312  },
  { id: 3, name: 'Dolor Shop',     cover: 'https://picsum.photos/seed/store-c/320/140', logo: 'https://picsum.photos/seed/logo-c/60/60', products: 1840 },
  { id: 4, name: 'Amet Market',    cover: 'https://picsum.photos/seed/store-d/320/140', logo: 'https://picsum.photos/seed/logo-d/60/60', products: 520  },
  { id: 5, name: 'Sit Fashion',    cover: 'https://picsum.photos/seed/store-e/320/140', logo: 'https://picsum.photos/seed/logo-e/60/60', products: 189  },
  { id: 6, name: 'Consectetur Co', cover: 'https://picsum.photos/seed/store-f/320/140', logo: 'https://picsum.photos/seed/logo-f/60/60', products: 421  },
];

const COLLECTIONS = [
  { title: 'Lorem Collection', image: 'https://picsum.photos/seed/coll-summer/600/300', href: '/search?q=summer',            items: '2.4K items' },
  { title: 'Ipsum Series',     image: 'https://picsum.photos/seed/coll-gaming/600/300', href: '/search?category=Electronics',items: '890 items'  },
  { title: 'Dolor Picks',      image: 'https://picsum.photos/seed/coll-luxury/600/300', href: '/search?q=perfume',           items: '340 items'  },
];

type JustAddedFilter = 'today' | 'week' | 'month';

// ── Countdown timer ────────────────────────────────────────────────────────────

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-bold ml-1">
      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded">{pad(h)}</span>
      <span className="text-red-500">:</span>
      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded">{pad(m)}</span>
      <span className="text-red-500">:</span>
      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded">{pad(s)}</span>
    </span>
  );
}

// ── Hero banner ────────────────────────────────────────────────────────────────

function HeroBanner() {
  const [cur, setCur] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCur(c => (c + 1) % HERO_SLIDES.length), 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  function go(idx: number) { setCur(idx); startTimer(); }

  const slide = HERO_SLIDES[cur];

  return (
    <section className="relative overflow-hidden select-none">
      <div className={cn('bg-gradient-to-r', slide.bg)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-[200px] sm:h-[260px] md:h-[300px] gap-6 lg:gap-10">

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1">
                {slide.headline}{' '}
                <span className="font-accent italic text-accent-300">{slide.accent}</span>
              </h1>
              <p className="text-white/70 text-sm sm:text-base mt-2 mb-5 max-w-md leading-relaxed line-clamp-2 hidden sm:block">
                {slide.desc}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link href={slide.cta1.href}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-brand-800 font-bold text-sm rounded-full hover:bg-brand-50 transition-colors shadow-sm">
                  {slide.cta1.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {slide.cta2 && (
                  <Link href={slide.cta2.href}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-white/40 text-white font-semibold text-sm rounded-full hover:bg-white/10 transition-colors">
                    {slide.cta2.label}
                  </Link>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="hidden sm:block flex-shrink-0 w-44 md:w-56 lg:w-72 h-36 sm:h-44 md:h-52 rounded-2xl overflow-hidden shadow-2xl">
              <img src={slide.image} alt="" className="w-full h-full object-cover" loading="eager" />
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button onClick={() => go((cur - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={() => go((cur + 1) % HERO_SLIDES.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={cn('h-1.5 rounded-full transition-all', i === cur ? 'w-6 bg-white' : 'w-1.5 bg-white/40')} />
        ))}
      </div>
    </section>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHead({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="font-code text-xs text-gray-400 mt-0.5 tracking-wide">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex-shrink-0 mt-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { filteredListings, loadListings, resetFilters, isAuthenticated } = useStore();
  const [justAddedFilter, setJustAddedFilter] = useState<JustAddedFilter>('week');
  const justAddedRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);
  const flashDealsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetFilters();
    loadListings();
  }, []);

  const all       = filteredListings();
  const available = all.filter(l => l.status === 'available');
  const bestSellers = [...available].sort((a, b) => b.likesCount - a.likesCount).slice(0, 10);
  const flashDeals  = available.filter(l => l.originalPrice > l.listingPrice).slice(0, 8);
  const justAdded   = [...available]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="bg-[#F8FAFC] pb-8">

      {/* ① Hero ──────────────────────────────────────────────────── */}
      <HeroBanner />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 pt-5">

        {/* ② Quick Categories ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1">
            {CATEGORIES.map(({ label, icon: Icon, href, color }) => (
              <Link key={label} href={href}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={cn('w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105', color)}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-600 group-hover:text-brand-600 text-center leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ③ Verified Stores ─────────────────────────────────────── */}
        <section>
          <SectionHead
            title="Shop From Verified Stores"
            subtitle="Trusted businesses verified by Miova."
            href="/search"
          />
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
            {MOCK_STORES.map(store => (
              <Link key={store.id} href="/search"
                className="flex-shrink-0 w-48 sm:w-56 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all snap-start group">
                <div className="h-20 overflow-hidden bg-gray-100">
                  <img src={store.cover} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-lg object-cover ring-2 ring-white shadow flex-shrink-0" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{store.name}</p>
                        <BadgeCheck className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-gray-400">{store.products.toLocaleString()} items</p>
                    </div>
                  </div>
                  <div className="w-full py-1.5 text-center text-[11px] font-semibold text-brand-600 border border-brand-200 rounded-full hover:bg-brand-50 transition-colors">
                    Visit Store
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ④ Flash Deals ─────────────────────────────────────────── */}
        {flashDeals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⚡</span> Flash Deals
                </h2>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  Ends in <CountdownTimer initialSeconds={28800} />
                </div>
              </div>
              <Link href="/search?sortBy=price_asc" className="flex-shrink-0 text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="relative">
              <button
                onClick={() => flashDealsRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            <div ref={flashDealsRef} className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
              {flashDeals.map(l => {
                const pct = Math.round(((l.originalPrice - l.listingPrice) / l.originalPrice) * 100);
                return (
                  <Link key={l.id} href={`/listings/${l.id}`}
                    className="flex-shrink-0 w-36 sm:w-44 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all snap-start group">
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{pct}%</span>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{l.title}</p>
                      <p className="text-sm font-bold text-red-500">KD {l.listingPrice.toFixed(3)}</p>
                      <p className="text-[10px] text-gray-400 line-through">KD {l.originalPrice.toFixed(3)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
              <button
                onClick={() => flashDealsRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </section>
        )}

        {/* ⑤ Trending Collections ────────────────────────────────── */}
        <section>
          <SectionHead title="Trending Collections" href="/search" />
          <div className="grid grid-cols-3 gap-2.5">
            {COLLECTIONS.map(col => (
              <Link key={col.title} href={col.href}
                className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '4/3' }}>
                <img src={col.image} alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm font-bold text-white leading-tight">{col.title}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">{col.items}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ⑦ Just Added ──────────────────────────────────────────── */}
        {justAdded.length > 0 && (
          <section>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 uppercase tracking-wide">Just Added</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Fresh listings from across Kuwait</p>
              </div>
              <Link href="/search" className="flex-shrink-0 mt-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-2 mb-4">
              {(['today', 'week', 'month'] as JustAddedFilter[]).map(f => (
                <button key={f} onClick={() => setJustAddedFilter(f)}
                  className={cn(
                    'px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full border transition-all',
                    justAddedFilter === f
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
                  )}>
                  {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
            <div className="relative">
              <button
                onClick={() => justAddedRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div ref={justAddedRef} className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
                {justAdded.map(l => (
                  <div key={l.id} className="flex-shrink-0 w-40 sm:w-48 snap-start">
                    <ProductCard listing={l} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => justAddedRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </section>
        )}

        {/* ⑧ Recommended For You (logged-in only) ───────────────── */}
        {isAuthenticated && bestSellers.length > 0 && (
          <section>
            <SectionHead
              title="Recommended For You"
              subtitle="Based on your browsing and wishlist activity"
              href="/search"
            />
            <div className="relative">
              <button
                onClick={() => recommendedRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div ref={recommendedRef} className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
                {bestSellers.slice(0, 10).map(l => (
                  <div key={`rec-${l.id}`} className="flex-shrink-0 w-40 sm:w-48 snap-start">
                    <ProductCard listing={l} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => recommendedRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </section>
        )}

        {/* ⑨ App Download ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 rounded-2xl p-6 sm:p-8">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-accent-500/10" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="text-center sm:text-left flex-1">
              <p className="text-accent-300 text-[10px] font-semibold uppercase tracking-widest mb-2">Mobile App</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
                Take Miova. Everywhere
              </h2>
              <p className="text-brand-200 text-sm mb-5 max-w-sm leading-relaxed">
                Shop, sell, and track orders on the go.<br />Available on iOS and Android.
              </p>
              <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
                <a href="#"
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div>
                    <p className="text-[9px] text-gray-400 leading-none">Download on the</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">App Store</p>
                  </div>
                </a>
                <a href="#"
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M3.18 23.82 14.64 12 3.18.18A2 2 0 0 0 2 2v20a2 2 0 0 0 1.18 1.82z" fill="#EA4335"/>
                    <path d="M20.5 10.5l-2.6-1.5-3.26 3 3.26 3 2.6-1.5A2 2 0 0 0 22 12a2 2 0 0 0-1.5-1.5z" fill="#FBBC05"/>
                    <path d="M14.64 12l-11.46 11.82c.34.12.7.18 1.07.18.47 0 .93-.13 1.33-.38l13.02-7.5L14.64 12z" fill="#34A853"/>
                    <path d="M14.64 12 18.6 8.07 5.58 1.38C5.18 1.13 4.72 1 4.25 1c-.37 0-.73.06-1.07.18L14.64 12z" fill="#4285F4"/>
                  </svg>
                  <div>
                    <p className="text-[9px] text-gray-400 leading-none">Get it on</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
            {/* Phone mockup */}
            <div className="hidden sm:flex gap-2 flex-shrink-0">
              <div className="w-28 h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                <img src="https://picsum.photos/seed/appscreen1/112/208" alt="" className="w-full h-full object-cover opacity-70" loading="lazy" />
              </div>
              <div className="w-28 h-52 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl mt-5">
                <img src="https://picsum.photos/seed/appscreen2/112/208" alt="" className="w-full h-full object-cover opacity-70" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
