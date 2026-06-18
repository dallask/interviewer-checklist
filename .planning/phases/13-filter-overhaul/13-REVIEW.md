---
phase: 13-filter-overhaul
reviewed: 2026-06-18T14:30:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/store/app.ts
  - src/app/main.tsx
  - src/components/DifficultyFilter.tsx
  - src/components/DifficultyFilter.test.tsx
  - src/components/SectionFilter.tsx
  - src/components/SectionFilter.test.tsx
findings:
  critical: 0
  warning: 0
  info: 3
  total: 3
status: issues_found
---

# Phase 13: Code Review Report (Re-review after iteration 2 fixes)

**Reviewed:** 2026-06-18T14:30:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found (info only)

## Summary

This is a final re-review following the two iteration 2 fixes: `PersistedUIState` type enforcement (WR-01) and count badge contrast on selected filter buttons (WR-02).

**WR-01 resolved and verified.** `PersistedUIState` is exported from `src/store/app.ts` (lines 650-660) as an explicit 9-field type. The `satisfies PersistedUIState` operator is applied to the `uiState` object literal inside the subscribe block (line 680), making `hideNotes` exclusion a compile-time guarantee rather than a prose comment. `src/app/main.tsx` line 25 now casts the storage read as `Partial<PersistedUIState>` (replacing the previous `Partial<AppState>`). TypeScript strict-mode type check (`tsc --noEmit`) reports zero errors in all six reviewed files. The fix is correct and complete.

**WR-02 resolved and verified.** Both `DifficultyFilter` and `SectionFilter` now apply conditional text color to count badge `<span>` elements. `DifficultyFilter` uses `text-blue-200 dark:text-blue-300` for selected buttons (solid `bg-blue-600` background) and `text-gray-400 dark:text-gray-500` for unselected — applied to both the "All levels" row (lines 67-71) and individual difficulty rows (lines 95-99). `SectionFilter` uses `text-blue-500 dark:text-blue-400` for selected buttons (light `bg-blue-50` tint) and `text-gray-400 dark:text-gray-500` for unselected — applied to both the "All sections" row (lines 38-42) and individual section rows (lines 64-68). The contrast pairing is appropriate: `text-blue-500` on `bg-blue-50` and `text-blue-200` on `bg-blue-600` are both readable. All 22 tests pass.

No new Critical or Warning findings were identified in this pass. Three pre-existing Info findings from the previous review were not addressed by the fixer (they were out of scope for the critical-warning fixer), and they remain open.

## Info

### IN-01: `totalCount` in `DifficultyFilter` computed outside `useMemo`

**File:** `src/components/DifficultyFilter.tsx:44-48`

**Issue:** `questionCounts` is memoized with `useMemo([])` (lines 34-42) and is a stable object reference, but `totalCount` is derived from it via plain arithmetic on every render (lines 44-48). The value is always identical across renders. Not a correctness problem since the memo dependency is stable, but inconsistent with the explicit memoization strategy applied to the per-difficulty counts.

**Fix:** Fold `totalCount` into the same `useMemo`:

```ts
const { questionCounts, totalCount } = useMemo(() => {
  const all = DEFAULT_SECTIONS.flatMap(s => s.items).flatMap(t => t.questions);
  const counts = {
    novice: all.filter(q => q.level === 'novice').length,
    intermediate: all.filter(q => q.level === 'intermediate').length,
    advanced: all.filter(q => q.level === 'advanced').length,
    expert: all.filter(q => q.level === 'expert').length,
  };
  return {
    questionCounts: counts,
    totalCount: counts.novice + counts.intermediate + counts.advanced + counts.expert,
  };
}, []);
```

---

### IN-02: `SectionFilter.test.tsx` hardcodes button count as `10`

**File:** `src/components/SectionFilter.test.tsx:32`

**Issue:** The test asserts `toHaveLength(10)` — 1 ("All sections") + 9 (`DEFAULT_SECTIONS` entries). `DEFAULT_SECTIONS` currently has 9 entries, so the test passes. However, if a section is added or removed from `DEFAULT_SECTIONS`, the test will fail with an opaque count mismatch rather than a self-documenting failure message.

**Fix:** Drive the expected count from the imported constant:

```ts
it('renders N buttons (All sections + one per DEFAULT_SECTIONS entry)', () => {
  render(<SectionFilter />);
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(DEFAULT_SECTIONS.length + 1);
});
```

---

### IN-03: `SectionFilter` buttons have no gap between icon and label

**File:** `src/components/SectionFilter.tsx:30, 56`

**Issue:** Both the "All sections" row and the per-section rows use `flex items-center` without a `gap-*` class. The icon `<span>` and the `<span className="flex-1">` label sibling are flush against each other. `DifficultyFilter` uses `gap-2` on the same flex container structure (lines 59 and 84). This inconsistency produces tighter visual spacing in `SectionFilter` than in `DifficultyFilter`.

**Fix:** Add `gap-2` to both button `className` strings in `SectionFilter`:

```tsx
// "All sections" row (line 30)
className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ...`}

// Per-section rows (line 56)
className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ...`}
```

---

_Reviewed: 2026-06-18T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
