---
phase: 13-filter-overhaul
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/store/app.ts
  - src/components/DifficultyFilter.tsx
  - src/components/DifficultyFilter.test.tsx
  - src/components/SectionFilter.tsx
  - src/components/SectionFilter.test.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase introduces two new filter components (`DifficultyFilter`, `SectionFilter`) and wires them into the existing Zustand store via two new state fields (`selectedDifficulties`, `selectedSections`) and four new actions (`toggleDifficulty`, `toggleSection`, `clearDifficulties`, `clearSections`). The store action logic is correct and the components faithfully represent the documented D-01 / UI-16 / UI-17 semantics.

Three issues surfaced that degrade correctness or robustness at the store level; two informational items address test fragility and a missing gap detail.

## Warnings

### WR-01: `hideNotes` persisted to `uiState` by comment but omitted from subscribe write

**File:** `src/store/app.ts:626-636`

**Issue:** The `AppState` interface documents `hideNotes` as "UI-only, not persisted" (line 68), yet the subscribe block writes `uiState` to storage without it. This is internally consistent _now_, but the doc comment is the only guard. If a future developer adds `hideNotes` to the write block (matching the pattern of `hideMarked`/`darkMode`), the intent is silently violated because the field is present in `DEFAULT_STATE` (line 174) and is restored via the spread `...uiState` in `main.tsx:31`. More critically, `main.tsx` unconditionally spreads the raw `uiState` object from storage back into the store (line 31), so _any_ key that appears in a persisted `uiState` will clobber the in-memory default — including any accidental future persistence of `hideNotes`. The risk is one-directional leak from storage → memory.

**Fix:** Add an explicit exclusion comment at the spread site in `main.tsx` OR add `hideNotes` to a `type PersistedUIState` that does not include it, so TypeScript enforces the boundary:

```ts
// src/store/app.ts — define a persisted-only type
type PersistedUIState = Omit<AppState, 'hideNotes' | 'printMode' | ...>;
```

Alternatively, at minimum document at the subscribe site that `hideNotes` is intentionally excluded, mirroring the comment on the interface field.

---

### WR-02: `switchSession` does not reset filter state (`selectedDifficulties`, `selectedSections`, `searchQuery`, `hideMarked`)

**File:** `src/store/app.ts:362-387`

**Issue:** `switchSession` atomically restores scores, notes, candidate, and sections from storage (lines 379–386), but does NOT reset the active filters (`selectedDifficulties`, `selectedSections`, `searchQuery`, `hideMarked`). These filters are UI state and live in `uiState`, not the session payload — so they persist across session switches. Depending on the product intent, this can produce a jarring experience: a user selects the "advanced" difficulty filter in Session A, switches to Session B, and sees an apparently empty or incomplete question list because the difficulty filter is still active. `resetAll` (line 336–349) resets these filters, but `switchSession` does not call `resetAll` and instead operates on session-payload fields only.

**Fix:** If filters should be global UI state (persist across session switches), this is working as intended — but it should be explicitly documented. If filters should reset on session switch (more ergonomic), add the resets to the `switchSession` set call:

```ts
set((s) => ({
  // ... existing session fields ...
  selectedDifficulties: new Set(),
  selectedSections: new Set(),
  searchQuery: '',
  hideMarked: false,
}));
```

---

### WR-03: `importSession` (overwrite-active path) does not reset filter state, and new-session path resets scoring state but not filters before applying import data

**File:** `src/store/app.ts:591-617`

**Issue:** When `overwriteActive=true`, `importSession` sets scores/notes/candidate (lines 592–600) but leaves `selectedDifficulties`, `selectedSections`, `searchQuery`, and `hideMarked` at whatever the user had active. An imported session that has, say, only `novice` questions will silently show an empty question list if the user had `advanced` selected — no error, just invisible questions.

When `overwriteActive=false`, `createSession()` is called (which calls `switchSession` — see WR-02) and then the import data is applied. The newly created session starts with cleared filters _only_ if `switchSession` cleared them (it doesn't). So the stale filter problem carries over here too.

**Fix:** Add filter resets to both branches of `importSession`:

```ts
set({
  scores: clampedScores,
  overrides: clampedOverrides,
  notes: data.notes,
  topicNotes: data.topicNotes,
  customQuestions: data.customQuestions,
  candidate: data.candidate,
  // Reset filters so imported data is fully visible
  selectedDifficulties: new Set(),
  selectedSections: new Set(),
  searchQuery: '',
  hideMarked: false,
});
```

---

## Info

### IN-01: `totalCount` in `DifficultyFilter` is computed on every render outside `useMemo`

**File:** `src/components/DifficultyFilter.tsx:44-48`

**Issue:** `questionCounts` is memoized (lines 34–42), but `totalCount` is derived from it via plain arithmetic on every render (lines 44–48). Because `questionCounts` is a stable object reference from `useMemo([])`, `totalCount` is always the same value across all renders. This is not a correctness problem, but it is an inconsistency — the engineer took care to memoize the per-difficulty counts but not the total derived from them.

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
  return { questionCounts: counts, totalCount: counts.novice + counts.intermediate + counts.advanced + counts.expert };
}, []);
```

---

### IN-02: `SectionFilter.test.tsx` line 29 hardcodes button count as `10`

**File:** `src/components/SectionFilter.test.tsx:29`

**Issue:** The test asserts `toHaveLength(10)` — computed as 1 ("All sections") + 9 (DEFAULT_SECTIONS entries). This will silently pass even if the count comment is wrong, and will produce a cryptic failure if a section is ever added or removed from DEFAULT_SECTIONS, because the test gives no indication _why_ 10 is expected.

**Fix:** Drive the count from the imported constant so the test is self-documenting and resilient:

```ts
it('renders N buttons (All sections + one per DEFAULT_SECTIONS entry)', () => {
  render(<SectionFilter />);
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(DEFAULT_SECTIONS.length + 1);
});
```

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
