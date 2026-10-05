import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/cn";
import { LOCALES, setLocale, tr, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { applySkin, LookChooser, savedSkin, type SkinId } from "./skins";

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

/** `allLooks`: teachers and admins can pick any look here (students unlock them with XP on their home page). */
export function DisplayMenu({ allLooks = false }: { allLooks?: boolean }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState<DisplayPrefs>(loadPrefs);
  const [skin, setSkin] = useState<SkinId>(savedSkin);
  const pickSkin = (id: SkinId) => { applySkin(id); setSkin(id); };
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
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog" className="flex items-center gap-1 rounded-lg px-2 py-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label={tr("Display and reading settings")} title={tr("Text size and reading settings")}>
        <Type className="size-5" aria-hidden /><span className="hidden text-sm font-semibold sm:inline">Aa</span>
      </button>
      {open && (
        <div role="dialog" aria-label={tr("Display and reading settings")} className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] space-y-4 rounded-2xl border border-border bg-surface p-4 text-fg shadow-xl">
          <LanguagePicker />
          {allLooks && (
            <>
              <LookChooser current={skin} onChange={pickSkin} />
              {p.contrast && <p className="-mt-2 text-xs text-muted">{tr("Looks are paused while High contrast is on.")}</p>}
            </>
          )}
          <div>
            <p className="text-sm font-semibold" id="ts">{tr("Text size")}</p>
            <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby="ts">
              <button className="h-10 w-12 rounded-lg border border-border text-sm font-bold disabled:opacity-40" onClick={() => set({ text: SIZES[idx - 1] })} disabled={idx <= 0} aria-label={tr("Smaller text")}>A−</button>
              <div className="flex flex-1 gap-1" aria-hidden>{SIZES.map((s, i) => <span key={s} className={cn("h-2 flex-1 rounded-full", i <= idx ? "bg-primary" : "bg-surface-2")} />)}</div>
              <button className="h-10 w-12 rounded-lg border border-border text-lg font-bold disabled:opacity-40" onClick={() => set({ text: SIZES[idx + 1] })} disabled={idx >= SIZES.length - 1} aria-label={tr("Larger text")}>A+</button>
            </div>
            <p className="sr-only" aria-live="polite">{tr("Text size {n} of {total}", { n: idx + 1, total: SIZES.length })}</p>
          </div>
          <Toggle label={tr("Extra letter & line spacing")} hint={tr("Easier to track lines (dyslexia-friendly)")} checked={p.readable} onChange={(v) => set({ readable: v })} />
          <Toggle label={tr("High contrast")} checked={p.contrast} onChange={(v) => set({ contrast: v })} />
          <Toggle label={tr("Reduce motion")} hint={tr("Turns off animations")} checked={p.motion} onChange={(v) => set({ motion: v })} />
          <div>
            <p className="text-sm font-semibold" id="th">{tr("Theme")}</p>
            <div className="mt-2 grid grid-cols-3 gap-1" role="radiogroup" aria-labelledby="th">
              {(["system", "light", "dark"] as const).map((t) => (
                <button key={t} role="radio" aria-checked={p.theme === t} onClick={() => set({ theme: t })} className={cn("rounded-lg border px-2 py-1.5 text-sm font-semibold", p.theme === t ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                  {t === "system" ? tr("Device") : t === "light" ? tr("Light") : tr("Dark")}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-semibold">
            {tr("Read-aloud speed")}
            <input type="range" min={0.6} max={1.4} step={0.1} value={p.rate} onChange={(e) => set({ rate: Number(e.target.value) })} className="mt-2 w-full accent-[var(--primary)]" aria-valuetext={`${Math.round(p.rate * 100)}%`} />
          </label>
          <button className="text-sm text-primary underline" onClick={() => { set(DEFAULTS); if (allLooks) pickSkin("blueprint"); }}>{tr("Reset to defaults")}</button>
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

/** Flip to true when the Spanish translation is complete (npm run i18n:check shows 0 missing). */
export const SPANISH_READY = true;
const LANG_KEY = "academy.lang";
/** Saved language, else the browser's (Spanish browsers start in Spanish). */
export function initialLocale(): Locale {
  if (!SPANISH_READY) return "en";
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "es") return v;
  } catch { /* private mode */ }
  return typeof navigator !== "undefined" && /^es\b/i.test(navigator.language || "") ? "es" : "en";
}
export function chooseLocale(l: Locale) {
  try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
  setLocale(l);
}

function LanguagePicker() {
  const locale = useLocale();
  if (!SPANISH_READY) return null;
  return (
    <div>
      <p className="text-sm font-semibold" id="lang">Language · Idioma</p>
      <div className="mt-2 grid grid-cols-2 gap-1" role="radiogroup" aria-labelledby="lang">
        {LOCALES.map((l) => (
          <button key={l.id} role="radio" lang={l.id} aria-checked={locale === l.id} onClick={() => chooseLocale(l.id)}
            className={cn("rounded-lg border px-2 py-1.5 text-sm font-semibold", locale === l.id ? "border-primary bg-primary-soft text-primary" : "border-border")}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
