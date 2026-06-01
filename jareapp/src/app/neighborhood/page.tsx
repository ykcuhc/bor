'use client';

import { useState } from 'react';
import { Users, Pin, TrendingUp, Shield, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import Sidebar from '@/components/layout/Sidebar';
import FeedPostCard from '@/components/feed/FeedPostCard';
import CreatePostForm from '@/components/feed/CreatePostForm';
import DemoModeBanner from '@/components/ui/DemoModeBanner';
import { FeedPostSkeleton } from '@/components/ui/Skeleton';
import { useFeed } from '@/hooks/useFeed';
import { useFeedStore } from '@/store/feedStore';
import { useAuth } from '@/context/AuthContext';
import { useNeighborhoodStats } from '@/hooks/useNeighborhoodStats';
import type { Post } from '@/lib/types';
import { DUMMY_POSTS, DUMMY_NEIGHBORHOODS } from '@/lib/data/dummy-data';
import { useEffect } from 'react';
import { IS_DEMO } from '@/lib/constants';

type Tab = 'discussion' | 'safety' | 'events';

const TABS: { key: Tab; label: string; icon: React.ReactNode; category?: string }[] = [
  { key: 'discussion', label: 'Discussion',    icon: <Users className="w-4 h-4" /> },
  { key: 'safety',     label: 'Safety',        icon: <Shield className="w-4 h-4" />, category: 'safety' },
  { key: 'events',     label: 'Events',        icon: <Clock className="w-4 h-4" />,  category: 'events' },
];

export default function NeighborhoodPage() {
  const { profile }    = useAuth();
  const store          = useFeedStore();
  const [activeTab,    setActiveTab]    = useState<Tab>('discussion');
  const [showCompose,  setShowCompose]  = useState(false);

  const neighborhoodId = profile?.neighborhood_id ?? 'nh-1';
  const governorateId  = profile?.governorate_id  ?? 'gov-2';
  const neighborhood   = profile?.neighborhood ?? DUMMY_NEIGHBORHOODS[0];
  const stats          = useNeighborhoodStats(neighborhoodId);

  const currentCategory = TABS.find(t => t.key === activeTab)?.category;

  // Seed store with demo data when in demo mode
  useEffect(() => {
    if (!IS_DEMO) return;
    let posts = DUMMY_POSTS.filter(p =>
      !p.is_removed && (p.neighborhood_id === 'nh-1' || p.geographical_scope === 'governorate')
    );
    if (currentCategory) posts = posts.filter(p => p.category === currentCategory);
    // discussion tab excludes safety/events
    if (activeTab === 'discussion') posts = posts.filter(p => !['safety', 'events'].includes(p.category));
    store.setPosts(posts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, IS_DEMO]);

  const { loading } = useFeed({
    neighborhoodId,
    governorateId,
    category:   currentCategory,
    isDemoMode: IS_DEMO,
  });

  const allPosts   = store.posts;
  const pinned     = allPosts.filter(p => p.is_pinned);
  const unpinned   = allPosts
    .filter(p => !p.is_pinned)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const displayPosts = [...pinned, ...unpinned];

  function handlePostCreated(post: Post) {
    store.prependPost(post);
    setShowCompose(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 max-w-2xl space-y-4">
          {IS_DEMO && <DemoModeBanner />}

          {/* ── Neighborhood hero ─────────────────────────────── */}
          <div className="card overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-brand-600 to-brand-400 flex items-center px-6">
              <div>
                <h1 className="text-white text-xl font-bold">{neighborhood.name_en}</h1>
                <p className="text-brand-100 text-sm">
                  {neighborhood.governorate?.name_en ?? profile?.governorate?.name_en} · {stats.member_count.toLocaleString()} neighbors
                </p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                {allPosts.length} posts loaded
              </span>
              <span className="flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                {pinned.length} pinned
              </span>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="card p-1 flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setShowCompose(false); }}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {tab.icon}
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Compose ──────────────────────────────────────── */}
          {showCompose ? (
            <CreatePostForm
              neighborhoodId={neighborhoodId}
              governorateId={governorateId}
              onPostCreated={handlePostCreated}
              onClose={() => setShowCompose(false)}
              isDemoMode={IS_DEMO}
            />
          ) : (
            <button
              onClick={() => setShowCompose(true)}
              className="w-full card py-3 text-sm text-gray-400 text-center hover:border-brand-300 transition-colors"
            >
              + Start a new {activeTab === 'safety' ? 'safety alert' : activeTab === 'events' ? 'event' : 'discussion'} in {neighborhood.name_en}
            </button>
          )}

          {/* ── Posts ────────────────────────────────────────── */}
          {loading && !displayPosts.length ? (
            Array.from({ length: 3 }).map((_, i) => <FeedPostSkeleton key={i} />)
          ) : displayPosts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-2">
                {activeTab === 'safety' ? '🛡️' : activeTab === 'events' ? '📅' : '💬'}
              </p>
              <p className="text-sm text-gray-500">
                {activeTab === 'safety'
                  ? 'No safety alerts. All quiet in the neighborhood! ✅'
                  : activeTab === 'events'
                  ? 'No upcoming events. Create one!'
                  : 'No discussions yet. Start the conversation!'}
              </p>
            </div>
          ) : (
            displayPosts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId={profile?.id ?? 'user-1'}
                isDemoMode={IS_DEMO}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
