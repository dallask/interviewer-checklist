---
phase: 15-sidebar-shell-refactor-compact-questioncard
fixed_at: 2026-06-18T16:41:49Z
review_path: .planning/phases/15-sidebar-shell-refactor-compact-questioncard/15-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-06-18T16:41:49Z
**Source review:** `.planning/phases/15-sidebar-shell-refactor-compact-questioncard/15-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Focus trap in `AboutModal` excludes anchor elements

**Files modified:** `src/components/AboutModal.tsx`
**Commit:** 1896b7f
**Applied fix:** Prepended `a[href],` to the `querySelectorAll` selector string in `handleKeyDown`. The selector was `'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'`; it is now `'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'`. This ensures the `<a href="https://kivgila.pro">` link inside the modal is included in the focus trap boundary, preventing keyboard users from tabbing out of the modal.

---

### WR-02: `Sidebar.test.tsx` mock state incomplete for ActionsGroup fields

**Files modified:** `src/components/Sidebar.test.tsx`
**Commit:** 25fb67d
**Applied fix:** Extended `makeState()` with the fields consumed by `ActionsGroup` (rendered inside `Sidebar`): `manifest: null`, `activeSessionId: ''`, `notes: {}`, `topicNotes: {}`, `candidate: { name: '', role: '' }`, `hideNotes: false`, `setHideNotes: vi.fn()`, `removedDefaultQuestionIds: new Set<string>()`. This prevents selectors from receiving `undefined` when ActionsGroup reads these fields from the mock store — fixing the silent ARIA violation on toggle buttons (`aria-pressed={undefined}`) and preventing a `TypeError` if `handleExportYaml` is ever called in a future test.

---

### WR-03: No test for `isDefaultQuestion` delete path in `QuestionCard.test.tsx`

**Files modified:** `src/components/QuestionCard.test.tsx`
**Commit:** 22ba5a1
**Applied fix:** Added `mockDefaultRow` fixture and three new test cases covering the default-question delete path:
1. Renders delete button with aria-label `"Remove question"` for default questions.
2. Clicking the delete button calls `removeDefaultQuestion` with the correct `questionBankId`.
3. When `questionBankId` is `undefined`, clicking the delete button does NOT call `removeDefaultQuestion` (the guard `row.questionBankId != null` is verified to no-op correctly).

---

### WR-04: `setImportPreview(null)` not called on import failure in `ActionsGroup.tsx`

**Files modified:** `src/components/ActionsGroup.tsx`
**Commit:** 90477fc
**Applied fix:** Wrapped the `importSession` call in a `try/finally` block so `setImportPreview(null)` is always called — even when `importSession` throws. This prevents stale `importPreview` state after an import error, which could otherwise allow the same import data to be silently re-applied on a second confirm attempt.

---

## Test Results

All 675 tests pass (42 test files). The 3 new tests added for WR-03 all pass. No regressions introduced.

---

_Fixed: 2026-06-18T16:41:49Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

---

## Iteration 2 Fix Notes

**Fixed at:** 2026-06-18T16:47:00Z
**Source review:** `.planning/phases/15-sidebar-shell-refactor-compact-questioncard/15-REVIEW.md` (iteration 2)
**Findings in scope:** 2 (1 Warning, 1 Info)
**Fixed:** 2
**Skipped:** 0

### WR-01: Rename misleading test name for default question no-op case

**Files modified:** `src/components/QuestionCard.test.tsx`
**Commit:** 471d010
**Applied fix:** Renamed the test at line 269 from `'does NOT render delete button for default question when questionBankId is null'` to `'delete button for default question with undefined questionBankId renders but is a no-op'`. The old name contradicted the test body (which calls `getByRole` — proving the button is rendered). The new name accurately describes what the test verifies: the button is rendered but clicking it is a no-op when `questionBankId` is undefined.

### IN-01: Add Remove question absence assertion for regular questions

**Files modified:** `src/components/QuestionCard.test.tsx`
**Commit:** 85bd863
**Applied fix:** Added a second `queryByRole` assertion to the `'does NOT render delete button for regular questions'` test at line 218. The test now also asserts `screen.queryByRole('button', { name: 'Remove question' }).not.toBeInTheDocument()`, closing the gap where `isDefaultQuestion: true` accidentally set on all rows would produce a visible "Remove question" button while the test still passed.

### Test Results (Iteration 2)

All 675 tests pass (42 test files). No regressions introduced.

---

_Fixed: 2026-06-18T16:47:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
