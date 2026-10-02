import type { Metadata } from "next";
import { modelAssets } from "@/content";

export const metadata: Metadata = { title: "Attributions" };

export default function Attributions() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Attributions</h1>
      <p className="mt-2 text-muted">Generated from the model asset registry. Original course models were created for 3D Design Academy and are generated from editable source in the repository.</p>
      <ul className="mt-6 divide-y divide-border">
        {modelAssets.map((a) => (
          <li key={a.id} className="py-3">
            <p className="font-semibold">{a.title}</p>
            <p className="text-sm">{a.attributionText}</p>
            <p className="text-xs text-muted">Creator: {a.creator} · Source: {a.sourcePage ? <a className="underline" href={a.sourcePage} target="_blank" rel="noopener noreferrer">{a.sourcePlatform}</a> : a.sourcePlatform} · License: {a.license}{a.licenseVersion ? ` ${a.licenseVersion}` : ""} · {a.sourceVerifiedAt ? `checked ${a.sourceVerifiedAt}` : "not bundled — license pending verification"}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-xl font-bold">Fonts</h2>
      <p className="text-sm">Atkinson Hyperlegible (Braille Institute), Space Grotesk (Florian Karsten), JetBrains Mono (JetBrains) — SIL Open Font License 1.1.</p>
    </div>
  );
}
