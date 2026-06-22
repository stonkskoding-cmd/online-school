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

const mobileBenefits = [
  { icon: '📚', text: 'Структурированные материалы по каждой теме экзамена' },
  { icon: '👨‍🏫', text: 'Опытные преподаватели и понятные объяснения' },
  { icon: '⏱️', text: 'Удобный темп подготовки — учитесь в своём ритме' },
  { icon: '✅', text: 'Практика и разбор типовых заданий ЕГЭ и ОГЭ' },
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

  const scrollToCatalog = () => {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Header
        user={user}
        onAuthSuccess={setUser}
        forceOpenAuth={authModalTrigger}
        authInitialMode={authModalMode}
      />

      <div className="relative w-full overflow-hidden">
        <img
          src="/hero-banner-royal.png"
          alt="Баннер Династия"
          className="h-auto w-full object-contain"
        />
        <img
          src="/gold-button.png"
          className="absolute left-1/2 z-10 -translate-x-1/2 cursor-pointer transition-all duration-300 hover:scale-105 hover:drop-shadow-2xl"
          style={{
            bottom: '3%',
            width: 'min(90vw, 700px)',
            height: 'auto',
            maxWidth: '700px',
          }}
          onClick={scrollToCatalog}
          alt="Выбрать курс"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToCatalog();
            }
          }}
        />
      </div>

      <section className="bg-gradient-to-b from-primary-dark to-primary px-3 py-8 sm:px-4 sm:py-12 md:hidden">
        <h2 className="text-center text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-3xl">
          Когда готовиться к экзаменам легко
        </h2>
        <ul className="mx-auto mt-6 max-w-lg space-y-4">
          {mobileBenefits.map((item) => (
            <li key={item.text} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 text-white">
              <span className="shrink-0 text-2xl" aria-hidden>
                {item.icon}
              </span>
              <span className="text-sm leading-relaxed sm:text-base">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative hidden w-full md:block">
        <img
          src="/features-banner.png"
          alt="Преимущества онлайн-школы Династия"
          className="h-auto w-full max-w-full object-cover"
        />
      </section>

      <main id="catalog" className="w-full px-3 py-8 sm:px-4 sm:py-12 md:px-8 md:py-16 lg:px-16">
        <div className="-mx-1 mb-6 overflow-x-auto px-1 pb-1">
          <div className="flex flex-nowrap gap-2 whitespace-nowrap sm:flex-wrap">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 sm:text-base ${
                  activeCategory === category.value
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-primary/10'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-gray-600 sm:text-base">Загрузка...</p> : null}
        {error ? <p className="text-sm text-red-600 sm:text-base">{error}</p> : null}
        {!loading && !hasPackages ? (
          <p className="text-sm text-gray-600 sm:text-base">Пакеты пока не добавлены</p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
