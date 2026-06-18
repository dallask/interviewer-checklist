---
phase: 14-editable-bank-yaml-schema-expansion
plan: "02"
subsystem: ui
tags: [typescript, react, buildFlatRows, virtual-rows, v4-section, tanstack-virtual]

# Dependency graph
requires:
  - phase: 14-editable-bank-yaml-schema-expansion
    plan: "01"
    provides: V4SessionSchema + removedDefaultQuestionIds Set + 5 bank-mutation actions + store sections from App.tsx
provides:
  - AddTopicTriggerRow and AddSectionTriggerRow types exported from buildFlatRows.ts
  - VirtualRow union extended to 5 types (SectionRow | TopicRow | QuestionRow | AddTopicTriggerRow | AddSectionTriggerRow)
  - buildFlatRows accepts V4Section[] (not legacy Section[])
  - buildFlatRows iterates section.topics (not section.items)
  - QuestionRow.questionBankId and isDefaultQuestion fields for default questions
  - SectionRow.isDefault field for conditional delete button visibility
  - TopicRow.topic typed as V4Topic (has isDefault field)
  - removedDefaultQuestionIds filter in buildFlatRows (D-08, T-14-03 mitigation)
  - add-topic-trigger emitted once per section after all topics (section not collapsed)
  - add-section-trigger emitted once after all sections (always)
  - question.q backward-compat bridge (q = V4Question.text) for QuestionCard
  - SearchGroup.tsx migrated from DEFAULT_SECTIONS to store sections (V4Section[])
  - as-any cast removed from App.tsx buildFlatRows call
affects:
  - 14-03-yaml-import-export
  - 14-04-bank-ui-components
  - 14-05-integration-tests
  - ContentTree.tsx (needs ESTIMATE_SIZE entries for new row types)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "V4Section.topics iteration pattern (replaces legacy Section.items)"
    - "Q-field bridge: QuestionRow.question.q = V4Question.text (backward compat for QuestionCard)"
    - "removedDefaultQuestionIds filter: question.id check before push (D-08 Set-based filter model)"
    - "Trigger row emission: add-topic-trigger per section (after topics), add-section-trigger unconditional at end"

key-files:
  created: []
  modified:
    - src/utils/buildFlatRows.ts
    - src/utils/buildFlatRows.test.ts
    - src/app/App.tsx
    - src/components/SearchGroup.tsx
    - src/components/SearchGroup.test.tsx
    - src/components/Sidebar.test.tsx

key-decisions:
  - "add-section-trigger always emitted (even when no visible sections) so user can start adding when all sections are filtered out"
  - "add-topic-trigger NOT emitted for collapsed sections (section collapsed → trigger skipped)"
  - "question.q bridge maintained in QuestionRow for QuestionCard backward compat — no QuestionCard changes needed in this plan"
  - "SearchGroup.tsx migrated from DEFAULT_SECTIONS to store sections to maintain consistency with App.tsx pattern from Plan 01"

patterns-established:
  - "Pattern: VirtualRow trigger rows carry sectionId for routing add-topic actions without prop-drilling"
  - "Pattern: toV4Sections() test helper in buildFlatRows.test.ts converts legacy DEFAULT_SECTIONS for existing test cases"

requirements-completed:
  - BANK-01
  - BANK-02
  - BANK-03
  - BANK-04
  - BANK-05

# Metrics
duration: 8min
completed: 2026-06-18
---

# Phase 14 Plan 02: buildFlatRows V4Section Consumer + New Trigger Rows Summary

**buildFlatRows.ts updated to accept V4Section[], emit add-topic-trigger/add-section-trigger rows, filter removedDefaultQuestionIds, and expose QuestionRow.questionBankId for BANK-05 delete wiring**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-18T12:16:20Z
- **Completed:** 2026-06-18T12:24:40Z
- **Tasks:** 2 (with TDD RED/GREEN phases)
- **Files modified:** 6

## Accomplishments
- Extended VirtualRow union to 5 types: SectionRow | TopicRow | QuestionRow | AddTopicTriggerRow | AddSectionTriggerRow
- Updated buildFlatRows to accept `readonly V4Section[]` — migrated from legacy Section.items/question.q to V4Section.topics/question.text
- Added `removedDefaultQuestionIds?: Set<string>` filter parameter — questions whose id is in the set are skipped (D-08, T-14-03 mitigation)
- QuestionRow gains `questionBankId?: string` (= V4Question.id) and `isDefaultQuestion?: boolean` for Plan 04 QuestionCard wiring
- SectionRow gains `isDefault: boolean` for Plan 04 conditional delete button visibility
- TopicRow.topic updated from legacy Topic to V4Topic (has isDefault, questions: V4Question[])
- add-topic-trigger emitted once per non-collapsed section (after all its topics); add-section-trigger emitted unconditionally after all sections
- Q-field bridge: QuestionRow.question = { q: question.text, level: question.level } preserves QuestionCard backward compat
- SearchGroup.tsx migrated from hardcoded DEFAULT_SECTIONS to store sections (V4Section[])
- All 621 tests pass; build clean

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for V4Section types + new row types** - `773e7ba` (test)
2. **Task 1: Add new VirtualRow types + extend QuestionRow/SectionRow/TopicRow** - `d5403a1` (feat)
3. **Task 2: Update buildFlatRows function + emit trigger rows + SearchGroup migration** - `0e14614` (feat)

## Files Created/Modified
- `src/utils/buildFlatRows.ts` - Extended types (5 VirtualRow types), V4Section consumer, trigger row emission, removedDefaultQuestionIds filter
- `src/utils/buildFlatRows.test.ts` - Rewritten to use V4Section format; added new test suites for trigger rows, removedDefaultQuestionIds, isDefault fields
- `src/app/App.tsx` - Removed `as any` cast; buildFlatRows now accepts store sections directly
- `src/components/SearchGroup.tsx` - Migrated from DEFAULT_SECTIONS to store sections (V4Section[])
- `src/components/SearchGroup.test.tsx` - Added `sections: []` to mock state
- `src/components/Sidebar.test.tsx` - Added `sections: []` to mock state

## Decisions Made
- `add-section-trigger` always emitted at end of buildFlatRows output even when all sections are filtered — user must be able to start adding when no sections are visible
- `add-topic-trigger` not emitted for collapsed sections (section collapsed → the topics list is hidden → trigger has no visual anchor)
- Q-field bridge in QuestionRow (question.q = V4Question.text) is the correct backward compat approach — no QuestionCard changes needed in this plan, as planned

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed SearchGroup.tsx to use store sections instead of DEFAULT_SECTIONS**
- **Found during:** Task 2 (after updating buildFlatRows to accept V4Section[])
- **Issue:** SearchGroup.tsx still called `buildFlatRows(DEFAULT_SECTIONS, ...)` where DEFAULT_SECTIONS is the legacy Section[] type. With the updated function signature expecting V4Section[], this caused `section.topics is not iterable` runtime errors in 8 SearchGroup and 5 Sidebar tests.
- **Fix:** Migrated SearchGroup.tsx to read `sections` from store via `useAppStore((s) => s.sections)` (same pattern as App.tsx from Plan 01). Updated `TOTAL_QUESTIONS` from a module-level constant to an in-component `useMemo` using store sections. Updated SearchGroup.test.tsx and Sidebar.test.tsx mocks to include `sections: []`.
- **Files modified:** src/components/SearchGroup.tsx, src/components/SearchGroup.test.tsx, src/components/Sidebar.test.tsx
- **Verification:** npm test — 621 tests pass, 0 failures
- **Committed in:** 0e14614 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking issue caused by correct signature change)
**Impact on plan:** Necessary correctness fix. SearchGroup needed the same DEFAULT_SECTIONS → store.sections migration that App.tsx received in Plan 01. No scope creep.

## Known Stubs
None — all new row types are fully typed and emitted. ContentTree.tsx still needs ESTIMATE_SIZE entries for the new types (Plan 04 concern, pre-existing gap documented).

## Threat Flags
None — no new network endpoints, auth paths, or schema changes introduced. The `removedDefaultQuestionIds` filter (T-14-03) is fully implemented as planned.

## Issues Encountered
None beyond the auto-fixed SearchGroup deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 (YAML import/export) can proceed — no dependency on buildFlatRows trigger rows
- Plan 04 (UI components) can use the new VirtualRow types: render add-topic-trigger, add-section-trigger, and use QuestionRow.questionBankId / isDefaultQuestion for BANK-05 delete wiring
- ContentTree.tsx ESTIMATE_SIZE map needs entries for add-topic-trigger (32px) and add-section-trigger (32px) — this is Plan 04 work

## Self-Check: PASSED

All created/modified files confirmed present. All task commits confirmed in git history.

---
*Phase: 14-editable-bank-yaml-schema-expansion*
*Completed: 2026-06-18*
