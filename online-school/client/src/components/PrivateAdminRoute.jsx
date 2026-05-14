import { Navigate, useLocation } from 'react-router-dom';
import { canAccessAdminRoute } from '../utils/adminAuth';

export default function PrivateAdminRoute({ children }) {
  const location = useLocation();

  if (!canAccessAdminRoute()) {
    return <Navigate to="/admin-login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
