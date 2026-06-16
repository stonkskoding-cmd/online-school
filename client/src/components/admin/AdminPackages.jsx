function categoryLabel(value, options) {
  return options.find((c) => c.value === value)?.label || value;
}

function countFilledMaterials(materials) {
  if (!Array.isArray(materials)) return 0;
  return materials.filter((m) => {
    if (m.type === 'text') return (m.content || '').trim().length > 0 || (m.url || '').trim().length > 0;
    return (m.url || '').trim().length > 0 || (m.content || '').trim().length > 0;
  }).length;
}

/** Статус без поля в БД: по наличию материалов и описания */
function packageStatus(pkg) {
  const mats = countFilledMaterials(pkg.materials);
  const descOk = (pkg.description || '').trim().length >= 10;
  if (mats > 0 && descOk) return { label: 'Готов', className: 'bg-emerald-100 text-emerald-800' };
  if (mats > 0 || descOk) return { label: 'Черновик', className: 'bg-amber-100 text-amber-900' };
  return { label: 'Минимум', className: 'bg-gray-100 text-gray-700' };
}

const CATEGORY_OPTIONS = [
  { value: 'OGE-IST', label: 'ОГЭ История' },
  { value: 'EGE-IST', label: 'ЕГЭ История' },
  { value: 'EGE-SOC', label: 'ЕГЭ Обществознание' },
];

const EMPTY_PACKAGE_STATS = {
  totalSales: 0,
  totalRevenue: 0,
  totalPackages: 0,
  topPackage: null,
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon} {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#244E77]">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}

export default function AdminPackages({ packages, stats = EMPTY_PACKAGE_STATS, loading, onCreate, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-600">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#244E77] border-t-transparent" />
        <p className="text-sm">Загрузка пакетов…</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="📊" label="Всего продаж" value={stats.totalSales ?? 0} />
          <StatCard
            icon="💰"
            label="Общая выручка"
            value={`${Number(stats.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽`}
          />
          <StatCard icon="📦" label="Всего пакетов" value={stats.totalPackages ?? 0} />
          <StatCard
            icon="🏆"
            label="Самый популярный"
            value={stats.topPackage?.title ?? '—'}
            sub={stats.topPackage ? `${stats.topPackage.salesCount} продаж` : 'Пока нет продаж'}
          />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <p className="text-gray-600">Пакетов пока нет.</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#244E77] to-[#163754] px-6 py-3 text-sm font-bold text-[#D4AF37] shadow-md transition hover:shadow-lg"
          >
            Создать первый пакет
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="📊" label="Всего продаж" value={stats.totalSales ?? 0} />
        <StatCard
          icon="💰"
          label="Общая выручка"
          value={`${Number(stats.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽`}
        />
        <StatCard icon="📦" label="Всего пакетов" value={stats.totalPackages ?? packages.length} />
        <StatCard
          icon="🏆"
          label="Самый популярный"
          value={stats.topPackage?.title ?? '—'}
          sub={
            stats.topPackage
              ? `${stats.topPackage.salesCount} продаж`
              : 'Пока нет продаж'
          }
        />
      </div>

      {/* Десктоп: таблица с горизонтальной прокруткой */}
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md md:block">
        <table className="min-w-[760px] w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gradient-to-r from-[#244E77] to-[#163754] text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Название</th>
              <th className="px-4 py-3 font-semibold">Цена</th>
              <th className="px-4 py-3 font-semibold">Продажи</th>
              <th className="px-4 py-3 font-semibold">Выручка</th>
              <th className="px-4 py-3 font-semibold">Материалы</th>
              <th className="px-4 py-3 font-semibold">Статус</th>
              <th className="px-4 py-3 font-semibold">Категория</th>
              <th className="px-4 py-3 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {packages.map((pkg) => {
              const st = packageStatus(pkg);
              const mc = countFilledMaterials(pkg.materials);
              const salesCount = Number(pkg.salesCount ?? 0);
              const revenue = Number(pkg.revenue ?? pkg.price * salesCount);
              return (
                <tr key={pkg.id} className="transition hover:bg-gray-50/80">
                  <td className="max-w-[14rem] px-4 py-3">
                    <p className="truncate font-semibold text-[#244E77]">{pkg.title}</p>
                    <p className="truncate font-mono text-[10px] text-gray-400">{pkg.slug}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                    {Number(pkg.price).toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{salesCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-emerald-700">
                    {revenue.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{mc}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{categoryLabel(pkg.category, CATEGORY_OPTIONS)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(pkg)}
                      className="mr-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#e8c85c] px-2 py-1 text-xs font-bold text-[#244E77] shadow-sm transition hover:from-[#c9a431] hover:to-[#D4AF37] sm:px-3 sm:py-1.5"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(pkg.id)}
                      className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 sm:px-3 sm:py-1.5"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Мобильные: карточки */}
      <div className="space-y-3 md:hidden">
        {packages.map((pkg) => {
          const st = packageStatus(pkg);
          const mc = countFilledMaterials(pkg.materials);
          const salesCount = Number(pkg.salesCount ?? 0);
          const revenue = Number(pkg.revenue ?? pkg.price * salesCount);
          return (
            <div
              key={pkg.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#244E77]">{pkg.title}</h3>
                  <p className="mt-0.5 font-mono text-[10px] text-gray-400">{pkg.slug}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${st.className}`}>
                  {st.label}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <dt className="text-gray-400">Цена</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">
                    {Number(pkg.price).toLocaleString('ru-RU')} ₽
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Продажи</dt>
                  <dd className="font-semibold tabular-nums">{salesCount}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Выручка</dt>
                  <dd className="font-semibold tabular-nums text-emerald-700">
                    {revenue.toLocaleString('ru-RU')} ₽
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400">Материалов</dt>
                  <dd className="font-semibold">{mc}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-400">Категория</dt>
                  <dd>{categoryLabel(pkg.category, CATEGORY_OPTIONS)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(pkg)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#e8c85c] py-2.5 text-xs font-bold text-[#244E77]"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(pkg.id)}
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
