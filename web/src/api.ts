import type { ActionResult } from "@/server/errors";
import type { LessonApi } from "@/components/lesson/api";
import { currentToken } from "./auth";

/** POST to the class's Apps Script. text/plain avoids a CORS preflight, which Apps Script can't answer. */
export async function call<T>(apiUrl: string, action: string, args: Record<string, unknown> = {}): Promise<ActionResult<T>> {
  const token = currentToken();
  if (!token) return { ok: false, error: "Your sign-in expired. Please sign in again." };
  try {
    const res = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, token, args }) });
    if (!res.ok) return { ok: false, error: "We couldn't reach your class's Google storage. Your answer wasn't lost — try again.", details: `HTTP ${res.status}` };
    return (await res.json()) as ActionResult<T>;
  } catch (e) {
    return { ok: false, error: "We couldn't reach your class's Google storage. Check your connection and try again.", details: String(e) };
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

/** The lesson player's backend, implemented against the Apps Script API. */
export function googleLessonApi(apiUrl: string, onChange: () => void): LessonApi {
  return {
    answerBlock: (i) => call(apiUrl, "answerBlock", i),
    saveDraft: (i) => call(apiUrl, "saveDraft", i),
    submitReflection: async (i) => {
      const r = await call(apiUrl, "submitReflection", i);
      if (r.ok) onChange();
      return r;
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
        file,
      });
      if (r.ok) onChange();
      return r;
    },
    saveJournal: (i) => call(apiUrl, "saveJournal", i),
    completeLesson: async (i) => {
      const r = await call<{ nextLessonId: string | null; unlocked: string[] }>(apiUrl, "completeLesson", i);
      if (r.ok) onChange();
      return r;
    },
    heartbeat: async () => null,
  };
}
