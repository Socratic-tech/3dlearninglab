import "server-only";
import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "./errors";

/** Use in pages: hides forbidden resources behind a 404 (doesn't reveal that they exist). */
export async function guard<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }
}
