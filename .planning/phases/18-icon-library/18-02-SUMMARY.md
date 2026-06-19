---
phase: 18-icon-library
plan: "02"
subsystem: ui-icons
tags: [lucide-react, icon-migration, emoji-replacement, accessibility, wave-2]
dependency_graph:
  requires: [18-01]
  provides: [icon-migration-inline-tier-all-components]
  affects:
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
tech_stack:
  added: []
  patterns: [named-icon-imports, aria-hidden-on-svg, pattern-c-span-aria-hidden-no-svg-aria-hidden, size-tier-w4h4-inline]
key_files:
  created: []
  modified:
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
decisions:
  - "SessionRow Check icon uses Pattern C — no aria-hidden on SVG itself because parent span already carries aria-hidden=true; all other icons use Pattern B with aria-hidden on the SVG directly"
  - "CustomQuestionForm × in difficulty multiplier strings (1.00×, 1.25×, etc.) is user-visible content, not UI chrome — left unchanged per D-05 scope boundary"
  - "Pre-existing TypeScript errors in test fixture files (background/index.test.ts, QuestionCard.test.tsx, TopicRow.test.tsx, phase-12-defects.test.tsx) are pre-existing and not introduced by this plan"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-19T06:32:00Z"
  tasks_completed: 2
  files_modified: 11
---

# Phase 18 Plan 02: Inline-tier icon migration for eleven remaining component files Summary

Replaced all remaining emoji and special-character icons (📝, ✓, ✎, ⧉, and eleven × characters) in eleven Inline-tier component files with named Lucide React SVG imports using w-4 h-4 sizing and aria-hidden="true" (or Pattern C for Check inside an already-aria-hidden span).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace icons in QuestionCard, SearchGroup, SectionRow, TopicRow, SessionSwitcherModal | a07e428 | src/components/QuestionCard.tsx, src/components/SearchGroup.tsx, src/components/SectionRow.tsx, src/components/TopicRow.tsx, src/components/SessionSwitcherModal.tsx |
| 2 | Replace icons in SessionRow, StorageToast, UndoToast, UpdateBanner, TopicMarkDisplay, MigrationErrorBanner | f29e457 | src/components/SessionRow.tsx, src/components/StorageToast.tsx, src/components/UndoToast.tsx, src/components/UpdateBanner.tsx, src/components/TopicMarkDisplay.tsx, src/components/MigrationErrorBanner.tsx |

## What Was Built

**QuestionCard.tsx:** Added `import { Pencil, X } from 'lucide-react'`; replaced 📝 note-toggle button with `<Pencil className="w-4 h-4" aria-hidden="true" />`; replaced × delete button (which already had `aria-label="Delete custom question"` / `aria-label="Remove question"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**SearchGroup.tsx:** Added `import { X } from 'lucide-react'`; replaced × clear-search button body (button already had `aria-label="Clear search"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**SectionRow.tsx:** Added `import { X } from 'lucide-react'`; replaced × remove-section button body (button had `aria-label="Remove section {row.label}"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**TopicRow.tsx:** Added `import { X } from 'lucide-react'`; replaced × remove-topic button body (button had `aria-label="Remove topic {row.topic.name}"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**SessionSwitcherModal.tsx:** Added `import { X } from 'lucide-react'`; replaced × close-modal button body (button had `aria-label="Close sessions"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**SessionRow.tsx:** Added `import { Check, Pencil, Copy, X } from 'lucide-react'`; replaced:
- ✓ text inside `<span aria-hidden="true">` with `<Check className="w-4 h-4" />` — no aria-hidden on SVG itself (Pattern C: parent span carries aria-hidden)
- ✎ rename button body (had `aria-label="Rename {session.name}"`) with `<Pencil className="w-4 h-4" aria-hidden="true" />`
- ⧉ duplicate button body (had `aria-label="Duplicate {session.name}"`) with `<Copy className="w-4 h-4" aria-hidden="true" />`
- × delete button body (had `aria-label="Delete {session.name}"`) with `<X className="w-4 h-4" aria-hidden="true" />`

**StorageToast.tsx:** Added `import { X } from 'lucide-react'`; replaced × dismiss button body (had `aria-label="Dismiss storage warning"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**UndoToast.tsx:** Added `import { X } from 'lucide-react'`; replaced × dismiss button body (had `aria-label="Dismiss"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**UpdateBanner.tsx:** Added `import { X } from 'lucide-react'`; replaced × dismiss button body (had `aria-label="Dismiss update banner"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**TopicMarkDisplay.tsx:** Added `import { X } from 'lucide-react'`; replaced × clear-override button body (had `aria-label="Clear override mark for {topic.name}"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

**MigrationErrorBanner.tsx:** Added `import { X } from 'lucide-react'`; replaced × dismiss button body (had `aria-label="Dismiss migration error"`) with `<X className="w-4 h-4" aria-hidden="true" />`.

## Verification

- All 11 modified source component files: 0 emoji or × close-icon characters remain
- TypeScript: 0 errors in any file modified by this plan (pre-existing errors in test fixtures are out of scope per 18-01-SUMMARY)
- Test suite: 3369/3371 passed — 2 expected failures in `src/components/SessionRow.test.tsx` (see below)

## Expected Test Failures (Wave 3 Fix)

**2 failing tests in `src/components/SessionRow.test.tsx`** — these are EXPECTED and will be fixed in Plan 18-03:

1. Line 85: `screen.getByText('✓')` — fails because the ✓ text node was replaced by a `<Check>` SVG component; the span no longer contains text
2. Line 101: `screen.getByText('✓')` — same reason

These tests were designed to locate the checkmark span by its `✓` text content. After the Check SVG replacement, they must be rewritten to use `getByRole` or `getByTestId` — Plan 03 explicitly handles this. The post-merge gate after Wave 2 will show 2 failures; that is intentional and documented here.

## Deviations from Plan

### Out-of-Scope × in CustomQuestionForm.tsx

`grep -rn "×" src/components/` matches four lines in `CustomQuestionForm.tsx`:
```
<option value="novice">Beginner (1.00×)</option>
<option value="intermediate">Intermediate (1.25×)</option>
<option value="advanced">Advanced (1.50×)</option>
<option value="expert">Expert (1.75×)</option>
```
These × characters are the multiplication sign used in difficulty weight labels (numeric multipliers shown to users), not UI chrome close/dismiss buttons. `CustomQuestionForm.tsx` is not in the eleven files listed for this plan, and this usage is user-facing content, not a UI chrome icon — analogous to the D-05 exemption for user-authored content. Left unchanged.

### Pre-existing TypeScript Errors (Out of Scope)

`npx tsc --noEmit` reports errors in `src/background/index.test.ts`, `src/components/QuestionCard.test.tsx`, `src/components/TopicRow.test.tsx`, `src/test/phase-12-defects.test.tsx`, and `src/storage/migrations/`. These are pre-existing (documented in 18-01-SUMMARY) and not in any file modified by this plan. Zero TypeScript errors exist in any of the eleven modified component files.

### No Other Deviations

All task actions, acceptance criteria, and icon mappings executed exactly as written in the plan.

## Known Stubs

None. All icon replacements are wired to real Lucide SVG components with no placeholder values.

## Threat Flags

None. This plan modifies existing component JSX to swap character text nodes for named Lucide SVG imports. No new network endpoints, auth paths, file access patterns, or schema changes introduced. All icon values are static JSX expressions from named imports — not user-controlled markup (T-18-02 disposition: accept).

## Self-Check: PASSED

- src/components/QuestionCard.tsx imports Pencil, X: FOUND
- src/components/SearchGroup.tsx imports X: FOUND
- src/components/SectionRow.tsx imports X: FOUND
- src/components/TopicRow.tsx imports X: FOUND
- src/components/SessionSwitcherModal.tsx imports X: FOUND
- src/components/SessionRow.tsx imports Check, Pencil, Copy, X: FOUND
- src/components/StorageToast.tsx imports X: FOUND
- src/components/UndoToast.tsx imports X: FOUND
- src/components/UpdateBanner.tsx imports X: FOUND
- src/components/TopicMarkDisplay.tsx imports X: FOUND
- src/components/MigrationErrorBanner.tsx imports X: FOUND
- Commit a07e428 (Task 1) exists: FOUND
- Commit f29e457 (Task 2) exists: FOUND
- npm test: 3369 passed, 2 expected failures in SessionRow.test.tsx: PASS (expected)
