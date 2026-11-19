# Privacy & security

- Minimal data: name, school email, Google subject id, role, organization, class membership, submitted work. No birthdates, no profile fields beyond that.
- No ads, no third-party analytics, no tracking scripts. Fonts are self-hosted (no Google Fonts requests).
- Authorization is server-side in `src/server/policy.ts` and enforced in every service; tests cover student↔student and cross-organization isolation.
- Students see only their own work; teachers see students enrolled in classes they teach; org admins see aggregates unless the organization enables `adminCanViewStudentWork`.
- Sessions: random 256-bit token in an httpOnly, SameSite=Lax cookie; only its SHA-256 is stored. Server Actions have built-in origin checks; the logout route checks Origin.
- OAuth tokens encrypted with AES-256-GCM (`APP_SECRET`). Disconnect revokes at Google.
- Uploads: extension + MIME + magic-byte validation, per-org size limits, private storage, served only via `/api/files` after an ownership check, `Content-Disposition: attachment` for non-images, `nosniff`.
- Audit log: overrides, reviews, rubric scores, roster syncs, publishes, grade sends, role changes, settings.
- Student progress is never deleted by Classroom sync; removal is an explicit teacher archive.
- Teachers are directed to school-approved Tinkercad Classroom practices (teacher-moderated, Safe Mode); evidence links are shared with the class, not publicly.

## SimpCAD X (opt-in, beta)

Tinkercad is the default. A teacher can switch one class to SimpCAD X under **Class settings → Design tool**. Nothing changes for any class that does not opt in.

- Students open SimpCAD X in a new tab from the lessons. It needs no account, and this app sends it no student data.
- SimpCAD X is a separate service made by an individual developer in the UK. Its [privacy page](https://simpcadx.com/privacy) says it sends anonymous usage data (a random install number, version, language, rough region and tool-use counts, plus crash reports) and that each part can be switched off under Settings → Online. It has no children's or school terms. Check it against your district's approval process before opting a class in.
- Its optional Share links keep the design (and the name typed with it) for 30 days, and anyone with the link can download it. The lessons tell students not to use them for class work. Students hand in work as a screenshot, STL or project file instead.
- Sign-in (Google, only for SimpCAD X cloud projects) is optional and not part of this app.
- The class setting is stored as `courses.cad_tool` (`tinkercad` or `simpcadx`) and recorded in the audit log like other course settings. The Pages edition does not have this option yet.
