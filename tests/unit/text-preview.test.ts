/** Long text blocks show a first sentence behind "Tell me more", but steps and lists are never cut short. */
import { describe, expect, it } from "vitest";
import { textPreview } from "@/components/lesson/static-blocks";
import { allBlocks, lessons } from "@/content";

const long = "This sentence starts the explanation and is long enough to count. ".repeat(4).trim();

describe("text block preview", () => {
  it("never shortens numbered steps or bullet lists", () => {
    expect(textPreview("1. Build each piece from real cubes and tape it.\n2. Take the cube apart and hand the pieces to a partner.\n3. Start a timer and do not help them at all, just watch.\n4. Write down the time.")).toBeNull();
    expect(textPreview("- **Week 1 · Paper:** sketch pieces, learn the rules, plan the cube\n- **Week 2 · Tinkercad:** build your pieces in 3D, exactly\n- **Week 3 · Printing:** turn, slice, print, check\n- **Week 4:** box, playtests, ship")).toBeNull();
    expect(textPreview(`Some intro text first.\n\n1. Then a step\n2. And another step\n\n${long}`)).toBeNull();
  });

  it("shortens long prose to its first sentence", () => {
    expect(textPreview(long)).toBe("This sentence starts the explanation and is long enough to count.");
  });

  it("doesn't cut inside decimals or abbreviations", () => {
    const t = "Layers are about 0.2 mm thick, e.g. the default in most slicers for school printers today. " + long;
    expect(textPreview(t)).toBe("Layers are about 0.2 mm thick, e.g. the default in most slicers for school printers today.");
  });

  it("no lesson text block previews as just a number", () => {
    for (const l of lessons)
      for (const b of allBlocks(l))
        if (b.type === "text") {
          const p = textPreview(b.body);
          if (p !== null) expect(words(p), `${l.id}/${b.id}: "${p}"`).toBeGreaterThan(3);
        }
  });
});

const words = (t: string) => t.trim().split(/\s+/).length;
