/**
 * "Script update ready" banner on the teacher dashboard.
 *
 * Lessons, questions and answer keys reach every class by themselves (the content feed). Only the engine — the
 * Apps Script in each teacher's Sheet — needs an occasional copy-and-paste update, e.g. for a new kind of question.
 * The site publishes apps-script/version.json; `me.app.version` says what this copy runs. Google doesn't let
 * Sheet copies update their own script, so the banner links to the copy-and-paste page.
 */
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import type { Me } from "../content";

type Latest = { version: string; notes?: string };
const DISMISS = "academy.update.later";
const PASTE_URL = `${import.meta.env.BASE_URL}apps-script/paste.html`;

export function UpdateBanner({ me }: { me: Me }) {
  const [latest, setLatest] = useState<Latest | null>(null);
  const [hidden, setHidden] = useState(() => {
    try { return sessionStorage.getItem(DISMISS) === "1"; } catch { return false; }
  });

  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.BASE_URL}apps-script/version.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Latest | null) => { if (live && v?.version) setLatest(v); })
      .catch(() => { /* offline or not published: no banner */ });
    return () => { live = false; };
  }, []);

  if (me.user.role !== "teacher" || hidden || !latest) return null;
  const mine = me.app?.version;
  const behind = !!me.app?.engineBehind;
  if (mine === "dev" || (mine === latest.version && !behind)) return null;

  const owner = me.app?.owner;
  const isOwner = !owner || owner === me.user.email.toLowerCase();
  return (
    <div className="mb-4">
      <Alert tone="warning" title={behind ? "Update your Sheet's script to get the newest lessons" : "A script update is ready for your class Sheet"}>
        {latest.notes && <p>{latest.notes}</p>}
        <p className="mt-1 text-sm">
          {isOwner ? "It's a copy and paste (about 5 minutes)." : `The Sheet's owner (${owner}) does this — it's a copy and paste.`} Links and student work stay the same. Everyday lesson changes don&rsquo;t need this; they arrive by themselves.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonLink href={PASTE_URL} external size="sm">Show me how</ButtonLink>
          <Button variant="secondary" size="sm" onClick={later}>Later</Button>
        </div>
      </Alert>
    </div>
  );

  function later() {
    try { sessionStorage.setItem(DISMISS, "1"); } catch { /* ignore */ }
    setHidden(true);
  }
}
