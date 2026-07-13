import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApiClient } from '../api';
import { DEFAULT_FOOTER_SETTINGS, normalizeFooterSettings } from '../constants/footerDefaults';

type FormState = typeof DEFAULT_FOOTER_SETTINGS;

const FIELDS: Array<{ key: keyof FormState; label: string; hint?: string }> = [
  { key: 'footer_tagline', label: 'Описание под логотипом' },
  { key: 'footer_email', label: 'Email' },
  { key: 'footer_phone', label: 'Телефон' },
  { key: 'footer_copyright', label: 'Копирайт' },
  { key: 'footer_logo_url', label: 'URL логотипа', hint: 'Например: /logo-full.png' },
  { key: 'footer_link_about_label', label: 'Ссылка «О нас» — текст' },
  { key: 'footer_link_about', label: 'Ссылка «О нас» — URL', hint: '/#catalog' },
  { key: 'footer_link_contacts_label', label: 'Ссылка «Контакты» — текст' },
  { key: 'footer_link_contacts', label: 'Ссылка «Контакты» — URL', hint: 'mailto:...' },
  { key: 'footer_link_privacy_label', label: 'Ссылка «Политика» — текст' },
  { key: 'footer_link_privacy', label: 'Ссылка «Политика» — URL', hint: '/privacy' },
];

export default function AdminFooterSettings() {
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FOOTER_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApiClient
      .getSiteSettings()
      .then(({ data }) => {
        if (!cancelled) {
          setForm(normalizeFooterSettings(data.settings) as FormState);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить настройки');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await adminApiClient.updateSiteSettings({ ...form });
      setMessage('Настройки футера сохранены');
    } catch {
      setError('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Сбросить футер к значениям по умолчанию?')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await adminApiClient.resetFooterSettings();
      setForm(normalizeFooterSettings(data.settings) as FormState);
      setMessage('Настройки сброшены к значениям по умолчанию');
    } catch {
      setError('Не удалось сбросить настройки');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/dashboard" className="text-sm font-medium text-[#244E77] hover:underline">
              ← Админка
            </Link>
            <h1 className="text-lg font-bold text-[#244E77] sm:text-xl">Настройки футера</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading ? (
          <p className="text-gray-600">Загрузка…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <p className="text-sm text-gray-600">
              Изменения отображаются в подвале сайта на всех публичных страницах.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map(({ key, label, hint }) => (
                <div key={key} className={key.includes('tagline') || key.includes('copyright') ? 'sm:col-span-2' : ''}>
                  <label htmlFor={key} className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    id={key}
                    type="text"
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#244E77] focus:ring-1 focus:ring-[#244E77]"
                  />
                  {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
                </div>
              ))}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-[#244E77] to-[#163754] px-5 py-2.5 text-sm font-bold text-[#D4AF37] shadow disabled:opacity-60"
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={saving}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Сбросить по умолчанию
              </button>
            </div>
          </form>
        )}

        <section className="site-footer relative mt-8 overflow-hidden rounded-2xl border border-gray-200 p-4 text-white sm:p-6">
          <img
            src="/header-bg.png"
            alt=""
            className="site-surface__pattern"
            aria-hidden
            draggable={false}
          />
          <h2 className="relative z-10 mb-4 text-sm font-semibold uppercase tracking-wide text-white/70">
            Предпросмотр
          </h2>
          <div className="relative z-10 flex flex-col gap-4 text-sm md:flex-row md:justify-between">
            <div>
              <img
                src={form.footer_logo_url}
                alt=""
                className="mb-2 h-10 w-auto brightness-0 invert"
              />
              <p className="text-white/75">{form.footer_tagline}</p>
            </div>
            <div>
              <p className="font-semibold">Контакты</p>
              <p className="text-blue-100">{form.footer_email}</p>
              <p className="text-blue-100">{form.footer_phone}</p>
            </div>
            <div>
              <p className="font-semibold">Ссылки</p>
              <p className="text-blue-100">{form.footer_link_about_label}</p>
              <p className="text-blue-100">{form.footer_link_contacts_label}</p>
              <p className="text-blue-100">{form.footer_link_privacy_label}</p>
            </div>
          </div>
          <p className="relative z-10 mt-4 border-t border-white/15 pt-4 text-center text-xs text-white/60">
            {form.footer_copyright}
          </p>
        </section>
      </main>
    </div>
  );
}
