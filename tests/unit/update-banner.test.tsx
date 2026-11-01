// @vitest-environment jsdom
/** The teacher dashboard's "Update available" banner: Later is remembered for that version, not just this visit. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UpdateBanner } from "../../web/src/pages/UpdateBanner";

const API = "https://script.google.com/macros/s/AKfy123/exec";
const teacher = (version: string) => ({ user: { email: "t@school.org", name: "T", role: "teacher" }, app: { version, owner: "t@school.org", autoUpdates: true, safeUpdates: true, previous: null } }) as never;

function publish(version: string) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ version, notes: "Fixes" }) })));
}
async function show(installed: string) {
  render(<UpdateBanner me={teacher(installed)} apiUrl={API} onUpdated={() => {}} />);
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Update banner", () => {
  it("shows when the website has a newer version, and not when the Sheet is current", async () => {
    publish("v2");
    await show("v1");
    expect(screen.getByText("Update available")).toBeTruthy();
    cleanup();
    await show("v2");
    expect(screen.queryByText("Update available")).toBeNull();
  });

  it("Later hides it on later visits until a newer version is published", async () => {
    publish("v2");
    await show("v1");
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(screen.queryByText("Update available")).toBeNull();
    cleanup();
    await show("v1"); // next visit, same version: stays hidden
    expect(screen.queryByText("Update available")).toBeNull();
    cleanup();
    publish("v3"); // a newer version: asks again
    await show("v1");
    expect(screen.getByText("Update available")).toBeTruthy();
  });
});
