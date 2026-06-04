-- Чат поддержки: таблица messages (Prisma model Message)
-- Поля: user_id (тред = клиент), content, is_admin, is_read, created_at

CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- Добавить недостающие колонки, если таблица была создана вручную с другой схемой
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "user_id" UUID;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Пустой content для старых строк
UPDATE "messages" SET "content" = COALESCE("content", '') WHERE "content" IS NULL;

-- Старая схема с senderId (если была) → user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'senderId'
  ) THEN
    EXECUTE 'UPDATE "messages" SET "user_id" = "senderId"::uuid WHERE "user_id" IS NULL AND "senderId" IS NOT NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id'
  ) THEN
    EXECUTE 'UPDATE "messages" SET "user_id" = "sender_id"::uuid WHERE "user_id" IS NULL AND "sender_id" IS NOT NULL';
  END IF;
END $$;

ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "messages" ALTER COLUMN "content" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "messages_user_id_created_at_idx" ON "messages"("user_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_user_id_fkey'
  ) THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'messages_user_id_fkey skipped: %', SQLERRM;
END $$;
