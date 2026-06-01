'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Filter, TrendingUp, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import Sidebar from '@/components/layout/Sidebar';
import FeedPostCard from '@/components/feed/FeedPostCard';
import CreatePostForm from '@/components/feed/CreatePostForm';
import type { Post, PostCategory } from '@/lib/types';
import { POST_CATEGORY_META } from '@/lib/types';
import { DUMMY_POSTS } from '@/lib/data/dummy-data';

// Sort modes for the neighborhood feed
type SortMode = 'recent' | 'trending';

// ── Geographical feed filtering logic ───────────────────────────────────────
// The feed shows posts from the current user's neighborhood first.
// If a category filter is active, only posts in that category are shown.
// Posts with geographical_scope='governorate' are included after neighborhood posts.
// Pinned posts always appear at the top regardless of sort.
function filterAndSortPosts(
  posts: Post[],
  category: PostCategory | 'all',
  sort: SortMode,
  neighborhoodId: string
): Post[] {
  let filtered = posts.filter(p => !p.is_removed);

  // Scope: show own-neighborhood posts + governorate-wide posts
  filtered = filtered.filter(p =>
    p.neighborhood_id === neighborhoodId || p.geographical_scope === 'governorate'
  );

  // Category filter
  if (category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Pinned posts always first
  const pinned   = filtered.filter(p => p.is_pinned);
  const unpinned = filtered.filter(p => !p.is_pinned);

  // Sort unpinned posts
  if (sort === 'recent') {
    unpinned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    // Trending: weight = reactions + (comments * 2) — comments are stronger signal
    unpinned.sort((a, b) =>
      (b.reaction_count + b.comment_count * 2) - (a.reaction_count + a.comment_count * 2)
    );
  }

  return [...pinned, ...unpinned];
}

// Separate the feed logic from the Suspense boundary requirement
function HomeFeedContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [posts, setPosts]         = useState<Post[]>(DUMMY_POSTS);
  const [category, setCategory]   = useState<PostCategory | 'all'>('all');
  const [sort, setSort]           = useState<SortMode>('recent');
  const [showCompose, setShowCompose] = useState(searchParams.get('compose') === 'true');

  // The current user's neighborhood ID — in production comes from useAuth()
  const CURRENT_NEIGHBORHOOD_ID = 'nh-1';

  const displayPosts = filterAndSortPosts(posts, category, sort, CURRENT_NEIGHBORHOOD_ID);

  function handlePostCreated(newPost: Post) {
    setPosts(prev => [newPost, ...prev]);
    setShowCompose(false);
    // Remove ?compose=true from URL
    router.replace('/');
  }

  // Close compose if URL param is removed
  useEffect(() => {
    setShowCompose(searchParams.get('compose') === 'true');
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        {/* ── Left sidebar (desktop only) ──────────────────── */}
        <Sidebar />

        {/* ── Main feed column ──────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4 max-w-2xl">

          {/* Compose box — collapsed by default */}
          {showCompose ? (
            <CreatePostForm
              onPostCreated={handlePostCreated}
              onClose={() => { setShowCompose(false); router.replace('/'); }}
            />
          ) : (
            <div
              className="card p-3 flex items-center gap-3 cursor-text
                          hover:border-brand-300 transition-colors"
              onClick={() => setShowCompose(true)}
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center
                              text-brand-600 font-bold text-sm flex-shrink-0">
                A
              </div>
              <span className="text-sm text-gray-400 flex-1">
                What&apos;s happening in Salmiya?
              </span>
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={e => { e.stopPropagation(); setShowCompose(true); }}
              >
                Post
              </button>
            </div>
          )}

          {/* ── Feed controls ─────────────────────────────── */}
          <div className="card p-3 space-y-3">
            {/* Sort tabs */}
            <div className="flex items-center gap-1 border-b border-gray-100 pb-3">
              <SortTab active={sort === 'recent'}   icon={<Clock className="w-3.5 h-3.5" />}    label="Recent"   onClick={() => setSort('recent')} />
              <SortTab active={sort === 'trending'} icon={<TrendingUp className="w-3.5 h-3.5" />} label="Trending" onClick={() => setSort('trending')} />
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                <Filter className="w-3.5 h-3.5" />
                <span>{displayPosts.length} posts</span>
              </div>
            </div>

            {/* Category filter chips */}
            <div className="flex gap-2 flex-wrap">
              <CategoryChip
                label="All"
                active={category === 'all'}
                onClick={() => setCategory('all')}
              />
              {(Object.entries(POST_CATEGORY_META) as [PostCategory, typeof POST_CATEGORY_META[PostCategory]][]).map(([cat, meta]) => (
                <CategoryChip
                  key={cat}
                  label={meta.label}
                  icon={meta.icon}
                  active={category === cat}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>
          </div>

          {/* ── Post list ───────────────────────────────────── */}
          {displayPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🏘️</p>
              <p className="font-semibold text-gray-700">No posts yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Be the first to post in your neighborhood!
              </p>
            </div>
          ) : (
            displayPosts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId="user-1"
              />
            ))
          )}
        </div>

        {/* ── Right rail (desktop): upcoming events, safety summary ── */}
        <RightRail />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 pt-8 text-center text-gray-500">Loading feed…</div>}>
      <HomeFeedContent />
    </Suspense>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────────

function SortTab({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
      )}
    >
      {icon} {label}
    </button>
  );
}

function CategoryChip({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
          : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 bg-white'
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

function RightRail() {
  return (
    <div className="w-72 flex-shrink-0 hidden xl:block">
      <div className="sticky top-20 space-y-3">
        {/* Safety summary card */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
            🚨 <span>Safety Alerts</span>
          </h3>
          <div className="space-y-2">
            <SafetyItem text="Suspicious vehicle on Block 5" time="2h ago" />
            <SafetyItem text="Package theft reported near Block 12" time="1d ago" />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Always call 112 for emergencies.
          </p>
        </div>

        {/* Upcoming events */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-1.5">
            📅 <span>Upcoming Events</span>
          </h3>
          <div className="space-y-2 text-sm">
            <EventItem title="Community Gathering" date="Fri, after Maghrib" place="Block 7 Hall" />
            <EventItem title="Bulk waste collection" date="Thursday 7am–2pm" place="Curbside" />
          </div>
        </div>

        {/* Neighbor spotlight */}
        <div className="card p-4 text-xs text-gray-400 text-center">
          <p className="font-semibold text-gray-600 text-sm mb-1">1,247 neighbors</p>
          <p>are part of Salmiya on JareApp</p>
          <button className="mt-3 btn-secondary text-xs w-full">Invite a Neighbor</button>
        </div>
      </div>
    </div>
  );
}

function SafetyItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
      <div>
        <p className="text-gray-700">{text}</p>
        <p className="text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function EventItem({ title, date, place }: { title: string; date: string; place: string }) {
  return (
    <div className="border-l-2 border-brand-300 pl-2">
      <p className="font-medium text-gray-800 text-xs">{title}</p>
      <p className="text-gray-500 text-xs">{date} · {place}</p>
    </div>
  );
}
