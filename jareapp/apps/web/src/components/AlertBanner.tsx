import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface AlertBannerProps {
  severity: 'CRITICAL' | 'HIGH';
  titleAr: string;
  titleEn?: string;
  alertId: string;
}

export default function AlertBanner({ severity, titleAr, titleEn, alertId }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  if (dismissed) return null;

  const isCritical = severity === 'CRITICAL';
  const bgClass = isCritical ? 'bg-danger' : 'bg-warning';
  const title = isAr ? titleAr : (titleEn || titleAr);

  return (
    <div className={`${bgClass} text-white px-4 py-3 flex items-center gap-3 cursor-pointer`}
         onClick={() => navigate('/alerts')}>
      <AlertTriangle size={20} className="flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold">
          {isCritical ? t('alert.critical') : t('alert.urgent')}: {title}
        </span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
