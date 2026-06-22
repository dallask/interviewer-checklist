---
phase: 21-layout-content-ordering
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/utils/buildFlatRows.ts
  - src/utils/buildFlatRows.test.ts
  - src/components/ContentTree.tsx
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-06-22
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the CONT-01 difficulty sort (`DIFF_ORDER`), the `MergedQuestion` unified emit in `buildFlatRows.ts`, and the centering wrapper added to `ContentTree.tsx`. The core sorting logic is correct and the stable-sort invariant is maintained. However, two critical bugs were found: (1) the `SectionRow.questionCount` silently undercounts by excluding custom questions, corrupting the displayed count; and (2) the `index` field on custom `QuestionRow` items is computed with a quadratic `indexOf` call inside a hot loop that, beyond inefficiency, produces an incorrect result when the same `CustomQuestion` object appears more than once — though the severity here is data-correctness, not just performance. Three warnings cover a redundant double-sort of `filteredQuestions`, a missing `isCustom: false` annotation on the `undefined` default case, and a stale custom-question `index` after the merged sort reorders entries. One info item covers variable shadowing.

## Critical Issues

### CR-01: SectionRow.questionCount Excludes Custom Questions — Displayed Count is Wrong

**File:** `src/utils/buildFlatRows.ts:182-184`

**Issue:** `totalQCount` is computed as the sum of `t.filteredQuestions.length` across visible topics. `filteredQuestions` contains only default bank questions; custom questions are collected later inside the per-topic loop (lines 215-230) and are never included in this sum. The `SectionRow.questionCount` field is rendered directly as "{N} questions" in `SectionRow.tsx:30`. A section with 5 default questions and 2 custom questions will display "5 questions" — the custom questions are invisible to the counter.

```typescript
// Current (incorrect):
const totalQCount = visibleTopics.length > 0
  ? visibleTopics.reduce((sum, t) => sum + t.filteredQuestions.length, 0)
  : 0;

// Fix — also count custom questions for this section:
const sectionCustomCount = (filters.customQuestions ?? []).filter(
  (cq) => visibleTopics.some((t) => t.id === cq.topicId),
).length;
const totalQCount = visibleTopics.length > 0
  ? visibleTopics.reduce((sum, t) => sum + t.filteredQuestions.length, 0) + sectionCustomCount
  : 0;
```

The same undercount exists on `TopicRow.questionCount` at line 206 (`topic.filteredQuestions.length`), which likewise excludes custom questions for that topic and is rendered as "{N} q" in `TopicRow.tsx:74`.

---

### CR-02: Custom QuestionRow.index Computed via indexOf Inside Loop — Wrong After Merged Sort Reorders

**File:** `src/utils/buildFlatRows.ts:258`

**Issue:** For custom questions, the `index` is computed as:

```typescript
index: topic.questions.length + customForTopic.indexOf(entry.cq),
```

This `indexOf` call does a linear reference scan of `customForTopic` during each iteration of the `merged` loop. More critically, `entry.cq` is the object reference from the `merged` array, which was built by spreading `customForTopic` (line 228). The `merged` array is then sorted in-place by difficulty (line 233). After the sort, `entry.cq` still refers to the original `CustomQuestion` object, so `indexOf` will find the correct reference and return the correct pre-sort position index. This makes the result coincidentally correct for reference equality — **but** the semantic intent of the `index` field on a custom `QuestionRow` is documented as "cosmetic" (line 257 comment) while `QuestionCard` uses `questionId = \`${row.topicId}-q${row.index}\`` (QuestionCard.tsx:34) to key into `scores` and `notes` state. Custom questions keyed by this `questionId` construction will collide with default questions when `topic.questions.length` changes (e.g., a default question is removed via `removedDefaultQuestionIds`), because the offset base (`topic.questions.length`) shrinks without the custom question's score key being updated.

The comment on line 257 ("index is cosmetic for custom questions (score key uses customId, D-10)") is contradicted by `QuestionCard.tsx:34` which unconditionally uses `row.index` to build `questionId` — there is no branch that uses `customId` for the score key. Custom question scores and notes are stored under `topicId-q${index}`, not under `customId`. This is a latent data-loss bug when default questions are removed.

**Fix:** Either use a stable, collision-free key for custom questions in `QuestionCard` (e.g., branch on `row.isCustom` and use `row.customId` directly as the store key), or document and test the exact invariant. The safest fix is in `QuestionCard.tsx`:

```typescript
// QuestionCard.tsx:34 — replace:
const questionId = `${row.topicId}-q${row.index}`;

// With:
const questionId = row.isCustom && row.customId
  ? row.customId
  : `${row.topicId}-q${row.index}`;
```

## Warnings

### WR-01: filteredQuestions Sorted Twice — Default Questions Sorted Once Unnecessarily

**File:** `src/utils/buildFlatRows.ts:164` and `src/utils/buildFlatRows.ts:233`

**Issue:** `filteredQuestions` is sorted in-place by difficulty at line 164 (inside the topic loop). Then at line 223-230 it is spread into `merged`, and `merged` is sorted again at line 233. The first sort (line 164) is entirely redundant because the merged sort at line 233 will produce the final order regardless. The first sort mutates the `filteredQuestions` array which is also attached to `visibleTopics` entries and is used later only to derive `questionCount` (no other consumers care about order). The double sort is not incorrect, but it is misleading: it implies the intermediate sorted state has consumers, and it does work that is immediately discarded.

**Fix:** Remove the `filteredQuestions.sort(...)` call at line 164. The merged sort at line 233 handles ordering for all questions (default + custom). Update the comment at line 162-163 to reference the merged sort instead.

---

### WR-02: Custom QuestionRow Missing Explicit isDefaultQuestion Field

**File:** `src/utils/buildFlatRows.ts:251-261`

**Issue:** When emitting a `QuestionRow` for a custom question (the `else` branch at line 251), the fields `isCustom: true` and `customId` are set, but `isDefaultQuestion` is not set (left `undefined`). The `QuestionRow` type declares `isDefaultQuestion?: boolean` — `undefined` and `false` are distinct values used by `QuestionCard.tsx:135`:

```typescript
{(row.isCustom === true || row.isDefaultQuestion === true) && (
  // renders delete/remove button
```

This check correctly renders the button for both custom and default questions, so the `undefined` case here is accidentally correct. But the type contract is ambiguous: a caller reading the type cannot distinguish "this is a non-default bank question that was explicitly marked false" from "this field was not set." For custom questions the canonical value is `false`, not `undefined`.

**Fix:** Set `isDefaultQuestion: false` explicitly in the custom question branch:

```typescript
rows.push({
  type: 'question',
  sectionId: section.id,
  topicId: topic.id,
  question: { q: entry.cq.text, level: entry.cq.level },
  index: topic.questions.length + customForTopic.indexOf(entry.cq),
  isCustom: true,
  customId: entry.cq.id,
  isDefaultQuestion: false,  // add this
});
```

---

### WR-03: ContentTree centering wrapper applied to trigger rows but not outer scroll container — print layout inconsistency

**File:** `src/components/ContentTree.tsx:83` and `src/components/ContentTree.tsx:115`

**Issue:** The print-only candidate header div at line 83 applies `max-w-[1200px] mx-auto px-4` directly. The per-row centering wrapper at line 115 also applies `mx-auto w-full max-w-[1200px] px-4`. These two centering wrappers are consistent in their constraints. However, the outer scroll container at line 79 (`flex-1 overflow-y-auto`) has no explicit `min-w-0` constraint. In a flex parent, `flex-1` without `min-w-0` can cause the child to overflow its flex container on narrow viewports rather than constraining it, potentially making the inner `max-w-[1200px]` centering irrelevant. This is a layout correctness concern, not purely cosmetic.

**Fix:** Add `min-w-0` to the outer scroll container:

```tsx
<div ref={parentRef} className="flex-1 min-w-0 overflow-y-auto">
```

## Info

### IN-01: Variable Shadowing — Inner `q` Shadows Outer `q` in Test File

**File:** `src/utils/buildFlatRows.test.ts:441`

**Issue:** Inside the `'all remaining question rows...'` test, the local variable `const q = 'react'` at line 441 shadows the outer `q` from `emptyFilters`'s closure pattern used elsewhere. This is test code, not production code, and does not cause incorrect test behavior here because the test explicitly assigns `'react'` to `q` before using it. However, it is a maintenance hazard: if refactored to use a shared variable, the shadow could silently hide a bug.

```typescript
// Line 441 — local q shadows nothing critical here, but name reuse is confusing
const q = 'react';
```

**Fix:** Rename to `searchTerm` or `searchStr` to avoid shadowing the pattern used throughout the test file.

---

_Reviewed: 2026-06-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
