# Architecture

3D Design Academy is a single Next.js (App Router, v16) application written in TypeScript.
Server Components render pages; Server Actions and a small number of Route Handlers perform
mutations, uploads, file delivery and OAuth. All authorization happens on the server.

```
Browser ──► Next.js (proxy.ts: session cookie presence + security headers)
              ├─ app/ (pages, layouts, server actions, route handlers)
              ├─ server/ (services, policies, integrations)  ◄── only imported server-side
              ├─ content/ (curriculum, competencies, badges, standards, model registry)
              └─ components/ (UI primitives, lesson blocks, 3D viewer)
                     │
                     ├─ PostgreSQL (Supabase in production, PGlite embedded for zero-setup dev/demo)
                     ├─ Object storage (Supabase Storage or local disk) via StorageProvider
                     └─ Google APIs (OIDC sign-in, Classroom REST) via ClassroomClient
```

## 1. Repository layout

```
src/
  app/
    (public)/           home, curriculum explorer, attributions, privacy, login, demo
    student/            Home · Skill Tree · Missions · Designs · Portfolio · lesson player · journal
    teacher/            Dashboard · Classes · Curriculum · Students · Print Queue · Resources · Challenges
    admin/              organization admin (teachers, settings, aggregate usage)
    platform/           platform admin (curriculum validation, asset licenses, release info)
    api/                auth/google, auth/logout, files/[...key], uploads, health
  components/
    ui/                 accessible primitives (Button, Card, Dialog, ProgressRing, Tabs, Field…)
    lesson/             one renderer per LessonBlock type + LessonPlayer
    viewer/             Three.js ModelViewer (STL/OBJ/GLB) – client only, lazy loaded
    diagrams/           inline SVG explanatory diagrams referenced by name from content
    nav/                left rail (desktop) / bottom bar (mobile)
    teacher/            heatmap, evidence review, print queue board…
  content/
    schema.ts           Zod schemas for lessons, blocks, competencies, paths, assets
    competencies.ts     Domains A–G and their competencies
    lessons/*.ts        38 V1 lessons (plain data, validated at load + in tests)
    paths.ts            9-week and 18-week course paths
    badges.ts, standards.ts, rubrics.ts, models.ts (ModelAsset registry)
    index.ts            validated registry + lookup helpers
  server/
    db/                 Drizzle schema, client (postgres-js | PGlite), migrate, seed
    auth/               sessions, Google OIDC, demo login, current-user helpers
    policy.ts           every authorization rule in one place (unit-tested)
    services/           courses, progress, mastery, evidence, assignments, printQueue,
                        journal, portfolio, badges, analytics, audit, notifications
    integrations/google ClassroomClient interface, HTTP implementation, fake implementation, sync
    storage/            StorageProvider interface, local + Supabase implementations
    crypto.ts           AES-256-GCM token encryption, signed file URLs
  lib/                  isomorphic helpers (mastery math, formatting, feature flags)
scripts/
  generate-models.ts    builds every original STL from editable source (three + three-bvh-csg)
  export-content.ts     dumps the curriculum as JSON (CMS migration path)
drizzle/                generated SQL migrations
public/models/original  generated, CC BY 4.0/CC0 course models
tests/
  unit/                 Vitest (policies, mastery, content validation, services on PGlite)
  e2e/                  Playwright (demo flows, permissions, a11y smoke)
```

## 2. Key architectural decisions

| # | Decision | Why |
|---|---|---|
| AD1 | Curriculum is **versioned content in `src/content`**, validated by Zod; DB stores only stable string IDs (`lessonId`, `competencyId`) plus per-course overrides. | Curriculum updates need review and versioning; no React edits are needed to change lessons. `npm run content:export` emits JSON for a later CMS. |
| AD2 | **Drizzle ORM** with two drivers: `postgres-js` when `DATABASE_URL` is set (Supabase/any Postgres), embedded **PGlite** otherwise. | Same schema and migrations everywhere; a teacher can run the demo with no database install. Tests run against real Postgres semantics in memory. |
| AD3 | **Custom Google OIDC** (via `arctic`, PKCE + state) with DB-backed sessions instead of Auth.js v5 beta. | Classroom needs incremental scopes, offline refresh tokens and encrypted token storage; a small explicit implementation is easier to audit for a K-12 product. |
| AD4 | **Classroom CourseWork integration** behind a `ClassroomClient` interface (HTTP + fake). | Grades can only be written to CourseWork created by our Cloud project; an Add-on can later be another implementation of the same publishing service. Tests use the fake. |
| AD5 | **Lesson completion and proficiency are separate tables.** Proficiency is recomputed from evidence (best level wins), teacher overrides are timestamped. | Early failure never permanently lowers mastery (spec §23). |
| AD6 | Next lesson unlocks on **completion** (skill check submitted), badges require **proficiency**. | Students aren't blocked waiting for teacher review in a live class, but mastery still requires evidence. Teachers can manually unlock (e.g. Tinkercad unavailable). |
| AD7 | Required lesson files are **original, programmatically generated** models. External Printables models are registered with source + license metadata and stay **link-out only** until a platform admin verifies the license and bundles the file. | Spec §17: a downloadable model is not automatically redistributable. |
| AD8 | Files go through a `StorageProvider`; private files are served only through `/api/files` after a policy check (local) or a short-lived signed URL (Supabase). | Student evidence is never public. |
| AD9 | Feature flags (`src/lib/flags.ts`) hide incomplete features rather than exposing dead buttons. | Spec §60. |

## 3. Route map

Public: `/`, `/curriculum`, `/curriculum/[lessonId]` (overview only), `/attributions`, `/privacy`, `/login`, `/demo`.

Student (`role=student`):
`/student` (home) · `/student/skills` · `/student/missions` · `/student/lessons/[lessonId]` ·
`/student/designs` (submissions + print requests) · `/student/portfolio` · `/student/journal/[lessonId]` · `/settings`

Teacher (`role=teacher`):
`/teacher` (dashboard) · `/teacher/classes` · `/teacher/classes/new` · `/teacher/classes/[courseId]` (overview, needs-help) ·
`/teacher/classes/[courseId]/heatmap` · `/teacher/classes/[courseId]/review` · `/teacher/classes/[courseId]/students/[studentId]` ·
`/teacher/classes/[courseId]/assignments` · `/teacher/classes/[courseId]/settings` (path, lessons, due dates, equipment, Tinkercad, Classroom) ·
`/teacher/curriculum` · `/teacher/curriculum/[lessonId]` (Teacher View) · `/teacher/print-queue` · `/teacher/resources` ·
`/teacher/challenges` · `/teacher/challenges/new` · `/teacher/classroom` (connect/import)

Org admin: `/admin` (usage aggregates) · `/admin/teachers` · `/admin/settings`
Platform admin: `/platform` · `/platform/curriculum` · `/platform/assets`

API: `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/classroom` (incremental consent), `/api/auth/logout`,
`/api/files/[...key]`, `/api/uploads`, `/api/health`.

## 4. Component architecture

- `LessonPlayer` (client) receives a validated `Lesson` and the student's saved block state, renders blocks in phase
  sections (Discover → Practice → Apply → Prove → Reflect) and calls server actions (`saveBlockResponse`,
  `recordAttempt`, `submitEvidence`, `completeLesson`).
- Each block type has a renderer in `components/lesson/blocks/*` registered in `blockRegistry`. Adding a block type =
  schema entry + renderer + (optional) scoring function in `lib/scoring.ts`.
- `ModelViewer` is dynamically imported (`ssr:false`), loads STL/OBJ/GLB, shows build plate, bounding-box dimensions,
  wireframe, reset, layer slicing preview, and clickable hotspots; it fails gracefully without WebGL or file.
- Teacher components are server-rendered tables with small client islands (heatmap cell drawer, status menus).

## 5. Google Classroom integration

See [google-classroom.md](google-classroom.md).

## 6–7. Curriculum & asset schemas

See [curriculum-model.md](curriculum-model.md), [competency-model.md](competency-model.md), [model-licensing.md](model-licensing.md).

## 8. Implementation phases

Matches spec §54; progress is tracked in `IMPLEMENTATION_STATUS.md`.

## 9. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Content | Vitest | every lesson validates; every referenced competency/asset/diagram/prerequisite exists; both paths cover only real lessons |
| Pure logic | Vitest | mastery math, scoring, prerequisites, policies, crypto, print-status transitions |
| Services | Vitest + in-memory PGlite | authorization boundaries (student ↔ student, teacher ↔ other org), roster sync idempotency, duplicate assignment prevention, failed Google calls leave local data intact, completion ≠ proficiency |
| E2E | Playwright | demo login as student/teacher, complete a lesson block, submit evidence, heatmap override, print queue, permission redirects |
| Build | `npm run check` | lint + typecheck + unit tests + production build |
