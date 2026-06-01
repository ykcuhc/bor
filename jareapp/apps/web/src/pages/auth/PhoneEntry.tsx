import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, ArrowRight, Globe } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export default function PhoneEntry() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setPendingPhone } = useAuthStore();
  const { language, setLanguage } = useAppStore();

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('965')) return `+${digits}`;
    return digits.length > 0 ? `+965${digits}` : '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formatted = formatPhone(phone);
    if (formatted.length < 12) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-otp', { phone: formatted });
      setPendingPhone(formatted);
      navigate('/auth/otp');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Language toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            <Globe size={16} />
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-4xl">ج</span>
          </div>
          <h1 className="text-3xl font-bold text-white">جار آب</h1>
          <p className="text-white/80 mt-1 text-sm">JareApp</p>
          <p className="text-white/60 text-xs mt-1">{t('auth.terms')}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.continueWith')}</h2>
          <p className="text-text-muted text-sm mb-4">{t('auth.phoneHelp')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('auth.phone')}
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm font-medium text-text-secondary">
                  🇰🇼 +965
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="XXXX XXXX"
                  className="input-field flex-1"
                  maxLength={12}
                  dir="ltr"
                />
              </div>
              {error && <p className="text-danger text-xs mt-1">{error}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.sendOtp')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-4">
            {t('auth.terms')}
          </p>
        </div>
      </div>
    </div>
  );
}
