import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, uploadFileToStorage } from '../../lib/supabase';
import SupabaseEnvNotice from './SupabaseEnvNotice';

function isImageFile(fileOrUrl) {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'string') {
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(fileOrUrl) || fileOrUrl.includes('image');
  }
  return (fileOrUrl.type || '').startsWith('image/');
}

function fileIcon(type) {
  if ((type || '').startsWith('video/')) return '🎬';
  if ((type || '').includes('pdf')) return '📄';
  return '📎';
}

export default function CoverUploadField({
  id = 'package-cover-upload',
  coverUrl = '',
  setCoverUrl,
  disabled = false,
  onUploadingChange,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [localFileName, setLocalFileName] = useState('');
  const [localMime, setLocalMime] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const blobRef = useRef(null);

  const setUploadingState = useCallback(
    (value) => {
      setUploading(value);
      onUploadingChange?.(value);
    },
    [onUploadingChange],
  );

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (coverUrl && !uploading) {
      revokeBlob();
      setLocalPreview(null);
    }
  }, [coverUrl, uploading, revokeBlob]);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  const displaySrc = localPreview || (coverUrl && isImageFile(coverUrl) ? coverUrl : null);
  const showFilePlaceholder = !displaySrc && (coverUrl || localFileName);

  const uploadCover = useCallback(
    async (file) => {
      if (!file || disabled || uploading) return;
      if (!isSupabaseConfigured()) {
        setUploadError(
          'Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env (см. README_SUPABASE.md)',
        );
        return;
      }
      revokeBlob();
      setLocalFileName(file.name);
      setLocalMime(file.type);
      setUploadError('');
      setUploadingState(true);

      if (isImageFile(file)) {
        const url = URL.createObjectURL(file);
        blobRef.current = url;
        setLocalPreview(url);
      } else {
        setLocalPreview(null);
      }

      try {
        const publicUrl = await uploadFileToStorage('packages', file);
        setCoverUrl?.(publicUrl);
        if (isImageFile(publicUrl)) {
          revokeBlob();
          setLocalPreview(publicUrl);
        }
      } catch (error) {
        revokeBlob();
        setLocalPreview(null);
        setLocalFileName('');
        setLocalMime('');
        setUploadError(
          error instanceof Error ? error.message : 'Не удалось загрузить обложку в Supabase Storage',
        );
        if (inputRef.current) inputRef.current.value = '';
      } finally {
        setUploadingState(false);
      }
    },
    [disabled, uploading, revokeBlob, setCoverUrl, setUploadingState],
  );

  const clearCover = () => {
    revokeBlob();
    setLocalPreview(null);
    setLocalFileName('');
    setLocalMime('');
    setUploadError('');
    setCoverUrl?.('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    uploadCover(e.dataTransfer?.files?.[0]);
  };

  const supabaseReady = isSupabaseConfigured();
  const uploadDisabled = disabled || uploading || !supabaseReady;

  if (displaySrc || showFilePlaceholder) {
    return (
      <div className="space-y-2">
        <SupabaseEnvNotice />
        <span className="block text-xs font-semibold text-gray-700">Обложка</span>
        {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
        <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100 shadow-inner ring-1 ring-gray-200">
          {displaySrc ? (
            <img
              src={displaySrc}
              alt="Превью обложки"
              className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 p-4 text-center">
              <span className="text-5xl">{fileIcon(localMime || coverUrl)}</span>
              <p className="max-w-full truncate text-sm font-medium text-gray-700">
                {localFileName || 'Файл загружен'}
              </p>
              {coverUrl ? (
                <a
                  href={coverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#244E77] underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Открыть файл
                </a>
              ) : null}
            </div>
          )}

          {uploading ? (
            <div className="absolute inset-x-0 bottom-0 bg-black/50 px-3 py-2">
              <p className="text-center text-xs text-white">Загрузка в Supabase…</p>
            </div>
          ) : null}

          {!uploading && !disabled ? (
            <button
              type="button"
              onClick={clearCover}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-md transition hover:bg-red-600 hover:scale-110"
              aria-label="Удалить обложку"
            >
              ✕
            </button>
          ) : null}
        </div>
        <p className="text-xs text-gray-500">Нажмите ✕, чтобы выбрать другой файл</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SupabaseEnvNotice />
      <span className="block text-xs font-semibold text-gray-700">Обложка</span>
      <p className="text-xs text-gray-500">По желанию. Изображение для карточки в каталоге.</p>
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
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
          if (!uploadDisabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploadDisabled && inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-[#244E77] bg-blue-50/80'
            : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-white'
        } ${uploadDisabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.zip"
          className="hidden"
          disabled={uploadDisabled}
          onChange={(e) => {
            uploadCover(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <label htmlFor={id} className="pointer-events-none cursor-pointer">
          <div className="mb-2 text-4xl text-gray-400">📷</div>
          <p className="text-sm font-medium text-gray-600">Перетащите файл или нажмите для выбора</p>
          <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP · до 10 МБ</p>
        </label>
        {uploading ? (
          <p className="mt-4 text-xs font-medium text-[#244E77]">Загрузка в Supabase…</p>
        ) : null}
      </div>
    </div>
  );
}
