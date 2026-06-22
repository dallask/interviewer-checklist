# Phase 21: Layout & Content Ordering — Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 3 (ContentTree.tsx, buildFlatRows.ts, buildFlatRows.test.ts)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/ContentTree.tsx` | component | request-response (virtual render) | `src/app/Welcome.tsx` (centering); `ContentTree.tsx` itself (row render) | exact (self-referential + centering analog) |
| `src/utils/buildFlatRows.ts` | utility | transform | `buildFlatRows.ts` lines 130–152 (existing filter loop) | exact (self-referential, same function) |
| `src/utils/buildFlatRows.test.ts` | test | — | `buildFlatRows.test.ts` `selectedDifficulties` describe block (lines 305–347) | exact (same file, same test structure) |

---

## Pattern Assignments

### `src/components/ContentTree.tsx` — LAYOUT-01: centering wrapper

**Change:** Add `<div className="mx-auto w-full max-w-[1200px] px-4">` inside each virtual item div, wrapping all row-component renders.

**Analog for centering class pattern:** `src/app/Welcome.tsx` line 60

```tsx
// Welcome.tsx line 60 — existing project pattern for max-width + centering
<main id="main-content" className="max-w-2xl mx-auto px-6 py-16">
```

The Phase 21 variant uses an arbitrary-value literal instead of a named size token — valid in Tailwind v4 JIT:

```tsx
// Target pattern to add in ContentTree.tsx (lines 104–148)
// BEFORE (existing outer item div, lines 103–114):
<div
  key={virtualItem.key}
  data-index={virtualItem.index}
  ref={rowVirtualizer.measureElement}
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    transform: `translateY(${virtualItem.start}px)`,
  }}
>
  {row.type === 'section' && <SectionRow row={row} />}
  {/* ... remaining row types ... */}
</div>

// AFTER — add centering wrapper inside the item div, outside the row component:
<div
  key={virtualItem.key}
  data-index={virtualItem.index}
  ref={rowVirtualizer.measureElement}
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    transform: `translateY(${virtualItem.start}px)`,
  }}
>
  <div className="mx-auto w-full max-w-[1200px] px-4">
    {row.type === 'section' && <SectionRow row={row} />}
    {/* ... remaining row types ... */}
  </div>
</div>
```

**Print header analog** (ContentTree.tsx lines 83–93): The print-only candidate header div is a direct child of `parentRef` outside the virtualizer. It must also receive `max-w-[1200px] mx-auto` so printed output matches the constrained width:

```tsx
// BEFORE (ContentTree.tsx lines 83–93):
<div aria-hidden="true" className="hidden print:block print:mb-4">

// AFTER:
<div aria-hidden="true" className="hidden print:block print:mb-4 max-w-[1200px] mx-auto px-4">
```

**Constraint:** The scroll container itself (`<div ref={parentRef} className="flex-1 overflow-y-auto">`, line 79) must NOT receive max-width — it must remain `width: '100%'` so the scrollbar tracks the full viewport.

---

### `src/utils/buildFlatRows.ts` — CONT-01: difficulty sort + custom question merge

**Change 1 — sort filteredQuestions after the filter loop:** The existing `filteredQuestions` push loop (lines 130–152) already collects questions with `originalIndex` preserved. After that loop, sort `filteredQuestions` in-place by difficulty before pushing to `visibleTopics`.

**Analog for sort key constant:** `src/data/bank/types.ts` lines 23–28 — `DIFFICULTY_COEFFICIENTS` already maps `Difficulty → number` in novice→expert order. Define a parallel `DIFF_ORDER` constant in `buildFlatRows.ts` for integer sort keys:

```ts
// src/data/bank/types.ts lines 23–28 — existing ordering reference:
export const DIFFICULTY_COEFFICIENTS: Record<Difficulty, number> = {
  novice: 1.0,
  intermediate: 1.25,
  advanced: 1.5,
  expert: 1.75,
} as const;

// New constant to add at the top of buildFlatRows.ts (after imports):
const DIFF_ORDER: Record<Difficulty, number> = {
  novice: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};
```

**Analog for in-place sort on a derived array:** `src/store/app.ts` lines 564–569 — existing pattern for sorting a derived copy of an array before consuming:

```ts
// app.ts lines 564–569 — sort a spread copy:
const sorted = [...remainingSessions].sort(
  (a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
);
```

Apply the same spread-then-sort idiom to `filteredQuestions` in `buildFlatRows.ts` after the filter loop (after line 152, before the `visibleTopics.push`):

```ts
// Add after line 152 in buildFlatRows.ts (after filteredQuestions is fully built):
filteredQuestions.sort((a, b) => DIFF_ORDER[a.level] - DIFF_ORDER[b.level]);
```

**Change 2 — merge custom questions into unified sorted emit:** The current emit pattern (lines 202–231) has two separate loops: one for `filteredQuestions` (default), one for `customForTopic` (custom, appended at the end). The merged pattern collapses these into a discriminated union sorted by the same `DIFF_ORDER` key.

**Analog for discriminated union type:** `src/utils/buildFlatRows.ts` lines 8–68 — the file already uses discriminated union types (`VirtualRow` with `type` discriminant). Follow the same local union pattern:

```ts
// Existing discriminated union pattern in buildFlatRows.ts (lines 64–69):
export type VirtualRow =
  | SectionRow
  | TopicRow
  | QuestionRow
  | AddTopicTriggerRow
  | AddSectionTriggerRow;
```

New local (non-exported) merge type to add inside `buildFlatRows` function scope, replacing the current two-loop emit at lines 202–231:

```ts
// Replace lines 202–231 with this merged emit pattern:

// 1. Build the custom questions list for this topic (moved earlier, before the emit loop)
const customForTopic = (filters.customQuestions ?? []).filter(
  (cq) => cq.topicId === topic.id,
);

// 2. Build a discriminated merged list
type MergedQuestion =
  | { kind: 'default'; id: string; text: string; level: Difficulty; originalIndex: number; isDefault: boolean }
  | { kind: 'custom'; cq: CustomQuestion; sortIndex: number };

const merged: MergedQuestion[] = [
  ...filteredQuestions.map((q) => ({ kind: 'default' as const, ...q })),
  ...customForTopic.map((cq, i) => ({ kind: 'custom' as const, cq, sortIndex: i })),
];

merged.sort((a, b) => {
  const la = a.kind === 'default' ? a.level : a.cq.level;
  const lb = b.kind === 'default' ? b.level : b.cq.level;
  return DIFF_ORDER[la] - DIFF_ORDER[lb];
});

// 3. Emit rows from merged list
for (let mergedIdx = 0; mergedIdx < merged.length; mergedIdx++) {
  const entry = merged[mergedIdx];
  if (entry.kind === 'default') {
    rows.push({
      type: 'question',
      sectionId: section.id,
      topicId: topic.id,
      question: { q: entry.text, level: entry.level },
      index: entry.originalIndex,         // score key stability — must be originalIndex
      questionBankId: entry.id,
      isDefaultQuestion: entry.isDefault,
    });
  } else {
    rows.push({
      type: 'question',
      sectionId: section.id,
      topicId: topic.id,
      question: { q: entry.cq.text, level: entry.cq.level },
      index: topic.questions.length + entry.sortIndex,  // cosmetic; score uses customId
      isCustom: true,
      customId: entry.cq.id,
    });
  }
}
```

**Score key stability note:** `originalIndex` is the position in `topic.questions` (set at line 150: `{ ...question, originalIndex: idx }`). This value must not be changed by sorting — the sort only reorders the `filteredQuestions` array; `originalIndex` is a property on each entry, not the array index.

---

### `src/utils/buildFlatRows.test.ts` — sort regression tests

**Change:** Add new `describe` blocks for sort and merge behavior. No changes to existing tests.

**Analog — structure to copy:** `buildFlatRows.test.ts` lines 305–347 (`buildFlatRows — selectedDifficulties filter` describe block). Copy the V4Section synthetic fixture, `buildFlatRows` call, and `questionRows` extraction pattern exactly:

```ts
// Copy this test structure (lines 548–629) as the closest analog — it already
// uses a multi-difficulty synthetic section to verify ordering:
describe('buildFlatRows — index fix under difficulty filtering', () => {
  it('QuestionRow.index reflects original topic.questions position when filter hides q0', () => {
    const v4Section: V4Section = {
      id: 'test-section',
      // ...
      topics: [{
        id: 'test-topic',
        // ...
        questions: [
          { id: 'test-topic-q0', text: 'Q0 intermediate', level: 'intermediate', isDefault: true },
          { id: 'test-topic-q1', text: 'Q1 expert',       level: 'expert',       isDefault: true },
          { id: 'test-topic-q2', text: 'Q2 expert',       level: 'expert',       isDefault: true },
        ],
      }],
    };
    const rows = buildFlatRows([v4Section], {}, {}, { ...emptyFilters, selectedDifficulties: new Set(['expert']) });
    const questionRows = rows.filter((r) => r.type === 'question');
    // ... assertions
  });
});
```

**New describe blocks to add** (copy the synthetic section shape from lines 551–571, add assertions for sort order):

```ts
// Minimal test section for sort tests — mixed difficulties in intentionally wrong order:
const mixedDiffSection: V4Section = {
  id: 'sort-test-section',
  label: 'Sort Test',
  icon: 'S',
  isDefault: true,
  topics: [{
    id: 'sort-test-topic',
    name: 'Sort Topic',
    desc: 'desc',
    tag: 'sort',
    isDefault: true,
    questions: [
      { id: 'sort-q0', text: 'Q expert',       level: 'expert',       isDefault: true },
      { id: 'sort-q1', text: 'Q novice',        level: 'novice',       isDefault: true },
      { id: 'sort-q2', text: 'Q advanced',      level: 'advanced',     isDefault: true },
      { id: 'sort-q3', text: 'Q intermediate',  level: 'intermediate', isDefault: true },
    ],
  }],
};

describe('buildFlatRows — CONT-01 difficulty sort', () => {
  it('emits question rows in novice→intermediate→advanced→expert order', () => {
    const rows = buildFlatRows([mixedDiffSection], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    expect(questionRows).toHaveLength(4);
    const levels = questionRows.map((r) => r.type === 'question' ? r.question.level : null);
    expect(levels).toEqual(['novice', 'intermediate', 'advanced', 'expert']);
  });

  it('originalIndex is preserved after sort (score key stability)', () => {
    const rows = buildFlatRows([mixedDiffSection], {}, {}, emptyFilters);
    const questionRows = rows.filter((r) => r.type === 'question');
    // sort-q1 (novice) was at index 1 in topic.questions — should still have index 1
    const noviceRow = questionRows.find((r) => r.type === 'question' && r.question.level === 'novice');
    expect(noviceRow?.type === 'question' && noviceRow.index).toBe(1);
  });
});

describe('buildFlatRows — CONT-01 custom question merge', () => {
  it('custom question appears at its difficulty position, not appended at end', () => {
    const customQuestions: import('../store/app.js').CustomQuestion[] = [{
      id: 'custom-sort-test-topic-1',
      topicId: 'sort-test-topic',
      text: 'Custom novice',
      level: 'novice',
    }];
    const rows = buildFlatRows([mixedDiffSection], {}, {}, { ...emptyFilters, customQuestions });
    const questionRows = rows.filter((r) => r.type === 'question');
    // 4 default + 1 custom = 5 questions; first two should be novice (one default, one custom)
    expect(questionRows).toHaveLength(5);
    const levels = questionRows.map((r) => r.type === 'question' ? r.question.level : null);
    // novice custom merges in with novice default at the start
    expect(levels[0]).toBe('novice');
    expect(levels[1]).toBe('novice');
    // last row must not be the custom question (old "append at end" behavior)
    const lastRow = questionRows[questionRows.length - 1];
    expect(lastRow.type === 'question' && lastRow.isCustom).toBeFalsy();
  });

  it('custom question row has isCustom=true and customId set after merge', () => {
    const customQuestions: import('../store/app.js').CustomQuestion[] = [{
      id: 'custom-sort-test-topic-1',
      topicId: 'sort-test-topic',
      text: 'Custom expert',
      level: 'expert',
    }];
    const rows = buildFlatRows([mixedDiffSection], {}, {}, { ...emptyFilters, customQuestions });
    const customRows = rows.filter((r) => r.type === 'question' && r.isCustom);
    expect(customRows).toHaveLength(1);
    if (customRows[0].type === 'question') {
      expect(customRows[0].isCustom).toBe(true);
      expect(customRows[0].customId).toBe('custom-sort-test-topic-1');
    }
  });
});
```

---

## Shared Patterns

### Tailwind arbitrary-value class literal
**Source:** `src/app/Welcome.tsx` line 60
**Apply to:** ContentTree.tsx centering wrapper div
```tsx
// Pattern: static Tailwind literal — no dynamic class construction
className="max-w-2xl mx-auto px-6 py-16"
// Phase 21 variant (1200px arbitrary value):
className="mx-auto w-full max-w-[1200px] px-4"
```
Note: Tailwind v4 JIT resolves arbitrary values from static strings. Do not construct this class dynamically.

### `originalIndex` preservation through array transforms
**Source:** `src/utils/buildFlatRows.ts` lines 148–152 and 200–213
**Apply to:** All sort and merge operations in buildFlatRows.ts
```ts
// line 150 — originalIndex is attached at push time, before any sorting:
filteredQuestions.push({ ...question, originalIndex: idx });

// line 209 — emitted QuestionRow uses originalIndex (not the loop counter):
index: question.originalIndex,
```
The sort must operate on the array containing objects that carry `originalIndex` as a field — never remap `index` to the post-sort position.

### Spread-copy before sort
**Source:** `src/store/app.ts` lines 564–569
**Apply to:** Any place where a derived array must be sorted without mutating the source
```ts
const sorted = [...remainingSessions].sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
);
```
For `filteredQuestions` the in-place sort is safe (it is already a locally-built array, not a reference to `topic.questions`), so no spread is required — but the pattern confirms stable comparator style.

### Discriminated union for heterogeneous row emit
**Source:** `src/utils/buildFlatRows.ts` lines 64–69 (VirtualRow union)
**Apply to:** The `MergedQuestion` local union in the new merge emit loop
```ts
export type VirtualRow =
  | SectionRow       // type: 'section'
  | TopicRow         // type: 'topic'
  | QuestionRow      // type: 'question'
  | AddTopicTriggerRow   // type: 'add-topic-trigger'
  | AddSectionTriggerRow; // type: 'add-section-trigger'
```
Use the same `kind` discriminant pattern for the local `MergedQuestion` union (not exported — function-scope only).

---

## No Analog Found

None. All three changes have direct analogs in the existing codebase.

---

## Metadata

**Analog search scope:** `src/components/`, `src/utils/`, `src/app/`, `src/store/`, `src/data/bank/`
**Files scanned:** 5 (ContentTree.tsx, buildFlatRows.ts, buildFlatRows.test.ts, app.ts, types.ts) + Welcome.tsx for centering analog
**Pattern extraction date:** 2026-06-22
