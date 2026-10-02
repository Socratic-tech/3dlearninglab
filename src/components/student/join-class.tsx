"use client";

import { useActionState } from "react";
import { joinCourseAction } from "@/app/actions/student";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function JoinClassCard() {
  const [state, action, pending] = useActionState(joinCourseAction, null);
  return (
    <Card>
      <CardTitle>Join a class</CardTitle>
      <p className="mt-1 text-sm text-muted">Your teacher will give you a 6-character class code. Classes from Google Classroom appear automatically.</p>
      <form action={action} className="mt-4 flex items-end gap-2">
        <Field label="Class code" htmlFor="code" className="flex-1">
          <Input id="code" name="code" required maxLength={8} autoComplete="off" className="font-mono uppercase tracking-widest" placeholder="ABC123" />
        </Field>
        <Button disabled={pending}>{pending ? "Joining…" : "Join"}</Button>
      </form>
      {state && !state.ok && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="mt-2 text-sm text-success">
          Joined {state.data.name}!
        </p>
      )}
    </Card>
  );
}
