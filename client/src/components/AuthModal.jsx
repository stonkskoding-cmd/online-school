import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const response = await authApi.register({ email, password });
        localStorage.removeItem('adminToken');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onSuccess(response.data.user);
        onClose();
        navigate('/dashboard', { replace: true });
        return;
      }

      const trimmed = identifier.trim();
      const payload =
        trimmed.includes('@')
          ? { email: trimmed, password }
          : { username: trimmed, password };

      const response = await authApi.login(payload);
      const { data } = response;
      const role = data.role ?? data.user?.role;

      if (role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        if (data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onSuccess(data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          onSuccess(null);
        }
        onClose();
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      localStorage.removeItem('adminToken');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onSuccess(data.user);
      onClose();
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
  };

  const switchToRegister = () => {
    setMode('register');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={switchToLogin}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={switchToRegister}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Регистрация
            </button>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Закрыть">
            ✕
          </button>
        </div>

        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
        </h2>

        <form noValidate onSubmit={submit} className="space-y-4">
          {mode === 'login' ? (
            <div>
              <label htmlFor="auth-identifier" className="mb-1 block text-sm font-medium text-gray-700">
                Email или Логин
              </label>
              <input
                id="auth-identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Например: test@mail.ru или dinastia_admin"
                required
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Для входа в админ-панель используйте специальный логин
              </p>
            </div>
          ) : (
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            />
          )}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => (mode === 'login' ? switchToRegister() : switchToLogin())}
          className="mt-4 text-sm text-primary hover:text-primary-dark"
        >
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}
