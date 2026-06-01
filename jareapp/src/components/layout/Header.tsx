'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MessageSquare, Menu, X, MapPin, LogOut } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { profile, signOut, isDemoMode } = useAuth();
  const router = useRouter();
  const [searchQuery,    setSearchQuery]    = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen,setProfileMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const displayUser = profile;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-brand-700 hidden sm:block">JareApp</span>
          </Link>

          {/* ── Search ───────────────────────────────────────── */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search neighbors, businesses, posts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full
                           bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500
                           focus:border-transparent focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* ── Desktop nav ──────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/messages"
              className="relative p-2 rounded-lg text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              aria-label="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {isDemoMode && <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />}
            </Link>

            <NotificationBell />

            {/* Profile dropdown */}
            {displayUser && (
              <div className="relative ml-1">
                <button
                  onClick={() => setProfileMenuOpen(o => !o)}
                  className="focus:outline-none"
                  aria-label={`Open profile menu for ${displayUser.full_name}`}
                  aria-expanded={profileMenuOpen}
                >
                  <Avatar
                    src={displayUser.avatar_url}
                    name={displayUser.full_name}
                    size="sm"
                    className="ring-2 ring-transparent hover:ring-brand-400 transition-all cursor-pointer"
                  />
                </button>
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 z-30"
                    onMouseLeave={() => setProfileMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">{displayUser.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{displayUser.neighborhood?.name_en}</p>
                    </div>
                    <Link
                      href={`/profile/${displayUser.id}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => { setProfileMenuOpen(false); signOut(); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {isDemoMode ? 'Sign Out (Demo)' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!displayUser && (
              <Link href="/auth/login" className="btn-primary text-sm">Sign in</Link>
            )}
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

      {/* ── Mobile menu ──────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          <MobileNavLink href="/"              label="Home Feed"      onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/neighborhood"  label="Neighborhood"   onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/messages"      label="Messages"       onClick={() => setMobileMenuOpen(false)} />
          <MobileNavLink href="/services"      label="Local Services" onClick={() => setMobileMenuOpen(false)} />
          {displayUser && (
            <MobileNavLink href={`/profile/${displayUser.id}`} label="My Profile" onClick={() => setMobileMenuOpen(false)} />
          )}
          {displayUser ? (
            <button
              onClick={() => { setMobileMenuOpen(false); signOut(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <MobileNavLink href="/auth/login" label="Sign In" onClick={() => setMobileMenuOpen(false)} />
          )}
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
