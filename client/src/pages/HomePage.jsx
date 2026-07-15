import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { packagesApi } from '../api';
import Header from '../components/Header';
import Reveal from '../components/Reveal';
import { resolveCurrentUser } from '../utils/session';

const PackageCard = lazy(() => import('../components/PackageCard'));

const categories = [
  { label: 'Все', value: '' },
  { label: 'ЕГЭ История', value: 'EGE-IST' },
  { label: 'ЕГЭ Обществознание', value: 'EGE-SOC' },
  { label: 'ОГЭ Обществознание', value: 'OGE-IST' },
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

  // При первом открытии лендинга — всегда сверху (гасим браузерное восстановление
  // позиции, которое из-за асинхронной догрузки каталога роняло страницу в середину)
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const hasCategory = Boolean(new URLSearchParams(window.location.search).get('category'));
    if (!hasCategory) {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeCategory]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError('');
      if (packages.length === 0) {
        setLoading(true);
      }
      try {
        const response = await packagesApi.list(activeCategory);
        if (!cancelled) {
          setPackages(response.data.packages ?? []);
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить пакеты');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const hasPackages = useMemo(() => packages.length > 0, [packages.length]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Header
        user={user}
        onAuthSuccess={setUser}
        forceOpenAuth={authModalTrigger}
        authInitialMode={authModalMode}
      />

      <div className="rise-in relative w-full overflow-hidden">
        <img
          src="/hero-banner-royal.png"
          alt="Баннер Династия"
          className="h-auto w-full object-contain"
          decoding="async"
          fetchpriority="high"
        />
        {/* Кнопка "ВЫБРАТЬ КУРС" */}
        <div className="hero-cta-btn absolute left-1/2 z-20 -translate-x-1/2">
          <div className="rise-in rise-in--d2">
            <img
              src="/gold-button.png"
              alt="Выбрать курс"
              onClick={() => {
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-gold-interactive"
            />
          </div>
        </div>
      </div>

      <Reveal
        as="section"
        className="brand-surface border-t border-white/10 px-3 py-8 sm:px-4 sm:py-12 md:hidden"
      >
        <h2 className="relative z-10 text-center text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:text-3xl">
          Когда готовиться к экзаменам легко
        </h2>
        <ul className="relative z-10 mx-auto mt-6 max-w-lg space-y-4">
          {mobileBenefits.map((item) => (
            <li key={item.text} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 text-white">
              <span className="shrink-0 text-2xl" aria-hidden>
                {item.icon}
              </span>
              <span className="text-sm leading-relaxed sm:text-base">{item.text}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal
        as="section"
        className="relative hidden w-full md:block"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 420px' }}
      >
        <img
          src="/features-banner.png"
          alt="Преимущества онлайн-школы Династия"
          className="h-auto w-full max-w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </Reveal>

      <main id="catalog" className="catalog-section mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-[min(92vw,1600px)] lg:px-10 xl:px-14">
        <Reveal className="mb-8 text-center md:mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark sm:text-3xl lg:text-4xl">
            Каталог курсов
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
            Выберите направление подготовки к ЕГЭ или ОГЭ
          </p>
        </Reveal>

        <Reveal className="-mx-1 mb-8 overflow-x-auto px-1 pb-1" delay={90}>
          {/* w-max + min-w-full: если чипсы помещаются — центр, если нет — скролл с начала
              (justify-center в overflow-контейнере обрезал левый чип без возможности доскроллить) */}
          <div className="flex w-max min-w-full flex-nowrap justify-center gap-2 whitespace-nowrap">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={`catalog-chip ${
                  activeCategory === category.value ? 'catalog-chip--active' : 'catalog-chip--idle'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </Reveal>

        {loading && !hasPackages ? (
          <p className="text-sm text-gray-600 sm:text-base">Загрузка...</p>
        ) : null}
        {error ? <p className="text-sm text-red-600 sm:text-base">{error}</p> : null}
        {!loading && !hasPackages ? (
          <p className="text-sm text-gray-600 sm:text-base">Пакеты пока не добавлены</p>
        ) : null}

        <Suspense
          fallback={
            <div className="catalog-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm lg:h-80"
                  aria-hidden
                />
              ))}
            </div>
          }
        >
          <div className="catalog-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((item, index) => (
              <div
                key={item.id}
                className="card-enter"
                style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
              >
                <PackageCard
                  item={item}
                  isAuthorized={Boolean(user)}
                  onNeedAuth={() => setAuthModalTrigger((value) => value + 1)}
                />
              </div>
            ))}
          </div>
        </Suspense>
      </main>
    </div>
  );
}
