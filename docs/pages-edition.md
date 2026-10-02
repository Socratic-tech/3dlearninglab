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

- The site has **no student data and no answer keys** (lessons are published redacted; teacher guides are left out).
- Every request carries a Google ID token. Apps Script verifies it with Google, checks the audience (your OAuth client),
  the email domain, and the roster before touching the Sheet. Students never get access to the Sheet.
- Skill checks are scored in Apps Script with the same code as the Next.js edition (`src/lib` bundled into `Lib.js`).
- **One Google Sheet per teacher**, holding all of that teacher's classes (Classes + Enrollments tabs). Each teacher runs their own copy of the Apps Script, so data and Google quotas stay per teacher.

## One-time setup (site owner)

1. **Google OAuth client** — console.cloud.google.com → APIs & Services → Credentials → *Create OAuth client ID* →
   *Web application*. **Authorized JavaScript origins:** `https://YOUR-USERNAME.github.io` (and `http://localhost:4173`
   for local testing). No redirect URI needed. OAuth consent screen: **External**, publish it (“In production”) —
   it only asks for name + email, so Google doesn't require verification. Teachers from any district can then use it.
2. Put the client ID in **`apps-script/build.config.json`** (`clientId`). It's public (every page of the site uses it),
   so committing it is fine. It gets baked into the site *and* the Apps Script, so teachers never type it.
3. **GitHub** — Settings → Pages → Source: **GitHub Actions**. Every push to `main` builds and deploys the site,
   plus `apps-script/update.json` + `version.json` that teachers' sidebars install updates from.
4. **Make the template Sheet** (once):
   1. Run `npm run pages:prepare`. Create a blank Google Sheet named “3D Design Academy”. Extensions → **Apps Script**.
   2. Create files with these exact names and paste from `apps-script/dist/`: script files **Code**, **Lib**, **Content**;
      HTML file **Sidebar**; and the manifest (Project Settings → “Show appsscript.json” → paste `appsscript.json`). Save.
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

**Updates:** the side panel shows “Update available” after you push changes to the script or curriculum. **Update now**
installs the new files into the teacher's own script with the Apps Script API and moves their web app to the new
version — same links. It needs a one-time switch: script.google.com/home/usersettings → *Google Apps Script API* → On
(the panel says so if it's off). The update bundle is published on the site; like the repo's lesson files, it contains
the answer keys in encoded (not plain-text) form — keep the repo private if that matters to you.

A workbook set up before multi-class support upgrades itself on the first request: the old `CLASS_NAME`/`PATH_ID`
settings become one class and every existing student is enrolled in it. A student in two of your classes keeps one
set of progress and skills (it's the same student) and sees each class's own course length and settings.

When the curriculum changes: push. Teachers click **Update now** in their side panel (or paste the new files from
`apps-script/dist/` and Deploy → Manage deployments → Edit → New version).

## Notes and limits

- “Who has access: Anyone” is required because the site calls the script from another origin; access is still
  controlled by the Google ID token checks. Some districts disable “Anyone” web apps — ask your Workspace admin to
  allow it for this script, or use the Next.js edition.
- Saves take ~1–3 s (Apps Script); lesson navigation is instant. Writes are serialized with a script lock.
- Uploads go to a Drive folder owned by the teacher (`MAX_UPLOAD_MB`, default 10).
- Local try-out without Google: `npm run pages:prepare && npx vite build --config web/vite.config.ts`, then
  `npx tsx scripts/pages-mock-api.ts` and serve `web/dist` (the mock accepts unsigned tokens — never deploy it).
- Speed: XP/streaks live in a **Summary** tab updated as students work, each request reads a tab at most once, and the
  teacher's “Right now” panel is built from the Progress tab — nothing re-reads the whole answer log.
- Not in this edition yet: rubric scoring, Classroom assignment publishing/grade sync, design-journal
  review screen and teacher guides (use the Next.js edition or the docs).
