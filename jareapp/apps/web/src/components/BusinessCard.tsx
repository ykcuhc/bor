import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, MapPin } from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    nameAr: string;
    nameEn?: string;
    category: string;
    images?: string[];
    averageRating: number;
    reviewCount: number;
    address?: string;
    isVerified?: boolean;
    neighborhood?: { nameAr: string; nameEn: string };
  };
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const name = isAr ? business.nameAr : (business.nameEn || business.nameAr);
  const neighborhood = business.neighborhood
    ? (isAr ? business.neighborhood.nameAr : business.neighborhood.nameEn)
    : '';

  return (
    <div
      className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/businesses/${business.id}`)}
    >
      <div className="h-32 bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
        {business.images?.[0] ? (
          <img src={business.images[0]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🏪</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-1">{name}</h3>
          {business.isVerified && (
            <span className="badge bg-green-100 text-green-700 text-xs flex-shrink-0">✓</span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {t(`business.categories.${business.category}`, { defaultValue: business.category })}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-accent fill-accent" />
            <span className="text-xs font-medium">{business.averageRating.toFixed(1)}</span>
            <span className="text-xs text-text-muted">({business.reviewCount})</span>
          </div>
          {neighborhood && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin size={10} />
              <span className="truncate max-w-[80px]">{neighborhood}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
