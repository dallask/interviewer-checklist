---
phase: 17-difficulty-indicators
plan: "01"
subsystem: ui-components
tags:
  - visual-indicators
  - tailwind
  - accessibility
  - VIS-01
  - VIS-02
dependency_graph:
  requires:
    - src/data/bank/types.ts (Difficulty type)
    - src/utils/buildFlatRows.ts (QuestionRow type with question.level)
  provides:
    - BORDER_CLASSES: Record<Difficulty, string> in QuestionCard.tsx
    - BADGE_CLASSES: Record<Difficulty, string> in QuestionCard.tsx
    - VIS-01 left border on QuestionCard outer container
    - VIS-02 difficulty badge chip in screen and print rows
  affects:
    - src/components/QuestionCard.tsx
    - src/components/QuestionCard.test.tsx
tech_stack:
  added: []
  patterns:
    - Static Record<Difficulty, string> color maps (D-06 pattern — Tailwind content scanner requires full class strings)
    - role="img" + aria-label on badge span elements for accessibility
    - getAllByLabelText for tests where same aria-label appears in screen + print rows
key_files:
  created: []
  modified:
    - src/components/QuestionCard.tsx
    - src/components/QuestionCard.test.tsx
decisions:
  - Apply border to outer container div (not a sub-element) per CONTEXT.md locked decision D-03
  - Colocate BORDER_CLASSES and BADGE_CLASSES in QuestionCard.tsx (no separate constants file) — single-file change, no cross-component usage
  - Add role="img" to badge <span> elements to satisfy Biome a11y lint rule (aria-label not supported on generic span role)
  - Use getAllByLabelText in badge tests because both screen row and print row render the same aria-label, causing getByLabelText to throw "found multiple elements"
metrics:
  duration: "4m 3s"
  completed: "2026-06-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  tests_added: 8
  tests_total: 678
---

# Phase 17 Plan 01: Difficulty Indicators Summary

**One-liner:** BORDER_CLASSES + BADGE_CLASSES static Record maps added to QuestionCard with border-l-4 outer border and always-visible uppercase badge chip per difficulty level, with 8 new class-presence tests covering all 4 levels for VIS-01 and VIS-02.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add BORDER_CLASSES + BADGE_CLASSES maps and apply visual indicators | a9499e6 | src/components/QuestionCard.tsx |
| 2 | Add VIS-01 border and VIS-02 badge class-presence tests + Biome fixes | fc5e170 | src/components/QuestionCard.tsx, src/components/QuestionCard.test.tsx |

## What Was Built

### VIS-01: Left Border (QuestionCard.tsx)

Added two static `Record<Difficulty, string>` maps after imports, before the `Props` interface:

- `BORDER_CLASSES` — maps each difficulty to a border color class (`border-green-500`, `border-blue-500`, `border-orange-500`, `border-pink-500`), matching `DifficultyFilter.tsx` `DOT_CLASSES` colors exactly for cross-component visual consistency
- `BADGE_CLASSES` — maps each difficulty to bundled light + dark mode badge color classes

Modified the outer container `<div>` className to a template literal that appends `border-l-4 ${BORDER_CLASSES[question.level]}`. The existing `border-b` (bottom border) and new `border-l-4` (left border) apply to different edges and do not conflict.

### VIS-02: Difficulty Badge Chip (QuestionCard.tsx)

Added an always-visible `<span role="img">` difficulty badge chip:
- Placed after the question text `<span>` and before the existing `custom` badge block
- Classes: `text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`
- Accessibility: `aria-label={`${question.level} difficulty`}` with `role="img"` so Biome aria-label rule passes
- Text content: `{question.level}` — the `uppercase` CSS class handles visual display (no `.toUpperCase()`)
- Not conditional — always rendered (difficulty is a primary informational signal per locked decision)

### Print Row Badge (QuestionCard.tsx)

Added the identical badge `<span role="img">` in the print-only div after the question text span, so printed output also includes difficulty context.

### Tests (QuestionCard.test.tsx)

Added a `describe('difficulty indicators')` block with 8 new tests:

**VIS-01 border tests (×4):**
- `container.firstChild` targets the outer div
- Asserts `border-l-4` + per-difficulty border color class for novice, intermediate, advanced, expert

**VIS-02 badge chip tests (×4):**
- Uses `screen.getAllByLabelText('{level} difficulty')` + `badges[0]` (index 0 = screen row; index 1 = print row)
- Asserts `uppercase`, `shrink-0`, and all four color classes (light bg, light text, dark bg, dark text)

## Verification Results

| Gate | Result |
|------|--------|
| npm test (678 tests) | PASS — 678 passed, 0 failed |
| grep "border-l-4" QuestionCard.tsx | PASS — found in outer container className |
| grep -c "BORDER_CLASSES" QuestionCard.tsx | PASS — 2 occurrences (declaration + usage) |
| grep -c "BADGE_CLASSES" QuestionCard.tsx | PASS — 3 occurrences (declaration + 2 usages) |
| grep -c "aria-label" QuestionCard.tsx | PASS — 6 occurrences |
| grep -c "border-l-4" QuestionCard.test.tsx | PASS — 8 occurrences |
| grep -c "getByLabelText" QuestionCard.test.tsx | PASS — 6 occurrences (+ 5 getAllByLabelText) |
| npx biome check src/components/QuestionCard.tsx | PASS — 0 errors |
| npx biome check src/components/QuestionCard.test.tsx | PASS — 0 errors |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used getAllByLabelText instead of getByLabelText for badge tests**
- **Found during:** Task 2 (test execution)
- **Issue:** `screen.getByLabelText('novice difficulty')` throws "Found multiple elements" because both the screen row and print row badge chips share the same aria-label attribute. Plan's PATTERNS.md showed `getByLabelText` but did not account for the two badges per render.
- **Fix:** Changed all 4 VIS-02 badge tests to use `screen.getAllByLabelText('{level} difficulty')` and take `badges[0]` (screen row element).
- **Files modified:** src/components/QuestionCard.test.tsx
- **Commit:** fc5e170

**2. [Rule 1 - Bug] Added role="img" to badge <span> elements**
- **Found during:** Task 2 (Biome check after Task 1 commit)
- **Issue:** Biome `lint/a11y/useAriaPropsSupportedByRole` reported that `aria-label` is not supported by the `generic` role of a plain `<span>`. Plan specified `aria-label` on `<span>` but did not include an explicit role.
- **Fix:** Added `role="img"` to both badge `<span>` elements (screen row and print row). This gives the span an explicit ARIA role that supports `aria-label`, satisfying both the accessibility rule and the test queries via `getAllByLabelText`.
- **Files modified:** src/components/QuestionCard.tsx
- **Commit:** fc5e170

**3. [Rule 1 - Bug] Fixed import order in QuestionCard.tsx**
- **Found during:** Task 2 (Biome check)
- **Issue:** Biome `assist/source/organizeImports` flagged that the `Difficulty` type import was placed after the non-type `useAppStore` import. Type imports should precede non-type imports per Biome's import sorting rules.
- **Fix:** Reordered: `Difficulty` type import moved above `useAppStore` import.
- **Files modified:** src/components/QuestionCard.tsx
- **Commit:** fc5e170

**4. [Rule 1 - Auto-format] Applied Biome formatter to both files**
- **Found during:** Task 2 (Biome check)
- **Issue:** BADGE_CLASSES long string values and the outer div className string exceeded Biome's print width, triggering formatting differences. Delete button aria-label ternary also needed reformatting.
- **Fix:** Ran `npx biome format --write` on both files.
- **Files modified:** src/components/QuestionCard.tsx, src/components/QuestionCard.test.tsx
- **Commit:** fc5e170

## Known Stubs

None — all color maps are fully populated with concrete Tailwind class strings for all 4 difficulty levels. No placeholder data flows to rendering.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The `question.level → className` interpolation path is within the existing threat model (T-17-01: TypeScript Record lookup with a typed Difficulty union key; no user-controlled input path; value rendered as text content, not dangerouslySetInnerHTML).

## Self-Check: PASS

All files exist and commits are in git history.
