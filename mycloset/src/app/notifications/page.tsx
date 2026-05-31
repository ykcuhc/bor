'use client';

import Link from 'next/link';
import { Bell, Heart, MessageCircle, Tag, UserPlus, ShoppingBag, Share2 } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '@/lib/mockData';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  new_like:        { icon: Heart,         color: 'bg-red-50    text-red-500' },
  new_comment:     { icon: MessageCircle, color: 'bg-blue-50   text-blue-500' },
  new_offer:       { icon: Tag,           color: 'bg-amber-50  text-amber-500' },
  offer_accepted:  { icon: Tag,           color: 'bg-green-50  text-green-500' },
  offer_declined:  { icon: Tag,           color: 'bg-gray-50   text-gray-500' },
  new_follower:    { icon: UserPlus,      color: 'bg-purple-50 text-purple-500' },
  item_sold:       { icon: ShoppingBag,   color: 'bg-green-50  text-green-600' },
  new_share:       { icon: Share2,        color: 'bg-brand-50  text-brand-600' },
};

const NOTIFICATION_LABELS: Record<string, string> = {
  new_like:       'liked your listing',
  new_comment:    'commented on your listing',
  new_offer:      'sent you an offer',
  offer_accepted: 'accepted your offer',
  offer_declined: 'declined your offer',
  new_follower:   'started following you',
  item_sold:      'purchased your item',
  new_share:      'shared your listing',
};

export default function NotificationsPage() {
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs font-bold px-2.5 py-0.5 bg-brand-600 text-white rounded-full">
              {unread} new
            </span>
          )}
        </div>
        <button className="text-sm text-brand-600 hover:underline font-medium">Mark all read</button>
      </div>

      {MOCK_NOTIFICATIONS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500">We&apos;ll notify you when people like, comment, or make offers on your items.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {MOCK_NOTIFICATIONS.map(notification => {
            const meta = NOTIFICATION_ICONS[notification.type] ?? NOTIFICATION_ICONS.new_like;
            const Icon = meta.icon;
            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border transition-all',
                  !notification.read
                    ? 'bg-brand-50/50 border-brand-100'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                )}
              >
                {/* Actor avatar */}
                <Link href={`/closet/${notification.actor.username}`} className="flex-shrink-0">
                  <img
                    src={notification.actor.avatar}
                    alt={notification.actor.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </Link>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    <Link href={`/closet/${notification.actor.username}`} className="font-bold hover:text-brand-600">
                      @{notification.actor.username}
                    </Link>{' '}
                    {NOTIFICATION_LABELS[notification.type]}
                    {notification.listing && (
                      <>
                        {' '}
                        <Link href={`/listings/${notification.listingId}`} className="font-medium text-brand-600 hover:underline">
                          {notification.listing.title}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                </div>

                {/* Listing thumbnail */}
                {notification.listing?.images?.[0] && (
                  <Link href={`/listings/${notification.listingId}`} className="flex-shrink-0">
                    <img
                      src={notification.listing.images[0]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </Link>
                )}

                {/* Type icon badge */}
                <div className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs', meta.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Unread dot */}
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
