import { getLocale } from "@/lib/i18n";
import type { Stats } from "@/lib/streaks";
import type { ActionResult } from "@/server/errors";
import type { LessonApi } from "@/components/lesson/api";
import { currentToken } from "./auth";
import { currentClassId } from "./config";
import { enqueue } from "./sync";
import { studentViewOn } from "./state";

/** POST to the class's Apps Script. text/plain avoids a CORS preflight, which Apps Script can't answer. */
/**
 * Calls the class's Apps Script. Each call has a requestId; if the reply is lost (Apps Script occasionally drops
 * the response after finishing the work), we retry once with the same id and the script returns its saved answer
 * instead of doing the work twice.
 */
export async function call<T>(apiUrl: string, action: string, args: Record<string, unknown> = {}): Promise<ActionResult<T>> {
  const requestId = crypto.randomUUID();
  const first = await callOnce<T>(apiUrl, action, args, requestId);
  if (first.ok || !first.retryable) return strip(first);
  await new Promise((r) => setTimeout(r, 1500));
  return strip(await callOnce<T>(apiUrl, action, args, requestId));
}

type Attempt<T> = ActionResult<T> & { retryable?: boolean };
function strip<T>(r: Attempt<T>): ActionResult<T> {
  delete r.retryable;
  return r;
}

export async function callOnce<T>(apiUrl: string, action: string, args: Record<string, unknown>, requestId: string): Promise<Attempt<T>> {
  const token = currentToken();
  if (!token) return { ok: false, error: "Your sign-in expired. Please sign in again." };
  try {
    const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, token, requestId, args: { classId: currentClassId(), lang: getLocale(), asStudent: studentViewOn(), ...args } }) });
    const text = await res.text();
    if (!res.ok) return { ok: false, retryable: true, error: `Google storage didn't answer (HTTP ${res.status}). Your work wasn't lost — try again.`, details: text.slice(0, 500) };
    try {
      return JSON.parse(text) as ActionResult<T>;
    } catch {
      // Apps Script answered with an HTML page (usually a permission or deployment problem)
      const title = /<title>([^<]*)<\/title>/i.exec(text)?.[1] ?? text.replace(/<[^>]+>/g, " ").trim().slice(0, 160);
      return { ok: false, retryable: true, error: `Google storage sent an unexpected page: “${title}”. Check the web-app deployment (Execute as: Me · Anyone).`, details: text.slice(0, 500) };
    }
  } catch (e) {
    return { ok: false, retryable: true, error: `We couldn't reach your class's Google storage (${String(e).slice(0, 80)}). Check your connection and try again.`, details: String(e) };
  }
}

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

/**
 * The lesson player's backend, implemented against the Apps Script API.
 * Everything except file uploads goes through the background queue (sync.ts), so the page never waits on Google.
 * Answers carry the instantly computed `local` result so the home screen can show progress before Google confirms.
 */
export function googleLessonApi(apiUrl: string, onChange: () => void): LessonApi {
  return {
    // instant practice answers queue in the background; skill checks go straight to Google (the page waits for them)
    answerBlock: (i) => (i.local ? enqueue("answerBlock", { ...i }) : call(apiUrl, "answerBlock", i)) as never,
    saveDraft: (i) => {
      void enqueue("saveDraft", { ...i }, `draft:${i.lessonId}:${i.blockId}`);
      return Promise.resolve({ ok: true, data: null });
    },
    submitReflection: (i) => {
      void enqueue("submitReflection", { ...i }, `reflect:${i.lessonId}:${i.blockId}`);
      return Promise.resolve({ ok: true, data: null });
    },
    submitEvidence: async (fd) => {
      const f = fd.get("file");
      const file = f instanceof File && f.size > 0 ? { name: f.name, type: f.type, base64: await fileToBase64(f) } : undefined;
      const r = await call<{ id: string; type: string; fileName: string | null; url: string | null; createdAt: string }>(apiUrl, "submitEvidence", {
        lessonId: fd.get("lessonId"),
        blockId: fd.get("blockId"),
        kind: fd.get("kind"),
        url: fd.get("url"),
        note: fd.get("note"),
        requestPrint: fd.get("requestPrint") === "on",
        file,
      });
      if (r.ok) onChange();
      return r;
    },
    saveJournal: (i) => {
      void enqueue("saveJournal", { ...i }, `journal:${i.projectKey}:${i.promptId}`);
      return Promise.resolve({ ok: true, data: null });
    },
    completeLesson: async (i) => {
      const r = await enqueue<{ nextLessonId: string | null; unlocked: string[]; stats?: Stats }>("completeLesson", { ...i });
      if (r.ok) onChange();
      return r;
    },
    heartbeat: async () => null,
  };
}
