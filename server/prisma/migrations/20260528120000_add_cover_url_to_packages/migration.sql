-- cover_url мог отсутствовать в БД, созданной до init-миграции
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "cover_url" TEXT;
