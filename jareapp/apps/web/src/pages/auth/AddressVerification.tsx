import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, ArrowRight } from 'lucide-react';

export default function AddressVerification() {
  const [block, setBlock] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Address is optional — store locally or send to backend
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{t('auth.address')}</h2>
              <p className="text-xs text-text-muted">{t('auth.step', { current: 3, total: 3 })}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
            <p className="text-sm text-blue-700">{t('auth.addressPrivacy')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('auth.block')}</label>
              <input type="text" value={block} onChange={(e) => setBlock(e.target.value)} className="input-field" placeholder="e.g. 5" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('auth.street')}</label>
              <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="input-field" placeholder="e.g. 10" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('auth.house')}</label>
              <input type="text" value={house} onChange={(e) => setHouse(e.target.value)} className="input-field" placeholder="e.g. 15" dir="ltr" />
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              {t('auth.verifyAddress')}
              <ArrowRight size={18} />
            </button>

            <button type="button" onClick={() => navigate('/', { replace: true })} className="w-full text-center text-text-muted text-sm hover:text-primary transition-colors">
              {t('auth.skipForNow')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
