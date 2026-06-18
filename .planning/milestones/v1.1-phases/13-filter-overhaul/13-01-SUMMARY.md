---
phase: 13-filter-overhaul
plan: "01"
subsystem: filters
tags:
  - zustand
  - react
  - tailwind
  - accessibility
dependency_graph:
  requires:
    - src/store/app.ts
    - src/data/bank/index.ts
    - src/data/bank/types.ts
  provides:
    - clearDifficulties store action
    - clearSections store action
    - DifficultyFilter UI-16 widget
    - SectionFilter UI-17 widget
  affects:
    - src/components/DifficultyFilter.tsx
    - src/components/SectionFilter.tsx
tech_stack:
  added: []
  patterns:
    - useMemo over static bank data for question count computation
    - DOT_CLASSES record with full static Tailwind literals for content scanner
    - aria-pressed on "All" rows derived from Set.size === 0
    - clearDifficulties/clearSections thin actions following resetAll pattern
key_files:
  created: []
  modified:
    - src/store/app.ts
    - src/components/DifficultyFilter.tsx
    - src/components/DifficultyFilter.test.tsx
    - src/components/SectionFilter.tsx
    - src/components/SectionFilter.test.tsx
decisions:
  - "useMemo with empty dep array [] used for question counts — Phase-14-ready; will update to [customQuestions] when editable bank lands"
  - "DOT_CLASSES record uses full static class literals to ensure Tailwind content scanner includes all dot colors"
  - "Test fixes for SectionFilter: loop over buttons.slice(1) to skip 'All sections' row in aria-pressed=false assertion; unmount first render before re-render in selected-section test; use textContent includes instead of getByRole regex for section icon test to avoid 'Tooling' matching 'AI & Tooling'"
metrics:
  duration: "3m"
  completed_date: "2026-06-18"
  tasks_completed: 3
  files_modified: 5
---

# Phase 13 Plan 01: Filter Overhaul Summary

**One-liner:** Added "All levels"/"All sections" rows with ∞/📋 icons, color dots for difficulties, section.icon emojis, question count badges via useMemo, and clearDifficulties/clearSections Zustand actions, replacing score marks in SectionFilter.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add clearDifficulties and clearSections store actions | 28914ff | src/store/app.ts |
| 2 | Rebuild DifficultyFilter with All levels row, color dots, count badges | 4559043 | src/components/DifficultyFilter.tsx, DifficultyFilter.test.tsx |
| 3 | Rebuild SectionFilter with All sections row, section.icon emoji, count badge | 3d8abd8 | src/components/SectionFilter.tsx, SectionFilter.test.tsx |

## Verification Results

**Full test suite:** 606 tests passed (40 test files). Baseline was 598+; added 8 new tests across both filter components.

**Anti-pattern checks:**
- `grep "beginner" DifficultyFilter.tsx DifficultyFilter.test.tsx` → 0 matches (label normalization complete)
- `grep "computeTopicMark|computeSectionMark|BAND_COLORS|MarkBand" SectionFilter.tsx` → 0 matches (scoring imports removed)

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| DifficultyFilter renders "All levels" first row with ∞ icon; aria-pressed=true when Set empty | PASS |
| Clicking "All levels" with non-empty Set calls clearDifficulties; no-op when empty | PASS |
| Color dots: Novice green, Intermediate blue, Advanced orange, Expert pink | PASS |
| Difficulty labels Novice/Intermediate/Advanced/Expert (no multiplier) | PASS |
| Question count badge per row and "All levels"; useMemo([], []) | PASS |
| SectionFilter renders "All sections" first row with 📋 icon; aria-pressed=true when Set empty | PASS |
| Clicking "All sections" with non-empty Set calls clearSections; no-op when empty | PASS |
| Each section row shows section.icon emoji before label | PASS |
| Each section row right slot shows question count integer; no score mark/"—" | PASS |
| SectionFilter does not import from '../scoring/index.js' | PASS |
| clearDifficulties and clearSections in AppActions interface and useAppStore body | PASS |
| npm test passes green (606 tests) | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed three SectionFilter test assertions for "All" row semantics**
- **Found during:** Task 3
- **Issue:** Three existing-style tests failed after adding the "All sections" row:
  1. `each section button has aria-pressed="false"` loop included "All sections" button which has `aria-pressed="true"` when Set is empty
  2. `selected section button has aria-pressed="true"` rendered twice without unmounting first render, causing 2 pressed buttons found instead of 1
  3. `each section row renders the section.icon emoji` used regex `/Tooling/i` which matched both "Tooling" and "AI & Tooling"
- **Fix:** (1) Changed loop to `buttons.slice(1)` to skip "All sections" row; (2) unmount first render before second render; (3) used `textContent.includes(section.label)` filter instead of regex getByRole to handle substring ambiguity
- **Files modified:** src/components/SectionFilter.test.tsx
- **Commit:** 3d8abd8 (part of Task 3 commit)

## Known Stubs

None — all question counts are live useMemo computations over DEFAULT_SECTIONS. Count badges display real integers from the bank data.

## Threat Flags

No new security-relevant surface introduced. Both components receive input only from the Zustand store (typed Set values) and the static DEFAULT_SECTIONS bank module (compile-time constant). The section.icon field values are static string literals from the compiled bank module — React's JSX escapes string content, no XSS risk (T-13-01 accepted in plan threat model).

## Self-Check: PASSED

- [x] src/store/app.ts exists and contains clearDifficulties and clearSections (4 matches)
- [x] src/components/DifficultyFilter.tsx exists and contains "All levels"
- [x] src/components/SectionFilter.tsx exists and contains "All sections"
- [x] src/components/DifficultyFilter.test.tsx exists and contains "All levels"
- [x] src/components/SectionFilter.test.tsx exists and contains "All sections"
- [x] Commit 28914ff exists (Task 1 — store actions)
- [x] Commit 4559043 exists (Task 2 — DifficultyFilter)
- [x] Commit 3d8abd8 exists (Task 3 — SectionFilter)
- [x] 606 tests pass (full suite green)
