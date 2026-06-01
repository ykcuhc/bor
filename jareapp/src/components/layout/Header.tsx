'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Bell, MessageSquare, Menu, X, MapPin } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { DUMMY_USERS } from '@/lib/data/dummy-data';

// For demo, we use the first dummy user as the "logged in" user.
// In production this comes from useAuth() → Supabase session.
const CURRENT_USER = DUMMY_USERS[0];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-brand-700 hidden sm:block">
              JareApp
            </span>
          </Link>

          {/* ── Search bar ───────────────────────────────────── */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search neighbors, businesses, posts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full
                           bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500
                           focus:border-transparent focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* ── Desktop nav icons ────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/messages"
              className="relative p-2 rounded-lg text-gray-600 hover:text-brand-600
                         hover:bg-brand-50 transition-colors"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {/* Unread badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </Link>

            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-gray-600 hover:text-brand-600
                         hover:bg-brand-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>

            {/* Profile avatar */}
            <Link href={`/profile/${CURRENT_USER.id}`} className="ml-1">
              <Avatar
                src={CURRENT_USER.avatar_url}
                name={CURRENT_USER.full_name}
                size="sm"
                className="ring-2 ring-transparent hover:ring-brand-400 transition-all cursor-pointer"
              />
            </Link>
          </nav>

          {/* ── Mobile hamburger ─────────────────────────────── */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          <MobileNavLink href="/"          label="Home Feed"      onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/neighborhood" label="Neighborhood"  onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/messages"  label="Messages"       onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/services"  label="Local Services" onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href={`/profile/${CURRENT_USER.id}`} label="My Profile" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700
                 hover:bg-brand-50 hover:text-brand-700 transition-colors"
    >
      {label}
    </Link>
  );
}
