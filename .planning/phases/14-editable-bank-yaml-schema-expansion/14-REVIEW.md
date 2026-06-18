---
phase: 14-editable-bank-yaml-schema-expansion
reviewed: 2026-06-18T00:00:00Z
depth: standard
iteration: 2
files_reviewed: 13
files_reviewed_list:
  - src/app/App.tsx
  - src/app/main.tsx
  - src/utils/yamlExport.ts
  - src/utils/yamlImport.ts
  - src/store/app.ts
  - src/utils/buildFlatRows.ts
  - src/components/SectionRow.tsx
  - src/components/TopicRow.tsx
  - src/components/SearchGroup.tsx
  - src/components/AddSectionForm.tsx
  - src/components/AddTopicForm.tsx
  - src/components/ContentTree.tsx
  - src/components/QuestionCard.tsx
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 14: Code Review Report (Iteration 2 — Re-Review After Fixes)

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

All 9 prior findings (CR-01 through CR-04, WR-01 through WR-05) from iteration 1 have been correctly resolved — verified below. Three new findings were surfaced during adversarial re-review: one critical round-trip data loss for custom question scores and notes, and two warning-level display inaccuracies in the question-count banner.

---

## Prior-Finding Verification

All items from iteration 1 are confirmed fixed.

- **CR-01** (`App.tsx`): `removedDefaultQuestionIds` is subscribed at line 36 and passed as a named argument to `buildFlatRows` at line 67. Confirmed.
- **CR-02** (`main.tsx`): `removedDefaultQuestionIds` is hydrated as `new Set(session.removedDefaultQuestionIds ?? [])` at line 62. Confirmed.
- **CR-03** (`yamlExport.ts`): Custom question score key is built as `` `${topic.id}-q${topic.questions.length + cqIndex}` `` at line 52. Positional key matches the store key format. Confirmed.
- **CR-04** (`yamlImport.ts`): `bank.addedSections` topics are registered in `topicIdSet` and `topicQuestionCount` at lines 287–305, before the main `incomingSections` iteration begins. Confirmed.
- **WR-01** (`SectionRow.tsx`, `TopicRow.tsx`): Both components now use a sibling button pattern — a `<button>` for collapse toggle and a separate `<button>` for delete, both as children of a container `<div>`. No nested interactive elements. Confirmed.
- **WR-02** (`SearchGroup.tsx`): `removedDefaultQuestionIds` is subscribed at line 15 and forwarded to `buildFlatRows` at line 51. Confirmed.
- **WR-03** (`yamlImport.ts`): `addedSections` entries are validated field-by-field (id, label, icon, topics, topic.id, topic.name, question.id, question.text) using `reduce` guards at lines 550–583 before being pushed to the result. Confirmed.
- **WR-04** (`AddSectionForm.tsx`, `AddTopicForm.tsx`): Both IDs append `Math.random().toString(36).slice(2, 7)` suffix to the timestamp (lines 18–19 respectively). Confirmed.
- **WR-05** (`App.tsx`): `markedTopicIds` loop at line 49 skips questions whose `q.id` is in `removedDefaultQuestionIds` before checking the score key. `removedDefaultQuestionIds` is also in the `useMemo` dependency array at line 57. Confirmed.

---

## Critical Issues

### CR-01: Custom Question Scores and Notes Are Silently Dropped on YAML Round-Trip

**File:** `src/utils/yamlImport.ts:501-508`

**Issue:** `parseStructural` stores an imported custom question's score and note under the newly-generated custom ID:

```ts
// yamlImport.ts lines 501-508
const newId = `custom-${topicId}-${Date.now()}-${cqIndex}`;
// ...
if (typeof cq.score === 'number') {
  result.scores[newId] = cq.score;   // keyed on 'custom-...'
}
if (typeof cq.note === 'string' && cq.note !== '') {
  result.notes[newId] = cq.note;     // keyed on 'custom-...'
}
```

After `reKeyImportResultToV4` (which intentionally skips keys starting with `custom-`), these entries survive into the Zustand store under `custom-*` keys. However `QuestionCard` derives the score lookup key as:

```ts
// QuestionCard.tsx line 33
const questionId = `${row.topicId}-q${row.index}`;
```

For a custom question at array position `cqIndex` within a topic, `buildFlatRows` sets `row.index = topic.questions.length + customForTopic.indexOf(cq)`. The effective key is `topicId-qN` (a positional key), not `custom-topicId-*`. The two key spaces never overlap: import writes `custom-*` but the UI reads positional `topicId-qN`. Every custom question score and note is silently discarded after any YAML import.

This affects both `overwriteActive=true` (existing session) and `overwriteActive=false` (new session from import) paths because both call `set({ scores: clampedScores })` from the same `data`.

**Fix:** Key the score and note under the V3-format positional key so that `reKeyImportResultToV4` will convert it to the correct V4 key that `QuestionCard` reads. The default question count for the topic is already available in `topicQuestionCount`:

```ts
// yamlImport.ts — inside the customQuestions.forEach at line 470
customQuestions.forEach((rawCq, cqIndex) => {
  // ... existing validation unchanged ...

  const newCq: CustomQuestion = { id: newId, topicId, text: ..., level: ... };
  result.customQuestions.push(newCq);
  addedCount++;

  // Use positional key (V3 format) — reKeyImportResultToV4 converts to V4 format,
  // matching the `${topicId}-q${N}` key that QuestionCard reads.
  const defaultQCount = topicQuestionCount.get(topicId) ?? 0;
  const positionalKey = `${topicId}-${defaultQCount + cqIndex}`;

  if (typeof cq.score === 'number') {
    result.scores[positionalKey] = cq.score;   // was: result.scores[newId]
    modifiedCount++;
  }
  if (typeof cq.note === 'string' && cq.note !== '') {
    result.notes[positionalKey] = cq.note;     // was: result.notes[newId]
  }
});
```

---

## Warnings

### WR-01: `SearchGroup` `totalQuestions` Does Not Subtract Removed Questions

**File:** `src/components/SearchGroup.tsx:36-43`

**Issue:** `totalQuestions` sums `t.questions.length` for every topic across all sections with no adjustment for `removedDefaultQuestionIds`:

```ts
// SearchGroup.tsx lines 36-43
const totalQuestions = useMemo(
  () =>
    sections.reduce(
      (acc, s) => acc + s.topics.reduce((a, t) => a + t.questions.length, 0),
      0,
    ),
  [sections],   // removedDefaultQuestionIds not in deps
);
```

`resultCount` (line 45) correctly excludes removed questions via `buildFlatRows`. The mismatch means the banner always reads the raw bank total as the denominator. When `isFiltered=false`, the banner reads "Showing all 47 questions" when only 42 are visible (5 removed). When `isFiltered=true`, it reads "Showing 15 of 47" when the reachable maximum is 42. In both cases the denominator is misleading to users who have exercised the remove-question feature.

**Fix:** Filter removed questions from the per-topic count and add `removedDefaultQuestionIds` to the dependency array:

```ts
const totalQuestions = useMemo(
  () =>
    sections.reduce(
      (acc, s) =>
        acc +
        s.topics.reduce(
          (a, t) =>
            a +
            t.questions.filter((q) => !removedDefaultQuestionIds.has(q.id))
              .length,
          0,
        ),
      0,
    ),
  [sections, removedDefaultQuestionIds],
);
```

### WR-02: `SearchGroup` `resultCount` Does Not Honour `hideMarked` Filter

**File:** `src/components/SearchGroup.tsx:45-62`

**Issue:** The `buildFlatRows` call that computes `resultCount` does not pass `hideMarked` or `markedTopicIds`:

```ts
// SearchGroup.tsx lines 47-52
buildFlatRows(sections, topicOpen, sectionOpen, {
  searchQuery,
  selectedDifficulties,
  selectedSections,
  removedDefaultQuestionIds,
  // hideMarked and markedTopicIds are absent
})
```

When `hideMarked=true` is active, `ContentTree` renders fewer question rows (entire marked topics are hidden), but `resultCount` still counts questions in those hidden topics. The banner reports "Showing 30 of 42 questions" when the user can actually see far fewer because every topic they have fully reviewed is also suppressed. This is confusing: the count changes when the user turns "Hide marked" on or off without changing any search or difficulty filter.

**Fix:** Subscribe to `hideMarked` and pass `markedTopicIds` through. The cleanest path is to lift `resultCount` into `App.tsx` where `markedTopicIds` is already computed, and pass it as a prop to `SearchGroup`. Alternatively, duplicate the `markedTopicIds` derivation inside `SearchGroup`:

```ts
// In SearchGroup.tsx — subscribe to hideMarked and derive markedTopicIds
const hideMarked = useAppStore((s) => s.hideMarked);
const scores = useAppStore((s) => s.scores);

const markedTopicIds = useMemo(() => {
  const marked = new Set<string>();
  for (const section of sections) {
    for (const topic of section.topics) {
      const hasScore = topic.questions.some((q, i) => {
        if (removedDefaultQuestionIds.has(q.id)) return false;
        return scores[`${topic.id}-q${i}`] != null;
      });
      if (hasScore) marked.add(topic.id);
    }
  }
  return marked;
}, [sections, scores, removedDefaultQuestionIds]);

const resultCount = useMemo(
  () =>
    buildFlatRows(sections, topicOpen, sectionOpen, {
      searchQuery,
      selectedDifficulties,
      selectedSections,
      removedDefaultQuestionIds,
      hideMarked,
      markedTopicIds,
    }).filter((r) => r.type === 'question').length,
  [sections, searchQuery, selectedDifficulties, selectedSections,
   topicOpen, sectionOpen, removedDefaultQuestionIds, hideMarked, markedTopicIds],
);
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
