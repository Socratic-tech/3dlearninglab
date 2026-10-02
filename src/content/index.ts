import { z } from "zod";
import {
  lessonSchema,
  competencySchema,
  pathSchema,
  badgeSchema,
  rubricSchema,
  standardSchema,
  modelAssetSchema,
  allBlocks,
  type Lesson,
  type Competency,
  type CoursePath,
  type Badge,
  type Rubric,
  type Standard,
  type ModelAsset,
  type DomainId,
} from "./schema";
import { competencyInputs, domains, heatmapGroups } from "./competencies";
import { lessonInputs } from "./lessons";
import { pathInputs } from "./paths";
import { badgeInputs, rubricInputs, journalPrompts } from "./badges";
import { standardInputs, lessonStandards } from "./standards";
import { modelAssetInputs } from "./models";
import { diagramCatalog } from "./diagram-catalog";

export * from "./schema";
export { domains, heatmapGroups, journalPrompts, lessonStandards, diagramCatalog };

function parseAll<T extends z.ZodTypeAny>(schema: T, items: unknown[], label: string): z.infer<T>[] {
  return items.map((item, i) => {
    const r = schema.safeParse(item);
    if (!r.success) {
      const id = (item as { id?: string })?.id ?? i;
      throw new Error(`Invalid ${label} "${id}": ${z.prettifyError(r.error)}`);
    }
    return r.data;
  });
}

export const competencies: Competency[] = parseAll(competencySchema, competencyInputs, "competency");
export const lessons: Lesson[] = parseAll(lessonSchema, lessonInputs, "lesson").sort((a, b) => a.number - b.number);
export const paths: CoursePath[] = parseAll(pathSchema, pathInputs, "path");
export const badges: Badge[] = parseAll(badgeSchema, badgeInputs, "badge");
export const rubrics: Rubric[] = parseAll(rubricSchema, rubricInputs, "rubric");
export const standards: Standard[] = parseAll(standardSchema, standardInputs, "standard");
export const modelAssets: ModelAsset[] = parseAll(modelAssetSchema, modelAssetInputs, "model asset");

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
const lessonMap = byId(lessons);
const competencyMap = byId(competencies);
const assetMap = byId(modelAssets);
const pathMap = byId(paths);
const rubricMap = byId(rubrics);
const standardMap = byId(standards);

export const getLesson = (id: string) => lessonMap.get(id);
export const getCompetency = (id: string) => competencyMap.get(id);
export const getModelAsset = (id: string) => assetMap.get(id);
export const getPath = (id: string) => pathMap.get(id) ?? pathMap.get("18-week")!;
export const getRubric = (id: string) => rubricMap.get(id);
export const getDomain = (id: DomainId) => domains.find((d) => d.id === id)!;
export const competenciesInDomain = (d: DomainId) => competencies.filter((c) => c.domain === d);
export const standardsForLesson = (lessonId: string): Standard[] =>
  (lessonStandards.find((m) => m.lessonId === lessonId)?.standardIds ?? []).map((id) => standardMap.get(id)!).filter(Boolean);

/** Lessons in path order (week, then listed order). */
export function lessonsInPath(pathId: string): { lesson: Lesson; week: number }[] {
  const path = getPath(pathId);
  return path.weeks.flatMap((w) => w.lessonIds.map((id) => ({ lesson: lessonMap.get(id)!, week: w.week }))).filter((x) => x.lesson);
}

/** Lessons whose blocks reference a model asset (for "every lesson model" checks and teacher view). */
export function assetsForLesson(lesson: Lesson): ModelAsset[] {
  const ids = new Set<string>();
  for (const b of allBlocks(lesson)) {
    if (b.type === "modelDownload") b.modelIds.forEach((m) => ids.add(m));
    if (b.type === "modelViewer" || b.type === "hotspot") ids.add(b.modelId);
    if ("visual" in b && b.visual?.modelId) ids.add(b.visual.modelId);
  }
  for (const a of modelAssets) if (a.lessonIds.includes(lesson.id)) ids.add(a.id);
  return [...ids].map((id) => assetMap.get(id)!).filter(Boolean);
}

/**
 * Cross-reference validation. Returns a list of problems (empty = valid).
 * Run in tests and on the platform-admin curriculum page.
 */
export function validateCurriculum(): string[] {
  const problems: string[] = [];
  const seenNumbers = new Map<number, string>();
  for (const l of lessons) {
    if (seenNumbers.has(l.number)) problems.push(`Lesson number ${l.number} used by ${l.id} and ${seenNumbers.get(l.number)}`);
    seenNumbers.set(l.number, l.id);
    for (const c of l.competencyIds) if (!competencyMap.has(c)) problems.push(`${l.id}: unknown competency ${c}`);
    for (const p of l.prerequisites) if (!lessonMap.has(p)) problems.push(`${l.id}: unknown prerequisite ${p}`);
    if (l.teacher.rubricId && !rubricMap.has(l.teacher.rubricId)) problems.push(`${l.id}: unknown rubric ${l.teacher.rubricId}`);
    const blockIds = new Set<string>();
    const misconceptions = new Set(l.teacher.misconceptions.map((m) => m.id));
    for (const b of allBlocks(l)) {
      if (blockIds.has(b.id)) problems.push(`${l.id}: duplicate block id ${b.id}`);
      blockIds.add(b.id);
      const comps: string[] = [];
      if ("competencyId" in b && b.competencyId) comps.push(b.competencyId);
      if ("competencyIds" in b) comps.push(...b.competencyIds);
      if (b.type === "challenge") comps.push(...b.skills);
      for (const c of comps) if (!competencyMap.has(c)) problems.push(`${l.id}/${b.id}: unknown competency ${c}`);
      const diagrams: string[] = [];
      if (b.type === "diagram") diagrams.push(b.name);
      if ("visual" in b && b.visual?.diagram) diagrams.push(b.visual.diagram);
      if (b.type === "showMe") b.steps.forEach((s) => s.diagram && diagrams.push(s.diagram));
      if (b.type === "observe") b.cards.forEach((c) => c.diagram && diagrams.push(c.diagram));
      if ("options" in b) b.options.forEach((o) => o.diagram && diagrams.push(o.diagram));
      for (const d of diagrams) if (!(d in diagramCatalog)) problems.push(`${l.id}/${b.id}: unknown diagram ${d}`);
      const models: string[] = [];
      if (b.type === "modelDownload") models.push(...b.modelIds);
      if (b.type === "modelViewer" || b.type === "hotspot") models.push(b.modelId);
      if ("visual" in b && b.visual?.modelId) models.push(b.visual.modelId);
      for (const m of models) {
        const a = assetMap.get(m);
        if (!a) problems.push(`${l.id}/${b.id}: unknown model ${m}`);
        else if (!a.localFilePath && b.type !== "modelDownload") problems.push(`${l.id}/${b.id}: model ${m} is not bundled and cannot be displayed`);
      }
      if ("options" in b) {
        const ids = new Set(b.options.map((o) => o.id));
        if (b.type === "multipleChoice") for (const c of b.correctOptionIds) if (!ids.has(c)) problems.push(`${l.id}/${b.id}: correct option ${c} missing`);
        if (b.type === "prediction" && b.expectedOptionId && !ids.has(b.expectedOptionId)) problems.push(`${l.id}/${b.id}: expected option missing`);
        for (const o of b.options) if (o.misconceptionId && !misconceptions.has(o.misconceptionId)) problems.push(`${l.id}/${b.id}: misconception ${o.misconceptionId} not described in teacher guide`);
      }
      if (b.type === "hotspot" && !b.hotspots.some((h) => h.correct)) problems.push(`${l.id}/${b.id}: hotspot has no correct region`);
      if (b.type === "journal") for (const p of b.promptIds) if (!journalPrompts.some((j) => j.id === p)) problems.push(`${l.id}/${b.id}: unknown journal prompt ${p}`);
    }
  }
  for (const p of paths) {
    const seen = new Set<string>();
    for (const w of p.weeks)
      for (const id of w.lessonIds) {
        if (!lessonMap.has(id)) problems.push(`path ${p.id} week ${w.week}: unknown lesson ${id}`);
        if (seen.has(id)) problems.push(`path ${p.id}: lesson ${id} appears twice`);
        seen.add(id);
      }
  }
  for (const b of badges) for (const c of b.requires) if (!competencyMap.has(c)) problems.push(`badge ${b.id}: unknown competency ${c}`);
  for (const a of modelAssets) for (const l of a.lessonIds) if (!lessonMap.has(l)) problems.push(`asset ${a.id}: unknown lesson ${l}`);
  for (const m of lessonStandards) {
    if (!lessonMap.has(m.lessonId)) problems.push(`standards: unknown lesson ${m.lessonId}`);
    for (const s of m.standardIds) if (!standardMap.has(s)) problems.push(`standards: unknown standard ${s}`);
  }
  for (const g of heatmapGroups) for (const c of g.competencyIds) if (!competencyMap.has(c)) problems.push(`heatmap group ${g.id}: unknown competency ${c}`);
  return problems;
}
