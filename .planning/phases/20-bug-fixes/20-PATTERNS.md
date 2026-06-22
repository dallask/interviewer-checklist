# Phase 20: Bug Fixes - Pattern Map

**Mapped:** 2026-06-22
**Files analyzed:** 3 (2 modified, 1 test addition)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/buildFlatRows.ts` | utility | transform | self (existing file, surgical edit) | exact |
| `src/components/QuestionCard.tsx` | component | request-response | self (existing file, surgical edit) | exact |
| `src/utils/buildFlatRows.test.ts` | test | — | self (existing test file, add case) | exact |

## Pattern Assignments

### `src/utils/buildFlatRows.ts` (utility, transform) — BUG-01

**File to modify:** `src/utils/buildFlatRows.ts`

**Current pattern at line 154 (the bug):**
```typescript
if (filteredQuestions.length > 0) {
  // hideMarked: skip topics that are fully marked when the filter is active
  if (
    filters.hideMarked === true &&
    filters.markedTopicIds?.has(topic.id)
  ) {
    continue;
  }
  visibleTopics.push({ ...topic, filteredQuestions });
}
```

**Fixed pattern (replace the `if` at line 154):**
```typescript
if (filteredQuestions.length > 0 || topic.questions.length === 0) {
  // hideMarked: skip topics that are fully marked when the filter is active
  if (
    filters.hideMarked === true &&
    filters.markedTopicIds?.has(topic.id)
  ) {
    continue;
  }
  visibleTopics.push({ ...topic, filteredQuestions });
}
```

**Key constraints:**
- Do NOT mutate the `sections` input (readonly)
- `filteredQuestions` is already an empty `[]` for a newly added topic — spread it through unchanged
- Line 168 section-skip guard (`if (visibleTopics.length === 0 && section.topics.length > 0) continue`) requires no change — it self-corrects once empty topics enter `visibleTopics`

---

### `src/components/QuestionCard.tsx` (component, request-response) — BUG-02

**File to modify:** `src/components/QuestionCard.tsx`

**Current pattern at lines 7–13 (the bug):**
```typescript
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const BORDER_CLASSES: Record<Difficulty, string> = {
  novice: 'border-l-4 border-green-500',
  intermediate: 'border-l-4 border-blue-500',
  advanced: 'border-l-4 border-orange-500',
  expert: 'border-l-4 border-pink-500',
};
```

**Fixed pattern (replace lines 7–13):**
```typescript
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const BORDER_CLASSES: Record<Difficulty, string> = {
  novice: 'border-l-4 border-l-green-700',
  intermediate: 'border-l-4 border-l-blue-700',
  advanced: 'border-l-4 border-l-orange-700',
  expert: 'border-l-4 border-l-pink-700',
};
```

**Key constraints:**
- Use `border-l-{color}-700` (not `border-{color}-500`) — `border-l-*` sets only `border-left-color`, avoiding Tailwind v4 cascade conflict with `border-gray-100`
- Shade must be `-700` to match `BADGE_CLASSES` text colors (`text-green-700`, `text-blue-700`, `text-orange-700`, `text-pink-700`)
- `BADGE_CLASSES` (lines 15–24) must NOT change — it is correct
- All four class strings must remain full static literals (no template strings) so Tailwind's content scanner picks them up
- Update the comment text to reference the new class names (the scanner comment at line 7)

**Reference — `BADGE_CLASSES` (lines 15–24, correct, do not change):**
```typescript
const BADGE_CLASSES: Record<Difficulty, string> = {
  novice:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};
```

---

### `src/utils/buildFlatRows.test.ts` (test) — BUG-01 regression test

**File to modify:** `src/utils/buildFlatRows.test.ts`

**Existing test structure pattern (lines 1–8, 53–72):**
```typescript
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V4Section } from '../storage/types.js';
import { buildFlatRows, ... } from './buildFlatRows.js';

// Synthetic V4Section shape used for unit tests
const syntheticV4Section: V4Section = {
  id: 'test-section',
  label: 'Test Section',
  icon: 'T',
  isDefault: true,
  topics: [
    {
      id: 'test-topic',
      name: 'Test Topic',
      desc: 'desc',
      tag: 'test',
      isDefault: true,
      questions: [ ... ],
    },
  ],
};
```

**New test case to add (copy structure from existing describe blocks):**
```typescript
describe('buildFlatRows — BUG-01: empty topic visibility', () => {
  it('includes a topic with no questions so it appears in the tree', () => {
    const emptyTopicSection: V4Section = {
      id: 'sec-empty',
      label: 'Section With Empty Topic',
      icon: 'E',
      isDefault: false,
      topics: [
        {
          id: 'topic-empty',
          name: 'Empty Topic',
          desc: '',
          tag: '',
          isDefault: false,
          questions: [],
        },
      ],
    };

    const rows = buildFlatRows([emptyTopicSection], {}, {}, emptyFilters);
    const topicRow = rows.find((r) => r.type === 'topic' && r.id === 'topic-empty');
    expect(topicRow).toBeDefined();
  });

  it('does NOT include an empty topic in visibleTopics count that triggers section skip', () => {
    // Section with one empty topic should NOT be skipped (line 168 guard)
    const emptyTopicSection: V4Section = {
      id: 'sec-empty2',
      label: 'Section',
      icon: 'S',
      isDefault: false,
      topics: [
        { id: 'topic-e', name: 'T', desc: '', tag: '', isDefault: false, questions: [] },
      ],
    };

    const rows = buildFlatRows([emptyTopicSection], {}, {}, emptyFilters);
    const sectionRow = rows.find((r) => r.type === 'section' && r.id === 'sec-empty2');
    expect(sectionRow).toBeDefined();
  });
});
```

**`emptyFilters` constant (already defined at line 44, reuse it):**
```typescript
const emptyFilters = {
  searchQuery: '',
  selectedDifficulties: new Set<string>() as Set<Difficulty>,
  selectedSections: new Set<string>(),
};
```

---

## Shared Patterns

### Tailwind v4 Static Literal Requirement
**Source:** `src/components/QuestionCard.tsx` lines 7–13 (and existing `BADGE_CLASSES`)
**Apply to:** Any new Tailwind class strings added in this phase

All class strings that use dynamic color segments must be written as full static literals — never constructed via template literals or concatenation. This ensures Tailwind v4's content scanner detects and includes them.

### Read-Only Input Convention
**Source:** `src/utils/buildFlatRows.ts` function signature (`sections: readonly V4Section[]`)
**Apply to:** BUG-01 fix

The `sections` parameter is `readonly`. The fix must not mutate any section or topic object. Use spread (`{ ...topic, filteredQuestions }`) as already done at line 162.

## No Analog Found

None — both bugs have direct existing-file analogs.

## Metadata

**Analog search scope:** `src/utils/`, `src/components/`
**Files scanned:** 3
**Pattern extraction date:** 2026-06-22
