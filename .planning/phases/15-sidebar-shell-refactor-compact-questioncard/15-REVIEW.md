---
phase: 15-sidebar-shell-refactor-compact-questioncard
reviewed: 2026-06-18T00:00:00Z
depth: standard
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
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the sidebar shell refactor and compact QuestionCard implementation.
The overall structure is sound: components follow established patterns, state
subscriptions are granular, cleanup effects are present, and the focus-trap
implementation is technically correct.

Four warnings were found — three logic/robustness issues and one missing test
coverage gap for a code path that silently no-ops today but could silently
misbehave if upstream data changes. Three informational items are noted for
maintainability.

No critical issues (security, data loss, or crash-level correctness bugs) were
found.

## Warnings

### WR-01: Focus trap in `AboutModal` excludes anchor elements — keyboard users can escape the modal

**File:** `src/components/AboutModal.tsx:19-21`

**Issue:** The focus trap `querySelectorAll` selector is:
```
'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
```
This omits `a[href]`, which is a natively focusable element. The modal contains
an `<a href="https://kivgila.pro">` link (line 77). Because anchors with `href`
are focusable but not listed, a keyboard user can Tab past the Close button onto
the link and then Tab out of the modal entirely — the trap wraps based on the
wrong boundary. The link is the last real focusable element; the trap wraps at
Close (second-to-last from the trap's perspective) and misses the link
altogether.

**Fix:** Add `a[href]` to the selector:
```typescript
const focusable = dialogEl.querySelectorAll<HTMLElement>(
  'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
);
```

---

### WR-02: `Sidebar.test.tsx` mock state is missing all `ActionsGroup` fields — tests pass only because the component renders but selector calls return `undefined`

**File:** `src/components/Sidebar.test.tsx:29-62`

**Issue:** `makeState()` in `Sidebar.test.tsx` does not include fields consumed
by `ActionsGroup`, which is rendered inside `Sidebar` through `SidebarGroup`.
Missing keys include `manifest`, `activeSessionId`, `notes`, `topicNotes`,
`candidate`, `overrides` (partial), `expandAll`, `collapseAll`, `hideNotes`,
`setHideNotes`, `setDarkMode`, `darkMode`, `removedDefaultQuestionIds`.

When `useAppStore` is called with a selector that reads one of these missing
keys, the selector receives `undefined` rather than the typed value. This means:
- `manifest?.sessions.find(...)` silently resolves to `undefined` — correct
  behavior by accident.
- `removedDefaultQuestionIds` is `undefined`, so `[...removedDefaultQuestionIds]`
  in `handleExportYaml` would throw a `TypeError` if triggered.
- Boolean toggles (`darkMode`, `hideNotes`) are `undefined`, so
  `aria-pressed={undefined}` on toggle buttons — a subtle ARIA violation.

Tests pass because none of the tests exercise the ActionsGroup interactions.
The mock is incomplete enough that a future test which fires an ActionsGroup
button click will see a crash that looks unrelated to the state setup.

**Fix:** Extend `makeState()` to include all fields consumed by child
components, or hoist ActionsGroup-specific fields into the Sidebar mock state:
```typescript
function makeState(overrides: Record<string, unknown> = {}) {
  return {
    // ... existing fields ...
    manifest: null,
    activeSessionId: '',
    notes: {},
    topicNotes: {},
    candidate: { name: '', role: '' },
    darkMode: false,
    setDarkMode: vi.fn(),
    hideNotes: false,
    setHideNotes: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
    removedDefaultQuestionIds: new Set<string>(),
    ...overrides,
  };
}
```

---

### WR-03: `QuestionCard.test.tsx` has no coverage for the `isDefaultQuestion` delete path

**File:** `src/components/QuestionCard.test.tsx` (overall test suite)

**Issue:** `QuestionCard` renders a delete button for both custom questions
(`isCustom === true`) and default bank questions (`isDefaultQuestion === true`),
branching to call `deleteCustomQuestion` vs `removeDefaultQuestion` respectively
(lines 103-118 in `QuestionCard.tsx`). The test suite only covers the custom
question path (via `mockCustomRow`). No test constructs a row with
`isDefaultQuestion: true` to verify:
1. The delete button label is `'Remove question'` (not `'Delete custom question'`).
2. Clicking it calls `removeDefaultQuestion(row.questionBankId)`.
3. It does NOT render the button when `questionBankId` is `null`/`undefined`.

The missing branch is a real execution path in production — default questions
can be removed. If `removeDefaultQuestion` signature changes or the condition
logic is refactored, no test will catch the regression.

**Fix:** Add tests for the default question delete path:
```typescript
const mockDefaultRow = {
  type: 'question' as const,
  sectionId: 'frontend',
  topicId: 'react',
  question: { q: 'Describe the virtual DOM', level: 'intermediate' as const },
  index: 1,
  isCustom: false,
  isDefaultQuestion: true,
  questionBankId: 'q-react-001',
};

it('renders delete button with aria-label "Remove question" for default questions', () => { ... });
it('delete button calls removeDefaultQuestion with questionBankId on click', () => { ... });
```

---

### WR-04: `handleImportConfirm` is passed as a raw async function to `ImportPreviewModal.onConfirm` — unhandled rejection in error path if `importPreview` is unexpectedly null

**File:** `src/components/ActionsGroup.tsx:134-139`

**Issue:**
```typescript
const handleImportConfirm = async (overwriteActive: boolean) => {
  if (!importPreview) return;
  await useAppStore
    .getState()
    .importSession(importPreview.result, overwriteActive);
  setImportPreview(null);
};
```
`ImportPreviewModal.handleConfirm` wraps `onConfirm` in a try/catch (confirmed
in `ImportPreviewModal.tsx:64-77`), so `importSession` errors surface correctly.
However, `setImportPreview(null)` on line 139 runs outside any `finally` block.
If `importSession` throws, `importPreview` is never cleared. The user dismisses
the error in the modal, but `importPreview` still holds the stale preview. If
the modal is re-opened (or if the dialog `close` event fires before the catch),
a second confirm attempt will re-apply the same import data with no user
indication. This is a state-consistency issue rather than a crash, but it leaves
the component in a partially-applied state.

**Fix:** Clear `importPreview` in a `finally` block within `handleImportConfirm`,
or clear it in the `onCancel`/`onClose` handler passed to `ImportPreviewModal`:
```typescript
const handleImportConfirm = async (overwriteActive: boolean) => {
  if (!importPreview) return;
  try {
    await useAppStore.getState().importSession(importPreview.result, overwriteActive);
  } finally {
    setImportPreview(null);
  }
};
```

---

## Info

### IN-01: `version` read duplicated in `AboutModal` and `SidebarFooter`

**File:** `src/components/AboutModal.tsx:8`, `src/components/SidebarFooter.tsx:17`

**Issue:** Both components independently call `chrome.runtime.getManifest().version`
at the top of the render function. This is a minor duplication — both components
always mount together (AboutModal is a child of SidebarFooter). If the manifest
call were ever to fail (e.g. in a non-extension context), both would fail
independently.

**Fix:** Consider passing `version` as a prop from `SidebarFooter` to
`AboutModal`, or centralising the manifest read in a shared hook/constant. Low
urgency, but aligns with the existing project pattern of pushing side-effects to
the store boundary.

---

### IN-02: Textarea `style` override fights its own Tailwind class in `QuestionCard`

**File:** `src/components/QuestionCard.tsx:138-139`

**Issue:** The textarea has both `className="w-full ... mx-3 ..."` and
`style={{ width: 'calc(100% - 1.5rem)' }}`. `w-full` sets `width: 100%`, which
the inline style then overrides. The intent is to account for the `mx-3`
horizontal margin (0.75rem × 2 = 1.5rem), but the approach mixes Tailwind and
inline styles for the same property. The inline style wins at runtime, so
`w-full` is effectively dead. This is fragile — changing the margin class
without updating the inline calculation will silently misalign the textarea.

**Fix:** Remove `w-full` from the className and keep only the inline style, or
use a CSS variable / `calc` approach entirely within Tailwind. Alternatively,
wrap the textarea in a padding container instead of using `mx-3` + `calc`:
```tsx
// Remove w-full from className, keep style:
style={{ width: 'calc(100% - 1.5rem)' }}
// OR: remove style, restructure wrapping div to apply padding
```

---

### IN-03: `"What's new"` button in `SidebarFooter` has no `aria-label`

**File:** `src/components/SidebarFooter.tsx:50-55`

**Issue:** The button's accessible name is derived from its text content
(`"What's new"`), which is adequate. However, there is no `aria-label` and the
button label does not indicate what it controls (the changelog). Assistive
technology users will know its name but not its role as a toggle. The button
does carry `aria-expanded`, which partially addresses this. Not a hard WCAG
failure, but adding a descriptive `aria-label` ("Toggle changelog") or an
`aria-controls` pointing at the `ChangelogViewer` container would improve screen
reader experience.

**Fix:** Add `aria-label` and `aria-controls` if a stable `id` is added to the
`ChangelogViewer` root:
```tsx
<button
  type="button"
  aria-label="Toggle changelog"
  aria-expanded={changelogOpen}
  aria-controls="sidebar-changelog"
  ...
>
  What's new
</button>
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
