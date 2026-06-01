import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';

interface EventCardProps {
  event: {
    id: string;
    titleAr?: string;
    titleEn?: string;
    category: string;
    location?: string;
    startAt: string;
    attendees?: Array<{ status: string }>;
    neighborhood?: { nameAr: string; nameEn: string };
    myRsvp?: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const title = isAr ? (event.titleAr || event.titleEn || '') : (event.titleEn || event.titleAr || '');
  const goingCount = event.attendees?.filter((a) => a.status === 'GOING').length || 0;

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/events`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs text-primary font-bold">
            {new Date(event.startAt).toLocaleDateString(isAr ? 'ar' : 'en', { day: 'numeric' })}
          </span>
          <span className="text-xs text-primary/70">
            {new Date(event.startAt).toLocaleDateString(isAr ? 'ar' : 'en', { month: 'short' })}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-2">{title}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
            <Calendar size={11} />
            <span>{formatDateTime(event.startAt, i18n.language)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-text-muted">
              <MapPin size={11} />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Users size={11} />
              <span>{goingCount} {t('event.going')}</span>
            </div>
            <span className="badge bg-blue-100 text-blue-700 text-xs">
              {t(`event.categories.${event.category}`, { defaultValue: event.category })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
