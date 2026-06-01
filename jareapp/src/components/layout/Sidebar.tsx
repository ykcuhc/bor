'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Store, User, ShieldCheck, PlusCircle, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';
import VerificationBanner from '@/components/neighborhood/VerificationBanner';
import { DUMMY_USERS, DUMMY_NEIGHBORHOODS } from '@/lib/data/dummy-data';
import { useAuth } from '@/context/AuthContext';

const DUMMY_USER         = DUMMY_USERS[0];
const DUMMY_NEIGHBORHOOD = DUMMY_NEIGHBORHOODS[0];

export default function Sidebar() {
  const { profile } = useAuth();
  const pathname    = usePathname();

  const currentUser         = profile ?? DUMMY_USER;
  const currentNeighborhood = profile?.neighborhood ?? DUMMY_NEIGHBORHOOD;

  const NAV_ITEMS = [
    { href: '/',                          label: 'Home Feed',      icon: Home },
    { href: '/neighborhood',              label: 'Neighborhood',   icon: Users },
    { href: '/messages',                  label: 'Messages',       icon: MessageSquare },
    { href: '/services',                  label: 'Local Services', icon: Store },
    { href: `/profile/${currentUser.id}`, label: 'My Profile',     icon: User },
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-3">

        {/* ── User card ──────────────────────────────────────── */}
        <div className="card p-4">
          <Link href={`/profile/${currentUser.id}`} className="flex items-center gap-3">
            <Avatar src={currentUser.avatar_url} name={currentUser.full_name} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{currentUser.full_name}</p>
              <p className="text-xs text-gray-500 truncate">@{currentUser.username}</p>
            </div>
          </Link>

          {/* Neighborhood badge */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 rounded-lg px-2.5 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium truncate">{currentNeighborhood.name_en}</span>
            {currentUser.verification_status === 'verified' && (
              <span className="ml-auto text-brand-600 font-semibold">✓ Verified</span>
            )}
          </div>
        </div>

        {/* ── Verification banner ────────────────────────────── */}
        {currentUser.verification_status !== 'verified' && (
          <VerificationBanner status={currentUser.verification_status ?? 'unverified'} />
        )}

        {/* ── Navigation ─────────────────────────────────────── */}
        <nav className="card p-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={clsx('w-4.5 h-4.5 flex-shrink-0', active ? 'text-brand-600' : 'text-gray-400')} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Create post CTA ────────────────────────────────── */}
        <Link
          href="/?compose=true"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold
                     transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Post to Neighborhood
        </Link>

        {/* ── Neighborhood stats ─────────────────────────────── */}
        <div className="card p-4 text-xs text-gray-500 space-y-2">
          <p className="font-semibold text-gray-700 text-sm">
            {currentNeighborhood.name_en}
          </p>
          <p>{currentNeighborhood.governorate?.name_en}</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-center bg-gray-50 rounded-lg py-2">
              <p className="text-base font-bold text-gray-800">1,247</p>
              <p>Neighbors</p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg py-2">
              <p className="text-base font-bold text-gray-800">38</p>
              <p>Businesses</p>
            </div>
          </div>
        </div>

        {/* ── Premium upgrade ────────────────────────────────── */}
        {(!currentUser.membership_tier || currentUser.membership_tier === 'free') && (
          <Link
            href="/premium"
            className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl
                       bg-gradient-to-r from-amber-400 to-amber-500
                       hover:from-amber-500 hover:to-amber-600
                       text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Crown className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="leading-tight">Upgrade to Premium</p>
              <p className="text-xs font-normal opacity-90">From 2.5 KD / month</p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
