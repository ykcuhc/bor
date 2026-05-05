import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

interface Governorate { id: string; nameAr: string; nameEn: string; }
interface Neighborhood { id: string; nameAr: string; nameEn: string; }

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { pendingPhone, setAuth } = useAuthStore();

  useEffect(() => {
    if (!pendingPhone) navigate('/auth/phone', { replace: true });
    api.get('/neighborhoods/governorates').then(({ data }) => setGovernorates(data.data || []));
  }, [pendingPhone, navigate]);

  useEffect(() => {
    if (selectedGov) {
      api.get(`/neighborhoods?governorateId=${selectedGov}`).then(({ data }) => {
        setNeighborhoods(data.data?.neighborhoods || data.data || []);
        setSelectedNeighborhood('');
      });
    }
  }, [selectedGov]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName) { setError(t('auth.arabicNameRequired')); return; }
    if (!selectedNeighborhood) { setError(t('auth.selectNeighborhood')); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        phone: pendingPhone,
        firstName,
        lastName,
        neighborhoodId: selectedNeighborhood,
        preferredLanguage: isAr ? 'AR' : 'EN',
      });
      setAuth(data.data.user, data.data.tokens.accessToken, data.data.tokens.refreshToken);
      navigate('/auth/address');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <button onClick={() => navigate('/auth/otp')} className="flex items-center gap-1 text-text-muted hover:text-primary mb-4 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">{t('common.back')}</span>
          </button>

          <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.joinNeighborhood')}</h2>
          <p className="text-text-muted text-sm mb-5">{t('auth.step', { current: 2, total: 3 })}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('auth.arabicName')} *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('auth.arabicNamePlaceholder')}
                className="input-field"
                dir="rtl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('auth.englishName')}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('auth.englishNamePlaceholder')}
                className="input-field"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('auth.selectGovernorate')} *
              </label>
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="input-field"
                required
              >
                <option value="">{t('auth.selectGovernorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {neighborhoods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('auth.selectNeighborhood')} *
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">{t('auth.selectNeighborhood')}</option>
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {isAr ? n.nameAr : n.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="text-danger text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : t('common.continue')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
