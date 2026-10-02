# Implementation status

_Last updated: 2026-10-02 (checkpoint 1)._ Checks at this checkpoint: content validation ✅ · lint ✅ · typecheck ✅ ·
109 unit/service tests ✅ · 3 Playwright e2e ✅ · production build ✅.

## Completed

- **Architecture & docs** — `docs/` (architecture, google-classroom, curriculum-model, competency-model, model-licensing, privacy, deployment, content-authoring), README, `.env.example`.
- **Phase 1 Foundation** — Next.js 16 + TS + Tailwind v4; Drizzle schema (28 tables) with migrations; Postgres via `DATABASE_URL` or zero-setup embedded PGlite; custom Google OIDC (PKCE) + DB sessions; demo login; four roles with server-side policy module; org/course/enrollment model; join codes; responsive shell (left rail / bottom nav), dark/light, text size, dyslexia spacing, reduced motion; self-hosted fonts; seed data per spec §49.
- **Phase 2 Curriculum engine** — Zod content schema; 66 competencies (A–G); 40 lessons; 9-week and 18-week paths; path-aware prerequisites; completion separate from proficiency; best-level-wins mastery, overrides with history; badges; rubrics; journal prompts; standards records + mapping; content validator + JSON export.
- **Phase 3 Interactive components** — lesson player with 22 block types: predict, multiple choice/skill check, ordering, matching, 3D hotspot, measurement, Show Me / Read It, observe (Print Detective), challenges/boss (elapsed timer), Tinkercad launch (+ class Tinkercad Classroom link), model downloads with 3D preview + license, evidence upload (screenshot/STL/OBJ/link/physical test), autosaving reflections and design journals, teacher checks. Server-side scoring with answer redaction; explanation revealed after 3 tries. Three.js viewer (STL/OBJ/GLB, build plate, dimensions, wireframe, layer slider, hotspots, keyboard controls, graceful failure). 51 SVG diagrams.
- **Phase 4 Teacher experience** — dashboard across classes; class overview (active today, completion, mastery, misconceptions, “may need help”); heatmap (groups / all competencies, glyph+color, cell → evidence); review queue with ratings/feedback/revision; student detail with override, teacher checks, rubric scoring, journals; class settings (path, Tinkercad URL, equipment, per-lesson enable/due/manual unlock, roster add/archive); Teacher View for every lesson with student preview.
- **Phase 5 Google Classroom** — incremental consent, encrypted tokens + refresh/revoke, course listing/import, idempotent roster sync (not-in-roster flagging, no deletion), periodic safe sync, publish CourseWork with deep links + model links + topic + due date, duplicate prevention, failure/retry, deleted-in-Classroom detection, manual and opt-in automatic grade sync, friendly errors. Fake client for demo/tests.
- **Phase 6 Fabrication** — 19 original STL models generated from source; asset registry with licensing; attributions page; external Printables models recorded as link-out pending verification; print queue (8 statuses, role-checked transitions, optimistic concurrency, notes/printer/filament/time/failure reason, history, notifications); student print requests.
- **Student pages** — Home (spec §11), Skill Tree + badges, Missions map, Designs (submissions + prints), Portfolio (featured, challenges, journals, reflections, growth), notifications, settings.
- **Admin** — org admin (staff roles, promote student→teacher, domains, upload policy, admin-visibility opt-in, aggregate usage); platform admin (curriculum validation, asset license table).

## Partially completed

- **Curriculum quality review** — all 40 lessons validate and were authored to the brief, but need a teacher read-through and a Tinkercad UI accuracy pass (authors flagged uncertain claims: align reference shape, mirror behaviour, ruler readout, snap-grid values, copy/paste between designs).
- **Accessibility** — keyboard paths, labels, glyph+color, focus, reduced motion, text sizing done; no automated axe audit or screen-reader pass yet. 3D hotspot has a keyboard/button fallback.
- **Teacher check recording** — one form per student page (select the check); no bulk class-wide observation sheet yet.
- **Portfolio PDF export** — not built (spec marks it as a later release).
- **E2E coverage** — 3 smoke flows; Classroom/upload/print flows are covered by service tests, not browser tests.

## Not started

- Teacher-authored custom challenges and custom model uploads (spec §42 “eventually”; tables exist: `custom_challenges`, `custom_assets`).
- Direct-to-storage signed uploads (needed for STL > ~4.5 MB on Vercel).
- Classroom Add-on implementation; organization-wide sharing of challenges.
- Platform-admin in-app curriculum editor (V1 uses validated content files + releases).
- Captions/transcripts for videos (no videos are bundled; the video block requires a transcript).

## Known issues

- External Printables models: licenses could not be verified automatically (pages render client-side); 3 have no source URL. They are link-out only.
- Fonts/diagram numbers in a few diagrams are illustrative (e.g. material grams).
- PGlite is single-process: use Postgres for production and for running `next build` while `next dev` writes data concurrently in CI.
- Heatmap group levels are a floor of the mean; teachers should open the detail view before grading decisions.

## Architectural decisions

See `docs/architecture.md` §2 (AD1–AD9): content-as-code curriculum, Drizzle with Postgres/PGlite, custom OIDC instead of Auth.js beta, CourseWork integration behind a client interface, completion ≠ proficiency, completion unlocks / proficiency earns badges, original required models + link-out external models, storage provider interface, feature flags over dead buttons.
