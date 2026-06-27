'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, Bell, Heart, ChevronDown, MessageCircle,
  Menu, X, User, LogOut, Plus, Package, Settings,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

const NAV_LINKS = [
  { label: 'Home',  href: '/' },
  { label: 'Women', href: '/search?category=Women', megaMenu: 'women' },
  { label: 'Men',   href: '/search?category=Men',   megaMenu: 'men'   },
  { label: 'Kids',  href: '/search?category=Kids',  megaMenu: 'kids'  },
  { label: 'Shops', href: '/search' },
  { label: 'Deals', href: '/search?sortBy=price_asc' },
];

const WOMEN_MEGA_MENU = [
  {
    title: 'Fashion',
    href: '/fashion/women',
    items: [
      { label: 'Dresses',       href: '/search?category=Women&q=dresses'    },
      { label: 'Tops & Blouses',href: '/search?category=Women&q=tops'       },
      { label: 'Pants & Jeans', href: '/search?category=Women&q=pants'      },
      { label: 'Skirts',        href: '/search?category=Women&q=skirts'     },
      { label: 'Activewear',    href: '/search?category=Women&q=activewear' },
      { label: 'Abayas',        href: '/search?category=Women&q=abayas'     },
      { label: 'Outerwear',     href: '/search?category=Women&q=outerwear'  },
      { label: 'Pajamas',       href: '/search?category=Women&q=pajamas'    },
      { label: 'Swimwear',      href: '/search?category=Women&q=swimwear'   },
    ],
  },
  {
    title: 'Beauty',
    href: '/beauty',
    items: [
      { label: 'Makeup',             href: '/search?category=Beauty&q=makeup'       },
      { label: 'Skin Care',          href: '/search?category=Beauty&q=skin+care'    },
      { label: 'Hair Care',          href: '/search?category=Beauty&q=hair+care'    },
      { label: 'Body Care',          href: '/search?category=Beauty&q=body+care'    },
      { label: 'Nail Care',          href: '/search?category=Beauty&q=nail+care'    },
      { label: 'Tools & Accessories',href: '/search?category=Beauty&q=beauty+tools' },
    ],
  },
  {
    title: 'Footwear',
    href: '/footwear',
    items: [
      { label: 'Sneakers',            href: '/search?q=sneakers'         },
      { label: 'Sports Shoes',        href: '/search?q=sports+shoes'     },
      { label: 'Sandals & Slides',    href: '/search?q=sandals'          },
      { label: 'Boots',               href: '/search?q=boots'            },
      { label: 'Traditional Footwear',href: '/search?q=traditional+shoes'},
      { label: 'Formal Shoes',        href: '/search?q=formal+shoes'     },
    ],
  },
  {
    title: 'Accessories',
    href: '/accessories',
    items: [
      { label: 'Watches',       href: '/search?q=watches'    },
      { label: 'Jewelry',       href: '/search?q=jewelry'    },
      { label: 'Bags & Wallets',href: '/search?q=bags'       },
      { label: 'Sunglasses',    href: '/search?q=sunglasses' },
      { label: 'Belts',         href: '/search?q=belts'      },
      { label: 'Hats & Caps',   href: '/search?q=hats'       },
    ],
  },
  {
    title: 'Fragrances',
    href: '/fragrances',
    items: [
      { label: 'Luxury Fragrances',href: '/search?q=luxury+perfume'        },
      { label: 'Arabic Oud',       href: '/search?q=oud'                   },
      { label: 'Body Mists',       href: '/search?q=body+mist'             },
      { label: 'Gift Sets',        href: '/search?q=fragrance+gift+set'    },
    ],
  },
];

const MEN_MEGA_MENU = [
  {
    title: 'Fashion',
    href: '/fashion/men',
    items: [
      { label: 'T-Shirts',        href: '/search?category=Men&q=tshirts'     },
      { label: 'Shirts',          href: '/search?category=Men&q=shirts'      },
      { label: 'Pants & Jeans',   href: '/search?category=Men&q=pants'       },
      { label: 'Shorts',          href: '/search?category=Men&q=shorts'      },
      { label: 'Activewear',      href: '/search?category=Men&q=activewear'  },
      { label: 'Outerwear',       href: '/search?category=Men&q=outerwear'   },
      { label: 'Traditional Wear',href: '/search?category=Men&q=traditional' },
      { label: 'Socks',           href: '/search?category=Men&q=socks'       },
      { label: 'Suits',           href: '/search?category=Men&q=suits'       },
    ],
  },
  {
    title: 'Footwear',
    href: '/footwear',
    items: [
      { label: 'Sneakers',            href: '/search?q=sneakers'          },
      { label: 'Sports Shoes',        href: '/search?q=sports+shoes'      },
      { label: 'Sandals & Slides',    href: '/search?q=sandals'           },
      { label: 'Boots',               href: '/search?q=boots'             },
      { label: 'Traditional Footwear',href: '/search?q=traditional+shoes' },
      { label: 'Formal Shoes',        href: '/search?q=formal+shoes'      },
    ],
  },
  {
    title: 'Accessories',
    href: '/accessories',
    items: [
      { label: 'Watches',       href: '/search?q=watches'    },
      { label: 'Bags & Wallets',href: '/search?q=bags'       },
      { label: 'Sunglasses',    href: '/search?q=sunglasses' },
      { label: 'Belts',         href: '/search?q=belts'      },
      { label: 'Hats & Caps',   href: '/search?q=hats'       },
    ],
  },
  {
    title: 'Fragrances',
    href: '/fragrances',
    items: [
      { label: 'Luxury Fragrances',href: '/search?q=luxury+perfume'     },
      { label: 'Arabic Oud',       href: '/search?q=oud'                },
      { label: 'Bukhour',          href: '/search?q=bukhour'            },
      { label: 'Body Mists',       href: '/search?q=body+mist'          },
      { label: 'Gift Sets',        href: '/search?q=fragrance+gift+set' },
    ],
  },
  {
    title: 'Grooming',
    href: '/beauty',
    items: [
      { label: "Men's Grooming",    href: '/search?category=Beauty&q=grooming'      },
      { label: 'Skin Care',         href: '/search?category=Beauty&q=skin+care'     },
      { label: 'Hair Care',         href: '/search?category=Beauty&q=hair+care'     },
      { label: 'Body Care',         href: '/search?category=Beauty&q=body+care'     },
      { label: 'Tools & Accessories',href: '/search?category=Beauty&q=beauty+tools' },
    ],
  },
];

const KIDS_MEGA_MENU = [
  {
    title: 'Boys',
    href: '/search?category=Kids&q=boys',
    items: [
      { label: 'Boys Clothing', href: '/search?category=Kids&q=boys'       },
      { label: 'Activewear',    href: '/search?category=Kids&q=activewear' },
      { label: 'Outerwear',     href: '/search?category=Kids&q=outerwear'  },
      { label: 'School Wear',   href: '/search?category=Kids&q=school'     },
    ],
  },
  {
    title: 'Girls',
    href: '/search?category=Kids&q=girls',
    items: [
      { label: 'Girls Clothing', href: '/search?category=Kids&q=girls'      },
      { label: 'Dresses',        href: '/search?category=Kids&q=dresses'    },
      { label: 'Activewear',     href: '/search?category=Kids&q=activewear' },
      { label: 'School Wear',    href: '/search?category=Kids&q=school'     },
    ],
  },
  {
    title: 'Baby',
    href: '/search?category=Kids&q=baby',
    items: [
      { label: 'Baby Clothing', href: '/search?category=Kids&q=baby'      },
      { label: 'Bodysuits',     href: '/search?category=Kids&q=bodysuits' },
      { label: 'Sleepwear',     href: '/search?category=Kids&q=sleepwear' },
    ],
  },
  {
    title: 'Footwear',
    href: '/footwear',
    items: [
      { label: 'Kids Shoes',   href: '/search?q=kids+shoes'    },
      { label: 'Sneakers',     href: '/search?q=kids+sneakers' },
      { label: 'School Shoes', href: '/search?q=school+shoes'  },
      { label: 'Sandals',      href: '/search?q=kids+sandals'  },
    ],
  },
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
  const [activeMenu, setActiveMenu]     = useState<string | null>(null);
  const profileRef  = useRef<HTMLDivElement>(null);
  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function openMenu(name: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(name);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 150);
  }

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
              link.megaMenu ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => openMenu(link.megaMenu!)}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-0.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
                      activeMenu === link.megaMenu
                        ? 'text-brand-600 bg-brand-50'
                        : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                    )}
                  >
                    {link.label}
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', activeMenu === link.megaMenu && 'rotate-180')} />
                  </Link>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  {link.label}
                </Link>
              )
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

      {/* Women mega menu */}
      {activeMenu === 'women' && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full z-40 bg-white border-t border-gray-100 shadow-2xl"
          onMouseEnter={() => openMenu('women')}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-5 gap-8">
              {WOMEN_MEGA_MENU.map(col => (
                <div key={col.title}>
                  <Link
                    href={col.href}
                    onClick={() => setActiveMenu(null)}
                    className="block text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 hover:text-brand-700 transition-colors"
                  >
                    {col.title}
                  </Link>
                  <ul className="space-y-1.5">
                    {col.items.map(item => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setActiveMenu(null)}
                          className="text-sm text-gray-600 hover:text-brand-600 hover:translate-x-0.5 transition-all inline-block"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom "Shop all" bar */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-code tracking-wide">Browse all women's categories</p>
              <Link
                href="/search?category=Women"
                onClick={() => setActiveMenu(null)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                Shop All Women →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Men mega menu */}
      {activeMenu === 'men' && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full z-40 bg-white border-t border-gray-100 shadow-2xl"
          onMouseEnter={() => openMenu('men')}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-5 gap-8">
              {MEN_MEGA_MENU.map(col => (
                <div key={col.title}>
                  <Link
                    href={col.href}
                    onClick={() => setActiveMenu(null)}
                    className="block text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 hover:text-brand-700 transition-colors"
                  >
                    {col.title}
                  </Link>
                  <ul className="space-y-1.5">
                    {col.items.map(item => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setActiveMenu(null)}
                          className="text-sm text-gray-600 hover:text-brand-600 hover:translate-x-0.5 transition-all inline-block"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-code tracking-wide">Browse all men's categories</p>
              <Link
                href="/search?category=Men"
                onClick={() => setActiveMenu(null)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                Shop All Men →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Kids mega menu */}
      {activeMenu === 'kids' && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full z-40 bg-white border-t border-gray-100 shadow-2xl"
          onMouseEnter={() => openMenu('kids')}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-4 gap-8">
              {KIDS_MEGA_MENU.map(col => (
                <div key={col.title}>
                  <Link
                    href={col.href}
                    onClick={() => setActiveMenu(null)}
                    className="block text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 hover:text-brand-700 transition-colors"
                  >
                    {col.title}
                  </Link>
                  <ul className="space-y-1.5">
                    {col.items.map(item => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setActiveMenu(null)}
                          className="text-sm text-gray-600 hover:text-brand-600 hover:translate-x-0.5 transition-all inline-block"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-code tracking-wide">Browse all kids' categories</p>
              <Link
                href="/search?category=Kids"
                onClick={() => setActiveMenu(null)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
              >
                Shop All Kids →
              </Link>
            </div>
          </div>
        </div>
      )}

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

          {/* Mobile Women subcategories */}
          <div className="px-3 pb-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-3 mb-2">Women's Categories</p>
            {WOMEN_MEGA_MENU.map(col => (
              <div key={col.title} className="mb-3">
                <Link href={col.href} onClick={closeMobileMenu}
                  className="block px-3 py-1 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  {col.title}
                </Link>
                {col.items.map(item => (
                  <Link key={item.label} href={item.href} onClick={closeMobileMenu}
                    className="block px-5 py-1.5 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile Men subcategories */}
          <div className="px-3 pb-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-3 mb-2">Men's Categories</p>
            {MEN_MEGA_MENU.map(col => (
              <div key={col.title} className="mb-3">
                <Link href={col.href} onClick={closeMobileMenu}
                  className="block px-3 py-1 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  {col.title}
                </Link>
                {col.items.map(item => (
                  <Link key={item.label} href={item.href} onClick={closeMobileMenu}
                    className="block px-5 py-1.5 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile Kids subcategories */}
          <div className="px-3 pb-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-3 mb-2">Kids' Categories</p>
            {KIDS_MEGA_MENU.map(col => (
              <div key={col.title} className="mb-3">
                <Link href={col.href} onClick={closeMobileMenu}
                  className="block px-3 py-1 text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  {col.title}
                </Link>
                {col.items.map(item => (
                  <Link key={item.label} href={item.href} onClick={closeMobileMenu}
                    className="block px-5 py-1.5 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
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
