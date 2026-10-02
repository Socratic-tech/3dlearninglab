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
- Each teacher runs their own copy of the Apps Script, so data and Google quotas stay per class.

## One-time setup (site owner)

1. **Google OAuth client** — console.cloud.google.com → APIs & Services → Credentials → *Create OAuth client ID* →
   *Web application*. **Authorized JavaScript origins:** `https://YOUR-USERNAME.github.io` (and `http://localhost:4173`
   for local testing). No redirect URI needed. Copy the client ID.
   OAuth consent screen: *Internal* if everyone is in your Workspace domain.
2. **GitHub** — push the repo. Settings → Pages → Source: **GitHub Actions**.
   Settings → Secrets and variables → Actions → **Variables** → add `GOOGLE_CLIENT_ID` = the client ID.
   Every push to `main` builds and deploys `web/dist` (workflow: `.github/workflows/pages.yml`).

## Per class (each teacher)

1. Create a new Google Sheet (e.g. “3D Design – Period 2”). Extensions → **Apps Script**.
2. On your computer run `npm run pages:prepare`, then copy the four files from `apps-script/dist/` into the editor:
   `Code.js`, `Lib.js`, `Content.js` (as script files) and `appsscript.json`
   (Project Settings → “Show appsscript.json manifest file” to edit it).
3. In the editor, choose `setup` and **Run**. Approve the permissions. This creates the tabs.
4. In the **Config** tab fill in `CLIENT_ID` (same as above), `ALLOWED_DOMAINS` (e.g. `district.org,students.district.org`),
   `CLASS_NAME`, `PATH_ID` (`9-week` or `18-week`), optional `TINKERCAD_URL`.
5. **Deploy → New deployment → Web app** · Execute as: **Me** · Who has access: **Anyone** → Deploy. Copy the URL.
6. Open the Pages site, paste that URL on the Connect screen, sign in as the teacher → Roster → import from Classroom
   (or add students by hand). Overview shows the **class link** — post it in Google Classroom.

When the curriculum changes: run `npm run pages:prepare` again and replace `Content.js`/`Lib.js`
(Deploy → Manage deployments → edit → New version), so answer keys match the site.

## Notes and limits

- “Who has access: Anyone” is required because the site calls the script from another origin; access is still
  controlled by the Google ID token checks. Some districts disable “Anyone” web apps — ask your Workspace admin to
  allow it for this script, or use the Next.js edition.
- Saves take ~1–3 s (Apps Script); lesson navigation is instant. Writes are serialized with a script lock.
- Uploads go to a Drive folder owned by the teacher (`MAX_UPLOAD_MB`, default 10).
- Local try-out without Google: `npm run pages:prepare && npx vite build --config web/vite.config.ts`, then
  `npx tsx scripts/pages-mock-api.ts` and serve `web/dist` (the mock accepts unsigned tokens — never deploy it).
- Not in this edition yet: print queue, rubric scoring, Classroom assignment publishing/grade sync, design-journal
  review screen and teacher guides (use the Next.js edition or the docs).
