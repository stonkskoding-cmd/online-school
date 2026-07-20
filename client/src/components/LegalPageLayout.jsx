import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';

/**
 * Единый брендовый каркас для юридических страниц (оферта, политика,
 * условия оплаты, реквизиты). Глобальный футер добавляет App.jsx.
 */
export default function LegalPageLayout({ title, subtitle, updatedAt, children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onAuthSuccess={setUser} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="mb-6 inline-block text-sm text-primary hover:underline">
          ← На главную
        </Link>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-gray-600">{subtitle}</p> : null}
          {updatedAt ? (
            <p className="mt-1 text-sm text-gray-400">Редакция от {updatedAt}</p>
          ) : null}
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">{children}</div>
        </article>
      </main>
    </div>
  );
}

/** Заголовок раздела внутри юридической страницы */
export function LegalSection({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="mt-6 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
