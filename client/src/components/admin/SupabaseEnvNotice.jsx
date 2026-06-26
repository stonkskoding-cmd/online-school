import { SUPABASE_DOCS_URL, getSupabaseEnvStatus } from '../../checkEnv';

export default function SupabaseEnvNotice({ className = '' }) {
  const { configured, missing } = getSupabaseEnvStatus();

  if (configured) return null;

  return (
    <div
      className={`rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className}`}
      role="alert"
    >
      <p className="font-semibold">Загрузка файлов недоступна</p>
      <p className="mt-1">
        Добавьте <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> и{' '}
        <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> в{' '}
        <code className="rounded bg-amber-100 px-1">.env</code> (локально) или в переменные
        окружения Render (продакшен).
      </p>
      {missing.length > 0 ? (
        <p className="mt-1 text-xs text-amber-800">Не задано: {missing.join(', ')}</p>
      ) : null}
      <a
        href={SUPABASE_DOCS_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm font-medium text-[#244E77] underline hover:text-[#163754]"
      >
        Пошаговая инструкция (README_SUPABASE.md) →
      </a>
    </div>
  );
}
