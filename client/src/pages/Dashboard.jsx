import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { packagesApi, purchasesApi } from '../api';
import Header from '../components/Header';

function sortMaterials(raw) {
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

/** Прямой видеофайл (можно встроить в плеер). Ссылки на страницы (Яндекс Диск,
 * VK, YouTube и т.п.) — не прямые файлы, их открываем ссылкой. */
function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg|mov|m4v|avi|mkv)(\?|$)/i.test(url || '');
}

function MaterialBlock({ material, index }) {
  const title = material.title || `Материал ${index + 1}`;

  if (material.type === 'text') {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {material.content || material.url || '—'}
        </div>
      </div>
    );
  }

  const url = material.url || material.content || '';
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      {material.type === 'video' && url ? (
        isDirectVideoFile(url) ? (
          <video src={url} controls className="max-h-80 w-full rounded-lg bg-black" />
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light"
          >
            ▶ Смотреть видео
          </a>
        )
      ) : material.type === 'image' && url ? (
        <img src={url} alt={title} className="max-h-80 rounded-lg border border-gray-200 object-contain" />
      ) : url ? (
        <a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-primary underline">
          Открыть файл
        </a>
      ) : (
        <p className="text-sm text-gray-500">Материал без ссылки</p>
      )}
    </div>
  );
}

function PackageContentModal({ pkg, loading, error, onClose }) {
  if (!pkg && !loading && !error) return null;

  const materials = sortMaterials(pkg?.materials);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{pkg?.title || 'Пакет'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? <p className="text-gray-600">Загрузка материалов…</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {pkg && !loading ? (
            <>
              {pkg.coverUrl ? (
                <img src={pkg.coverUrl} alt="" className="mb-4 max-h-48 w-full rounded-xl object-cover" />
              ) : null}
              <p className="mb-4 text-sm text-gray-600">{pkg.description}</p>
              {materials.length === 0 ? (
                <p className="text-sm text-gray-500">В этом пакете пока нет материалов.</p>
              ) : (
                <div className="space-y-4">
                  {materials.map((m, i) => (
                    <MaterialBlock key={`${m.order}-${i}`} material={m} index={i} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openError, setOpenError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);
        console.log('[purchases] loading list');
        const response = await purchasesApi.list();
        console.log('[purchases] loaded', response.data.purchases?.length ?? 0);
        setItems(response.data.purchases ?? []);
      } catch (err) {
        console.error('[purchases] load failed', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, []);

  const openPackage = async (purchase) => {
    const slug = purchase.package?.slug;
    const id = purchase.package?.id;
    setOpenError('');
    setContentError('');
    setSelectedPackage(null);
    setModalOpen(true);
    setContentLoading(true);

    console.log('[purchases] open package', { slug, id });

    try {
      let pkg;
      if (slug) {
        const { data } = await packagesApi.getContent(slug);
        pkg = data.package;
      } else if (id) {
        const { data } = await packagesApi.getById(id);
        pkg = data.package;
      } else {
        throw new Error('У покупки нет данных пакета');
      }
      console.log('[purchases] package content loaded', pkg?.title);
      setSelectedPackage(pkg);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Не удалось открыть пакет';
      console.error('[purchases] open failed', err);
      setContentError(msg);
      setOpenError(msg);
    } finally {
      setContentLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPackage(null);
    setContentError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onAuthSuccess={setUser} />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Мои покупки</h1>

        {openError && !modalOpen ? (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{openError}</p>
        ) : null}

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
                <button
                  type="button"
                  onClick={() => openPackage(purchase)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
                >
                  Открыть
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {modalOpen ? (
        <PackageContentModal
          pkg={selectedPackage}
          loading={contentLoading}
          error={contentError}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
