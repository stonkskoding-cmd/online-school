import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { packagesApi } from '../api';
import Header from '../components/Header';

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await packagesApi.getById(id);
        if (!cancelled) setPkg(data.package ?? data);
      } catch {
        if (!cancelled) setError('Пакет не найден');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onAuthSuccess={setUser} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/#catalog" className="mb-6 inline-block text-sm text-primary hover:underline">
          ← К каталогу
        </Link>
        {loading ? <p className="text-gray-600">Загрузка…</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        {pkg ? (
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {pkg.coverUrl ? (
              <img src={pkg.coverUrl} alt="" className="mb-4 max-h-64 w-full rounded-xl object-cover" />
            ) : null}
            <h1 className="text-2xl font-bold text-gray-900">{pkg.title}</h1>
            <p className="mt-2 text-sm text-gray-500">{pkg.category}</p>
            <p className="mt-4 text-gray-700">{pkg.description}</p>
            <p className="mt-6 text-3xl font-extrabold text-accent-500">
              {Number(pkg.price).toLocaleString('ru-RU')} ₽
            </p>
          </article>
        ) : null}
      </main>
    </div>
  );
}
