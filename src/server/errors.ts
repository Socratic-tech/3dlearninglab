/** Errors with a safe, student/teacher-friendly message. Technical details are logged server-side only. */
export class AppError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(userMessage);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: unknown) {
    super("You don't have access to that.", 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(what = "That item") {
    super(`${what} could not be found.`, 404);
  }
}

/** Google / external integration failure. Local work is never lost when these happen. */
export class IntegrationError extends AppError {
  constructor(
    userMessage: string,
    public readonly provider: string,
    details?: unknown,
  ) {
    super(userMessage, 502, details);
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; details?: string };

export function toActionError(e: unknown): { ok: false; error: string; details?: string } {
  if (e instanceof AppError) {
    if (e.status >= 500) console.error("[app-error]", e.userMessage, e.details);
    return {
      ok: false,
      error: e.userMessage,
      details: e instanceof IntegrationError && e.details ? String((e.details as Error)?.message ?? e.details).slice(0, 500) : undefined,
    };
  }
  console.error("[unexpected-error]", e);
  return { ok: false, error: "Something went wrong. Your work is safe — please try again." };
}
