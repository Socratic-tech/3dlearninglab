"use client";
import { useState } from "react";
import { Presentation } from "lucide-react";
import type { Lesson, TeacherGuide } from "@/content/schema";
import { Button } from "@/components/ui/button";
import type { DeckInput } from "@/lib/slides/plan";

/**
 * "Download slides": builds a .pptx for the lesson in the browser (diagrams, student-facing text, teacher moves in
 * the speaker notes). Google Slides imports it directly.
 */
export function SlidesButton({ lesson, guide, size = "sm", variant = "secondary" }: { lesson: DeckInput["lesson"] | Lesson; guide?: Partial<TeacherGuide>; size?: "sm" | "md"; variant?: "primary" | "secondary" }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [name, setName] = useState("");
  const run = async () => {
    setState("busy");
    try {
      const { downloadDeck } = await import("@/lib/slides/build");
      setName(await downloadDeck({ lesson, guide }));
      setState("done");
    } catch (e) {
      console.error(e);
      setState("error");
    }
  };
  return (
    <span className="inline-flex flex-col gap-1">
      <Button size={size} variant={variant} onClick={() => void run()} disabled={state === "busy"} aria-describedby={`slides-help-${lesson.id}`}>
        <Presentation className="size-4" aria-hidden /> {state === "busy" ? "Building slides…" : "Download slides"}
      </Button>
      <span id={`slides-help-${lesson.id}`} role="status" className="max-w-xs text-xs text-muted">
        {state === "done" && <>Saved <strong>{name}</strong>. For Google Slides: upload it to Drive, then Open with → Google Slides. Your teacher moves are in the speaker notes.</>}
        {state === "error" && <>Couldn&apos;t build the slides in this browser. Try again, or use Chrome or Edge.</>}
        {state === "idle" && <span className="sr-only">Downloads a PowerPoint file that opens in Google Slides.</span>}
      </span>
    </span>
  );
}
