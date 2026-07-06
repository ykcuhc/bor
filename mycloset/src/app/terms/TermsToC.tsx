'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'section-1',  label: '1. Introduction' },
  { id: 'section-2',  label: '2. Definitions' },
  { id: 'section-3',  label: '3. Acceptance of Terms' },
  { id: 'section-4',  label: '4. Eligibility & Account Registration' },
  { id: 'section-5',  label: '5. User Responsibilities' },
  { id: 'section-6',  label: '6. Vendor Responsibilities' },
  { id: 'section-7',  label: '7. Marketplace Role' },
  { id: 'section-8',  label: '8. Product Listings & Accuracy' },
  { id: 'section-9',  label: '9. Orders, Payments & Transactions' },
  { id: 'section-10', label: '10. Fees & Commissions' },
  { id: 'section-11', label: '11. Shipping & Delivery' },
  { id: 'section-12', label: '12. Returns, Refunds & Cancellations' },
  { id: 'section-13', label: '13. Reviews & User Content' },
  { id: 'section-14', label: '14. Prohibited Activities & Items' },
  { id: 'section-15', label: '15. Intellectual Property' },
  { id: 'section-16', label: '16. Privacy & Data Usage' },
  { id: 'section-17', label: '17. Account Suspension & Termination' },
  { id: 'section-18', label: '18. Limitation of Liability' },
  { id: 'section-19', label: '19. Indemnification' },
  { id: 'section-20', label: '20. Dispute Resolution' },
  { id: 'section-21', label: '21. Governing Law' },
  { id: 'section-22', label: '22. Changes to Terms' },
  { id: 'section-23', label: '23. Miscellaneous' },
];

export default function TermsToC() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-8% 0% -80% 0%', threshold: 0 },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const linkCls = (id: string) =>
    cn(
      'block py-1 pl-3 text-sm border-l-2 transition-colors',
      id === activeId
        ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-medium'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600',
    );

  return (
    <>
      {/* ── Mobile collapsible ─────────────────────────────────────────────── */}
      <div className="lg:hidden mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="toc-list-mobile"
          onClick={() => setMobileOpen(v => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200"
        >
          <span>Table of Contents</span>
          {mobileOpen
            ? <ChevronUp className="w-4 h-4 text-gray-500" />
            : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {mobileOpen && (
          <nav id="toc-list-mobile" aria-label="Terms sections">
            <ul className="px-5 pb-4 space-y-0.5">
              {SECTIONS.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* ── Desktop sticky sidebar ─────────────────────────────────────────── */}
      <nav
        aria-label="Terms sections"
        className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scrollbar-thin"
      >
        <p className="mb-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Contents
        </p>
        <ul className="space-y-0.5">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} className={linkCls(id)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
