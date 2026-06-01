import { Navigate } from 'react-router-dom';

/** Устаревшие URL — редирект на главную с открытием модалки */
export default function AuthPage({ mode = 'login' }) {
  return <Navigate to={mode === 'register' ? '/?auth=register' : '/?auth=login'} replace />;
}
