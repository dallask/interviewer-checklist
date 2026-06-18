---
phase: 15-sidebar-shell-refactor-compact-questioncard
plan: 01
subsystem: ui
tags: [react, tailwind, sidebar, sticky-header, progress-bar, scoring]

# Dependency graph
requires:
  - phase: 14-editable-bank-yaml-schema-expansion
    provides: V4Section/V4Topic types with questions array in store
  - phase: 11-scoring-formula-refactor
    provides: computeOverallMark, computeTopicMark, MarkBand from scoring module
provides:
  - SidebarHeader component with sticky progress header (toggle, candidate button, mark badge, progress bar)
  - Sidebar shell refactored with inner scrollable div (enables sticky positioning)
  - CandidateModal ownership moved from ActionsGroup to Sidebar
affects: [15-02, sidebar-rendering, candidate-modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BAND_COLORS static record pattern for Tailwind class safety (complete literals, no dynamic construction)"
    - "overflow-y-auto on inner div pattern for sticky header inside fixed aside"
    - "candidateDialogRef ownership at Sidebar level via useRef"

key-files:
  created:
    - src/components/SidebarHeader.tsx
  modified:
    - src/components/Sidebar.tsx
    - src/components/ActionsGroup.tsx

key-decisions:
  - "SidebarHeader gets onCandidateClick prop; CandidateModal ref lives in Sidebar (not ActionsGroup) to avoid dual-render"
  - "V4Topic.questions mapped to Question {q, level} interface before passing to computeTopicMark (V4Question has id/text/isDefault extras)"
  - "SidebarFooter placed outside the inner scrollable div (acts as sticky bottom element)"

patterns-established:
  - "Sticky section pattern: aside has flex flex-col, SidebarHeader is sticky top-0 z-10, inner div has flex-1 overflow-y-auto"

requirements-completed:
  - UI-13

# Metrics
duration: 3min
completed: 2026-06-18
---

# Phase 15 Plan 01: Sidebar Shell Refactor & Compact QuestionCard — SidebarHeader Summary

**Sticky sidebar header with toggle/candidate buttons, live mark badge (BAND_COLORS), and thin progress bar via computeOverallMark across all V4 topics**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-18T13:18:12Z
- **Completed:** 2026-06-18T13:21:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `SidebarHeader.tsx` — sticky top-0 header that never scrolls with sidebar content
- Refactored `Sidebar.tsx` to separate sticky header + inner `overflow-y-auto` div (required for sticky to work in fixed aside)
- Moved `CandidateModal` ownership from `ActionsGroup` to `Sidebar`, eliminating potential dual-render and correctly wiring `id="open-candidate-modal"` for focus-return in `CandidateModal.handleClose`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SidebarHeader component (UI-13)** - `38c4ab7` (feat)
2. **Task 2: Refactor Sidebar.tsx — sticky header + inner scrollable div + CandidateModal ownership** - `e64b631` (feat)

## Files Created/Modified
- `src/components/SidebarHeader.tsx` — New sticky sidebar header with progress display
- `src/components/Sidebar.tsx` — Refactored shell: SidebarHeader + inner scrollable div + CandidateModal ownership
- `src/components/ActionsGroup.tsx` — Removed CandidateModal import/render/ref/button (relocated to Sidebar)

## Decisions Made
- **V4Question → Question mapping**: V4Topic questions have `{ id, text, level, isDefault }` but `computeTopicMark` expects `{ q, level }`. Mapped explicitly with `.map((q) => ({ q: q.text, level: q.level }))` rather than a type cast.
- **CandidateModal location**: Moved to Sidebar to avoid two dialog instances. The `id="open-candidate-modal"` button in SidebarHeader preserves the focus-return target in `CandidateModal`'s `handleClose`.
- **SidebarFooter position**: Placed outside the inner scrollable div per UI-SPEC layout diagram — it acts as a sticky bottom element anchored by `flex flex-col` on aside.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compilation revealed V4Question's `text` field (vs `q` in the data bank `Question` type), which was addressed with an explicit mapping. Pre-existing TypeScript errors exist in `src/background/index.test.ts`, `src/components/TopicRow.test.tsx`, `src/storage/migrations/`, and `src/store/app.test.ts` — none introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SidebarHeader component live with sticky progress display — ready for Plan 02 (compact QuestionCard)
- CandidateModal ownership consolidated in Sidebar — no further changes needed for modal focus management

## Self-Check: PASSED

All files exist on disk. All commits verified in git log.

---
*Phase: 15-sidebar-shell-refactor-compact-questioncard*
*Completed: 2026-06-18*
