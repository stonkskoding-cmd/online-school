import { Link } from 'react-router-dom';

const EMAIL = 'info@dinastia-school.ru';
const PHONE = '+7 (999) 123-45-67';

export default function Footer() {
  return (
    <footer className="bg-blue-900 px-4 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-start gap-3">
          <Link to="/" className="inline-block">
            <img
              src="/logo-full.png"
              alt="Династия — онлайн-школа"
              className="h-12 w-auto brightness-0 invert sm:h-14"
            />
          </Link>
          <p className="max-w-xs text-sm text-blue-100">
            Подготовка к ЕГЭ и ОГЭ по истории и обществознанию
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h3 className="text-base font-semibold text-white">Контакты</h3>
          <a href={`mailto:${EMAIL}`} className="text-blue-100 transition hover:text-white">
            {EMAIL}
          </a>
          <a href={`tel:${PHONE.replace(/\s|\(|\)|-/g, '')}`} className="text-blue-100 transition hover:text-white">
            {PHONE}
          </a>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Навигация в подвале">
          <h3 className="text-base font-semibold text-white">Разделы</h3>
          <Link to="/#catalog" className="text-blue-100 transition hover:text-white">
            О нас
          </Link>
          <a href={`mailto:${EMAIL}`} className="text-blue-100 transition hover:text-white">
            Контакты
          </a>
          <Link to="/privacy" className="text-blue-100 transition hover:text-white">
            Политика конфиденциальности
          </Link>
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-blue-800 pt-6 text-center text-sm text-blue-200">
        © 2026 Онлайн-школа ЕГЭ/ОГЭ
      </div>
    </footer>
  );
}
