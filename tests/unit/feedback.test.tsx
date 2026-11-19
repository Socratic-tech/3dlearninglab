// @vitest-environment jsdom
/** The teacher feedback form: choose feature or bug, write, send; only teachers get the header button. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const calls: { action: string; args: Record<string, unknown> }[] = [];
let reply: { ok: boolean; data?: unknown; error?: string } = { ok: true, data: { sent: true } };
vi.mock("../../web/src/api", () => ({ call: vi.fn(async (_u: string, action: string, args: Record<string, unknown>) => { calls.push({ action, args }); return reply; }) }));

import { FeedbackButton, FeedbackDialog } from "../../web/src/pages/Feedback";

const API = "https://script.google.com/macros/s/AKfy123/exec";
const me = (role: string) => ({ user: { email: "t@school.org", name: "T", role } }) as never;

beforeEach(() => { calls.length = 0; reply = { ok: true, data: { sent: true } }; localStorage.clear(); });
afterEach(cleanup);

describe("Feedback form", () => {
  it("keeps Send off until there is something to say, then sends the chosen kind with page details", async () => {
    render(<FeedbackDialog me={me("teacher")} apiUrl={API} onClose={() => {}} />);
    const send = () => screen.getByRole("button", { name: /send my idea/i }) as HTMLButtonElement;
    expect(send().disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/something isn't working/i));
    fireEvent.change(screen.getByLabelText(/tell me about it/i), { target: { value: "The queue page is blank on my Chromebook" } });
    fireEvent.click(screen.getByRole("button", { name: /send the bug report/i }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/t@school.org/));
    expect(calls).toHaveLength(1);
    expect(calls[0].action).toBe("sendFeedback");
    expect(calls[0].args).toMatchObject({ kind: "bug", message: "The queue page is blank on my Chromebook" });
    expect(Object.keys(calls[0].args.details as object)).toEqual(expect.arrayContaining(["page", "browser", "screen"]));
  });

  it("shows the reason when sending fails and keeps what was typed", async () => {
    reply = { ok: false, error: "Couldn't send that just now. Please try again in a minute." };
    render(<FeedbackDialog me={me("teacher")} apiUrl={API} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/tell me about it/i), { target: { value: "Please add a dark mode" } });
    fireEvent.click(screen.getByRole("button", { name: /send my idea/i }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/try again/i));
    expect((screen.getByLabelText(/tell me about it/i) as HTMLTextAreaElement).value).toBe("Please add a dark mode");
  });

  it("tells teachers what is sent and asks them to leave out student information", () => {
    render(<FeedbackDialog me={me("teacher")} apiUrl={API} onClose={() => {}} />);
    expect(screen.getByText(/student names/i)).toBeTruthy();
    expect(screen.getByText(/your name and email/i)).toBeTruthy();
  });

  it("appears in the header for teachers on a Google class, not for students or in Try-It mode", () => {
    localStorage.setItem("academy.api", API);
    render(<FeedbackButton me={me("teacher")} />);
    expect(screen.getAllByText(/feedback/i).length).toBeGreaterThan(0);
    cleanup();
    render(<FeedbackButton me={me("student")} />);
    expect(screen.queryByText(/feedback/i)).toBeNull();
    cleanup();
    localStorage.setItem("academy.api", "local:device");
    render(<FeedbackButton me={me("teacher")} />);
    expect(screen.queryByText(/feedback/i)).toBeNull();
  });
});
