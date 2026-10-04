/** The Pages site's runtime config: class links must work even when the browser blocks storage. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const EXEC = "https://script.google.com/macros/s/AKfy123/exec";

function stubBrowser(search: string, storage: "ok" | "blocked") {
  const store = new Map<string, string>();
  const loc = { search, pathname: "/3dlearninglab/", hash: "#/teacher", origin: "https://socratic-tech.github.io" };
  vi.stubGlobal("location", loc);
  vi.stubGlobal("history", { replaceState: (_s: unknown, _t: string, url: string) => { loc.search = url.includes("?") ? url.slice(url.indexOf("?")) : ""; } });
  const blocked = () => { throw new DOMException("denied", "SecurityError"); };
  vi.stubGlobal("localStorage", storage === "ok"
    ? { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
    : { getItem: blocked, setItem: blocked });
  return { store, loc };
}

async function freshConfig() {
  vi.resetModules();
  return import("../../web/src/config");
}

beforeEach(() => vi.unstubAllGlobals());

describe("web config", () => {
  it("remembers the app address from a class link", async () => {
    const { store, loc } = stubBrowser("?api=" + encodeURIComponent(EXEC) + "&class=p2", "ok");
    const c = await freshConfig();
    expect(c.readConfig().apiUrl).toBe(EXEC);
    expect(store.get("academy.api")).toBe(EXEC);
    expect(loc.search).toBe(""); // stripped from the address bar
    expect(c.readConfig().apiUrl).toBe(EXEC); // still known after the strip
    expect(c.currentClassId()).toBe("p2");
  });

  it("still works when the browser blocks storage (managed Chromebooks, private windows)", async () => {
    const { loc } = stubBrowser("?api=" + encodeURIComponent(EXEC) + "&class=p2", "blocked");
    const c = await freshConfig();
    expect(c.readConfig().apiUrl).toBe(EXEC);
    expect(loc.search).toContain("api="); // left in the address bar so a refresh or bookmark keeps working
    expect(c.readConfig().apiUrl).toBe(EXEC); // second read after the URL was stripped (e.g. after Connect / re-render)
    expect(c.currentClassId()).toBe("p2");
    c.setCurrentClassId("p5");
    expect(c.currentClassId()).toBe("p5");
  });

  it("the manual Connect box works with blocked storage too", async () => {
    stubBrowser("", "blocked");
    const c = await freshConfig();
    expect(c.readConfig().apiUrl).toBeNull();
    expect(c.setApiUrl("  https://script.google.com/a/macros/school.org/s/AKfy123/exec  ")).toBe(true);
    expect(c.readConfig().apiUrl).toBe(EXEC);
  });

  it("accepts every shape Google gives the web-app address, and nothing else", async () => {
    const { normalizeApiUrl } = await freshConfig();
    for (const u of [
      EXEC,
      "https://script.google.com/a/macros/school.org/s/AKfy123/exec",
      "https://script.google.com/macros/u/1/s/AKfy123/exec",
      "https://script.google.com/a/macros/school.org/u/0/s/AKfy123/exec",
      EXEC + "/",
      " " + EXEC + "?usp=sharing",
    ]) expect(normalizeApiUrl(u)).toBe(EXEC);
    for (const u of ["https://script.google.com/macros/s/AKfy123/dev", "https://evil.example/macros/s/AKfy123/exec", "http://script.google.com/macros/s/AKfy123/exec", ""]) {
      expect(normalizeApiUrl(u)).toBeNull();
    }
  });
});
