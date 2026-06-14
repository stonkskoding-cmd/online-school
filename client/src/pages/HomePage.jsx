import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { packagesApi } from '../api';
import Header from '../components/Header';
import PackageCard from '../components/PackageCard';
import { resolveCurrentUser } from '../utils/session';

const categories = [
  { label: 'Все', value: '' },
  { label: 'ОГЭ История', value: 'OGE-IST' },
  { label: 'ЕГЭ История', value: 'EGE-IST' },
  { label: 'ЕГЭ Обществознание', value: 'EGE-SOC' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);

  const activeCategory = useMemo(() => {
    const raw = searchParams.get('category') ?? '';
    if (!raw) return '';
    return categories.some((c) => c.value === raw) ? raw : '';
  }, [searchParams]);

  const setActiveCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('category', value);
    } else {
      next.delete('category');
    }
    setSearchParams(next, { replace: true });
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => resolveCurrentUser());
  const [authModalTrigger, setAuthModalTrigger] = useState(0);
  const [authModalMode, setAuthModalMode] = useState('login');

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'login' || auth === 'register') {
      setAuthModalMode(auth);
      setAuthModalTrigger((n) => n + 1);
      const next = new URLSearchParams(searchParams);
      next.delete('auth');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const raw = searchParams.get('category') ?? '';
    if (raw && !categories.some((c) => c.value === raw)) {
      const next = new URLSearchParams(searchParams);
      next.delete('category');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeCategory) return;
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeCategory]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await packagesApi.list(activeCategory);
        setPackages(response.data.packages ?? []);
      } catch (requestError) {
        setError('Не удалось загрузить пакеты');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeCategory]);

  const hasPackages = useMemo(() => packages.length > 0, [packages.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onAuthSuccess={setUser}
        forceOpenAuth={authModalTrigger}
        authInitialMode={authModalMode}
      />

      <section className="relative w-screen min-h-[70vh] overflow-hidden sm:min-h-[85vh] md:min-h-screen">
        <img
          src="/hero-banner-royal.png"
          alt="Hero"
          className="absolute inset-0 z-0 h-full w-full object-cover object-top md:object-center"
        />
        <a
          href="#catalog"
          className="pointer-events-auto absolute bottom-[2%] left-1/2 z-40 w-[min(92vw,1000px)] -translate-x-1/2 translate-y-2 cursor-pointer drop-shadow-2xl transition-all duration-300 hover:scale-105 hover:brightness-110 sm:bottom-[1.2%] sm:w-[min(86vw,1090px)] sm:translate-y-[1.4rem] md:w-[min(86vw,1190px)] lg:w-[min(88vw,1270px)] xl:w-[min(88vw,1350px)]"
        >
          <img src="/gold-button.png" alt="Выбрать курс" className="block h-auto w-full max-h-16 sm:max-h-none" />
        </a>
      </section>

      <section className="relative hidden w-screen sm:block">
        <img
          src="/features-banner.png"
          alt="Преимущества"
          className="h-auto w-full object-cover"
        />
      </section>

      <main id="catalog" className="w-full px-3 py-8 sm:px-6 md:px-8 lg:px-16">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.label}
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === category.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-primary/10'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-gray-600">Загрузка...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        {!loading && !hasPackages ? <p className="text-gray-600">Пакеты пока не добавлены</p> : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((item) => (
            <PackageCard
              key={item.id}
              item={item}
              isAuthorized={Boolean(user)}
              onNeedAuth={() => setAuthModalTrigger((value) => value + 1)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
