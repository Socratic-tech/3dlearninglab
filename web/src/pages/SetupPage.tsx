import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { setApiUrl } from "../config";

export function SetupPage({ cfg, onSaved }: { cfg: { apiUrl: string | null; clientId: string | null }; onSaved: () => void }) {
  const [api, setApi] = useState(cfg.apiUrl ?? "");
  const [cid, setCid] = useState(cfg.clientId ?? "");
  const valid = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(api.trim());
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="font-display text-3xl font-bold">Connect your class</h1>
      <p className="mt-2 text-muted">Students: open the class link your teacher posted in Google Classroom. Teachers: paste your Apps Script web-app URL (see the setup guide).</p>
      <Card className="mt-6 space-y-4">
        <CardTitle>Class connection</CardTitle>
        <Field label="Apps Script web-app URL" htmlFor="api" hint="Looks like https://script.google.com/macros/s/…/exec">
          <Input id="api" value={api} onChange={(e) => setApi(e.target.value)} />
        </Field>
        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <Field label="Google OAuth client ID" htmlFor="cid" hint="Only needed if this site was built without one.">
            <Input id="cid" value={cid} onChange={(e) => setCid(e.target.value)} />
          </Field>
        )}
        <Button disabled={!valid} onClick={() => {
          setApiUrl(api.trim());
          if (cid.trim()) try { localStorage.setItem("academy.cid", cid.trim()); } catch { /* ignore */ }
          onSaved();
        }}>Connect</Button>
      </Card>
    </div>
  );
}
