import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ username, password });
      if (data?.token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Ответ сервера без токена');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Неверный логин или пароль';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 p-8 shadow-xl">
        <h1 className="mb-1 text-center text-xl font-semibold tracking-tight text-slate-100">
          Админ-панель
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500">Династия · служебный вход</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-username" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Ник
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-slate-500 focus:border-slate-500 focus:ring-1"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-slate-100 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
