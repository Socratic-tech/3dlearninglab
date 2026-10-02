"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionResult } from "@/server/errors";
import { FriendlyError } from "./friendly-error";
import { Button } from "./button";
import { cn } from "@/lib/cn";

/**
 * Generic form bound to a Server Action returning ActionResult. Shows a status message or a friendly error.
 * `integration` marks Google Classroom forms (adds "your work is safe").
 */
export function ActionForm({
  action,
  children,
  submit = "Save",
  className,
  integration,
  variant = "primary",
  size = "md",
}: {
  action: (prev: unknown, fd: FormData) => Promise<ActionResult<unknown>>;
  children?: ReactNode;
  submit?: string;
  className?: string;
  integration?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent" | "ghost";
  size?: "sm" | "md";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={cn("space-y-3", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending} variant={variant} size={size}>
          {pending ? "Working…" : submit}
        </Button>
        {state?.ok && typeof state.data === "string" && (
          <span role="status" className="text-sm text-success">
            {state.data}
          </span>
        )}
      </div>
      {state && !state.ok && <FriendlyError error={state.error} details={state.details} integration={integration} />}
    </form>
  );
}
