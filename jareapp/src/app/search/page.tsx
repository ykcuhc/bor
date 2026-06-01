'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Users, Store, FileText, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import type { PostCategory } from '@/lib/types';
import { IS_DEMO } from '@/lib/constants';

type SearchTab = 'all' | 'posts' | 'businesses' | 'people';

interface SearchResults {
  posts:      SearchPost[];
  businesses: SearchBusiness[];
  users:      SearchUser[];
}

interface SearchPost {
  id:           string;
  title:        string | null;
  body:         string;
  category:     PostCategory;
  created_at:   string;
  author?:      { id: string; full_name: string; avatar_url: string | null };
  neighborhood?: { id: string; name_en: string };
}

interface SearchBusiness {
  id:           string;
  name:         string;
  category:     string;
  description:  string | null;
  is_verified:  boolean;
  rating_sum:   number;
  rating_count: number;
  neighborhood?: { id: string; name_en: string };
}

interface SearchUser {
  id:                  string;
  full_name:           string;
  username:            string;
  avatar_url:          string | null;
  verification_status: string;
}

function SearchContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { profile }   = useAuth();

  const initialQ     = searchParams.get('q') ?? '';
  const [query,      setQuery]      = useState(initialQ);
  const [activeTab,  setActiveTab]  = useState<SearchTab>('all');
  const [results,    setResults]    = useState<SearchResults>({ posts: [], businesses: [], users: [] });
  const [loading,    setLoading]    = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const neighborhoodId = profile?.neighborhood_id ?? 'nh-1';
  const governorateId  = profile?.governorate_id  ?? 'gov-2';

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) { setResults({ posts: [], businesses: [], users: [] }); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (IS_DEMO) {
          setResults({ posts: [], businesses: [], users: [] });
          return;
        }
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${activeTab}` +
          `&neighborhoodId=${neighborhoodId}&governorateId=${governorateId}`
        );
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, neighborhoodId, governorateId]);

  // Keep URL in sync
  useEffect(() => {
    const url = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
    router.replace(url, { scroll: false });
  }, [query, router]);

  const totalResults = results.posts.length + results.businesses.length + results.users.length;
  const hasQuery     = query.length >= 2;

  const TABS: { key: SearchTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all',        label: 'All',       icon: <Search className="w-3.5 h-3.5" />,  count: totalResults },
    { key: 'posts',      label: 'Posts',     icon: <FileText className="w-3.5 h-3.5" />, count: results.posts.length },
    { key: 'businesses', label: 'Businesses',icon: <Store className="w-3.5 h-3.5" />,   count: results.businesses.length },
    { key: 'people',     label: 'People',    icon: <Users className="w-3.5 h-3.5" />,   count: results.users.length },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Back + search input */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-brand-600 transition-colors p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search neighbors, posts, businesses…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-full
                       bg-white focus:outline-none focus:ring-2 focus:ring-brand-500
                       focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      {hasQuery && (
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx(
                  'text-[10px] rounded-full px-1.5 py-0.5 font-bold',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {!hasQuery ? (
        <SearchPrompt />
      ) : loading ? (
        <SearchSkeleton />
      ) : totalResults === 0 && !IS_DEMO ? (
        <NoResults query={query} />
      ) : IS_DEMO ? (
        <DemoSearchNotice />
      ) : (
        <div className="space-y-6">
          {/* Posts */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Posts</h2>
              <div className="space-y-2">
                {results.posts.map(post => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="card p-3 flex items-start gap-3 hover:border-brand-200 transition-colors block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge category={post.category} />
                        <span className="text-xs text-gray-400">{post.neighborhood?.name_en}</span>
                      </div>
                      {post.title && <p className="font-medium text-sm text-gray-900 truncate">{post.title}</p>}
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{post.body}</p>
                    </div>
                    {post.author && (
                      <Avatar src={post.author.avatar_url} name={post.author.full_name} size="xs" />
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Businesses */}
          {(activeTab === 'all' || activeTab === 'businesses') && results.businesses.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Businesses</h2>
              <div className="space-y-2">
                {results.businesses.map(biz => (
                  <Link
                    key={biz.id}
                    href="/services"
                    className="card p-3 flex items-center gap-3 hover:border-brand-200 transition-colors block"
                  >
                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      🏪
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {biz.name}
                        {biz.is_verified && <span className="ml-1 text-brand-600">✓</span>}
                      </p>
                      <p className="text-xs text-gray-500">{biz.category} · {biz.neighborhood?.name_en}</p>
                    </div>
                    {biz.rating_count > 0 && (
                      <span className="text-xs text-amber-600 font-medium flex-shrink-0">
                        ★ {(biz.rating_sum / biz.rating_count).toFixed(1)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* People */}
          {(activeTab === 'all' || activeTab === 'people') && results.users.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Neighbors</h2>
              <div className="space-y-2">
                {results.users.map(user => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="card p-3 flex items-center gap-3 hover:border-brand-200 transition-colors block"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {user.full_name}
                        {user.verification_status === 'verified' && (
                          <span className="ml-1 text-brand-600 text-xs">✓</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchPrompt() {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="font-semibold text-gray-700">Search your neighborhood</p>
      <p className="text-sm text-gray-400 mt-1">Find posts, local businesses, and neighbors</p>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-3xl mb-3">😕</p>
      <p className="font-semibold text-gray-700">No results for &ldquo;{query}&rdquo;</p>
      <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-3 animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoSearchNotice() {
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl mb-2">🔌</p>
      <p className="font-semibold text-gray-700 text-sm">Live search requires Supabase</p>
      <p className="text-xs text-gray-400 mt-1">
        Connect your Supabase project in <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable full-text search.
      </p>
    </div>
  );
}
