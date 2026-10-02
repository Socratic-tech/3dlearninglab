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
