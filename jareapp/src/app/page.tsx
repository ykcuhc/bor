'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import Sidebar          from '@/components/layout/Sidebar';
import FeedPostCard     from '@/components/feed/FeedPostCard';
import CreatePostForm   from '@/components/feed/CreatePostForm';
import DemoModeBanner   from '@/components/ui/DemoModeBanner';
import { FeedPostSkeleton } from '@/components/ui/Skeleton';
import { useFeed }      from '@/hooks/useFeed';
import { useFeedStore } from '@/store/feedStore';
import { useAuth }      from '@/context/AuthContext';
import type { Post, PostCategory } from '@/lib/types';
import { POST_CATEGORY_META } from '@/lib/types';
import { DUMMY_POSTS } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

type SortMode = 'recent' | 'trending';

// Detect demo mode from env at runtime
function sortPosts(posts: Post[], sort: SortMode): Post[] {
  const pinned   = posts.filter(p => p.is_pinned);
  const unpinned = posts.filter(p => !p.is_pinned);

  if (sort === 'trending') {
    unpinned.sort((a, b) =>
      (b.reaction_count + b.comment_count * 2) - (a.reaction_count + a.comment_count * 2)
    );
  }
  // 'recent' is already ordered from the API/dummy data

  return [...pinned, ...unpinned];
}

function HomeFeedContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { profile }  = useAuth();
  const store        = useFeedStore();

  const [category,     setCategory]     = useState<PostCategory | 'all'>('all');
  const [sort,         setSort]         = useState<SortMode>('recent');
  const [showCompose,  setShowCompose]  = useState(searchParams.get('compose') === 'true');
  const [newPostBadge, setNewPostBadge] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Geographical IDs — from real profile in live mode, fallback to demo values
  const neighborhoodId = profile?.neighborhood_id ?? 'nh-1';
  const governorateId  = profile?.governorate_id  ?? 'gov-2';

  // Seed store with dummy data in demo mode so it renders immediately
  useEffect(() => {
    if (IS_DEMO) {
      let filtered = DUMMY_POSTS.filter(p =>
        !p.is_removed && (p.neighborhood_id === 'nh-1' || p.geographical_scope === 'governorate')
      );
      if (category !== 'all') filtered = filtered.filter(p => p.category === category);
      store.setPosts(filtered);
    }
  // Only re-run when category changes in demo mode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, IS_DEMO]);

  const { loading, error, hasMore, loadMore, reload } = useFeed({
    neighborhoodId,
    governorateId,
    category:    category === 'all' ? undefined : category,
    isDemoMode:  IS_DEMO,
  });

  // Infinite scroll — load more when bottom sentinel enters viewport
  useEffect(() => {
    const el = bottomRef.current;
    if (!el || !hasMore || IS_DEMO) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) loadMore();
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  // Flash a "New posts" badge when realtime inserts arrive
  useEffect(() => {
    if (sort === 'recent') setNewPostBadge(false);
  }, [store.posts.length, sort]);

  const displayPosts = sortPosts(store.posts, sort);

  function handlePostCreated(post: Post) {
    store.prependPost(post);
    setShowCompose(false);
    router.replace('/');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex gap-6">
        <Sidebar />

        <div className="flex-1 min-w-0 space-y-4 max-w-2xl">
          {IS_DEMO && <DemoModeBanner />}

          {/* Compose area */}
          {showCompose ? (
            <CreatePostForm
              neighborhoodId={neighborhoodId}
              governorateId={governorateId}
              onPostCreated={handlePostCreated}
              onClose={() => { setShowCompose(false); router.replace('/'); }}
              isDemoMode={IS_DEMO}
            />
          ) : (
            <div
              className="card p-3 flex items-center gap-3 cursor-text hover:border-brand-300 transition-colors"
              onClick={() => setShowCompose(true)}
            >
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                {profile?.full_name?.[0] ?? 'A'}
              </div>
              <span className="text-sm text-gray-400 flex-1">
                What&apos;s happening in {profile?.neighborhood?.name_en ?? 'your neighborhood'}?
              </span>
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={e => { e.stopPropagation(); setShowCompose(true); }}
              >
                Post
              </button>
            </div>
          )}

          {/* Feed controls */}
          <div className="card p-3 space-y-3">
            <div className="flex items-center gap-1 border-b border-gray-100 pb-3">
              <SortTab active={sort === 'recent'}   icon={<Clock className="w-3.5 h-3.5" />}     label="Recent"   onClick={() => setSort('recent')} />
              <SortTab active={sort === 'trending'} icon={<TrendingUp className="w-3.5 h-3.5" />} label="Trending" onClick={() => setSort('trending')} />
              <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                {!IS_DEMO && (
                  <button onClick={reload} className="p-1 hover:text-brand-600 transition-colors" title="Refresh feed">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <Filter className="w-3.5 h-3.5" />
                <span>{displayPosts.length} posts</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <CategoryChip label="All" active={category === 'all'} onClick={() => setCategory('all')} />
              {(Object.entries(POST_CATEGORY_META) as [PostCategory, typeof POST_CATEGORY_META[PostCategory]][]).map(([cat, meta]) => (
                <CategoryChip key={cat} label={meta.label} icon={meta.icon} active={category === cat} onClick={() => setCategory(cat)} />
              ))}
            </div>
          </div>

          {/* New posts badge */}
          {newPostBadge && (
            <button
              onClick={() => { setNewPostBadge(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-xl border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              ↑ New posts available
            </button>
          )}

          {/* Error */}
          {error && !IS_DEMO && (
            <div className="card p-4 text-sm text-red-600 border-red-100 flex items-center gap-2">
              <span>Failed to load feed: {error}</span>
              <button onClick={reload} className="ml-auto text-brand-600 font-medium">Retry</button>
            </div>
          )}

          {/* Post list */}
          {loading && !store.posts.length ? (
            Array.from({ length: 4 }).map((_, i) => <FeedPostSkeleton key={i} />)
          ) : displayPosts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <>
              {displayPosts.map(post => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUserId={profile?.id ?? 'user-1'}
                  isDemoMode={IS_DEMO}
                />
              ))}
              {/* Infinite scroll sentinel */}
              <div ref={bottomRef} />
              {loading && hasMore && <FeedPostSkeleton />}
              {!hasMore && !IS_DEMO && displayPosts.length > 0 && (
                <p className="text-center text-xs text-gray-400 py-4">You&apos;re all caught up! 🎉</p>
              )}
            </>
          )}
        </div>

        <RightRail posts={store.posts} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 pt-8 text-center text-gray-500">Loading…</div>}>
      <HomeFeedContent />
    </Suspense>
  );
}

// ── Sub-components ────────────────────────────────────────────

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

function EmptyFeed() {
  return (
    <div className="card p-12 text-center">
      <p className="text-4xl mb-3">🏘️</p>
      <p className="font-semibold text-gray-700">No posts in this category yet</p>
      <p className="text-sm text-gray-500 mt-1">Be the first to post in your neighborhood!</p>
    </div>
  );
}

function InviteCard() {
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join JareApp', text: 'Join me on JareApp — the neighborhood social platform for Kuwait!', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="card p-4 text-xs text-gray-400 text-center">
      <p className="font-semibold text-gray-600 text-sm mb-1">Your neighborhood is live</p>
      <p>Invite a neighbor to join JareApp</p>
      <button onClick={handleInvite} className="mt-3 btn-secondary text-xs w-full">
        {copied ? '✓ Link copied!' : 'Send Invite'}
      </button>
    </div>
  );
}

function RightRail({ posts }: { posts: Post[] }) {
  const safetyPosts = posts.filter(p => p.category === 'safety').slice(0, 3);
  const eventPosts  = posts.filter(p => p.category === 'events').slice(0, 3);

  return (
    <div className="w-72 flex-shrink-0 hidden xl:block">
      <div className="sticky top-20 space-y-3">
        <div className="card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">🚨 Safety Alerts</h3>
          {safetyPosts.length === 0
            ? <p className="text-xs text-gray-400">No safety alerts. All quiet. ✅</p>
            : safetyPosts.map(p => (
                <div key={p.id} className="flex items-start gap-2 text-xs mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <p className="text-gray-700 line-clamp-2">{p.title ?? p.body.slice(0, 80)}</p>
                </div>
              ))
          }
          <p className="text-xs text-gray-400 mt-2">Always call 112 for emergencies.</p>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">📅 Upcoming Events</h3>
          {eventPosts.length === 0
            ? <p className="text-xs text-gray-400">No upcoming events.</p>
            : eventPosts.map(p => (
                <div key={p.id} className="border-l-2 border-brand-300 pl-2 mb-2">
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{p.title ?? 'Community Event'}</p>
                  <p className="text-xs text-gray-500">{p.neighborhood?.name_en}</p>
                </div>
              ))
          }
        </div>

        <InviteCard />
      </div>
    </div>
  );
}
