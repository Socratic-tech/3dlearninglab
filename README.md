# 3D Design Academy

Interactive, competency-based middle-school CAD, engineering and 3D printing curriculum platform.
Tinkercad is the CAD workspace; Google Classroom is an optional integration.

> Students should not prove that they can follow Tinkercad instructions. They should prove that they know what to do when the instructions disappear.

## Two editions

- **Pages + Google edition** (`web/` + `apps-script/`): static site on GitHub Pages, student data in each teacher's Google Sheet/Drive. Setup: [docs/pages-edition.md](docs/pages-edition.md) · send teachers [docs/teacher-quickstart.md](docs/teacher-quickstart.md).
- **Full edition** (Next.js, below): Postgres-backed, all teacher tools (print queue, rubrics, Classroom grade sync).

Both share the same curriculum, lesson player, 3D viewer and scoring rules.

## Quick start (no accounts, no database install)

```bash
npm install
npm run dev
# open http://localhost:3000/demo
```

With no `DATABASE_URL`, the app uses an embedded Postgres (PGlite) in `.data/pglite`, migrates it and seeds a demo
class (**3D Design — Period 2**: teacher@example.test, Maya, Luis, Ava, Jordan, Mia, plus admin accounts).
Google Classroom is simulated for demo accounts. Reset the demo from **Settings → Reset demo data**.

## Prerequisites

- Node.js 20.9+ (22 LTS recommended)
- For production: a Postgres database (Supabase recommended), a private storage bucket, and a Google Cloud project.

## Environment

Copy `.env.example` to `.env.local` and fill in what you need. Never commit `.env*` files (only `.env.example`).
`APP_SECRET` is required in production: `openssl rand -base64 32`.

## Database

```bash
npm run db:migrate                 # apply drizzle/ migrations to DATABASE_URL (or local PGlite)
npm run db:seed                    # seed demo data into an EMPTY database
npm run db:seed -- --reset-demo    # recreate the demo organization only
npm run db:seed -- --org "Berrien Springs MS" --staff-domain district.org --student-domain students.district.org --admin you@district.org
npm run db:generate                # after editing src/server/db/schema.ts
```

Supabase: create a project, copy the **transaction pooler** URI (port 6543) into `DATABASE_URL`, run `npm run db:migrate`.

## Google Cloud configuration

1. Create a Google Cloud project; **APIs & Services → Library → enable "Google Classroom API"**.
2. **OAuth consent screen**: Internal (Workspace) or External; add scopes `openid email profile` and the Classroom scopes in
   [docs/google-classroom.md](docs/google-classroom.md). Add test users while unverified.
3. **Credentials → Create OAuth client ID → Web application.** Authorized redirect URI:
   `https://YOUR_DOMAIN/api/auth/google/callback` (and `http://localhost:3000/api/auth/google/callback` for development).
4. Put the client ID/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Create your organization with `npm run db:seed -- --org ...` so your domain can sign in.

Students sign in with basic scopes only. Teachers grant Classroom access separately (incremental consent) from
**Teacher → Classes → Import from Google Classroom**.

## Storage

`STORAGE_PROVIDER=local` writes to `.data/uploads` (fine for a single server). For serverless/production use
`STORAGE_PROVIDER=supabase` with a **private** bucket (`SUPABASE_STORAGE_BUCKET`) and the service-role key (server only).
Files are only ever served through `/api/files/...` after an authorization check.

## Tests & checks

```bash
npm run content:validate   # curriculum schema + cross-references
npm run lint
npm run typecheck
npm test                   # Vitest: logic, content, services on in-memory Postgres, Classroom (fake client)
npm run test:e2e           # Playwright against a running dev server (see playwright.config.ts)
npm run check              # all of the above + production build
```

## Curriculum & models

- Lessons: `src/content/lessons/*.ts` — see [docs/content-authoring.md](docs/content-authoring.md).
- Original STL models: `npm run models:generate` (source: `scripts/generate-models.ts`) → `public/models/original`.
- Licensing rules: [docs/model-licensing.md](docs/model-licensing.md). Credits page: `/attributions`.

## Deployment

See [docs/deployment.md](docs/deployment.md). Status of every feature: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
