---
phase: 15-sidebar-shell-refactor-compact-questioncard
plan: 03
subsystem: ui
tags: [react, tailwind, questioncard, compact-layout, score-dropdown, accessibility]

# Dependency graph
requires:
  - phase: 14-editable-bank-yaml-schema-expansion
    provides: deleteCustomQuestion, removeDefaultQuestion wiring in QuestionCard
provides:
  - Compact single-line QuestionCard with score <select> dropdown (Skip + 0-10)
  - Note icon toggle button (📝) replacing the text-based "Add notes" button
  - Delete button hover-reveal via CSS group/group-hover pattern
  - Print mode score readout as text replacing slider/dropdown on print
affects:
  - phase-15 plans downstream (SidebarHeader, SidebarFooter, AboutModal)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compact single-line row: score left, text center, action icons right"
    - "CSS group/group-hover for hover-reveal delete button (no JS)"
    - "D-08 hideNotes pattern: className hidden on outer wrapper, not HTML hidden attribute"
    - "Score dropdown: closed set of option values, null for Skip, Number(v) for 0-10"

key-files:
  created: []
  modified:
    - src/components/QuestionCard.tsx

key-decisions:
  - "Removed DIFFICULTY_CLASSES and DIFFICULTY_LABELS constants per SCORE-08 spec — difficulty pill not shown in compact card"
  - "Used CSS group/group-hover for delete button hover reveal — no JS state needed"
  - "Textarea min-h reduced from 80px to 64px per UI-SPEC compact card spacing"
  - "Print mode uses hidden:flex + print:flex pattern for score text readout"

patterns-established:
  - "Single-line question row: select (left) + text (flex-1 truncate) + icon buttons (right)"
  - "group class on row div enables group-hover:opacity-100 on sibling delete button"

requirements-completed:
  - SCORE-08

# Metrics
duration: 2min
completed: 2026-06-18
---

# Phase 15 Plan 03: Compact QuestionCard Summary

**QuestionCard rewritten to compact single-line layout — score `<select>` dropdown (Skip + 0-10) left, question text center, note icon (📝) and hover-revealed delete button right, per SCORE-08 spec**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-18T13:18:09Z
- **Completed:** 2026-06-18T13:19:37Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced `<input type="range">` slider with `<select>` dropdown with Skip + 0–10 options; Skip dispatches `null` to store, numbers dispatch integer values
- Removed `DIFFICULTY_CLASSES` and `DIFFICULTY_LABELS` constants and difficulty pill — compact card collapses to a true single line per SCORE-08
- Note toggle moved from text button ("Add notes") to emoji icon button (📝) on the right of the row; button is blue when note exists or is open
- Delete button (custom/default questions) moved after note icon with `opacity-0 group-hover:opacity-100` hover-reveal via Tailwind CSS `group` class on the row div
- Print mode correctly shows score as `"Score: X / 10"` text and hides the interactive dropdown row
- `hideNotes && !printMode` hides note textarea wrapper via CSS class (D-08 pattern preserved)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite QuestionCard to compact single-line layout with score dropdown (SCORE-08)** - `d7c740f` (feat)

**Plan metadata:** (see below)

## Files Created/Modified

- `src/components/QuestionCard.tsx` - Compact single-line layout with score dropdown, note icon toggle, hover-reveal delete button; difficulty pill removed

## Decisions Made

- Removed `DIFFICULTY_CLASSES` and `DIFFICULTY_LABELS` constants per SCORE-08 spec — difficulty pill is not shown in the compact inline card view
- Used CSS `group`/`group-hover` on the row div for hover-reveal delete button — eliminates JS hover state
- Textarea `min-h` reduced from `80px` to `64px` as specified in UI-SPEC compact card spacing
- Print mode uses `hidden print:flex` pattern on score readout div to show text-only score on print without affecting screen layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript pre-existing errors in `src/background/index.test.ts` and `src/components/TopicRow.test.tsx` were present before this plan and are not caused by these changes (scope boundary: deferred, not fixed).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `QuestionCard.tsx` is ready for Phase 15 downstream plans (SidebarHeader, SidebarFooter, AboutModal)
- All store selectors (`score`, `setScore`, `setNote`, `deleteCustomQuestion`, `removeDefaultQuestion`, `printMode`, `hideNotes`) preserved
- No breaking changes to props interface — `row: QuestionRow` unchanged

## Self-Check: PASSED

- `src/components/QuestionCard.tsx` — FOUND
- `d7c740f` (feat commit) — FOUND
- `15-03-SUMMARY.md` — FOUND

---
*Phase: 15-sidebar-shell-refactor-compact-questioncard*
*Completed: 2026-06-18*
