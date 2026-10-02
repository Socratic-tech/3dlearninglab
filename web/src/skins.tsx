import { tr } from "@/lib/i18n";
import { Check, Lock, Palette } from "lucide-react";
import { cn } from "@/lib/cn";

/** Looks a student unlocks with XP. Purely cosmetic; saved on this device. */
export const SKINS = [
  { id: "blueprint", name: "Blueprint", xp: 0, colors: ["#0b5cad", "#b45309"] },
  { id: "neon", name: "Neon", xp: 150, colors: ["#6d28d9", "#be185d"] },
  { id: "arcade", name: "Arcade", xp: 400, colors: ["#0f766e", "#c2410c"] },
  { id: "sunset", name: "Sunset", xp: 800, colors: ["#b91c5c", "#b45309"] },
  { id: "galaxy", name: "Galaxy", xp: 1500, colors: ["#4338ca", "#a21caf"] },
] as const;
export type SkinId = (typeof SKINS)[number]["id"];

const KEY = "academy.skin";
export function savedSkin(): SkinId {
  try {
    const v = localStorage.getItem(KEY);
    return (SKINS.find((s) => s.id === v)?.id ?? "blueprint") as SkinId;
  } catch {
    return "blueprint";
  }
}
export function applySkin(id: SkinId) {
  if (id === "blueprint") delete document.documentElement.dataset.skin;
  else document.documentElement.dataset.skin = id;
  try { localStorage.setItem(KEY, id); } catch { /* private mode */ }
}

export function SkinPicker({ xp, current, onChange }: { xp: number; current: SkinId; onChange: (id: SkinId) => void }) {
  const next = SKINS.find((s) => s.xp > xp);
  return (
    <section aria-labelledby="skin-h" className="rounded-3xl border border-border bg-surface p-5">
      <h2 id="skin-h" className="flex items-center gap-2 font-display text-xl font-bold"><Palette className="size-5 text-accent" aria-hidden /> {tr("Your look")}</h2>
      <p className="text-sm text-muted">{next ? tr("{n} more XP unlocks {name}.", { n: next.xp - xp, name: tr(next.name) }) : tr("You've unlocked every look!")}</p>
      <ul className="mt-3 grid grid-cols-5 gap-2">
        {SKINS.map((s) => {
          const open = xp >= s.xp;
          const on = current === s.id;
          return (
            <li key={s.id}>
              <button
                disabled={!open}
                aria-pressed={on}
                onClick={() => onChange(s.id)}
                className={cn("flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-semibold", on ? "border-fg" : "border-border", !open && "opacity-60")}
                aria-label={open ? tr(on ? "{name} look (on)" : "{name} look", { name: tr(s.name) }) : tr("{name} look, unlocks at {xp} XP", { name: tr(s.name), xp: s.xp })}
              >
                <span className="relative grid size-10 place-items-center overflow-hidden rounded-full" style={{ background: `linear-gradient(135deg, ${s.colors[0]} 50%, ${s.colors[1]} 50%)` }}>
                  {!open ? <Lock className="size-4 text-white" aria-hidden /> : on ? <Check className="size-5 text-white" aria-hidden /> : null}
                </span>
                {tr(s.name)}
                {!open && <span className="font-mono text-[10px] text-muted">{s.xp} XP</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
