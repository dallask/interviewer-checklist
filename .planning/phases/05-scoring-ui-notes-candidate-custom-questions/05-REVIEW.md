---
phase: 05-scoring-ui-notes-candidate-custom-questions
reviewed: 2026-06-17T12:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/app/main.tsx
  - src/storage/bootstrap.ts
  - src/storage/bootstrap.test.ts
  - src/store/app.ts
  - src/store/app.test.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 05 (Gap-Closure): Code Review Report

**Reviewed:** 2026-06-17T12:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This is a targeted gap-closure review covering three changes: `resetAll()` now clears filter fields
(CR-02 fix), `bootstrap.ts` Scenario B now tries `V3SessionSchema` before `V2SessionSchema` (CR-03
fix), and a biome line-length formatting fix in `main.tsx`. All three primary fixes are correctly
implemented and verified by tests.

Two new findings were discovered: a stale JSDoc on `resetAll` that contradicts its updated behavior,
and dead I/O in `bootstrap()` where sessions are loaded from storage but never consumed by the sole
production caller (`main.tsx`). No new critical issues were introduced.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `resetAll` JSDoc says "preserves uiState" but the implementation now clears filter fields that are persisted as part of `uiState`

**File:** `src/store/app.ts:95`

**Issue:** The JSDoc comment reads: `"Clear all scoring data for the current session (preserves activeSessionId and uiState)."` After the CR-02 fix landed (`15d915c`), `resetAll` now clears `selectedDifficulties`, `selectedSections`, `searchQuery`, and `hideMarked`. All four of those fields are written to chrome.storage under the `uiState` key by the module-level subscriber (lines 261-264). This means `resetAll` explicitly clears part of `uiState` — directly contradicting the documented promise that uiState is preserved. A reader of the JSDoc will trust the contract and be surprised by the actual behavior.

**Fix:** Update the JSDoc to accurately reflect the post-fix contract:
```ts
/** Clear all scoring data and active filters for the current session (preserves activeSessionId, sidebarOpen, darkMode, and expand/collapse state). */
resetAll: () => void;
```

---

### WR-02: `bootstrap()` loads all session data from storage (lines 123-139) but `main.tsx` — the sole production caller — never reads `initialState.sessions`

**File:** `src/storage/bootstrap.ts:123-139`

**Issue:** The `bootstrap()` function reads all session keys from `chrome.storage.local` and validates
each one with `V3SessionSchema` / `V2SessionSchema` (the Scenario B path). This is wasted I/O:
`main.tsx` is the only non-test caller of `bootstrap()`, and it only reads
`initialState.manifest.activeSessionId` (line 28). It then performs its own independent
`storageAdapter.read([session:${activeSessionId}])` at line 43. The sessions field of the
`bootstrap()` return value is never consumed in production.

Consequences:
- For each session listed in the manifest, two storage reads occur: one inside `bootstrap()` (all
  sessions) and one in `main.tsx` (active session only). On a manifest with 10 sessions, 10
  unnecessary reads are performed.
- The `bootstrap()` return type declares `sessions: Record<string, V2Session>` but the actual
  runtime values can be `V3Session` objects (stored with `as unknown as V2Session`). The declared
  type is a lie that a future caller could act on incorrectly.

**Fix (minimal):** Remove the session-loading block from `bootstrap()` and drop `sessions` from the
return type, since `main.tsx` does not use it:
```ts
// bootstrap.ts — Scenario B return (after removing dead session load)
return { manifest };
```
Update the return type to `Promise<{ manifest: V2Manifest }>`.

**Fix (alternative):** If `sessions` is intentionally kept for future consumers, update the return
type to `Record<string, V2Session | V3Session>` and remove the unsound `as unknown as V2Session`
cast. Add the import:
```ts
import type { V2Manifest, V2Session, V3Session } from './types.js';
// ...
sessions: Record<string, V2Session | V3Session>;
```

---

## Info

### IN-01: `main.tsx` casts raw session data as `V3Session` without schema validation — a V2 session in storage would cause a silent type mismatch

**File:** `src/app/main.tsx:44-46`

**Issue:** The session hydration block in `main.tsx` casts the raw value from storage directly to
`V3Session | undefined` (line 44). If a V2-format session is stored under `session:${id}` (which
is possible for users upgrading from Phase 4 before any Phase 5 save occurs), the cast is a type
lie. In practice the `?? {}` and `?? []` fallbacks guard most V2 fields:

- `session.scores` — V2 has no `scores` field → `undefined ?? {}` → `{}` (safe)
- `session.notes / topicNotes` — same → `{}` (safe)
- `session.customQuestions` — V2 has `customQuestions` as `Record<string, Array<...>>`, which is
  a truthy non-array object. The `?? []` fallback does NOT fire. The store receives an object
  where an array is expected, breaking any downstream `.map()` / `.filter()` on `customQuestions`.
- `session.candidate` — V2 stores `candidate: {}` (truthy). `{} ?? null` keeps `{}`. The store
  receives an empty object where `CandidateDetails | null` is expected; components that render
  `candidate.name` would display an empty string rather than the "no candidate" UI path.

**Fix:** Add a version check or schema validation before reading Phase-5-specific fields:
```ts
const session = sessionRaw[`session:${activeSessionId}`] as
  | V3Session
  | Record<string, unknown>
  | undefined;
if (session && (session as Record<string, unknown>).version === 3) {
  const v3 = session as V3Session;
  useAppStore.setState({
    scores: v3.scores ?? {},
    overrides: v3.overrides ?? {},
    notes: v3.notes ?? {},
    topicNotes: v3.topicNotes ?? {},
    customQuestions: v3.customQuestions ?? [],
    candidate: v3.candidate ?? null,
  });
}
// If version !== 3, leave scoring fields at DEFAULT_STATE values.
// The subscribe callback will write a V3 session on the first user interaction,
// completing the implicit V2→V3 upgrade.
```

Alternatively, import and run `v.safeParse(V3SessionSchema, session)` (valibot is already a
dependency) and guard on `.success` before calling `setState`.

---

_Reviewed: 2026-06-17T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
