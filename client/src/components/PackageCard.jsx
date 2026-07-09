import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchasesApi } from '../api';

const CATEGORY_LABELS = {
  'OGE-IST': 'ОГЭ Обществознание',
  'EGE-IST': 'ЕГЭ История',
  'EGE-SOC': 'ЕГЭ Обществознание',
};

const PURCHASE_ANIMATION_MS = 1000;
const SUCCESS_MESSAGE_MS = 2000;

function materialIcon(type) {
  if (type === 'video') return '🎥';
  if (type === 'text') return '📝';
  if (type === 'image') return '🖼️';
  return '📎';
}

function normalizeMaterials(raw) {
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function PackageCard({ item, isAuthorized, onNeedAuth }) {
  const navigate = useNavigate();
  const redirectTimerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const materials = normalizeMaterials(item.materials);

  useEffect(() => {
    if (!isPurchased) {
      setSuccessVisible(false);
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSuccessVisible(true));
    });

    redirectTimerRef.current = setTimeout(() => {
      navigate('/my-purchases');
    }, SUCCESS_MESSAGE_MS);

    return () => {
      cancelAnimationFrame(frame);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [isPurchased, navigate]);

  const buy = async (e) => {
    e.stopPropagation();
    if (isPurchasing || isPurchased) return;

    if (!isAuthorized) {
      onNeedAuth();
      return;
    }

    setIsPurchasing(true);

    try {
      await Promise.all([purchasesApi.create(item.id), delay(PURCHASE_ANIMATION_MS)]);
      setIsPurchasing(false);
      setIsPurchased(true);
    } catch (error) {
      setIsPurchasing(false);
      alert(error?.response?.data?.message || 'Не удалось купить пакет');
    }
  };

  const toggleExpand = () => setExpanded((v) => !v);

  const cardStateClass = isPurchasing
    ? 'scale-105 animate-pulse shadow-xl'
    : expanded
      ? 'ring-2 ring-primary/20 shadow-lg'
      : 'hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg';

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${cardStateClass}`}
    >
      {isPurchased ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/95 px-4 text-center backdrop-blur-[1px]"
          aria-live="polite"
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 transition-opacity duration-300 ease-in-out ${
              successVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <svg
              className="h-9 w-9 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p
            className={`text-base font-semibold text-emerald-700 transition-opacity duration-300 ease-in-out delay-100 ${
              successVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ✅ Покупка успешна!
          </p>
        </div>
      ) : null}

      {item.coverUrl ? (
        <button type="button" onClick={toggleExpand} className="block w-full text-left">
          <img
            src={item.coverUrl}
            alt=""
            className="h-40 w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </button>
      ) : null}

      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={toggleExpand} className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
              {CATEGORY_LABELS[item.category] || item.category}
            </p>
            <h3 className="mt-0.5 text-base font-bold text-gray-900 sm:text-lg md:text-xl">{item.title}</h3>
          </button>
          <button
            type="button"
            onClick={toggleExpand}
            className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-primary"
            aria-expanded={expanded}
            aria-label={expanded ? 'Свернуть' : 'Подробнее'}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {!expanded ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.description}</p>
        ) : null}

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            expanded ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Описание</h4>
                <p className="text-sm leading-relaxed text-gray-700">{item.description || '—'}</p>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Материалы ({materials.length})
                </h4>
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500">Материалы скоро появятся</p>
                ) : (
                  <ul className="space-y-2">
                    {materials.map((m, i) => (
                      <li
                        key={`${m.order ?? i}-${m.title ?? i}`}
                        className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="shrink-0">{materialIcon(m.type)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900">{m.title || `Материал ${i + 1}`}</span>
                          {m.type === 'text' && m.content ? (
                            <p className="mt-0.5 line-clamp-3 text-xs text-gray-600">{m.content}</p>
                          ) : null}
                          {m.url ? (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 block truncate text-xs text-primary underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Открыть
                            </a>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-lg font-extrabold text-accent-500 sm:text-xl md:text-2xl">
                {item.price.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {!expanded ? (
            <span className="text-lg font-extrabold text-accent-500 sm:text-xl md:text-2xl">
              {item.price.toLocaleString('ru-RU')} ₽
            </span>
          ) : (
            <button
              type="button"
              onClick={toggleExpand}
              className="text-sm font-medium text-primary hover:underline"
            >
              Свернуть
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleExpand}
              disabled={isPurchasing || isPurchased}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
            >
              {expanded ? 'Скрыть' : 'Подробнее'}
            </button>
            <button
              type="button"
              onClick={buy}
              disabled={isPurchasing || isPurchased}
              className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm"
            >
              {isPurchasing ? 'Покупка…' : isPurchased ? 'Куплено' : 'Купить'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(PackageCard);
