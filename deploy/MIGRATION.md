# Переезд на российский VPS

Цель: перенести фронтенд + бэкенд с Render на российский сервер. **База и файлы
остаются в Supabase** (доступен из РФ) — данные не переносятся, риск потери нулевой.
Домен `dinastiy.com` сохраняется (см. в чате про `.ru`).

Принцип: всё поднимаем на новом сервере параллельно, домен переключаем **в самом
конце**, когда проверено. Render не выключаем ещё 2–3 дня — страховка на откат.

---

## 0. Заранее (за сутки до переключения)
- У регистратора домена снизить **TTL** A-записи до `300` сек — иначе переключение растянется на часы.
- Купить VPS: Ubuntu 22.04+, от 2 ГБ RAM (Timeweb Cloud / Beget / Selectel). Записать IP.

## 1. Базовая настройка сервера
```bash
ssh root@<IP>
adduser deploy && usermod -aG sudo deploy      # рабочий пользователь
apt update && apt upgrade -y
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
```
Дальше работаем под `deploy` (вход по SSH-ключу).

## 2. Окружение
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo apt install -y certbot python3-certbot-nginx
node -v   # должно быть 20.x
```

## 3. Код
Репозиторий приватный → добавить на GitHub **deploy key** (SSH-ключ сервера).
```bash
sudo mkdir -p /var/www/dinastiy && sudo chown deploy:deploy /var/www/dinastiy
cd /var/www/dinastiy
git clone git@github.com:stonkskoding-cmd/online-school.git .
```

## 4. Бэкенд
```bash
cd /var/www/dinastiy/server
cp <репо>/deploy/server.env.example .env   # и заполнить реальными значениями
npm ci
npm run build                 # prisma generate + tsc
npx prisma migrate deploy     # применит миграции через DIRECT_URL (порт 5432)
```
Автозапуск:
```bash
sudo cp /var/www/dinastiy/deploy/dinastiy-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now dinastiy-backend
curl -s http://127.0.0.1:10000/api/health   # {"status":"ok",...}
```

## 5. Фронтенд
```bash
cd /var/www/dinastiy/client
cp <репо>/deploy/client.env.production.example .env.production   # заполнить anon key
npm ci
npm run build                 # → client/dist
```
nginx смотрит в `/var/www/dinastiy/client` (root в конфиге). Проще всего:
```bash
# вариант: указать root прямо в dist, либо симлинк
sudo ln -s /var/www/dinastiy/client/dist /var/www/dinastiy/client-dist
```
(или в nginx-конфиге поставить `root /var/www/dinastiy/client/dist;` — так надёжнее)

## 6. nginx
```bash
sudo cp /var/www/dinastiy/deploy/nginx-dinastiy.conf /etc/nginx/sites-available/dinastiy
# ВАЖНО: в конфиге root должен указывать на .../client/dist
sudo ln -s /etc/nginx/sites-available/dinastiy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Проверка ДО переключения домена
На своём компьютере временно прописать в hosts: `<IP> dinastiy.com`, открыть сайт и прогнать:
- каталог грузится, обложки видны;
- регистрация + вход ученика;
- **покупка** (тестовая, мелкая сумма) → оплата → доступ открылся;
- чат поддержки (сообщения ходят — проверка WebSocket);
- админка: вход, создание/редактирование пакета, загрузка обложки.
Убрать строку из hosts.

## 8. Переключение (когда п.7 прошёл)
1. У регистратора: A-запись `dinastiy.com` (и `www`) → `<IP VPS>`.
2. Дождаться распространения DNS (обычно минуты при TTL 300).
3. Выпустить SSL:
   ```bash
   sudo certbot --nginx -d dinastiy.com -d www.dinastiy.com
   ```
4. В кабинете **ЮKassa** → HTTP-уведомления: webhook остаётся
   `https://dinastiy.com/api/payments/webhook` (адрес не меняется — домен тот же). Проверить.
5. Контрольная покупка на боевом домене.

## 9. После переезда
- Render можно остановить через 2–3 дня стабильной работы (не удалять сразу).
- GitHub Action keep-alive (`ping-backend.yml`) больше не нужен — VPS не засыпает; можно отключить.
- Настроить бэкапы: у Supabase свои; VPS — снапшоты у хостера.

---

## Обновление сайта в будущем (деплой)
```bash
cd /var/www/dinastiy && git pull
cd server && npm ci && npm run build && npx prisma migrate deploy && sudo systemctl restart dinastiy-backend
cd ../client && npm ci && npm run build
sudo systemctl reload nginx
```

## Откат
Пока Render жив: вернуть A-запись домена на Render — сайт снова на старом хостинге.
Данные общие (Supabase), поэтому расхождений нет.
