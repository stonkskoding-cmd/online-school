import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { purchasesApi } from '../api';
import Header from '../components/Header';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);
        const response = await purchasesApi.list();
        setItems(response.data.purchases ?? []);
      } catch (_error) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onAuthSuccess={setUser} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Мои покупки</h1>

        {loading ? <p className="text-gray-600">Загрузка покупок...</p> : null}

        {!loading && items.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="mb-3 text-gray-700">У вас пока нет покупок</p>
            <Link to="/" className="font-semibold text-primary hover:text-primary-dark">
              Перейти к выбору пакетов
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4">
          {items.map((purchase) => (
            <div key={purchase.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">{purchase.package?.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{purchase.package?.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-accent-500">
                  {(purchase.package?.price ?? 0).toLocaleString('ru-RU')} ₽
                </span>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light">
                  Открыть
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
