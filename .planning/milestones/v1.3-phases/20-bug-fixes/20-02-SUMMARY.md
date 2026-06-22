---
phase: 20-bug-fixes
plan: "02"
subsystem: ui
tags: [tailwind, react, difficulty-indicators, border-color, QuestionCard]

# Dependency graph
requires:
  - phase: 17-difficulty-indicators
    provides: BORDER_CLASSES and BADGE_CLASSES constants in QuestionCard.tsx
provides:
  - QuestionCard left border color correctly renders difficulty color (green/blue/orange/pink) using border-l-{color}-700
affects: [ui, difficulty-indicators, QuestionCard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use border-l-* utilities (not border-* shorthand) to set only border-left-color and avoid Tailwind v4 cascade conflict with existing border-* utilities"
    - "All BORDER_CLASSES entries must be full static string literals for Tailwind content scanner"

key-files:
  created: []
  modified:
    - src/components/QuestionCard.tsx
    - src/components/QuestionCard.test.tsx

key-decisions:
  - "Use border-l-{color}-700 instead of border-{color}-500: border-l-* sets only border-left-color, avoiding Tailwind v4 cascade conflict with border-gray-100 already in className"
  - "Shade -700 chosen to match BADGE_CLASSES text colors (text-green-700, text-blue-700, etc.) for visual consistency"

patterns-established:
  - "In Tailwind v4, use property-specific border utilities (border-l-*, border-t-*, etc.) when other border-* utilities are also present on the same element"

requirements-completed:
  - BUG-02

# Metrics
duration: 8min
completed: 2026-06-22
---

# Phase 20 Plan 02: Bug Fixes (BUG-02) Summary

**QuestionCard left border now renders correct difficulty color via border-l-{color}-700 utilities that avoid Tailwind v4 cascade conflict with border-gray-100**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-22T12:05:00Z
- **Completed:** 2026-06-22T12:13:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Fixed BUG-02: QuestionCard left border was rendering gray instead of difficulty-specific color
- Root cause identified and resolved: `border-{color}-500` shorthand sets all four border colors, and was being overridden by `border-gray-100` in the className; replaced with `border-l-{color}-700` which only sets border-left-color
- Shade updated from -500 to -700 to match BADGE_CLASSES text colors exactly (text-green-700, text-blue-700, text-orange-700, text-pink-700)
- Updated VIS-01 tests in QuestionCard.test.tsx to assert correct border-l-{color}-700 classes (tests were encoding the old broken behavior)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace BORDER_CLASSES with border-l-{color}-700 utilities in QuestionCard (BUG-02)** - `26253ad` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/QuestionCard.tsx` - BORDER_CLASSES constant updated: all four difficulty entries now use `border-l-{color}-700` instead of `border-{color}-500`; comment updated to reference D-06 and D-09
- `src/components/QuestionCard.test.tsx` - VIS-01 test descriptions and assertions updated to check `border-l-{color}-700` classes (Rule 1 auto-fix — tests encoded broken behavior)

## Decisions Made

- Used `border-l-{color}-700` instead of `border-{color}-500`: The `border-l-*` utility in Tailwind v4 sets only `border-left-color`, avoiding the cascade conflict with `border-gray-100` which was overriding the shorthand `border-*` form.
- Shade -700 chosen to match BADGE_CLASSES text colors for visual consistency between border and badge.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated VIS-01 tests that asserted old broken border class names**

- **Found during:** Task 1 (after BORDER_CLASSES fix, vitest run showed 6 failing tests)
- **Issue:** `QuestionCard.test.tsx` VIS-01 tests (lines 305-343) checked for `border-green-500`, `border-blue-500`, `border-orange-500`, `border-pink-500` — the old broken class values. Tests were encoding the incorrect behavior rather than the intended behavior.
- **Fix:** Updated all four VIS-01 test descriptions and `toContain` assertions to use `border-l-green-700`, `border-l-blue-700`, `border-l-orange-700`, `border-l-pink-700`
- **Files modified:** `src/components/QuestionCard.test.tsx`
- **Verification:** `npx vitest run` → 5407 passed, 0 failed
- **Committed in:** `26253ad` (included in task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test file encoded broken behavior)
**Impact on plan:** Auto-fix necessary for correctness. Tests now assert the correct visual behavior per the plan's acceptance criteria. No scope creep.

## Issues Encountered

None beyond the VIS-01 test update documented above. The main repo's `src/` path appeared to have different file state from the worktree when using `cd /path/to/main-repo && grep` — verifications were run against the worktree path directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BUG-02 is resolved: QuestionCard left border now renders the correct difficulty color on all four levels
- No regressions: 5407 tests pass (up from 5401 — the 6 previously passing tests that encoded broken behavior now correctly pass against the fixed implementation)
- Ready to proceed to remaining phase 20 plans

---
*Phase: 20-bug-fixes*
*Completed: 2026-06-22*
