---
phase: 14-editable-bank-yaml-schema-expansion
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/app/App.tsx
  - src/components/ActionsGroup.tsx
  - src/components/AddSectionForm.tsx
  - src/components/AddTopicForm.tsx
  - src/components/ContentTree.tsx
  - src/components/QuestionCard.tsx
  - src/components/SearchGroup.tsx
  - src/components/SectionRow.tsx
  - src/components/TopicRow.tsx
  - src/storage/migrations/v3-to-v4.ts
  - src/storage/types.ts
  - src/store/app.ts
  - src/utils/buildFlatRows.ts
  - src/utils/yamlExport.ts
  - src/utils/yamlImport.ts
findings:
  critical: 4
  warning: 5
  info: 2
  total: 11
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 14 introduces editable bank sections/topics, default-question removal, and YAML schema v2 with bank delta support. The persistence and routing infrastructure is largely correct — the subscribe block correctly serializes the `removedDefaultQuestionIds` Set, `switchSession` and `importSession` correctly restore it from storage, and the `removeDefaultQuestion` action correctly mutates the Set.

However, two independent wiring failures mean the `removeDefaultQuestion` feature is completely non-functional end-to-end in practice: (1) `App.tsx` never reads `removedDefaultQuestionIds` from the store and never passes it to `buildFlatRows`, so removed questions continue to appear in the UI immediately after removal; (2) `main.tsx` omits `removedDefaultQuestionIds` from the bootstrap session-hydration block, so the filter resets to empty on every page reload even though the data is persisted correctly in storage.

A third critical data-loss bug exists in `yamlExport.ts`: custom-question scores and notes are always exported as `null`/`''` because the lookup key is `cq.id` (e.g. `custom-javascript-1718000000`) but the Zustand store holds scores under the positional key `${topicId}-q${N+i}` written by `QuestionCard`.

A fourth critical correctness issue affects YAML v2 round-trip: topics inside `bank.addedSections` are treated as "unmatched" in `parseStructural`'s main section loop (they are not in `topicIdSet`), so all scores, notes, and overrides for questions in user-added sections are silently discarded on re-import.

---

## Critical Issues

### CR-01: `removedDefaultQuestionIds` never passed to `buildFlatRows` — removed questions stay visible

**File:** `src/app/App.tsx:54`

**Issue:** `App.tsx` does not subscribe to `removedDefaultQuestionIds` from the store and does not pass it in the `filters` object to `buildFlatRows`. The `buildFlatRows` function accepts `removedDefaultQuestionIds?: Set<string>` in its filters and correctly guards with `filters.removedDefaultQuestionIds?.has(question.id)`, but because the field is never supplied, every call from `App.tsx` treats it as `undefined` — the optional-chain short-circuits and no question is ever filtered out. The `removeDefaultQuestion` store action, the subscribe-block persistence, and `switchSession`/`importSession` restoration are all correct, but none of that matters because the rendering pipeline ignores the Set entirely.

**Fix:**
```tsx
// src/app/App.tsx — add selector and forward to buildFlatRows
const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds);

const rows = buildFlatRows(sections, topicOpen, sectionOpen, {
  searchQuery,
  selectedDifficulties,
  selectedSections,
  hideMarked,
  markedTopicIds,
  customQuestions,
  removedDefaultQuestionIds,   // <-- add this line
});
```

---

### CR-02: `main.tsx` bootstrap omits `removedDefaultQuestionIds` — filter state lost on reload

**File:** `src/app/main.tsx:58`

**Issue:** The session-hydration block at lines 58–66 restores `sections`, `scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, and `candidate` from the loaded `V4Session`, but silently omits `removedDefaultQuestionIds`. The field is defined in `V4SessionSchema` (types.ts line 180), written to storage by the subscribe block (app.ts line 751), and correctly initialized on `switchSession` and `importSession` — but the bootstrap path does not restore it. On every page reload the Set defaults to the empty set from `DEFAULT_STATE`, making all previously removed questions reappear. The data is in storage; only the read path is missing.

**Fix:**
```tsx
// src/app/main.tsx — inside the `if (session)` block (around line 58)
useAppStore.setState({
  sections: session.sections ?? [],
  removedDefaultQuestionIds: new Set(session.removedDefaultQuestionIds ?? []),  // <-- add
  scores: session.scores ?? {},
  overrides: session.overrides ?? {},
  notes: session.notes ?? {},
  topicNotes: session.topicNotes ?? {},
  customQuestions: session.customQuestions ?? [],
  candidate: session.candidate ?? null,
});
```

---

### CR-03: Custom question scores/notes always export as `null`/`''` — data loss on YAML export

**File:** `src/utils/yamlExport.ts:51`

**Issue:** `exportSession` looks up custom question scores with `session.scores[cq.id]` and notes with `session.notes[cq.id]`. However, `QuestionCard` writes scores via `setScore(questionId, ...)` where `questionId = \`${row.topicId}-q${row.index}\`` and `row.index = topic.questions.length + customForTopic.indexOf(cq)` (buildFlatRows.ts line 227). The Zustand store therefore holds custom question scores under positional keys such as `javascript-q5`, never under `cq.id` such as `custom-javascript-1718000000`. Every YAML export silently discards all custom question scores and notes, replacing them with `null` and `''` respectively. This is a data-loss regression — the user sees scores in the UI but the exported file carries zeros.

**Fix:**
```ts
// src/utils/yamlExport.ts — compute positional key for each custom question
customQuestions: topicCustomQs.map((cq, cqIndex) => {
  const positionalKey = `${topic.id}-q${topic.questions.length + cqIndex}`;
  return {
    id: cq.id,
    text: cq.text,
    level: cq.level,
    score: session.scores[positionalKey] ?? null,   // was: session.scores[cq.id]
    note: session.notes[positionalKey] ?? '',        // was: session.notes[cq.id]
  };
}),
```

Note: `topicCustomQs` is already declared above in the same closure, so `cqIndex` is the correct offset within that filtered array — matching the `customForTopic.indexOf(cq)` formula in `buildFlatRows`.

---

### CR-04: User-added section topics' scores/notes silently dropped on YAML v2 re-import

**File:** `src/utils/yamlImport.ts:350`

**Issue:** `parseStructural` builds `topicIdSet` and `topicQuestionCount` exclusively from the `sections` parameter (DEFAULT_SECTIONS). When a v2 YAML is re-imported after the user has added custom sections, those added sections appear both in the `bank.addedSections` block and in `obj.sections`. The main section loop processes `obj.sections` first and hits the `!isKnownTopic` guard at line 350–354 for every topic in an added section, incrementing `unmatchedCount` and skipping (`continue`) before any scores, notes, or overrides are extracted. The `bank.addedSections` processing at line 498+ only reconstructs the `V4Section` structure; it never retroactively processes the scores that were skipped in the earlier loop. Any scored or annotated question inside a user-added section is permanently lost on re-import.

**Fix:** Before the main section-processing loop, also populate `topicIdSet` and `topicQuestionCount` from the YAML's own `bank.addedSections` topics, so those topic IDs are treated as "known" during the score/note extraction pass:

```ts
// After building topicIdSet/topicQuestionCount from DEFAULT_SECTIONS (line ~271),
// also register topics from bank.addedSections if present:
if (
  schemaVersion >= 2 &&
  obj.bank != null &&
  Array.isArray((obj.bank as Record<string, unknown>).addedSections)
) {
  for (const rawSec of (obj.bank as Record<string, unknown>).addedSections as unknown[]) {
    if (rawSec == null || typeof rawSec !== 'object') continue;
    const sec = rawSec as Record<string, unknown>;
    if (!Array.isArray(sec.topics)) continue;
    for (const rawTopic of sec.topics as unknown[]) {
      if (rawTopic == null || typeof rawTopic !== 'object') continue;
      const t = rawTopic as Record<string, unknown>;
      const tid = typeof t.id === 'string' ? t.id : '';
      if (!tid) continue;
      topicIdSet.add(tid);
      const qCount = Array.isArray(t.questions) ? t.questions.length : 0;
      topicQuestionCount.set(tid, qCount);
    }
  }
}
```

This must be computed before the `incomingSections` loop because `schemaVersion` is extracted later in the current code; refactor to extract `schemaVersion` and `bank` before the loop.

---

## Warnings

### WR-01: Invalid HTML — `<button>` nested inside `<button>` in `SectionRow` and `TopicRow`

**File:** `src/components/SectionRow.tsx:31` and `src/components/TopicRow.tsx:77`

**Issue:** Both `SectionRow` and `TopicRow` render a delete `<button>` as a direct descendant of the outer toggle `<button>`. The HTML specification (§4.8.2 "Phrasing content") prohibits interactive content inside a `<button>` element — a `<button>` cannot contain another `<button>`. While `stopPropagation()` mitigates the click-event side-effect, the DOM is invalid. Different browser rendering engines handle this inconsistently: Chromium typically promotes the inner button to a sibling, which can break layout and tab-order. Screen-reader virtual cursor behavior is also undefined. The comment acknowledges this as a known constraint but does not mitigate the spec violation.

**Fix:** Change the outer toggle element from a `<button>` to a `<div>` with role and keyboard handling, or move the delete button outside the toggle button as a sibling:

```tsx
// SectionRow.tsx — split into row container + toggle span + delete button
<div
  className="... w-full flex items-center justify-between cursor-pointer ..."
>
  <button
    type="button"
    aria-expanded={!isCollapsed}
    onClick={() => toggleSectionOpen(row.id)}
    className="flex-1 flex items-center gap-2 text-left ..."
  >
    <span>{row.icon} {row.label}</span>
    <span className="text-sm font-normal text-gray-500 ...">
      {row.questionCount} questions
    </span>
  </button>
  {row.isDefault === false && (
    <button
      type="button"
      aria-label={`Remove section ${row.label}`}
      onClick={() => removeSection(row.id)}
      className="..."
    >
      ×
    </button>
  )}
</div>
```

---

### WR-02: `SearchGroup.tsx` `resultCount` does not account for `removedDefaultQuestionIds`

**File:** `src/components/SearchGroup.tsx:44`

**Issue:** `SearchGroup` calls `buildFlatRows` to compute `resultCount` but passes no `removedDefaultQuestionIds` in the filter object. After the user removes one or more default questions, the `resultCount` shown in the "Showing X of Y questions" line will be higher than the actual number of rendered question rows (since `App.tsx` also currently lacks this — see CR-01 — but once CR-01 is fixed, the discrepancy will become visible). This produces a confusing count mismatch in the sidebar.

**Fix:**
```tsx
// src/components/SearchGroup.tsx — add selector and forward
const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds);

const resultCount = useMemo(
  () =>
    buildFlatRows(sections, topicOpen, sectionOpen, {
      searchQuery,
      selectedDifficulties,
      selectedSections,
      removedDefaultQuestionIds,   // <-- add
    }).filter((r) => r.type === 'question').length,
  [sections, searchQuery, selectedDifficulties, selectedSections, topicOpen, sectionOpen, removedDefaultQuestionIds],
);
```

---

### WR-03: `bank.addedSections` topics accepted via unsafe cast — no shape validation

**File:** `src/utils/yamlImport.ts:519`

**Issue:** When processing `bank.addedSections`, each section's `topics` array is cast directly to `V4Section['topics']` (`s.topics as V4Section['topics']`) with no per-topic shape validation. A malformed topic — e.g. one missing `id`, `name`, `questions`, or with `questions` as a non-array — will be stored in `result.sections` and then loaded into the Zustand `sections` state. Downstream code in `TopicRow` (accesses `row.topic.name`, `row.topic.isDefault`), `buildFlatRows` (iterates `topic.questions`), and the subscribe block (iterates `section.topics`) will encounter `undefined` at runtime, potentially producing uncaught type errors or incorrect renders.

**Fix:** Validate each topic entry before pushing it. A minimal guard:

```ts
topics: Array.isArray(s.topics)
  ? (s.topics as unknown[]).reduce<V4Section['topics']>((acc, rawTopic) => {
      if (rawTopic == null || typeof rawTopic !== 'object') return acc;
      const t = rawTopic as Record<string, unknown>;
      if (typeof t.id !== 'string' || typeof t.name !== 'string') return acc;
      acc.push({
        id: t.id,
        name: t.name,
        desc: typeof t.desc === 'string' ? t.desc : '',
        tag: typeof t.tag === 'string' ? t.tag : '',
        isDefault: false,
        questions: Array.isArray(t.questions)
          ? (t.questions as unknown[]).reduce<V4Section['topics'][number]['questions']>(
              (qs, rawQ) => {
                if (rawQ == null || typeof rawQ !== 'object') return qs;
                const qr = rawQ as Record<string, unknown>;
                if (typeof qr.id !== 'string' || typeof qr.text !== 'string') return qs;
                qs.push({
                  id: qr.id,
                  text: qr.text,
                  level: ['novice','intermediate','advanced','expert'].includes(qr.level as string)
                    ? (qr.level as V4Section['topics'][number]['questions'][number]['level'])
                    : 'novice',
                  isDefault: false,
                });
                return qs;
              }, []
            )
          : [],
      });
      return acc;
    }, [])
  : [],
```

---

### WR-04: `Date.now()`-based IDs in `AddSectionForm` and `AddTopicForm` — collision risk

**File:** `src/components/AddSectionForm.tsx:17` and `src/components/AddTopicForm.tsx:18`

**Issue:** Section and topic IDs are generated with `\`custom-section-${Date.now()}\`` and `\`custom-topic-${sectionId}-${Date.now()}\``. If the user submits two forms within the same millisecond (possible in automated testing or via keyboard shortcut double-submit), two entities receive the same ID. This causes `removeSection`/`removeTopic` to delete both matching entries silently (the filter removes all rows with the ID), and may cause React key collisions in the virtualizer. `CustomQuestionForm` already uses `Date.now()-${cqIndex}` to avoid this; the same pattern should apply here.

**Fix:**
```tsx
// AddSectionForm.tsx
id: `custom-section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

// AddTopicForm.tsx
id: `custom-topic-${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
```

Alternatively, use `crypto.randomUUID()` (already used elsewhere in app.ts).

---

### WR-05: `markedTopicIds` calculation ignores `removedDefaultQuestionIds` — stale "marked" state

**File:** `src/app/App.tsx:43`

**Issue:** The `markedTopicIds` memo iterates `topic.questions` for every question index and checks whether `scores[key]` is non-null. It does not skip questions that are in `removedDefaultQuestionIds`. After a default question is removed, its score may still exist in the `scores` map (the store does not purge scores on removal, per design). The topic will remain "marked" even though the question driving the mark is no longer visible, causing it to be hidden by the "Hide marked topics" toggle when it should remain visible (all its active questions might be unscored).

**Fix:** After fixing CR-01 (adding `removedDefaultQuestionIds` to the `App.tsx` subscriptions), also skip removed questions in the `markedTopicIds` memo:

```tsx
const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds);

const markedTopicIds = useMemo(() => {
  const marked = new Set<string>();
  for (const section of sections) {
    for (const topic of section.topics) {
      const hasScore = topic.questions.some((q, i) => {
        if (removedDefaultQuestionIds.has(q.id)) return false;   // skip removed
        const key = `${topic.id}-q${i}`;
        return scores[key] !== null && scores[key] !== undefined;
      });
      if (hasScore) marked.add(topic.id);
    }
  }
  return marked;
}, [scores, sections, removedDefaultQuestionIds]);
```

---

## Info

### IN-01: `AddSectionForm` name input lacks `maxLength` constraint

**File:** `src/components/AddSectionForm.tsx:31`

**Issue:** The icon input has `maxLength={2}` but the section name input has no length constraint. A user can type an arbitrarily long string which gets stored in `V4Section.label`. While not a security issue (content is never rendered as HTML), extremely long labels will overflow the `SectionRow` header and may exceed storage quotas when multiplied across sections.

**Fix:** Add `maxLength={100}` (or a similarly generous but bounded limit) to the section name input. Apply the same to `AddTopicForm`'s name and desc inputs for consistency.

---

### IN-02: `parseStructural` double-null coercion is redundant

**File:** `src/utils/yamlImport.ts:359`

**Issue:** The override extraction reads:
```ts
typeof topic.override === 'number'
  ? topic.override
  : topic.override === null
    ? null
    : null;
```
Both non-number branches return `null`, making the second `null` dead code that adds no semantic distinction. This is a minor readability issue but may obscure intent (was there a plan for a third case?).

**Fix:**
```ts
result.overrides[topicId] =
  typeof topic.override === 'number' ? topic.override : null;
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
