-- Скопируйте в Supabase → SQL Editor, если migrate deploy на Render недоступен
-- Исправляет content и удаляет устаревшую колонку text

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'text'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
    ) THEN
      ALTER TABLE "messages" RENAME COLUMN "text" TO "content";
    ELSE
      UPDATE "messages"
      SET "content" = COALESCE(NULLIF(TRIM("content"), ''), "text")
      WHERE "text" IS NOT NULL;
      ALTER TABLE "messages" DROP COLUMN "text";
    END IF;
  END IF;
END $$;

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
