-- Пересоздание таблицы чата с нуля (senderId = UUID клиента / тред)

DROP TABLE IF EXISTS "messages" CASCADE;

CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_senderId_createdAt_idx" ON "messages"("senderId", "createdAt");
