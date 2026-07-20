import { useCallback, useRef, useState } from 'react';
import { MAX_UPLOAD_BYTES } from '../../lib/supabase';

const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/**
 * Зона drag-and-drop + выбор файла; прогресс при загрузке (внешний флаг uploading + progress 0–100).
 */
export default function FileUploadZone({
  id = 'file-upload',
  label,
  hint,
  accept,
  disabled,
  uploading,
  progress = 0,
  onFile,
  compact = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const pickFiles = useCallback(
    (files) => {
      const f = files?.[0];
      if (f && !disabled && !uploading) onFile?.(f);
    },
    [disabled, uploading, onFile],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFiles(e.dataTransfer?.files);
  };

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-xs font-medium text-gray-600">
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragOver
            ? 'border-[#D4AF37] bg-amber-50/80'
            : 'border-gray-300 bg-gray-50 hover:border-[#244E77]/50 hover:bg-white'
        } ${disabled || uploading ? 'pointer-events-none opacity-60' : ''} ${compact ? 'py-4' : ''}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-sm font-medium text-[#244E77]">
          {uploading ? 'Загрузка…' : 'Перетащите файл сюда или нажмите для выбора'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, изображения, видео, документы — до {MAX_UPLOAD_MB} МБ
        </p>
        {uploading ? (
          <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#244E77] to-[#D4AF37] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
