import { useCallback, useRef, useState } from 'react';
import FileUploadZone from './FileUploadZone';
import { isSupabaseConfigured, uploadFileToStorage } from '../../lib/supabase';
import SupabaseEnvNotice from './SupabaseEnvNotice';

const MATERIAL_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'image', label: 'Изображение' },
  { value: 'video', label: 'Видео' },
  { value: 'file', label: 'Файл' },
];

function guessMaterialType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

export default function PackageMaterialsEditor({
  materials,
  setMaterials,
  fieldErrors,
  disabled = false,
  onUploadingChange,
}) {
  const [materialUploadIndex, setMaterialUploadIndex] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const uploadCountRef = useRef(0);

  const bumpUploading = useCallback(
    (delta) => {
      uploadCountRef.current = Math.max(0, uploadCountRef.current + delta);
      onUploadingChange?.(uploadCountRef.current > 0);
    },
    [onUploadingChange],
  );

  const handleMaterialFileUpload = useCallback(
    async (index, file) => {
      if (!file || disabled) return;
      if (!isSupabaseConfigured()) {
        setUploadError(
          'Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env (см. README_SUPABASE.md)',
        );
        return;
      }
      setUploadError('');
      setMaterialUploadIndex(index);
      bumpUploading(1);

      try {
        const publicUrl = await uploadFileToStorage('materials', file);
        const guess = guessMaterialType(file);
        setMaterials((prev) =>
          prev.map((row, i) => {
            if (i !== index) return row;
            const nextType = row.type === 'text' ? guess : row.type;
            return { ...row, url: publicUrl, type: nextType, content: '' };
          }),
        );
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Не удалось загрузить файл материала',
        );
      } finally {
        setMaterialUploadIndex(null);
        bumpUploading(-1);
      }
    },
    [disabled, bumpUploading, setMaterials],
  );

  const addRow = () => {
    setMaterials((prev) => [
      ...prev,
      { type: 'text', title: '', content: '', url: '', order: prev.length },
    ]);
  };

  const removeRow = (index) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i })));
  };

  const update = (index, field, value) => {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const moveRow = useCallback(
    (from, to) => {
      if (to < 0 || to >= materials.length) return;
      setMaterials((prev) => {
        const next = [...prev];
        const [row] = next.splice(from, 1);
        next.splice(to, 0, row);
        return next.map((m, i) => ({ ...m, order: i }));
      });
    },
    [materials.length, setMaterials],
  );

  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="space-y-3 pt-1">
      <SupabaseEnvNotice />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">
            Порядок в списке = порядок на сайте. Перетащите строку за ⋮⋮ или используйте стрелки.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="rounded-lg border border-[#244E77] bg-white px-3 py-2 text-xs font-semibold text-[#244E77] transition hover:bg-[#244E77] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Добавить материал
        </button>
      </div>
      {fieldErrors?.materials ? (
        <p className="text-xs text-red-600">{fieldErrors.materials}</p>
      ) : null}
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}

      <div className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto pr-1 sm:max-h-80">
        {materials.map((m, index) => (
          <div
            key={`mat-${index}`}
            draggable={!disabled}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', String(index));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = Number(e.dataTransfer.getData('text/plain'));
              if (!Number.isNaN(from)) moveRow(from, index);
            }}
            className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 p-3 shadow-sm"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="cursor-grab select-none text-gray-400 active:cursor-grabbing"
                title="Перетащить"
                aria-hidden
              >
                ⋮⋮
              </span>
              <select
                value={m.type}
                disabled={disabled}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaterials((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            type: v,
                            url: v === 'text' ? '' : row.url,
                            content: v === 'text' ? row.content || row.url : '',
                          }
                        : row,
                    ),
                  );
                }}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium disabled:bg-gray-100"
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  title="Вверх"
                  disabled={disabled || index === 0}
                  onClick={() => moveRow(index, index - 1)}
                  className="rounded border border-gray-200 px-2 py-0.5 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  title="Вниз"
                  disabled={disabled || index === materials.length - 1}
                  onClick={() => moveRow(index, index + 1)}
                  className="rounded border border-gray-200 px-2 py-0.5 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeRow(index)}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                >
                  Удалить
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Заголовок урока"
              value={m.title}
              disabled={disabled}
              onChange={(e) => update(index, 'title', e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#244E77] focus:ring-1 focus:ring-[#244E77]/20 disabled:bg-gray-50"
            />
            {m.type === 'text' ? (
              <textarea
                placeholder="Текст урока"
                value={m.content}
                disabled={disabled}
                onChange={(e) => update(index, 'content', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#244E77] disabled:bg-gray-50"
              />
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Ссылка на видео или файл (https://…)"
                  value={m.url}
                  disabled={disabled}
                  onChange={(e) => update(index, 'url', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#244E77] disabled:bg-gray-50"
                />
                <FileUploadZone
                  id={`mat-upload-${index}`}
                  compact
                  accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                  disabled={disabled || !supabaseReady || materialUploadIndex === index}
                  uploading={materialUploadIndex === index}
                  progress={materialUploadIndex === index ? 50 : 0}
                  onFile={(file) => handleMaterialFileUpload(index, file)}
                />
                {m.url && isImageUrl(m.url) ? (
                  <img
                    src={m.url}
                    alt={m.title || 'Превью материала'}
                    className="max-h-32 rounded-lg border border-gray-200 object-contain"
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {m.url ? (
                    <>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Открыть файл
                      </a>
                      <button
                        type="button"
                        onClick={() => update(index, 'url', '')}
                        disabled={disabled}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Удалить файл
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function isImageUrl(url) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url || '');
}
