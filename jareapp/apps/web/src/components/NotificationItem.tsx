import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    titleAr?: string;
    titleEn?: string;
    bodyAr?: string;
    bodyEn?: string;
    isRead: boolean;
    createdAt: string;
  };
  onClick?: () => void;
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const title = isAr ? notification.titleAr : (notification.titleEn || notification.titleAr);
  const body = isAr ? notification.bodyAr : (notification.bodyEn || notification.bodyAr);

  return (
    <div
      className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.isRead ? 'bg-blue-50/50' : ''
      }`}
      onClick={onClick}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        !notification.isRead ? 'bg-primary/10' : 'bg-gray-100'
      }`}>
        <Bell size={16} className={!notification.isRead ? 'text-primary' : 'text-text-muted'} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-text-primary line-clamp-1">{title}</p>
        )}
        {body && (
          <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{body}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          {formatRelativeTime(notification.createdAt, i18n.language)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}
