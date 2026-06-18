---
phase: 15-sidebar-shell-refactor-compact-questioncard
reviewed: 2026-06-18T00:00:00Z
depth: standard
iteration: 2
files_reviewed: 11
files_reviewed_list:
  - src/components/AboutModal.tsx
  - src/components/ActionsGroup.tsx
  - src/components/QuestionCard.tsx
  - src/components/Sidebar.tsx
  - src/components/SidebarFooter.tsx
  - src/components/SidebarHeader.tsx
  - src/components/AboutModal.test.tsx
  - src/components/QuestionCard.test.tsx
  - src/components/Sidebar.test.tsx
  - src/components/SidebarFooter.test.tsx
  - src/components/SidebarHeader.test.tsx
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 15: Code Review Report (Iteration 2)

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 11
**Iteration:** 2 (re-review after fixes)
**Status:** issues_found

## Summary

All four prior warnings are verified resolved:

- **WR-01 resolved.** `AboutModal.tsx` line 20: focus trap selector now leads with `a[href]`, covering the `<a href="https://kivgila.pro">` link inside the dialog. The empty-focusable-list guard (line 23) is also present.
- **WR-02 resolved.** `Sidebar.test.tsx` `makeState()` now covers all `ActionsGroup` fields: `manifest`, `activeSessionId`, `notes`, `topicNotes`, `candidate`, `hideNotes`, `setHideNotes`, `removedDefaultQuestionIds`, `expandAll`, `collapseAll`, `darkMode`, `setDarkMode`.
- **WR-03 resolved.** `QuestionCard.test.tsx` adds three tests for the `isDefaultQuestion` delete path (lines 245–278): button renders with aria-label "Remove question", click dispatches `removeDefaultQuestion('q-react-001')`, and click is a no-op when `questionBankId` is `undefined`.
- **WR-04 resolved.** `ActionsGroup.tsx` `handleImportConfirm` (lines 134–143) wraps `importSession` in `try/finally`, ensuring `setImportPreview(null)` always executes regardless of whether `importSession` throws.

Two residual issues were found.

---

## Warnings

### WR-01: Third WR-03 test name contradicts what the test body asserts

**File:** `src/components/QuestionCard.test.tsx:269`

**Issue:** The test is titled `'does NOT render delete button for default question when questionBankId is null'`. The body contradicts this: `screen.getByRole('button', { name: 'Remove question' })` succeeds (throws if the element is absent), which proves the button **is** rendered. The test only verifies that clicking the rendered button is a no-op. A maintainer reading the title will conclude the button is suppressed in this case, and will not test for its presence or its accessible label — obscuring a real user-visible behaviour (a delete button appears but silently does nothing when `questionBankId` is missing). If someone later adds a guard to hide the button in this case and the test still passes, the misleading title will mask the behavioural change.

**Fix:** Rename the test to accurately reflect what it verifies:

```typescript
// Before:
it('does NOT render delete button for default question when questionBankId is null', () => {

// After:
it('delete button for default question with undefined questionBankId renders but is a no-op', () => {
```

---

## Info

### IN-01: Test for regular-question delete-button absence only checks the custom label, not the default label

**File:** `src/components/QuestionCard.test.tsx:218`

**Issue:** The test `'does NOT render delete button for regular questions'` asserts only that no button labelled `'Delete custom question'` is present. It does not assert the absence of `'Remove question'`. If `buildFlatRows.ts` ever accidentally sets `isDefaultQuestion: true` on all rows, the test would still pass, while a "Remove question" button appeared on every question card in production.

**Fix:** Add a second `queryByRole` assertion to the existing test:

```typescript
it('does NOT render delete button for regular questions', () => {
  render(<QuestionCard row={mockRow} />);
  expect(
    screen.queryByRole('button', { name: 'Delete custom question' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Remove question' }),
  ).not.toBeInTheDocument();
});
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Iteration: 2_
