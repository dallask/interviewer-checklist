---
phase: 21-layout-content-ordering
plan: 01
subsystem: ui
tags: [buildFlatRows, difficulty-sort, content-ordering, virtual-rows, typescript]

# Dependency graph
requires: []
provides:
  - "DIFF_ORDER constant in buildFlatRows.ts for difficulty sort (novice=0, intermediate=1, advanced=2, expert=3)"
  - "In-place difficulty sort of filteredQuestions before topic emit"
  - "Unified merged emit loop replacing separate default/custom loops (CONT-01)"
  - "Custom questions now appear at their difficulty position, not appended at end"
  - "4 CONT-01 regression tests in buildFlatRows.test.ts"
affects: [ContentTree, QuestionCard, any future feature that reads VirtualRow ordering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DIFF_ORDER: Record<Difficulty, number> — integer map for stable difficulty sort comparisons"
    - "MergedQuestion discriminated union for type-safe default/custom unified sort"
    - "In-place sort on locally-built arrays (not topic.questions references)"

key-files:
  created: []
  modified:
    - src/utils/buildFlatRows.ts
    - src/utils/buildFlatRows.test.ts

key-decisions:
  - "DIFF_ORDER defined as a separate integer-keyed constant (not imported from DIFFICULTY_COEFFICIENTS) for clean sort comparisons"
  - "filteredQuestions sorted in-place (safe — locally built array, not a reference to topic.questions)"
  - "MergedQuestion discriminated union with kind:'default'|'custom' to carry both variants through unified sort"
  - "originalIndex preserved from pre-sort assignment — score key stability unaffected by difficulty reorder"
  - "Custom question index field remains cosmetic (score storage uses customId, not index)"

patterns-established:
  - "Unified merged sort pattern: build discriminated union array, sort by shared key, emit in single loop"
  - "Stable sort (ECMAScript 2019+) preserves bank order within same difficulty level"

requirements-completed: [CONT-01]

# Metrics
duration: 8min
completed: 2026-06-22
---

# Phase 21 Plan 01: Layout & Content Ordering — Sort Implementation Summary

**Difficulty sort (novice→intermediate→advanced→expert) added to buildFlatRows with custom questions merged at their difficulty position via a unified discriminated-union emit loop**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-22T12:30:06Z
- **Completed:** 2026-06-22T12:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `DIFF_ORDER` constant mapping Difficulty literals to integers (0–3) for clean sort comparisons
- Modified `buildFlatRows.ts` to sort `filteredQuestions` in-place by difficulty after the filter loop
- Replaced the separate default-questions loop and custom-questions loop with a single unified `MergedQuestion` sort, so custom questions appear at their difficulty position instead of being appended at the end
- Added 4 CONT-01 regression tests covering sort order, originalIndex stability, custom merge position, and custom row metadata (isCustom, customId)

## Task Commits

1. **Task 1: Add DIFF_ORDER, sort filteredQuestions, unified merged emit** - `7b1ba46` (feat)
2. **Task 2: Add CONT-01 sort and merge regression tests** - `ea50a2f` (test)

## Files Created/Modified

- `src/utils/buildFlatRows.ts` — Added DIFF_ORDER constant, in-place difficulty sort, replaced two separate emit loops with unified MergedQuestion discriminated union sort
- `src/utils/buildFlatRows.test.ts` — Added mixedDiffSection fixture, 3 new describe blocks, 4 CONT-01 tests (42 total, all pass)

## Decisions Made

- DIFF_ORDER is a separate integer-keyed constant (not reusing DIFFICULTY_COEFFICIENTS floats) for clean integer subtraction in comparators
- filteredQuestions is sorted in-place — safe because it is a locally-built array, not a reference to `topic.questions`
- MergedQuestion discriminated union (`kind: 'default' | kind: 'custom'`) allows a single typed sort comparator and single emit loop
- Score key stability preserved: `index: question.originalIndex` is assigned before sort, unaffected by reorder
- Custom question index field is explicitly noted as cosmetic (score keys use `customId`, per D-10)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors exist in `src/background/index.test.ts`, `src/components/QuestionCard.test.tsx`, `src/components/TopicRow.test.tsx`, and `src/store/app.test.ts` — these are unrelated to this plan's changes and were present before execution. `buildFlatRows.ts` and `buildFlatRows.test.ts` have zero TypeScript errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CONT-01 difficulty sort is complete; questions emit in novice→intermediate→advanced→expert order within every topic
- Custom questions are merged at their difficulty position — ready for verification in the running extension
- Phase 21 Plan 02 (LAYOUT-01 content centering) is independent and can proceed

---
*Phase: 21-layout-content-ordering*
*Completed: 2026-06-22*
