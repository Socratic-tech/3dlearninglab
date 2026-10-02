// Bundled by scripts/build-apps-script.ts into apps-script/dist/Lib.js (global `Lib`).
// The same scoring and mastery rules as the Next.js edition — one source of truth.
export { scoreBlock, toClientResult, isScorable } from "../src/lib/scoring";
export { autoLevel, levelFromRating, maxLevel, rank, effectiveLevel, LEVELS } from "../src/lib/mastery";
export { computeStats, applyEvents, statsFromSummary, emptySummary, dayKey, XP, DAILY_GOAL } from "../src/lib/streaks";
