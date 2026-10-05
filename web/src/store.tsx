/**
 * XP store: avatar, titles, celebrations, looks and class rewards.
 * Everything here is cosmetic or a classroom perk the teacher controls — learning and accessibility tools are
 * never sold. Prices come from the server (store.prices); this file only knows names and pictures.
 */
import { tr } from "@/lib/i18n";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Gift, Lock, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { Celebration } from "@/components/student/celebration";
import { call } from "./api";
import { applySkin, SKINS, type SkinId } from "./skins";
import { lessonFor, type Me } from "./content";

type Store = NonNullable<Me["store"]>;
type Slot = "body" | "color" | "hat" | "tool" | "title" | "celebration" | "look";

const ITEMS: { id: string; slot: Slot; name: string }[] = [
  { id: "body-bot", slot: "body", name: "Robot" }, { id: "body-cube", slot: "body", name: "Cube" }, { id: "body-octo", slot: "body", name: "Octo" },
  { id: "body-dragon", slot: "body", name: "Dragon" }, { id: "body-ufo", slot: "body", name: "UFO" },
  { id: "body-initials", slot: "body", name: "Initials badge" }, { id: "body-pixel", slot: "body", name: "Pixel" }, { id: "body-visor", slot: "body", name: "Visor" },
  { id: "color-blue", slot: "color", name: "Blue" }, { id: "color-orange", slot: "color", name: "Orange" }, { id: "color-green", slot: "color", name: "Green" },
  { id: "color-purple", slot: "color", name: "Purple" }, { id: "color-pink", slot: "color", name: "Pink" }, { id: "color-gold", slot: "color", name: "Gold" },
  { id: "hat-none", slot: "hat", name: "No hat" }, { id: "hat-goggles", slot: "hat", name: "Safety goggles" }, { id: "hat-headphones", slot: "hat", name: "Headphones" },
  { id: "hat-wizard", slot: "hat", name: "Wizard hat" }, { id: "hat-crown", slot: "hat", name: "Crown" },
  { id: "tool-none", slot: "tool", name: "Nothing" }, { id: "tool-wrench", slot: "tool", name: "Wrench" }, { id: "tool-calipers", slot: "tool", name: "Calipers" },
  { id: "tool-spool", slot: "tool", name: "Filament spool" }, { id: "tool-trophy", slot: "tool", name: "Trophy" },
  { id: "title-rookie", slot: "title", name: "Rookie Maker" }, { id: "title-layer-legend", slot: "title", name: "Layer Legend" }, { id: "title-cad-wizard", slot: "title", name: "CAD Wizard" },
  { id: "title-support-slayer", slot: "title", name: "Support Slayer" }, { id: "title-tolerance-tamer", slot: "title", name: "Tolerance Tamer" },
  { id: "title-bridge-boss", slot: "title", name: "Bridge Boss" }, { id: "title-infill-icon", slot: "title", name: "Infill Icon" },
  { id: "title-cad-surgeon", slot: "title", name: "CAD Surgeon" }, { id: "title-sprint-champion", slot: "title", name: "Sprint Champion" }, { id: "title-master-maker", slot: "title", name: "Master Maker" },
  { id: "fx-none", slot: "celebration", name: "Quiet (no animation)" }, { id: "fx-confetti", slot: "celebration", name: "Confetti" }, { id: "fx-fireworks", slot: "celebration", name: "Fireworks" }, { id: "fx-pixels", slot: "celebration", name: "Pixel burst" },
  { id: "fx-trophy", slot: "celebration", name: "Print a trophy" }, { id: "fx-rocket", slot: "celebration", name: "Rocket launch" },
  ...SKINS.map((s) => ({ id: s.id as string, slot: "look" as Slot, name: s.name as string })),
];
export const itemName = (id: string | undefined) => tr(ITEMS.find((x) => x.id === id)?.name ?? "");

const COLOR: Record<string, [string, string]> = {
  "color-blue": ["#2563eb", "#1e40af"], "color-orange": ["#ea580c", "#9a3412"], "color-green": ["#16a34a", "#166534"],
  "color-purple": ["#7c3aed", "#5b21b6"], "color-pink": ["#db2777", "#9d174d"], "color-gold": ["#eab308", "#a16207"],
};

/** The student's maker avatar, drawn from equipped parts. Decorative unless a label is given. */
export function Avatar({ eq, size = 64, label, initials = "" }: { eq?: Record<string, string>; size?: number; label?: string; initials?: string }) {
  const body = eq?.body ?? "body-bot";
  const [c, d] = COLOR[eq?.color ?? "color-blue"] ?? COLOR["color-blue"];
  const hat = eq?.hat ?? "hat-none";
  const tool = eq?.tool ?? "tool-none";
  const eyes = (y: number) => (<><circle cx="40" cy={y} r="5" fill="#fff" /><circle cx="60" cy={y} r="5" fill="#fff" /><circle cx="41" cy={y + 1} r="2.4" fill="#0f172a" /><circle cx="61" cy={y + 1} r="2.4" fill="#0f172a" /></>);
  let eyeY = 50;
  let shape: ReactNode;
  if (body === "body-cube") {
    eyeY = 54;
    shape = (<><path d="M50 18 L82 34 L82 70 L50 86 L18 70 L18 34 Z" fill={d} /><path d="M50 18 L82 34 L50 50 L18 34 Z" fill={c} opacity=".85" /><path d="M18 34 L50 50 L50 86 L18 70 Z" fill={c} /></>);
  } else if (body === "body-octo") {
    eyeY = 44;
    shape = (<><circle cx="50" cy="44" r="28" fill={c} />{[22, 34, 46, 58, 70].map((x) => <path key={x} d={`M${x} 62 q4 18 ${x < 50 ? -6 : 6} 24`} stroke={c} strokeWidth="7" strokeLinecap="round" fill="none" />)}</>);
  } else if (body === "body-dragon") {
    eyeY = 50;
    shape = (<><path d="M24 30 l6 -12 l6 10 M64 28 l6 -10 l6 12" stroke={d} strokeWidth="5" strokeLinecap="round" fill="none" /><ellipse cx="50" cy="56" rx="30" ry="28" fill={c} /><path d="M30 34 l4 -8 l6 6 l6 -8 l6 8 l6 -8 l6 6 l4 -6" fill={d} /><ellipse cx="50" cy="68" rx="12" ry="7" fill={d} opacity=".6" /></>);
  } else if (body === "body-ufo") {
    eyeY = 44;
    shape = (<><path d="M30 50 a20 22 0 0 1 40 0 z" fill="#bae6fd" opacity=".9" /><ellipse cx="50" cy="58" rx="40" ry="12" fill={c} /><ellipse cx="50" cy="55" rx="40" ry="8" fill={d} />{[24, 42, 58, 76].map((x) => <circle key={x} cx={x} cy="61" r="3" fill="#fde047" />)}</>);
  } else if (body === "body-initials") {
    // a clean badge with your initials: no character, no hat or tool
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" fill={c} />
        <path d="M50 12 L83 31 L83 69 L50 88 L17 69 L17 31 Z" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
        <text x="50" y="62" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="32" fill="#fff">{(initials || "?").slice(0, 2).toUpperCase()}</text>
      </svg>
    );
  } else if (body === "body-pixel") {
    eyeY = -100; // pixel face draws its own eyes
    const px = [[3, 1], [4, 1], [5, 1], [6, 1], [2, 2], [7, 2], [2, 3], [7, 3], [2, 4], [7, 4], [2, 5], [7, 5], [3, 6], [4, 6], [5, 6], [6, 6]];
    shape = (<><rect x="26" y="26" width="48" height="48" fill={c} />{px.map(([x, y]) => <rect key={`${x}-${y}`} x={18 + x * 8} y={18 + y * 8} width="8" height="8" fill={d} />)}<rect x="38" y="42" width="8" height="8" fill="#fff" /><rect x="58" y="42" width="8" height="8" fill="#fff" /><rect x="42" y="58" width="20" height="4" fill={d} /></>);
  } else if (body === "body-visor") {
    eyeY = -100; // the visor hides the eyes
    shape = (<><path d="M22 58 a28 30 0 0 1 56 0 v10 a8 8 0 0 1 -8 8 h-40 a8 8 0 0 1 -8 -8 z" fill={c} /><path d="M28 46 h44 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 v-6 a6 6 0 0 1 6 -6 z" fill="#0f172a" /><path d="M32 50 h20" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" /><rect x="40" y="76" width="20" height="10" rx="3" fill={d} /></>);
  } else {
    shape = (<><line x1="50" y1="14" x2="50" y2="24" stroke={d} strokeWidth="4" /><circle cx="50" cy="12" r="5" fill="var(--accent, #c2410c)" /><rect x="24" y="24" width="52" height="44" rx="12" fill={c} /><rect x="32" y="70" width="36" height="16" rx="5" fill={d} /><rect x="38" y="58" width="24" height="4" rx="2" fill={d} /></>);
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="50" cy="50" r="49" fill="var(--surface-2, #eef2f7)" />
      {shape}
      {eyeY > 0 && eyes(eyeY)}
      {hat === "hat-goggles" && <><rect x="26" y={eyeY - 9} width="48" height="18" rx="9" fill="none" stroke="#f59e0b" strokeWidth="4" /><circle cx="40" cy={eyeY} r="7" fill="#fde68a" opacity=".55" /><circle cx="60" cy={eyeY} r="7" fill="#fde68a" opacity=".55" /></>}
      {hat === "hat-headphones" && <><path d={`M22 ${eyeY} a28 28 0 0 1 56 0`} stroke="#0f172a" strokeWidth="5" fill="none" /><rect x="15" y={eyeY - 6} width="12" height="18" rx="5" fill="#ef4444" /><rect x="73" y={eyeY - 6} width="12" height="18" rx="5" fill="#ef4444" /></>}
      {hat === "hat-wizard" && <><path d="M30 26 L50 -4 L70 26 Z" fill="#4338ca" /><rect x="26" y="24" width="48" height="6" rx="3" fill="#312e81" /><circle cx="50" cy="12" r="2.5" fill="#fde047" /><circle cx="56" cy="20" r="1.8" fill="#fde047" /></>}
      {hat === "hat-crown" && <path d="M30 26 L32 10 L41 19 L50 6 L59 19 L68 10 L70 26 Z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />}
      {tool === "tool-wrench" && <path d="M78 64 l12 12 m-14 -16 a6 6 0 1 0 6 6" stroke="#64748b" strokeWidth="5" strokeLinecap="round" fill="none" />}
      {tool === "tool-calipers" && <><rect x="74" y="56" width="5" height="34" fill="#94a3b8" /><rect x="74" y="56" width="16" height="5" fill="#94a3b8" /><rect x="74" y="70" width="14" height="5" fill="#64748b" /></>}
      {tool === "tool-spool" && <><circle cx="82" cy="74" r="12" fill="#22c55e" /><circle cx="82" cy="74" r="4" fill="#f8fafc" /><circle cx="82" cy="74" r="12" fill="none" stroke="#166534" strokeWidth="2" /></>}
      {tool === "tool-trophy" && <><path d="M74 62 h16 v6 a8 8 0 0 1 -16 0 z" fill="#facc15" /><rect x="80" y="76" width="4" height="6" fill="#facc15" /><rect x="76" y="82" width="12" height="4" rx="1" fill="#a16207" /></>}
    </svg>
  );
}

const TABS = [
  { id: "avatar", label: "Avatar" }, { id: "title", label: "Titles" }, { id: "celebration", label: "Celebrations" },
  { id: "look", label: "Looks" }, { id: "rewards", label: "Class rewards" },
] as const;

export function XpStore({ store, apiUrl, onChange, initials = "" }: { store: Store; apiUrl: string; onChange: () => void; initials?: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("avatar");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<{ id: string; n: number } | null>(null);
  const owned = new Set(store.owned ?? store.ownedLooks);
  const eq = store.equipped ?? { look: store.activeLook };
  const price = (id: string) => store.prices?.[id] ?? 0;

  useEffect(() => {
    const look = (eq.look ?? "blueprint") as SkinId;
    if (SKINS.some((s) => s.id === look)) applySkin(look);
  }, [eq.look]);

  const act = async (action: "buyItem" | "equipItem" | "requestReward", args: Record<string, unknown>, done: string) => {
    setBusy(String(args.itemId ?? args.rewardId));
    const r = await call(apiUrl, action, args);
    setBusy(null);
    setMsg(r.ok ? done : r.error);
    if (r.ok) onChange();
  };

  const card = (id: string, picture: ReactNode, extra?: ReactNode) => {
    const has = owned.has(id);
    const slot = ITEMS.find((x) => x.id === id)?.slot ?? "look";
    const on = eq[slot] === id;
    const cost = price(id);
    return (
      <li key={id} className={cn("flex flex-col items-center rounded-2xl border-2 p-2 text-center text-xs font-semibold", on ? "border-primary bg-primary-soft" : "border-border")}>
        {picture}
        <span className="mt-1 leading-tight">{itemName(id)}</span>
        {extra}
        {!has && store.earn?.[id] ? (
          <span className="mt-1 w-full rounded-lg bg-surface-2 px-2 py-1 text-muted"><Lock className="mr-1 inline size-3" aria-hidden />{tr("Finish {mission}", { mission: lessonFor(store.earn[id])?.title ?? store.earn[id] })}</span>
        ) : has ? (
          <button disabled={on || busy === id} onClick={() => void act("equipItem", { itemId: id }, tr("Done! You're using {name}.", { name: itemName(id) }))} className={cn("mt-1 w-full rounded-lg px-2 py-1", on ? "text-primary" : "border border-border hover:bg-surface-2")}>
            {on ? <><Check className="mr-1 inline size-3" aria-hidden />{tr("Using")}</> : tr("Use")}
          </button>
        ) : (
          <button disabled={store.balance < cost || busy === id} onClick={() => void act("buyItem", { itemId: id }, tr("Bought {name}! Choose Use to put it on.", { name: itemName(id) }))} className="mt-1 w-full rounded-lg bg-primary px-2 py-1 text-primary-fg disabled:opacity-50">
            {store.balance < cost ? <><Lock className="mr-1 inline size-3" aria-hidden />{tr("{xp} XP", { xp: cost })}</> : tr("Buy · {xp} XP", { xp: cost })}
          </button>
        )}
      </li>
    );
  };

  const slotItems = (slot: Slot) => ITEMS.filter((x) => x.slot === slot).map((x) => x.id);

  return (
    <section aria-labelledby="store-h" className="rounded-3xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="store-h" className="flex items-center gap-2 font-display text-xl font-bold"><ShoppingBag className="size-5 text-accent" aria-hidden /> {tr("XP store")}</h2>
        <strong className="ml-auto rounded-full bg-primary-soft px-3 py-1 font-mono text-sm">{tr("{xp} XP to spend", { xp: store.balance })}</strong>
      </div>
      <p className="mt-1 text-sm text-muted">{tr("Spending XP never lowers your total. Reading and accessibility tools are always free.")}</p>

      <div role="tablist" aria-label={tr("Store sections")} className="mt-3 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); setMsg(""); }} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold", tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg")}>
            {tr(t.label)}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4">
        {tab === "avatar" && (
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div className="flex flex-col items-center gap-1 sm:sticky sm:top-20 sm:self-start">
              <Avatar eq={eq} size={128} label={tr("Your avatar")} initials={initials} />
              <p className="font-display font-bold">{itemName(eq.title)}</p>
            </div>
            <div className="space-y-4">
              {(["body", "color", "hat", "tool"] as const).map((slot) => (
                <div key={slot}>
                  <p className="mb-1 text-sm font-bold">{{ body: tr("Character"), color: tr("Color"), hat: tr("Hat"), tool: tr("Holding") }[slot]}</p>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {slotItems(slot).map((id) => card(id, <Avatar eq={{ ...eq, [slot]: id }} size={52} initials={initials} />))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "title" && (
          <>
            <p className="mb-2 text-sm text-muted">{tr("Titles can't be bought — you earn each one by finishing its mission. Your title shows under your name.")}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slotItems("title").map((id) => card(id, <span className="mt-1 rounded-full bg-accent-soft px-2 py-1 font-display text-sm text-accent">★</span>))}
            </ul>
          </>
        )}

        {tab === "celebration" && (
          <>
            <p className="mb-2 text-sm text-muted">{tr("What happens when you finish a mission. Moving effects turn off if you choose Reduce motion.")}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {slotItems("celebration").map((id) => card(id, (
                <button className="relative grid h-16 w-full place-items-center overflow-visible rounded-xl bg-surface-2 text-xs text-primary underline" onClick={() => setPreview({ id, n: (preview?.n ?? 0) + 1 })}>
                  {preview?.id === id && <Celebration key={preview.n} kind={id} />}
                  {preview?.id === id && id === "fx-trophy" ? null : id === "fx-none" ? tr("No animation") : tr("Preview")}
                </button>
              )))}
            </ul>
          </>
        )}

        {tab === "look" && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SKINS.map((s) => card(s.id, <span className="mt-1 size-10 rounded-full" style={{ background: `linear-gradient(135deg, ${s.colors[0]} 50%, ${s.colors[1]} 50%)` }} />))}
          </ul>
        )}

        {tab === "rewards" && (
          <div className="space-y-4">
            {(store.rewards ?? []).length === 0 ? (
              <p className="text-sm text-muted">{tr("Your teacher hasn't added class rewards yet.")}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {(store.rewards ?? []).map((r) => {
                  const waiting = (store.requests ?? []).some((q) => q.rewardId === r.id && q.status === "requested");
                  return (
                    <li key={r.id} className="flex items-start gap-3 rounded-2xl border border-border p-3">
                      <Gift className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{r.name}</p>
                        {r.description && <p className="text-sm text-muted">{r.description}</p>}
                      </div>
                      <button disabled={waiting || store.balance < r.price || busy === r.id} onClick={() => void act("requestReward", { rewardId: r.id }, tr("Request sent! Your teacher will let you know."))} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-fg disabled:opacity-50">
                        {waiting ? tr("Requested") : tr("Ask · {xp} XP", { xp: r.price })}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {(store.requests ?? []).length > 0 && (
              <div>
                <p className="mb-1 text-sm font-bold">{tr("Your requests")}</p>
                <ul className="space-y-1 text-sm">
                  {(store.requests ?? []).map((q) => (
                    <li key={q.id} className="flex flex-wrap gap-x-2">
                      <span className="font-semibold">{q.name}</span>
                      <span className={cn(q.status === "declined" ? "text-danger" : q.status === "requested" ? "text-muted" : "text-success")}>
                        {({ requested: tr("waiting for your teacher"), approved: tr("approved!"), given: tr("done — enjoy!"), declined: tr("not this time (XP given back)") } as Record<string, string>)[q.status] ?? q.status}
                      </span>
                      {q.teacherNote && <span className="text-muted">· “{q.teacherNote}”</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <p role="status" className="mt-3 text-sm">{msg}</p>
    </section>
  );
}
