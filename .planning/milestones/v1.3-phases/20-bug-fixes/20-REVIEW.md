---
phase: 20-bug-fixes
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/utils/buildFlatRows.ts
  - src/utils/buildFlatRows.test.ts
  - src/components/QuestionCard.tsx
  - src/components/QuestionCard.test.tsx
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-06-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the `buildFlatRows` utility (pure virtualisation helper) and `QuestionCard` component (renders one question row). The overall structure is sound and the test coverage is broad. Four substantive issues were found: one critical data-integrity bug in how custom-question score/note keys are derived, two logic bugs in `buildFlatRows` edge cases, and one incorrect aria attribute type that causes a browser warning in every render. An informational note covers a redundant `indexOf` call inside a loop.

---

## Critical Issues

### CR-01: Custom-question `questionId` collides with default-question keys — scores/notes silently overwrite

**File:** `src/components/QuestionCard.tsx:34`

**Issue:** For every `QuestionRow`, `questionId` is always derived as:

```ts
const questionId = `${row.topicId}-q${row.index}`;
```

For **default** questions this is correct — `row.index` is the original 0-based position within `topic.questions`, matching the store's documented key scheme (`${topicId}-q${questionIndex}`).

For **custom** questions, `row.index` is `topic.questions.length + customForTopic.indexOf(cq)` (computed in `buildFlatRows.ts:227`). This is an append-offset that changes whenever a default question is removed from the topic or another custom question at a lower position is deleted. The key is therefore **not stable** across these operations. More concretely:

- Topic has 3 default questions (indices 0, 1, 2) and 1 custom question.
- Custom question's `index` = 3, so its key = `react-q3`.
- User removes default question at index 2 via `removeDefaultQuestion`.
- On next render `topic.questions.length` is still 3 (removal is tracked in `removedDefaultQuestionIds`, the question stays in the array), so the index does not shift — this particular scenario is safe.
- BUT: if a second custom question is added, then the first custom is deleted, the second custom's index changes from `length+1` to `length+0`, reusing the slot of the deleted question. Any score/note written under the old key is orphaned; the new occupant reads a stale score.

The root cause is that custom questions already carry a stable, unique identifier — `row.customId` (e.g. `custom-react-1234567890`) — which is never used for score/note lookup. The component should use `row.customId` as the key for custom questions instead of the positional index.

**Fix:**

```tsx
// QuestionCard.tsx — replace line 34
const questionId = row.isCustom && row.customId != null
  ? row.customId
  : `${row.topicId}-q${row.index}`;
```

This also requires that the store's `scores` / `notes` maps accept arbitrary string keys (they already do — both are `Record<string, ...>`), so no schema changes are needed.

---

## Warnings

### WR-01: `hideMarked` topic-skip applied only when topic has visible questions — empty topics with `markedTopicIds` are never hidden

**File:** `src/utils/buildFlatRows.ts:154-163`

**Issue:** The guard that decides whether to include a topic is:

```ts
if (filteredQuestions.length > 0 || topic.questions.length === 0) {
  // hideMarked check lives here
  if (filters.hideMarked === true && filters.markedTopicIds?.has(topic.id)) {
    continue;
  }
  visibleTopics.push({ ...topic, filteredQuestions });
}
```

A topic with zero questions (`topic.questions.length === 0`) enters the block unconditionally. If such a topic is present in `markedTopicIds` and `hideMarked` is `true`, it is still pushed to `visibleTopics` and rendered. The `hideMarked` branch cannot `continue` past the empty-topic special-case — the check is nested inside the `||` branch that admits it.

This means a user-created empty topic that was somehow marked will never be hidden even when "hide marked" is active. Depending on application semantics it may also prevent the containing section from being skipped (since `visibleTopics` is non-empty), producing a ghost section.

**Fix:** Hoist the `hideMarked` check so it runs unconditionally for every candidate topic before inspecting question counts:

```ts
for (const topic of section.topics) {
  // hideMarked: skip fully-marked topics regardless of question count
  if (filters.hideMarked === true && filters.markedTopicIds?.has(topic.id)) {
    continue;
  }

  const filteredQuestions: ... = [];
  // ... rest of existing filtering logic ...

  if (filteredQuestions.length > 0 || topic.questions.length === 0) {
    visibleTopics.push({ ...topic, filteredQuestions });
  }
}
```

---

### WR-02: `aria-expanded` receives a boolean value — React emits a string `"true"/"false"` but the prop type requires it

**File:** `src/components/QuestionCard.tsx:127`

**Issue:**

```tsx
aria-expanded={notesOpen}
```

`notesOpen` is a `boolean`. The WAI-ARIA spec and the HTML attribute layer expect `aria-expanded` to be the **string** `"true"` or `"false"`. React serialises `boolean` props on native DOM elements correctly for `aria-*` attributes in modern versions (React 16.4+), but TypeScript's JSX types for `aria-expanded` accept `boolean | 'true' | 'false' | undefined`. However, passing a bare `boolean` causes lint warnings with strict aria-props rules, and can behave unexpectedly with third-party accessibility testing tools that inspect the raw DOM attribute.

The actual rendered attribute will be the string `"true"` or `"false"`, so the ARIA tree is technically correct. The concrete defect is that this deviates from project accessibility requirements if strict ARIA linting is enforced, and the test at line 160 of `QuestionCard.test.tsx` passes only because `toHaveAttribute('aria-expanded', 'false')` stringifies the comparison correctly.

**Fix:**

```tsx
aria-expanded={notesOpen ? 'true' : 'false'}
```

---

### WR-03: `customForTopic.indexOf(cq)` inside a `for…of` loop is a latent O(n²) correctness risk when custom questions share object identity with the filter input

**File:** `src/utils/buildFlatRows.ts:227`

**Issue:**

```ts
const customForTopic = (filters.customQuestions ?? []).filter(
  (cq) => cq.topicId === topic.id,
);
for (const cq of customForTopic) {
  rows.push({
    ...
    index: topic.questions.length + customForTopic.indexOf(cq),
    ...
  });
}
```

`Array.prototype.indexOf` uses reference equality (`===`). The `filter` call returns a new array, but each element is the same object reference as in `filters.customQuestions`. Since each `cq` reference appears exactly once in `customForTopic` (the input array is deduplicated by construction), `indexOf` always finds the correct position — it cannot return a wrong index given current data.

The risk materialises if the upstream data ever contains **duplicate object references** (e.g., two array slots pointing to the same `CustomQuestion` object). In that case, `indexOf` always returns the index of the first occurrence, so both loop iterations emit the same `index` value, creating two `QuestionRow`s with colliding `questionId` keys in the store.

This is a latent bug, not currently triggered. The straightforward fix eliminates the concern entirely and is more readable:

**Fix:** Use a numeric index from `entries()`:

```ts
for (const [i, cq] of customForTopic.entries()) {
  rows.push({
    ...
    index: topic.questions.length + i,
    ...
  });
}
```

---

## Info

### IN-01: Test file uses `type` narrowing guard redundantly after a `.filter` that already narrows

**File:** `src/utils/buildFlatRows.test.ts:239-241`

**Issue:** A pattern repeated in multiple tests (lines 81-84, 169-171, 239-241, etc.) filters rows by type and then re-checks inside the loop:

```ts
const questionIds = questionRows
  .filter((r) => r.type === 'question')   // <-- redundant; questionRows already filtered
  .map((r) => (r.type === 'question' ? r.questionBankId : undefined));
```

`questionRows` at line 238 is already `rows.filter((r) => r.type === 'question')`, so the second `.filter` is a no-op that adds noise. The ternary inside `.map` is also redundant for the same reason. TypeScript's discriminated union narrowing does not propagate through the intermediate variable, forcing the guard, but a single-pass type-cast or a more specific filter can eliminate the duplication.

This does not affect correctness or test outcomes, but it is a pattern that masks intent and duplicates filter logic.

**Fix:** Use a type predicate helper (already implied by the discriminated union):

```ts
const questionIds = questionRows.map(
  (r) => (r as import('./buildFlatRows.js').QuestionRow).questionBankId,
);
```

Or simply trust the narrowed `type === 'question'` check via TypeScript's control-flow analysis inside a loop:

```ts
for (const r of questionRows) {
  if (r.type === 'question') { /* r is QuestionRow here */ }
}
```

---

_Reviewed: 2026-06-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
