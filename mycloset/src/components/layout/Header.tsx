'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, Bell, Heart, ChevronDown,
  Menu, X, User, LogOut, Plus, Package, Settings,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { label: 'Women',       href: '/search?category=Women' },
  { label: 'Men',         href: '/search?category=Men' },
  { label: 'Kids',        href: '/search?category=Kids' },
  { label: 'Home',        href: '/search?category=Home' },
  { label: 'Beauty',      href: '/search?category=Beauty' },
  { label: 'Electronics', href: '/search?category=Electronics' },
];

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated, currentUser, logout,
    notificationCount, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu,
  } = useStore();

  const [searchQuery, setSearchQuery]     = useState('');
  const [isProfileOpen, setProfileOpen]   = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { closeMobileMenu(); }, [pathname]);

  // Close mobile menu when auth state changes (e.g. after login)
  useEffect(() => { closeMobileMenu(); }, [isAuthenticated]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    closeMobileMenu();
  }

  function handleLogout() {
    logout();
    setProfileOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* Promo banner */}
      <div className="bg-brand-600 text-white text-center text-xs py-1.5 font-medium tracking-wide px-4">
        🇰🇼 Free shipping on your first purchase &nbsp;·&nbsp; Shop thousands of closets across Kuwait
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">

          {/* Mobile hamburger — leftmost on mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex-shrink-0 p-2 -ml-1 text-gray-600 hover:text-brand-600 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-brand-600 tracking-tight whitespace-nowrap">
              MyCloset
            </span>
          </Link>

          {/* Desktop category nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
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
          <form onSubmit={handleSearch} className="flex-1 min-w-0 mx-2 lg:mx-4 lg:max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-full
                           focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </form>

          {/* Desktop-only right actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/sell"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Sell
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/notifications" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>

                <Link href="/likes" className="p-2 text-gray-600 hover:text-brand-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-expanded={isProfileOpen}
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
                    <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', isProfileOpen && 'rotate-180')} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">@{currentUser?.username}</p>
                      </div>
                      <Link href={`/closet/${currentUser?.username}`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <Package className="w-4 h-4 flex-shrink-0" /> My Closet
                      </Link>
                      <Link href="/sell" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <Plus className="w-4 h-4 flex-shrink-0" /> List an Item
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setProfileOpen(false)}>
                        <Settings className="w-4 h-4 flex-shrink-0" /> Account Settings
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2 transition-colors">
                  Log In
                </Link>
                <Link href="/auth/register" className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-full transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Sell pill (compact, always visible) */}
          <Link
            href="/sell"
            className="lg:hidden flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-full hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Sell
          </Link>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel — slides in from left */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 flex-shrink-0">
          <span className="text-lg font-bold text-brand-600">MyCloset</span>
          <button onClick={closeMobileMenu} className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {isAuthenticated && currentUser && (
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-100 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.displayName}</p>
                <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="px-3 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Categories</p>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={cat.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                onClick={closeMobileMenu}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="px-3 py-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Account</p>
              <Link href={`/closet/${currentUser?.username}`} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" onClick={closeMobileMenu}>
                <Package className="w-4 h-4 flex-shrink-0" /> My Closet
              </Link>
              <Link href="/notifications" className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" onClick={closeMobileMenu}>
                <Bell className="w-4 h-4 flex-shrink-0" />
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
              <Link href="/likes" className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" onClick={closeMobileMenu}>
                <Heart className="w-4 h-4 flex-shrink-0" /> Liked Items
              </Link>
              <Link href="/sell" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" onClick={closeMobileMenu}>
                <Plus className="w-4 h-4 flex-shrink-0" /> List an Item
              </Link>
            </div>
          ) : (
            <div className="px-4 py-4 border-t border-gray-100 space-y-3">
              <Link href="/auth/login" className="block w-full text-center py-2.5 border border-brand-600 text-brand-600 text-sm font-semibold rounded-full hover:bg-brand-50 transition-colors" onClick={closeMobileMenu}>
                Log In
              </Link>
              <Link href="/auth/register" className="block w-full text-center py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors" onClick={closeMobileMenu}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Sign out at bottom */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
