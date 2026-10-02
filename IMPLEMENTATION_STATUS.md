# Implementation status

_Last updated: 2026-10-02 (checkpoint 1)._ Checks at this checkpoint: content validation ✅ · lint ✅ · typecheck ✅ ·
109 unit/service tests ✅ · 3 Playwright e2e ✅ · production build ✅.

## Completed

- **Pages + Google edition (checkpoint 2, 2026-10-02)** — static site (`web/`, Vite) on GitHub Pages reusing the lesson player, viewer, diagrams and UI; Apps Script API (`apps-script/`) storing data in the teacher's Sheet/Drive; Google ID-token auth with domain + roster checks; server-side scoring with shared `src/lib` (bundled to `Lib.js`); redacted public lesson data (no answer keys or teacher guides in the bundle); student missions/skills, step-by-step lessons, evidence uploads to Drive, reflections, journals; teacher overview, heatmap with overrides, review queue, roster (manual + Classroom import), class link. GitHub Actions deploy. Tested with a VM-hosted copy of the real Apps Script bundle (`tests/unit/apps-script.test.ts`) and a browser smoke run against `scripts/pages-mock-api.ts`. Not yet tested against live Google.
- **More engaging content (2026-10-02)** — "In the real world" opener on all 40 lessons (fact-checked: printed rockets, shoe midsoles, hearing aids, Dyson prototypes, OXO, keyboard pitch, Apollo 13, e-NABLE…), fictional client requests on 32 challenges, pick-your-theme options on open-ended challenges, a swipeable Fail Gallery in Print Detective and Print Failures, and five XP-unlocked looks (Blueprint, Neon 150, Arcade 400, Sunset 800, Galaxy 1500; AA colours, off in high contrast). Content lives in `src/content/flavor.ts`.
- **Easy deploy + classroom tools (2026-10-02)** — Teachers set up from a “Make a copy” template Sheet: menu → side panel (prepare tabs, pictured deploy steps, create classes, student links + QR codes, sign-in domains), with the site address and sign-in client ID baked in at build (`apps-script/build.config.json`). One-click **Update now** installs new versions via the Apps Script API (bundle published at `apps-script/update.json`). Copies reset the original owner's script properties. Speed: XP Summary tab (incremental), per-request tab memo, lock-aware fresh reads, no full answer-log scans on hot paths. Teacher **Right now** panel (stuck 3+ tries, quiet 10+ min, most-missed questions; refreshes every minute). **Print queue** (Prints tab; request on STL upload or from My prints; teacher statuses + notes). **Printable handouts** for offline/part-offline challenges. **Review deck** on the student home with deep links to the exact screen. 10 more slider questions (15 total) with 5 new scenes (rotate, lift, spacing, wall, bridge). Docs: `docs/teacher-quickstart.md`.
- **Brilliant-style learning loop (2026-10-02)** — one big Check button in the bottom bar; instant feedback sheet with “Why?”; Try again / Continue; question screens must be attempted before moving on (uploads and reflections can wait; teacher preview can skip). Mission path home (zig-zag trail of circles by unit, “Start” marker). XP (10 first try, +5 first correct, 20 per submission, 50 per mission), day streak, 50 XP daily goal and week strip — derived on the server from existing records (`src/lib/streaks.ts`), so nothing new is stored and it can't be faked from the browser. Mission-complete celebration (confetti, XP, streak; hidden with reduce motion). New hands-on `slider` block with live SVG scenes (overhang, clearance, scale, layers, infill), server-scored and redacted, added to 5 lessons.
- **UDL display options (2026-10-02)** — Aa menu on every page: 4 text sizes, dyslexia spacing, high contrast, reduce motion, theme, read-aloud speed (saved per device); Read aloud button on each lesson screen; lessons start on screen 1 and resume at the first unfinished screen.
- **Kid-friendly lesson player** — one screen at a time, phase strip, visual-first hero, short text with “Tell me more”, mission-briefing cards with checklists, larger feedback and tap targets.

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
