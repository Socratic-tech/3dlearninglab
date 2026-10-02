import type { ReactNode } from "react";
import { reviewEvidenceAction } from "@/app/actions/teacher";
import { ActionForm } from "@/components/ui/action-form";
import { Card, Pill } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { getCompetency } from "@/content";

export type ReviewEvidence = { id: string; type: string; url: string | null; fileKey: string | null; fileName: string | null; mimeType: string | null; response: string | null; status: string; teacherRating: number | null; teacherComment: string | null; createdAt: string; competencyIds: string[] };

export function EvidenceReviewCard({ e, header }: { e: ReviewEvidence; header: ReactNode; courseId: string }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {header}
        <span className="ml-auto text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</span>
      </div>
      <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
        <Pill tone="primary">{e.type.replace("_", " ")}</Pill>{" "}
        {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">{e.url}</a>}
        {e.fileKey && (e.mimeType?.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/files/${e.fileKey}`} alt={`Screenshot submitted: ${e.fileName}`} className="mt-2 max-h-72 rounded" />
        ) : (
          <a href={`/api/files/${e.fileKey}`} className="text-primary underline">Download {e.fileName}</a>
        ))}
        {e.response && <p className="mt-2 whitespace-pre-wrap">{e.response}</p>}
      </div>
      <p className="mt-2 text-xs text-muted">Evidence for: {e.competencyIds.map((c) => `${c} ${getCompetency(c)?.title ?? ""}`).join(" · ")}</p>
      <ActionForm action={reviewEvidenceAction.bind(null, e.id)} submit="Save review" className="mt-3" size="sm">
        <fieldset className="flex flex-wrap gap-2 text-sm">
          <legend className="mb-1 font-semibold">Rating</legend>
          {[
            ["", "No rating"],
            ["1", "I · Developing"],
            ["2", "II · Proficient"],
            ["3", "III · Independent"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1">
              <input type="radio" name="rating" value={v} defaultChecked={String(e.teacherRating ?? "") === v} /> {l}
            </label>
          ))}
        </fieldset>
        <label className="block text-sm font-semibold" htmlFor={`c-${e.id}`}>Feedback for the student</label>
        <Textarea id={`c-${e.id}`} name="comment" defaultValue={e.teacherComment ?? ""} className="min-h-16" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="needsRevision" defaultChecked={e.status === "needs_revision"} /> Ask for a revision
        </label>
      </ActionForm>
    </Card>
  );
}
