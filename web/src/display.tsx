import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * UDL display & reading settings, remembered per device: text size, spacing, contrast, motion, theme, read-aloud speed.
 * Applied as data-attributes on <html>; the design tokens in globals.css respond to them.
 */
export type DisplayPrefs = { text: "normal" | "large" | "xlarge" | "xxlarge"; readable: boolean; contrast: boolean; motion: boolean; theme: "system" | "light" | "dark"; rate: number };
const KEY = "academy.display";
const DEFAULTS: DisplayPrefs = { text: "normal", readable: false, contrast: false, motion: false, theme: "system", rate: 0.95 };
const SIZES: DisplayPrefs["text"][] = ["normal", "large", "xlarge", "xxlarge"];

export function loadPrefs(): DisplayPrefs {
  try {
    const v = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") } as DisplayPrefs;
    const legacy = localStorage.getItem("academy.theme");
    if (legacy === "dark" || legacy === "light") v.theme = legacy;
    return v;
  } catch {
    return DEFAULTS;
  }
}

export function applyPrefs(p: DisplayPrefs) {
  const d = document.documentElement.dataset;
  if (p.text === "normal") delete d.text; else d.text = p.text;
  if (p.readable) d.readable = "true"; else delete d.readable;
  if (p.contrast) d.contrast = "high"; else delete d.contrast;
  if (p.motion) d.motion = "reduce"; else delete d.motion;
  if (p.theme === "system") delete d.theme; else d.theme = p.theme;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    localStorage.setItem("academy.theme", p.theme === "system" ? "" : p.theme);
    localStorage.setItem("academy.readRate", String(p.rate));
  } catch { /* private mode */ }
}

export function DisplayMenu() {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<DisplayPrefs>(loadPrefs);
  const ref = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<DisplayPrefs>) => {
    const next = { ...p, ...patch };
    setP(next);
    applyPrefs(next);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("mousedown", close);
    addEventListener("keydown", close);
    return () => { removeEventListener("mousedown", close); removeEventListener("keydown", close); };
  }, [open]);
  const idx = SIZES.indexOf(p.text);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" className="flex items-center gap-1 rounded-lg px-2 py-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Display and reading settings" title="Text size and reading settings">
        <Type className="size-5" aria-hidden /><span className="hidden text-sm font-semibold sm:inline">Aa</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Display and reading settings" className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] space-y-4 rounded-2xl border border-border bg-surface p-4 text-fg shadow-xl">
          <div>
            <p className="text-sm font-semibold" id="ts">Text size</p>
            <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby="ts">
              <button className="h-10 w-12 rounded-lg border border-border text-sm font-bold disabled:opacity-40" onClick={() => set({ text: SIZES[idx - 1] })} disabled={idx <= 0} aria-label="Smaller text">A−</button>
              <div className="flex flex-1 gap-1" aria-hidden>{SIZES.map((s, i) => <span key={s} className={cn("h-2 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-surface-2")} />)}</div>
              <button className="h-10 w-12 rounded-lg border border-border text-lg font-bold disabled:opacity-40" onClick={() => set({ text: SIZES[idx + 1] })} disabled={idx >= SIZES.length - 1} aria-label="Larger text">A+</button>
            </div>
            <p className="sr-only" aria-live="polite">Text size {idx + 1} of {SIZES.length}</p>
          </div>
          <Toggle label="Extra letter & line spacing" hint="Easier to track lines (dyslexia-friendly)" checked={p.readable} onChange={(v) => set({ readable: v })} />
          <Toggle label="High contrast" checked={p.contrast} onChange={(v) => set({ contrast: v })} />
          <Toggle label="Reduce motion" hint="Turns off animations" checked={p.motion} onChange={(v) => set({ motion: v })} />
          <div>
            <p className="text-sm font-semibold" id="th">Theme</p>
            <div className="mt-2 grid grid-cols-3 gap-1" role="radiogroup" aria-labelledby="th">
              {(["system", "light", "dark"] as const).map((t) => (
                <button key={t} role="radio" aria-checked={p.theme === t} onClick={() => set({ theme: t })} className={cn("rounded-lg border px-2 py-1.5 text-sm font-semibold", p.theme === t ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                  {t === "system" ? "Device" : t === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Read-aloud speed
            <input type="range" min={0.6} max={1.4} step={0.1} value={p.rate} onChange={(e) => set({ rate: Number(e.target.value) })} className="mt-2 w-full accent-[var(--primary)]" aria-valuetext={`${Math.round(p.rate * 100)}%`} />
          </label>
          <button className="text-sm text-primary underline" onClick={() => set(DEFAULTS)}>Reset to defaults</button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 accent-[var(--primary)]" />
    </label>
  );
}
