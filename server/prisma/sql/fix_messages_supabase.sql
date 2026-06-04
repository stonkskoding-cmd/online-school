-- Скопируйте в Supabase → SQL Editor, если migrate deploy на Render недоступен
-- Исправляет отсутствующую колонку content и остальные поля чата

CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "user_id" UUID;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "messages" SET "content" = COALESCE("content", '') WHERE "content" IS NULL;
ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "messages_user_id_created_at_idx" ON "messages"("user_id", "created_at");
