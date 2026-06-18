---
phase: 14-editable-bank-yaml-schema-expansion
plan: "03"
subsystem: yaml-io
tags: [yaml, export, import, v4-session, schema-v2, bank-delta, typescript]

# Dependency graph
requires:
  - phase: 14-editable-bank-yaml-schema-expansion
    plan: "01"
    provides: V4Session type + ImportResult extended fields + materializeSections export
provides:
  - exportSession(V4Session, sessionName) with schemaVersion 2 + bank block (YAML-04/YAML-06)
  - parseStructural bank delta extraction: removedDefaultQuestionIds + sections from bank block
  - materializeSections exported from v3-to-v4.ts for import-side use
  - 12 new YAML export/import tests covering V4Session, bank block, YAML-05/06 behaviors
affects:
  - 14-04-bank-ui-components
  - 14-05-integration-tests

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "V4Session YAML export: sections derived from session.sections (not DEFAULT_SECTIONS arg)"
    - "Bank block: emitted only when removedQuestionIds.length > 0 OR addedSections.length > 0"
    - "Bank import: schemaVersion >= 2 guard; addedSections collision check against default IDs"
    - "Score key CRITICAL: original index within topic.questions used for score key (not filtered position)"

key-files:
  created: []
  modified:
    - src/utils/yamlExport.ts
    - src/utils/yamlImport.ts
    - src/storage/migrations/v3-to-v4.ts
    - src/components/ActionsGroup.tsx
    - src/utils/yamlExport.test.ts
    - src/utils/yamlImport.test.ts

key-decisions:
  - "materializeSections exported from v3-to-v4.ts (not re-inlined) to share canonical V4Section materialization"
  - "YAML-05 note fix was already present in yamlImport.ts from Plan 01 — added YAML-05 comment for clarity"
  - "Score key uses original topic.questions index (not filtered position) — essential for V4 key scheme"
  - "ActionsGroup builds V4Session inline from store selectors; sections/removedDefaultQuestionIds added"
  - "bank block absent in v1 YAML: result.sections and removedDefaultQuestionIds remain undefined (safe default)"

# Metrics
duration: 6min
completed: 2026-06-18
---

# Phase 14 Plan 03: YAML Schema v2 Import/Export Summary

**YAML schema v2: exportSession migrated to V4Session with schemaVersion 2, text/level on default questions, and bank delta block; parseStructural extended to extract bank delta for round-trip import**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-18T15:15:00Z
- **Completed:** 2026-06-18T15:20:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

### Task 1: Rewrite exportSession for V4Session (YAML-04 + YAML-06 export side)

- Rewrote `exportSession` to accept `(session: V4Session, sessionName: string)` — removed V3Session and `sections[]` arguments
- `meta.schemaVersion` bumped to 2
- Sections built from `session.sections` (not a separate parameter)
- Default questions now include `text` and `level` fields alongside `index`, `score`, `note` (YAML-04)
- Questions in `session.removedDefaultQuestionIds` are filtered out of the sections output
- Custom question notes exported via `session.notes[cq.id]` (already present, now preserved in round-trip)
- `bank` block emitted when `removedQuestionIds.length > 0` OR `addedSections.length > 0` (YAML-06); omitted for clean sessions
- Score key CRITICAL: original `index` within `topic.questions` used for score key (not filtered position)
- Exported `materializeSections` from `v3-to-v4.ts` for import-side use
- Updated `ActionsGroup.tsx` to read `sections` + `removedDefaultQuestionIds` from store and construct V4Session for export (2-arg call)
- Updated `yamlExport.test.ts` to use V4Session; added 6 new tests for schemaVersion 2, bank block, text/level fields, removed question filtering
- Fixed round-trip test in `yamlImport.test.ts` that used old V3Session + 3-arg `exportSession`

### Task 2: Extend ImportResult + fix YAML-05 note + parse bank delta (YAML-05 + YAML-06 import side)

- Verified `ImportResult.sections?` and `ImportResult.removedDefaultQuestionIds?` already present (Plan 01)
- Added imports: `DEFAULT_SECTIONS` from bank index, `materializeSections` from `v3-to-v4.ts`
- Added YAML-05 comment on existing `result.notes[newId] = cq.note` custom question note write
- Added bank delta extraction block in `parseStructural` (at end, before `return`):
  - Reads `meta.schemaVersion`; skips if < 2 or `bank` is absent (v1 YAML compat)
  - `removedDefaultQuestionIds`: extracted as validated `string[]` from `bank.removedQuestionIds`
  - `addedSections`: materializes DEFAULT_SECTIONS, builds ID deny-set, skips colliding IDs (T-14-04 mitigation)
  - `result.sections` = materialized defaults + validated added sections
- Added 6 bank delta tests covering: v1 compat, v2 no-bank, removedQuestionIds, addedSections, ID collision (T-14-04), YAML-05 note

## Task Commits

1. **Task 1: Rewrite exportSession for V4Session** - `2d69570` (feat)
2. **Task 2: Extend parseStructural with bank delta extraction** - `3260d1c` (feat)

## Files Created/Modified

- `src/utils/yamlExport.ts` — Complete rewrite: V4Session, schemaVersion 2, text/level on questions, bank block
- `src/utils/yamlImport.ts` — Added imports, YAML-05 comment, bank delta extraction in parseStructural
- `src/storage/migrations/v3-to-v4.ts` — Exported `materializeSections` (was private function)
- `src/components/ActionsGroup.tsx` — Updated to read sections/removedDefaultQuestionIds from store; V4Session export call
- `src/utils/yamlExport.test.ts` — Rewritten to V4Session; 6 new tests for schema v2 + bank block
- `src/utils/yamlImport.test.ts` — Fixed round-trip test; 6 new bank delta tests

## Decisions Made

- `materializeSections` exported from `v3-to-v4.ts` rather than re-inlined, to share the single canonical conversion logic
- YAML-05 note import fix was already present in `yamlImport.ts` from Plan 01 (line 471); only added the explanatory comment
- Score key uses the **original** `index` within `topic.questions` (not the filtered position after removal exclusion) — this preserves V4 score key scheme `${topicId}-q${index}`
- `bank` block is conditionally omitted for clean sessions (no deltas), keeping v1 compatibility for pure scoring exports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed round-trip test in yamlImport.test.ts using old V3Session API**
- **Found during:** Task 1 (test run after rewriting exportSession)
- **Issue:** `parseStructural` round-trip test in `yamlImport.test.ts` called `exportSession(session, 'Test Session', DEFAULT_SECTIONS)` with V3Session. After the API change this caused `TypeError: Cannot read properties of undefined (reading 'map')` because V3Session has no `sections` field.
- **Fix:** Updated the test to use `V4Session` with `DEFAULT_V4_SECTIONS` (materialized); removed the 3rd `DEFAULT_SECTIONS` argument from the `exportSession` call
- **Files modified:** `src/utils/yamlImport.test.ts`
- **Committed in:** `2d69570` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test broke due to correct API change)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Known Stubs

None — all fields are fully wired. The bank delta extraction is functional: both export and import sides handle removedQuestionIds and addedSections.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced beyond what the plan's threat model covers. T-14-04 mitigation (addedSections ID collision check) is implemented.

## Self-Check: PASSED

**Files exist:**
- `src/utils/yamlExport.ts` — FOUND
- `src/utils/yamlImport.ts` — FOUND
- `src/storage/migrations/v3-to-v4.ts` — FOUND (materializeSections exported)
- `src/components/ActionsGroup.tsx` — FOUND (2-arg exportSession call)
- `src/utils/yamlExport.test.ts` — FOUND (V4Session tests)
- `src/utils/yamlImport.test.ts` — FOUND (bank delta tests)

**Commits exist:**
- `2d69570` — feat(14-03): rewrite exportSession for V4Session
- `3260d1c` — feat(14-03): extend parseStructural with bank delta extraction

**Test count:** 618 tests passing (was 606 before this plan; +12 new tests)

---
*Phase: 14-editable-bank-yaml-schema-expansion*
*Completed: 2026-06-18*
