---
phase: 05-scoring-ui-notes-candidate-custom-questions
plan: 02
subsystem: ui-components
tags: [react, zustand, scoring, tailwind, testing-library, tdd, accessibility]

# Dependency graph
requires:
  - phase: 05-01
    provides: "ScoringState + ScoringActions in useAppStore, buildFlatRows with index fix, V3SessionSchema"
  - phase: 04-shell-sidebar-read-only-content-tree
    provides: "QuestionCard, TopicRow, SectionFilter read-only shells"

provides:
  - "QuestionCard extended with range slider (SCORE-01), notes toggle (SCORE-03), custom badge + delete (SCORE-05)"
  - "TopicMarkDisplay new component with computed mark, BAND_COLORS, override input, clear button (SCORE-02)"
  - "TopicRow extended with TopicMarkDisplay, topic notes panel, + Add question button"
  - "CustomQuestionForm new component with controlled form, difficulty select, addCustomQuestion dispatch"
  - "SectionFilter extended with live computeSectionMark values and BAND_COLORS"
  - "styles.css: dialog::backdrop for Plan 03 modals"

affects:
  - "05-03 (ResetConfirmDialog + CandidateModal use dialog::backdrop CSS)"
  - "Phase 7 YAML export (reads customQuestions + notes from same store)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Red/Green cycle per task: failing test files committed before implementation"
    - "Granular useAppStore selectors: one selector call per state field to minimize re-renders"
    - "storedNote from store + useEffect sync pattern for controlled textarea initialization"
    - "BAND_COLORS static map pattern: all 5 class strings as complete literals for Tailwind scanner"
    - "fieldset as semantic group element (Biome a11y/useSemanticElements over div role=group)"
    - "SectionFilter computes topicResults inline (pure function, no caching) — simpler than memoization at this scale"

key-files:
  created:
    - src/components/TopicMarkDisplay.tsx
    - src/components/TopicMarkDisplay.test.tsx
    - src/components/CustomQuestionForm.tsx
    - src/components/CustomQuestionForm.test.tsx
    - src/components/QuestionCard.test.tsx
    - src/components/TopicRow.test.tsx
  modified:
    - src/components/QuestionCard.tsx
    - src/components/TopicRow.tsx
    - src/components/SectionFilter.tsx
    - src/components/SectionFilter.test.tsx
    - src/components/Sidebar.test.tsx
    - src/app/styles.css

key-decisions:
  - "fieldset used as semantic ARIA group element for TopicMarkDisplay instead of div[role=group] (Biome useSemanticElements rule)"
  - "storedNote from useAppStore selector + useState(storedNote) + useEffect sync pattern avoids useAppStore.getState() call which is not available in mocked tests"
  - "SectionFilter reads scores/overrides/customQuestions and computes topicResults inline per render — pure function, no memoization needed at this scale"
  - "Sidebar.test.tsx makeState extended with scores/overrides/customQuestions defaults to support SectionFilter requiring Phase 5 state"
  - "TopicMarkDisplay onBlur reads e.target.value (actual DOM value); type=number inputs sanitize non-numeric text to empty string so NaN case maps to null dispatch"

# Metrics
duration: 10min
completed: 2026-06-17
---

# Phase 05 Plan 02: Scoring UI Components Summary

**All interactive scoring UI components built: score slider, topic mark display, notes textareas, custom question form, and live section filter marks — 309 tests passing, npm run ci exits 0**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-17T08:38:52Z
- **Completed:** 2026-06-17T08:48:54Z
- **Tasks:** 2 (each with TDD RED + GREEN commits)
- **Files modified/created:** 12

## Accomplishments

- **QuestionCard** extended with score slider (`<input type="range">` with aria-label, aria-valuenow, controlled value), score display ("— / 10" for null, "0 / 10" for zero, "N / 10" for scored), notes toggle (aria-expanded + aria-controls + debounced setNote), custom badge (purple) + delete button (aria-label="Delete custom question")
- **TopicMarkDisplay** created as new component: `<fieldset>` with BAND_COLORS static map (5 complete class strings), computed mark via computeTopicMark, override number input (onBlur → clamp to [0,10] + setOverride), clear button (visible only when override != null)
- **TopicRow** extended: replaces `<span className="text-gray-400 text-xs">—</span>` with `<TopicMarkDisplay>`, adds topic notes panel (aria-expanded toggle + debounced setTopicNote), adds `+ Add question` button that renders `<CustomQuestionForm>` inline
- **CustomQuestionForm** created: controlled text input + difficulty select (4 options with coefficient labels) + submit (non-empty validation + addCustomQuestion dispatch + onDismiss) + discard (onDismiss only)
- **SectionFilter** extended: reads scores/overrides/customQuestions, computes topicResults for each section inline, passes to computeSectionMark, renders live mark with BAND_COLORS (gray "—" when mark is null)
- **styles.css** adds `dialog::backdrop { background: rgba(0, 0, 0, 0.5); }` for Plan 03 native `<dialog>` modals

## Task Commits

Each task was committed atomically with TDD RED + GREEN commits:

1. **Task 1 RED: failing tests for QuestionCard, TopicMarkDisplay, TopicRow** — `4ae736b`
2. **Task 1 GREEN: QuestionCard scoring + TopicMarkDisplay + TopicRow notes wiring** — `b7f0cfc`
3. **Task 2 RED: failing tests for CustomQuestionForm and SectionFilter live marks** — `13c1a57`
4. **Task 2 GREEN: CustomQuestionForm and SectionFilter live mark display** — `00cf36f`

## Files Created/Modified

- `src/components/QuestionCard.tsx` — Extended with score slider row, notes toggle+textarea, custom badge, delete button
- `src/components/QuestionCard.test.tsx` — 23 tests covering SCORE-01/03/05 QuestionCard behaviors
- `src/components/TopicMarkDisplay.tsx` — New component: computed mark + BAND_COLORS + override input + clear button
- `src/components/TopicMarkDisplay.test.tsx` — 16 tests covering SCORE-02 TopicMarkDisplay behaviors
- `src/components/TopicRow.tsx` — Extended with TopicMarkDisplay, topic notes panel, + Add question button
- `src/components/TopicRow.test.tsx` — 14 tests covering TopicRow extension behaviors
- `src/components/CustomQuestionForm.tsx` — New component: inline form for adding custom questions per topic
- `src/components/CustomQuestionForm.test.tsx` — 14 tests covering SCORE-05 CustomQuestionForm behaviors
- `src/components/SectionFilter.tsx` — Extended with live computeSectionMark values and BAND_COLORS
- `src/components/SectionFilter.test.tsx` — Extended with 2 new tests for live mark display
- `src/components/Sidebar.test.tsx` — Updated makeState to include Phase 5 scoring state fields
- `src/app/styles.css` — Added dialog::backdrop for Plan 03 native dialog modals

## Decisions Made

- **fieldset as group semantic element:** Biome `a11y/useSemanticElements` enforces `<fieldset>` over `<div role="group">` for accessible grouping. `<fieldset>` has the ARIA role `group` and is semantically correct for grouping form controls (the mark display + override input are effectively a form group).
- **storedNote sync pattern:** `const storedNote = useAppStore((s) => s.notes[questionId] ?? ''); const [localNote, setLocalNote] = useState(storedNote);` with `useEffect(() => { setLocalNote(storedNote); }, [storedNote])` — this pattern initializes from store and syncs on external changes without calling `useAppStore.getState()` (which is not available in mocked test environments).
- **SectionFilter computes inline:** `computeTopicMark` per topic + `computeSectionMark` called inline during render. No useMemo. At the scale of 9 sections × ~9 topics each, this is fast enough (pure functions, no side effects).
- **TopicMarkDisplay as fieldset:** The override input and computed mark are wrapped in `<fieldset aria-label="Mark for {topic.name}">` instead of `<div role="group">` to satisfy Biome's a11y semantic elements rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sidebar.test.tsx mock missing Phase 5 scoring state**
- **Found during:** Task 2 GREEN phase — full test suite run
- **Issue:** `Sidebar.test.tsx` `makeState()` helper did not include `scores`, `overrides`, `customQuestions` fields. When `SectionFilter` was extended to read these fields from the store, the Sidebar tests crashed with "Cannot read properties of undefined (reading 'filter')" because `customQuestions` was undefined in the mock.
- **Fix:** Added `scores: {}`, `overrides: {}`, `customQuestions: []` defaults to `makeState()` in `Sidebar.test.tsx`
- **Files modified:** `src/components/Sidebar.test.tsx`
- **Commit:** `00cf36f`

**2. [Rule 1 - Bug] Biome formatting + import ordering on TopicMarkDisplay.tsx**
- **Found during:** Task 1 GREEN `npm run ci` check
- **Issue:** `import type { MarkBand }` was separate from `import { computeTopicMark, getMarkBand }` from the same module — Biome requires combined imports. Also had `div[role="group"]` which Biome's `a11y/useSemanticElements` flagged.
- **Fix:** Merged `type MarkBand` into the same import statement; changed `<div role="group">` to `<fieldset>`; ran `biome format --write` to fix formatting
- **Files modified:** `src/components/TopicMarkDisplay.tsx`
- **Commit:** `b7f0cfc`

**3. [Rule 1 - Bug] QuestionCard non-null assertion `row.customId!` blocked by Biome**
- **Found during:** Task 1 GREEN `npm run ci` check
- **Issue:** `onClick={() => deleteCustomQuestion(row.customId!)}` triggers Biome's `noNonNullAssertion` rule
- **Fix:** Changed to `onClick={() => row.customId != null && deleteCustomQuestion(row.customId)}`
- **Files modified:** `src/components/QuestionCard.tsx`
- **Commit:** `b7f0cfc`

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All fixes necessary for correctness and CI compliance. No scope creep.

## Known Stubs

None — all components are fully wired with real store state and live data.

## Threat Flags

None — no new network endpoints or auth paths. All data flows stay within existing Zustand store + chrome.storage.local boundary.

---
*Phase: 05-scoring-ui-notes-candidate-custom-questions*
*Completed: 2026-06-17*

## Self-Check: PASSED

- All 11 key implementation files exist on disk
- All 4 task commits exist in git log (4ae736b, b7f0cfc, 13c1a57, 00cf36f)
- 309 tests pass (22 test files, 0 failures)
- npm run ci exits 0
- npm run build exits 0
