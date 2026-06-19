---
phase: 18-icon-library
reviewed: 2026-06-19T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/app/App.tsx
  - src/components/SidebarHeader.tsx
  - src/components/SectionFilter.tsx
  - src/components/Sidebar.tsx
  - src/components/ActionsGroup.tsx
  - src/components/QuestionCard.tsx
  - src/components/SearchGroup.tsx
  - src/components/SectionRow.tsx
  - src/components/TopicRow.tsx
  - src/components/SessionSwitcherModal.tsx
  - src/components/SessionRow.tsx
  - src/components/StorageToast.tsx
  - src/components/UndoToast.tsx
  - src/components/UpdateBanner.tsx
  - src/components/TopicMarkDisplay.tsx
  - src/components/MigrationErrorBanner.tsx
  - src/components/SessionRow.test.tsx
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-06-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

This phase replaced ad-hoc emoji and `×` characters with Lucide React SVG icons throughout the UI chrome. The library `lucide-react@^1.21.0` is correctly installed and all specified icons (`Menu`, `User`, `Search`, `Target`, `ClipboardList`, `Zap`, `X`, `Check`, `Pencil`, `Copy`, `Bot`, `RefreshCw`, `Moon`, `Sun`, `ChevronsUpDown`, `ChevronsLeftRight`, `Eye`, `Download`, `Upload`, `Trash2`) are properly imported. The `SidebarGroup` `icon` prop is correctly typed as `ReactNode`.

One critical accessibility regression was introduced: `SectionRow` renders the section emoji (`row.icon`, e.g., `🖥️`) directly inside a plain `<span>` without any `aria-hidden` wrapper, causing screen readers to announce the emoji description as part of the section header button. The sibling component `SectionFilter` correctly wraps an identical pattern in `<span aria-hidden="true">`, making this a targeted omission rather than a systemic one.

Three additional warnings cover an inconsistent `aria-hidden` placement pattern (on wrapper spans rather than directly on SVG elements), a fragile DOM-order assumption in tests, and a static icon on a toggling button.

---

## Critical Issues

### CR-01: Section emoji icon announced by screen readers in `SectionRow`

**File:** `src/components/SectionRow.tsx:27`
**Issue:** `row.icon` is a raw emoji string (e.g., `🖥️` for the Frontend section, `⚙️` for Backend). In `SectionRow`, it is rendered directly inside an unstyled `<span>` with no `aria-hidden` attribute. Screen readers will announce the emoji's long-form accessible name (e.g., "Desktop Computer") as part of the section toggle button label, producing noise like "Desktop Computer Frontend — 42 questions button". The identical pattern in `SectionFilter` correctly wraps `{section.icon}` in `<span aria-hidden="true">` (lines 77–80), confirming this omission is specific to `SectionRow`.

The root cause: `buildFlatRows.ts` propagates `section.icon` as `icon: string` on the `SectionRow` type, and `SectionRow` inlines it without suppression.

**Fix:**
```tsx
// src/components/SectionRow.tsx — line 25-29
<span>
  <span aria-hidden="true">{row.icon}</span>
  {' '}{row.label}
</span>
```

---

## Warnings

### WR-01: `Check` icon missing `aria-hidden="true"` on the SVG — pattern inconsistency in `SessionRow`

**File:** `src/components/SessionRow.tsx:83`
**Issue:** Every other Lucide icon rendered in the reviewed codebase carries `aria-hidden="true"` directly on the SVG element (confirmed across `SectionRow`, `TopicRow`, `QuestionCard`, `SearchGroup`, `StorageToast`, `UndoToast`, `UpdateBanner`, `TopicMarkDisplay`, `MigrationErrorBanner`, `SessionSwitcherModal`, `SidebarHeader`, and `ActionsGroup`). The `Check` icon in `SessionRow` is the sole exception — it relies on `aria-hidden="true"` on its wrapping `<span>` (line 82) rather than on the SVG itself.

Functionally the AT result is identical: the accessibility tree suppresses the `<span>` subtree. However the inconsistency violates the phase spec ("aria-hidden="true" on each SVG") and will cause future contributors to follow the wrong pattern from this component as an example.

```tsx
// src/components/SessionRow.tsx — line 83
// Before:
<Check className="w-4 h-4" />
// After:
<Check className="w-4 h-4" aria-hidden="true" />
```

### WR-02: `ClipboardList` icon missing `aria-hidden="true"` on the SVG — same pattern inconsistency in `SectionFilter`

**File:** `src/components/SectionFilter.tsx:49`
**Issue:** The `ClipboardList` icon for the "All sections" row is wrapped in `<span aria-hidden="true">` (line 48) but the SVG itself does not carry `aria-hidden="true"`. This is the same pattern discrepancy as WR-01 and is similarly functional-but-inconsistent with every other SVG in the codebase.

```tsx
// src/components/SectionFilter.tsx — line 49
// Before:
<ClipboardList className="w-4 h-4" />
// After:
<ClipboardList className="w-4 h-4" aria-hidden="true" />
```

### WR-03: Test locator for checkmark span relies on fragile DOM-order assumption

**File:** `src/components/SessionRow.test.tsx:87-92` and `107-112`
**Issue:** Four tests locate the checkmark indicator using:
```ts
document
  .getElementById('session-row-session-1')
  ?.querySelector('[aria-hidden="true"]');
```
This returns the **first** element with `aria-hidden="true"` in the `<li>` subtree. Currently that is the checkmark `<span>` (DOM position 1), with the `Pencil`, `Copy`, and `X` SVGs appearing later (positions 2-4). If WR-01 is fixed by adding `aria-hidden="true"` directly to the `Check` SVG (which sits inside the wrapper span), or if any other `aria-hidden` element is inserted before the checkmark span in future work, `querySelector` will silently return the wrong node and the class assertions will pass or fail erroneously without a clear error message.

The test comment acknowledges the SVG has no text node but does not explain the DOM-order dependency. A more robust selector uses the element's own class token or a `data-testid`:

```tsx
// In SessionRow.tsx — add data-testid to the checkmark span:
<span data-testid="session-checkmark" className={checkmarkClass} aria-hidden="true">
  <Check className="w-4 h-4" aria-hidden="true" />
</span>
```

```ts
// In SessionRow.test.tsx — replace querySelector:
const checkmarkSpan = document
  .getElementById('session-row-session-1')
  ?.querySelector('[data-testid="session-checkmark"]');
```

---

## Info

### IN-01: `Eye` icon is static when "Hide marked" toggle is active — unlike `Moon`/`Sun` swap

**File:** `src/components/ActionsGroup.tsx:228-233`
**Issue:** The dark-mode toggle correctly swaps `Moon` ↔ `Sun` to reflect the current state (lines 200-204). The "Hide marked topics" toggle uses a static `Eye` icon regardless of `hideMarked` state (line 232). When `aria-pressed="true"` (topics are hidden), the `Eye` icon — which conventionally means "visible" — contradicts the active state. Users relying on icon shape alone (e.g., color-blind users who cannot distinguish the `btnActive` blue background) cannot determine the toggle state from the icon.

Suggestion: swap `Eye` for `EyeOff` when `hideMarked` is `true`, mirroring the `Moon`/`Sun` pattern:
```tsx
import { Eye, EyeOff } from 'lucide-react';
// ...
{hideMarked
  ? <EyeOff className="w-5 h-5" aria-hidden="true" />
  : <Eye className="w-5 h-5" aria-hidden="true" />
}
```

### IN-02: `ChevronsLeftRight` (horizontal) used for "Collapse all" on a vertical list

**File:** `src/components/ActionsGroup.tsx:221-223`
**Issue:** The `ChevronsLeftRight` icon displays two outward-pointing horizontal chevrons (`←  →`). The content being collapsed is a vertical tree of sections and topics. `ChevronsUpDown` (which is already used for "Expand all") would be more semantically consistent, or `Minimize2` is a common alternative for "collapse all". This is a minor icon-choice mismatch; `aria-label="Collapse all"` correctly conveys the action to AT users.

### IN-03: Decorative `+` character in "Add question" button is not suppressed for AT

**File:** `src/components/TopicRow.tsx:129`
**Issue:** The "Add question" button renders a bare `+` character followed by the button label text:
```tsx
+ Add question
```
Screen readers will announce "plus Add question" or "plus space Add question" depending on the AT and locale. The `+` is decorative (the label "Add question" is sufficient). It should be wrapped in `<span aria-hidden="true">` or replaced by a Lucide `Plus` icon consistent with the phase's icon library:

```tsx
// Option A — suppress the + character:
<button ...>
  <span aria-hidden="true">+</span> Add question
</button>

// Option B — replace with Lucide Plus icon (consistent with phase):
import { Plus } from 'lucide-react';
<button ...>
  <Plus className="w-4 h-4 inline" aria-hidden="true" /> Add question
</button>
```

---

_Reviewed: 2026-06-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
