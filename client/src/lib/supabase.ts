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

  const path = buildStoragePath(file, folder);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
