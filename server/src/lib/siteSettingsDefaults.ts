/** Ключи настроек футера (таблица site_settings) */
export const FOOTER_SETTING_KEYS = [
  'footer_tagline',
  'footer_email',
  'footer_phone',
  'footer_copyright',
  'footer_link_about',
  'footer_link_about_label',
  'footer_link_contacts',
  'footer_link_contacts_label',
  'footer_link_privacy',
  'footer_link_privacy_label',
  'footer_logo_url',
] as const;

export type FooterSettingKey = (typeof FOOTER_SETTING_KEYS)[number];

export const DEFAULT_FOOTER_SETTINGS: Record<FooterSettingKey, string> = {
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
};

export function mergeSiteSettings(
  rows: Array<{ key: string; value: string }>,
): Record<string, string> {
  const merged: Record<string, string> = { ...DEFAULT_FOOTER_SETTINGS };
  for (const row of rows) {
    if (row.key) merged[row.key] = row.value;
  }
  return merged;
}
