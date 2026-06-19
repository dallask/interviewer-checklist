---
phase: 19-typography-transitions
plan: "02"
subsystem: components
tags: [animation, css-transitions, grid-rows, accessibility]
dependency_graph:
  requires: ["19-01"]
  provides: ["grid-rows-accordion-SidebarGroup", "grid-rows-textarea-QuestionCard", "grid-rows-textarea-TopicRow"]
  affects: ["SidebarGroup", "QuestionCard", "TopicRow"]
tech_stack:
  added: []
  patterns: ["CSS grid-template-rows 0fr/1fr accordion", "motion-safe: prefix for reduced-motion opt-in", "inline style prop for dynamic two-state CSS value"]
key_files:
  created: []
  modified:
    - src/components/SidebarGroup.tsx
    - src/components/SidebarGroup.test.tsx
    - src/components/QuestionCard.tsx
    - src/components/QuestionCard.test.tsx
    - src/components/TopicRow.tsx
    - src/test/phase-12-defects.test.tsx
decisions:
  - "D-03: SidebarGroup collapsible region uses grid-template-rows: 0fr/1fr instead of hidden attribute — keeps element in DOM for aria-controls resolution"
  - "D-04: QuestionCard and TopicRow textareas wrapped in grid-rows divs; hidden class/attr removed; motion-safe: prefix for reduced-motion compliance"
  - "Rule 1 auto-fix: phase-12-defects.test.tsx wrapper traversal updated (textarea now 3 DOM levels deep inside min-h-0 > grid > hideNotes wrapper)"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-19"
  tasks_completed: 2
  files_changed: 6
---

# Phase 19 Plan 02: D-03 + D-04 Grid-Rows Accordion Transitions Summary

CSS `grid-template-rows: 0fr → 1fr` animated collapse replacing `hidden` attr/class on SidebarGroup region div, QuestionCard notes textarea, and TopicRow notes textarea, with motion-safe transition classes and all pre-existing tests updated.

## Tasks Completed

### Task 1: SidebarGroup D-03 — grid-rows accordion (commit `6d25a8a`)

**Files:** `src/components/SidebarGroup.tsx`, `src/components/SidebarGroup.test.tsx`

**Changes:**
- Replaced `<div id={regionId} hidden={!isOpen} className="px-4 pb-2">` with a two-div grid-rows wrapper pattern
- Outer div: `className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"` + `style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}`
- Inner div: `className="min-h-0 px-4 pb-2"` contains children
- `hidden={!isOpen}` removed entirely — element stays in DOM for aria-controls resolution
- Test updated: replaced `toHaveAttribute('hidden')` with `not.toHaveAttribute('hidden')` + `style.gridTemplateRows === '0fr'`

### Task 2: QuestionCard + TopicRow D-04 — textarea grid-rows wrapper (commits `3a029bd`, `1e50050`)

**Files:** `src/components/QuestionCard.tsx`, `src/components/QuestionCard.test.tsx`, `src/components/TopicRow.tsx`, `src/test/phase-12-defects.test.tsx`

**QuestionCard.tsx changes:**
- Added grid-rows wrapper div inside the `hideNotes` outer wrapper: `style={{ gridTemplateRows: notesOpen || printMode ? '1fr' : '0fr' }}`
- Added `min-h-0` inner div wrapping the textarea
- Removed `${!notesOpen && !printMode ? ' hidden' : ''}` from textarea className

**TopicRow.tsx changes:**
- Wrapped textarea in grid-rows outer div: `style={{ gridTemplateRows: (topicNotesOpen || localTopicNote || printMode) ? '1fr' : '0fr' }}`
- Added `min-h-0` inner div wrapping the textarea
- Removed `hidden={!topicNotesOpen && !localTopicNote && !printMode}` HTML attribute from textarea

**QuestionCard.test.tsx changes:**
- Updated test title to `'clicking note icon button expands the textarea grid wrapper'`
- Replaced `toContain('hidden')` assertions with grid wrapper style assertions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] phase-12-defects.test.tsx wrapper traversal broken by D-04 nesting**
- **Found during:** Task 2 full suite run
- **Issue:** `phase-12-defects.test.tsx` line 310 checked `textarea.parentElement.className.toContain('hidden')`. After D-04, textarea is nested 3 DOM levels deep (textarea → min-h-0 → grid → hideNotes wrapper), so `parentElement` was the `min-h-0` div, not the `hideNotes` wrapper.
- **Fix:** Updated 3 tests to traverse `textarea.parentElement.parentElement.parentElement` to reach the `hideNotes` wrapper div.
- **Files modified:** `src/test/phase-12-defects.test.tsx`
- **Commit:** `1e50050`

## Verification

Full test suite result: **4049 tests pass, 0 failures** (252 test files).

## Self-Check

- [x] SidebarGroup.tsx: no `hidden` prop on region div; has `grid` class and `style.gridTemplateRows`
- [x] SidebarGroup.test.tsx: zero `toHaveAttribute('hidden')` assertions
- [x] QuestionCard.tsx: textarea wrapped in `.grid` div; no `hidden` in textarea className
- [x] QuestionCard.test.tsx: zero `toContain('hidden')` on textarea.className
- [x] TopicRow.tsx: textarea wrapped in `.grid` div; no `hidden` attribute on textarea
- [x] All 4049 tests pass

## Self-Check: PASSED
