import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck, Sparkles, Store, Star,
  Globe, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Miova',
  description:
    'Learn about Miova — a next-generation digital marketplace built to simplify how people discover, compare, and purchase products from trusted vendors in Kuwait.',
  openGraph: {
    title: 'About Us — Miova',
    description:
      "Miova is Kuwait’s next-generation digital marketplace: fast, transparent, and built for customers and vendors alike.",
  },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    desc: 'We ensure clear pricing, verified vendors, and reliable transactions.',
  },
  {
    icon: Sparkles,
    title: 'Simplicity',
    desc: 'Shopping should be effortless, intuitive, and time-saving.',
  },
  {
    icon: Store,
    title: 'Support for Local Businesses',
    desc: 'We help small and growing vendors reach a wider audience.',
  },
  {
    icon: Star,
    title: 'Quality Experience',
    desc: 'From browsing to checkout, every step is designed for ease and satisfaction.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
            About Us
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-heading)] leading-tight">
            Miova
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-brand-100 leading-relaxed max-w-2xl mx-auto">
            A next-generation digital marketplace built to simplify how people discover, compare,
            and purchase products from trusted vendors in one seamless platform.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* ── Who we are ──────────────────────────────────────────────────── */}
        <section aria-labelledby="who-heading">
          <div className="max-w-2xl">
            <h2
              id="who-heading"
              className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)] mb-5"
            >
              Who We Are
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-7 text-[0.9375rem]">
              Founded with a vision to modernize online commerce in Kuwait, Miova bridges the gap
              between customers and businesses by offering a unified shopping experience that is
              fast, transparent, and reliable. Whether it&rsquo;s everyday essentials, lifestyle
              products, or specialty items, Miova brings everything together in one place.
            </p>
          </div>
        </section>

        {/* ── Mission ─────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="mission-heading"
          className="rounded-2xl bg-brand-600 text-white px-8 py-10 sm:px-12 sm:py-12"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-brand-200 mb-3">
            Our Mission
          </p>
          <h2
            id="mission-heading"
            className="sr-only"
          >
            Mission
          </h2>
          <p className="text-xl sm:text-2xl font-semibold font-[family-name:var(--font-heading)] leading-snug max-w-2xl">
            To empower both customers and vendors by creating a fair, efficient, and accessible
            digital marketplace that elevates the shopping experience while enabling business
            growth.
          </p>
        </section>

        {/* ── Values ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="values-heading">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">
            What We Stand For
          </p>
          <h2
            id="values-heading"
            className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)] mb-8"
          >
            Our Values
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Vision ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="vision-heading" className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">
            Our Vision
          </p>
          <h2
            id="vision-heading"
            className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)] mb-5"
          >
            Where We&rsquo;re Headed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-7 text-[0.9375rem]">
            To become the leading digital marketplace in the region, setting a new standard for
            how people shop and how businesses sell online.
          </p>
        </section>

        {/* ── Why Miova ───────────────────────────────────────────────────── */}
        <section aria-labelledby="why-heading">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">
              Why Miova?
            </p>
            <h2
              id="why-heading"
              className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)] mb-5"
            >
              A Smarter Way to Shop
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-7 text-[0.9375rem]">
              Traditional shopping platforms often feel fragmented and inefficient. Miova solves
              this by combining multiple vendors, categories, and services into one structured
              ecosystem — giving users control, clarity, and convenience.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { stat: 'One Platform',  label: 'Multiple vendors & categories, unified' },
              { stat: 'Kuwait',        label: 'Built for local needs, ready for the region' },
              { stat: 'Verified',      label: 'Trusted sellers and transparent pricing' },
            ].map(({ stat, label }) => (
              <div
                key={stat}
                className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 text-center"
              >
                <p className="text-xl font-bold text-brand-600 dark:text-brand-400 font-[family-name:var(--font-heading)] mb-1">
                  {stat}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section
          aria-label="Get started"
          className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm px-8 py-10 sm:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
              Ready to experience Miova?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Shop from verified vendors or open your own store today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
            >
              <Globe className="w-4 h-4" /> Open a Store
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
