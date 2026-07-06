'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'section-1',  label: '1. Introduction' },
  { id: 'section-2',  label: '2. Information We Collect' },
  { id: 'section-3',  label: '3. How We Use Your Information' },
  { id: 'section-4',  label: '4. Sharing of Information' },
  { id: 'section-5',  label: '5. Cookies & Tracking' },
  { id: 'section-6',  label: '6. Data Storage & Security' },
  { id: 'section-7',  label: '7. Data Retention' },
  { id: 'section-8',  label: '8. Your Rights' },
  { id: 'section-9',  label: '9. Children\'s Privacy' },
  { id: 'section-10', label: '10. Third-Party Links' },
  { id: 'section-11', label: '11. International Transfers' },
  { id: 'section-12', label: '12. Changes to This Policy' },
  { id: 'section-13', label: '13. Contact Us' },
];

export default function PrivacyToC() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
          <nav id="toc-list-mobile" aria-label="Privacy policy sections">
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
        aria-label="Privacy policy sections"
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
