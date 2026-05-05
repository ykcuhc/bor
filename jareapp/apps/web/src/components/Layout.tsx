import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Bell, Calendar, ShoppingBag, MessageCircle, Search, Settings, User, AlertTriangle, MapPin, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import Avatar from './Avatar';

const NAV_ITEMS = [
  { to: '/', icon: Home, labelKey: 'nav.feed', end: true },
  { to: '/alerts', icon: AlertTriangle, labelKey: 'nav.alerts' },
  { to: '/events', icon: Calendar, labelKey: 'nav.events' },
  { to: '/businesses', icon: ShoppingBag, labelKey: 'nav.businesses' },
  { to: '/messages', icon: MessageCircle, labelKey: 'nav.messages', badge: 'unreadMessages' as const },
];

export default function Layout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { unreadMessages, unreadNotifications } = useAppStore();
  const navigate = useNavigate();

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-e border-border fixed top-0 bottom-0 start-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ج</span>
            </div>
            <span className="font-bold text-primary text-lg">جار آب</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{t(item.labelKey)}</span>
              {item.badge === 'unreadMessages' && unreadMessages > 0 && (
                <span className="ms-auto bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </NavLink>
          ))}

          <hr className="border-border my-2" />

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative ${
                isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'
              }`
            }
          >
            <Bell size={20} />
            <span className="font-medium text-sm">{t('nav.notifications')}</span>
            {unreadNotifications > 0 && (
              <span className="ms-auto bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/neighborhood"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'
              }`
            }
          >
            <MapPin size={20} />
            <span className="font-medium text-sm">{t('nav.neighborhood')}</span>
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-100'
              }`
            }
          >
            <Search size={20} />
            <span className="font-medium text-sm">{t('nav.search')}</span>
          </NavLink>

          {isAdmin && (
            <>
              <hr className="border-border my-2" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? 'bg-danger text-white' : 'text-danger hover:bg-red-50'
                  }`
                }
              >
                <Shield size={20} />
                <span className="font-medium text-sm">{t('nav.admin')}</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <Avatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.firstName || 'U'}
                size="sm"
              />
              <div className="min-w-0 text-start">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {user?.displayName || user?.firstName}
                </p>
                <p className="text-xs text-text-muted">{user?.phone}</p>
              </div>
            </button>
            <NavLink to="/settings" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings size={18} className="text-text-muted" />
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ms-64 pb-16 lg:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-bottom z-40">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${
                  isActive ? 'text-primary' : 'text-text-muted'
                }`
              }
            >
              <div className="relative">
                <item.icon size={22} />
                {item.badge === 'unreadMessages' && unreadMessages > 0 && (
                  <span className="absolute -top-1 -end-1 bg-danger text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-xs">{t(item.labelKey)}</span>
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            <User size={22} />
            <span className="text-xs">{t('nav.profile')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
