# PROJECT_CONTEXT — Онлайн-школа «Династия»

> Контекст для разработчиков и AI-ассистентов. Актуально на основе кода в репозитории (commit `1005b09`).

---

## 1. Описание проекта

**Онлайн-школа «Династия»** — веб-платформа для подготовки к **ЕГЭ и ОГЭ** по **истории** и **обществознанию**.

### Основные возможности

| Роль | Функции |
|------|---------|
| **Гость / ученик** | Лендинг, каталог пакетов, регистрация/вход, покупка пакетов, личный кабинет, чат поддержки |
| **Администратор** | CRUD пакетов и материалов, загрузка файлов (Cloudinary), чат с клиентами, настройки футера сайта |

### Категории пакетов

- `OGE-IST` — ОГЭ История  
- `EGE-IST` — ЕГЭ История  
- `EGE-SOC` — ЕГЭ Обществознание  

### Деплой

- **Frontend:** Render (static site, Vite build)  
- **Backend:** Render (Node.js, free tier — сервер «засыпает»)  
- **БД:** PostgreSQL (Supabase), подключение через PgBouncer (порт 6543)  

---

## 2. Стек технологий

### Frontend (`client/`)

| Технология | Назначение |
|------------|------------|
| React 18 | UI |
| Vite 5 | Сборка |
| TypeScript + JSX | Компоненты (смешанно `.tsx` / `.jsx`) |
| Tailwind CSS 3 | Стили |
| React Router 6 | Маршрутизация |
| Axios | HTTP API |
| Zustand | Состояние (auth, chat store) |
| Socket.io-client | Опционально (есть на клиенте; чат в проде — **polling REST**) |

### Backend (`server/`)

| Технология | Назначение |
|------------|------------|
| Node.js ≥ 20 | Runtime |
| Express 4 | HTTP API |
| TypeScript | Исходники → `dist/` |
| Prisma 6 | ORM, миграции |
| PostgreSQL | БД |
| JWT (jsonwebtoken) | Авторизация |
| bcryptjs | Хеш паролей |
| Zod | Валидация запросов |
| Multer + Cloudinary | Загрузка файлов |
| Socket.io | Real-time (опционально, параллельно с REST-чатом) |
| YooKassa (заготовка) | Платежи — **не завершено** |

### Инфраструктура

- **GitHub:** монорепозиторий `client` + `server`  
- **Render:** `render.yaml` — два сервиса (frontend + backend)  
- **Supabase:** PostgreSQL + pooler  

---

## 3. URL сервисов

| Сервис | URL |
|--------|-----|
| **Frontend (prod)** | https://online-school-frontend-ryc0.onrender.com |
| **Backend API (prod)** | https://online-school-backend-mqn9.onrender.com/api |
| **Backend health** | https://online-school-backend-mqn9.onrender.com/api/health |
| **GitHub** | https://github.com/stonkskoding-cmd/online-school.git |

### Переменные окружения (ключевые)

**Backend (`server/.env`):**  
`DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FRONTEND_URL`, `BACKEND_URL`, `CLOUDINARY_*`, `YOOKASSA_*`

**Frontend (`client/.env.production`):**  
`VITE_API_URL=https://online-school-backend-mqn9.onrender.com/api`

---

## 4. Структура проекта

```
online-school/
├── PROJECT_CONTEXT.md          # Этот файл
├── TODO.md                     # Бэклог задач
├── render.yaml                 # Конфиг Render (frontend + backend)
├── .gitignore
│
├── client/                     # Frontend (React + Vite)
│   ├── public/                 # Статика: PNG-баннеры, логотипы, _redirects
│   │   ├── hero-banner-royal.png
│   │   ├── features-banner.png
│   │   ├── header-bg.png
│   │   ├── gold-button.png
│   │   ├── logo-full.png
│   │   ├── btn-oge.png / btn-ege.png / btn-soc.png / btn-profile.png
│   │   └── _redirects
│   ├── src/
│   │   ├── App.jsx             # Маршруты, Footer, UserChat
│   │   ├── main.jsx
│   │   ├── api.js              # Axios: auth, packages, chat, admin, site-settings
│   │   ├── api.d.ts
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── AuthModal.jsx
│   │   │   ├── Footer.tsx      # Футер (данные из API site_settings)
│   │   │   ├── Header.jsx      # Шапка, бургер-меню, модалка входа
│   │   │   ├── PackageCard.jsx
│   │   │   ├── PrivateAdminRoute.jsx
│   │   │   ├── UserChat.tsx    # Плавающий чат поддержки
│   │   │   └── admin/
│   │   │       ├── AdminChatList.tsx
│   │   │       ├── AdminChatPanel.tsx
│   │   │       ├── AdminChatWindow.tsx
│   │   │       ├── AdminPackages.jsx
│   │   │       ├── CoverUploadField.jsx
│   │   │       ├── FileUploadZone.jsx
│   │   │       ├── PackageFormModal.jsx
│   │   │       └── PackageMaterialsEditor.jsx
│   │   ├── constants/
│   │   │   └── footerDefaults.ts
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useAdminChat.ts
│   │   ├── pages/
│   │   │   ├── HomePage.jsx    # Главная: баннеры, каталог
│   │   │   ├── LandingPage.jsx # Re-export HomePage
│   │   │   ├── PackageDetail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminDashboard.jsx   # Пакеты + встроенный чат
│   │   │   ├── AdminChatPage.tsx
│   │   │   ├── AdminFooterSettings.tsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── AuthPage.jsx
│   │   ├── services/api.ts
│   │   ├── store/
│   │   │   ├── auth.ts
│   │   │   └── chat.ts
│   │   ├── types/index.ts
│   │   └── utils/
│   │       ├── authToken.js
│   │       ├── adminAuth.js
│   │       ├── session.js
│   │       └── packageDraft.js
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env.production
│
└── server/                     # Backend (Express + Prisma)
    ├── prisma/
    │   ├── schema.prisma       # Модели БД
    │   ├── migrations/         # SQL-миграции
    │   ├── sql/                # Ручные SQL для Supabase
    │   └── CHAT_MIGRATION.md
    ├── scripts/
    │   └── verify-prisma-message.mjs
    ├── src/
    │   ├── index.ts            # Точка входа, HTTP + Socket.io
    │   ├── app.ts              # Express app, CORS, роуты
    │   ├── socket.ts           # Socket.io (/support)
    │   ├── config/
    │   │   ├── env.ts
    │   │   ├── db.ts
    │   │   └── dbRetry.ts
    │   ├── lib/
    │   │   ├── prisma.ts
    │   │   ├── cors.ts
    │   │   ├── databaseUrl.ts
    │   │   ├── jwtUser.ts
    │   │   └── siteSettingsDefaults.ts
    │   ├── middleware/
    │   │   ├── auth.ts / verifyToken.ts
    │   │   ├── authMiddleware.ts  # verifyAdmin
    │   │   ├── cors.ts
    │   │   ├── validation.ts
    │   │   ├── upload.ts
    │   │   ├── uploadRespond.ts
    │   │   └── error.ts
    │   ├── routes/
    │   │   ├── index.ts        # /api/auth, packages, purchases, payments, admin
    │   │   ├── auth.ts
    │   │   ├── packages.ts
    │   │   ├── purchases.ts
    │   │   ├── payments.ts
    │   │   ├── admin.ts
    │   │   ├── chat.ts         # /api/chat (отдельно в app.ts)
    │   │   └── siteSettings.ts # /api/site-settings
    │   ├── services/
    │   │   └── yookassa.ts
    │   ├── types/auth.types.ts
    │   └── utils/
    │       ├── cloudinary.ts
    │       └── logger.ts
    ├── uploads/                # Локальные файлы (fallback)
    ├── package.json
    └── .env.example
```

---

## 5. База данных (Prisma / PostgreSQL)

Схема: `server/prisma/schema.prisma`

### `users`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | Идентификатор пользователя |
| email | String UNIQUE | Email для входа |
| password | String | bcrypt-хеш |
| role | String | `user` или `admin` |
| created_at | Timestamptz | |
| updated_at | Timestamptz | |

### `packages`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| title | String | Название |
| slug | String UNIQUE | URL-slug |
| description | Text | Описание |
| price | Int | Цена в рублях |
| category | String | OGE-IST / EGE-IST / EGE-SOC |
| cover_url | String? | URL обложки (Cloudinary) |
| materials | JSON? | Массив материалов (video, text, image, file) |
| created_at / updated_at | Timestamptz | |

### `purchases`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID PK | |
| user_id | UUID FK → users | Покупатель |
| package_id | UUID FK → packages | Пакет |
| status | String | `pending`, `completed`, … |
| created_at | Timestamptz | |

### `messages` (чат поддержки)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | Int, autoincrement |
| senderId | String (TEXT) | **UUID клиента = идентификатор треда чата** |
| content | String | Текст сообщения |
| isAdmin | Boolean | `true` — ответ администратора |
| isRead | Boolean | Прочитано |
| createdAt | Timestamptz | |

**Логика чата:** отдельной таблицы `Chat` нет. Тред = `senderId` (UUID ученика). Сообщения ученика и админа в одном треде имеют одинаковый `senderId`; роль автора — поле `isAdmin`.

### `site_settings` (настройки сайта, key-value)

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| key | String UNIQUE | Ключ настройки |
| value | String | Значение |
| updated_at | Timestamptz | |

**Ключи футера:** `footer_tagline`, `footer_email`, `footer_phone`, `footer_copyright`, `footer_link_*`, `footer_logo_url` — см. `server/src/lib/siteSettingsDefaults.ts`.

---

## 6. API (основные эндпоинты)

### Публичные

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/packages` | Список пакетов |
| GET | `/api/packages/:slug` | Пакет по slug |
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход пользователя |
| POST | `/api/auth/admin-login` | Вход админа |
| GET | `/api/site-settings` | Настройки сайта (футер) |

### Пользователь (JWT)

| Метод | Путь | Описание |
|-------|------|----------|
| GET/POST | `/api/chat/messages` | Чат поддержки |
| GET/POST | `/api/purchases` | Покупки |

### Админ (JWT + role=admin)

| Метод | Путь | Описание |
|-------|------|----------|
| CRUD | `/api/admin/packages` | Пакеты |
| GET | `/api/admin/chats` | Список диалогов |
| GET | `/api/admin/chats/:userId` | Переписка |
| POST | `/api/admin/message` | Ответ клиенту |
| PUT | `/api/site-settings/bulk` | Сохранить настройки |
| POST | `/api/upload` | Загрузка файла |

---

## 7. Что уже реализовано

- [x] Лендинг с PNG-баннерами и каталогом пакетов  
- [x] Регистрация / вход (модалка + JWT в localStorage)  
- [x] Вход администратора (`dinastia_admin` + пароль из env)  
- [x] CRUD пакетов в админке (материалы JSON, обложки Cloudinary)  
- [x] Чат поддержки клиент ↔ админ (REST + polling 4–5 сек)  
- [x] Админ-панель: пакеты, чат, вкладка «Футер»  
- [x] Редактируемый футер через `site_settings`  
- [x] CORS для Render (без credentials conflict)  
- [x] Prisma миграции, деплой на Render  
- [x] Базовая мобильная адаптация (бургер, сетка 1/2/3 колонки, fullscreen чат)  
- [x] Socket.io (бэкенд) — опционально, не основной транспорт чата  

---

## 8. Что нужно сделать

### Приоритет: мобильная адаптация

- [ ] Доработать PNG-баннеры под маленькие экраны (сейчас hero/features — full-width изображения)  
- [ ] Убрать горизонтальный скролл на мобильных  
- [ ] Оптимизировать навигацию в header (кнопки категорий — PNG, тяжёлые на mobile)  
- [ ] Страница «Политика конфиденциальности» (`/privacy` — ссылка есть, страницы нет)  

### Приоритет: платежи

- [ ] Завершить интеграцию **YooKassa** (`server/src/services/yookassa.ts`, `routes/payments.ts`)  
- [ ] Страница оплаты на фронте  
- [ ] Webhook подтверждения оплаты → обновление `purchases.status`  
- [ ] Выдача доступа к материалам после оплаты  

### Другое (из TODO.md)

- [ ] Страница «Мои покупки» с доступом к материалам  
- [ ] Видео/PDF/тесты в пакетах  
- [ ] SEO, отзывы, сертификаты  

---

## 9. Важные архитектурные решения

### Почему `senderId` — String (TEXT), а не UUID / Int

1. **Тред чата = UUID клиента** в поле `senderId` (без отдельного `userId` / таблицы `Chat`).  
2. **String/TEXT**, а не `@db.Uuid`, чтобы Prisma и PostgreSQL не конфликтовали при смешанных миграциях и чтобы избежать ошибки `Conversion from Uuid to Int`.  
3. **`id` сообщения — Int (SERIAL)**, не UUID — проще и совместимо с autoincrement в PostgreSQL.  
4. **Админские ответы:** тот же `senderId` (UUID клиента), `isAdmin: true` — так фильтруется переписка одного клиента.  

### Почему PNG-баннеры, а не вёрстка

- Дизайн «Династия» (золото, синий, герб) сделан в графике и экспортирован в PNG.  
- Файлы в `client/public/`: `hero-banner-royal.png`, `features-banner.png`, `header-bg.png`, кнопки категорий.  
- **Плюсы:** pixel-perfect бренд, быстрый старт.  
- **Минусы:** плохая адаптивность, большой вес — **нужна доработка для mobile**.  

### Почему polling, а не WebSocket-first

- Render **free tier** — сервер засыпает, WebSocket нестабилен.  
- Основной транспорт чата: **REST + setInterval 4–5 сек**.  
- Socket.io оставлен как дополнение.  

### CORS

- Один middleware, **без `credentials: true` + `origin: *`** — иначе POST после OPTIONS блокировался.  

### Миграции на Render

- **`prisma migrate deploy` НЕ в `npm start`** (зависание деплоя).  
- Миграции вручную: Render Shell → `cd server && npx prisma migrate deploy`.  

### Prisma Client

- `prisma generate` в **build** и **start** — актуальный клиент после деплоя.  
- `binaryTargets`: `native`, `debian-openssl-3.0.x` для Render.  

---

## 10. Маршруты фронтенда

| Путь | Страница |
|------|----------|
| `/` | Главная (каталог) |
| `/package/:id` | Детали пакета |
| `/dashboard`, `/purchases` | Личный кабинет |
| `/admin/dashboard` | Админка (пакеты + чат) |
| `/admin/chat` | Полноэкранный чат |
| `/admin/footer-settings` | Настройки футера |

---

## 11. Команды для разработки

### Первый запуск

```bash
# Backend
cd server
cp .env.example .env   # заполнить DATABASE_URL, JWT_SECRET, …
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev              # http://localhost:5000

# Frontend (другой терминал)
cd client
npm install
# создать .env: VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

### Backend

```bash
cd server
npm run dev              # nodemon + ts-node
npm run build            # prisma generate + tsc
npm start                # production
npm run prisma:migrate   # prisma migrate dev (локально)
npm run prisma:studio    # GUI для БД
npx prisma migrate deploy  # production migrations
```

### Frontend

```bash
cd client
npm run dev
npm run build
npm run preview
```

### Git

```bash
git add .
git commit -m "описание"
git push origin main
```

### Render (после деплоя)

```bash
# Shell на backend-сервисе
cd server && npx prisma migrate deploy
```

---

## 12. Админ-доступ

- **Логин:** значение `ADMIN_USERNAME` из env (по умолчанию `dinastia_admin`)  
- **Пароль:** `ADMIN_PASSWORD` из env  
- **Токен:** `localStorage.adminToken` + `localStorage.token`  
- В UI подсказка про admin-логин **убрана** из модалки (вход всё ещё работает)  

---

## 13. Полезные файлы для отладки

| Файл | Зачем |
|------|-------|
| `server/src/app.ts` | Подключение роутов, CORS |
| `server/src/routes/chat.ts` | REST-чат |
| `server/src/routes/siteSettings.ts` | API футера |
| `client/src/api.js` | Все API-вызовы |
| `TODO.md` | Бэклог |
| `server/prisma/sql/` | SQL для ручного запуска в Supabase |

---

*Обновляйте этот файл при значимых изменениях архитектуры или деплоя.*
