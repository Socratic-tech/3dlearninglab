import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isLocalApi } from "../config";
import type { Me } from "../content";
import { isNewTeacherDevice, latestReleaseId, RELEASES, unseenReleases } from "../whatsnew";

const memory = new Map<string, string>();
const seenKey = (email: string) => `academy.whatsnew.seen:${email.toLowerCase()}`;
function read(key: string): string | null {
  try { const v = localStorage.getItem(key); if (v !== null) return v; } catch { /* storage blocked */ }
  return memory.get(key) ?? null;
}
function write(key: string, value: string) {
  memory.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* memory only */ }
}

/**
 * Teacher dashboard: a one-time summary of what changed since the teacher last looked. Remembered per teacher on this
 * device. A teacher who has only ever set up on this device sees nothing (it's all new to them).
 */
export function WhatsNew({ me, apiUrl }: { me: Me; apiUrl: string }) {
  const key = seenKey(me.user.email);
  const [seen, setSeen] = useState<string | null>(() => {
    const s = read(key);
    if (s === null && isNewTeacherDevice(read)) { write(key, latestReleaseId()); return latestReleaseId(); }
    return s;
  });
  if (me.user.role !== "teacher" || isLocalApi(apiUrl)) return null;
  const releases = unseenReleases(seen);
  if (!releases.length) return null;
  const dismiss = () => { write(key, latestReleaseId(RELEASES)); setSeen(latestReleaseId(RELEASES)); };
  return (
    <section aria-labelledby="whatsnew-h" className="mb-4">
      <Card className="space-y-3 border-2 border-accent">
        <h2 id="whatsnew-h" className="flex items-center gap-2 font-display text-xl font-bold"><Sparkles className="size-5 text-accent" aria-hidden /> What&apos;s new</h2>
        {releases.map((r) => (
          <div key={r.id} className="space-y-2">
            <h3 className="font-semibold">{r.title}</h3>
            <ul className="list-disc space-y-1 pl-5">{r.items.map((t) => <li key={t}>{t}</li>)}</ul>
            {r.action && <a href={r.action.href} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 font-semibold text-primary-fg hover:brightness-110">{r.action.label}</a>}
          </div>
        ))}
        <p className="text-sm text-muted">If an <b>Update available</b> bar shows above, click <b>Update now</b> first so your Sheet has these features.</p>
        <Button variant="secondary" onClick={dismiss}>Got it</Button>
      </Card>
    </section>
  );
}
