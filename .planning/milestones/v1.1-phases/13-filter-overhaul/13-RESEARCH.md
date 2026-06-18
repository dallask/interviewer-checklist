# Phase 13: Filter Overhaul - Research

**Researched:** 2026-06-18
**Domain:** React component modification, Zustand store actions, useMemo, Tailwind v4 UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: "All" row is highlighted (pressed) when the corresponding Set is **empty**. Clicking "All" when already empty is a no-op. Clicking "All" when non-empty calls `clearDifficulties()` / `clearSections()`.
- D-02: Per-row counts are **global** — they count raw questions in `DEFAULT_SECTIONS` only. No cross-filtering between difficulty and section. Counts derived from `DEFAULT_SECTIONS`, not from custom questions.
- D-03: Add `clearDifficulties()` and `clearSections()` as separate thin actions in `src/store/app.ts`. Do NOT repurpose `toggleDifficulty` / `toggleSection` with a sentinel value.
- D-04: Difficulty labels normalized — Novice / Intermediate / Advanced / Expert (drop multiplier text). Updated in-place in `DIFFICULTY_LABELS` map.
- D-05: Count computation via `useMemo` in each component with empty dependency array `[]`. Phase-14-ready.
- D-06: Color dots as inline `<span>` with static Tailwind classes: novice `bg-green-500`, intermediate `bg-blue-500`, advanced `bg-orange-500`, expert `bg-pink-500`. Size `w-2 h-2 rounded-full flex-shrink-0`.
- D-07: SectionFilter right slot replaces score mark with question count. Remove `scores`, `overrides`, `customQuestions`, `computeTopicMark`, `computeSectionMark`, `BAND_COLORS`, `MarkBand` imports.
- D-08: SectionFilter emoji from `section.icon` directly — no hardcoded emoji map.

### Claude's Discretion

- Test structure for new coverage (add tests for new "All" row behavior and updated labels; follow existing mock pattern)
- Exact insertion point and formatting of new store actions

### Deferred Ideas (OUT OF SCOPE)

- Custom question counts in per-row badge (Phase 14)
- Cross-filter counts (rejected — global counts only)
- Editable bank (Phase 14)
- Sidebar sticky header/footer (Phase 15)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-16 | DifficultyFilter: "All levels" first row (∞ icon), color dot per difficulty, per-difficulty question count | D-01 thru D-06; `useMemo` over `DEFAULT_SECTIONS`; store `clearDifficulties` |
| UI-17 | SectionFilter: "All sections" first row (📋 icon), `section.icon` emoji, per-section question count (replaces score) | D-01, D-02, D-07, D-08; `useMemo`; store `clearSections`; remove scoring imports |
</phase_requirements>

---

## Summary

Phase 13 is a pure codebase-modification phase — no new packages, no new dependencies. It modifies two existing filter components (`DifficultyFilter.tsx`, `SectionFilter.tsx`) and extends the Zustand store with two thin clear actions. All required types, data structures, and styling patterns are already present in the codebase.

The two filter components follow identical structural patterns: a `useAppStore` selector hook with a mock-per-test pattern in tests, `aria-pressed` buttons, Tailwind classes for pressed/unpressed state, and `focus-visible:ring-2 focus-visible:ring-blue-500` focus rings. The "All" row slots in before the existing rows using the same button element structure. Count computation uses `useMemo` with an empty dependency array since `DEFAULT_SECTIONS` is a compile-time constant in v1.1.

The primary test complication is that **existing DifficultyFilter tests use the label text "beginner" (from the old multiplier label "Beginner (1.00×)")** — these queries must be updated to match the new normalized label "Novice". SectionFilter tests must remove mock fields `scores`, `overrides`, `customQuestions` from store selectors after the scoring imports are removed, and the tests for "marks" (e.g., `queryAllByText('—')`) must be replaced with count-based assertions.

**Primary recommendation:** Three-file change — `DifficultyFilter.tsx`, `SectionFilter.tsx`, `src/store/app.ts` — plus updates to both test files. One plan is sufficient.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Filter state (selected sets) | Store (Zustand) | — | Persisted UI state; already lives in `selectedDifficulties` / `selectedSections` Sets |
| Clear-all filter actions | Store (Zustand) | — | Two new `clearDifficulties` / `clearSections` actions follow `toggleDifficulty` / `toggleSection` pattern |
| Question count computation | Component (useMemo) | — | Derived from static bank data; no reason to store derived data in Zustand |
| Visual indicators (dots, emoji, icons) | Component (JSX) | — | Pure rendering; no business logic |
| aria-pressed semantics | Component (JSX) | — | Computed inline from Set size / Set.has() |

---

## Standard Stack

### Core (no new packages — all existing)

| Library | Existing Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| React | existing in project | Component rendering, `useMemo` hook | Already used throughout |
| Zustand | existing in project | Store actions `clearDifficulties` / `clearSections` | Existing store pattern |
| Tailwind v4 | existing in project | Utility classes for dots, counts, pressed states | Project styling system |
| Vitest + @testing-library/react | existing in project | Component tests | Existing test framework |

**No new packages are installed in this phase.** [VERIFIED: codebase scan]

---

## Package Legitimacy Audit

No external packages are added in Phase 13. This section is not applicable.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User click "All levels" / "All sections"
         │
         ▼
  clearDifficulties() / clearSections()   ← new store actions
         │
         ▼
  selectedDifficulties / selectedSections Set  ← becomes new Set()
         │ (Zustand reactive update)
         ▼
  DifficultyFilter / SectionFilter re-renders
         │
         ├─► "All" row: aria-pressed = true (Set.size === 0)
         └─► Individual rows: aria-pressed = false (Set.has() = false)

User click individual difficulty/section row
         │
         ▼
  toggleDifficulty(d) / toggleSection(id)  ← unchanged
         │
         ▼
  Set gains/loses entry
         │ (Zustand reactive update)
         ▼
  Components re-render; "All" row: aria-pressed = false (Set.size > 0)

DEFAULT_SECTIONS (compile-time constant)
         │
         ▼
  useMemo(fn, [])  ← runs once at mount
         │
         ├─► questionCounts: { novice: N, intermediate: N, advanced: N, expert: N }
         └─► sectionCounts: { [sectionId]: N, ... }
         │
         ▼
  Count badge <span> rendered in each row
```

### Recommended Project Structure

No new folders or files needed. Changes are in-place modifications to:

```
src/
├── store/
│   └── app.ts              # Add clearDifficulties, clearSections (after toggleSection ~line 283)
└── components/
    ├── DifficultyFilter.tsx # UI-16: All row, dots, counts, normalized labels
    ├── DifficultyFilter.test.tsx  # Update label queries + add All row tests
    ├── SectionFilter.tsx    # UI-17: All row, section.icon, count (remove scoring imports)
    └── SectionFilter.test.tsx    # Remove scoring mock fields + add All row tests
```

### Pattern 1: Store Clear Actions

**What:** Two new thin actions after `toggleSection` in `src/store/app.ts`.

**When to use:** "All" row click handler when `selectedDifficulties.size > 0` / `selectedSections.size > 0`.

**Example:**
```typescript
// Source: CONTEXT.md D-03 / existing resetAll pattern (store line ~339)
clearDifficulties: () => set({ selectedDifficulties: new Set() }),
clearSections: () => set({ selectedSections: new Set() }),
```

Interface entries go in `AppActions` (after `toggleSection: (id: string) => void;`).

### Pattern 2: useMemo Count Computation

**What:** Compute per-difficulty and per-section question counts once at mount.

**When to use:** Both filter components. Empty dep array `[]` — counts are effectively static in v1.1; Phase 14 will add `[customQuestions]`.

**Example:**
```typescript
// Source: CONTEXT.md D-05
const questionCounts = useMemo(() => {
  const all = DEFAULT_SECTIONS.flatMap(s => s.items).flatMap(t => t.questions);
  return {
    novice: all.filter(q => q.level === 'novice').length,
    intermediate: all.filter(q => q.level === 'intermediate').length,
    advanced: all.filter(q => q.level === 'advanced').length,
    expert: all.filter(q => q.level === 'expert').length,
  };
}, []);

// SectionFilter variant:
const sectionCounts = useMemo(
  () => Object.fromEntries(
    DEFAULT_SECTIONS.map(s => [s.id, s.items.reduce((n, t) => n + t.questions.length, 0)])
  ),
  []
);
```

### Pattern 3: "All" Row Button

**What:** A button prepended before the existing rows, using the same `aria-pressed` + Tailwind pressed/unpressed pattern as existing rows.

**When to use:** First row in both filter components.

**Example (DifficultyFilter):**
```tsx
// Source: CONTEXT.md D-01, D-05; UI-SPEC.md Component Inventory
<button
  type="button"
  aria-pressed={selectedDifficulties.size === 0}
  onClick={() => { if (selectedDifficulties.size > 0) clearDifficulties(); }}
  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-full text-left focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
    selectedDifficulties.size === 0
      ? 'bg-blue-600 text-white dark:bg-blue-500'
      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  }`}
>
  <span aria-hidden="true">∞</span>
  All levels
  <span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-gray-500">
    {questionCounts.novice + questionCounts.intermediate + questionCounts.advanced + questionCounts.expert}
  </span>
</button>
```

**Example (SectionFilter):**
```tsx
// Source: CONTEXT.md D-01; UI-SPEC.md Component Inventory
<button
  type="button"
  aria-pressed={selectedSections.size === 0}
  onClick={() => { if (selectedSections.size > 0) clearSections(); }}
  className={`w-full flex items-center px-3 py-2 text-sm text-left text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
    selectedSections.size === 0
      ? 'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
      : 'border-l-2 border-transparent'
  }`}
>
  <span aria-hidden="true">📋</span>
  All sections
  <span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-gray-500">
    {Object.values(sectionCounts).reduce((a, b) => a + b, 0)}
  </span>
</button>
```

### Pattern 4: Color Dot (DifficultyFilter)

**What:** An 8×8px `aria-hidden` dot placed before the label in each difficulty row.

**Example:**
```tsx
// Source: CONTEXT.md D-06; UI-SPEC.md Color section
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};

// Inside the button:
<span aria-hidden="true" className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_CLASSES[difficulty]}`} />
```

### Pattern 5: Section Icon + Count (SectionFilter)

**What:** Replace the score mark right-slot with count badge; add section emoji from `section.icon` before the label.

**Example:**
```tsx
// Source: CONTEXT.md D-07, D-08
<button ...>
  <span aria-hidden="true">{section.icon}</span>
  <span className="flex-1">{section.label}</span>
  <span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-gray-500">
    {sectionCounts[section.id] ?? 0}
  </span>
</button>
```

### Anti-Patterns to Avoid

- **Using `toggleDifficulty(null)` as "clear all" sentinel:** Breaks TypeScript type safety and the toggle semantics. Use `clearDifficulties()` exclusively. [VERIFIED: CONTEXT.md D-03]
- **Storing count in Zustand state:** Counts are derived from static bank data. Storing them adds unnecessary reactivity surface and is inconsistent with the pattern used for other derived values.
- **Calculating counts on every render without `useMemo`:** `DEFAULT_SECTIONS` is large; recalculating inside the render body (without memoization) causes unnecessary work on each store subscription update.
- **Removing `aria-pressed` from "All" rows:** The "All" row IS a toggle button; omitting `aria-pressed` violates the existing a11y contract. [VERIFIED: CONTEXT.md code context]
- **Hardcoding section emoji:** Section icons already live in `Section.icon`. Using a separate emoji map creates a divergence risk when bank data changes. [VERIFIED: codebase grep; all 9 sections have `icon` field]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question count aggregation | Custom recursive walker | `DEFAULT_SECTIONS.flatMap().filter()` or `reduce()` | One-liner; bank structure is flat enough |
| Store clear actions | Custom "select all" logic with toggle loops | `set({ selectedDifficulties: new Set() })` | Already the `resetAll` pattern; simpler, faster |
| Pressed-state styling | Custom CSS module or className logic | Ternary over existing Tailwind classes | Already established pattern in both components |

---

## Common Pitfalls

### Pitfall 1: Existing DifficultyFilter tests use "beginner" label text

**What goes wrong:** Tests query `getByRole('button', { name: /beginner/i })` — this passes today but the label is changing from `'Beginner (1.00×)'` to `'Novice'`. After the component change, these queries return `null` and tests fail with "Unable to find an accessible element with the role 'button' and name matching /beginner/i".

**Why it happens:** The test was written against the old label map. D-04 renames the label.

**How to avoid:** Update `DifficultyFilter.test.tsx` queries to `/novice/i` when modifying the component. Also update the button count test — the component will have 5 buttons (1 "All" + 4 difficulties) instead of 4.

**Warning signs:** `getByRole` throws during test run.

### Pitfall 2: Existing SectionFilter tests assert on scoring mock fields

**What goes wrong:** The `beforeEach` mock provides `scores`, `overrides`, `customQuestions` to the store selector. After removing scoring imports and the scoring computation, the component no longer subscribes to those fields — but leftover mock data is harmless. More importantly, tests that assert on `queryAllByText('—')` (9 dash placeholders) will fail because the right slot now shows numeric counts, not score marks.

**Why it happens:** D-07 replaces the score mark with a count badge.

**How to avoid:** Replace score-related test assertions with count-based assertions. The count badge always shows a positive integer (never `'—'`). Remove `scores`, `overrides`, `customQuestions` from the mock store selector after the component no longer reads them.

**Warning signs:** `expect(marks).toHaveLength(9)` where `marks = screen.getAllByText('—')` throws because `'—'` is no longer rendered.

### Pitfall 3: "All" row button count in tests

**What goes wrong:** Test `expect(buttons).toHaveLength(4)` in `DifficultyFilter.test.tsx` and `expect(buttons).toHaveLength(9)` in `SectionFilter.test.tsx` will fail after adding the "All" row.

**How to avoid:** Update expected counts to 5 (DifficultyFilter: 1 All + 4) and 10 (SectionFilter: 1 All + 9).

### Pitfall 4: aria-pressed on "All" row when Set is empty vs non-empty

**What goes wrong:** Setting `aria-pressed={selectedDifficulties.size === 0}` is a boolean — React renders it as the string `"true"` or `"false"`. Some test patterns check `.toHaveAttribute('aria-pressed', 'true')`. This is correct behavior, but the test mock must supply `selectedDifficulties: new Set()` for the "All" row to be pressed and individual rows to be not-pressed — the inverse of how individual rows behave.

**How to avoid:** The "All levels" / "All sections" button is pressed when the Set is empty. Individual row buttons are pressed when the Set contains the item. Tests for "All" row must invert the mock state vs. individual row tests.

### Pitfall 5: Store subscribe block — serialization already handles new Set()

**What goes wrong:** Concern that `clearDifficulties()` producing `new Set()` might serialize incorrectly.

**Why it's not an issue:** The existing `subscribe` block already does `[...state.selectedDifficulties]` (line 627). `[...new Set()]` = `[]`. On rehydration, `new Set([])` = `new Set()`. The clear actions are safe without any subscribe changes. [VERIFIED: codebase; store line 627]

### Pitfall 6: Tailwind static class scanning for dot classes

**What goes wrong:** If `DOT_CLASSES[difficulty]` uses a runtime-constructed string like `` `bg-${color}-500` ``, Tailwind's content scanner cannot detect the classes and omits them from the production bundle.

**How to avoid:** Declare the full dot class strings as static literals in a Record (same pattern used by the existing `BAND_COLORS` constant in SectionFilter). Example:
```ts
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};
```
[VERIFIED: CONTEXT.md D-06; existing BAND_COLORS pattern in SectionFilter.tsx lines 8-14]

---

## Code Examples

### Verified pattern: clearDifficulties in store

```typescript
// Source: CONTEXT.md D-03; existing resetAll pattern at store line ~339
// Insert after toggleSection (line ~283), before setHideMarked

clearDifficulties: () => set({ selectedDifficulties: new Set() }),
clearSections: () => set({ selectedSections: new Set() }),
```

AppActions interface additions (after `toggleSection: (id: string) => void;`):
```typescript
clearDifficulties: () => void;
clearSections: () => void;
```

### Verified pattern: DifficultyFilter mock in tests

The existing mock pattern from `DifficultyFilter.test.tsx` must be extended with the new store fields:

```typescript
// Source: DifficultyFilter.test.tsx lines 18-23 (existing pattern to extend)
mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
  selector({
    selectedDifficulties: new Set(),
    toggleDifficulty,
    clearDifficulties,   // new
  }),
);
```

### Verified pattern: SectionFilter mock in tests

```typescript
// Source: SectionFilter.test.tsx lines 18-27 (existing pattern — remove scoring fields)
mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
  selector({
    selectedSections: new Set(),
    toggleSection,
    clearSections,       // new
    // scores, overrides, customQuestions — REMOVED (D-07)
  }),
);
```

### Verified pattern: "All" row aria-pressed test assertion

```typescript
// New test for "All levels" pressed state
it('"All levels" row has aria-pressed="true" when no difficulties selected', () => {
  render(<DifficultyFilter />);
  const allBtn = screen.getByRole('button', { name: /all levels/i });
  expect(allBtn).toHaveAttribute('aria-pressed', 'true');
});

it('"All levels" row has aria-pressed="false" when a difficulty is selected', () => {
  mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      selectedDifficulties: new Set(['novice']),
      toggleDifficulty,
      clearDifficulties: vi.fn(),
    }),
  );
  render(<DifficultyFilter />);
  const allBtn = screen.getByRole('button', { name: /all levels/i });
  expect(allBtn).toHaveAttribute('aria-pressed', 'false');
});

it('clicking "All levels" calls clearDifficulties when a difficulty is selected', () => {
  const clearDifficulties = vi.fn();
  mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      selectedDifficulties: new Set(['novice']),
      toggleDifficulty,
      clearDifficulties,
    }),
  );
  render(<DifficultyFilter />);
  fireEvent.click(screen.getByRole('button', { name: /all levels/i }));
  expect(clearDifficulties).toHaveBeenCalledTimes(1);
});

it('clicking "All levels" is a no-op when no difficulties are selected', () => {
  const clearDifficulties = vi.fn();
  mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      selectedDifficulties: new Set(),
      toggleDifficulty,
      clearDifficulties,
    }),
  );
  render(<DifficultyFilter />);
  fireEvent.click(screen.getByRole('button', { name: /all levels/i }));
  expect(clearDifficulties).not.toHaveBeenCalled();
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DifficultyFilter: labels include multiplier text ("Beginner (1.00×)") | Normalized: "Novice" | Phase 13 (this phase) | Test label queries must be updated |
| SectionFilter: right slot shows live score mark + band color | Right slot shows static question count | Phase 13 (this phase) | Scoring imports removed; simpler component |
| No "All" row in either filter | "All" row prepended; pressed when Set empty | Phase 13 (this phase) | Button count in tests increases by 1 each |

**Deprecated/outdated in this phase:**

- `BAND_COLORS` constant in SectionFilter: removed (no longer needed after D-07)
- `computeTopicMark` / `computeSectionMark` imports in SectionFilter: removed
- `scores`, `overrides`, `customQuestions` store subscriptions in SectionFilter: removed
- `DIFFICULTY_LABELS` multiplier text (`'Beginner (1.00×)'` etc.): replaced with plain names

---

## Assumptions Log

No claims in this research are `[ASSUMED]`. All findings were verified directly from the codebase.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims in this research were verified from the codebase or CONTEXT.md / UI-SPEC.md — no user confirmation needed.**

---

## Open Questions

None. The CONTEXT.md and UI-SPEC.md are fully specified. All implementation details are locked.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is codebase-only, no new tools or services required).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (happy-dom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-16 | DifficultyFilter renders 5 buttons (All + 4) | unit | `npm test -- --reporter=verbose` | ✅ `DifficultyFilter.test.tsx` (needs update) |
| UI-16 | "All levels" `aria-pressed=true` when Set empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-16 | "All levels" `aria-pressed=false` when Set non-empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-16 | Clicking "All levels" calls `clearDifficulties` when Set non-empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-16 | Clicking "All levels" is no-op when Set empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-16 | Color dot rendered per difficulty row | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-16 | Normalized labels (Novice not Beginner) | unit | `npm test` | ✅ Existing test needs update (label query) |
| UI-17 | SectionFilter renders 10 buttons (All + 9) | unit | `npm test` | ✅ `SectionFilter.test.tsx` (needs update: count 9→10) |
| UI-17 | "All sections" `aria-pressed=true` when Set empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-17 | "All sections" `aria-pressed=false` when Set non-empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-17 | Clicking "All sections" calls `clearSections` when Set non-empty | unit | `npm test` | ❌ Wave 0 gap — new test needed |
| UI-17 | Count badge shows integer (not "—") | unit | `npm test` | ✅ Existing `'—'` count test needs inversion |
| UI-17 | Section emoji from `section.icon` rendered | unit | `npm test` | ❌ Wave 0 gap — new test needed |

### Coverage note

`vitest.config.ts` includes `src/store/**` at 90% threshold. The two new actions (`clearDifficulties`, `clearSections`) add branches to `app.ts`. Since they are trivial one-line setters matching the `resetAll` pattern, existing store tests do not need changes — but if the store file is under branch coverage scrutiny, the filter component tests (which call the store via mock) will provide indirect coverage.

Component files (`src/components/`) are NOT in the coverage `include` list — no coverage threshold failures expected.

### Sampling Rate

- **Per task commit:** `npm test -- --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (598+ tests) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] New test cases in `DifficultyFilter.test.tsx` — "All levels" row behavior (aria-pressed, click handler, no-op guard), color dot presence, normalized labels
- [ ] New test cases in `SectionFilter.test.tsx` — "All sections" row behavior (aria-pressed, click handler, no-op guard), `section.icon` emoji, count badge replaces score mark
- [ ] Updated existing tests in both files: button count (4→5, 9→10), label queries (/beginner/i → /novice/i), remove score-based assertions

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Filter state is a Set of known string literals (Difficulty union, section IDs from bank); no user-typed input |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via emoji rendering | Tampering | Not applicable — `section.icon` values are static string literals from the compiled bank module, not user-provided data |

No security changes required in this phase. The filter components receive input only from the Zustand store (typed Set values) and the static bank data module.

---

## Sources

### Primary (HIGH confidence — verified from codebase)

- `src/components/DifficultyFilter.tsx` — current 44-line component; full source read
- `src/components/SectionFilter.tsx` — current 72-line component; scoring imports confirmed for removal
- `src/store/app.ts` — full 657-line store; insertion point for new actions verified (line ~283, after `toggleSection`)
- `src/data/bank/types.ts` — `Difficulty` union, `Section.icon: string` field confirmed
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` export confirmed; 9 sections
- `src/data/bank/*.ts` — all 9 section files verified to have `icon:` field
- `src/components/DifficultyFilter.test.tsx` — existing test patterns; stale label queries identified
- `src/components/SectionFilter.test.tsx` — existing test patterns; scoring-based assertions identified for replacement
- `vitest.config.ts` — test framework, coverage config, environment (happy-dom)
- `src/test/setup.ts` — `@testing-library/jest-dom/vitest` + `vitest-chrome` confirmed
- `.planning/phases/13-filter-overhaul/13-CONTEXT.md` — all 8 implementation decisions
- `.planning/phases/13-filter-overhaul/13-UI-SPEC.md` — visual/interaction contract
- `.planning/REQUIREMENTS.md` — UI-16, UI-17 confirmed in scope
- `.planning/ROADMAP.md` — Phase 13 success criteria

### Secondary (MEDIUM confidence)

None needed — all findings are from direct codebase reads.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; existing stack verified by codebase read
- Architecture: HIGH — all patterns verified from existing component and store code
- Pitfalls: HIGH — identified from direct comparison of existing test assertions vs. planned component changes
- Test patterns: HIGH — test file structure verified; failing assertions identified specifically

**Research date:** 2026-06-18
**Valid until:** Stable — this phase operates on static bank data and existing store patterns; no external API or package version concerns.
