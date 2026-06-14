-- sender_id: автор сообщения (обязательное поле в продакшен-БД)

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_id" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'senderId'
  ) THEN
    UPDATE "messages"
    SET "sender_id" = COALESCE(NULLIF(TRIM("sender_id"), ''), "senderId"::text)
    WHERE "sender_id" IS NULL OR TRIM("sender_id") = '';
  END IF;
END $$;

UPDATE "messages"
SET "sender_id" = "user_id"::text
WHERE "sender_id" IS NULL OR TRIM("sender_id") = '';

ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL;
