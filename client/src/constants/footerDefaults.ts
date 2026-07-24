export const DEFAULT_FOOTER_SETTINGS = {
  footer_tagline: 'Подготовка к ЕГЭ и ОГЭ по истории и обществознанию',
  footer_email: 'dinastiya_school@mail.ru',
  footer_phone: '+7 (987) 431-93-44',
  footer_copyright: '© 2026 Онлайн-школа «Династия»',
  footer_link_about: '/#catalog',
  footer_link_about_label: 'О нас',
  footer_link_contacts: 'mailto:dinastiya_school@mail.ru',
  footer_link_contacts_label: 'Контакты',
  footer_link_privacy: '/privacy',
  footer_link_privacy_label: 'Политика конфиденциальности',
  footer_logo_url: '/logo-full.png',
} as const;

export type FooterSettings = Record<keyof typeof DEFAULT_FOOTER_SETTINGS, string>;

export function normalizeFooterSettings(raw?: Record<string, string>): FooterSettings {
  return { ...DEFAULT_FOOTER_SETTINGS, ...raw };
}
