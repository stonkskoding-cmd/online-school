-- site_settings: key-value настройки (футер и др.)

CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_key_key" ON "site_settings"("key");

-- Добавить updated_at если таблица была создана без него
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Значения по умолчанию для футера
INSERT INTO "site_settings" ("key", "value") VALUES
  ('footer_tagline', 'Подготовка к ЕГЭ и ОГЭ по истории и обществознанию'),
  ('footer_email', 'info@dinastia-school.ru'),
  ('footer_phone', '+7 (999) 123-45-67'),
  ('footer_copyright', '© 2026 Онлайн-школа ЕГЭ/ОГЭ'),
  ('footer_link_about', '/#catalog'),
  ('footer_link_about_label', 'О нас'),
  ('footer_link_contacts', 'mailto:info@dinastia-school.ru'),
  ('footer_link_contacts_label', 'Контакты'),
  ('footer_link_privacy', '/privacy'),
  ('footer_link_privacy_label', 'Политика конфиденциальности'),
  ('footer_logo_url', '/logo-full.png')
ON CONFLICT ("key") DO NOTHING;
