import { z } from "zod";

/**
 * Curriculum content schema. Content files are plain data (no logic) so they can be exported to
 * JSON (`npm run content:export`) and migrated to a CMS later. Every file is validated at load time
 * and in tests (tests/unit/content.test.ts).
 */

export const DOMAIN_IDS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const domainId = z.enum(DOMAIN_IDS);
export type DomainId = z.infer<typeof domainId>;

export const PROFICIENCY_LEVELS = ["not_attempted", "developing", "proficient", "independent"] as const;
export const proficiency = z.enum(PROFICIENCY_LEVELS);
export type Proficiency = z.infer<typeof proficiency>;

export const printLevel = z.enum(["digital", "prototype", "required"]);
export type PrintLevel = z.infer<typeof printLevel>;

/** FOLLOW → MODIFY → COMBINE → SOLVE → DESIGN (spec §62) */
export const stage = z.enum(["follow", "modify", "combine", "solve", "design"]);
export type Stage = z.infer<typeof stage>;

export const competencySchema = z.object({
  id: z.string().regex(/^[A-G]\d{1,2}$/),
  domain: domainId,
  title: z.string(),
  canStatement: z.string().startsWith("I can"),
  /** Conceptual competencies that an auto-scored skill check may raise to Proficient. CAD skills need human-verified evidence. */
  autoAssessable: z.boolean().default(false),
  stage,
});
export type Competency = z.infer<typeof competencySchema>;

export const domainSchema = z.object({
  id: domainId,
  title: z.string(),
  shortTitle: z.string(),
  description: z.string(),
});
export type Domain = z.infer<typeof domainSchema>;

// ───────────────────────── Blocks ─────────────────────────

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Defaults per block type (see isRequiredBlock) */
  required: z.boolean().optional(),
};

const visual = z
  .object({
    diagram: z.string().optional(),
    modelId: z.string().optional(),
    alt: z.string().optional(),
  })
  .optional();

const option = z.object({
  id: z.string(),
  text: z.string(),
  feedback: z.string().optional(),
  misconceptionId: z.string().optional(),
  diagram: z.string().optional(),
});

export const heroBlock = z.object({
  ...base,
  type: z.literal("hero"),
  title: z.string(),
  hook: z.string(),
  visual,
});
export const textBlock = z.object({ ...base, type: z.literal("text"), title: z.string().optional(), body: z.string() });
export const calloutBlock = z.object({
  ...base,
  type: z.literal("callout"),
  tone: z.enum(["tip", "warning", "safety", "idea"]),
  title: z.string().optional(),
  body: z.string(),
});
export const diagramBlock = z.object({
  ...base,
  type: z.literal("diagram"),
  name: z.string(),
  caption: z.string(),
  alt: z.string(),
});
export const imageBlock = z.object({
  ...base,
  type: z.literal("image"),
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});
export const videoBlock = z.object({
  ...base,
  type: z.literal("video"),
  title: z.string(),
  url: z.string().url(),
  captionsUrl: z.string().optional(),
  transcript: z.string(),
});
export const showMeBlock = z.object({
  ...base,
  type: z.literal("showMe"),
  title: z.string(),
  steps: z.array(z.object({ text: z.string(), diagram: z.string().optional(), keys: z.string().optional() })).min(1),
});
export const modelViewerBlock = z.object({
  ...base,
  type: z.literal("modelViewer"),
  modelId: z.string(),
  caption: z.string(),
  showLayers: z.boolean().optional(),
  showDimensions: z.boolean().optional(),
});
export const predictionBlock = z.object({
  ...base,
  type: z.literal("prediction"),
  prompt: z.string(),
  visual,
  options: z.array(option).min(2),
  /** Optional: some predictions have no single right answer (e.g. machine-dependent fits). */
  expectedOptionId: z.string().optional(),
  revealTitle: z.string().default("Test result"),
  reveal: z.string(),
});
export const multipleChoiceBlock = z.object({
  ...base,
  type: z.literal("multipleChoice"),
  prompt: z.string(),
  visual,
  options: z.array(option).min(2),
  correctOptionIds: z.array(z.string()).min(1),
  explanation: z.string(),
  competencyId: z.string().optional(),
  /** practice = low stakes; skill = counts as automated evidence */
  check: z.enum(["practice", "skill"]).default("practice"),
});
export const orderingBlock = z.object({
  ...base,
  type: z.literal("ordering"),
  prompt: z.string(),
  /** listed in the correct order; shuffled deterministically for display */
  items: z.array(z.object({ id: z.string(), text: z.string() })).min(3),
  explanation: z.string(),
  competencyId: z.string().optional(),
  check: z.enum(["practice", "skill"]).default("practice"),
});
export const matchingBlock = z.object({
  ...base,
  type: z.literal("matching"),
  prompt: z.string(),
  pairs: z.array(z.object({ id: z.string(), left: z.string(), right: z.string() })).min(2),
  explanation: z.string(),
  competencyId: z.string().optional(),
  check: z.enum(["practice", "skill"]).default("practice"),
});
export const hotspotBlock = z.object({
  ...base,
  type: z.literal("hotspot"),
  prompt: z.string(),
  modelId: z.string(),
  hotspots: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        position: z.tuple([z.number(), z.number(), z.number()]),
        radius: z.number().positive(),
        correct: z.boolean(),
        feedback: z.string(),
      }),
    )
    .min(2),
  explanation: z.string(),
  competencyId: z.string().optional(),
  check: z.enum(["practice", "skill"]).default("practice"),
});
export const measurementBlock = z.object({
  ...base,
  type: z.literal("measurement"),
  prompt: z.string(),
  visual,
  answer: z.number(),
  tolerance: z.number().nonnegative(),
  unit: z.string().default("mm"),
  hint: z.string().optional(),
  explanation: z.string(),
  competencyId: z.string().optional(),
  check: z.enum(["practice", "skill"]).default("practice"),
});
/** Hands-on: drag a slider and watch a live picture change, then check (Brilliant-style exploration). */
export const SLIDER_SCENES = ["overhang", "clearance", "scale", "layers", "infill"] as const;
export const sliderBlock = z.object({
  ...base,
  type: z.literal("slider"),
  prompt: z.string(),
  scene: z.enum(SLIDER_SCENES),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  start: z.number(),
  unit: z.string(),
  answer: z.number(),
  tolerance: z.number().nonnegative(),
  hint: z.string().optional(),
  explanation: z.string(),
  competencyId: z.string().optional(),
  check: z.enum(["practice", "skill"]).default("practice"),
});
export const tinkercadLaunchBlock = z.object({
  ...base,
  type: z.literal("tinkercadLaunch"),
  title: z.string(),
  steps: z.array(z.string()).min(1),
});
export const modelDownloadBlock = z.object({
  ...base,
  type: z.literal("modelDownload"),
  modelIds: z.array(z.string()).min(1),
  showImportSteps: z.boolean().default(true),
});
export const evidenceKind = z.enum(["screenshot", "stl", "obj", "design_url", "physical_test"]);
export const uploadEvidenceBlock = z.object({
  ...base,
  type: z.literal("uploadEvidence"),
  prompt: z.string(),
  accepts: z.array(evidenceKind).min(1),
  competencyIds: z.array(z.string()).min(1),
  checklist: z.array(z.string()).default([]),
  /** offer "Request a print" after submitting */
  allowPrintRequest: z.boolean().default(false),
});
export const reflectionBlock = z.object({
  ...base,
  type: z.literal("reflection"),
  prompt: z.string(),
  sentenceStarters: z.array(z.string()).default([]),
  minWords: z.number().int().default(10),
  competencyIds: z.array(z.string()).default([]),
});
export const teacherCheckBlock = z.object({
  ...base,
  type: z.literal("teacherCheck"),
  prompt: z.string(),
  lookFors: z.array(z.string()).min(1),
  competencyIds: z.array(z.string()).min(1),
});
export const challengeBlock = z.object({
  ...base,
  type: z.literal("challenge"),
  kind: z.enum(["micro", "prove", "boss"]),
  title: z.string(),
  prompt: z.string(),
  requirements: z.array(z.string()).min(1),
  skills: z.array(z.string()).default([]),
  visual,
  showTimer: z.boolean().default(false),
});
export const journalBlock = z.object({
  ...base,
  type: z.literal("journal"),
  projectKey: z.string(),
  promptIds: z.array(z.string()).min(1),
});
export const observeBlock = z.object({
  ...base,
  type: z.literal("observe"),
  title: z.string(),
  cards: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        hint: z.string().optional(),
        diagram: z.string().optional(),
        reveal: z.string(),
      }),
    )
    .min(1),
  questions: z.array(z.string()).default(["What do you notice?", "What do you think happened?", "What evidence supports that?"]),
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  heroBlock,
  textBlock,
  calloutBlock,
  diagramBlock,
  imageBlock,
  videoBlock,
  showMeBlock,
  modelViewerBlock,
  predictionBlock,
  multipleChoiceBlock,
  orderingBlock,
  matchingBlock,
  hotspotBlock,
  measurementBlock,
  sliderBlock,
  tinkercadLaunchBlock,
  modelDownloadBlock,
  uploadEvidenceBlock,
  reflectionBlock,
  teacherCheckBlock,
  challengeBlock,
  journalBlock,
  observeBlock,
]);
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonBlockInput = z.input<typeof lessonBlockSchema>;
export type BlockOf<T extends LessonBlock["type"]> = Extract<LessonBlock, { type: T }>;

export const PHASES = ["discover", "practice", "apply", "prove", "reflect"] as const;
export const phase = z.enum(PHASES);
export type Phase = z.infer<typeof phase>;

export const sectionSchema = z.object({
  phase,
  title: z.string(),
  blocks: z.array(lessonBlockSchema).min(1),
});

export const teacherGuideSchema = z.object({
  purpose: z.string(),
  preparation: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  misconceptions: z.array(z.object({ id: z.string(), text: z.string(), response: z.string() })).default([]),
  discussionQuestions: z.array(z.string()).default([]),
  printableObjects: z.array(z.string()).default([]),
  slicerSettings: z.string().optional(),
  troubleshooting: z.array(z.string()).default([]),
  answerGuidance: z.array(z.string()).default([]),
  rubricId: z.string().optional(),
  /** Alternatives offered automatically from equipment configuration */
  alternatives: z
    .object({
      noCalipers: z.string().optional(),
      noPrinter: z.string().optional(),
      touchDevice: z.string().optional(),
    })
    .default({}),
});

export const lessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  number: z.number().int().positive(),
  title: z.string(),
  subtitle: z.string(),
  domain: domainId,
  kind: z.enum(["lesson", "boss", "challenge", "lab", "capstone", "showcase"]),
  summary: z.string(),
  estimatedMinutes: z.number().int().positive(),
  printLevel,
  competencyIds: z.array(z.string()).min(1),
  prerequisites: z.array(z.string()).default([]),
  vocabulary: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
  sections: z.array(sectionSchema).min(1),
  teacher: teacherGuideSchema,
});
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonInput = z.input<typeof lessonSchema>;
export type TeacherGuide = z.infer<typeof teacherGuideSchema>;

export const pathSchema = z.object({
  id: z.enum(["9-week", "18-week"]),
  title: z.string(),
  description: z.string(),
  weeks: z
    .array(
      z.object({
        week: z.number().int().positive(),
        title: z.string(),
        focus: z.string(),
        lessonIds: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});
export type CoursePath = z.infer<typeof pathSchema>;

export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  requires: z.array(z.string()).min(1),
  minLevel: z.enum(["proficient", "independent"]).default("proficient"),
});
export type Badge = z.infer<typeof badgeSchema>;

export const rubricSchema = z.object({
  id: z.string(),
  title: z.string(),
  criteria: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        max: z.number().int().positive(),
        competencyIds: z.array(z.string()).default([]),
        descriptors: z.array(z.string()).length(4),
      }),
    )
    .min(1),
});
export type Rubric = z.infer<typeof rubricSchema>;

export const standardSchema = z.object({
  id: z.string(),
  framework: z.enum(["ISTE", "NGSS", "MI-CS", "MI-MATH"]),
  code: z.string(),
  text: z.string(),
  grade: z.string().optional(),
});
export type Standard = z.infer<typeof standardSchema>;

// ───────────────────────── Model assets ─────────────────────────

export const licenseId = z.enum([
  "CC0-1.0",
  "public-domain",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-NC-4.0",
  "other-permissive",
]);
export type LicenseId = z.infer<typeof licenseId>;

export const modelAssetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  creator: z.string(),
  sourcePlatform: z.string(),
  sourcePage: z.string().url().optional(),
  originalFileName: z.string(),
  /** Path under /public. Absent → not bundled (link out to source only). */
  localFilePath: z.string().optional(),
  format: z.enum(["stl", "obj", "glb", "gltf"]),
  license: licenseId,
  licenseVersion: z.string().optional(),
  attributionRequired: z.boolean(),
  commercialUseAllowed: z.boolean(),
  remixAllowed: z.boolean(),
  /** ISO date the license was checked against the source page; null = not yet verified → never bundled */
  sourceVerifiedAt: z.string().nullable(),
  educationalPurpose: z.string(),
  purposeBullets: z.array(z.string()).default([]),
  lessonIds: z.array(z.string()).default([]),
  attributionText: z.string(),
  /** Editable source for original assets */
  generatorSource: z.string().optional(),
  original: z.boolean(),
  dimensionsMm: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type ModelAsset = z.infer<typeof modelAssetSchema>;
export type ModelAssetInput = z.input<typeof modelAssetSchema>;

// ───────────────────────── Helpers ─────────────────────────

const REQUIRED_BY_DEFAULT: LessonBlock["type"][] = [
  "prediction",
  "multipleChoice",
  "ordering",
  "matching",
  "hotspot",
  "measurement",
  "slider",
  "uploadEvidence",
  "reflection",
];

export function isRequiredBlock(block: LessonBlock): boolean {
  return block.required ?? REQUIRED_BY_DEFAULT.includes(block.type);
}

export function allBlocks(lesson: Lesson): LessonBlock[] {
  return lesson.sections.flatMap((s) => s.blocks);
}
