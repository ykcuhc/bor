import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Search, Plus } from 'lucide-react';
import api from '../utils/api';
import BusinessCard from '../components/BusinessCard';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['', 'RESTAURANT', 'CAFE', 'GROCERY', 'PHARMACY', 'SALON', 'GYM', 'CLINIC', 'SERVICES', 'RETAIL', 'OTHER'];

export default function Businesses() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', category, search],
    queryFn: () => api.get('/businesses', { params: { category: category || undefined, search: search || undefined } }).then((r) => r.data.data),
  });

  const { data: featured } = useQuery({
    queryKey: ['businesses-featured'],
    queryFn: () => api.get('/businesses/featured').then((r) => r.data.data),
  });

  const businesses = data?.businesses || data || [];
  const featuredList = Array.isArray(featured) ? featured : [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-3">
          <ShoppingBag size={20} className="text-primary" />
          {t('nav.businesses')}
        </h1>
        <div className="relative mb-3">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('business.search')}
            className="input-field ps-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === c ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
              }`}
            >
              {c ? t(`business.categories.${c}`, { defaultValue: c }) : t('common.all')}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {featuredList.length > 0 && !search && !category && (
          <div className="mb-4">
            <h2 className="font-semibold text-text-primary mb-2 text-sm">{t('business.featured')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {featuredList.slice(0, 2).map((b: any) => <BusinessCard key={b.id} business={b} />)}
            </div>
            <hr className="border-border my-4" />
          </div>
        )}

        {isLoading ? (
          <SkeletonList count={4} />
        ) : businesses.length === 0 ? (
          <EmptyState title={t('business.empty')} message={t('business.emptyMessage')} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {businesses.map((b: any) => <BusinessCard key={b.id} business={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
