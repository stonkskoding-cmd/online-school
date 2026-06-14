import { useEffect, useState } from 'react';
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

export default function Footer() {
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
    <footer className="bg-blue-900 px-4 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-start gap-3">
          <Link to="/" className="inline-block">
            <img
              src={logoUrl}
              alt="Династия — онлайн-школа"
              className="h-12 w-auto brightness-0 invert sm:h-14"
            />
          </Link>
          <p className="max-w-xs text-sm text-blue-100">{settings.footer_tagline}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h3 className="text-base font-semibold text-white">Контакты</h3>
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

        <nav className="flex flex-col gap-2 text-sm" aria-label="Навигация в подвале">
          <h3 className="text-base font-semibold text-white">Разделы</h3>
          <FooterLink href={settings.footer_link_about} label={settings.footer_link_about_label} />
          <FooterLink href={settings.footer_link_contacts} label={settings.footer_link_contacts_label} />
          <FooterLink href={settings.footer_link_privacy} label={settings.footer_link_privacy_label} />
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-blue-800 pt-6 text-center text-sm text-blue-200">
        {settings.footer_copyright}
      </div>
    </footer>
  );
}
