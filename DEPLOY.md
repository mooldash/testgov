# Деплой testgov.kz на Render.com

## Что разворачивается

Проект состоит из **2 сервисов** + **1 диска** в Render:

| Компонент | Тип в Render | Зачем |
|---|---|---|
| `testgov-db` | PostgreSQL 16 (managed) | Основная база данных |
| `testgov` | Web Service (Docker) | Next.js приложение |
| `testgov-uploads` | Persistent Disk (привязан к web) | Хранилище загруженных изображений `/app/uploads` |

Если бы не нужен был upload картинок, диск был бы не нужен — но без него все картинки в вопросах пропадут при каждом редеплое.

---

## Способ 1: Blueprint (рекомендую) — один клик

В корне репо лежит [`render.yaml`](./render.yaml) — декларативное описание всей инфраструктуры. Render умеет читать его и создавать БД + сервис + диск одной кнопкой.

### Шаги:

1. Запушь репозиторий на GitHub (Render тянет код оттуда).
2. Зайди на [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Подключи GitHub-репо. Render найдёт `render.yaml` автоматически.
4. На экране подтверждения Render покажет 2 сервиса + 1 БД. Для трёх переменных он попросит ввести значения вручную (они помечены `sync: false`):
   - `NEXTAUTH_URL` → твой будущий URL, например `https://testgov.onrender.com` (после первого деплоя посмотри реальный URL и обнови)
   - `PUBLIC_BASE_URL` → то же самое
   - `SEED_ADMIN_EMAIL` → твой email
   - `SEED_ADMIN_PASSWORD` → надёжный пароль (запиши его)
5. Нажми **Apply**.
6. Render создаст БД (~2 мин), потом задеплоит сервис (~3-5 мин). После этого открой URL — должна загрузиться главная.

### Что делать на первом деплое (нужно один раз):

Сервис уже запущен, но БД пустая. Открой в дашборде Render свой сервис → **Shell** (вкладка) → запусти:

```bash
npx prisma db push --skip-generate --accept-data-loss
npm run prisma:seed
```

Первая команда создаст таблицы из `prisma/schema.prisma`. Вторая зальёт: 4 категории, 6 программ, 12 модулей, 9 placeholder-тестов, дефолтные тарифы для каждой программы, админа (с email/паролем из env). Готово — заходи на `https://<твой-домен>/admin` и логинься.

---

## Способ 2: Вручную (если Blueprint не сработал)

### 2.1 Создай PostgreSQL

1. Dashboard → **New** → **PostgreSQL**
2. Name: `testgov-db`, Database: `testgov`, User: `testgov`, Region: **Frankfurt** (ближе к KZ)
3. Plan: **Basic 256 MB** ($7/мес) для production. Free хватит на тест, но удаляется через 30 дней.
4. Дождись «Available». Скопируй **Internal Database URL** — он нужен сервису.

### 2.2 Создай Web Service

1. Dashboard → **New** → **Web Service**
2. Подключи репозиторий GitHub
3. Settings:
   - **Runtime**: Docker
   - **Dockerfile path**: `./Dockerfile`
   - **Region**: Frankfurt (как БД!)
   - **Plan**: Starter ($7/мес) или выше
   - **Health Check Path**: `/`
4. **Environment Variables** (см. таблицу ниже)
5. **Disks** (вкладка) → Add Disk:
   - Name: `testgov-uploads`
   - Mount Path: `/app/uploads`
   - Size: 1 GB
6. Create Web Service

### 2.3 Переменные окружения

| Ключ | Значение | Откуда |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Internal URL из шага 2.1 |
| `AUTH_SECRET` | случайные 32+ символа | сгенерируй: `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | |
| `NEXTAUTH_URL` | `https://<твой-сервис>.onrender.com` | URL сервиса из Render |
| `PUBLIC_BASE_URL` | то же | |
| `STORAGE_DRIVER` | `local` | |
| `UPLOAD_DIR` | `/app/uploads` | должен совпадать с mount path диска |
| `PUBLIC_UPLOAD_PATH` | `/uploads` | |
| `PAYMENT_PROVIDER` | `stub` | пока не подключена Kaspi |
| `SEED_ADMIN_EMAIL` | `admin@example.kz` | твой email для админа |
| `SEED_ADMIN_PASSWORD` | надёжный пароль | запиши его |
| `NODE_ENV` | `production` | |

### 2.4 Первый запуск

После того как сервис задеплоился, открой его Shell и выполни:

```bash
npx prisma db push --skip-generate --accept-data-loss
npm run prisma:seed
```

---

## Кастомный домен (опционально)

1. В сервисе → **Settings** → **Custom Domains** → Add → введи `testgov.kz`
2. Render даст инструкции для DNS — добавь CNAME или A-запись у своего регистратора
3. Обнови `NEXTAUTH_URL` и `PUBLIC_BASE_URL` на новый домен
4. Render выдаст бесплатный SSL автоматически (Let's Encrypt)

---

## Обновление кода

После настройки Render следит за веткой `main` в GitHub. Push → автоматический redeploy.

### Если меняешь схему БД

В корневом репо отредактируй `prisma/schema.prisma`, закоммить, запушь. После деплоя зайди в Shell сервиса:

```bash
npx prisma db push --skip-generate
```

Для production желательно использовать миграции вместо `db push`: `npx prisma migrate dev --name <название>` локально создаст файл миграции, а на сервере `npx prisma migrate deploy` его применит. Это безопаснее.

---

## Резервные копии БД

### Уровень 1: Автоматические бэкапы Render (бесплатно)

PostgreSQL планы Basic и выше делают **автоматические ежедневные снимки** + **point-in-time recovery** (PITR) с retention 7 дней. Точка восстановления — любая секунда за последние 7 дней.

Где это в дашборде: Database → **Recovery** (вкладка). Восстановление — кнопкой, новая БД создаётся в течение ~10 минут.

**Это основная стратегия.** Дополнительные ручные бэкапы — на случай если: (а) хочешь файл у себя на компьютере, (б) нужно перенести БД на другой хостинг, (в) Render лежит.

### Уровень 2: Кнопка «Скачать резервную копию» в админке

В `/admin` (главный дашборд) внизу есть карточка **«Резервная копия БД»** с кнопкой **«Скачать»**. Клик → файл `testgov-backup-<дата>.sql` скачивается на твой компьютер.

Технически это streamed `pg_dump --no-owner --no-privileges --clean --if-exists` через защищённый эндпоинт `/api/admin/backup` (только для роли ADMIN, прокси через next-auth). Файл — полный портативный SQL, который можно залить на любой PostgreSQL.

**Делать раз в неделю минимум.** Хранить в нескольких местах (локально + облако типа Google Drive / Dropbox).

### Уровень 3: Cron-задача (опционально, для параноиков)

Если хочешь автобэкап в S3/GDrive — создай в Render отдельный **Cron Job** сервис:

```yaml
# дополнительно в render.yaml
- type: cron
  name: testgov-backup-cron
  runtime: docker
  schedule: "0 3 * * *"  # каждый день в 3:00 UTC
  dockerfilePath: ./Dockerfile
  dockerCommand: |
    sh -c 'pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://my-bucket/testgov/backup-$(date +%F).sql.gz'
  envVars:
    - key: DATABASE_URL
      fromDatabase:
        name: testgov-db
        property: connectionString
    - key: AWS_ACCESS_KEY_ID
      sync: false
    - key: AWS_SECRET_ACCESS_KEY
      sync: false
```

Это надстройка — не обязательная для MVP.

### Восстановление из SQL-файла

Если был скачан через админку, восстановить можно так:

**На Render** — через Shell сервиса:
```bash
psql $DATABASE_URL < /tmp/testgov-backup-2026-05-19.sql
```
(но файл надо как-то загрузить в контейнер — проще через `cat`/heredoc или через временный загрузчик)

**Локально** — против локальной БД:
```bash
psql "postgresql://testgov:testgov@localhost:5432/testgov" < testgov-backup-2026-05-19.sql
```

**На новую Render-БД** — создай новую Postgres, возьми её URL, и выполни ту же команду подставив новый `DATABASE_URL`.

> **Важно**: SQL-дамп включает `DROP TABLE` для всех таблиц перед `CREATE TABLE`. То есть восстановление **затирает** текущие данные. Не лей бэкап на боевую БД случайно.

---

## Сколько это стоит

| Компонент | Минимум | Рекомендую |
|---|---|---|
| PostgreSQL | Free (удаляется через 30 дней) → **Basic 256 MB $7/мес** | Basic 1 GB $20/мес если данных много |
| Web Service | Free (засыпает через 15 мин неактивности) → **Starter $7/мес** | Standard $25/мес для нагрузки |
| Disk 1 GB | бесплатно с любым платным сервисом | |
| **Итого** | **$14/мес** (Basic + Starter) | $45/мес (Basic 1 GB + Standard) |

Free-планы хороши для демо, но для production: Postgres free **удалит данные через 30 дней**, а web free **засыпает** — первый запрос после простоя ждёт ~30 сек.

---

## Чек-лист безопасности перед production

- [ ] `AUTH_SECRET` ≥ 32 символа, случайный (`openssl rand -base64 32`)
- [ ] `SEED_ADMIN_PASSWORD` ≥ 16 символов, не словарное слово
- [ ] Сразу после первого логина смени пароль админа через **Кабинет → Настройки**
- [ ] `DATABASE_URL` — Internal (не Public), чтобы БД не была видна из интернета
- [ ] Custom Domain + SSL включён
- [ ] Включён Render auto-deploy ТОЛЬКО на ветку `main` (или `production`), не на dev-ветки
- [ ] Скачана хотя бы одна резервная копия и сохранена в безопасном месте
- [ ] `PAYMENT_PROVIDER=stub` пока не подключены реальные платежи Kaspi (иначе кто угодно сможет «купить» программу за 0₸)

---

## Траблшутинг

**Сервис не стартует, ошибка про Prisma Client**
→ В Shell: `npx prisma generate && touch /tmp/restart.txt` или просто Manual Deploy кнопкой.

**`Error: P1001: Can't reach database server`**
→ Проверь что `DATABASE_URL` использует **Internal** хост (`...-internal.frankfurt-postgres.render.com`), а не Public. Только Internal работает между сервисами в одном регионе и не требует SSL-сертификата.

**Картинки в вопросах пропадают после деплоя**
→ Диск не подключён или `UPLOAD_DIR` указывает не на mount path. Проверь Settings → Disks.

**В таблице доступов ничего нет после деплоя**
→ Не выполнил `npm run prisma:seed`. Зайди в Shell сервиса и запусти.

**Бэкап-кнопка отдаёт 500**
→ `pg_dump` не установлен в образе. Проверь, что в Dockerfile в стадии `runner` есть `RUN apk add postgresql16-client`. Передеплой.

**Render free план постоянно засыпает**
→ Это by design на free. Перейди на Starter ($7) или используй внешний пинг-сервис (UptimeRobot) каждые 5 минут.
