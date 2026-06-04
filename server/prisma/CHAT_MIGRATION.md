# Миграция чата (таблица `messages`)

## Схема (Prisma)

Модель `Message` в `schema.prisma`:

| Поле Prisma | Колонка БД   | Описание                          |
|-------------|--------------|-----------------------------------|
| `id`        | `id`         | SERIAL, PK                        |
| `userId`    | `user_id`    | UUID клиента (тред чата)          |
| `content`   | `content`    | Текст сообщения                   |
| `isAdmin`   | `is_admin`   | Сообщение от админа                |
| `isRead`    | `is_read`    | Прочитано админом                  |
| `createdAt` | `created_at` | Время создания                    |

> `senderId` / отдельная таблица `Chat` **не используются** — API и чат работают с `user_id` + `content`.

## Ошибка в логах

```
The column `messages.content` does not exist
```

Таблица `messages` есть, но без колонки `content` (старая или ручная схема). Нужно применить миграцию.

---

## Render: Shell (рекомендуется)

1. [Render Dashboard](https://dashboard.render.com) → **online-school-backend** → **Shell**
2. Выполните:

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

3. Перезапустите сервис: **Manual Deploy** → **Clear build cache & deploy** (или Restart).

Проверка:

```bash
curl https://online-school-backend-mqn9.onrender.com/api/chat/health
```

Ожидается: `{"ok":true,"table":"messages"}`

---

## Supabase: SQL Editor

Если `migrate deploy` недоступен, вставьте SQL из файла:

`prisma/migrations/20260602120000_add_chat_system/migration.sql`

---

## Локально

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

---

## Важно

- **Не** добавляйте `prisma migrate deploy` в `npm start` на Render (зависание деплоя).
- Миграции — один раз через Shell или Supabase SQL.
