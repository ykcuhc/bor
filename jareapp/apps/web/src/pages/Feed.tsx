import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Plus, X, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CategoryFilter from '../components/CategoryFilter';
import AlertBanner from '../components/AlertBanner';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

interface CreatePostForm {
  contentAr: string;
  contentEn: string;
  category: string;
  isAnonymous: boolean;
}

export default function Feed() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreatePostForm>({ contentAr: '', contentEn: '', category: 'GENERAL', isAnonymous: false });
  const [posting, setPosting] = useState(false);

  // Fetch active critical/high alerts
  const { data: alertsData } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: () => api.get('/alerts').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const criticalAlert = alertsData?.alerts?.find((a: any) => ['CRITICAL', 'HIGH'].includes(a.severity) && a.isActive);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', category],
    queryFn: ({ pageParam }) =>
      api.get('/feed', { params: { cursor: pageParam, category: category || undefined } }).then((r) => r.data.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const posts = data?.pages.flatMap((p) => p.posts) || [];

  async function createPost() {
    if (!form.contentAr && !form.contentEn) return;
    setPosting(true);
    try {
      await api.post('/posts', form);
      setShowCreate(false);
      setForm({ contentAr: '', contentEn: '', category: 'GENERAL', isAnonymous: false });
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="max-w-2xl mx-auto" onScroll={handleScroll}>
      {/* Active alert banner */}
      {criticalAlert && (
        <AlertBanner
          severity={criticalAlert.severity}
          titleAr={criticalAlert.titleAr || ''}
          titleEn={criticalAlert.titleEn}
          alertId={criticalAlert.id}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 bg-bg z-30 border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-text-primary mb-3">{t('nav.feed')}</h1>
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : posts.length === 0 ? (
          <EmptyState
            title={t('feed.empty')}
            message={t('feed.emptyMessage')}
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                {t('post.create')}
              </button>
            }
          />
        ) : (
          <>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} onRefresh={refetch} />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-20 end-4 lg:bottom-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-light transition-colors flex items-center justify-center z-20"
      >
        <Plus size={24} />
      </button>

      {/* Create post modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('post.create')} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('post.contentAr')}</label>
            <textarea
              value={form.contentAr}
              onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
              placeholder={t('post.createPlaceholder')}
              className="input-field min-h-[100px] resize-none"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('post.contentEn')}</label>
            <textarea
              value={form.contentEn}
              onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
              placeholder="What's happening in your neighborhood?"
              className="input-field min-h-[80px] resize-none"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('post.category')}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {['GENERAL', 'SAFETY', 'MARKETPLACE', 'SERVICES', 'LOST_AND_FOUND', 'RECOMMENDATIONS', 'ANNOUNCEMENTS', 'COMPLAINTS'].map((c) => (
                <option key={c} value={c}>{t(`post.categories.${c}`, { defaultValue: c })}</option>
              ))}
            </select>
          </div>
          {form.category === 'SAFETY' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-text-secondary">{t('post.anonymousTip')}</span>
            </label>
          )}
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button onClick={createPost} disabled={posting || (!form.contentAr && !form.contentEn)} className="btn-primary flex-1">
              {posting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('post.publish')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
