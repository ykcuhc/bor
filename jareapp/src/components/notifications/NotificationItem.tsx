import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import type { Notification } from '@/lib/types/notifications';
import { NOTIFICATION_ICONS } from '@/lib/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onRead:       (id: string) => void;
}

export default function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  const isUnread = !n.read_at;
  const icon     = NOTIFICATION_ICONS[n.type];

  // Route to the relevant page when clicked
  const href = n.post_id
    ? `/?post=${n.post_id}`
    : n.actor_id
    ? `/profile/${n.actor_id}`
    : '/';

  return (
    <Link
      href={href}
      onClick={() => isUnread && onRead(n.id)}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
        isUnread ? 'bg-brand-50/60' : ''
      }`}
    >
      {/* Actor avatar or icon fallback */}
      <div className="relative flex-shrink-0">
        {n.actor ? (
          <Avatar src={n.actor.avatar_url} name={n.actor.full_name} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">
            {icon}
          </div>
        )}
        {/* Type icon badge */}
        <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${isUnread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {n.message}
        </p>
        {n.post?.body && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            &ldquo;{(n.post.title ?? n.post.body).slice(0, 60)}&rdquo;
          </p>
        )}
        <time className="text-xs text-gray-400 mt-0.5 block">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </time>
      </div>

      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
      )}
    </Link>
  );
}
