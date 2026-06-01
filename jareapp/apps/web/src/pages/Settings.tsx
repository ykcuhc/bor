import { useTranslation } from 'react-i18next';
import { Globe, Bell, Lock, User, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { disconnectSocket } from '../utils/socket';

export default function Settings() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const navigate = useNavigate();

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate('/auth/phone', { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary">{t('nav.settings')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Language */}
        <div className="card">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{t('settings.language')}</p>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-primary" />
              <span className="font-medium">{language === 'ar' ? 'العربية' : 'English'}</span>
            </div>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="btn-secondary text-sm px-4 py-1.5"
            >
              {language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{t('settings.notifications')}</p>
          </div>
          {[
            { key: 'newPosts', label: t('settings.notif.newPosts') },
            { key: 'alerts', label: t('settings.notif.alerts') },
            { key: 'events', label: t('settings.notif.events') },
            { key: 'messages', label: t('settings.notif.messages') },
            { key: 'comments', label: t('settings.notif.comments') },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-text-secondary" />
                <span className="text-sm">{item.label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={item.key !== 'newPosts'} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Account */}
        <div className="card">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{t('settings.account')}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="flex items-center justify-between w-full px-4 py-3 border-b border-border hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <User size={18} className="text-text-secondary" />
              <span className="text-sm">{t('settings.editProfile')}</span>
            </div>
            <ChevronRight size={16} className="text-text-muted rtl-flip" />
          </button>
          <button onClick={() => navigate('/neighborhood')} className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-text-secondary" />
              <span className="text-sm">{t('settings.privacy')}</span>
            </div>
            <ChevronRight size={16} className="text-text-muted rtl-flip" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-danger w-full flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          {t('auth.logout')}
        </button>

        <p className="text-center text-xs text-text-muted pb-4">JareApp | جار آب v1.0.0</p>
      </div>
    </div>
  );
}
