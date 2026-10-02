"use client";

import { tr } from "@/lib/i18n";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./button";

/**
 * Friendly error with an optional retry and technical details (spec §56).
 * `integration` adds the reassurance that local work is safe.
 */
export function FriendlyError({ error, details, onRetry, integration }: { error: string; details?: string; onRetry?: () => void; integration?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-4">
      <p className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-5 text-danger" aria-hidden /> {error}
      </p>
      {integration && <p className="mt-1 text-sm">{tr("Your work in 3D Design Academy is safe.")}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {tr("Try again")}
          </Button>
        )}
        {details && (
          <Button size="sm" variant="ghost" onClick={() => setShow((s) => !s)} aria-expanded={show}>
            {show ? tr("Hide details") : tr("View details")}
          </Button>
        )}
      </div>
      {show && details && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-surface p-2 font-mono text-xs">{details}</pre>}
    </div>
  );
}
