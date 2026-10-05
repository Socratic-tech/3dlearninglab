/**
 * Mission-complete celebrations (XP store). Decorative only: hidden from screen readers, and the moving
 * ones are switched off for reduced motion. The trophy one stays as a still picture.
 */
const COLORS = ["var(--accent)", "var(--primary)", "var(--success)", "var(--warning)"];

export function Celebration({ kind = "fx-confetti" }: { kind?: string }) {
  if (kind === "fx-none") return null; // the student chose a quiet finish
  if (kind === "fx-fireworks") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 h-0 overflow-visible">
        {[18, 50, 82].map((x, b) => (
          <span key={x} className="absolute" style={{ left: `${x}%`, top: b === 1 ? -10 : 20 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <span key={i} className="fx-burst absolute block size-2 rounded-full" style={{ background: COLORS[(i + b) % 4], animationDelay: `${b * 250}ms`, ["--x" as string]: `${Math.cos(a) * 70}px`, ["--y" as string]: `${Math.sin(a) * 70}px` }} />;
            })}
          </span>
        ))}
      </div>
    );
  }
  if (kind === "fx-pixels") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 h-0 overflow-visible">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className="fx-pixel absolute block size-3" style={{ left: `${(i * 29) % 100}%`, background: COLORS[i % 4], animationDelay: `${(i % 7) * 70}ms`, ["--h" as string]: `${-120 - ((i * 37) % 120)}px` }} />
        ))}
      </div>
    );
  }
  if (kind === "fx-rocket") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 h-0 overflow-visible">
        <span className="fx-rocket absolute left-1/2 block text-5xl">🚀</span>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="fx-smoke absolute left-1/2 block size-3 rounded-full bg-[var(--muted)]" style={{ animationDelay: `${i * 60}ms`, ["--x" as string]: `${(i % 2 ? 1 : -1) * (8 + i * 3)}px` }} />
        ))}
      </div>
    );
  }
  if (kind === "fx-trophy") {
    return (
      <div aria-hidden className="mx-auto mb-2 w-28">
        <svg viewBox="0 0 120 110" className="w-full">
          <rect x="10" y="4" width="100" height="10" rx="3" fill="var(--fg)" opacity=".75" />
          <rect x="54" y="14" width="12" height="10" fill="var(--fg)" opacity=".75" />
          <path d="M57 24 L60 30 L63 24 Z" fill="var(--accent)" />
          <g className="fx-print">
            <path d="M38 40 h44 v10 a22 22 0 0 1 -44 0 z" fill="var(--warning)" />
            <path d="M38 44 h-8 a8 8 0 0 0 8 12 M82 44 h8 a8 8 0 0 1 -8 12" fill="none" stroke="var(--warning)" strokeWidth="4" />
            <rect x="55" y="72" width="10" height="12" fill="var(--warning)" />
            <rect x="44" y="84" width="32" height="8" rx="2" fill="var(--warning)" />
          </g>
          <rect x="20" y="94" width="80" height="6" rx="2" fill="var(--muted)" />
        </svg>
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-0 overflow-visible">
      {Array.from({ length: 24 }, (_, i) => (
        <span key={i} className="confetti absolute top-0 block h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % 4], animationDelay: `${(i % 6) * 60}ms`, ["--dx" as string]: `${((i * 53) % 80) - 40}px` }} />
      ))}
    </div>
  );
}
