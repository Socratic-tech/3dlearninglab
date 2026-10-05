import { tr } from "@/lib/i18n";
import { Check, Lock, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";

/** Cosmetic store catalog. Access tools never cost XP. */
export const SKINS = [
  { id: "blueprint", name: "Blueprint", price: 0, colors: ["#0b5cad", "#b45309"] },
  { id: "neon", name: "Neon", price: 150, colors: ["#6d28d9", "#be185d"] },
  { id: "arcade", name: "Arcade", price: 300, colors: ["#0f766e", "#c2410c"] },
  { id: "sunset", name: "Sunset", price: 500, colors: ["#b91c5c", "#b45309"] },
  { id: "galaxy", name: "Galaxy", price: 800, colors: ["#4338ca", "#a21caf"] },
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

export function SkinPicker({ balance, owned, current, busy, onBuy, onChange }: { balance: number; owned: SkinId[]; current: SkinId; busy?: SkinId | null; onBuy: (id: SkinId) => void; onChange: (id: SkinId) => void }) {
  return (
    <section aria-labelledby="skin-h" className="rounded-3xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="skin-h" className="flex items-center gap-2 font-display text-xl font-bold"><ShoppingBag className="size-5 text-accent" aria-hidden /> {tr("Look store")}</h2>
        <strong className="ml-auto rounded-full bg-primary-soft px-3 py-1 font-mono text-sm">{balance} XP {tr("to spend")}</strong>
      </div>
      <p className="mt-1 text-sm text-muted">{tr("Spend XP on colors for your course. Reading and accessibility tools are always free.")}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SKINS.map((s) => {
          const open = owned.includes(s.id);
          const on = current === s.id;
          const canBuy = balance >= s.price;
          return (
            <li key={s.id} className="flex flex-col rounded-2xl border-2 border-border p-2 text-center text-xs font-semibold">
              <button
                disabled={!open || busy === s.id}
                aria-pressed={on}
                onClick={() => onChange(s.id)}
                className={cn("flex w-full flex-col items-center gap-1 rounded-xl p-1", on && "ring-2 ring-fg", !open && "opacity-70")}
                aria-label={open ? tr(on ? "{name} look (on)" : "Use {name} look", { name: tr(s.name) }) : tr("{name} look, costs {xp} XP", { name: tr(s.name), xp: s.price })}
              >
                <span className="relative grid size-10 place-items-center overflow-hidden rounded-full" style={{ background: `linear-gradient(135deg, ${s.colors[0]} 50%, ${s.colors[1]} 50%)` }}>
                  {!open ? <Lock className="size-4 text-white" aria-hidden /> : on ? <Check className="size-5 text-white" aria-hidden /> : null}
                </span>
                {tr(s.name)}
              </button>
              {open ? <span className="mt-1 text-muted">{on ? tr("Using") : tr("Owned")}</span> : <button disabled={!canBuy || busy === s.id} onClick={() => onBuy(s.id)} className="mt-1 rounded-lg bg-primary px-2 py-1 text-primary-fg disabled:opacity-50">{busy === s.id ? tr("Buying…") : tr("Buy · {xp} XP", { xp: s.price })}</button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Every look, no XP needed: for teachers and admins (in the Aa display menu). */
export function LookChooser({ current, onChange }: { current: SkinId; onChange: (id: SkinId) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold" id="look-h">{tr("Look")}</p>
      <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-labelledby="look-h">
        {SKINS.map((s) => {
          const on = current === s.id;
          return (
            <button
              key={s.id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(s.id)}
              className={cn("flex flex-col items-center gap-1 rounded-lg border-2 p-1 text-[11px] font-semibold", on ? "border-fg" : "border-transparent")}
            >
              <span className="grid size-8 place-items-center rounded-full" style={{ background: `linear-gradient(135deg, ${s.colors[0]} 50%, ${s.colors[1]} 50%)` }} aria-hidden>
                {on && <Check className="size-4 text-white" />}
              </span>
              {tr(s.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
