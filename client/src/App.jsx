import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PackageDetail from './pages/PackageDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminChatPage from './pages/AdminChatPage';
import AdminFooterSettings from './pages/AdminFooterSettings';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import UserChat from './components/UserChat';
import Footer from './components/Footer';

function AppFooter() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return <Footer />;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Публичные */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/packages" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
        <Route path="/register" element={<Navigate to="/?auth=register" replace />} />
        <Route path="/package/:id" element={<PackageDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/purchases" element={<Dashboard />} />

        {/* Админка (вход — через модалку на главной) */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/login" element={<Navigate to="/" replace />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          }
        />
        <Route
          path="/admin/chat"
          element={
            <PrivateAdminRoute>
              <AdminChatPage />
            </PrivateAdminRoute>
          }
        />
        <Route
          path="/admin/footer-settings"
          element={
            <PrivateAdminRoute>
              <AdminFooterSettings />
            </PrivateAdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AppFooter />
      <UserChat />
    </>
  );
}
