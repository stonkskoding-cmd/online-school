import { useEffect, useState } from 'react';
import PackageMaterialsEditor from './PackageMaterialsEditor';
import CoverUploadField from './CoverUploadField';

const CATEGORY_OPTIONS = [
  { value: 'OGE-IST', label: 'ОГЭ Обществознание' },
  { value: 'EGE-IST', label: 'ЕГЭ История' },
  { value: 'EGE-SOC', label: 'ЕГЭ Обществознание' },
];

function countMaterials(materials) {
  if (!Array.isArray(materials)) return 0;
  return materials.filter((m) => {
    if (m.type === 'text') return (m.content || '').trim().length > 0 || (m.url || '').trim().length > 0;
    return (m.url || '').trim().length > 0 || (m.content || '').trim().length > 0;
  }).length;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function PackageFormModal({
  open,
  onClose,
  formError = '',
  editingId,
  title,
  setTitle,
  slug,
  setSlug,
  category,
  setCategory,
  price,
  setPrice,
  description,
  setDescription,
  coverUrl,
  setCoverUrl,
  materials,
  setMaterials,
  saving,
  onSubmit,
  fieldErrors,
  draftHint,
  onDiscardDraft,
}) {
  const [tab, setTab] = useState('edit');
  const [coverUploading, setCoverUploading] = useState(false);
  const [materialUploading, setMaterialUploading] = useState(false);
  const fileUploading = coverUploading || materialUploading;

  useEffect(() => {
    if (open) {
      setTab('edit');
      setCoverUploading(false);
      setMaterialUploading(false);
    }
  }, [open, editingId]);

  if (!open) return null;

  const priceNum = Number(price);
  const matsCount = countMaterials(materials);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-form-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#244E77] to-[#163754] px-4 py-3 text-white sm:px-6">
          <h2 id="package-form-title" className="text-lg font-bold">
            {editingId ? 'Редактировать пакет' : 'Новый пакет'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-white/90 transition hover:bg-white/15 disabled:opacity-50"
            aria-label="Закрыть"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {draftHint ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6">
            <span>{draftHint}</span>
            <button type="button" onClick={onDiscardDraft} className="font-semibold underline hover:text-amber-700">
              Сбросить черновик
            </button>
          </div>
        ) : null}

        {formError ? (
          <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:px-6" role="alert">
            {formError}
          </div>
        ) : null}

        <div className="flex shrink-0 gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2 sm:px-4">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'edit' ? 'bg-white text-[#244E77] shadow-sm' : 'text-gray-600 hover:text-[#244E77]'
            }`}
          >
            Редактирование
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'preview' ? 'bg-white text-[#244E77] shadow-sm' : 'text-gray-600 hover:text-[#244E77]'
            }`}
          >
            Предпросмотр
          </button>
        </div>

        {tab === 'preview' ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f9fafb] p-6">
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-44 w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#244E77] to-[#163754] text-sm text-white/80">
                  Нет обложки
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  {CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[#244E77]">{title.trim() || 'Без названия'}</h3>
                <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-gray-600">
                  {description.trim() || 'Описание не заполнено'}
                </p>
                <div className="mt-4 flex items-baseline gap-2 border-t border-gray-100 pt-4">
                  <span className="text-2xl font-bold text-[#244E77]">
                    {Number.isFinite(priceNum) && priceNum > 0 ? `${priceNum.toLocaleString('ru-RU')} ₽` : '—'}
                  </span>
                  <span className="text-sm text-gray-500">· {matsCount} материалов</span>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-lg text-center text-xs text-gray-500">
              Так карточка будет выглядеть на сайте (упрощённо). Slug:{' '}
              <code className="rounded bg-gray-200 px-1">{slug.trim() || '…'}</code>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {/* Блок А: основная информация */}
              <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-wide text-[#244E77]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#244E77] text-xs text-[#D4AF37]">
                    1
                  </span>
                  Основная информация
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Название пакета <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                      placeholder="Например: ЕГЭ История — полный курс"
                      className={`w-full rounded-xl border px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#244E77]/25 disabled:bg-gray-100 ${
                        fieldErrors.title ? 'border-red-500 bg-red-50/40 ring-1 ring-red-200' : 'border-gray-300 focus:border-[#244E77]'
                      }`}
                    />
                    {fieldErrors.title ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p> : null}
                  </div>

                  {editingId ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Slug (URL) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={saving}
                        className={`w-full rounded-xl border px-3 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-[#244E77]/25 disabled:bg-gray-100 ${
                          fieldErrors.slug ? 'border-red-500 bg-red-50/40' : 'border-gray-300 focus:border-[#244E77]'
                        }`}
                      />
                      {fieldErrors.slug ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slug}</p> : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Категория</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={saving}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#244E77] focus:ring-2 focus:ring-[#244E77]/20 disabled:bg-gray-100"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Цена, ₽ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={saving}
                        placeholder="9900"
                        className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#244E77]/25 disabled:bg-gray-100 ${
                          fieldErrors.price ? 'border-red-500 bg-red-50/40 ring-1 ring-red-200' : 'border-gray-300 focus:border-[#244E77]'
                        }`}
                      />
                      {fieldErrors.price ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.price}</p> : null}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      Описание <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                      rows={5}
                      placeholder="Опишите содержание пакета для каталога"
                      className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#244E77]/25 disabled:bg-gray-100 ${
                        fieldErrors.description ? 'border-red-500 bg-red-50/40 ring-1 ring-red-200' : 'border-gray-300 focus:border-[#244E77]'
                      }`}
                    />
                    {fieldErrors.description ? (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                    ) : null}
                  </div>

                  <div>
                    <CoverUploadField
                      id="package-cover-upload"
                      coverUrl={coverUrl}
                      setCoverUrl={setCoverUrl}
                      disabled={saving}
                      onUploadingChange={setCoverUploading}
                    />
                  </div>
                </div>
              </section>

              {/* Блок Б: материалы */}
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold uppercase tracking-wide text-[#244E77]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#244E77]">
                    2
                  </span>
                  Материалы (уроки, видео, файлы)
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  Материалы необязательны для сохранения пакета. Добавьте уроки или загрузите файлы — порядок в списке =
                  порядок на сайте.
                </p>
                <PackageMaterialsEditor
                  materials={materials}
                  setMaterials={setMaterials}
                  fieldErrors={fieldErrors}
                  disabled={saving}
                  onUploadingChange={setMaterialUploading}
                />
              </section>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
              <button
                type="submit"
                disabled={saving || fileUploading}
                className="inline-flex min-w-[10rem] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#244E77] to-[#163754] py-3.5 text-sm font-bold text-[#D4AF37] shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-10"
              >
                {saving ? (
                  <>
                    <Spinner />
                    Сохранение…
                  </>
                ) : editingId ? (
                  'Сохранить изменения'
                ) : (
                  'Создать пакет'
                )}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="rounded-xl border-2 border-gray-300 px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
