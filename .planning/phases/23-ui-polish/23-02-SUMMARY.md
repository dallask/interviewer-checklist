---
phase: 23-ui-polish
plan: 02
subsystem: ui
tags: [react, lucide-react, tailwind, modal, dialog, accessibility]

# Dependency graph
requires:
  - phase: 23-ui-polish
    provides: UI-SPEC design contract, CONTEXT decisions (POL-02, POL-03, POL-04)
provides:
  - ResetConfirmDialog with X icon + "Keep data" cancel and Trash2 icon + "Reset all" destructive button
  - ImportPreviewModal with X icon + "Discard import" cancel and Download icon + "Import" confirm button
  - ActionsGroup two-column labeled grid (grid-cols-2 gap-2) with w-4 h-4 icons and truncate text labels
  - transition-colors duration-150 on all modified interactive buttons (POL-04)
affects:
  - 23-ui-polish (plan 01 parallel — shares ActionsGroup, modal patterns)
  - future phases referencing modal button patterns or ActionsGroup grid layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Modal cancel button pattern: flex items-center gap-2 transition-colors duration-150 + X icon + descriptive label (not 'Cancel')"
    - "Modal confirm button pattern: flex items-center gap-2 transition-colors duration-150 + action icon + action label"
    - "ActionsGroup button pattern: flex flex-col items-center gap-1 px-2 py-2 text-[10px] + w-4 h-4 icon + truncate span label"

key-files:
  created: []
  modified:
    - src/components/ResetConfirmDialog.tsx
    - src/components/ResetConfirmDialog.test.tsx
    - src/components/ImportPreviewModal.tsx
    - src/components/ImportPreviewModal.test.tsx
    - src/components/ActionsGroup.tsx

key-decisions:
  - "Cancel button copy 'Keep data' (not 'Keep scores') in ResetConfirmDialog per copywriting contract"
  - "Cancel button copy 'Discard import' (not 'Cancel') in ImportPreviewModal per copywriting contract"
  - "Confirm button copy 'Import' (not 'Confirm') in ImportPreviewModal per copywriting contract"
  - "gap-2 used for icon-to-text gap in modal buttons (per 23-UI-SPEC spacing scale)"
  - "Dark mode toggle label: 'Light' when active (darkMode=true), 'Dark' when inactive — conditionally wraps both icon and span"
  - "Reset button in ActionsGroup uses inline className (not btnBase) to preserve red color variant"

patterns-established:
  - "Modal action buttons: flex items-center gap-2 + icon before label + transition-colors duration-150"
  - "ActionsGroup buttons: flex flex-col items-center gap-1 + w-4 h-4 icon + truncate span — 2-column grid"

requirements-completed: [POL-02, POL-03, POL-04]

# Metrics
duration: 4min
completed: 2026-06-22
---

# Phase 23 Plan 02: UI Polish — Modal Icons, Labeled Grid, Hover Transitions Summary

**Lucide icons added to ResetConfirmDialog and ImportPreviewModal buttons with corrected copy, and ActionsGroup converted from 3-column icon-only to 2-column labeled grid with transition-colors throughout**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-22T10:05:57Z
- **Completed:** 2026-06-22T10:09:37Z
- **Tasks:** 2
- **Files modified:** 5 (3 component files + 2 test files)

## Accomplishments

- ResetConfirmDialog: imported Trash2 and X from lucide-react; cancel button renamed "Keep data" with X icon; destructive button renamed "Reset all" with Trash2 icon; both buttons get flex items-center gap-2 transition-colors duration-150
- ImportPreviewModal: imported Download and X from lucide-react; cancel button renamed "Discard import" with X icon; confirm button renamed "Import" (was "Confirm") with Download icon; both buttons get flex items-center gap-2 transition-colors duration-150
- ActionsGroup: btnBase and btnActive constants rewritten with flex-col labeled layout and transition-colors; grid changed from grid-cols-3 gap-1.5 to grid-cols-2 gap-2; all 9 action buttons get w-4 h-4 icons with truncate label spans; Reset inline className updated with same layout plus red color variant
- Test assertions updated for new button copy (Keep data, Reset all, Discard import, Import) — 37 tests across 3 files all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: ResetConfirmDialog + ImportPreviewModal icon buttons and corrected labels** - `2109301` (feat)
2. **Task 2: ActionsGroup two-column labeled grid** - `9d6a07d` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified

- `src/components/ResetConfirmDialog.tsx` - Added Trash2/X imports; "Keep data" + X icon; "Reset all" + Trash2 icon; transition-colors on both buttons
- `src/components/ResetConfirmDialog.test.tsx` - Updated test assertions to match new copy (Keep data, Reset all)
- `src/components/ImportPreviewModal.tsx` - Added Download/X imports; "Discard import" + X icon; "Import" + Download icon; transition-colors on both buttons
- `src/components/ImportPreviewModal.test.tsx` - Updated test assertions to match new copy (Discard import, Import)
- `src/components/ActionsGroup.tsx` - Rewrote btnBase/btnActive; grid-cols-2 gap-2; all 9 buttons have w-4 h-4 icons + labeled spans; Reset inline className updated

## Decisions Made

- Used `gap-2` (8px) for icon-to-text gap in modal buttons, matching the 23-UI-SPEC spacing contract
- Dark mode toggle in ActionsGroup: single conditional wraps both icon and label (`<>{icon}<span>Light|Dark</span></>`) so label text matches current icon state
- Reset button in ActionsGroup: kept inline className (not btnBase) to preserve red text color variant; duplicated layout classes there

## Deviations from Plan

None — plan executed exactly as written. Test assertion updates were explicitly anticipated in the plan's `<done>` criteria.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All POL-02, POL-03, POL-04 requirements fulfilled by this plan
- Modal button icon pattern established: any future modal buttons should follow `flex items-center gap-2 transition-colors duration-150 + <Icon aria-hidden="true" /> + label`
- ActionsGroup grid layout ready — 2-column labeled grid with 10px labels is the new baseline

---
*Phase: 23-ui-polish*
*Completed: 2026-06-22*
