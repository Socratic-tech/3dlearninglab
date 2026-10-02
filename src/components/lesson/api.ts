import type { ActionResult } from "@/server/errors";
import type { BlockResponse } from "@/lib/scoring";
import type { ClientResult } from "@/lib/scoring";

/**
 * Everything the lesson player needs from a backend. The Next.js edition implements it with Server Actions
 * (next-api.ts); the GitHub Pages edition implements it with the Google Apps Script API (web/src/api.ts).
 */
type Ids = { courseId: string; lessonId: string };
export type LessonApi = {
  answerBlock(i: Ids & { blockId: string; response: BlockResponse }): Promise<ActionResult<ClientResult>>;
  saveDraft(i: Ids & { blockId: string; text: string }): Promise<ActionResult<unknown>>;
  submitReflection(i: Ids & { blockId: string; text: string }): Promise<ActionResult<unknown>>;
  /** FormData carries courseId, lessonId, blockId, kind, url, note, file, requestPrint */
  submitEvidence(fd: FormData): Promise<ActionResult<{ id: string; type: string; fileName: string | null; url: string | null; createdAt: string }>>;
  saveJournal(i: { courseId: string; projectKey: string; promptId: string; text: string }): Promise<ActionResult<unknown>>;
  completeLesson(i: Ids): Promise<ActionResult<{ nextLessonId: string | null; unlocked: string[] }>>;
  heartbeat(i: Ids): Promise<unknown>;
};

export const readOnlyApi: LessonApi = {
  answerBlock: async () => ({ ok: false, error: "Preview only" }),
  saveDraft: async () => ({ ok: true, data: null }),
  submitReflection: async () => ({ ok: false, error: "Preview only" }),
  submitEvidence: async () => ({ ok: false, error: "Preview only" }),
  saveJournal: async () => ({ ok: true, data: null }),
  completeLesson: async () => ({ ok: false, error: "Preview only" }),
  heartbeat: async () => null,
};

export type LessonLinks = { lesson: (id: string) => string; missions: string };
export const defaultLinks: LessonLinks = { lesson: (id) => `/student/lessons/${id}`, missions: "/student/missions" };
