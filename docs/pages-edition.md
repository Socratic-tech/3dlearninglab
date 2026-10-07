# GitHub Pages + Google edition

```
Students & teachers ──► GitHub Pages (static site: lessons, 3D viewer, diagrams, STL files)
                              │  Sign in with Google → ID token
                              ▼
                     Apps Script web app (one per teacher/class)
                              │  verifies token, checks role, scores answers
                              ▼
               Google Sheet (data) + Drive folder (uploads) + Classroom (rosters)
```

- The site has **no student data or readable answer keys** (lesson keys in the server feed are scrambled; teacher guides are left out).
- Every request carries a Google ID token. Apps Script verifies it with Google, checks the audience (your OAuth client),
  the email domain, and the roster before touching the Sheet. Students never get access to the Sheet.
- Skill checks are scored in Apps Script with the same code as the Next.js edition. The scoring engine is part of the website-hosted application bundle.
- **One Google Sheet per teacher**, holding all of that teacher's classes (Classes + Enrollments tabs). Each teacher runs their own copy of the Apps Script, so data and Google quotas stay per teacher.

## One-time setup (site owner)

1. **Google OAuth client** — console.cloud.google.com → APIs & Services → Credentials → *Create OAuth client ID* →
   *Web application*. **Authorized JavaScript origins:** `https://YOUR-USERNAME.github.io` (and `http://localhost:4173`
   for local testing). No redirect URI needed. OAuth consent screen: **External**, publish it (“In production”) —
   it only asks for name + email, so Google doesn't require verification. Teachers from any district can then use it.
2. Put the client ID in **`apps-script/build.config.json`** (`clientId`). It's public (every page of the site uses it),
   so committing it is fine. It gets baked into the site *and* the Apps Script, so teachers never type it.
3. **GitHub** — Settings → Pages → Source: **GitHub Actions**. Every push to `main` builds and deploys the site,
   including the versioned Apps Script application bundle and lesson feed.
4. **Make the template Sheet** (once):
   1. Run `npm run pages:prepare`. Create a blank Google Sheet named “3D Design Academy”. Extensions → **Apps Script**.
   2. Apps Script must contain exactly two files. Replace **Code.gs** with `apps-script/dist/Code.js`, then enable and
      replace **appsscript.json** from `apps-script/dist/appsscript.json`. Delete any old Lib, Content, or Sidebar files.
   3. Don't deploy it and don't add data — it's only a master.
   4. Share → *Anyone with the link* → **Viewer**. Copy the link and change the end from `/edit…` to **`/copy`**.
   5. Put that `/copy` link in `apps-script/build.config.json` → `templateUrl`, commit, push. The site's welcome screen
      now shows **Make my copy**.

## Per teacher (about 5 minutes, once — not per class)

See **[teacher-quickstart.md](teacher-quickstart.md)** — the version to send to teachers.

1. Open the site → **Make my copy** (copies the template Sheet, script included, into their Drive).
2. In the copy: menu **3D Design Academy → Set up & class links** → approve permissions.
3. The side panel: **Prepare my Sheet** → follow the pictured **Deploy → New deployment → Web app** steps →
   create classes → copy each class's link (or show its QR code). **Open my teacher dashboard** for the rest.

**Updates:** `Code.gs` is a small permanent loader. It checks the website every 30 minutes for the current application
bundle, caches it for outages, and keeps a backup in a hidden Sheet tab. Teachers can also click **Check for updates
now** in the side panel. No Apps Script files need to be replaced after the one-time two-file installation.

A workbook set up before multi-class support upgrades itself on the first request: the old `CLASS_NAME`/`PATH_ID`
settings become one class and every existing student is enrolled in it. A student in two of your classes keeps one
set of progress and skills (it's the same student) and sees each class's own course length and settings.

When the curriculum or application changes: push. Existing Sheets pick it up automatically from the website; their
deployment URL and student work do not change.

## Notes and limits

- “Who has access: Anyone” is required because the site calls the script from another origin; access is still
  controlled by the Google ID token checks. Some districts disable “Anyone” web apps — ask your Workspace admin to
  allow it for this script, or use the Next.js edition.
- Saves take ~1–3 s (Apps Script); lesson navigation is instant. Writes are serialized with a script lock.
- Uploads go to a Drive folder owned by the teacher (`MAX_UPLOAD_MB`, default 10).
- Local try-out without Google: `npm run pages:prepare && npx vite build --config web/vite.config.ts`, then
  `npx tsx scripts/pages-mock-api.ts` and serve `web/dist` (the mock accepts unsigned tokens — never deploy it).
- **Speed (feels instant):** practice questions are scored in the browser from a scrambled answer pack (skill checks
  always go to Google), and all saves go into a background queue on the device (`web/src/sync.ts`) that retries until
  Google confirms — even across reloads and Wi-Fi drops. Pages open from a cached copy and refresh quietly. On the
  server, each student has their own lock, so 30 students saving at once don't wait on each other.
  Try it locally with a slow fake backend: `MOCK_DELAY_MS=2000 npx tsx scripts/pages-mock-api.ts`.
- Speed: XP/streaks live in a **Summary** tab updated as students work, each request reads a tab at most once, and the
  teacher's “Right now” panel is built from the Progress tab — nothing re-reads the whole answer log.
- Not in this edition yet: rubric scoring, Classroom assignment publishing/grade sync, design-journal
  review screen and teacher guides (use the Next.js edition or the docs).

## Try-It mode (no Google Sheet)

For trying the course, workshops and conference sessions, or classes that can't set up a Sheet yet. The welcome page's
**Try it now** button switches the browser to Try-It mode; nothing is installed and no one signs in with Google.

- **How it works:** `web/src/local-engine.ts` downloads the same `apps-script/bundle.js` a teacher's Sheet runs and executes
  it in the browser with stand-ins for SpreadsheetApp, Drive, CacheService, etc. Scoring, mastery, XP, unlocks and the
  teacher dashboard are the real ones. The API address is the sentinel `local:device`; `callOnce()` in `web/src/api.ts`
  routes those requests to the local engine instead of `fetch()`.
- **Storage:** tables in `localStorage` (`academy.trydata.book`), uploads (5 MB max) in IndexedDB (`academy-tryit`).
  Data stays on the device. "Start over on this device" / Connect a Google Sheet leave it in place.
- **Moving work:** students click **Save progress file** (only their own rows and uploads) and hand it in, e.g. as a
  Google Classroom assignment. Teachers click **Add student files**: each student lands in the open class; adding a
  newer file from the same student replaces their older work. **Back up / Restore** copies everything on a device.
- **Limits:** no live view of other devices, no Classroom roster import or grade sync, and the answer keys are on the
  device (the same scrambled pack the public site already serves), so use a Google Sheet for anything high-stakes.
- Tests: `tests/unit/try-it.test.ts`.
