import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

export default function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <AuthModal
        isOpen
        initialMode={mode}
        onClose={() => navigate('/', { replace: true })}
        onSuccess={() => navigate('/', { replace: true })}
      />
      <p className="fixed bottom-4 text-center text-sm text-gray-500">
        <button
          type="button"
          className="text-primary underline"
          onClick={() => navigate('/', { replace: true })}
        >
          ← На главную
        </button>
      </p>
    </div>
  );
}
