# Deployment

## Vercel + Supabase (recommended)

1. Supabase: create project → copy transaction-pooler URI → `DATABASE_URL`. Create a **private** bucket `academy-private`.
2. Locally: `DATABASE_URL=... npm run db:migrate` then `npm run db:seed -- --org "..." --staff-domain ... --admin ...`.
3. Vercel: import the repo; set env vars from `.env.example` (`APP_URL`, `APP_SECRET`, `DATABASE_URL`, `GOOGLE_*`,
   `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `DEMO_MODE`).
4. Add `https://<domain>/api/auth/google/callback` to the OAuth client.

Known limit: Vercel functions accept ~4.5 MB request bodies, so large STL uploads need either a self-hosted Node server
or a future direct-to-storage signed upload (see IMPLEMENTATION_STATUS.md).

## Self-hosted Node

`npm ci && npm run build && npm start` behind HTTPS. With `STORAGE_PROVIDER=local`, persist `.data/` (and use Postgres,
not PGlite, for multi-process or multi-instance deployments). Health check: `GET /api/health`.
