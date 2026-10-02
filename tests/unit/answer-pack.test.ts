import { describe, expect, it } from "vitest";
import { allBlocks, lessons } from "@/content";
import type { LessonBlock } from "@/content/schema";
import { decodePack, encodePack, packable } from "@/lib/answer-pack";
import { redactBlock, scoreBlock, toClientResult, type BlockResponse } from "@/lib/scoring";

/** A plausible (often wrong) response for any scorable block. */
function sampleResponse(b: LessonBlock): BlockResponse | null {
  switch (b.type) {
    case "prediction": return { type: "prediction", optionId: b.options[0].id };
    case "multipleChoice": return { type: "multipleChoice", optionIds: [b.options[0].id] };
    case "ordering": return { type: "ordering", order: [...b.items].reverse().map((i) => i.id) };
    case "matching": return { type: "matching", pairs: Object.fromEntries(b.pairs.map((p) => [p.id, p.id])) };
    case "hotspot": return { type: "hotspot", point: b.hotspots[0].position };
    case "measurement": return { type: "measurement", value: b.answer + 1 };
    case "slider": return { type: "slider", value: b.min };
    default: return null;
  }
}

describe("instant feedback packs", () => {
  const blocks = lessons.flatMap((l) => allBlocks(l));
  it("never pack skill checks", () => {
    for (const b of blocks) if ("check" in b && b.check === "skill") expect(packable(b), b.id).toBe(false);
  });
  it("round-trip, keep answers out of plain text, and score exactly like the server", () => {
    let n = 0;
    for (const b of blocks.filter(packable)) {
      const pub = { ...redactBlock(b), k: encodePack(b) } as unknown as LessonBlock;
      const decoded = decodePack(pub)!;
      expect(decoded).toEqual(b);
      if ("explanation" in b && b.explanation.length > 20) expect(JSON.stringify(pub)).not.toContain(b.explanation);
      const r = sampleResponse(b);
      if (!r) continue;
      for (const attempts of [1, 3]) expect(toClientResult(decoded, scoreBlock(decoded, r), attempts)).toEqual(toClientResult(b, scoreBlock(b, r), attempts));
      n++;
    }
    expect(n).toBeGreaterThan(100);
  });
});
