# testgov.kz

Production-ready LMS-style platform for Kazakh government test preparation.

## Features

- **Hierarchical content**: Category → Program → Module → Language → Questions
- **Two languages, separate banks**: each Module has KK and RU `Test` rows with their own questions (not translations)
- **Test engine**: 4 modes — `CLASSIC`, `CLASSIC_WITH_BACK`, `INSTANT_FEEDBACK`, `ALL_QUESTIONS_PAGE`. Settings: shuffle questions/answers, time limit + auto-submit, max attempts, passing score, question subset, require auth, require answer, show score during, show correct answers
- **Auth**: Auth.js v5 (credentials + JWT), `USER` / `ADMIN` roles
- **Time-based access**: `UserAccess` rows with `expiresAt`; checked on every protected route
- **Rich question builder**: TipTap with bold/italic/underline, headings, lists, links, image upload, YouTube embed; HTML sanitized via DOMPurify
- **Admin panel**: full CRUD on Categories / Programs / Modules / Tests / Questions, manual access grants, users + orders views
- **Payments**: provider abstraction with stub provider for dev; Kaspi/APIpay skeleton ready for credentials
- **Local file storage** under `./uploads`, swappable to S3 via `STORAGE_DRIVER`
- **i18n**: `next-intl` with `kk` / `ru` locales

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- PostgreSQL 16 + Prisma 5
- Auth.js v5
- TipTap 2 (rich editor)
- next-intl (i18n)
- Vitest

## Run with Docker

```bash
cp .env.example .env       # edit if needed
docker compose up --build
```

Open http://localhost:3000

The dev container automatically:
1. Waits for Postgres
2. Runs `prisma migrate deploy`
3. Seeds 4 categories, 5 programs, 3 modules with KK/RU content & tests, 1 admin + 1 demo user

**Default users:**
- Admin: `admin@testgov.kz` / `changeme`
- Demo user (with active access): `user@testgov.kz` / `user1234`

## Development without Docker

```bash
npm install --legacy-peer-deps
# Postgres must be running on localhost:5432
export DATABASE_URL="postgresql://testgov:testgov@localhost:5432/testgov?schema=public"
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## Routes

### Public (`/[locale]/...` where locale = `kk` | `ru`)
- `/` — landing
- `/login`, `/register`
- `/categories` — category list
- `/categories/[slug]` — programs in category
- `/programs/[slug]` — modules + buy CTA
- `/modules/[id]` — law content / tests in module (auth + access required)
- `/tests/[id]` — start screen
- `/tests/[id]/run?attempt=...` — runner (mode-aware)
- `/dashboard` — profile + history
- `/dashboard/attempts/[id]` — result detail

### Admin (`/admin/...`, role-gated)
- `/admin` — dashboard
- `/admin/categories`, `/admin/programs`, `/admin/modules`, `/admin/tests` — CRUD
- `/admin/modules/[id]` — KK/RU content tabs + test list
- `/admin/tests/[id]/settings` — all test settings
- `/admin/tests/[id]/questions` — TipTap question builder with image upload
- `/admin/users`, `/admin/access`, `/admin/orders`

### API
- `/api/auth/*` — Auth.js
- `/api/register` — create user
- `/api/upload` — admin-only image upload to local storage
- `/api/tests/[id]/start` — create attempt with locked question snapshot
- `/api/attempts/[id]/answer` — submit one answer (used by `INSTANT_FEEDBACK`)
- `/api/attempts/[id]/finish` — score and finalize
- `/api/payments/checkout` — create order via provider
- `/api/payments/webhook/[provider]` — provider callback → grants access on `PAID`

## Test engine internals

- **Question selection** happens server-side at `/api/tests/[id]/start`. Apply `shuffleQuestions`, then trim to `questionLimit`. The resulting ID array is persisted in `Attempt.questionOrder` so the client cannot re-shuffle, extend, or substitute.
- **Answer order** is shuffled per-render when `shuffleAnswers` is enabled; correctness is checked by `Answer.id`, not position.
- **Time enforcement** is server-authoritative: `Attempt.startedAt` is the source of truth. The runner shows a countdown for UX, but the answer/finish endpoints reject submissions past `timeLimitSec`. Auto-submit fires client-side when the timer hits zero.
- **Attempt limit** is checked at start by counting finished attempts.
- **Scoring**: `(correct / total) * 100`, rounded; `passed = score >= passingScore`.

## Payments

Two providers in `src/lib/payments/`:
- `StubProvider` (default, `PAYMENT_PROVIDER=stub`) — fake checkout that POSTs back the webhook locally. Useful for dev and CI.
- `KaspiProvider` — typed skeleton; fill in HTTP calls + signature verification when APIpay credentials are available. No schema or flow changes needed when swapping.

Webhook on `PAID` creates a `UserAccess` row with `expiresAt = now + program.durationDays`.

## Storage

`STORAGE_DRIVER=local` writes uploaded images to `./uploads/<subdir>/<uuid>.<ext>`. Files are served via `/uploads/[...path]` route handler. To switch to S3 / R2 later, implement a new `Storage` class in `src/lib/storage/` and register it in `getStorage()`.

## Deployment to Render

1. Create a Postgres database on Render.
2. Create a Web Service from this repo using the production Dockerfile (`Dockerfile`, not `Dockerfile.dev`).
3. Set environment variables:
   - `DATABASE_URL` → Render Postgres URL
   - `AUTH_SECRET` → 32+ char random string
   - `NEXTAUTH_URL` → your Render URL
   - `PUBLIC_BASE_URL` → same
   - `STORAGE_DRIVER=local`, `UPLOAD_DIR=/var/data/uploads`, `PUBLIC_UPLOAD_PATH=/uploads`
   - `PAYMENT_PROVIDER=stub` (or `kaspi` once wired)
4. Attach a Render persistent disk mounted at `/var/data` for `uploads/` to survive restarts. (For higher reliability, switch `STORAGE_DRIVER` to `s3` once that adapter is implemented.)
5. Add a release command: `npx prisma migrate deploy`.

## Tests

```bash
npm test
```

Vitest covers the pure logic in `src/lib/shuffle.ts`. Integration tests against the engine + DB can be added under `tests/` as needed.

## Project layout

See [src/](src/):

```
src/
├── app/
│   ├── [locale]/                # public site (kk | ru)
│   ├── admin/                   # admin panel (role-gated, RU)
│   ├── api/                     # route handlers
│   ├── payments/stub/           # fake payment landing
│   └── uploads/[...path]/       # local file server
├── components/
│   ├── editor/TipTapEditor.tsx
│   ├── test-runner/TestRunner.tsx
│   ├── site/                    # header, footer, providers, lang switcher
│   └── ui/                      # button, input, card, badge, …
├── lib/
│   ├── auth.ts                  # Auth.js config
│   ├── prisma.ts                # singleton client
│   ├── access.ts                # assertProgramAccess / assertTestAccess
│   ├── test-engine.ts           # selection, scoring, timing
│   ├── sanitize.ts              # DOMPurify wrapper
│   ├── storage/                 # Storage interface + LocalStorage
│   └── payments/                # PaymentProvider + Stub + Kaspi skeleton
├── i18n/
│   ├── config.ts, request.ts
│   └── messages/{kk,ru}.json
└── middleware.ts                # locale routing + bypasses for /admin /api /uploads
```
