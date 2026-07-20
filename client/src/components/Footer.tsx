import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteSettingsApi } from '../api';
import { DEFAULT_FOOTER_SETTINGS, normalizeFooterSettings } from '../constants/footerDefaults';

function FooterLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith('/') && !href.startsWith('//');
  const className = 'text-white/80 transition hover:text-accent-400';

  if (isInternal) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s|\(|\)|-/g, '')}`;
}

function Footer() {
  const [settings, setSettings] = useState(normalizeFooterSettings());

  useEffect(() => {
    let cancelled = false;
    siteSettingsApi
      .get()
      .then(({ data }) => {
        if (!cancelled) {
          setSettings(normalizeFooterSettings(data.settings));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettings(normalizeFooterSettings());
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logoUrl = settings.footer_logo_url || DEFAULT_FOOTER_SETTINGS.footer_logo_url;

  return (
    <footer className="site-footer relative overflow-hidden px-3 py-8 text-sm text-white sm:px-4 sm:py-12 sm:text-base">
      <img
        src="/header-bg.png"
        alt=""
        className="site-surface__pattern"
        aria-hidden
        draggable={false}
      />
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-start gap-3 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-block">
            <img
              src={logoUrl}
              alt="Династия — онлайн-школа"
              className="h-12 w-auto max-w-full brightness-0 invert sm:h-14"
            />
          </Link>
          <p className="max-w-xs text-white/75">{settings.footer_tagline}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-accent-400 sm:text-lg">Контакты</h3>
          <a
            href={`mailto:${settings.footer_email}`}
            className="text-white/80 transition hover:text-accent-400"
          >
            {settings.footer_email}
          </a>
          <a
            href={phoneHref(settings.footer_phone)}
            className="text-white/80 transition hover:text-accent-400"
          >
            {settings.footer_phone}
          </a>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Навигация в подвале">
          <h3 className="text-base font-semibold text-accent-400 sm:text-lg">Разделы</h3>
          <FooterLink href={settings.footer_link_about} label={settings.footer_link_about_label} />
          <FooterLink href={settings.footer_link_contacts} label={settings.footer_link_contacts_label} />
        </nav>

        <nav className="flex flex-col gap-2" aria-label="Документы">
          <h3 className="text-base font-semibold text-accent-400 sm:text-lg">Документы</h3>
          <FooterLink href="/offer" label="Публичная оферта" />
          <FooterLink href="/payment" label="Оплата и возврат" />
          <FooterLink href="/privacy" label="Политика конфиденциальности" />
          <FooterLink href="/requisites" label="Реквизиты" />
        </nav>
      </div>

      <div className="relative z-10 mx-auto mt-8 max-w-6xl border-t border-white/15 pt-6 text-center text-sm text-white/60 sm:text-base">
        {settings.footer_copyright}
      </div>
    </footer>
  );
}

export default memo(Footer);
