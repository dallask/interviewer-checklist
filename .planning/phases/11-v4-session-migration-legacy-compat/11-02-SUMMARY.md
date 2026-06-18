---
phase: 11-v4-session-migration-legacy-compat
plan: "02"
subsystem: storage,store,ui
tags: [valibot, migration, zustand, react, bootstrap, typescript, vitest]

# Dependency graph
requires:
  - phase: 11-01
    provides: V4SessionSchema, V4Session, createDefaultV4Session, migrateV3ToV4
  - phase: storage-types
    provides: V2Manifest, V3SessionSchema, V2SessionSchema, bootstrapDefaults
provides:
  - bootstrap() updated: returns { manifest, sessions: Record<string, V4Session>, failedSessionIds: string[] }
  - V3→V4 eager migration loop in bootstrap.ts (pre-migration snapshot D-05, skip-and-continue D-06, Pitfall 3 guard)
  - AppState.sections: V4Section[] populated from bootstrap hydration and switchSession
  - AppState.migrationFailedCount, AppState.migrationFailedIds for MigrationErrorBanner
  - Subscribe block writes version:4 + sections field (V4Session persistence)
  - MigrationErrorBanner component (amber sticky banner, renders null when no failures)
  - main.tsx hydrates sections and migrationFailed* from bootstrap result
  - App.tsx mounts MigrationErrorBanner above UpdateBanner; markedTopicIds uses V4 key format
affects:
  - 11-03 (yamlImport.ts — no store changes needed; YAML path unchanged in this plan)
  - Phase 12+ (all downstream UI can now read session.sections from V4Session)
  - Phase 14 (BANK-01..05 — sections field in subscribe block enables user-editable sections)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - V3→V4 eager migration loop pattern (pre-migration snapshot + skip-and-continue)
    - chrome.storage.local direct write for pre-migration snapshot (bypass adapter.snapshot)
    - Pitfall 3 guard: safeParse(V4SessionSchema) before safeParse(V3SessionSchema)
    - MigrationErrorBanner mirrors UpdateBanner sticky amber pattern exactly
    - V4 score key format in markedTopicIds: ${topicId}-q${i} (D-04)

key-files:
  created:
    - src/components/MigrationErrorBanner.tsx
  modified:
    - src/storage/bootstrap.ts
    - src/storage/bootstrap.test.ts
    - src/store/app.ts
    - src/store/app.test.ts
    - src/app/main.tsx
    - src/app/App.tsx

key-decisions:
  - "bootstrap() now returns failedSessionIds:string[] — sessions that fail V3→V4 migration are excluded from returned sessions map; their V3 blob is preserved in storage"
  - "Pre-migration snapshot written via direct chrome.storage.local.set (NOT storageAdapter or adapter.snapshot) to avoid #trimSnapshots side-effect (Pitfall 5)"
  - "V4 guard fires before V3 guard in the session loop — prevents double-migration of already-V4 sessions (Pitfall 3)"
  - "V1→V2 migration path returns createDefaultV4Session instead of the V2 session (V2 was never returned to callers in a usable form anyway)"
  - "markedTopicIds in App.tsx now uses ${topicId}-q${i} key format (D-04) to match V4 score keys"
  - "UndoBuffer.sessionData changed from V3Session to V4Session — matches the actual type flowing through delete/undo paths"

requirements-completed: [DATA-01]

# Metrics
duration: 6min
completed: 2026-06-18
---

# Phase 11 Plan 02: Bootstrap V4 Migration & Store Wiring Summary

**V3→V4 eager migration loop in bootstrap() with pre-migration snapshot (D-05), skip-and-continue (D-06), and double-migration guard — AppState wired with V4Session fields, MigrationErrorBanner mounted above UpdateBanner**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-18T08:22:31Z
- **Completed:** 2026-06-18T08:29:04Z
- **Tasks:** 2 of 2
- **Files modified:** 7 (6 modified, 1 created)

## Accomplishments

- bootstrap() return type updated to `{ manifest: V2Manifest; sessions: Record<string, V4Session>; failedSessionIds: string[] }`
- V3→V4 migration loop: validates V4 first (Pitfall 3 guard), then V3 (writes pre-v4 snapshot via direct chrome.storage.local.set per D-05), then V2 fallback, then corrupt default
- Failed sessions push to failedSessionIds and are excluded from the returned sessions map; V3 blob preserved in storage unchanged (D-06)
- bootstrapDefaults() now creates V4 sessions via createDefaultV4Session()
- AppState interface: added sections:V4Section[], migrationFailedCount:number, migrationFailedIds:string[]
- Subscribe block: writes version:4 with sections field (V4Session persistence)
- switchSession: reads V4Session, populates sections in the atomic set() call
- createSession/duplicateSession/deleteSession: all updated to V4Session type
- UndoBuffer.sessionData: changed from V3Session to V4Session
- MigrationErrorBanner.tsx: new amber sticky banner (exact Tailwind classes from UpdateBanner), renders null when failedCount===0
- main.tsx: updated V3Session→V4Session cast, added sections hydration, added migrationFailed* hydration
- App.tsx: imported MigrationErrorBanner, added selectors, mounted above UpdateBanner; markedTopicIds uses V4 key format (${topicId}-q${i})
- Test suite: 558/558 passing (553 pre-existing + 5 new bootstrap Scenario E tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor bootstrap.ts with V3→V4 eager migration loop** - `f0dd99e` (feat)
2. **Task 2: Update store, create MigrationErrorBanner, wire main.tsx and App.tsx** - `f9501d7` (feat)

## Files Created/Modified

- `src/storage/bootstrap.ts` — V4 migration loop; updated return type; bootstrapDefaults() creates V4 sessions
- `src/storage/bootstrap.test.ts` — Updated Scenarios A-D for V4 return shape; added Scenario E (18 tests total)
- `src/store/app.ts` — AppState.sections/migrationFailedCount/migrationFailedIds; V4Session refs throughout; subscribe writes version:4
- `src/store/app.test.ts` — makeSession() updated to V4 (version:4, sections:[])
- `src/components/MigrationErrorBanner.tsx` (NEW) — Amber sticky banner, renders null when failedCount===0
- `src/app/main.tsx` — V4Session cast; sections+migrationFailed* hydration
- `src/app/App.tsx` — MigrationErrorBanner import+mount above UpdateBanner; V4 score key in markedTopicIds

## Decisions Made

- bootstrap() returns failedSessionIds:string[] — failed sessions excluded from returned map; V3 blob preserved
- Pre-migration snapshot uses direct chrome.storage.local.set (NOT adapter.snapshot — avoids #trimSnapshots)
- V4 guard fires before V3 guard — prevents double-migration of already-V4 sessions
- markedTopicIds key format updated from ${topicId}-${i} to ${topicId}-q${i} (D-04 stable IDs)
- UndoBuffer.sessionData type updated to V4Session — matches actual runtime types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated app.test.ts makeSession() to return V4Session after UndoBuffer type change**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** `app.test.ts` had a `makeSession()` helper returning `{ version: 3, ... }` used in `setUndoBuffer` tests. After changing `UndoBuffer.sessionData` from `V3Session` to `V4Session`, the TypeScript compiler flagged these call sites as type errors.
- **Fix:** Updated `makeSession()` to return `{ version: 4 as const, sections: [], ... }` — all behavioral assertions remain intact (the tests check IDs, scores, and metadata, not the version field specifically).
- **Files modified:** `src/store/app.test.ts`
- **Verification:** 558/558 tests pass after fix
- **Committed in:** `f9501d7` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Minor — app.test.ts fixture type fix required by the V3Session→V4Session type change in UndoBuffer. No scope creep.

## Issues Encountered

**Pre-existing TypeScript errors (out of scope, not fixed):**
- `src/background/index.test.ts` — pre-existing TS errors unrelated to this plan (vitest-chrome type incompatibilities)
- `src/storage/migrations/fixtures/v3-session-fixture.ts` — customQuestions.level type narrowing issue (introduced by Plan 01, out of scope for Plan 02)

These errors do not affect runtime behavior or test execution — all 558 tests pass.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all exported functions are fully implemented.

- `MigrationErrorBanner` renders null for `failedCount === 0` — this is correct behavior, not a stub.
- `sections: []` in `createDefaultV4Session()` is intentional — sections are populated only by migration (D-02 decision from Plan 01).

## Threat Surface Scan

Threats T-11-03 and T-11-04 from the plan's threat model are mitigated:
- T-11-03: v.safeParse(V3SessionSchema) validates before migrateV3ToV4 is called; invalid blobs skip migration without crashing
- T-11-04: subscribe only writes when activeSessionId is non-empty (existing guard preserved)
- T-11-05: MigrationErrorBanner shows only failed session count and key format pattern; no PII exposed

No new threat surface introduced beyond what was in the plan's threat model.

## Next Phase Readiness

- Plan 03 (yamlImport reKeyImportResultToV4) can proceed — V4Session types and remapScoreKeys pattern are in place
- Phase 12+ UI changes can read session.sections from AppState
- 558/558 tests passing; no regressions introduced

---
*Phase: 11-v4-session-migration-legacy-compat*
*Completed: 2026-06-18*
