import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, FileText, AlertTriangle, Calendar, Crown } from 'lucide-react';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import { SkeletonCard } from '../components/Skeleton';
import { useAuthStore } from '../store/authStore';

export default function Neighborhood() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthStore();

  const { data: neighborhoodData, isLoading } = useQuery({
    queryKey: ['neighborhood', user?.neighborhoodId],
    queryFn: () => api.get(`/neighborhoods/${user?.neighborhoodId}`).then((r) => r.data.data),
    enabled: !!user?.neighborhoodId,
  });

  const { data: champions } = useQuery({
    queryKey: ['champions'],
    queryFn: () => api.get('/users/neighborhood-champions').then((r) => r.data.data),
  });

  if (!user?.neighborhoodId) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-16">
        <MapPin size={48} className="text-text-muted mx-auto mb-3" />
        <h2 className="font-semibold text-text-primary">{t('neighborhood.notSet')}</h2>
        <p className="text-text-muted text-sm mt-1">{t('neighborhood.notSetMessage')}</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-4"><SkeletonCard /></div>;

  const neighborhood = neighborhoodData?.neighborhood || neighborhoodData;
  const stats = neighborhoodData?.stats || {};
  const name = isAr ? neighborhood?.nameAr : neighborhood?.nameEn;
  const governorateName = isAr ? neighborhood?.governorate?.nameAr : neighborhood?.governorate?.nameEn;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <MapPin size={20} className="text-primary" />
          {t('nav.neighborhood')}
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero */}
        <div className="card p-5 bg-gradient-to-br from-primary to-primary-light text-white">
          <p className="text-white/70 text-sm mb-1">{governorateName}</p>
          <h2 className="text-2xl font-bold">{name}</h2>
          <div className="flex items-center gap-1 mt-2 text-white/80 text-sm">
            <Users size={14} />
            <span>{neighborhood?.users?.length || stats.memberCount || 0} {t('neighborhood.members')}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FileText, label: t('neighborhood.postsThisWeek'), value: stats.postsThisWeek || 0 },
            { icon: AlertTriangle, label: t('neighborhood.activeAlerts'), value: stats.activeAlerts || 0 },
            { icon: Calendar, label: t('neighborhood.upcomingEvents'), value: stats.upcomingEvents || 0 },
          ].map((stat) => (
            <div key={stat.label} className="card p-3 text-center">
              <stat.icon size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Champions */}
        {champions && champions.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Crown size={18} className="text-accent" />
              {t('neighborhood.champions')}
            </h3>
            <div className="space-y-3">
              {champions.map((champion: any) => (
                <div key={champion.id} className="flex items-center gap-3">
                  <Avatar src={champion.avatarUrl} name={champion.displayName || champion.firstName} />
                  <div>
                    <p className="font-medium text-sm">{champion.displayName || champion.firstName}</p>
                    <p className="text-xs text-text-muted">{t('neighborhood.champion')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
