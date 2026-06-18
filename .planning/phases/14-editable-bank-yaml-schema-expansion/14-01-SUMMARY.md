---
phase: 14-editable-bank-yaml-schema-expansion
plan: "01"
subsystem: store
tags: [zustand, valibot, typescript, v4-session, bank-mutations]

# Dependency graph
requires:
  - phase: 11-v4-session-migration
    provides: V4Section/V4Topic/V4Question types + sections[] in AppState
provides:
  - V4SessionSchema with removedDefaultQuestionIds optional field (default [])
  - AppState.removedDefaultQuestionIds: Set<string> + DEFAULT_STATE initialization
  - 5 new Zustand bank-mutation actions: addSection, removeSection, addTopic, removeTopic, removeDefaultQuestion
  - subscribe block persists removedDefaultQuestionIds as spread array
  - switchSession hydrates removedDefaultQuestionIds as new Set
  - importSession sets sections and removedDefaultQuestionIds in both overwrite branches
  - expandAll/collapseAll iterate get().sections with section.topics
  - App.tsx reads sections from store; buildFlatRows receives store sections (not DEFAULT_SECTIONS)
  - ImportResult extended with optional sections and removedDefaultQuestionIds fields for Plan 03
affects:
  - 14-02-buildFlatRows-v4section
  - 14-03-yaml-import-export
  - 14-04-bank-ui-components
  - 14-05-integration-tests

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Set-based filter model for removedDefaultQuestionIds (spread to array on storage write, hydrate to Set on read)"
    - "Bank mutation actions: addSection/removeSection use sections.filter/spread; addTopic/removeTopic use sections.map"
    - "removeDefaultQuestion: new Set copy + add (immutable Set mutation pattern)"

key-files:
  created: []
  modified:
    - src/storage/types.ts
    - src/store/app.ts
    - src/app/App.tsx
    - src/utils/yamlImport.ts
    - src/store/app.test.ts

key-decisions:
  - "resetAll does NOT clear removedDefaultQuestionIds — bank shape is separate from scoring state (D-01)"
  - "buildFlatRows receives sections as any cast in App.tsx — Plan 02 will update buildFlatRows signature to V4Section[]"
  - "importSession sets sections: data.sections ?? [] so empty array is the safe default when YAML has no bank delta"
  - "expandAll/collapseAll now rely on get().sections — tests must pre-populate sections to cover non-empty case"

patterns-established:
  - "Pattern: Set fields in V4Session are persisted as spread arrays [...state.set] and hydrated via new Set(array ?? [])"
  - "Pattern: ImportResult optional fields (sections, removedDefaultQuestionIds) for future YAML bank delta import (Plan 03)"

requirements-completed:
  - BANK-01
  - BANK-02
  - BANK-03
  - BANK-04
  - BANK-05

# Metrics
duration: 4min
completed: 2026-06-18
---

# Phase 14 Plan 01: Editable Bank Data Layer Summary

**V4SessionSchema + AppState extended with removedDefaultQuestionIds Set, 5 Zustand bank-mutation actions added, App.tsx wired to store sections instead of DEFAULT_SECTIONS**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-18T12:09:40Z
- **Completed:** 2026-06-18T12:13:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended V4SessionSchema with `removedDefaultQuestionIds: v.optional(v.array(v.string()), [])` and updated `createDefaultV4Session` factory
- Added `removedDefaultQuestionIds: Set<string>` to AppState and `new Set<string>()` to DEFAULT_STATE
- Implemented 5 bank-mutation actions: addSection, removeSection, addTopic, removeTopic, removeDefaultQuestion
- Fixed expandAll/collapseAll to iterate `get().sections` (V4Section[]) with `.topics` accessor instead of `DEFAULT_SECTIONS` with `.items`
- Fixed subscribe block to persist `removedDefaultQuestionIds` as `[...state.removedDefaultQuestionIds]` (satisfies V4Session check added)
- Fixed switchSession to hydrate `removedDefaultQuestionIds: new Set(session?.removedDefaultQuestionIds ?? [])`
- Fixed importSession (both overwrite branches) to apply `sections` and `removedDefaultQuestionIds` from import data
- App.tsx now reads `sections` from store via `useAppStore((s) => s.sections)` and passes to buildFlatRows; `DEFAULT_SECTIONS` import removed
- Extended ImportResult with optional `sections?: V4Section[]` and `removedDefaultQuestionIds?: string[]` fields (needed by Plan 03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend V4SessionSchema + AppState + DEFAULT_STATE** - `dc16e2c` (feat)
2. **Task 2: Implement 5 store actions + fix subscribe/hydration/expandAll/App.tsx** - `ec4c0db` (feat)

## Files Created/Modified
- `src/storage/types.ts` - Added removedDefaultQuestionIds to V4SessionSchema and createDefaultV4Session
- `src/store/app.ts` - Added removedDefaultQuestionIds to AppState/DEFAULT_STATE/AppActions; 5 new actions; fixed expandAll/collapseAll; updated subscribe/switchSession/importSession; removed DEFAULT_SECTIONS import
- `src/app/App.tsx` - Added sections selector from store; markedTopicIds uses section.topics; buildFlatRows receives sections (as any cast for Plan 02)
- `src/utils/yamlImport.ts` - Extended ImportResult with optional sections and removedDefaultQuestionIds fields
- `src/store/app.test.ts` - Fixed expandAll/collapseAll tests to pre-populate store sections

## Decisions Made
- resetAll intentionally does NOT clear removedDefaultQuestionIds — bank shape and scoring state are separate concerns (D-01, resolved Open Question 1 from RESEARCH.md)
- buildFlatRows in App.tsx uses `sections as any` cast — Plan 02 will update buildFlatRows signature to accept V4Section[]; TODO comment left in code
- importSession sets `sections: data.sections ?? []` as safe default — when YAML has no bank delta, sections starts empty and is populated by switchSession/bootstrap from storage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed expandAll/collapseAll tests to match refactored implementation**
- **Found during:** Task 2 (implement 5 store actions + fix expandAll/collapseAll)
- **Issue:** Tests for expandAll() and collapseAll() called the actions with empty `sections: []` (DEFAULT_STATE), so `topicOpen` was always empty. Tests asserted `Object.keys(topicOpen).length > 0` which failed.
- **Fix:** Added `useAppStore.setState({ sections: [...] })` setup in both tests with two synthetic topics, following the plan's intent that expandAll/collapseAll iterate current store sections
- **Files modified:** src/store/app.test.ts
- **Verification:** npm test — 1212 tests pass, 0 failures
- **Committed in:** ec4c0db (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test bug caused by correct implementation change)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Known Stubs

- `src/app/App.tsx:53` — `sections as any` cast on buildFlatRows call. Intentional: buildFlatRows currently expects `readonly Section[]` (legacy type); Plan 02 will update the signature to `V4Section[]` and remove this cast. The TODO comment documents the resolution point: `// TODO(14-02): remove cast after buildFlatRows is updated to accept V4Section[]`

## Issues Encountered
None — plan executed as specified after applying the expandAll/collapseAll test fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All foundational types and actions are in place; Plans 02–05 can proceed
- Plan 02 must update buildFlatRows to accept V4Section[] and remove the `as any` cast in App.tsx
- Plan 03 (YAML import/export) can read `ImportResult.sections` and `ImportResult.removedDefaultQuestionIds` that were added here
- Plan 04 (UI components) can use all 5 new bank-mutation actions from the store

---
*Phase: 14-editable-bank-yaml-schema-expansion*
*Completed: 2026-06-18*
