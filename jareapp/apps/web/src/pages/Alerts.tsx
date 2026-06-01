import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldAlert, Zap, Info } from 'lucide-react';
import api from '../utils/api';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { formatRelativeTime } from '../utils/helpers';

const SEVERITY_CONFIG = {
  CRITICAL: { bg: 'border-danger bg-red-50', badge: 'bg-danger text-white', icon: ShieldAlert },
  HIGH: { bg: 'border-warning bg-orange-50', badge: 'bg-warning text-white', icon: AlertTriangle },
  MEDIUM: { bg: 'border-yellow-400 bg-yellow-50', badge: 'bg-yellow-400 text-white', icon: Zap },
  LOW: { bg: 'border-blue-400 bg-blue-50', badge: 'bg-blue-400 text-white', icon: Info },
};

export default function Alerts() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const alerts = data?.alerts || data || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <AlertTriangle size={20} className="text-danger" />
          {t('nav.alerts')}
        </h1>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : alerts.length === 0 ? (
          <EmptyState title={t('alerts.empty')} message={t('alerts.emptyMessage')} />
        ) : (
          alerts.map((alert: any) => {
            const config = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.LOW;
            const Icon = config.icon;
            const title = isAr ? (alert.titleAr || alert.titleEn) : (alert.titleEn || alert.titleAr);
            const description = isAr ? (alert.descriptionAr || alert.descriptionEn) : (alert.descriptionEn || alert.descriptionAr);

            return (
              <div key={alert.id} className={`border-2 ${config.bg} rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <Icon size={20} className="flex-shrink-0 mt-0.5 text-current" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`badge ${config.badge} text-xs`}>
                        {t(`alert.severity.${alert.severity}`, { defaultValue: alert.severity })}
                      </span>
                      <span className="badge bg-gray-200 text-gray-700 text-xs">
                        {t(`alert.types.${alert.type}`, { defaultValue: alert.type })}
                      </span>
                    </div>
                    {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
                    {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
                    <p className="text-xs text-text-muted mt-2">
                      {formatRelativeTime(alert.createdAt, i18n.language)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
