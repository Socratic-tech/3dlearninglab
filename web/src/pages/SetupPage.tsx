import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Alert, Card, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { normalizeApiUrl, setApiUrl, setClientId } from "../config";

const TEMPLATE = import.meta.env.VITE_TEMPLATE_URL as string;

export function SetupPage({ cfg, onSaved }: { cfg: { apiUrl: string | null; clientId: string | null }; onSaved: () => void }) {
  const [api, setApi] = useState(cfg.apiUrl ?? "");
  const [cid, setCid] = useState(cfg.clientId ?? "");
  const [manual, setManual] = useState(false);
  const valid = !!normalizeApiUrl(api);
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome!</h1>
        <p className="mt-2 text-lg"><strong>Students:</strong> open the class link your teacher posted in Google Classroom.</p>
      </div>
      <Card className="space-y-3">
        <CardTitle>Teachers: set up in about 5 minutes</CardTitle>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{TEMPLATE ? <>Click <strong>Make my copy</strong> below. It makes a Google Sheet in your Drive — your students&apos; work stays there.</> : <>Ask the person who shared this site for the template Sheet link, and make a copy.</>}</li>
          <li>In your new Sheet, open the menu <strong>3D Design Academy → Set up &amp; class links</strong>. Google will say the app isn&apos;t verified — it&apos;s your own copy, so click <strong>Advanced → Go to 3D Design Academy → Allow</strong>.</li>
          <li>Follow the 3 steps in the side panel. It gives you your dashboard and student links.</li>
        </ol>
        {TEMPLATE && (
          <a href={TEMPLATE} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg")}>
            Make my copy <ExternalLink className="size-4" aria-hidden /><span className="sr-only"> (opens Google Sheets in a new tab)</span>
          </a>
        )}
        <p className="text-sm text-muted">The menu can take a few seconds to appear the first time you open the Sheet.</p>
      </Card>
      <Alert tone="info" title="Invited to someone else's class?">
        Co-teachers and administrators don&rsquo;t make a copy. Ask the teacher for their <b>staff link</b> (it&rsquo;s on their dashboard and in their Sheet&rsquo;s side panel) and open that instead.
      </Alert>
      <div>
        <button className="text-sm text-muted underline" onClick={() => setManual(!manual)} aria-expanded={manual}>Already set up? Connect with your app address</button>
        {manual && (
          <Card className="mt-3 space-y-4">
            <Field label="Your app address (web-app URL)" htmlFor="api" hint="Looks like https://script.google.com/macros/s/…/exec — it's in the side panel of your Sheet.">
              <Input id="api" value={api} onChange={(e) => setApi(e.target.value)} />
            </Field>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <Field label="Google sign-in client ID" htmlFor="cid" hint="Only needed if this site was built without one.">
                <Input id="cid" value={cid} onChange={(e) => setCid(e.target.value)} />
              </Field>
            )}
            <Button disabled={!valid} onClick={() => {
              setApiUrl(api);
              setClientId(cid);
              onSaved();
            }}>Connect</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
