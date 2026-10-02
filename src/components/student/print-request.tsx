"use client";

import { useRef, useState, useTransition } from "react";
import { requestPrintAction, resubmitPrintAction, withdrawPrintAction } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FriendlyError } from "@/components/ui/friendly-error";

export function PrintRequestForm({ courseId, lessons }: { courseId: string; lessons: { id: string; title: string }[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<{ error: string; details?: string } | null>(null);
  const [ok, setOk] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className="grid gap-3 sm:grid-cols-2"
      action={(fd) =>
        start(async () => {
          fd.set("courseId", courseId);
          const r = await requestPrintAction(fd);
          if (r.ok) {
            setOk(true);
            setErr(null);
            ref.current?.reset();
          } else setErr(r);
        })
      }
    >
      <Field label="What is it?" htmlFor="pr-title">
        <Input id="pr-title" name="title" required maxLength={120} placeholder="Fit test ring" />
      </Field>
      <Field label="Mission" htmlFor="pr-lesson">
        <Select id="pr-lesson" name="lessonId">
          <option value="">(none)</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="STL file" htmlFor="pr-file">
        <input id="pr-file" type="file" name="file" accept=".stl" required className="text-sm" />
      </Field>
      <Field label="Approximate size" htmlFor="pr-size" hint="e.g. 40 × 20 × 10 mm">
        <Input id="pr-size" name="estimatedSize" maxLength={60} />
      </Field>
      <Field label="Notes for your teacher" htmlFor="pr-notes" className="sm:col-span-2" hint="What are you testing? Print only the part you need to test.">
        <Textarea id="pr-notes" name="notes" className="min-h-16" />
      </Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending ? "Sending…" : "Send to print queue"}</Button>
        {ok && <span role="status" className="text-sm text-success">Sent! Watch for status updates here.</span>}
      </div>
      {err && <div className="sm:col-span-2"><FriendlyError {...err} /></div>}
    </form>
  );
}

export function PrintJobActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (status !== "submitted" && status !== "needs_revision" && status !== "draft") return null;
  const go = (fn: (id: string) => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn(id);
      setErr(r.ok ? null : (r.error ?? "Try again"));
    });
  return (
    <span className="flex items-center gap-2">
      {status === "submitted" ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => go(withdrawPrintAction)}>
          Withdraw
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => go(resubmitPrintAction)}>
          Resubmit
        </Button>
      )}
      {err && <span role="alert" className="text-xs text-danger">{err}</span>}
    </span>
  );
}

export function FeatureToggle({ evidenceId, featured }: { evidenceId: string; featured: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={featured ? "accent" : "secondary"}
      aria-pressed={featured}
      disabled={pending}
      onClick={() => start(async () => void (await (await import("@/app/actions/student")).toggleFeaturedAction(evidenceId, !featured)))}
    >
      {featured ? "★ Featured" : "☆ Feature in portfolio"}
    </Button>
  );
}
