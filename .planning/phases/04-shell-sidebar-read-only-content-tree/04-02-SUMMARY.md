---
phase: 04-shell-sidebar-read-only-content-tree
plan: 02
subsystem: ui-components
tags: [react, tailwind-v4, tanstack-virtual, zustand, accessibility, aria, dark-mode, tdd, vitest, chrome-extension]

requires:
  - phase: 04-shell-sidebar-read-only-content-tree
    plan: 01
    provides: "useAppStore Zustand store, buildFlatRows utility, VirtualRow types, @tanstack/react-virtual installed, styles.css dark mode"

provides:
  - "src/components/Sidebar.tsx — Shell aside element with backdrop, slide animation, motion-reduce:transition-none, aria-label=Filters"
  - "src/components/SidebarGroup.tsx — Collapsible group wrapper with aria-expanded, min-h-[44px] touch target"
  - "src/components/SearchGroup.tsx — 150ms debounced search input with aria-live polite result count"
  - "src/components/DifficultyFilter.tsx — Multi-select difficulty pills with aria-pressed for all 4 levels"
  - "src/components/SectionFilter.tsx — Multi-select section list with mark placeholder, 9 DEFAULT_SECTIONS buttons"
  - "src/components/ActionsGroup.tsx — Expand/collapse all, hide-marked (aria-pressed=false), dark mode toggle"
  - "src/components/ContentTree.tsx — useVirtualizer scroll container with useFlushSync=false, overscan=10"
  - "src/components/SectionRow.tsx — Section header with aria-expanded, toggleSectionOpen on click"
  - "src/components/TopicRow.tsx — Topic row with aria-expanded, toggleTopic on click"
  - "src/components/QuestionCard.tsx — Read-only question card, DIFFICULTY_CLASSES all 4 levels as string literals"
  - "src/components/StorageToast.tsx — Dismissible quota warning toast on storage-quota-warning CustomEvent"
  - "199 tests passing (47 new component tests + 152 prior); npm run ci exits 0"

affects:
  - 04-03 shell layout (imports Sidebar, ContentTree; wires toggle button, ContentTree rows)
  - Phase 5 scoring (QuestionCard will add scoring inputs; SectionRow marks will populate)

tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN: test files committed before implementation for both tasks"
    - "useVirtualizer estimateSize map: section=52px, topic=44px, question=72px — realistic estimates per RESEARCH.md Pitfall 6"
    - "useFlushSync: false on useVirtualizer — required for React 19 per RESEARCH.md Pitfall 4"
    - "150ms trailing debounce via useRef + setTimeout in SearchGroup — NOT useDeferredValue (see RESEARCH.md Pattern 6)"
    - "DIFFICULTY_CLASSES as complete string literals only — no dynamic class construction for Tailwind scanner safety"
    - "Biome implicit ARIA role: <aside> inherits role=complementary; explicit role attribute removed by Biome a11y lint"

key-files:
  created:
    - "src/components/Sidebar.tsx — 67 lines; aside with backdrop, translate-x-0/-translate-x-full, motion-reduce"
    - "src/components/Sidebar.test.tsx — 74 lines; 6 tests: complementary role, aria-label, translate classes, backdrop"
    - "src/components/SidebarGroup.tsx — 35 lines; collapsible with aria-expanded, chevron, min-h-[44px]"
    - "src/components/SidebarGroup.test.tsx — 95 lines; 5 tests: aria-expanded, children visibility, onClick"
    - "src/components/SearchGroup.tsx — 55 lines; debounce via useRef, clear button, aria-live polite"
    - "src/components/SearchGroup.test.tsx — 108 lines; 7 tests: debounce timing, clear button, aria-live"
    - "src/components/DifficultyFilter.tsx — 42 lines; 4 pills, aria-pressed, selected/unselected colors"
    - "src/components/DifficultyFilter.test.tsx — 82 lines; 5 tests: 4 buttons, aria-pressed, toggleDifficulty"
    - "src/components/SectionFilter.tsx — 35 lines; 9 DEFAULT_SECTIONS buttons, mark placeholder"
    - "src/components/SectionFilter.test.tsx — 70 lines; 5 tests: 9 buttons, dash mark, toggleSection"
    - "src/components/ActionsGroup.tsx — 50 lines; expand/collapse/hide-marked/dark-mode buttons"
    - "src/components/ActionsGroup.test.tsx — 97 lines; 8 tests: actions, dark mode text flip, aria-pressed"
    - "src/components/ContentTree.tsx — 60 lines; useVirtualizer with measureElement, type discriminator"
    - "src/components/SectionRow.tsx — 30 lines; aria-expanded from sectionOpen state, toggleSectionOpen"
    - "src/components/TopicRow.tsx — 27 lines; aria-expanded from row.isOpen, toggleTopic, mark placeholder"
    - "src/components/QuestionCard.tsx — 47 lines; DIFFICULTY_CLASSES all 4 levels, difficulty pill, tag badge"
    - "src/components/StorageToast.tsx — 30 lines; role=alert, fixed bottom-4 right-4 z-50, dismiss button"
    - "src/components/StorageToast.test.tsx — 72 lines; 6 tests: initially null, event shows, dismiss hides"
  modified: []

decisions:
  - "Sidebar test uses makeState() helper with full store shape — required because Sidebar renders child components (SearchGroup, DifficultyFilter, SectionFilter, ActionsGroup) that each call useAppStore; single mock must satisfy all selectors"
  - "Biome removes explicit role=complementary from <aside> as redundant ARIA (a11y lint) — <aside> has implicit complementary role; test getByRole('complementary') still passes because testing-library uses implicit roles"
  - "StorageToast uses window.addEventListener not document — CustomEvent is dispatched on window by StorageAdapter; matching event target in listener is required"
  - "QuestionCard receives only row.question.q field (no description field on Question type) — Question interface from types.ts has only q and level; description rendering uses q only in Phase 4"

metrics:
  duration: "~5 min"
  completed: "2026-06-17"
  tasks: 2
  commits: 4
  files_created: 18
  files_modified: 0
  tests_added: 47
  tests_total: 199
---

# Phase 04, Plan 02: Sidebar Components, ContentTree & StorageToast Summary

**All 11 sidebar/content-tree components implemented with Tailwind v4, full ARIA attributes per UI-SPEC, TDD RED/GREEN cycle, and 199 tests passing**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-17T09:40:25Z
- **Completed:** 2026-06-17T09:45:30Z
- **Tasks:** 2 (Task 1: 6 sidebar components + tests; Task 2: 5 content tree components + StorageToast + test)
- **Files created:** 18 (11 component files + 7 test files)

## Accomplishments

- Created `Sidebar.tsx`: `<aside aria-label="Filters">` with `translate-x-0`/`-translate-x-full`, `motion-reduce:transition-none`, backdrop `aria-hidden="true"` on narrow viewports; composes all 4 SidebarGroups
- Created `SidebarGroup.tsx`: collapsible with `aria-expanded`, `min-h-[44px]` toggle button, chevron rotation, children conditional render
- Created `SearchGroup.tsx`: 150ms trailing debounce via `useRef + setTimeout` (NOT `useDeferredValue`), controlled input, clear button, `aria-live="polite" aria-atomic="true"` result count
- Created `DifficultyFilter.tsx`: 4 difficulty pills (novice/intermediate/advanced/expert), `aria-pressed` reflecting `selectedDifficulties` Set, selected/unselected Tailwind color variants
- Created `SectionFilter.tsx`: 9 `DEFAULT_SECTIONS` buttons with `aria-pressed`, `border-l-2` selected state, "—" mark placeholder
- Created `ActionsGroup.tsx`: expand/collapse all buttons, hide-marked (`aria-pressed="false"` hardcoded Phase 4), dark mode toggle with text "Dark mode"/"Light mode" flip and `aria-pressed={darkMode}`
- Created `ContentTree.tsx`: `useVirtualizer` with `estimateSize` map (section=52, topic=44, question=72), `measureElement`, `overscan: 10`, `useFlushSync: false` (React 19 required), type discriminator rendering SectionRow/TopicRow/QuestionCard
- Created `SectionRow.tsx`: `aria-expanded={!isCollapsed}` from `sectionOpen[row.id] === false`, `toggleSectionOpen` on click, UI-SPEC Tailwind classes
- Created `TopicRow.tsx`: `aria-expanded={row.isOpen}`, `toggleTopic` on click, question count + mark placeholder
- Created `QuestionCard.tsx`: `DIFFICULTY_CLASSES` with all 4 difficulty levels as complete string literals (Tailwind scanner safe), difficulty pill, question text
- Created `StorageToast.tsx`: `useState(false)` visibility, `window.addEventListener('storage-quota-warning', ...)` with cleanup, `role="alert"`, `fixed bottom-4 right-4 z-50`, dismiss button `aria-label="Dismiss storage warning"`
- Full TDD cycle: Task 1 RED (`7881432`) → GREEN (`d48ea14`); Task 2 RED (`8eaec4c`) → GREEN (`46b0a30`)
- All 199 tests pass; `npm run ci` (biome ci + tsc --noEmit) exits 0

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| Task 1 RED | Failing tests for sidebar components | `7881432` | 6 test files |
| Task 1 GREEN | Implement 6 sidebar components | `d48ea14` | 6 component files + updated 6 test files (Biome fixes) |
| Task 2 RED | Failing test for StorageToast | `8eaec4c` | StorageToast.test.tsx |
| Task 2 GREEN | Implement ContentTree, SectionRow, TopicRow, QuestionCard, StorageToast | `46b0a30` | 5 component files + updated test + Biome-fixed Task 1 files |

_TDD gate compliance: RED commits (7881432, 8eaec4c) precede their GREEN commits (d48ea14, 46b0a30) — confirmed._

## Files Created

- `src/components/Sidebar.tsx` — 67 lines; aside, backdrop, SidebarGroup×4
- `src/components/Sidebar.test.tsx` — 74 lines; 6 tests
- `src/components/SidebarGroup.tsx` — 35 lines; collapsible group
- `src/components/SidebarGroup.test.tsx` — 95 lines; 5 tests
- `src/components/SearchGroup.tsx` — 55 lines; debounced search
- `src/components/SearchGroup.test.tsx` — 108 lines; 7 tests
- `src/components/DifficultyFilter.tsx` — 42 lines; 4 difficulty pills
- `src/components/DifficultyFilter.test.tsx` — 82 lines; 5 tests
- `src/components/SectionFilter.tsx` — 35 lines; 9 section buttons
- `src/components/SectionFilter.test.tsx` — 70 lines; 5 tests
- `src/components/ActionsGroup.tsx` — 50 lines; 4 action buttons
- `src/components/ActionsGroup.test.tsx` — 97 lines; 8 tests
- `src/components/ContentTree.tsx` — 60 lines; useVirtualizer
- `src/components/SectionRow.tsx` — 30 lines; section header
- `src/components/TopicRow.tsx` — 27 lines; topic row
- `src/components/QuestionCard.tsx` — 47 lines; question card
- `src/components/StorageToast.tsx` — 30 lines; quota warning toast
- `src/components/StorageToast.test.tsx` — 72 lines; 6 tests

## Decisions Made

- **Sidebar test mock shape:** `makeState()` helper returns full store shape covering all child component selectors; a single `useAppStore` mock must cover all selector calls across Sidebar + SearchGroup + DifficultyFilter + SectionFilter + ActionsGroup
- **Biome removes `role="complementary"`** from `<aside>`: Biome's a11y lint flags redundant ARIA roles; `<aside>` implicitly has the `complementary` role. `screen.getByRole('complementary')` in testing-library resolves via implicit role — tests pass unchanged.
- **QuestionCard description**: `Question` type has only `q` (question text) and `level` (difficulty) fields. No `desc` or `description` field on individual questions — those live on `Topic`. Phase 4 QuestionCard shows only `question.q` and difficulty pill.
- **StorageToast uses `window.addEventListener`**: StorageAdapter dispatches `new CustomEvent('storage-quota-warning')` on `window`; listener must target `window` not `document` to fire correctly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sidebar test mock missing child component store slices**
- **Found during:** Task 1 GREEN — Sidebar.test.tsx render caused DifficultyFilter to throw `Cannot read properties of undefined (reading 'has')` because `selectedDifficulties` was undefined
- **Issue:** Sidebar renders SearchGroup, DifficultyFilter, SectionFilter, ActionsGroup which all call `useAppStore`; mock only provided sidebarOpen/setSidebarOpen/groupOpen/toggleGroup
- **Fix:** Rewrote Sidebar.test.tsx to use `makeState()` helper providing all 16 store fields needed by child components
- **Files modified:** `src/components/Sidebar.test.tsx`
- **Committed in:** `d48ea14` (Task 1 GREEN)

**2. [Rule 1 - Bug] Biome formatting/lint errors across all component files**
- **Found during:** Task 2 GREEN — `npm run ci` reported 19 formatting errors
- **Issue:** Long JSX attribute lines needed wrapping; import ordering; `useLiteralKeys` violations; redundant `role="complementary"` on `<aside>`
- **Fix:** Ran `npx @biomejs/biome format --write` then `biome check --write --unsafe` on src/components/
- **Files modified:** All 18 component/test files
- **Committed in:** `46b0a30` (Task 2 GREEN)

**Total deviations:** 2 auto-fixed (Rules 1 — test isolation bug, style/lint correctness)

## TDD Gate Compliance

- Task 1 RED gate: `7881432` — `test(04-02): add failing tests for sidebar components (TDD RED)` — 6 test files fail with "Failed to resolve import" (component files did not exist)
- Task 1 GREEN gate: `d48ea14` — `feat(04-02): implement Sidebar, SidebarGroup, SearchGroup, DifficultyFilter, SectionFilter, ActionsGroup (TDD GREEN)` — 41 new tests pass
- Task 2 RED gate: `8eaec4c` — `test(04-02): add failing tests for StorageToast (TDD RED)` — 1 test file fails
- Task 2 GREEN gate: `46b0a30` — `feat(04-02): implement ContentTree, SectionRow, TopicRow, QuestionCard, StorageToast (TDD GREEN)` — 199 total tests pass

## Known Stubs

None. All components are fully implemented per the plan spec:
- All ARIA attributes present per UI-SPEC accessibility contract
- All Tailwind dark: variants present per UI-SPEC color contract
- All focus-visible ring classes present on interactive elements
- DIFFICULTY_CLASSES has all 4 levels as complete string literals
- StorageToast fully wired to CustomEvent with cleanup

The mark placeholder "—" in SectionFilter and TopicRow is intentional Phase 4 design — marks populate in Phase 5 when the scoring engine is wired. This is documented in CONTEXT.md and UI-SPEC.md as the correct Phase 4 behavior, not a stub.

## Threat Flags

No new security surface beyond the plan's threat model. All mitigations verified:
- T-04-02-01 (search input XSS): SearchGroup renders `localValue` as JSX `value={localValue}` on input — React auto-escapes; never inserted via innerHTML
- T-04-02-02 (question text XSS): QuestionCard renders `{question.q}` as JSX text content — auto-escaped
- T-04-02-03 (StorageToast event data): Toast renders only static string copy; no interpolated event.detail in DOM
- T-04-02-04 (ContentTree 1400+ rows): useVirtualizer renders only ~20 visible rows + overscan:10; estimateSize prevents layout thrashing
- T-04-02-05 (aria-live result count): Intentional UX — question bank is a build-time constant, not PII

## Self-Check

Files exist:
- src/components/Sidebar.tsx: FOUND
- src/components/Sidebar.test.tsx: FOUND
- src/components/SidebarGroup.tsx: FOUND
- src/components/SidebarGroup.test.tsx: FOUND
- src/components/SearchGroup.tsx: FOUND
- src/components/SearchGroup.test.tsx: FOUND
- src/components/DifficultyFilter.tsx: FOUND
- src/components/DifficultyFilter.test.tsx: FOUND
- src/components/SectionFilter.tsx: FOUND
- src/components/SectionFilter.test.tsx: FOUND
- src/components/ActionsGroup.tsx: FOUND
- src/components/ActionsGroup.test.tsx: FOUND
- src/components/ContentTree.tsx: FOUND
- src/components/SectionRow.tsx: FOUND
- src/components/TopicRow.tsx: FOUND
- src/components/QuestionCard.tsx: FOUND
- src/components/StorageToast.tsx: FOUND
- src/components/StorageToast.test.tsx: FOUND

Commits in git log:
- 7881432: FOUND (Task 1 RED)
- d48ea14: FOUND (Task 1 GREEN)
- 8eaec4c: FOUND (Task 2 RED)
- 46b0a30: FOUND (Task 2 GREEN)

Test suite: 199 tests, 17 test files — ALL PASS
CI: biome ci + tsc --noEmit — EXIT 0

## Self-Check: PASSED

## Next Phase Readiness

- Wave 3 shell layout (04-03): import `Sidebar` and `ContentTree` from `src/components/`; wire sidebar toggle button in App.tsx with `aria-expanded={sidebarOpen}`; call `buildFlatRows(DEFAULT_SECTIONS, topicOpen, sectionOpen, filters)` and pass result to `ContentTree`
- Phase 5 scoring: add scoring inputs to `QuestionCard`; populate section marks in `SectionFilter` and `SectionRow`; `HideMarked` toggle becomes functional
- All components ready for composition; no circular dependencies

---
*Phase: 04-shell-sidebar-read-only-content-tree*
*Plan: 02*
*Completed: 2026-06-17*
