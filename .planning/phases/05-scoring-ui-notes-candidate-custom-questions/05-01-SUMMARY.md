---
phase: 05-scoring-ui-notes-candidate-custom-questions
plan: 01
subsystem: storage
tags: [valibot, zustand, migration, buildFlatRows, typescript]

# Dependency graph
requires:
  - phase: 04-shell-sidebar-read-only-content-tree
    provides: "useAppStore, buildFlatRows, main.tsx hydration, storageAdapter"
  - phase: 03-storage-layer-migration-bootstrap
    provides: "V2SessionSchema, runMigrations pipeline, storageAdapter.read/write, bootstrap()"

provides:
  - "V3SessionSchema, CustomQuestionSchema, CandidateDetailsSchema (valibot) in storage/types.ts"
  - "V3Session, CustomQuestion, CandidateDetails TypeScript types"
  - "createDefaultV3Session factory function"
  - "migrateV2ToV3 pure migration function with fixture-pinned tests"
  - "MIGRATIONS array with fromVersion:2 entry in migrations/index.ts"
  - "ScoringState + ScoringActions (8 actions) in useAppStore with session persistence subscribe handler"
  - "buildFlatRows index bug fixed (original topic.questions position preserved under filtering)"
  - "buildFlatRows hideMarked + markedTopicIds filter params"
  - "QuestionRow isCustom/customId optional fields"
  - "main.tsx reads uiState from storageAdapter.read() + hydrates activeSessionId from manifest"

affects:
  - "05-02 (TopicMarkDisplay — reads scores/overrides/notes from store)"
  - "05-03 (ResetConfirmDialog — calls resetAll action)"
  - "Phase 7 YAML export (reads V3Session shape)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Red/Green cycle per task: fixture files → failing tests → implementation"
    - "Pure migration function pattern (no try/catch, no class, .js import extensions)"
    - "runMigrations union return type: {manifest,session} | V3Session | null — discriminate by 'manifest' in result"
    - "Zustand set-spread pattern for Record fields: set((s) => ({ field: { ...s.field, [key]: value } }))"
    - "Subscribe handler dual-write: uiState + session:<id> key when activeSessionId is set"

key-files:
  created:
    - src/storage/migrations/v2-to-v3.ts
    - src/storage/migrations/v2-to-v3.test.ts
    - src/storage/migrations/fixtures/v2-session-fixture.ts
  modified:
    - src/storage/types.ts
    - src/storage/migrations/index.ts
    - src/storage/migrations/v1-to-v2.test.ts
    - src/storage/bootstrap.ts
    - src/store/app.ts
    - src/store/app.test.ts
    - src/utils/buildFlatRows.ts
    - src/utils/buildFlatRows.test.ts
    - src/app/main.tsx

key-decisions:
  - "runMigrations return type widened to union ({manifest,session} | V3Session | null) — callers narrow by 'manifest' in result"
  - "setScore and setOverride clamp to [0,10] per threat model T-05-01-02/03"
  - "buildFlatRows index fix uses Array.indexOf on the original topic.questions array rather than forEach position"
  - "hideMarked filter applies inside filteredQuestions check (before visibleTopics push) so marked topics emit no rows"
  - "main.tsx reads uiState from storageAdapter.read(['uiState']) directly rather than from bootstrap() return value"

patterns-established:
  - "Valibot v3 schema pattern: v.nullable() for optional scoring fields, v.union(v.literal()) for Difficulty"
  - "Migration fixture files: exported as Readonly<V2Session> with Object.freeze()"
  - "ScoringState lives in AppState (single store), not a separate store"

requirements-completed:
  - SCORE-01
  - SCORE-02
  - SCORE-03
  - SCORE-04
  - SCORE-05
  - SCORE-06

# Metrics
duration: 12min
completed: 2026-06-17
---

# Phase 05 Plan 01: V3 Data Layer Summary

**V3SessionSchema with scoring fields, migrateV2ToV3 migration, ScoringActions in useAppStore, buildFlatRows index fix, and main.tsx uiState hydration wired for all Phase 5 scoring UI components**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-17T11:26:00Z
- **Completed:** 2026-06-17T11:35:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- V3SessionSchema (scores, overrides, notes, topicNotes, customQuestions[], candidate nullable) + CustomQuestionSchema + CandidateDetailsSchema added to storage/types.ts with derived TypeScript types and createDefaultV3Session factory
- migrateV2ToV3 pure function with 22 fixture-pinned tests; MIGRATIONS array updated with fromVersion:2 entry so bootstrap pipeline is v3-ready
- useAppStore extended with ScoringState + 8 ScoringActions (setScore/setOverride with [0,10] clamp, setNote, setTopicNote, addCustomQuestion, deleteCustomQuestion, setCandidate, resetAll) and subscribe handler dual-writes session:<id> key
- buildFlatRows index bug fixed (original topic.questions[indexOf] position preserved under difficulty filtering); hideMarked/markedTopicIds params and isCustom/customId QuestionRow fields added
- main.tsx reads uiState from storageAdapter.read() and hydrates activeSessionId from manifest.activeSessionId

## Task Commits

Each task was committed atomically (TDD tasks have RED + GREEN commits):

1. **Task 1 RED: v2-to-v3 migration failing tests** - `827e749` (test)
2. **Task 1 GREEN: V3 schema + migrateV2ToV3 implementation** - `3939cdc` (feat)
3. **Task 2 RED (store): ScoringActions failing tests** - `6888a57` (test)
4. **Task 2 RED (buildFlatRows): index + hideMarked failing tests** - `602f18a` (test)
5. **Task 2 GREEN: store extension + buildFlatRows fix + main.tsx hydration** - `567bcbd` (feat)

## Files Created/Modified

- `src/storage/types.ts` - Added V3SessionSchema, CustomQuestionSchema, CandidateDetailsSchema, V3Session/CustomQuestion/CandidateDetails types, createDefaultV3Session factory
- `src/storage/migrations/v2-to-v3.ts` - Pure migrateV2ToV3 function (field renames + customQuestions flattening + candidate null-coalesce)
- `src/storage/migrations/v2-to-v3.test.ts` - 22 fixture-pinned unit tests for all migration behaviors
- `src/storage/migrations/fixtures/v2-session-fixture.ts` - V2_SESSION_EMPTY, V2_SESSION_POPULATED, V2_SESSION_EMPTY_CANDIDATE fixtures
- `src/storage/migrations/index.ts` - Added fromVersion:2 entry, widened runMigrations return type to V3Session union
- `src/storage/migrations/v1-to-v2.test.ts` - Updated runMigrations tests to reflect v2→v3 migration behavior
- `src/storage/bootstrap.ts` - Added 'manifest' in migrated type narrowing for new union return type
- `src/store/app.ts` - CandidateDetails/CustomQuestion interfaces, ScoringState in AppState, ScoringActions in AppActions, DEFAULT_STATE extended, 8 action implementations, subscribe dual-write
- `src/store/app.test.ts` - 13 new ScoringActions tests + 2 resetAll tests
- `src/utils/buildFlatRows.ts` - Index bug fixed (indexOf), hideMarked/markedTopicIds filters, isCustom/customId on QuestionRow
- `src/utils/buildFlatRows.test.ts` - Index-under-filtering and hideMarked regression tests
- `src/app/main.tsx` - storageAdapter.read(['uiState']) hydration, activeSessionId from manifest

## Decisions Made

- **runMigrations union return type:** The existing `returns null for v2` behavior was changed to `returns V3Session for v2`. bootstrap.ts uses `'manifest' in result` type narrowing to discriminate. The existing test was updated to reflect the new contract.
- **setScore/setOverride clamp [0, 10]:** Applied per threat model T-05-01-02/03 as Rule 2 (missing critical security). Clamp prevents keyboard bypass of slider min/max bounds.
- **buildFlatRows hideMarked placement:** Filter applied inside the filteredQuestions check (before pushing to visibleTopics) so marked topics produce zero rows, consistent with the existing "topic with no visible questions → skip" logic.
- **main.tsx uiState read:** Read directly from storageAdapter.read() instead of from bootstrap() return value, matching the plan's spec and ensuring uiState is always fresh from storage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Applied setScore and setOverride clamping per threat model**
- **Found during:** Task 2 (store extension)
- **Issue:** Threat model T-05-01-02 and T-05-01-03 require [0,10] clamp in action body to guard against keyboard input bypassing slider min/max
- **Fix:** Added `Math.min(10, Math.max(0, value))` in setScore and setOverride implementations
- **Files modified:** src/store/app.ts
- **Verification:** Tests pass; clamp does not affect valid [0,10] range scores
- **Committed in:** 567bcbd (Task 2 GREEN commit)

**2. [Rule 1 - Bug] runMigrations return type caused TypeScript errors in bootstrap.ts and v1-to-v2.test.ts**
- **Found during:** Task 1 GREEN phase (tsc check)
- **Issue:** Widening runMigrations return type to V3Session | {manifest,session} | null caused TypeScript errors in bootstrap.ts (which assumed {manifest,session} shape) and the existing runMigrations test
- **Fix:** Added `'manifest' in migrated` type narrowing in bootstrap.ts; updated v1-to-v2.test.ts assertions
- **Files modified:** src/storage/bootstrap.ts, src/storage/migrations/v1-to-v2.test.ts
- **Verification:** tsc --noEmit exits 0; all 66 storage tests pass
- **Committed in:** 3939cdc (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 2 - security, 1 Rule 1 - bug)
**Impact on plan:** Both auto-fixes were necessary for correctness and security. No scope creep.

## Issues Encountered

- biome import ordering required `bootstrap.js` before `index.js` (alphabetical among relative imports) in main.tsx — fixed by reordering
- biome `useLiteralKeys` infos in app.test.ts (3 instances of `overrides['topic1']` vs `overrides.topic1`) — these are `lint/complexity/useLiteralKeys` at info severity only (not errors); `biome ci` exits 0

## Known Stubs

None - all store fields are wired with real implementations. No placeholder data.

## Threat Flags

None - no new network endpoints or auth paths introduced. V3 session writes stay within existing chrome.storage.local boundary already in the threat model.

## Next Phase Readiness

- All scoring UI components (Wave 2: TopicMarkDisplay, QuestionCard, ScoringInputs; Wave 3: ResetConfirmDialog, CandidateForm) can now read from useAppStore and call ScoringActions
- buildFlatRows produces correct original-position indices for score key stability
- main.tsx correctly hydrates activeSessionId so the subscribe handler writes session data to the right storage key

---
*Phase: 05-scoring-ui-notes-candidate-custom-questions*
*Completed: 2026-06-17*

## Self-Check: PASSED

- All 9 key implementation files exist on disk
- All 5 task commits exist in git log (827e749, 3939cdc, 6888a57, 602f18a, 567bcbd)
- 239 tests pass (18 test files, 0 failures)
