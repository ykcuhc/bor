'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star, Grid3x3, Archive, Settings, UserPlus, UserMinus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { MOCK_USERS } from '@/lib/mockData';
import ProductCard from '@/components/listing/ProductCard';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

type Tab = 'listings' | 'sold' | 'about';

export default function ClosetPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { getListingsByUser, isAuthenticated, currentUser, followUser, unfollowUser, isFollowing, showToast } = useStore();

  // Find user from mock store (replace with DB call in production)
  const profileUser = MOCK_USERS.find(u => u.username === username)
    || (currentUser?.username === username ? currentUser : null);

  const [tab, setTab] = useState<Tab>('listings');
  const allListings = profileUser ? getListingsByUser(profileUser.id) : [];
  const activeListings = allListings.filter(l => l.status === 'available');
  const soldListings   = allListings.filter(l => l.status === 'sold');
  const isOwnCloset    = currentUser?.username === username;
  const following      = isFollowing(profileUser?.id ?? '');

  if (!profileUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👀</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Closet not found</h2>
        <p className="text-gray-500">This user doesn&apos;t exist on MyCloset.</p>
      </div>
    );
  }

  function handleFollow() {
    if (!isAuthenticated) { showToast('Sign in to follow sellers', 'info'); return; }
    if (following) unfollowUser(profileUser!.id);
    else followUser(profileUser!.id);
  }

  const displayListings = tab === 'listings' ? activeListings : soldListings;

  return (
    <div className="min-h-screen">
      {/* ── Header banner ──────────────────────────────────────────────────── */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-brand-600 to-brand-900 overflow-hidden">
        {profileUser.headerImage && (
          <img src={profileUser.headerImage} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* ── Profile row ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 pb-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-lg bg-white"
              />
              {profileUser.isVerified && (
                <span className="absolute bottom-1 right-1 bg-brand-600 rounded-full p-0.5">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{profileUser.displayName}</h1>
                {profileUser.isVerified && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">Verified</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">@{profileUser.username}</p>
              {profileUser.location && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {profileUser.location}
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 sm:pb-1">
              {isOwnCloset ? (
                <>
                  <Link
                    href="/sell"
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors"
                  >
                    + List Item
                  </Link>
                  <Link
                    href="/settings"
                    className="p-2 border border-gray-200 rounded-full text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleFollow}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full border transition-all',
                    following
                      ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      : 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
                  )}
                >
                  {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-5 flex-wrap">
            {[
              { label: 'Listings',   value: profileUser.listingsCount },
              { label: 'Sold',       value: profileUser.soldCount },
              { label: 'Followers',  value: profileUser.followersCount.toLocaleString() },
              { label: 'Following',  value: profileUser.followingCount.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-extrabold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
            {profileUser.totalRatings > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-900">{profileUser.averageRating.toFixed(1)}</span>
                <span className="text-gray-500">({profileUser.totalRatings})</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="mt-4 text-sm text-gray-700 max-w-xl leading-relaxed">{profileUser.bio}</p>
          )}

          {/* Member since */}
          <p className="text-xs text-gray-400 mt-2">
            Member since {new Date(profileUser.joinedAt).toLocaleDateString('en-KW', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-gray-200 mt-4">
          {([
            { id: 'listings', label: 'Closet',     count: activeListings.length, icon: Grid3x3 },
            { id: 'sold',     label: 'Sold Items',  count: soldListings.length,   icon: Archive },
          ] as const).map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all',
                tab === id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                tab === id ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        <div className="py-8">
          {displayListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">{tab === 'listings' ? '🧺' : '📦'}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tab === 'listings' ? 'No active listings' : 'No sold items yet'}
              </h3>
              {isOwnCloset && tab === 'listings' && (
                <Link href="/sell" className="mt-3 px-5 py-2 bg-brand-600 text-white font-semibold rounded-full hover:bg-brand-700 transition-colors text-sm">
                  List Your First Item
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayListings.map(listing => (
                <ProductCard key={listing.id} listing={listing} showSoldBadge={tab === 'sold'} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
