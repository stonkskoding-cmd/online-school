import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildStoragePath(file: File, folder = ''): string {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
  const base = sanitizeFileName(file.name.replace(/\.[^.]+$/, '') || 'file');
  const fileName = `${Date.now()}-${base}${ext ? `.${ext}` : ''}`;
  const prefix = folder ? `${folder.replace(/\/$/, '')}/` : '';
  return `${prefix}${fileName}`;
}

export type StorageBucket = 'packages' | 'materials';

/** Лимит на один файл. На free-плане Supabase больше 50 МБ загрузить нельзя. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',');
}

/** Понятные сообщения вместо английских ошибок Supabase Storage */
function describeStorageError(error: { message?: string }, file: File): string {
  const raw = error?.message ?? '';

  if (/exceeded the maximum allowed size|payload too large|entity too large/i.test(raw)) {
    return `Файл «${file.name}» (${formatMb(file.size)} МБ) больше, чем разрешает хранилище. Загрузите файл меньшего размера, а видео лучше залить на YouTube / VK / Rutube и вставить ссылку в поле «Ссылка на видео».`;
  }
  if (/bucket not found/i.test(raw)) {
    return 'Хранилище не найдено: проверьте, что в Supabase созданы бакеты «packages» и «materials».';
  }
  if (/row-level security|unauthorized|forbidden/i.test(raw)) {
    return 'Нет прав на загрузку в хранилище. Проверьте политики доступа бакета в Supabase.';
  }
  if (/already exists/i.test(raw)) {
    return 'Файл с таким именем уже существует. Попробуйте загрузить ещё раз.';
  }
  if (/failed to fetch|network/i.test(raw)) {
    return 'Не удалось связаться с хранилищем. Проверьте интернет и попробуйте снова.';
  }
  return raw || 'Не удалось загрузить файл';
}

export async function uploadFileToStorage(
  bucket: StorageBucket,
  file: File,
  folder = '',
): Promise<string> {
  if (!supabase) {
    throw new Error(
      'Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env',
    );
  }

  // Проверяем размер до отправки — иначе оператор ждёт всю загрузку ради ошибки
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Файл «${file.name}» весит ${formatMb(file.size)} МБ, максимум — ${formatMb(MAX_UPLOAD_BYTES)} МБ. Выберите файл меньше, а видео залейте на YouTube / VK / Rutube и вставьте ссылку в поле «Ссылка на видео».`,
    );
  }

  const path = buildStoragePath(file, folder);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(describeStorageError(error, file));

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
