---
phase: 20-bug-fixes
plan: "01"
subsystem: ui
tags: [react, virtualizer, buildFlatRows, vitest, tdd]

# Dependency graph
requires:
  - phase: 18-icon-library
    provides: V4Section/V4Topic types, buildFlatRows utility with section/topic row emission
  - phase: 16-bug-fixes-dark-mode-polish
    provides: AddTopicForm, ContentTree integration with buildFlatRows virtualizer
provides:
  - BUG-01 fix: empty topics (zero questions) now appear in buildFlatRows output
  - Regression test coverage for empty-topic visibility and section-skip guard self-correction
affects: [21-layout, 22-sort-questions, ContentTree, buildFlatRows consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "OR-guard pattern: filteredQuestions.length > 0 || topic.questions.length === 0 — include empty topics unconditionally so newly added user topics are immediately visible"

key-files:
  created: []
  modified:
    - src/utils/buildFlatRows.ts
    - src/utils/buildFlatRows.test.ts

key-decisions:
  - "D-01: Fix is a minimal OR condition at line 154 — no structural change to topic loop or section-skip guard needed"
  - "D-02: Empty topics enter visibleTopics, so section-skip guard at line 168 self-corrects without modification"
  - "D-03: TDD order enforced — failing tests committed first (RED), then fix applied (GREEN)"

patterns-established:
  - "Empty user-created entities (topics with 0 questions) must pass inclusion guards unconditionally so they appear in the UI for immediate editing"

requirements-completed:
  - BUG-01

# Metrics
duration: 8min
completed: "2026-06-22"
---

# Phase 20 Plan 01: Bug Fixes — BUG-01 Summary

**Single OR-condition fix in buildFlatRows.ts makes newly added user topics immediately visible in the content tree even when they have zero questions**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-22T09:05:00Z
- **Completed:** 2026-06-22T09:06:45Z
- **Tasks:** 1 (TDD: RED + GREEN commits)
- **Files modified:** 2

## Accomplishments
- Fixed BUG-01: `buildFlatRows` now includes empty topics (topics with `questions.length === 0`) in `visibleTopics`, so a newly created topic appears in the content tree without page reload
- Section-skip guard at line 168 self-corrects — once empty topics are in `visibleTopics`, sections containing only empty topics are no longer incorrectly skipped
- Added describe block `"buildFlatRows — BUG-01: empty topic visibility"` with two regression tests locking the corrected behavior
- Verified TopicRow at line 123 renders the "Add custom question" form for empty topics without code changes (no `questions.length` check at that render site)

## Task Commits

TDD commits (RED then GREEN):

1. **Task 1 RED — failing tests** - `6b5fa17` (test)
2. **Task 1 GREEN — fix implementation** - `ae70ce6` (feat)

## Files Created/Modified
- `src/utils/buildFlatRows.ts` — Line 154 condition changed from `filteredQuestions.length > 0` to `filteredQuestions.length > 0 || topic.questions.length === 0`
- `src/utils/buildFlatRows.test.ts` — Added describe block `"buildFlatRows — BUG-01: empty topic visibility"` with 2 new it() cases

## Decisions Made
- The fix is an additive OR condition; it does not introduce new data paths or user-controlled branching (per T-20-01 threat disposition: accept)
- Empty topics add at most one extra row each to the virtualizer — no unbounded growth risk (per T-20-02 threat disposition: accept)
- No change to the section-skip guard at line 168: once `visibleTopics` contains empty topics, the guard's `visibleTopics.length === 0 && section.topics.length > 0` condition evaluates false and the section is rendered

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion used `r.id` instead of `r.topic.id` for TopicRow**
- **Found during:** Task 1 RED phase (writing tests)
- **Issue:** The plan spec used `r.id === 'topic-empty'` but `TopicRow` type has no top-level `id` field — the topic id is at `r.topic.id`. Using `r.id` would cause a TypeScript-implicit undefined comparison and tests would fail for the wrong reason (type mismatch rather than the actual bug).
- **Fix:** Changed assertion to `r.topic.id === 'topic-empty'` in the topic-row find predicate
- **Files modified:** `src/utils/buildFlatRows.test.ts`
- **Verification:** Tests fail for the correct reason (topic row is missing from output, not a bad property access); GREEN phase confirms fix works
- **Committed in:** `6b5fa17` (RED test commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug in test assertion)
**Impact on plan:** Necessary for tests to assert the correct behavior. No scope creep.

## Issues Encountered

The full vitest suite showed 4 failing tests in `src/components/QuestionCard.test.tsx` from a sibling parallel worktree agent (`aee4ae3e955b8df7d`) working on BUG-02. These failures are pre-existing in that agent's worktree scope and are entirely unrelated to the BUG-01 changes made here. The `buildFlatRows.test.ts` file (290 tests) passes cleanly in this worktree.

## TDD Gate Compliance

- RED gate: `test(20-01)` commit `6b5fa17` — failing tests added before implementation
- GREEN gate: `feat(20-01)` commit `ae70ce6` — implementation passes all tests
- REFACTOR: not needed (single-line change is already clean)

## Known Stubs

None — fix is complete and wires empty-topic visibility all the way to the virtualizer row array.

## Threat Flags

None — fix is additive OR condition, no new data paths or trust boundaries introduced.

## Next Phase Readiness
- BUG-01 is fully resolved; newly added topics appear in the content tree immediately
- BUG-02 (difficulty border color) is handled in parallel plan 20-02
- Phase 21 (layout) and Phase 22 (sort questions) can proceed once Phase 20 merges

## Self-Check: PASSED

All artifacts verified on disk:
- `src/utils/buildFlatRows.ts` — exists, line 154 contains `topic.questions.length === 0`
- `src/utils/buildFlatRows.test.ts` — exists, contains `"buildFlatRows — BUG-01: empty topic visibility"` describe block
- `.planning/phases/20-bug-fixes/20-01-SUMMARY.md` — this file, written successfully
- Commit `6b5fa17` (RED: failing tests) — confirmed in git log
- Commit `ae70ce6` (GREEN: fix implementation) — confirmed in git log

---
*Phase: 20-bug-fixes*
*Completed: 2026-06-22*
