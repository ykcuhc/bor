import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, Phone, Instagram, Globe, MapPin } from 'lucide-react';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import { SkeletonCard } from '../components/Skeleton';
import { formatRelativeTime } from '../utils/helpers';

export default function BusinessProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get(`/businesses/${id}`).then((r) => r.data.data),
  });

  const addReview = useMutation({
    mutationFn: () => api.post(`/businesses/${id}/review`, { rating, reviewAr: isAr ? reviewText : '', reviewEn: !isAr ? reviewText : '' }),
    onSuccess: () => { setRating(0); setReviewText(''); queryClient.invalidateQueries({ queryKey: ['business', id] }); },
  });

  if (isLoading) return <div className="p-4"><SkeletonCard /></div>;
  if (!data) return null;

  const name = isAr ? data.nameAr : (data.nameEn || data.nameAr);
  const description = isAr ? (data.descriptionAr || data.descriptionEn) : (data.descriptionEn || data.descriptionAr);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary rtl-flip" />
        </button>
        <h1 className="font-semibold text-text-primary truncate">{name}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="card overflow-hidden">
          {data.images?.[0] && (
            <img src={data.images[0]} alt={name} className="w-full h-48 object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{name}</h2>
                <p className="text-text-muted text-sm">{t(`business.categories.${data.category}`, { defaultValue: data.category })}</p>
              </div>
              {data.isVerified && <span className="badge bg-green-100 text-green-700">✓ {t('business.verified')}</span>}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={16} className={s <= Math.round(data.averageRating) ? 'text-accent fill-accent' : 'text-border'} />
              ))}
              <span className="text-sm font-medium">{data.averageRating.toFixed(1)}</span>
              <span className="text-sm text-text-muted">({data.reviewCount} {t('business.reviews')})</span>
            </div>

            {description && <p className="text-text-secondary text-sm mt-3">{description}</p>}

            <div className="mt-4 space-y-2">
              {data.phone && (
                <a href={`tel:${data.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Phone size={16} /> {data.phone}
                </a>
              )}
              {data.address && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={16} /> {data.address}
                </div>
              )}
              {data.website && (
                <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe size={16} /> {data.website}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="card p-4">
          <h3 className="font-semibold text-text-primary mb-3">{t('business.leaveReview')}</h3>
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star size={24} className={s <= rating ? 'text-accent fill-accent' : 'text-border hover:text-accent/50'} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t('business.reviewPlaceholder')}
            className="input-field min-h-[80px] resize-none mb-3"
            dir={isAr ? 'rtl' : 'ltr'}
          />
          <button
            onClick={() => addReview.mutate()}
            disabled={!rating || addReview.isPending}
            className="btn-primary w-full"
          >
            {addReview.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('business.submitReview')}
          </button>
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {data.reviews?.map((review: any) => {
            const reviewContent = isAr ? (review.reviewAr || review.reviewEn) : (review.reviewEn || review.reviewAr);
            return (
              <div key={review.id} className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={review.user?.avatarUrl} name={review.user?.displayName || 'U'} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{review.user?.displayName || review.user?.firstName}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} className={s <= review.rating ? 'text-accent fill-accent' : 'text-border'} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-text-muted ms-auto">{formatRelativeTime(review.createdAt, i18n.language)}</span>
                </div>
                {reviewContent && <p className="text-sm text-text-secondary">{reviewContent}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
