import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../utils/api';
import NotificationItem from '../components/NotificationItem';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Notifications() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/users/me/notifications').then((r) => r.data.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/users/me/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          {t('nav.notifications')}
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={() => markAll.mutate()} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <CheckCheck size={16} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4"><SkeletonList count={5} /></div>
        ) : notifications.length === 0 ? (
          <EmptyState title={t('notifications.empty')} message={t('notifications.emptyMessage')} />
        ) : (
          notifications.map((notification: any) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </div>
  );
}
