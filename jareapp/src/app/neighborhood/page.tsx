'use client';

import { useState } from 'react';
import { Users, Pin, Clock, TrendingUp, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import Sidebar from '@/components/layout/Sidebar';
import FeedPostCard from '@/components/feed/FeedPostCard';
import CreatePostForm from '@/components/feed/CreatePostForm';
import type { Post } from '@/lib/types';
import { DUMMY_POSTS, DUMMY_NEIGHBORHOODS } from '@/lib/data/dummy-data';

type Tab = 'discussion' | 'safety' | 'events';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'discussion', label: 'Discussion Board', icon: <Users className="w-4 h-4" /> },
  { key: 'safety',     label: 'Safety',           icon: <Shield className="w-4 h-4" /> },
  { key: 'events',     label: 'Events',           icon: <Clock className="w-4 h-4" /> },
];

// Filter posts by tab: safety tab → only safety/crime posts, etc.
function getTabPosts(allPosts: Post[], tab: Tab, neighborhoodId: string): Post[] {
  const scoped = allPosts.filter(
    p => !p.is_removed && (p.neighborhood_id === neighborhoodId || p.geographical_scope === 'governorate')
  );
  if (tab === 'discussion') return scoped.filter(p => !['safety', 'events'].includes(p.category));
  if (tab === 'safety')     return scoped.filter(p => p.category === 'safety');
  if (tab === 'events')     return scoped.filter(p => p.category === 'events');
  return scoped;
}

export default function NeighborhoodPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('discussion');
  const [posts, setPosts]           = useState<Post[]>(DUMMY_POSTS);
  const [showCompose, setShowCompose] = useState(false);
  const neighborhood = DUMMY_NEIGHBORHOODS[0];

  const tabPosts = getTabPosts(posts, activeTab, neighborhood.id);
  const pinnedPosts = tabPosts.filter(p => p.is_pinned);
  const unpinnedPosts = tabPosts.filter(p => !p.is_pinned).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const sortedPosts = [...pinnedPosts, ...unpinnedPosts];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 max-w-2xl space-y-4">

          {/* ── Neighborhood hero card ──────────────────────── */}
          <div className="card overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-brand-600 to-brand-400 flex items-center px-6">
              <div>
                <h1 className="text-white text-xl font-bold">{neighborhood.name_en}</h1>
                <p className="text-brand-100 text-sm">{neighborhood.governorate?.name_en} · 1,247 neighbors</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                {DUMMY_POSTS.filter(p => p.neighborhood_id === neighborhood.id).length} posts this month
              </span>
              <span className="flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                {pinnedPosts.length} pinned announcements
              </span>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="card p-1 flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
              onPostCreated={p => { setPosts(prev => [p, ...prev]); setShowCompose(false); }}
              onClose={() => setShowCompose(false)}
            />
          ) : (
            <button
              onClick={() => setShowCompose(true)}
              className="w-full card py-3 text-sm text-gray-400 text-center hover:border-brand-300 transition-colors"
            >
              + Start a new discussion in {neighborhood.name_en}
            </button>
          )}

          {/* ── Posts ────────────────────────────────────────── */}
          {sortedPosts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-2">
                {activeTab === 'safety' ? '🛡️' : activeTab === 'events' ? '📅' : '💬'}
              </p>
              <p className="text-sm text-gray-500">
                {activeTab === 'safety'
                  ? 'No safety alerts. All quiet in the neighborhood!'
                  : activeTab === 'events'
                  ? 'No upcoming events. Create one!'
                  : 'No discussions yet. Start the conversation!'}
              </p>
            </div>
          ) : (
            sortedPosts.map(post => (
              <FeedPostCard key={post.id} post={post} currentUserId="user-1" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
