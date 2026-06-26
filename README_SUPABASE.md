# Настройка Supabase Storage для загрузки файлов

Загрузка обложек пакетов и материалов работает через **Supabase Storage** на фронтенде.  
Без переменных окружения кнопки загрузки в админке покажут предупреждение, а файлы не отправятся.

---

## 1. Где взять ключи в Supabase

1. Откройте [https://supabase.com/dashboard](https://supabase.com/dashboard) и войдите в аккаунт.
2. Выберите проект (или создайте новый).
3. Перейдите: **Project Settings** (шестерёнка слева внизу) → **API**.
4. Скопируйте:
   - **Project URL** → это `VITE_SUPABASE_URL`  
     Пример: `https://abcdefghijklmnop.supabase.co`
   - **anon public** key (раздел *Project API keys*) → это `VITE_SUPABASE_ANON_KEY`  
     Ключ начинается с `eyJ...` или `sb_publishable_...`

> Используйте только **anon public** ключ на фронтенде. **service_role** никогда не добавляйте в клиент!

---

## 2. Создайте buckets в Storage

1. В Supabase: **Storage** → **New bucket**.
2. Создайте два **public** bucket:
   - `packages` — обложки пакетов
   - `materials` — файлы материалов (PDF, видео, изображения)

Для каждого bucket включите **Public bucket** (или настройте политики ниже).

### Политики доступа (если bucket не public)

В **Storage** → bucket → **Policies** добавьте:

**Загрузка (INSERT)** — для авторизованных или анонимных (если админка без Supabase Auth):

```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'packages' OR bucket_id = 'materials');
```

**Чтение (SELECT)** — публичное:

```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'packages' OR bucket_id = 'materials');
```

При необходимости ограничьте INSERT только для админов через RLS и JWT.

---

## 3. Локальная разработка

1. Скопируйте шаблон:

   ```bash
   cp client/.env.example client/.env
   ```

2. Откройте `client/.env` и вставьте ключи:

   ```env
   VITE_SUPABASE_URL=https://ВАШ_ПРОЕКТ.supabase.co
   VITE_SUPABASE_ANON_KEY=ваш-anon-ключ
   ```

3. Перезапустите dev-сервер:

   ```bash
   cd client
   npm run dev
   ```

4. В консоли браузера (F12) должно появиться:  
   `[Supabase] Переменные окружения заданы — загрузка файлов доступна.`

---

## 4. Продакшен: Render (фронтенд)

Файл `.env` **не деплоится** на Render. Переменные нужно добавить в панели Render.

1. Откройте [https://dashboard.render.com](https://dashboard.render.com).
2. Выберите сервис **online-school-frontend** (Static Site или Web Service).
3. Меню слева: **Environment**.
4. Нажмите **Add Environment Variable** и добавьте:

   | Key | Value |
   |-----|--------|
   | `VITE_SUPABASE_URL` | `https://ВАШ_ПРОЕКТ.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | ваш anon public key |

5. Убедитесь, что уже заданы (если нет — добавьте):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://online-school-backend-mqn9.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://online-school-backend-mqn9.onrender.com` |

6. Нажмите **Save Changes** — Render пересоберёт фронтенд автоматически.

### Документация Render

- [Environment variables](https://render.com/docs/environment-variables)
- [Deploy a Vite static site](https://render.com/docs/deploy-vite)

> **Важно для Vite:** переменные с префиксом `VITE_` встраиваются **на этапе сборки**. После добавления ключей нужен новый deploy (Render сделает это сам после Save).

---

## 5. Проверка после настройки

1. Откройте админку → создание/редактирование пакета.
2. Предупреждение жёлтого блока **не должно** отображаться.
3. Загрузите тестовую обложку — в Supabase **Storage** → `packages` появится файл.
4. Загрузите материал — файл появится в bucket `materials`.

---

## 6. Устранение неполадок

| Симптом | Решение |
|--------|---------|
| Жёлтое предупреждение в админке | Нет `VITE_SUPABASE_*` в `.env` или Render Environment |
| Ошибка после выбора файла | Проверьте bucket `packages` / `materials` и политики Storage |
| Работает локально, не на Render | Добавьте переменные в Render → Environment и дождитесь redeploy |
| `new row violates row-level security` | Добавьте политику INSERT для bucket |
| Файл загружен, но не открывается | Bucket должен быть public или нужна политика SELECT |

---

## 7. Полезные ссылки

- [Supabase Storage docs](https://supabase.com/docs/guides/storage)
- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)

---

## Переменные (краткая шпаргалка)

```env
# client/.env и Render Environment (фронтенд)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Бэкенд для загрузки файлов **не требует** отдельных Supabase-переменных — загрузка идёт с клиента напрямую в Storage.
