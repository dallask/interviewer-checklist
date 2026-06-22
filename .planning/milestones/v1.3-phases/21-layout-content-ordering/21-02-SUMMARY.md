---
phase: 21-layout-content-ordering
plan: "02"
subsystem: ui
tags: [react, tailwind, virtualizer, content-centering, layout]

# Dependency graph
requires:
  - phase: 21-01
    provides: "Phase 21 Plan 01 context (CONT-01 difficulty sort — parallel plan)"
provides:
  - "Horizontal centering wrapper (max-w-[1200px] mx-auto px-4) inside each ContentTree virtual row"
  - "Print-only candidate header constrained to max-w-[1200px] mx-auto px-4"
  - "LAYOUT-01 requirement fulfilled: centered 1200px content on wide viewports, full-width with 16px padding on narrow viewports"
affects: [21-layout-content-ordering, future ui plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Centering wrapper inside absolute-positioned virtualizer row items: inner div with mx-auto w-full max-w-[1200px] px-4 wraps all row components while outer div retains width: 100%"
    - "Tailwind v4 JIT arbitrary-value max-w-[1200px] as static literal string"

key-files:
  created: []
  modified:
    - src/components/ContentTree.tsx

key-decisions:
  - "D-01 honored: ref={parentRef} scroll container remains full viewport width — no max-width on the scroll container"
  - "D-02 pattern: centering wrapper inserted inside each virtual row item div, outside the row component"
  - "D-03: px-4 (16px) padding on both sides prevents edge-touch on narrow viewports"
  - "D-04: print-only candidate header also receives max-w-[1200px] mx-auto px-4 for print consistency"
  - "Pre-existing TypeScript errors in test fixtures and migrations are not caused by this plan"

patterns-established:
  - "Virtual row centering: outer div keeps position: absolute width: 100%, inner div applies mx-auto max-w constraint"
  - "Print layout mirroring screen layout constraints via matching Tailwind classes on print-only block"

requirements-completed:
  - LAYOUT-01

# Metrics
duration: 2min
completed: 2026-06-22
---

# Phase 21 Plan 02: Layout Centering Summary

**Centering wrapper div (mx-auto w-full max-w-[1200px] px-4) added inside all five ContentTree virtual row types plus print-only header, constraining content to 1200px on wide viewports with 16px side padding on narrow viewports**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-22T09:30:08Z
- **Completed:** 2026-06-22T09:31:49Z
- **Tasks:** 1 (+ 1 checkpoint auto-approved in yolo mode)
- **Files modified:** 1

## Accomplishments
- Inserted `<div className="mx-auto w-full max-w-[1200px] px-4">` as the single child of every virtual row item div, wrapping all five row types: SectionRow, TopicRow, QuestionCard, add-section-trigger button, add-topic-trigger button
- Updated print-only candidate header className from `"hidden print:block print:mb-4"` to `"hidden print:block print:mb-4 max-w-[1200px] mx-auto px-4"` for consistent print layout
- The ref={parentRef} scroll container (`flex-1 overflow-y-auto`) and the inner virtualizer div remain untouched — scrollbar tracks full viewport width as required by D-01
- All 680 existing tests pass; no new TypeScript errors introduced in ContentTree.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap virtual row items with centering div in ContentTree.tsx** - `85e6c58` (feat)
2. **Task 2: checkpoint:human-verify** — auto-approved (yolo mode)

**Plan metadata:** (to be added by final commit)

## Files Created/Modified
- `src/components/ContentTree.tsx` - Added centering wrapper div inside each virtualItems.map() row item and updated print-only header className

## Decisions Made
- Followed plan exactly: inner wrapper div uses static literal `"mx-auto w-full max-w-[1200px] px-4"` as required by Tailwind v4 JIT
- Pre-existing TypeScript errors in `src/background/index.test.ts`, `src/components/TopicRow.test.tsx`, `src/components/QuestionCard.test.tsx`, `src/storage/migrations/`, `src/store/app.test.ts`, and `src/test/phase-12-defects.test.tsx` confirmed pre-existing before this plan (baseline comparison performed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors exist in test fixture files and migration code; confirmed they pre-date this plan via baseline comparison. These are out-of-scope for this plan and logged for awareness.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LAYOUT-01 is complete. ContentTree virtual rows now center at 1200px on wide viewports.
- CONT-01 (difficulty sort within topics) is addressed in Plan 21-01 and is independent of this plan.
- Phase 21 is ready for human visual verification to confirm the layout appears centered correctly in a live browser.

---
*Phase: 21-layout-content-ordering*
*Completed: 2026-06-22*
