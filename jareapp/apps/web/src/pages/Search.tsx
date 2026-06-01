import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import BusinessCard from '../components/BusinessCard';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';

const TABS = ['posts', 'businesses', 'events'] as const;

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<typeof TABS[number]>('posts');

  const { data: postsData } = useQuery({
    queryKey: ['search-posts', query],
    queryFn: () => api.get('/feed', { params: { search: query } }).then((r) => r.data.data),
    enabled: query.length > 1 && tab === 'posts',
  });

  const { data: businessesData } = useQuery({
    queryKey: ['search-businesses', query],
    queryFn: () => api.get('/businesses', { params: { search: query } }).then((r) => r.data.data),
    enabled: query.length > 1 && tab === 'businesses',
  });

  const { data: eventsData } = useQuery({
    queryKey: ['search-events', query],
    queryFn: () => api.get('/events', { params: { search: query } }).then((r) => r.data.data),
    enabled: query.length > 1 && tab === 'events',
  });

  const results = {
    posts: postsData?.posts || [],
    businesses: businessesData?.businesses || businessesData || [],
    events: eventsData?.events || eventsData || [],
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary mb-3">{t('nav.search')}</h1>
        <div className="relative">
          <SearchIcon size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="input-field ps-9"
            autoFocus
          />
        </div>

        {query.length > 1 && (
          <div className="flex gap-1 mt-3">
            {TABS.map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === tabName ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                {t(`search.${tabName}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {query.length <= 1 ? (
          <EmptyState title={t('search.startTyping')} message={t('search.startTypingMessage')} />
        ) : results[tab].length === 0 ? (
          <EmptyState title={t('search.noResults')} message={t('search.noResultsMessage')} />
        ) : (
          <div className="space-y-3">
            {tab === 'posts' && results.posts.map((p: any) => <PostCard key={p.id} post={p} />)}
            {tab === 'businesses' && (
              <div className="grid grid-cols-2 gap-3">
                {results.businesses.map((b: any) => <BusinessCard key={b.id} business={b} />)}
              </div>
            )}
            {tab === 'events' && results.events.map((e: any) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
