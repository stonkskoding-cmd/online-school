import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { packagesApi, purchasesApi } from '../api';
import Header from '../components/Header';

function materialIcon(type) {
  if (type === 'video') return '🎥';
  if (type === 'text') return '📝';
  if (type === 'image') return '🖼️';
  return '📎';
}

function sortMaterials(raw) {
  if (!Array.isArray(raw)) return [];
  return [...raw].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function compositionText(summary, materials) {
  const counts = summary ?? {
    video: materials.filter((m) => m.type === 'video').length,
    text: materials.filter((m) => m.type === 'text').length,
    image: materials.filter((m) => m.type === 'image').length,
    file: materials.filter((m) => !['video', 'text', 'image'].includes(m.type)).length,
  };
  const parts = [];
  if (counts.video) parts.push(`🎥 ${counts.video} видео`);
  if (counts.text) parts.push(`📝 ${counts.text} текст.`);
  if (counts.image) parts.push(`🖼️ ${counts.image} фото`);
  if (counts.file) parts.push(`📎 ${counts.file} файл.`);
  return parts.join(' · ');
}

/** Полный материал — показывается только после покупки */
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
        url.includes('youtube.com') || url.includes('youtu.be') ? (
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
            Смотреть видео
          </a>
        ) : (
          <video src={url} controls className="max-h-80 w-full rounded-lg bg-black" />
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

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const [purchased, setPurchased] = useState(false);
  const [fullMaterials, setFullMaterials] = useState(null);
  const [buying, setBuying] = useState(false);
  const [accessError, setAccessError] = useState('');

  const isLoggedIn = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await packagesApi.getById(id);
        const loaded = data.package ?? data;
        if (cancelled) return;
        setPkg(loaded);

        // Определяем, куплен ли пакет этим пользователем
        if (localStorage.getItem('token')) {
          try {
            const { data: pData } = await purchasesApi.list();
            const owned = (pData.purchases ?? []).some(
              (p) =>
                (p.package?.id ?? p.packageId) === loaded.id &&
                ['paid', 'pending'].includes(p.status),
            );
            if (!cancelled && owned) {
              setPurchased(true);
              // Полный доступ: тянем защищённый контент
              if (loaded.slug) {
                const { data: cData } = await packagesApi.getContent(loaded.slug);
                if (!cancelled) setFullMaterials(sortMaterials(cData.package?.materials));
              }
            }
          } catch {
            /* нет доступа/ошибка — оставляем превью */
          }
        }
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

  const handleBuy = async () => {
    if (!pkg || buying) return;
    if (!isLoggedIn) return;
    setBuying(true);
    setAccessError('');
    try {
      await purchasesApi.create(pkg.id);
      setPurchased(true);
      if (pkg.slug) {
        const { data: cData } = await packagesApi.getContent(pkg.slug);
        setFullMaterials(sortMaterials(cData.package?.materials));
      }
    } catch (err) {
      setAccessError(err?.response?.data?.message || 'Не удалось оформить покупку');
    } finally {
      setBuying(false);
    }
  };

  const previewMaterials = sortMaterials(pkg?.materials);
  const composition = pkg ? compositionText(pkg.materialsSummary, previewMaterials) : '';

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

            {/* Состав пакета — видно всем */}
            <section className="mt-6 border-t border-gray-100 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                Что внутри ({previewMaterials.length})
              </h2>
              {composition ? (
                <p className="mt-1 text-sm font-medium text-gray-600">{composition}</p>
              ) : null}

              {previewMaterials.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Материалы скоро появятся</p>
              ) : purchased ? (
                // Полный доступ после покупки
                <div className="mt-4 space-y-4">
                  {(fullMaterials ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">Загрузка материалов…</p>
                  ) : (
                    fullMaterials.map((m, i) => (
                      <MaterialBlock key={`${m.order ?? i}-${i}`} material={m} index={i} />
                    ))
                  )}
                </div>
              ) : (
                // Превью без доступа: только состав, без ссылок
                <>
                  <ul className="mt-3 space-y-2">
                    {previewMaterials.map((m, i) => (
                      <li
                        key={`${m.order ?? i}-${i}`}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                      >
                        <span className="shrink-0">{materialIcon(m.type)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                          {m.title || `Материал ${i + 1}`}
                        </span>
                        <span className="shrink-0 text-gray-300" title="Откроется после покупки" aria-hidden>
                          🔒
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    🔒 Материалы откроются после покупки
                  </p>
                </>
              )}
            </section>

            <p className="mt-6 text-3xl font-extrabold text-accent-500">
              {Number(pkg.price).toLocaleString('ru-RU')} ₽
            </p>

            {accessError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{accessError}</p>
            ) : null}

            {/* Кнопка действия */}
            {purchased ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                ✅ Пакет куплен — полный доступ открыт. Материалы также в разделе{' '}
                <Link to="/my-purchases" className="font-semibold underline">
                  «Мои покупки»
                </Link>
                .
              </p>
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={handleBuy}
                disabled={buying}
                className="btn-brand mt-4 px-6 py-3 text-sm disabled:opacity-60"
              >
                {buying ? 'Покупка…' : 'Купить и открыть материалы'}
              </button>
            ) : (
              <Link
                to="/?auth=login"
                className="btn-brand mt-4 inline-block px-6 py-3 text-sm no-underline"
              >
                Войдите, чтобы купить
              </Link>
            )}
          </article>
        ) : null}
      </main>
    </div>
  );
}
