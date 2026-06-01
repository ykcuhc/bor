'use client';

import { Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/context/AuthContext';
import { FeedPostSkeleton } from '@/components/ui/Skeleton';
import type { Notification } from '@/lib/types/notifications';

export default function NotificationsPage() {
  const { profile, isDemoMode } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications(profile?.id ?? '', isDemoMode ?? false);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs bg-brand-600 text-white rounded-full px-2 py-0.5 font-semibold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <FeedPostSkeleton key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-semibold text-gray-700">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">Activity on your posts will appear here</p>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-50">
          {notifications.map(n => (
            <NotificationRow key={n.id} notification={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ notification: n, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const isUnread = !n.read_at;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors ${isUnread ? 'bg-brand-50/60' : 'hover:bg-gray-50'}`}
      onClick={() => { if (isUnread) onRead(n.id); }}
      role={isUnread ? 'button' : undefined}
      tabIndex={isUnread ? 0 : undefined}
      onKeyDown={isUnread ? (e) => { if (e.key === 'Enter' || e.key === ' ') onRead(n.id); } : undefined}
    >
      {n.actor ? (
        <Link href={`/profile/${n.actor.id}`} onClick={e => e.stopPropagation()}>
          <Avatar src={n.actor.avatar_url} name={n.actor.full_name} size="sm" />
        </Link>
      ) : (
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-base">
          🔔
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {n.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
      {isUnread && (
        <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" aria-label="Unread" />
      )}
    </div>
  );
}
