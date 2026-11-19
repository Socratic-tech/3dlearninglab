// @vitest-environment jsdom
/** The teacher dashboard's "What's new" card: shown once to returning teachers, remembered, silent for new ones. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WhatsNew } from "../../web/src/pages/WhatsNew";

const API = "https://script.google.com/macros/s/AKfy123/exec";
const me = (role: string, email = "t@school.org") => ({ user: { email, name: "T", role } }) as never;

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("What's new card", () => {
  it("shows a returning teacher the changes, then hides after Got it and stays hidden on a reload", () => {
    render(<WhatsNew me={me("teacher", "first@school.org")} apiUrl={API} />);
    expect(screen.getByRole("heading", { name: /what's new/i })).toBeTruthy();
    expect(screen.getByText(/school print queue/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /open the print queue/i }).getAttribute("href")).toBe("#/queue/manage");
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(screen.queryByRole("heading", { name: /what's new/i })).toBeNull();
    cleanup();
    render(<WhatsNew me={me("teacher", "first@school.org")} apiUrl={API} />);
    expect(screen.queryByRole("heading", { name: /what's new/i })).toBeNull();
  });

  it("remembers per teacher, so a co-teacher on the same computer still sees it", () => {
    render(<WhatsNew me={me("teacher", "second@school.org")} apiUrl={API} />);
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    cleanup();
    render(<WhatsNew me={me("teacher", "third@school.org")} apiUrl={API} />);
    expect(screen.getByRole("heading", { name: /what's new/i })).toBeTruthy();
  });

  it("says nothing to a teacher who just did the setup on this device, to students, or in Try-It mode", () => {
    localStorage.setItem("academy.setupStepsDone.queue", "[1,2,3]");
    render(<WhatsNew me={me("teacher", "fourth@school.org")} apiUrl={API} />);
    expect(screen.queryByRole("heading", { name: /what's new/i })).toBeNull();
    cleanup();
    localStorage.clear();
    render(<WhatsNew me={me("student")} apiUrl={API} />);
    expect(screen.queryByRole("heading", { name: /what's new/i })).toBeNull();
    cleanup();
    render(<WhatsNew me={me("teacher", "fourth@school.org")} apiUrl="local:device" />);
    expect(screen.queryByRole("heading", { name: /what's new/i })).toBeNull();
  });
});
