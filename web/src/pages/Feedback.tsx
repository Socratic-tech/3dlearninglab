import { useEffect, useRef, useState } from "react";
import { Bug, Lightbulb, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { DictateButton } from "@/components/ui/dictate";
import { cn } from "@/lib/cn";
import { call } from "../api";
import { currentApiUrl, isLocalApi } from "../config";
import type { Me } from "../content";

type Kind = "feature" | "bug";

const COPY: Record<Kind, { title: string; hint: string; sendLabel: string }> = {
  feature: { title: "A feature idea", hint: "What would you like to be able to do? Who is it for, and why would it help?", sendLabel: "Send my idea" },
  bug: { title: "Something isn't working", hint: "What were you trying to do? What happened? What did you expect to happen?", sendLabel: "Send the bug report" },
};

/** What gets sent along so a bug can be found: the page, browser and versions. Never any student information. */
export function feedbackDetails() {
  return {
    page: location.hash || "#/",
    browser: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
  };
}

/** Header button (teachers only) that opens the feedback form. Works on every teacher page. */
export function FeedbackButton({ me }: { me?: Me }) {
  const [open, setOpen] = useState(false);
  const apiUrl = currentApiUrl();
  if (!me || me.user.role !== "teacher" || !apiUrl || isLocalApi(apiUrl)) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" title="Send a feature idea or report a bug" className="flex items-center gap-1 rounded-lg p-2 text-sm font-semibold hover:bg-surface-2 sm:px-3 print:hidden">
        <MessageSquarePlus className="size-5" aria-hidden /><span className="hidden sm:inline">Feedback</span><span className="sr-only sm:hidden">Feedback</span>
      </button>
      {open && <FeedbackDialog me={me} apiUrl={apiUrl} onClose={() => setOpen(false)} />}
    </>
  );
}

export function FeedbackDialog({ me, apiUrl, onClose }: { me: Me; apiUrl: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<Kind>("feature");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else d.setAttribute("open", "");
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || message.trim().length < 5) return;
    setBusy(true);
    setError(null);
    const r = await call(apiUrl, "sendFeedback", { kind, message: message.trim(), details: feedbackDetails() });
    setBusy(false);
    if (r.ok) setDone(true); else setError(r.error);
  };

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="fb-title" className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-fg shadow-xl backdrop:bg-black/50">
      <div className="space-y-4 p-6">
        {done ? (
          <>
            <h2 id="fb-title" className="font-display text-2xl font-bold">Thank you!</h2>
            <p role="status">Your {kind === "bug" ? "bug report" : "idea"} was sent. If I have a question, I&apos;ll reply to <b>{me.user.email}</b>.</p>
            <Button onClick={onClose}>Close</Button>
          </>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <h2 id="fb-title" className="font-display text-2xl font-bold">Send feedback</h2>
            <p className="text-muted">It goes straight to the person who runs 3D Design Academy.</p>
            <fieldset>
              <legend className="mb-2 font-semibold">What is it?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["feature", "bug"] as const).map((k) => (
                  <label key={k} className={cn("flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 p-3 font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus", kind === k ? "border-primary bg-primary-soft" : "border-border")}>
                    <input type="radio" name="fb-kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
                    {k === "feature" ? <Lightbulb className="size-5 text-primary" aria-hidden /> : <Bug className="size-5 text-primary" aria-hidden />}
                    {COPY[k].title}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="fb-msg" className="mb-1 block font-semibold">Tell me about it</label>
              <p id="fb-hint" className="mb-2 text-sm text-muted">{COPY[kind].hint}</p>
              <Textarea id="fb-msg" aria-describedby="fb-hint" rows={6} maxLength={3000} value={message} onChange={(e) => setMessage(e.target.value)} autoFocus />
              <div className="mt-1 flex items-center justify-between gap-2">
                <DictateButton onText={(w) => setMessage((m) => (m ? `${m} ${w}` : w))} />
                <span className="ml-auto text-xs text-muted">{message.length}/3000</span>
              </div>
            </div>
            <p className="rounded-lg bg-surface-2 p-3 text-sm">
              <b>Sent with:</b> your name and email ({me.user.email}), the page you&apos;re on, your browser and the app version, so I can reply and find the problem.
              <b> Please don&apos;t include student names or other student information.</b>
            </p>
            {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || message.trim().length < 5}>{busy ? "Sending…" : COPY[kind].sendLabel}</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
