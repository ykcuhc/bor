'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, Bell, Heart, ChevronDown, MessageCircle,
  Menu, X, User, LogOut, Plus, Package, Settings, LayoutGrid,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

const NAV_LINKS = [
  { label: 'Home',  href: '/' },
  { label: 'Women', href: '/search?category=Women' },
  { label: 'Men',   href: '/search?category=Men' },
  { label: 'Kids',  href: '/search?category=Kids' },
  { label: 'Shops', href: '/search' },
  { label: 'Deals', href: '/search?sortBy=price_asc' },
];

const MOBILE_CATEGORIES = [
  { label: 'Home',  href: '/' },
  { label: 'Women', href: '/search?category=Women' },
  { label: 'Men',   href: '/search?category=Men' },
  { label: 'Kids',  href: '/search?category=Kids' },
  { label: 'Shops', href: '/search' },
  { label: 'Deals', href: '/search?sortBy=price_asc' },
];

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated, currentUser, logout,
    notificationCount, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu,
  } = useStore();

  const [searchQuery, setSearchQuery]   = useState('');
  const [isProfileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => { closeMobileMenu(); }, [pathname]);
  useEffect(() => { closeMobileMenu(); }, [isAuthenticated]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Mobile hamburger */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex-shrink-0 p-2 -ml-1 text-gray-600 hover:text-brand-600 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden lg:block w-56 xl:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items, brands…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full
                           focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </form>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            <Link
              href="/sell"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 px-3 py-2 transition-colors"
            >
              Sell on Miova.
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/likes" className="p-2 text-gray-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-gray-50">
                  <Heart className="w-5 h-5" />
                </Link>

                <button className="p-2 text-gray-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-gray-50">
                  <MessageCircle className="w-5 h-5" />
                </button>

                <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-brand-600 transition-colors rounded-lg hover:bg-gray-50">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative ml-1">
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-expanded={isProfileOpen}
                  >
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', isProfileOpen && 'rotate-180')} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">@{currentUser?.username}</p>
                      </div>
                      <Link href={`/closet/${currentUser?.username}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="w-4 h-4 text-gray-400 flex-shrink-0" /> My Closet
                      </Link>
                      <Link href="/sell" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" /> List an Item
                      </Link>
                      <Link href="/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" /> Settings
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand-600 px-3 py-2 transition-colors">
                  Log In
                </Link>
                <Link href="/auth/register"
                  className="text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 px-5 py-2 rounded-full transition-all shadow-sm shadow-brand-200">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: compact sell + search */}
          <form onSubmit={handleSearch} className="lg:hidden flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 border border-transparent rounded-full
                           focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
          </form>

          <Link
            href="/sell"
            className="lg:hidden flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-xs font-semibold rounded-full hover:from-brand-700 hover:to-brand-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Sell
          </Link>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeMobileMenu} aria-hidden="true" />
      )}

      {/* Mobile slide-in panel */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
          <Logo />
          <button onClick={closeMobileMenu} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isAuthenticated && currentUser && (
            <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-100 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.displayName}</p>
                <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
              </div>
            </div>
          )}

          <div className="px-3 py-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Categories</p>
            {MOBILE_CATEGORIES.map(cat => (
              <Link key={cat.label} href={cat.href} onClick={closeMobileMenu}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                {cat.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="px-3 py-3 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Account</p>
              <Link href={`/closet/${currentUser?.username}`} onClick={closeMobileMenu}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                <Package className="w-4 h-4 text-gray-400 flex-shrink-0" /> My Closet
              </Link>
              <Link href="/notifications" onClick={closeMobileMenu}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
              <Link href="/likes" onClick={closeMobileMenu}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                <Heart className="w-4 h-4 text-gray-400 flex-shrink-0" /> Liked Items
              </Link>
              <Link href="/sell" onClick={closeMobileMenu}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                <Plus className="w-4 h-4 flex-shrink-0" /> List an Item
              </Link>
            </div>
          ) : (
            <div className="px-4 py-4 border-t border-gray-100 space-y-3">
              <Link href="/auth/login" onClick={closeMobileMenu}
                className="block w-full text-center py-2.5 border border-brand-600 text-brand-600 text-sm font-semibold rounded-full hover:bg-brand-50 transition-colors">
                Log In
              </Link>
              <Link href="/auth/register" onClick={closeMobileMenu}
                className="block w-full text-center py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-semibold rounded-full hover:from-brand-700 hover:to-brand-800 transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-4 h-4 flex-shrink-0" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
