---
phase: 16
plan: "02"
status: complete
requirements_delivered: [BUG-01, BUG-02]
tests_passing: true
subsystem: content-tree
tags: [bug-fix, virtualizer, scroll, ux]
dependency_graph:
  requires: []
  provides: [scroll-after-add-section, scroll-after-add-topic]
  affects: [ContentTree]
tech_stack:
  added: []
  patterns: [useEffect-driven-scroll, prevRowsLengthRef]
key_files:
  created: []
  modified:
    - src/components/ContentTree.tsx
decisions:
  - useEffect dependency array includes rows, rowVirtualizer, addTopicOpenFor to avoid stale closure bugs
  - prevRowsLengthRef initialized to rows.length (not 0) to avoid spurious scroll on mount
  - scrollToIndex called only inside useEffect, never synchronously in event handlers
metrics:
  duration: "~5 minutes"
  completed: "2026-06-18"
  tasks_completed: 1
  files_modified: 1
---

# Phase 16 Plan 02: Scroll-After-Add (BUG-01, BUG-02) Summary

## One-liner

useEffect-driven scrollToIndex in ContentTree scrolls new section/topic rows into view after virtualizer re-render.

## What Changed

### src/components/ContentTree.tsx

1. **Import line (line 2):** Added `useEffect` to the React import: `import { useEffect, useRef, useState } from 'react'`

2. **After `rowVirtualizer` declaration, before `const virtualItems`:** Inserted:
   - `prevRowsLengthRef` — a `useRef<number>` initialized to `rows.length`, used to detect when rows array grows
   - A `useEffect` with dependency array `[rows, rowVirtualizer, addTopicOpenFor]` that:
     - Detects `rows.length > prevRowsLengthRef.current` (row count grew)
     - If `addTopicOpenFor !== null` (BUG-02): finds the `add-topic-trigger` row whose `sectionId` matches `addTopicOpenFor`; scrolls to `topicTriggerIdx - 1` (the newly added topic row)
     - Else (BUG-01): finds the `add-section-trigger` row index; scrolls to `triggerIdx - 1` (the newly added section row)
     - Both scroll calls use `{ align: 'start', behavior: 'auto' }`
     - Updates `prevRowsLengthRef.current = rows.length` in all code paths

No changes to AddSectionForm.tsx, AddTopicForm.tsx, or any other file.

## Verification

### Acceptance Criteria Checks

- `grep -n 'useEffect' src/components/ContentTree.tsx` — matches on import line (line 2) and usage (lines 49, 53)
- `grep -c 'prevRowsLengthRef' src/components/ContentTree.tsx` — returns 4 (declaration + 3 usages)
- `grep -c 'scrollToIndex' src/components/ContentTree.tsx` — returns 3 (2 calls + 1 comment mention)
- `grep -c "align: 'start'" src/components/ContentTree.tsx` — returns 2 (one per scrollToIndex call)
- `git diff --stat src/components/AddSectionForm.tsx src/components/AddTopicForm.tsx` — no output (no changes)

### Test Results

Worktree-scoped tests (42 test files, 667 tests): all passing.

Full suite note: 3 failures in sibling worktree `agent-a0d16bff306b6840c` (CustomQuestionForm dark mode tests, QuestionCard dark mode tests) — pre-existing, unrelated to this plan, out of scope per deviation rules.

## Done Criteria Met

- [x] BUG-01: After AddSection form submit, the new section row scrolls into viewport
- [x] BUG-02: After AddTopic form submit, the new topic row scrolls into viewport
- [x] scrollToIndex is never called synchronously in form submit handlers — only inside useEffect
- [x] No regression: worktree npm test exits 0 with 667 passing tests
- [x] AddSectionForm.tsx and AddTopicForm.tsx are not modified

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — this change adds no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- src/components/ContentTree.tsx: FOUND (worktree path confirmed)
- Commit 906da25: FOUND in git log
