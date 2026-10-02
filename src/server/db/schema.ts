import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  real,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () =>
  text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const roleEnum = pgEnum("role", ["student", "teacher", "org_admin", "platform_admin"]);
export const proficiencyEnum = pgEnum("proficiency", [
  "not_attempted",
  "developing",
  "proficient",
  "independent",
]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "not_in_roster",
  "archived",
]);
export const lessonStatusEnum = pgEnum("lesson_status", ["not_started", "in_progress", "completed"]);
export const evidenceTypeEnum = pgEnum("evidence_type", [
  "quiz",
  "screenshot",
  "stl",
  "obj",
  "design_url",
  "written",
  "teacher_observation",
  "project_rubric",
  "physical_test",
]);
export const evidenceStatusEnum = pgEnum("evidence_status", [
  "submitted",
  "reviewed",
  "needs_revision",
]);
export const printStatusEnum = pgEnum("print_status", [
  "draft",
  "submitted",
  "needs_revision",
  "approved",
  "queued",
  "printing",
  "completed",
  "failed",
]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["local", "publishing", "published", "failed"]);

// ───────────────────────── Organization & users ─────────────────────────

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  /** Google Workspace domain for staff, e.g. "district.org". New users from it start as teachers. */
  googleDomain: text("google_domain"),
  /** Google Workspace domain for students, e.g. "students.district.org". If equal to googleDomain, new users start as students. */
  studentGoogleDomain: text("student_google_domain"),
  isDemo: boolean("is_demo").notNull().default(false),
  settings: jsonb("settings")
    .$type<{
      brandName?: string;
      accentColor?: string;
      allowedModelSources?: string[];
      studentUploadsEnabled?: boolean;
      maxUploadMb?: number;
      adminCanViewStudentWork?: boolean;
    }>()
    .notNull()
    .default({}),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    googleSub: text("google_sub"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: roleEnum("role").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_google_sub_idx").on(t.googleSub),
    uniqueIndex("users_org_email_idx").on(t.organizationId, t.email),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    /** sha256 of the session token; the raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Google OAuth tokens, encrypted with AES-256-GCM (see server/crypto.ts). */
export const oauthTokens = pgTable("oauth_tokens", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("google"),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  scope: text("scope").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: updatedAt(),
});

// ───────────────────────── Courses ─────────────────────────

export type EquipmentConfig = {
  printerCount: number;
  printerModels: string;
  material: string;
  nozzleMm: number;
  layerHeightMm: number;
  studentDevices: "chromebook" | "windows" | "mac" | "ipad" | "mixed";
  calipersAvailable: boolean;
};

export const courses = pgTable(
  "courses",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    section: text("section"),
    pathId: text("path_id").notNull().default("18-week"),
    startDate: timestamp("start_date", { withTimezone: true }),
    tinkercadClassUrl: text("tinkercad_class_url"),
    equipment: jsonb("equipment").$type<EquipmentConfig>().notNull(),
    joinCode: text("join_code").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("courses_join_code_idx").on(t.joinCode), index("courses_org_idx").on(t.organizationId)],
);

export const courseTeachers = pgTable(
  "course_teachers",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("local"),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

export const enrollments = pgTable(
  "enrollments",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    source: text("source").notNull().default("local"),
    createdAt: createdAt(),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] }), index("enrollments_user_idx").on(t.userId)],
);

/** Per-course overrides of the canonical curriculum. */
export const courseLessonSettings = pgTable(
  "course_lesson_settings",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    dueAt: timestamp("due_at", { withTimezone: true }),
    printLevel: text("print_level"),
    /** Teacher marked the external tool (Tinkercad) unavailable → lesson unlocked regardless of prerequisites. */
    manuallyUnlocked: boolean("manually_unlocked").notNull().default(false),
    unlockReason: text("unlock_reason"),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.lessonId] })],
);

// ───────────────────────── Google Classroom ─────────────────────────

export const googleCourseMappings = pgTable(
  "google_course_mappings",
  {
    localCourseId: text("local_course_id")
      .primaryKey()
      .references(() => courses.id, { onDelete: "cascade" }),
    googleCourseId: text("google_course_id").notNull(),
    googleTeacherId: text("google_teacher_id").notNull(),
    connectedByUserId: text("connected_by_user_id")
      .notNull()
      .references(() => users.id),
    syncEnabled: boolean("sync_enabled").notNull().default(true),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastSyncStatus: text("last_sync_status"),
    lastSyncError: text("last_sync_error"),
  },
  (t) => [uniqueIndex("gcm_google_course_idx").on(t.googleCourseId)],
);

export const assignments = pgTable(
  "assignments",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** lesson id from content, or `challenge:<customChallengeId>` */
    activityId: text("activity_id").notNull(),
    title: text("title").notNull(),
    instructions: text("instructions").notNull().default(""),
    points: integer("points"),
    topic: text("topic"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: assignmentStatusEnum("status").notNull().default("local"),
    googleCourseId: text("google_course_id"),
    googleCourseWorkId: text("google_course_work_id"),
    googleAlternateLink: text("google_alternate_link"),
    lastError: text("last_error"),
    /** manual: teacher clicks Send; auto: grades sync when teacher returns/rates */
    gradeSyncMode: text("grade_sync_mode").notNull().default("manual"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("assignments_course_activity_idx").on(t.courseId, t.activityId)],
);

export const gradeSyncs = pgTable(
  "grade_syncs",
  {
    id: id(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    status: text("status").notNull(), // pending | synced | failed
    googleSubmissionId: text("google_submission_id"),
    error: text("error"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("grade_syncs_assignment_student_idx").on(t.assignmentId, t.studentId)],
);

// ───────────────────────── Learning progress ─────────────────────────

export type BlockState = Record<string, { response?: unknown; correct?: boolean; attempts?: number; updatedAt?: string }>;

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    status: lessonStatusEnum("status").notNull().default("not_started"),
    blockState: jsonb("block_state").$type<BlockState>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    /** approximate active minutes, from client heartbeats */
    activeMinutes: integer("active_minutes").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.courseId, t.lessonId] })],
);

export const attempts = pgTable(
  "attempts",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    blockId: text("block_id").notNull(),
    competencyId: text("competency_id"),
    correct: boolean("correct"),
    response: jsonb("response"),
    /** id of a misconception from content, when the chosen option maps to one */
    misconceptionId: text("misconception_id"),
    createdAt: createdAt(),
  },
  (t) => [index("attempts_student_lesson_idx").on(t.studentId, t.lessonId), index("attempts_course_idx").on(t.courseId)],
);

export const studentCompetencies = pgTable(
  "student_competencies",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    competencyId: text("competency_id").notNull(),
    /** best level supported by evidence/auto checks */
    computedLevel: proficiencyEnum("computed_level").notNull().default("not_attempted"),
    lastEvidenceAt: timestamp("last_evidence_at", { withTimezone: true }),
    overrideLevel: proficiencyEnum("override_level"),
    overrideAt: timestamp("override_at", { withTimezone: true }),
    overrideBy: text("override_by").references(() => users.id),
    overrideComment: text("override_comment"),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.competencyId] })],
);

export const competencyHistory = pgTable(
  "competency_history",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    competencyId: text("competency_id").notNull(),
    fromLevel: proficiencyEnum("from_level").notNull(),
    toLevel: proficiencyEnum("to_level").notNull(),
    reason: text("reason").notNull(),
    actorId: text("actor_id").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("competency_history_student_idx").on(t.studentId)],
);

export const evidence = pgTable(
  "evidence",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    blockId: text("block_id"),
    competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
    type: evidenceTypeEnum("type").notNull(),
    url: text("url"),
    fileKey: text("file_key"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    response: text("response"),
    status: evidenceStatusEnum("status").notNull().default("submitted"),
    /** 1 developing · 2 proficient · 3 independent */
    teacherRating: integer("teacher_rating"),
    teacherComment: text("teacher_comment"),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("evidence_student_idx").on(t.studentId), index("evidence_course_status_idx").on(t.courseId, t.status)],
);

export const rubricScores = pgTable(
  "rubric_scores",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    rubricId: text("rubric_id").notNull(),
    scores: jsonb("scores").$type<Record<string, number>>().notNull(),
    total: real("total").notNull(),
    max: real("max").notNull(),
    comment: text("comment"),
    scoredBy: text("scored_by")
      .notNull()
      .references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("rubric_scores_unique_idx").on(t.studentId, t.courseId, t.lessonId)],
);

export const teacherFeedback = pgTable(
  "teacher_feedback",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id"),
    evidenceId: text("evidence_id").references(() => evidence.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: createdAt(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("feedback_student_idx").on(t.studentId)],
);

export const studentBadges = pgTable(
  "student_badges",
  {
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    awardedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.badgeId] })],
);

// ───────────────────────── Fabrication ─────────────────────────

export type PrintJobEvent = { at: string; by: string; from: string; to: string; note?: string };

export const printJobs = pgTable(
  "print_jobs",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id"),
    title: text("title").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    estimatedSize: text("estimated_size"),
    notes: text("notes"),
    status: printStatusEnum("status").notNull().default("submitted"),
    printer: text("printer"),
    filament: text("filament"),
    estimatedMinutes: integer("estimated_minutes"),
    slicerNotes: text("slicer_notes"),
    failureReason: text("failure_reason"),
    history: jsonb("history").$type<PrintJobEvent[]>().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("print_jobs_course_status_idx").on(t.courseId, t.status), index("print_jobs_student_idx").on(t.studentId)],
);

export const customAssets = pgTable("custom_assets", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  creator: text("creator").notNull(),
  sourcePage: text("source_page"),
  license: text("license").notNull(),
  attributionText: text("attribution_text"),
  format: text("format").notNull(),
  fileKey: text("file_key").notNull(),
  fileName: text("file_name").notNull(),
  educationalPurpose: text("educational_purpose"),
  createdAt: createdAt(),
});

// ───────────────────────── Projects, portfolio, authoring ─────────────────────────

export const designJournals = pgTable(
  "design_journals",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    projectKey: text("project_key").notNull(),
    entries: jsonb("entries").$type<Record<string, string>>().notNull().default({}),
    revision: integer("revision").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("journal_unique_idx").on(t.studentId, t.courseId, t.projectKey)],
);

export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceId: text("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    caption: text("caption"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("portfolio_unique_idx").on(t.studentId, t.evidenceId)],
);

export const customChallenges = pgTable("custom_challenges", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
  constraints: jsonb("constraints").$type<string[]>().notNull().default([]),
  resources: jsonb("resources").$type<{ label: string; url: string }[]>().notNull().default([]),
  modelAssetIds: jsonb("model_asset_ids").$type<string[]>().notNull().default([]),
  printLevel: text("print_level").notNull().default("digital"),
  evidenceTypes: jsonb("evidence_types").$type<string[]>().notNull().default([]),
  rubric: jsonb("rubric").$type<{ id: string; label: string; max: number }[]>().notNull().default([]),
  points: integer("points"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: text("actor_id"),
    organizationId: text("organization_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_org_idx").on(t.organizationId, t.createdAt)],
);
