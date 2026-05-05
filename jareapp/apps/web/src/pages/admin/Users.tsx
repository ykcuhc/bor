import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Ban, Crown, UserCheck } from 'lucide-react';
import api from '../../utils/api';
import Avatar from '../../components/Avatar';
import { SkeletonList } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { formatRelativeTime } from '../../utils/helpers';

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined } }).then((r) => r.data.data),
  });

  const banUser = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch(`/admin/users/${id}/ban`, { banned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const promoteUser = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/promote`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.users || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="rtl-flip" />
          </button>
          <h1 className="font-semibold text-text-primary">{t('admin.users')}</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchUsers')}
            className="input-field ps-9"
          />
        </div>
      </div>

      <div className="p-4">
        {isLoading ? <SkeletonList count={5} /> : users.length === 0 ? (
          <EmptyState title={t('admin.noUsers')} />
        ) : (
          <div className="space-y-2">
            {users.map((user: any) => (
              <div key={user.id} className="card p-3 flex items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.displayName || user.firstName || 'U'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{user.displayName || user.firstName}</p>
                    {user.role === 'NEIGHBORHOOD_CHAMPION' && <Crown size={12} className="text-accent" />}
                    {!user.isActive && <span className="badge bg-red-100 text-red-700 text-xs">{t('admin.banned')}</span>}
                  </div>
                  <p className="text-xs text-text-muted" dir="ltr">{user.phone}</p>
                  <p className="text-xs text-text-muted">
                    {user.neighborhood ? (i18n.language === 'ar' ? user.neighborhood.nameAr : user.neighborhood.nameEn) : ''}
                    {user.lastLoginAt && ` · ${formatRelativeTime(user.lastLoginAt, i18n.language)}`}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => banUser.mutate({ id: user.id, banned: user.isActive })}
                    className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'hover:bg-red-50 text-text-muted hover:text-danger' : 'hover:bg-green-50 text-danger hover:text-success'}`}
                    title={user.isActive ? t('admin.banUser') : t('admin.unbanUser')}
                  >
                    {user.isActive ? <Ban size={16} /> : <UserCheck size={16} />}
                  </button>
                  {user.role === 'USER' && (
                    <button
                      onClick={() => promoteUser.mutate({ id: user.id, role: 'NEIGHBORHOOD_CHAMPION' })}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 text-text-muted hover:text-accent transition-colors"
                      title={t('admin.promote')}
                    >
                      <Crown size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
