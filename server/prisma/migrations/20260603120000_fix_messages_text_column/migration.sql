-- Устаревшая колонка `text` (NOT NULL) ломает INSERT через Prisma (поле content).
-- Переименовываем text → content или удаляем text после копирования.

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
      WHERE "text" IS NOT NULL AND ( "content" IS NULL OR TRIM("content") = '' );
      ALTER TABLE "messages" DROP COLUMN "text";
    END IF;
  END IF;
END $$;

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" TEXT;
UPDATE "messages" SET "content" = COALESCE("content", '') WHERE "content" IS NULL;
ALTER TABLE "messages" ALTER COLUMN "content" SET NOT NULL;
