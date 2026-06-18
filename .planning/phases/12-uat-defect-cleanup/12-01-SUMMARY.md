---
phase: 12-uat-defect-cleanup
plan: 01
subsystem: ui
tags: [react, event-propagation, dialog, dom-events, testing-library, vitest]

# Dependency graph
requires:
  - phase: 11
    provides: Existing TopicMarkDisplay, SessionSwitcherModal, and modal-focus-trap test infrastructure

provides:
  - TopicMarkDisplay fieldset with onClick+onMouseDown stopPropagation (SCORE-07)
  - SessionSwitcherModal dialog backdrop-click close via e.target === dialogRef.current (SESS-05)
  - phase-12-defects.test.tsx with SCORE-07 and SESS-05 unit test suites (5 tests)

affects: [phase-12-uat-defect-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "stopPropagation on fieldset: add both onClick and onMouseDown to intercept click sequence before outer button fires"
    - "backdrop-click detection: onClick on <dialog> checking e.target === dialogRef.current distinguishes backdrop from content clicks"

key-files:
  created:
    - src/test/phase-12-defects.test.tsx
  modified:
    - src/components/TopicMarkDisplay.tsx
    - src/components/SessionSwitcherModal.tsx

key-decisions:
  - "stopPropagation applied to the <fieldset> element in TopicMarkDisplay.tsx (not the wrapper span in TopicRow.tsx), keeping the fix contained to the component that owns the override controls"
  - "Both onClick and onMouseDown stopPropagation added per RESEARCH.md Pitfall 4: mousedown fires before click and can trigger outer button press state"
  - "Backdrop close uses e.target === dialogRef.current guard (not e.currentTarget) because showModal() top-layer routing sets target to the dialog node on backdrop clicks"
  - "onClick used for backdrop detection (not onMouseDown) — matches CandidateModal analog and is sufficient for this use case"

patterns-established:
  - "fieldset stopPropagation: onClick+onMouseDown both needed when fieldset is inside a button — prevents parent button activation on the full mouse event sequence"
  - "dialog backdrop detection: onClick on dialog element + e.target === dialogRef.current is the canonical pattern for native showModal() dialogs in this codebase"

requirements-completed:
  - SCORE-07
  - SESS-05

# Metrics
duration: 5min
completed: 2026-06-18
---

# Phase 12 Plan 01: UAT Defect Cleanup (SCORE-07 + SESS-05) Summary

**DOM event isolation for topic override fieldset (stopPropagation) and backdrop-click close for session switcher modal (e.target guard on dialog onClick)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-18T12:24:00Z
- **Completed:** 2026-06-18T12:26:43Z
- **Tasks:** 2 (both TDD: RED commit + GREEN commit per task)
- **Files modified:** 3 (TopicMarkDisplay.tsx, SessionSwitcherModal.tsx, phase-12-defects.test.tsx)

## Accomplishments

- Fixed SCORE-07: clicking the topic override input or × clear button in TopicMarkDisplay no longer collapses/expands the parent topic section — `onClick` and `onMouseDown` `e.stopPropagation()` added to the `<fieldset>` element
- Fixed SESS-05: clicking the session switcher modal backdrop now closes the modal — `onClick` handler on `<dialog>` element closes when `e.target === dialogRef.current`
- Created `src/test/phase-12-defects.test.tsx` with 5 unit tests covering both defects (3 for SCORE-07, 2 for SESS-05); all pass
- Full test suite remains green: 579 tests, 40 test files, no regression

## Task Commits

Each task was committed atomically with TDD RED → GREEN pattern:

1. **RED (both tasks):** `94fe6f3` (test) — failing tests for SCORE-07 and SESS-05
2. **Task 1 GREEN: Add stopPropagation to TopicMarkDisplay fieldset** - `8fa48fa` (feat)
3. **Task 2 GREEN: Add backdrop-click close to SessionSwitcherModal** - `ade4739` (feat)

## Files Created/Modified

- `src/test/phase-12-defects.test.tsx` — Created: SCORE-07 and SESS-05 unit tests (5 tests total)
- `src/components/TopicMarkDisplay.tsx` — Modified: added `onClick` + `onMouseDown` `e.stopPropagation()` to `<fieldset>` (lines 79–80)
- `src/components/SessionSwitcherModal.tsx` — Modified: added `onClick` backdrop handler to `<dialog>` element (lines 79–83)

## Decisions Made

- Applied stopPropagation to the `<fieldset>` in `TopicMarkDisplay.tsx` (not a wrapper span in `TopicRow.tsx`) — keeps the fix inside the component that owns the override UI, consistent with D-01/D-02
- Used `onClick` for the backdrop handler (not `onMouseDown`) — matches the decision in CONTEXT.md D-03 and is sufficient because showModal() top-layer routing fires click on the dialog node for backdrop taps
- Both `onClick` and `onMouseDown` stopPropagation added to fieldset — required per RESEARCH.md Pitfall 4 (mousedown fires before click and can trigger the outer button's press state before the click handler fires)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Tests confirmed RED state before implementation and GREEN state after each fix. The `modal-focus-trap.test.tsx` focus-trap tests for `SessionSwitcherModal` were unaffected as predicted by RESEARCH.md Q7.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — both fixes are complete DOM event wiring with no placeholder values or deferred wiring.

## Next Phase Readiness

- SCORE-07 and SESS-05 defects closed
- Phase 12 Plan 02 (UI-09 hide notes) can proceed immediately — no blockers from this plan
- The `phase-12-defects.test.tsx` file is ready for Plan 02 to extend with UI-09 tests

---
*Phase: 12-uat-defect-cleanup*
*Completed: 2026-06-18*
