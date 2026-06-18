---
phase: 13-filter-overhaul
fixed_at: 2026-06-18T12:30:00Z
review_path: .planning/phases/13-filter-overhaul/13-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-06-18T12:30:00Z
**Source review:** .planning/phases/13-filter-overhaul/13-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 2 (WR-01, WR-02 — critical_warning scope)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-02: Count badge color is invisible when a filter button is selected

**Files modified:** `src/components/DifficultyFilter.tsx`, `src/components/SectionFilter.tsx`
**Commit:** 79f16d7
**Applied fix:** Changed the count badge `<span>` className from an unconditional `text-gray-400 dark:text-gray-500` to a conditional expression. In `DifficultyFilter`, the "All levels" badge uses `text-blue-200 dark:text-blue-300` when `selectedDifficulties.size === 0` (selected state) and the per-difficulty badges use `text-blue-200 dark:text-blue-300` when `isSelected`. In `SectionFilter`, which uses a light `bg-blue-50` highlight instead of solid blue, the badges use `text-blue-500 dark:text-blue-400` when selected — providing adequate contrast against the tinted background without harsh contrast. Unselected state retains `text-gray-400 dark:text-gray-500` in both components.

---

### WR-01: `hideNotes` persistence boundary enforced only by comment, not by type

**Files modified:** `src/store/app.ts`, `src/app/main.tsx`
**Commit:** 288489f
**Applied fix:** Introduced an exported `PersistedUIState` type in `src/store/app.ts` (above the subscribe block) that explicitly enumerates only the nine fields written to storage (`sidebarOpen`, `sectionOpen`, `groupOpen`, `topicOpen`, `searchQuery`, `selectedDifficulties`, `selectedSections`, `hideMarked`, `darkMode`). Applied `satisfies PersistedUIState` to the `uiState` object literal inside the subscribe block — TypeScript will now raise an excess-property error if `hideNotes`, `printMode`, or any other transient field is accidentally added. Updated `src/app/main.tsx` line 25 to cast the storage read as `Partial<PersistedUIState>` instead of `Partial<AppState>`, enforcing the same contract at the read site. Removed the now-unused `AppState` import from `main.tsx`. The comment explaining `hideNotes` exclusion was updated to reference the `PersistedUIState` type rather than merely pointing at the comment.

Note: The reviewer's suggested `Omit<AppState, ...>` approach was adapted to an explicit type listing instead, which is clearer as documentation of intent and avoids future fragility from new fields added to `AppState` silently becoming "persisted by default."

---

_Fixed: 2026-06-18T12:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
