-- sender_id должен быть TEXT (UUID как строка или литерал 'admin'), не UUID/INTEGER

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_id" TEXT;

UPDATE "messages"
SET "sender_id" = "user_id"::text
WHERE "sender_id" IS NULL OR TRIM("sender_id") = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'sender_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "messages"
      ALTER COLUMN "sender_id" TYPE TEXT
      USING "sender_id"::text;
  END IF;
END $$;

-- Удалить legacy camelCase колонку, если она конфликтует с Prisma @map("sender_id")
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'senderId'
  ) THEN
    UPDATE "messages"
    SET "sender_id" = COALESCE(NULLIF(TRIM("sender_id"), ''), "senderId"::text)
    WHERE "sender_id" IS NULL OR TRIM("sender_id") = '';

    ALTER TABLE "messages" DROP COLUMN "senderId";
  END IF;
END $$;

ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL;
