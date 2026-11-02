import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { call } from "../api";
import type { Me } from "../content";

const MAX = 600;

/** Plain text with https links made clickable. Nothing else is interpreted. */
function Linked({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-lg">
      {text.split(/(https:\/\/[^\s]+)/g).map((part, i) =>
        /^https:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-primary underline">{part}</a> : part,
      )}
    </p>
  );
}

/**
 * A teacher's own note on a mission for their class ("Grab a bag of math cubes first", a link to their video).
 * Teachers edit it here while previewing; students see it at the top of the mission.
 */
export function TeacherNote({ me, apiUrl, lessonId, staff, onChange }: { me: Me; apiUrl: string; lessonId: string; staff: boolean; onChange: () => void }) {
  const cls = me.cls;
  const saved = cls?.notes?.[lessonId] ?? "";
  const [text, setText] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  if (!cls) return null;

  if (!staff) {
    if (!saved) return null;
    return (
      <section aria-label={tr("A note from your teacher")} className="mb-4 rounded-2xl border-2 border-accent bg-accent-soft p-4">
        <p className="flex items-center gap-2 font-display font-bold"><MessageSquareText className="size-5 text-accent" aria-hidden />{tr("A note from your teacher")}</p>
        <div className="mt-1"><Linked text={saved} /></div>
      </section>
    );
  }

  const save = async (value: string) => {
    setBusy(true);
    setMsg(null);
    const r = await call<{ notes?: Record<string, string> }>(apiUrl, "updateClass", { classId: cls.id, lessonNote: { lessonId, text: value } });
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "error", text: r.error }); return; }
    const stored = r.data.notes?.[lessonId] ?? "";
    if (r.data.notes === undefined || stored !== value.trim()) {
      setMsg({ tone: "warn", text: tr("Your class Sheet needs the latest update to keep mission notes. On your dashboard, click Update now, then save the note again.") });
      return;
    }
    setText(stored);
    setMsg({ tone: "ok", text: stored ? tr("Saved. {cls} students see this at the top of the mission.", { cls: cls.name }) : tr("Note removed.") });
    onChange();
  };

  return (
    <details className="mb-4 rounded-2xl border border-border bg-surface p-4" open={!!saved}>
      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
        <MessageSquareText className="size-5 text-accent" aria-hidden />
        {saved ? tr("Your note for {cls}", { cls: cls.name }) : tr("Add a note for {cls} on this mission", { cls: cls.name })}
      </summary>
      <p className="mt-2 text-sm text-muted">{tr("Students in this class see it at the top of the mission. For example: what to grab before starting, how you'll run today, or a link to your own video.")}</p>
      <label className="sr-only" htmlFor={`note-${lessonId}`}>{tr("Note for students")}</label>
      <Textarea id={`note-${lessonId}`} value={text} maxLength={MAX} onChange={(e) => setText(e.target.value)} className="mt-2 min-h-20" placeholder={tr("Grab a bag of math cubes from the back table before you start.")} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy || text.trim() === saved} onClick={() => void save(text)}>{busy ? tr("Saving…") : tr("Save note")}</Button>
        {saved && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setText(""); void save(""); }}>{tr("Remove note")}</Button>}
        <span className="ml-auto text-xs text-muted">{text.length}/{MAX}</span>
      </div>
      {msg && <p role={msg.tone === "error" ? "alert" : "status"} className={msg.tone === "error" ? "mt-2 text-sm text-danger" : msg.tone === "warn" ? "mt-2 text-sm text-warning" : "mt-2 text-sm text-success"}>{msg.text}</p>}
    </details>
  );
}
