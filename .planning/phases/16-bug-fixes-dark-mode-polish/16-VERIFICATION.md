---
phase: 16
slug: bug-fixes-dark-mode-polish
verdict: PASS
verified_at: 2026-06-19
requirements_verified: [BUG-01, BUG-02, BUG-03, POL-01]
tests_passing: 2007
tests_failing: 0
gaps: []
---

# Phase 16 — Verification Report

## Overall Verdict: PASS

All four requirements delivered. 2007 tests passing, 0 failing.

---

## Requirement: BUG-03 — Note Textarea Toggle

**Status: PASS**

The HTML `hidden` attribute has been replaced by a className-based toggle, which reliably triggers TanStack Virtual's ResizeObserver in React 19.

**Evidence:**
```
grep -c 'hidden={' src/components/QuestionCard.tsx  → 0  (attribute removed)
grep -c "notesOpen && !printMode ? ' hidden'" src/components/QuestionCard.tsx  → 1  (className toggle present)
```

QuestionCard.test.tsx updated: test description updated to `'clicking note icon button shows the textarea (className toggle, not hidden attribute)'`; assertions check `textarea.className` contains/not-contains `'hidden'`.

---

## Requirement: POL-01 — Dark Mode Select Readability

**Status: PASS**

Both the score dropdown (QuestionCard) and the difficulty select (CustomQuestionForm) now carry `dark:[color-scheme:dark]`, enabling OS-native dark styling for `<option>` elements.

**Evidence:**
```
grep -c 'color-scheme:dark' src/components/QuestionCard.tsx  → 1  (score select)
grep -c 'color-scheme:dark' src/components/CustomQuestionForm.tsx  → 1  (difficulty select)
grep -c 'dark:bg-gray-700' src/components/CustomQuestionForm.tsx  → 1  (standard dark bg)
```

CustomQuestionForm.tsx difficulty select aligned to standard pattern: `bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 dark:[color-scheme:dark]`.

Scoped per-element only — no `:root` or global `color-scheme` rule introduced.

---

## Requirement: BUG-01 — Section Scroll-After-Add

**Status: PASS**

ContentTree.tsx now detects rows.length growth via useEffect and calls `rowVirtualizer.scrollToIndex(triggerIdx - 1, { align: 'start', behavior: 'auto' })` after React re-renders with the new section row.

**Evidence:**
```
grep -c 'useEffect' src/components/ContentTree.tsx  → 3  (import + declaration)
grep -c 'prevRowsLengthRef' src/components/ContentTree.tsx  → 4  (ref + usages)
grep -c 'scrollToIndex' src/components/ContentTree.tsx  → 3  (section + topic paths + verification)
grep -c "align: 'start'" src/components/ContentTree.tsx  → 2
```

scrollToIndex is called only inside useEffect, never synchronously in form submit handlers.

---

## Requirement: BUG-02 — Topic Scroll-After-Add

**Status: PASS**

Same useEffect in ContentTree.tsx discriminates section vs topic growth via `addTopicOpenFor !== null`. When `addTopicOpenFor` is set, scrolls to the new topic row at `topicTriggerIdx - 1`.

**Evidence:** Same grep evidence as BUG-01 above. No changes to AddSectionForm.tsx or AddTopicForm.tsx (confirmed by clean git diff).

---

## Test Suite

```
Test Files  126 passed (126)
Tests       2007 passed (2007)
Duration    17.51s
```

Baseline was 667; new assertions added by plans 16-01 (4 new test assertions in QuestionCard.test.tsx + CustomQuestionForm.test.tsx). All tests green.

---

## Gaps

None. All four requirements verified. No deferred scope introduced.
