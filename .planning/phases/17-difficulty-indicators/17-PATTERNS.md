# Phase 17: Difficulty Indicators - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** 2 (1 modified component, 1 modified test)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/QuestionCard.tsx` | component | request-response (render) | `src/components/DifficultyFilter.tsx` (color map pattern) + `src/components/QuestionCard.tsx` (badge chip pattern, self) | exact — both patterns are already in the codebase |
| `src/components/QuestionCard.test.tsx` | test | — | `src/components/QuestionCard.test.tsx` (existing custom badge tests) | exact |

## Pattern Assignments

### `src/components/QuestionCard.tsx` (component, render)

This file is modified, not created. Two patterns are merged in: the static `Record<Difficulty, string>` color-map pattern from `DifficultyFilter.tsx`, and the badge chip pattern already present in `QuestionCard.tsx` itself.

---

#### Pattern A: Static Color Maps (D-06) — copy from `src/components/DifficultyFilter.tsx` lines 1-25

**Imports pattern** (lines 1-3 of DifficultyFilter.tsx — add `Difficulty` import to QuestionCard.tsx):
```typescript
import type { Difficulty } from '../data/bank/types.js';
```

**Static color map pattern** (DifficultyFilter.tsx lines 19-25):
```typescript
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};
```

**Replicate as two maps in QuestionCard.tsx** (place after imports, before the `interface Props` block):
```typescript
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
// Matches DifficultyFilter.tsx DOT_CLASSES border color scheme for cross-component consistency
const BORDER_CLASSES: Record<Difficulty, string> = {
  novice:       'border-green-500',
  intermediate: 'border-blue-500',
  advanced:     'border-orange-500',
  expert:       'border-pink-500',
};

const BADGE_CLASSES: Record<Difficulty, string> = {
  novice:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert:       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};
```

---

#### Pattern B: Outer Container Left Border — modify `src/components/QuestionCard.tsx` line 57

**Current outer container** (QuestionCard.tsx line 57):
```tsx
<div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
```

**Modified outer container** — add `border-l-4` and dynamic border color:
```tsx
<div className={`bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 border-l-4 ${BORDER_CLASSES[question.level]}`}>
```

Note: `border-l-4` and `border-b` apply to different edges; `border-green-500` (etc.) sets only the left edge color because it is the most specific directional override. The existing `border-gray-100` controls the bottom edge only.

---

#### Pattern C: Badge Chip — copy from `src/components/QuestionCard.tsx` lines 83-88

**Existing custom badge** (QuestionCard.tsx lines 83-88 — exact reference implementation):
```tsx
{/* Custom badge — shown only for custom questions */}
{row.isCustom === true && (
  <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
    custom
  </span>
)}
```

**Difficulty badge** — insert after question text `<span>` (line 79-81), before the custom badge block (line 83). Always visible (no conditional):
```tsx
{/* Difficulty badge — always visible, VIS-02 */}
<span
  className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
  aria-label={`${question.level} difficulty`}
>
  {question.level}
</span>
```

Key differences from custom badge:
- No conditional wrapper — always rendered
- Adds `uppercase` class (CSS text-transform, not `.toUpperCase()`)
- Adds `aria-label` for accessibility
- Color classes come from `BADGE_CLASSES[question.level]` map

---

#### Pattern D: Print Row Badge — modify `src/components/QuestionCard.tsx` lines 122-127

**Current print row** (QuestionCard.tsx lines 122-127):
```tsx
<div className="hidden print:flex print:items-center print:gap-2 print:px-3 print:py-1.5 print:pl-10">
  <span className="text-sm font-normal text-gray-900">{question.q}</span>
  <span className="ml-auto text-sm font-normal text-gray-700">
    Score: {score !== null ? `${score} / 10` : '— / 10'}
  </span>
</div>
```

**Modified print row** — duplicate the difficulty badge `<span>` after the question text (the print div is a sibling, not a CSS toggle of the screen row, so the badge must be explicitly added here too):
```tsx
<div className="hidden print:flex print:items-center print:gap-2 print:px-3 print:py-1.5 print:pl-10">
  <span className="text-sm font-normal text-gray-900">{question.q}</span>
  <span
    className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
    aria-label={`${question.level} difficulty`}
  >
    {question.level}
  </span>
  <span className="ml-auto text-sm font-normal text-gray-700">
    Score: {score !== null ? `${score} / 10` : '— / 10'}
  </span>
</div>
```

---

### `src/components/QuestionCard.test.tsx` (test)

**Analog:** `src/components/QuestionCard.test.tsx` lines 1-50 (fixture setup) and lines 217-224 (custom badge class tests)

**Fixture setup pattern** (QuestionCard.test.tsx lines 13-44 — reuse existing fixtures):
```typescript
// mockRow already has level: 'intermediate' — use for border/badge intermediate tests
const mockRow = {
  type: 'question' as const,
  sectionId: 'frontend',
  topicId: 'react',
  question: { q: 'What is JSX?', level: 'intermediate' as const },
  index: 0,
  isCustom: false,
};

// makeState() helper — no changes needed, already provides all required store selectors
function makeState(overrides: Record<string, unknown> = {}) {
  return {
    scores: {},
    notes: {},
    setScore: vi.fn(),
    setNote: vi.fn(),
    deleteCustomQuestion: vi.fn(),
    removeDefaultQuestion: vi.fn(),
    printMode: false,
    hideNotes: false,
    ...overrides,
  };
}
```

**Per-difficulty row fixture pattern** — create inline in each test (same approach as existing tests that pass difficulty-specific data):
```typescript
const noviceRow = { ...mockRow, question: { q: 'What is JSX?', level: 'novice' as const } };
const advancedRow = { ...mockRow, question: { q: 'What is JSX?', level: 'advanced' as const } };
const expertRow = { ...mockRow, question: { q: 'What is JSX?', level: 'expert' as const } };
```

**Badge class-presence test pattern** (QuestionCard.test.tsx lines 217-224 — exact pattern to replicate):
```typescript
it('custom badge has correct classes including purple colors', () => {
  render(<QuestionCard row={mockCustomRow} />);
  const badge = screen.getByText('custom');
  expect(badge.className).toContain('bg-purple-100');
  expect(badge.className).toContain('text-purple-700');
  expect(badge.className).toContain('dark:bg-purple-900/30');
  expect(badge.className).toContain('dark:text-purple-400');
});
```

**Difficulty badge tests** — replicate using `getByLabelText` (not `getByText`) because DOM text is lowercase `novice` but `uppercase` CSS makes it visually NOVICE — querying by `aria-label` is more robust:
```typescript
it('renders difficulty badge chip with aria-label and uppercase class for novice', () => {
  const noviceRow = { ...mockRow, question: { q: 'What is JSX?', level: 'novice' as const } };
  render(<QuestionCard row={noviceRow} />);
  const badge = screen.getByLabelText('novice difficulty');
  expect(badge.className).toContain('uppercase');
  expect(badge.className).toContain('bg-green-100');
  expect(badge.className).toContain('text-green-700');
  expect(badge.className).toContain('dark:bg-green-900/30');
  expect(badge.className).toContain('dark:text-green-400');
});
```

**Border class-presence test pattern** — use `container.firstChild` to target the outer div:
```typescript
it('outer container has border-l-4 and border-blue-500 for intermediate', () => {
  const { container } = render(<QuestionCard row={mockRow} />);
  const outerDiv = container.firstChild as HTMLElement;
  expect(outerDiv.className).toContain('border-l-4');
  expect(outerDiv.className).toContain('border-blue-500');
});
```

---

## Shared Patterns

### Static Literal Class Maps (D-06)
**Source:** `src/components/DifficultyFilter.tsx` lines 19-25
**Apply to:** `QuestionCard.tsx` — both `BORDER_CLASSES` and `BADGE_CLASSES` maps
```typescript
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};
```
Rule: never use template literals like `` `border-${color}-500` `` — Tailwind purges these in production builds.

### Dark Mode Badge Colors
**Source:** `src/components/QuestionCard.tsx` lines 84-87 (custom badge)
**Apply to:** `BADGE_CLASSES` map values
Pattern: `bg-[color]-100 text-[color]-700 dark:bg-[color]-900/30 dark:text-[color]-400` — bundle light + dark in a single string value per key, not a separate dark map.

### `shrink-0` on Flex Badge Chips
**Source:** `src/components/QuestionCard.tsx` line 85
**Apply to:** The difficulty badge `<span>` className
Required when a badge is a flex child alongside `flex-1` text — prevents the chip from being squeezed by long question text.

### `aria-label` on Badge Chips
**Source:** `src/components/QuestionCard.tsx` line 93 (button aria-label pattern)
**Apply to:** Difficulty badge `<span>`
Pattern: `aria-label={`${question.level} difficulty`}` — used by test queries via `screen.getByLabelText(...)` to avoid coupling tests to DOM text case.

---

## No Analog Found

None — all patterns for this phase are directly available in the existing codebase.

---

## Metadata

**Analog search scope:** `src/components/` (QuestionCard.tsx, DifficultyFilter.tsx, QuestionCard.test.tsx)
**Files scanned:** 3 (QuestionCard.tsx, DifficultyFilter.tsx, QuestionCard.test.tsx)
**Pattern extraction date:** 2026-06-19
