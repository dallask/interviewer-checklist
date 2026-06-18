---
phase: 12-uat-defect-cleanup
plan: "02"
subsystem: ui
tags: [zustand, react, tailwind, hideNotes, tdd]

# Dependency graph
requires:
  - phase: 11-v4-session
    provides: existing store patterns (hideMarked, printMode) that hideNotes mirrors
provides:
  - hideNotes boolean state field in AppState with setHideNotes action (not persisted)
  - QuestionCard note section wrapper conditionally hidden by hideNotes && !printMode
  - TopicRow topic notes panel conditionally hidden by hideNotes && !printMode
affects:
  - 12-04: ActionsGroup wiring (the "Hide notes" button trigger uses setHideNotes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Boolean store toggle (hideNotes mirrors hideMarked pattern: AppState field + AppActions + DEFAULT_STATE + setter)"
    - "Volatile UI preference: hideNotes absent from subscribe block uiState write (not persisted to chrome.storage.local)"
    - "CSS hidden class on wrapper div (not HTML hidden attr on textarea) for print-override compatibility (RESEARCH.md Pitfall 5)"
    - "TDD RED/GREEN per task: test commit precedes feat commit for each task"

key-files:
  created: []
  modified:
    - src/store/app.ts
    - src/components/QuestionCard.tsx
    - src/components/TopicRow.tsx
    - src/test/phase-12-defects.test.tsx

key-decisions:
  - "hideNotes absent from subscribe block uiState write: volatile per-session preference resets on reload (D-07)"
  - "Apply hidden class to outer wrapper div (toggle button + textarea) not to textarea alone, preserving print:* override capability (D-08)"
  - "hideNotes && !printMode guard: print mode takes priority, notes always visible when printMode=true"

patterns-established:
  - "hideNotes mirrors hideMarked boolean toggle pattern exactly"
  - "Volatile store fields: explicitly false in DEFAULT_STATE but absent from uiState subscribe write"

requirements-completed:
  - UI-09

# Metrics
duration: 5min
completed: 2026-06-18
---

# Phase 12 Plan 02: hideNotes Store State and Component Wiring Summary

**hideNotes boolean Zustand field wired to QuestionCard and TopicRow wrappers, suppressing all note areas on screen while preserving print-mode visibility**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-18T12:29:29Z
- **Completed:** 2026-06-18T12:34:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `hideNotes: boolean` to `AppState` interface, `AppActions` interface, `DEFAULT_STATE` (false), and store implementation — exactly mirroring the `hideMarked` pattern
- Verified `hideNotes` is absent from the subscribe block `uiState` write (D-07: not persisted)
- Wired `hideNotes` to `QuestionCard.tsx` via CSS `hidden` class on the notes section wrapper div with `hideNotes && !printMode` guard
- Wired `hideNotes` to `TopicRow.tsx` via CSS `hidden` class on the topic notes panel outer div with `hideNotes && !printMode` guard
- Added 8 new tests in TDD RED/GREEN sequence (3 store tests + 3 QuestionCard tests + 2 TopicRow tests)
- Full suite: 587 tests passing, no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: hideNotes store state tests** - `53af9f0` (test)
2. **Task 1 GREEN: Add hideNotes to app.ts store** - `b6607cd` (feat)
3. **Task 2 RED: QuestionCard/TopicRow note suppression tests** - `852c193` (test)
4. **Task 2 GREEN: Wire hideNotes to components** - `51debfb` (feat)

_TDD: each task has test commit (RED) followed by feat commit (GREEN)_

## Files Created/Modified

- `src/store/app.ts` - Added hideNotes field to AppState, setHideNotes to AppActions, hideNotes: false to DEFAULT_STATE, setHideNotes setter; subscribe block unchanged (hideNotes not persisted)
- `src/components/QuestionCard.tsx` - Added hideNotes selector; notes section wrapper `<div>` gains conditional `hidden` class
- `src/components/TopicRow.tsx` - Added hideNotes selector; topic notes panel outer `<div>` gains conditional `hidden` class
- `src/test/phase-12-defects.test.tsx` - Added UI-09 store tests (3), QuestionCard suppression tests (3), TopicRow suppression tests (2); updated mock factory to re-export DEFAULT_STATE

## Decisions Made

- Used CSS `hidden` class on the outer wrapper `<div>` (not the HTML `hidden` attribute on the `<textarea>`) per RESEARCH.md Pitfall 5: HTML `hidden` cannot be overridden by Tailwind `print:` variants
- Print mode guard `hideNotes && !printMode` applied consistently: printMode takes full priority, notes always visible during print regardless of hideNotes state
- Wrapper approach (hiding both toggle button and textarea together) is correct: when `hideNotes=true`, the toggle button itself should also disappear, not just the textarea

## Deviations from Plan

None - plan executed exactly as written.

The mock factory was updated from `vi.mock('../store/app.js', () => ({ useAppStore: vi.fn() }))` to an async factory that re-exports `DEFAULT_STATE` from the actual module. This is not a deviation — the task description specified testing DEFAULT_STATE and the async `importOriginal` pattern is the canonical Vitest approach for partial mocks.

## Issues Encountered

The initial RED test attempt used `vi.importActual` inside test bodies (not at module level), which returns `undefined` inside already-hoisted mocks. Fixed by switching to an async mock factory `vi.mock('../store/app.js', async (importOriginal) => { ... })` that re-exports `DEFAULT_STATE` from the real module while mocking `useAppStore`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `hideNotes` state and component wiring complete
- Plan 04 (ActionsGroup) can now wire the "Hide notes" button to `setHideNotes(!hideNotes)` with `aria-pressed`
- All store field assertions are testable: `DEFAULT_STATE.hideNotes === false`, subscribe block exclusion confirmed

## Self-Check: PASSED

- FOUND: `.planning/phases/12-uat-defect-cleanup/12-02-SUMMARY.md`
- FOUND: commit 53af9f0 (test: hideNotes store RED)
- FOUND: commit b6607cd (feat: hideNotes store GREEN)
- FOUND: commit 852c193 (test: component suppression RED)
- FOUND: commit 51debfb (feat: component wiring GREEN)

---
*Phase: 12-uat-defect-cleanup*
*Completed: 2026-06-18*
