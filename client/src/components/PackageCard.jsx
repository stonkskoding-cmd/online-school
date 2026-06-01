import { useState } from 'react';
import { purchasesApi } from '../api';

const CATEGORY_LABELS = {
  'OGE-IST': 'ОГЭ История',
  'EGE-IST': 'ЕГЭ История',
  'EGE-SOC': 'ЕГЭ Обществознание',
};

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

export default function PackageCard({ item, isAuthorized, onNeedAuth }) {
  const [expanded, setExpanded] = useState(false);
  const materials = normalizeMaterials(item.materials);

  const buy = async (e) => {
    e.stopPropagation();
    if (!isAuthorized) {
      onNeedAuth();
      return;
    }

    try {
      await purchasesApi.create(item.id);
      alert('Пакет добавлен в покупки');
    } catch (error) {
      alert(error?.response?.data?.message || 'Не удалось купить пакет');
    }
  };

  const toggleExpand = () => setExpanded((v) => !v);

  return (
    <article
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ${
        expanded ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:-translate-y-0.5 hover:shadow-lg'
      }`}
    >
      {item.coverUrl ? (
        <button type="button" onClick={toggleExpand} className="block w-full text-left">
          <img
            src={item.coverUrl}
            alt=""
            className="h-40 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </button>
      ) : null}

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={toggleExpand} className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
              {CATEGORY_LABELS[item.category] || item.category}
            </p>
            <h3 className="mt-0.5 text-xl font-bold text-gray-900">{item.title}</h3>
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

              <p className="text-2xl font-extrabold text-accent-500">
                {item.price.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {!expanded ? (
            <span className="text-2xl font-extrabold text-accent-500">
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {expanded ? 'Скрыть' : 'Подробнее'}
            </button>
            <button
              type="button"
              onClick={buy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light"
            >
              Купить
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
