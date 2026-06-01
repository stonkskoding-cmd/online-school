import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import PackageDetail from './pages/PackageDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminChatPage from './pages/AdminChatPage';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import ChatButton from './components/chat/ChatButton';

export default function App() {
  return (
    <>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/packages" element={<LandingPage />} />
        <Route path="/package/:id" element={<PackageDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/purchases" element={<Dashboard />} />

        {/* Админка */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatButton />
    </>
  );
}
