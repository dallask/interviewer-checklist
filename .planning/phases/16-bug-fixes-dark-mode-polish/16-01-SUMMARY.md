---
phase: 16
plan: "01"
status: complete
requirements_delivered: [BUG-03, POL-01]
tests_added: 4
tests_passing: true
one_liner: "className-based textarea toggle (BUG-03) and dark:[color-scheme:dark] on score/difficulty selects (POL-01)"
subsystem: QuestionCard, CustomQuestionForm
tags: [bug-fix, dark-mode, textarea, select, css]
dependency_graph:
  requires: []
  provides: [BUG-03-fix, POL-01-fix]
  affects: [QuestionCard, CustomQuestionForm]
tech_stack:
  added: []
  patterns: ["Tailwind className conditional template literal", "dark:[color-scheme:dark] arbitrary variant"]
key_files:
  created: []
  modified:
    - src/components/QuestionCard.tsx
    - src/components/QuestionCard.test.tsx
    - src/components/CustomQuestionForm.tsx
    - src/components/CustomQuestionForm.test.tsx
decisions:
  - "Use className hidden class toggle instead of HTML hidden attribute to avoid React 19 + TanStack Virtual ResizeObserver bypass"
  - "Scope dark:[color-scheme:dark] per-element only; no global :root selector"
metrics:
  duration_seconds: 163
  completed_date: "2026-06-18"
  tasks_completed: 2
  files_modified: 4
---

# Phase 16 Plan 01: Bug Fixes Dark Mode Polish Summary

## What Changed

### src/components/QuestionCard.tsx

**Task 1 (BUG-03):** Removed `hidden={!notesOpen && !printMode}` prop from the notes `<textarea>` element. Added the visibility toggle as a className conditional template literal: `${!notesOpen && !printMode ? ' hidden' : ''}` appended to the existing className string. The `localNote` state and `handleNoteChange` are untouched — note content is preserved across open/close cycles.

**Task 2 (POL-01):** Appended `dark:[color-scheme:dark]` to the end of the score `<select>` className string (after `focus-visible:outline-none`). The existing dark bg/border/text classes were already correct per prior work.

### src/components/QuestionCard.test.tsx

**Task 1:** Updated "clicking note icon button shows the textarea" test:
- Renamed to `'clicking note icon button shows the textarea (className toggle, not hidden attribute)'`
- Moved `const textarea` query before the button click
- Added `expect(textarea.className).toContain('hidden')` (initial closed state assertion)
- Added `expect(textarea.className).not.toContain('hidden')` (open state assertion)
- Kept `expect(textarea).not.toHaveAttribute('hidden')` (confirms HTML attribute absent)

**Task 2:** Added new `it` test: score select `className` contains `[color-scheme:dark]`.

### src/components/CustomQuestionForm.tsx

**Task 2 (POL-01):** Updated difficulty `<select>` className:
- `bg-white` → `bg-gray-100`
- `dark:bg-gray-800` → `dark:bg-gray-700`
- `border-gray-200` → `border-gray-300`
- `dark:border-gray-700` → `dark:border-gray-600`
- Appended `dark:[color-scheme:dark]` at end

### src/components/CustomQuestionForm.test.tsx

**Task 2:** Added two new `it` tests at end of describe block:
1. Difficulty select className contains `[color-scheme:dark]`
2. Difficulty select className contains `dark:bg-gray-700` and `dark:border-gray-600`

## Verification

```
Test Files  126 passed (126)
     Tests  2004 passed (2004)
  Duration  4.34s
```

All tests green, 0 failing.

Acceptance criteria confirmed:
- `grep -c 'hidden={' src/components/QuestionCard.tsx` returns 0
- `grep -c "notesOpen && !printMode ? ' hidden'" src/components/QuestionCard.tsx` returns 1
- `grep -c 'color-scheme:dark' src/components/QuestionCard.tsx` returns 1
- `grep -c 'color-scheme:dark' src/components/CustomQuestionForm.tsx` returns 1
- `grep -c 'dark:bg-gray-700' src/components/CustomQuestionForm.tsx` returns 1
- `grep -c 'dark:border-gray-600' src/components/CustomQuestionForm.tsx` returns 1

## Done Criteria Met

- [x] BUG-03: HTML `hidden` attribute removed from notes textarea; visibility controlled via className `hidden` class toggle
- [x] BUG-03: Note content preserved across open/close cycles (localNote and store note unchanged by toggle)
- [x] BUG-03: QuestionCard tests updated with closed-state, open-state, and no-HTML-attribute assertions
- [x] POL-01: Score dropdown in QuestionCard carries `dark:[color-scheme:dark]`
- [x] POL-01: Difficulty select in CustomQuestionForm carries `dark:[color-scheme:dark]`
- [x] POL-01: Difficulty select aligned to standard `bg-gray-100/dark:bg-gray-700 border-gray-300/dark:border-gray-600` pattern
- [x] No regression: npm test exits 0 with all tests passing
- [x] No deferred scope: font size, transitions, icons, difficulty indicators untouched

## Deviations from Plan

None — plan executed exactly as written.

## Commits

- `fe8aa4e`: fix(16-01): replace hidden attribute with className toggle on notes textarea (BUG-03)
- `fb3000e`: fix(16-01): add dark:[color-scheme:dark] to score and difficulty selects (POL-01)

## Self-Check: PASSED
