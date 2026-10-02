import type { ClientResult } from "@/lib/scoring";

/** Saved state of one block for one student (stored as JSON by either backend). */
export type BlockEntry = {
  response?: unknown;
  correct?: boolean;
  attempts?: number;
  done?: boolean;
  result?: ClientResult;
  updatedAt?: string;
};
