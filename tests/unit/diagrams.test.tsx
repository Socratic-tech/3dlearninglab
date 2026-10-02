import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Diagram, diagramComponents } from "@/components/diagrams";
import { diagramCatalog, diagramNames } from "@/content/diagram-catalog";

describe("diagram library", () => {
  it("has a component for every catalog name (and nothing extra)", () => {
    expect(Object.keys(diagramComponents).sort()).toEqual([...diagramNames].sort());
  });

  it.each(diagramNames)("renders %s as an accessible svg with a title", (name) => {
    const html = renderToStaticMarkup(<Diagram name={name} />);
    expect(html).toContain("<svg");
    expect(html).toContain('role="img"');
    const titleId = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(titleId).toBeTruthy();
    expect(html).toContain(`<title id="${titleId}">`);
    // default title is the catalog description (HTML-escaped)
    const escaped = diagramCatalog[name].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
    expect(html).toContain(`${escaped}</title>`);
    // colours come from CSS variables only
    expect(html).not.toMatch(/(fill|stroke)="(#|rgb|hsl)/);
  });

  it("uses a custom title when given", () => {
    const html = renderToStaticMarkup(<Diagram name="xyz-axes" title="Custom alt" />);
    expect(html).toMatch(/<title id="[^"]+">Custom alt<\/title>/);
  });

  it("renders a fallback box for unknown names instead of throwing", () => {
    const html = renderToStaticMarkup(<Diagram name="not-a-real-diagram" />);
    expect(html).toContain("Diagram unavailable");
    expect(html).not.toContain("<svg");
  });
});
