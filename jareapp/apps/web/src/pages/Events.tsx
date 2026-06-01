import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, MapPin, Users, Clock } from 'lucide-react';
import api from '../utils/api';
import EventCard from '../components/EventCard';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatDateTime } from '../utils/helpers';

export default function Events() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ titleAr: '', titleEn: '', descriptionAr: '', location: '', startAt: '', category: 'SOCIAL' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((r) => r.data.data),
  });

  const createEvent = useMutation({
    mutationFn: () => api.post('/events', form),
    onSuccess: () => {
      setShowCreate(false);
      setForm({ titleAr: '', titleEn: '', descriptionAr: '', location: '', startAt: '', category: 'SOCIAL' });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const rsvp = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      api.post(`/events/${eventId}/rsvp`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const events = data?.events || data || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          {t('nav.events')}
        </h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1">
          <Plus size={16} /> {t('event.create')}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : events.length === 0 ? (
          <EmptyState title={t('events.empty')} message={t('events.emptyMessage')}
            action={<button onClick={() => setShowCreate(true)} className="btn-primary">{t('event.create')}</button>} />
        ) : (
          events.map((event: any) => (
            <div key={event.id}>
              <EventCard event={event} />
              <div className="flex gap-2 mt-2 px-1">
                {['GOING', 'MAYBE', 'NOT_GOING'].map((status) => (
                  <button
                    key={status}
                    onClick={() => rsvp.mutate({ eventId: event.id, status })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      event.myRsvp === status
                        ? 'bg-primary text-white'
                        : 'bg-surface border border-border text-text-secondary hover:border-primary'
                    }`}
                  >
                    {t(`event.rsvp.${status.toLowerCase()}`, { defaultValue: status })}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('event.create')} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.titleAr')}</label>
            <input type="text" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="input-field" dir="rtl" placeholder="عنوان الفعالية" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.titleEn')}</label>
            <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="input-field" dir="ltr" placeholder="Event title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.description')}</label>
            <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} className="input-field min-h-[80px] resize-none" dir="rtl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.location')}</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.startTime')}</label>
            <input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('event.category')}</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {['SOCIAL', 'SPORTS', 'EDUCATIONAL', 'CULTURAL', 'RELIGIOUS', 'CHARITY', 'BUSINESS', 'OTHER'].map((c) => (
                <option key={c} value={c}>{t(`event.categories.${c}`, { defaultValue: c })}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button onClick={() => createEvent.mutate()} disabled={createEvent.isPending || !form.titleAr || !form.startAt} className="btn-primary flex-1">
              {createEvent.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('event.create')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
