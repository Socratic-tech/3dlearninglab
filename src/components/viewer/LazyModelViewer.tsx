"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import type { ModelViewerProps } from "./ModelViewer";

export type { ModelViewerProps, ViewerHotspot } from "./ModelViewer";

function ViewerPlaceholder() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {/* Toolbar-height spacer keeps layout stable when the real viewer mounts. */}
      <div className="h-[30px]" aria-hidden="true" />
      <div
        role="status"
        className="flex items-center justify-center rounded-lg border border-border bg-surface-2 text-sm text-muted"
        style={{ height: "var(--viewer-height, 320px)" }}
      >
        Loading 3D preview…
      </div>
    </div>
  );
}

const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => <ViewerPlaceholder />,
});

/**
 * Client-only, code-split 3D viewer. three.js is only downloaded when this renders.
 * Import this (not ModelViewer) from the rest of the app.
 */
export default function LazyModelViewer(props: ModelViewerProps) {
  return (
    <div className={props.className} style={{ "--viewer-height": `${props.height ?? 320}px` } as CSSProperties}>
      <ModelViewer {...props} className={undefined} />
    </div>
  );
}
