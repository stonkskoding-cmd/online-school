import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PrivateAdminRoute from './components/PrivateAdminRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PackageDetail = lazy(() => import('./pages/PackageDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminChatPage = lazy(() => import('./pages/AdminChatPage'));
const AdminFooterSettings = lazy(() => import('./pages/AdminFooterSettings'));
const UserChat = lazy(() => import('./components/UserChat'));
const Footer = lazy(() => import('./components/Footer'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      Загрузка…
    </div>
  );
}

function AppFooter() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
  );
}

function AppChat() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    const mount = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(mount, { timeout: 2000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(mount, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  if (!ready || pathname.startsWith('/admin')) return null;

  return (
    <Suspense fallback={null}>
      <UserChat />
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Публичные */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/packages" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
          <Route path="/register" element={<Navigate to="/?auth=register" replace />} />
          <Route path="/package/:id" element={<PackageDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/purchases" element={<Dashboard />} />
          <Route path="/my-purchases" element={<Dashboard />} />

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
      </Suspense>
      <AppFooter />
      <AppChat />
    </>
  );
}
