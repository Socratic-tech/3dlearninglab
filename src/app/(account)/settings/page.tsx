import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/session";
import { demoEnabled } from "@/server/env";
import { parsePrefs, PREFS_COOKIE } from "@/lib/prefs";
import { resetDemoAction, savePrefsAction, signOutAction } from "@/app/actions/session";
import { Card, CardTitle, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const user = await requireUser();
  const prefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);
  return (
    <>
      <PageHeader title="Settings" description={`${user.displayName} · ${user.email}`} />
      <Card>
        <CardTitle>Display & reading</CardTitle>
        <form action={savePrefsAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="_form" value="1" />
          <Field label="Theme" htmlFor="theme">
            <Select id="theme" name="theme" defaultValue={prefs.theme}>
              <option value="system">Match my device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Field label="Text size" htmlFor="text">
            <Select id="text" name="text" defaultValue={prefs.text}>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra large</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="readable" defaultChecked={prefs.readable} className="size-4" /> Extra letter and line spacing (dyslexia-friendly)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="motion" value="reduce" defaultChecked={prefs.motion === "reduce"} className="size-4" /> Reduce motion
          </label>
          <div className="sm:col-span-2">
            <Button>Save settings</Button>
          </div>
        </form>
      </Card>
      {demoEnabled && user.isDemo && (
        <Card className="mt-6">
          <CardTitle>Demo</CardTitle>
          <p className="mt-1 text-sm text-muted">Reset every demo account back to the original sample data.</p>
          <form action={resetDemoAction} className="mt-3">
            <Button variant="danger">Reset demo data</Button>
          </form>
        </Card>
      )}
      <form action={signOutAction} className="mt-6">
        <Button variant="secondary">Sign out</Button>
      </form>
    </>
  );
}
