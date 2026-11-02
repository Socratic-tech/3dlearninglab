/** Browser entry: plan, draw and download slide decks. Loaded on demand (pptxgenjs is large). */
import { FLAVOR } from "@/content/flavor";
import { planDeck, type DeckInput } from "./plan";
import { deckFileName, renderDeck } from "./render";
import { diagramPng } from "./diagram-png";

/** One lesson's deck as a .pptx file. */
export async function buildDeck(input: Omit<DeckInput, "hook">): Promise<{ name: string; blob: Blob }> {
  const slides = planDeck({ ...input, hook: FLAVOR[input.lesson.id]?.hook });
  const pptx = await renderDeck(slides, { title: input.lesson.title, rasterize: diagramPng });
  const blob = (await pptx.write({ outputType: "blob" })) as Blob;
  return { name: deckFileName(input.lesson.title), blob };
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadDeck(input: Omit<DeckInput, "hook">): Promise<string> {
  const { name, blob } = await buildDeck(input);
  saveBlob(blob, name);
  return name;
}
