/**
 * Custom project paths: a teacher picks and orders existing lessons for a class and ends with their own project
 * mission ("custom-project"). The server stores the path in the class row and credits the picked lessons' skills
 * when the project is reviewed. A path assigned from the Projects page ends with a built-in project mission instead
 * (`project`: the last lesson), and has no extra mission after it.
 */
import type { Lesson } from "@/content/schema";
import { lessonFor, lessons, pathLessons, type ClassInfo } from "./content";

export type CustomPath = { title: string; brief: string; lessonIds: string[]; requirements: string[]; competencyIds?: string[]; project?: string | null };
export const PROJECT_ID = "custom-project";

/** Lesson kinds that are projects: students make and share something, rather than learn one skill. */
const PROJECT_KINDS = new Set(["boss", "challenge", "capstone", "showcase", "lab"]);
/** Every built-in project mission, in course order. */
export const projectMissions = (): Lesson[] => lessons.filter((l) => PROJECT_KINDS.has(l.kind) && l.id !== PROJECT_ID).sort((a, b) => a.number - b.number);

/** The lessons a project builds on (all of them, prerequisites first), ending with the project itself. */
export function projectPath(projectId: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const l = lessonFor(id);
    if (!l) return;
    [...l.prerequisites].sort((a, b) => (lessonFor(a)?.number ?? 0) - (lessonFor(b)?.number ?? 0)).forEach(visit);
    order.push(id);
  };
  visit(projectId);
  return order;
}

/** A class path for a built-in project: its lessons in order, ending with the project mission. */
export function assignProject(projectId: string): CustomPath | null {
  const p = lessonFor(projectId);
  if (!p) return null;
  return { title: p.title, brief: p.summary, lessonIds: projectPath(projectId), requirements: [], project: projectId };
}

/** True when the class's path ends with a built-in project mission (so there is no "Your project" mission after it). */
const endsWithProject = (c: CustomPath) => !!c.project && c.lessonIds[c.lessonIds.length - 1] === c.project;

/** Lesson order for a class, grouped into small units, the same shape as a standard course. */
export function classLessons(cls: ClassInfo | null | undefined): { lesson: Lesson; week: number; weekTitle: string }[] {
  const custom = cls?.pathId === "custom" ? cls.custom : null;
  if (!custom) return pathLessons(cls?.pathId ?? "18-week");
  const picked = custom.lessonIds.map((id) => lessonFor(id)).filter((l): l is Lesson => !!l);
  const units = Math.ceil(picked.length / 3);
  const out = picked.map((lesson, i) => ({ lesson, week: Math.floor(i / 3) + 1, weekTitle: units > 1 ? `${custom.title} · part ${Math.floor(i / 3) + 1}` : custom.title }));
  if (endsWithProject(custom)) return out;
  const project = lessonFor(PROJECT_ID);
  if (project) out.push({ lesson: personalizeProject(project, custom), week: units + 1, weekTitle: custom.title });
  return out;
}

/** The project mission with the teacher's title, brief and requirements in place of the placeholder text. */
export function personalizeProject(lesson: Lesson, custom: CustomPath): Lesson {
  const reqs = custom.requirements.length ? custom.requirements : null;
  return {
    ...lesson,
    title: custom.title || lesson.title,
    summary: custom.brief || lesson.summary,
    sections: lesson.sections.map((s) => ({
      ...s,
      blocks: s.blocks.map((b) => {
        if (b.type === "hero") return { ...b, title: custom.title || b.title, hook: custom.brief || b.hook };
        if (b.type === "challenge") return { ...b, title: custom.title || b.title, prompt: custom.brief ? `${custom.brief}\n\nBuild it in Tinkercad and meet every requirement.` : b.prompt, requirements: reqs ?? b.requirements };
        if (b.type === "uploadEvidence") return { ...b, checklist: reqs ?? b.checklist, competencyIds: custom.competencyIds?.length ? custom.competencyIds : b.competencyIds };
        return b;
      }),
    })),
  };
}

/** Lessons the picked ones build on that aren't in the path yet (shown as one-click "add" suggestions). */
export function missingPrerequisites(ids: string[]): { lessonId: string; neededBy: string }[] {
  const have = new Set(ids);
  const out: { lessonId: string; neededBy: string }[] = [];
  for (const id of ids) {
    for (const p of lessonFor(id)?.prerequisites ?? []) {
      if (!have.has(p) && !out.some((x) => x.lessonId === p)) out.push({ lessonId: p, neededBy: id });
    }
  }
  return out;
}

/** Starting points teachers can edit. */
export const PROJECT_TEMPLATES: (CustomPath & { id: string; label: string })[] = [
  {
    id: "phone-stand", label: "Phone stand", title: "Phone stand for someone at home",
    brief: "Design a phone stand for someone in your family. Ask what they use their phone for, then design a stand that fits their phone and prints well.",
    lessonIds: ["exact-dimensions", "rotating-objects", "grouping", "holes", "align", "measuring-real-objects", "overhangs", "supports"],
    requirements: ["Holds the phone at a comfortable viewing angle", "Fits the phone's real measurements", "Prints with no supports", "Doesn't tip over with the phone in it"],
  },
  {
    id: "cookie-cutter", label: "Cookie cutter", title: "Custom cookie cutter",
    brief: "Design a cookie cutter in a shape that means something to you or your class.",
    lessonIds: ["exact-dimensions", "scaling-objects", "grouping", "holes", "align", "ruler"],
    requirements: ["Cutting wall is about 1 mm thick", "Has a wider rim to press on", "Fits on a 100 × 100 mm plate", "Open shape with no floating parts"],
  },
  {
    id: "keychain", label: "Keychain", title: "Name keychain",
    brief: "Design a keychain with your name or initials for your backpack.",
    lessonIds: ["exact-dimensions", "grouping", "holes", "align", "text"],
    requirements: ["Fits inside 50 × 25 mm", "Raised letters at least 6 mm tall, touching the base", "Key-ring hole with 2 mm of plastic around it", "Grouped into one piece"],
  },
  {
    id: "desk-organizer", label: "Desk organizer", title: "Desk organizer that fits real supplies",
    brief: "Design an organizer for a desk or locker that holds real supplies you measured.",
    lessonIds: ["exact-dimensions", "grouping", "holes", "align", "duplicate", "repeat-duplicate", "ruler", "measuring-real-objects", "tolerances"],
    requirements: ["Holds at least three different supplies", "Each slot fits the real item with clearance", "Prints in under 2 hours", "Stable when full"],
  },
];

/** Share code: the path as compact text another teacher can paste into their class. */
export function encodeShareCode(c: CustomPath): string {
  const json = JSON.stringify({ t: c.title, b: c.brief, l: c.lessonIds, r: c.requirements, p: c.project || undefined });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((x) => (bin += String.fromCharCode(x)));
  return "3DA1." + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeShareCode(code: string): CustomPath | null {
  try {
    const m = code.trim().match(/^3DA1\.([\w-]+)$/);
    if (!m) return null;
    const bin = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"));
    const x = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))) as { t?: string; b?: string; l?: unknown; r?: unknown; p?: unknown };
    const lessonIds = Array.isArray(x.l) ? x.l.map(String).filter((id) => id !== PROJECT_ID && !!lessonFor(id)) : [];
    if (!lessonIds.length) return null;
    const project = typeof x.p === "string" && lessonIds.includes(x.p) ? x.p : null;
    return { title: String(x.t ?? ""), brief: String(x.b ?? ""), lessonIds, requirements: Array.isArray(x.r) ? x.r.map(String).slice(0, 8) : [], project };
  } catch {
    return null;
  }
}
