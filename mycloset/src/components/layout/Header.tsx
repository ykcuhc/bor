'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ShoppingBag, Heart, Bell, ChevronDown,
  Menu, X, User, LogOut, Plus, Package, Settings,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { MOCK_NOTIFICATIONS } from '@/lib/mockData';

const CATEGORIES = [
  { label: 'Women',       href: '/search?category=Women' },
  { label: 'Men',         href: '/search?category=Men' },
  { label: 'Kids',        href: '/search?category=Kids' },
  { label: 'Home',        href: '/search?category=Home' },
  { label: 'Beauty',      href: '/search?category=Beauty' },
  { label: 'Electronics', href: '/search?category=Electronics' },
];

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout, notificationCount, isMobileMenuOpen, toggleMobileMenu } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleLogout() {
    logout();
    setProfileMenuOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* ── Promo banner ──────────────────────────────────────────────────── */}
      <div className="bg-brand-600 text-white text-center text-xs py-1.5 font-medium tracking-wide">
        🇰🇼 Free shipping on your first purchase &nbsp;·&nbsp; Shop thousands of closets across Kuwait
      </div>

      {/* ── Main nav ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-brand-600 tracking-tight">
              [MyCloset Logo]
            </span>
          </Link>

          {/* Category nav — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={cat.href}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 mx-4 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search brands, items, closets..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border border-transparent rounded-full
                           focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </form>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            {/* Sell button */}
            <Link
              href="/sell"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold
                         rounded-full hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Sell</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold
                                     rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>

                {/* Liked items */}
                <Link href="/likes" className="p-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-expanded={isProfileMenuOpen}
                  >
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-600" />
                      </div>
                    )}
                    <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', isProfileMenuOpen && 'rotate-180')} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{currentUser?.displayName}</p>
                        <p className="text-xs text-gray-500">@{currentUser?.username}</p>
                      </div>
                      <Link
                        href={`/closet/${currentUser?.username}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" /> My Closet
                      </Link>
                      <Link
                        href="/sell"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Plus className="w-4 h-4" /> List an Item
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" /> Account Settings
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-full transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-brand-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="px-4 py-3 space-y-1">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={cat.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                onClick={toggleMobileMenu}
              >
                {cat.label}
              </Link>
            ))}
            <Link
              href="/sell"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              onClick={toggleMobileMenu}
            >
              <Plus className="w-4 h-4" /> Sell on MyCloset
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
