/**
 * Проверка переменных Supabase при старте приложения.
 * Не блокирует работу сайта — только предупреждает в консоли.
 */

export const SUPABASE_ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

export const SUPABASE_DOCS_URL =
  'https://github.com/stonkskoding-cmd/online-school/blob/main/README_SUPABASE.md';

export function getSupabaseEnvStatus() {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const missing = [];

  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!key) missing.push('VITE_SUPABASE_ANON_KEY');

  return {
    configured: missing.length === 0,
    missing,
    url,
    key,
  };
}

export function checkSupabaseEnv() {
  const { configured, missing } = getSupabaseEnvStatus();

  if (configured) {
    console.info('[Supabase] Переменные окружения заданы — загрузка файлов доступна.');
    return;
  }

  console.warn(
    [
      '[Supabase] Загрузка файлов в пакеты отключена.',
      `Не заданы: ${missing.join(', ')}.`,
      'Локально: добавьте их в client/.env (см. client/.env.example).',
      'Продакшен (Render): Dashboard → Environment → добавьте те же переменные.',
      `Инструкция: ${SUPABASE_DOCS_URL}`,
    ].join('\n'),
  );
}
