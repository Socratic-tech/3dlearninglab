import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/** next/dynamic stand-in: React.lazy + Suspense. */
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>, opts?: { loading?: () => ReactNode; ssr?: boolean }) {
  const Lazy = lazy(async () => {
    const m = await loader();
    return "default" in (m as object) ? (m as { default: ComponentType<P> }) : { default: m as ComponentType<P> };
  });
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={opts?.loading?.() ?? null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
