---
phase: 15-sidebar-shell-refactor-compact-questioncard
plan: "04"
subsystem: testing
tags: [vitest, react-testing-library, unit-tests, sidebar, questioncard, about-modal]

# Dependency graph
requires:
  - phase: 15-sidebar-shell-refactor-compact-questioncard
    provides: SidebarHeader, AboutModal, SidebarFooter (credit lockup), compact QuestionCard with score dropdown
provides:
  - SidebarHeader.test.tsx — unit tests for sticky header (toggle, candidate button, progress display)
  - AboutModal.test.tsx — unit tests for dialog behavior (version, credits, link attributes, close)
  - SidebarFooter.test.tsx (updated) — credit lockup, About button coverage added
  - Sidebar.test.tsx (updated) — scoring mock added, SidebarHeader presence tested
  - QuestionCard.test.tsx (updated) — slider tests replaced with dropdown/note-icon compact card tests
affects:
  - downstream phases that extend QuestionCard or sidebar components

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "showModal() pattern for dialog testing — open before querying internal elements"
    - "vi.mock('../scoring/index.js') pattern for SidebarHeader tests with computeOverallMark/computeTopicMark"
    - "container.textContent.match() for multi-element text presence without getByText collision"

key-files:
  created:
    - src/components/SidebarHeader.test.tsx
    - src/components/AboutModal.test.tsx
  modified:
    - src/components/SidebarFooter.test.tsx
    - src/components/Sidebar.test.tsx
    - src/components/QuestionCard.test.tsx
    - src/components/QuestionCard.tsx

key-decisions:
  - "Custom badge added back to compact QuestionCard (Rule 2) — plan explicitly keeps badge tests; implementation from Plan 03 had omitted it"
  - "Notes textarea id moved from container div to textarea element — test spec requires textarea to carry the id for notes-{questionId}"
  - "AboutModal tests use showModal() before querying — JSDOM hides dialog internals unless dialog is open"

patterns-established:
  - "Dialog test pattern: call ref.current?.showModal() before getByRole queries inside dialog"
  - "vi.mock('../scoring/index.js') with computeOverallMark/computeTopicMark stubs for SidebarHeader"

requirements-completed:
  - UI-13
  - UI-14
  - UI-15
  - SCORE-08

# Metrics
duration: 5min
completed: 2026-06-18
---

# Phase 15 Plan 04: Test Suites for Phase 15 Components Summary

**Unit test coverage for all Phase 15 components: 2 new test files (SidebarHeader, AboutModal) + 3 updated files (SidebarFooter, Sidebar, QuestionCard) with 56 passing tests; compact card dropdown, note icon, and dialog accessibility fully covered**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-18T13:23:59Z
- **Completed:** 2026-06-18T13:28:57Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `SidebarHeader.test.tsx` (9 tests) — toggle button, candidate button, setSidebarOpen dispatch, progress text, mark badge, progress bar element
- Created `AboutModal.test.tsx` (8 tests) — dialog label, heading, version from manifest, credits, link href and rel, close button
- Extended `SidebarFooter.test.tsx` (5 new tests) — credit lockup text, Ievgen Kyvgyla link href/rel, About button, data-about-trigger attribute
- Updated `Sidebar.test.tsx` — added scoring module mock, SidebarHeader presence test, overflow-y-auto scrollable div test
- Rewrote `QuestionCard.test.tsx` — removed all slider tests, added 7 dropdown tests + 5 note-icon tests; kept badge, delete, and textarea tests; updated min-h-[64px]
- Added custom badge back to `QuestionCard.tsx` and moved notes `id` from container div to textarea element

## Task Commits

Each task was committed atomically:

1. **Task 1: Write SidebarHeader.test.tsx and AboutModal.test.tsx** - `690cfb8` (test)
2. **Task 2: Update SidebarFooter.test.tsx, Sidebar.test.tsx, and QuestionCard.test.tsx** - `b93c57c` (test)

## Files Created/Modified

- `src/components/SidebarHeader.test.tsx` — New: 9 tests for sticky header component
- `src/components/AboutModal.test.tsx` — New: 8 tests for native dialog modal
- `src/components/SidebarFooter.test.tsx` — Updated: 5 tests added for credit lockup and About button
- `src/components/Sidebar.test.tsx` — Updated: scoring mock added, 2 new tests for SidebarHeader presence and scroll container
- `src/components/QuestionCard.test.tsx` — Updated: slider tests removed, compact card tests added (dropdown + note icon)
- `src/components/QuestionCard.tsx` — Updated: custom badge added, notes textarea id moved from container div to textarea

## Decisions Made

- Added custom badge back to `QuestionCard.tsx` — Plan 15-03 omitted it in the compact redesign, but Plan 15-04 explicitly says to keep the badge tests. Restored as Rule 2 (missing functionality the test suite requires).
- Moved `id={`notes-${questionId}`}` from the container `<div>` to the `<textarea>` element — plan specifies "notes textarea has id notes-{questionId}" and `aria-controls` semantically belongs on the controlled interactive element (the textarea), not its wrapper.
- Used `container.textContent.match()` for the "Developed by" test in SidebarFooter — `getByText(/Developed by/)` matched multiple elements (span + wrapper div); textContent avoids ambiguity without losing coverage.
- AboutModal tests call `ref.current?.showModal()` before querying heading/link/button — JSDOM excludes non-open `<dialog>` contents from the accessibility tree; the pattern mirrors CandidateModal.test.tsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added custom badge back to compact QuestionCard**
- **Found during:** Task 2 (QuestionCard.test.tsx update)
- **Issue:** Plan 15-03's compact redesign omitted the custom badge. Plan 15-04 explicitly lists "renders 'custom' badge for custom questions" and badge class tests as tests to keep. Keeping the tests while the implementation lacks the badge would produce 3 failing tests.
- **Fix:** Added `<span className="...bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400...">custom</span>` inside the compact row div, rendered only when `row.isCustom === true`.
- **Files modified:** `src/components/QuestionCard.tsx`
- **Verification:** All 3 badge tests pass. No existing tests broken.
- **Committed in:** `b93c57c`

**2. [Rule 2 - Missing Critical] Moved textarea id from container div to textarea element**
- **Found during:** Task 2 (QuestionCard test `notes textarea has id notes-{questionId}` failing)
- **Issue:** Plan spec requires the textarea to have `id="notes-{questionId}"`. The implementation had the `id` on the outer container div.
- **Fix:** Moved `id={`notes-${questionId}`}` from `<div>` to `<textarea>`. The `aria-controls` on the note button still resolves correctly.
- **Files modified:** `src/components/QuestionCard.tsx`
- **Verification:** Test passes. `aria-controls` relationship intact.
- **Committed in:** `b93c57c`

**3. [Rule 1 - Bug] AboutModal tests needed showModal() before dialog element queries**
- **Found during:** Task 1 (4 AboutModal tests failing with "no accessible roles")
- **Issue:** JSDOM hides dialog internals unless the dialog is open. Queries for heading, link, button inside the dialog returned no accessible roles.
- **Fix:** Added `ref.current?.showModal()` before querying internal elements in tests that need the dialog open.
- **Files modified:** `src/components/AboutModal.test.tsx`
- **Verification:** All 8 tests pass.
- **Committed in:** `690cfb8`

---

**Total deviations:** 3 auto-fixed (1 missing critical badge, 1 missing critical id placement, 1 bug in test setup)
**Impact on plan:** All fixes necessary for tests to match spec. No scope creep. Component improvements in QuestionCard.tsx are non-breaking.

## Issues Encountered

6 pre-existing test failures unrelated to this plan:
- `ActionsGroup.test.tsx` (3 failures) — CandidateModal moved from ActionsGroup to Sidebar in Plan 15-01; ActionsGroup tests still expect the Candidate details button in ActionsGroup
- `src/test/phase-12-defects.test.tsx` (3 failures) — 2 failures about note suppression wrapper using parent element traversal (finds `print:hidden` in class), 1 about button count in ActionsGroup post-Plan 15-01

These failures predate Plan 15-04 and are out-of-scope (scope boundary rule: deferred to deferred-items.md).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All Phase 15 components are now covered by unit tests
- SidebarHeader, AboutModal, SidebarFooter credit lockup, and compact QuestionCard all have passing test suites
- No blockers for subsequent phases

## Self-Check: PASSED

- FOUND: src/components/SidebarHeader.test.tsx
- FOUND: src/components/AboutModal.test.tsx
- FOUND: src/components/SidebarFooter.test.tsx
- FOUND: src/components/Sidebar.test.tsx
- FOUND: src/components/QuestionCard.test.tsx
- FOUND commit: 690cfb8 (test(15-04): add SidebarHeader.test.tsx and AboutModal.test.tsx)
- FOUND commit: b93c57c (test(15-04): update SidebarFooter, Sidebar, QuestionCard test suites for Phase 15)
- 56 tests passing across 5 files — verified

---
*Phase: 15-sidebar-shell-refactor-compact-questioncard*
*Completed: 2026-06-18*
