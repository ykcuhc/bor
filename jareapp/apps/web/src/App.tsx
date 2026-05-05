import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import Layout from './components/Layout';

// Auth pages
import PhoneEntry from './pages/auth/PhoneEntry';
import OtpVerification from './pages/auth/OtpVerification';
import Register from './pages/auth/Register';
import AddressVerification from './pages/auth/AddressVerification';

// App pages
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Alerts from './pages/Alerts';
import Events from './pages/Events';
import Businesses from './pages/Businesses';
import BusinessProfile from './pages/BusinessProfile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Neighborhood from './pages/Neighborhood';
import Search from './pages/Search';
import Settings from './pages/Settings';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminReports from './pages/admin/Reports';
import AdminUsers from './pages/admin/Users';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/auth/phone" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/auth/phone" replace />;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role || '')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { i18n } = useTranslation();
  const { language } = useAppStore();

  useEffect(() => {
    const lang = language || 'ar';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [language, i18n]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/phone" element={<PhoneEntry />} />
      <Route path="/auth/otp" element={<OtpVerification />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/address" element={<AddressVerification />} />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="events" element={<Events />} />
        <Route path="businesses" element={<Businesses />} />
        <Route path="businesses/:id" element={<BusinessProfile />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:userId" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="neighborhood" element={<Neighborhood />} />
        <Route path="search" element={<Search />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
