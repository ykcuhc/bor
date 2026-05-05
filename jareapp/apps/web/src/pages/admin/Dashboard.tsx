import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, ShoppingBag, Shield, TrendingUp } from 'lucide-react';
import api from '../../utils/api';
import { SkeletonCard } from '../../components/Skeleton';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  if (isLoading) return <div className="p-4"><SkeletonCard /></div>;

  const statCards = [
    { icon: Users, label: t('admin.totalUsers'), value: stats?.totalUsers || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: t('admin.activeToday'), value: stats?.activeToday || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { icon: FileText, label: t('admin.totalPosts'), value: stats?.totalPosts || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: AlertTriangle, label: t('admin.pendingReports'), value: stats?.pendingReports || 0, color: 'text-red-500', bg: 'bg-red-50' },
    { icon: AlertTriangle, label: t('admin.totalAlerts'), value: stats?.totalAlerts || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: ShoppingBag, label: t('admin.totalBusinesses'), value: stats?.totalBusinesses || 0, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Shield size={20} className="text-danger" />
          {t('admin.dashboard')}
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="card p-4">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-text-primary">{card.value.toLocaleString()}</p>
              <p className="text-sm text-text-muted mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/admin/reports')} className="card p-4 text-start hover:shadow-md transition-shadow">
            <AlertTriangle size={20} className="text-danger mb-2" />
            <p className="font-semibold text-sm">{t('admin.reports')}</p>
            <p className="text-xs text-text-muted">{stats?.pendingReports || 0} {t('admin.pending')}</p>
          </button>
          <button onClick={() => navigate('/admin/users')} className="card p-4 text-start hover:shadow-md transition-shadow">
            <Users size={20} className="text-primary mb-2" />
            <p className="font-semibold text-sm">{t('admin.users')}</p>
            <p className="text-xs text-text-muted">{stats?.newUsersThisWeek || 0} {t('admin.newThisWeek')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
