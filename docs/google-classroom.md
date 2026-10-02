# Google Classroom integration

CourseWork integration via the official Classroom REST API (`src/server/integrations/google/`).
An Add-on can later be added as another implementation behind the same publishing service.

## Scopes (requested only when a teacher connects Classroom)

| Scope | Why |
|---|---|
| classroom.courses.readonly | list classes the teacher teaches |
| classroom.rosters.readonly | import students and co-teachers |
| classroom.profile.emails | match students to existing accounts by email |
| classroom.coursework.students | create assignments; set grades on assignments we created |
| classroom.topics | file assignments under a topic |

Sign-in itself uses only `openid email profile`. Tokens are AES-256-GCM encrypted (`oauth_tokens`), refreshed
automatically, and revoked on disconnect.

## Flows

- **Connect** `/api/auth/google?intent=classroom` → consent → `/teacher/classroom` lists classes → teacher picks classes
  → local course + `google_course_mappings` row (`localCourseId, googleCourseId, googleTeacherId, syncEnabled, lastSyncedAt`).
- **Roster sync** (`syncRoster`): reads Google first; if any call fails nothing local changes and the error is stored on
  the mapping. Then, in one transaction: upsert users by Google ID → email, add enrollments, add co-teachers, mark
  students who left the roster `not_in_roster` (progress is never deleted; teacher chooses to archive). Idempotent.
  Runs on demand (“Sync Classroom”) and opportunistically when the teacher dashboard loads (at most every 6 h).
- **Publish** (`publishAssignment`): unique `(courseId, activityId)` prevents duplicates; the row is written as
  `publishing`, then `published` with the CourseWork id, or `failed` with the error (retryable). The post contains the
  deep link to the mission and its model files. `refreshAssignment` detects assignments deleted in Classroom.
- **Grades** (`sendGrade`): never automatic for skill badges. Teachers send rubric-based scores per assignment
  (optionally “return”), or opt an assignment into auto-sync when they save a rubric score.

## Failure handling

All Google errors become `IntegrationError` with a friendly message (“We couldn't update Google Classroom. Your work in
3D Design Academy is safe.”) and details logged server-side. Learning never depends on Classroom.

## Testing

`FakeClassroomClient` implements the same interface in memory (used for demo accounts, `CLASSROOM_FAKE=true`, and
`tests/unit/classroom.test.ts`, which covers idempotency, failure isolation, duplicate prevention and grade sync).
