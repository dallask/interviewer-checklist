---
phase: 14-editable-bank-yaml-schema-expansion
fixed_at: 2026-06-18T12:45:00Z
review_path: .planning/phases/14-editable-bank-yaml-schema-expansion/14-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-06-18T12:45:00Z
**Source review:** .planning/phases/14-editable-bank-yaml-schema-expansion/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (4 Critical, 5 Warning)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: `removedDefaultQuestionIds` never passed to `buildFlatRows` — removed questions stay visible

**Files modified:** `src/app/App.tsx`
**Commit:** 2f1b9f5
**Applied fix:** Added `const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds)` selector and forwarded it as `removedDefaultQuestionIds` in the `buildFlatRows` filters object. CR-01 and WR-05 were committed together since WR-05 requires the same selector.

---

### CR-02: `main.tsx` bootstrap omits `removedDefaultQuestionIds` — filter state lost on reload

**Files modified:** `src/app/main.tsx`
**Commit:** 7ce9111
**Applied fix:** Added `removedDefaultQuestionIds: new Set(session.removedDefaultQuestionIds ?? [])` to the `useAppStore.setState` call inside the `if (session)` block at bootstrap, restoring the persisted removed-question filter on every page load.

---

### CR-03: Custom question scores/notes always export as `null`/`''` — data loss on YAML export

**Files modified:** `src/utils/yamlExport.ts`
**Commit:** ce99f4e
**Applied fix:** Changed `topicCustomQs.map((cq) => ...)` to `topicCustomQs.map((cq, cqIndex) => ...)` and replaced `session.scores[cq.id]` / `session.notes[cq.id]` lookups with `session.scores[positionalKey]` / `session.notes[positionalKey]` where `positionalKey = \`${topic.id}-q${topic.questions.length + cqIndex}\``. This matches the key format written by QuestionCard via `setScore`.

---

### CR-04: User-added section topics' scores/notes silently dropped on YAML v2 re-import

**Files modified:** `src/utils/yamlImport.ts`
**Commit:** a680de6
**Applied fix:** Moved `schemaVersion` extraction to before the `topicIdSet` / `topicQuestionCount` building block. Added a pre-loop block that, when `schemaVersion >= 2` and `bank.addedSections` is present, iterates those sections' topics and adds each topic's `id` and `questions.length` to `topicIdSet` / `topicQuestionCount`. Removed the duplicate `const schemaVersion` declaration that existed after the main sections loop.

---

### WR-01: Invalid HTML — `<button>` nested inside `<button>` in `SectionRow` and `TopicRow`

**Files modified:** `src/components/SectionRow.tsx`, `src/components/TopicRow.tsx`
**Commit:** 1d746b5
**Applied fix:** Replaced the outer `<button>` toggle wrapper with a `<div>` flex container in both components. The toggle button is now `flex-1` inside the container, and the delete button is a sibling element rendered after it. The `stopPropagation()` workaround and associated comment were removed since the buttons are no longer nested.

---

### WR-02: `SearchGroup.tsx` `resultCount` does not account for `removedDefaultQuestionIds`

**Files modified:** `src/components/SearchGroup.tsx`
**Commit:** 1d94e93
**Applied fix:** Added `const removedDefaultQuestionIds = useAppStore((s) => s.removedDefaultQuestionIds)` selector and passed it to the `buildFlatRows` call in `resultCount`'s `useMemo`. Added `removedDefaultQuestionIds` to the `useMemo` dependency array.

---

### WR-03: `bank.addedSections` unsafe cast — no shape validation

**Files modified:** `src/utils/yamlImport.ts`
**Commit:** cf9a2c9
**Applied fix:** Replaced `(s.topics as V4Section['topics'])` with a `reduce` that validates each topic entry (requires `id: string` and `name: string`) and each question entry (requires `id: string` and `text: string`) before pushing. Invalid entries are silently skipped. `level` defaults to `'novice'` if not a valid enum value. `desc`, `tag` default to `''`. All pushed objects are `isDefault: false`.

---

### WR-04: `Date.now()`-only collision risk in form IDs — add `Math.random()` suffix

**Files modified:** `src/components/AddSectionForm.tsx`, `src/components/AddTopicForm.tsx`
**Commit:** eeeaebd
**Applied fix:** Appended `-${Math.random().toString(36).slice(2, 7)}` to both ID generation expressions: `custom-section-${Date.now()}-<rand>` and `custom-topic-${sectionId}-${Date.now()}-<rand>`.

---

### WR-05: `markedTopicIds` calculation ignores `removedDefaultQuestionIds` — stale "marked" state

**Files modified:** `src/app/App.tsx`
**Commit:** 2f1b9f5 (combined with CR-01)
**Applied fix:** Changed `topic.questions.some((_, i) => ...)` to `topic.questions.some((q, i) => ...)` to capture the question object, added `if (removedDefaultQuestionIds.has(q.id)) return false;` as the first guard inside the callback, and added `removedDefaultQuestionIds` to the `useMemo` dependency array.

---

_Fixed: 2026-06-18T12:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
