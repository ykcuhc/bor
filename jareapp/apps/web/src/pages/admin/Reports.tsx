import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, CheckCircle, XCircle, Trash2, Ban } from 'lucide-react';
import api from '../../utils/api';
import { SkeletonList } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { formatRelativeTime } from '../../utils/helpers';

export default function AdminReports() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('PENDING');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: () => api.get('/admin/reports', { params: { status } }).then((r) => r.data.data),
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/admin/reports/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const reports = data?.reports || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/admin')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="rtl-flip" />
        </button>
        <h1 className="font-semibold text-text-primary flex items-center gap-2">
          <Flag size={18} className="text-danger" />
          {t('admin.reports')}
        </h1>
      </div>

      <div className="p-4">
        {/* Status tabs */}
        <div className="flex gap-2 mb-4">
          {['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === s ? 'bg-primary text-white' : 'bg-surface border border-border text-text-secondary'
              }`}
            >
              {t(`admin.reportStatus.${s}`, { defaultValue: s })}
            </button>
          ))}
        </div>

        {isLoading ? <SkeletonList count={4} /> : reports.length === 0 ? (
          <EmptyState title={t('admin.noReports')} />
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="badge bg-orange-100 text-orange-700 text-xs">
                      {t(`admin.reportReason.${report.reason}`, { defaultValue: report.reason })}
                    </span>
                    <p className="text-xs text-text-muted mt-1">
                      {t('admin.reportedBy')} {report.reportedBy?.displayName || report.reportedBy?.firstName}
                      {' · '}{formatRelativeTime(report.createdAt, i18n.language)}
                    </p>
                  </div>
                </div>

                {report.post && (
                  <div className="bg-gray-50 rounded-lg p-2 mb-3 text-sm text-text-secondary">
                    <p className="font-medium text-xs text-text-muted mb-1">{t('admin.reportedPost')}</p>
                    <p className="line-clamp-2">{report.post.contentAr || report.post.contentEn}</p>
                  </div>
                )}

                {status === 'PENDING' && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => resolve.mutate({ id: report.id, action: 'dismiss' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-text-secondary text-sm hover:bg-gray-200 transition-colors">
                      <XCircle size={14} /> {t('admin.dismiss')}
                    </button>
                    <button onClick={() => resolve.mutate({ id: report.id, action: 'delete' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm hover:bg-orange-200 transition-colors">
                      <Trash2 size={14} /> {t('admin.deleteContent')}
                    </button>
                    <button onClick={() => resolve.mutate({ id: report.id, action: 'ban' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm hover:bg-red-200 transition-colors">
                      <Ban size={14} /> {t('admin.banUser')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
