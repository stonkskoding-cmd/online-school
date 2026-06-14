export const DEFAULT_FOOTER_SETTINGS = {
  footer_tagline: 'Подготовка к ЕГЭ и ОГЭ по истории и обществознанию',
  footer_email: 'info@dinastia-school.ru',
  footer_phone: '+7 (999) 123-45-67',
  footer_copyright: '© 2026 Онлайн-школа ЕГЭ/ОГЭ',
  footer_link_about: '/#catalog',
  footer_link_about_label: 'О нас',
  footer_link_contacts: 'mailto:info@dinastia-school.ru',
  footer_link_contacts_label: 'Контакты',
  footer_link_privacy: '/privacy',
  footer_link_privacy_label: 'Политика конфиденциальности',
  footer_logo_url: '/logo-full.png',
} as const;

export type FooterSettings = Record<keyof typeof DEFAULT_FOOTER_SETTINGS, string>;

export function normalizeFooterSettings(raw?: Record<string, string>): FooterSettings {
  return { ...DEFAULT_FOOTER_SETTINGS, ...raw };
}
