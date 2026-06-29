import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteSettingsApi } from '../api';
import { DEFAULT_FOOTER_SETTINGS, normalizeFooterSettings } from '../constants/footerDefaults';

function FooterLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith('/') && !href.startsWith('//');
  const className = 'text-blue-100 transition hover:text-white';

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
    <footer className="bg-blue-900 px-3 py-8 text-sm text-white sm:px-4 sm:py-12 sm:text-base">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-start gap-3 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-block">
            <img
              src={logoUrl}
              alt="Династия — онлайн-школа"
              className="h-12 w-auto max-w-full brightness-0 invert sm:h-14"
            />
          </Link>
          <p className="max-w-xs text-blue-100">{settings.footer_tagline}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-white sm:text-lg">Контакты</h3>
          <a
            href={`mailto:${settings.footer_email}`}
            className="text-blue-100 transition hover:text-white"
          >
            {settings.footer_email}
          </a>
          <a
            href={phoneHref(settings.footer_phone)}
            className="text-blue-100 transition hover:text-white"
          >
            {settings.footer_phone}
          </a>
        </div>

        <nav className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1" aria-label="Навигация в подвале">
          <h3 className="text-base font-semibold text-white sm:text-lg">Разделы</h3>
          <FooterLink href={settings.footer_link_about} label={settings.footer_link_about_label} />
          <FooterLink href={settings.footer_link_contacts} label={settings.footer_link_contacts_label} />
          <FooterLink href={settings.footer_link_privacy} label={settings.footer_link_privacy_label} />
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-blue-800 pt-6 text-center text-sm text-blue-200 sm:text-base">
        {settings.footer_copyright}
      </div>
    </footer>
  );
}

export default memo(Footer);
