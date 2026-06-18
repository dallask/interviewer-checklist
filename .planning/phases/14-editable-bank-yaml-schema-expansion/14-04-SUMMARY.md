---
phase: 14-editable-bank-yaml-schema-expansion
plan: "04"
subsystem: ui
tags: [typescript, react, zustand, tanstack-virtual, inline-form, delete-button, bank-editing]

# Dependency graph
requires:
  - phase: 14-editable-bank-yaml-schema-expansion
    plan: "01"
    provides: store actions addSection/removeSection/addTopic/removeTopic/removeDefaultQuestion
  - phase: 14-editable-bank-yaml-schema-expansion
    plan: "02"
    provides: AddTopicTriggerRow and AddSectionTriggerRow VirtualRow types + QuestionRow.questionBankId/isDefaultQuestion + SectionRow.isDefault + TopicRow.topic as V4Topic
provides:
  - AddSectionForm.tsx: inline form component for adding user-defined sections (BANK-01)
  - AddTopicForm.tsx: inline form component for adding user-defined topics (BANK-03)
  - SectionRow: × delete button for non-default sections wired to removeSection (BANK-02)
  - TopicRow: × delete button for non-default topics wired to removeTopic, stopPropagation (BANK-04)
  - QuestionCard: delete button extended to default questions wired to removeDefaultQuestion(row.questionBankId) (BANK-05)
  - ContentTree: ESTIMATE_SIZE extended for add-section-trigger (120px) and add-topic-trigger (120px)
  - ContentTree: addSectionOpen + addTopicOpenFor local state; dispatches AddSectionForm/AddTopicForm for trigger rows
affects:
  - 14-05-integration-tests
  - ContentTree.tsx consumers

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Trigger row swap pattern: ContentTree renders AddSectionForm/AddTopicForm when open, trigger button when closed — single row type drives both states"
    - "addTopicOpenFor: string | null state: one section form open at a time, null = none open"
    - "stopPropagation on nested delete button: prevents section/topic expand toggle when delete clicked (UI-SPEC phase-specific constraint 2)"
    - "removeDefaultQuestion wired to row.questionBankId (V4Question.id), not the score key, for future-proofing (RESEARCH Pitfall 3)"

key-files:
  created:
    - src/components/AddSectionForm.tsx
    - src/components/AddTopicForm.tsx
  modified:
    - src/components/SectionRow.tsx
    - src/components/TopicRow.tsx
    - src/components/QuestionCard.tsx
    - src/components/ContentTree.tsx

key-decisions:
  - "ESTIMATE_SIZE for trigger rows set to 120px (form height) rather than 32px (trigger height) so virtualizer allocates sufficient space when form is open"
  - "add-section-trigger and add-topic-trigger rows each serve dual purpose (trigger button or inline form) controlled by ContentTree state — no separate add-section-form/add-topic-form row types needed"
  - "addTopicOpenFor is null | string (sectionId) rather than a boolean Set so only one topic form can be open at a time, preventing layout collision"
  - "removeDefaultQuestion receives row.questionBankId (= V4Question.id), not questionId (score key) — equal for Phase 11 materializations but semantically distinct"

patterns-established:
  - "Pattern: trigger-row dual-dispatch — one VirtualRow type renders either a trigger button or an inline form based on component-level state"
  - "Pattern: addTopicOpenFor state — null = no form open; sectionId = form for that section is open"

requirements-completed:
  - BANK-01
  - BANK-02
  - BANK-03
  - BANK-04
  - BANK-05

# Metrics
duration: 5min
completed: 2026-06-18
---

# Phase 14 Plan 04: Bank UI Components (Add/Delete Sections, Topics, Default Questions) Summary

**Two new inline form components (AddSectionForm, AddTopicForm) + delete buttons on SectionRow/TopicRow/QuestionCard + ContentTree extended to dispatch all four trigger/form row states — completing BANK-01 through BANK-05**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-18T12:24:53Z
- **Completed:** 2026-06-18T12:30:00Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- Created AddSectionForm.tsx with name + icon inputs, empty-guard, `custom-section-${Date.now()}` ID, store addSection action, print:hidden + dark mode classes
- Created AddTopicForm.tsx with name + desc inputs, empty-guard, `custom-topic-${sectionId}-${Date.now()}` ID, store addTopic action, print:hidden + dark mode classes
- SectionRow: × delete button visible only when row.isDefault === false, wired to removeSection(row.id) with stopPropagation (BANK-02)
- TopicRow: × delete button visible only when row.topic.isDefault === false, wired to removeTopic(row.topic.id) with stopPropagation (BANK-04)
- QuestionCard: delete condition extended from `isCustom === true` to cover default questions via `isDefaultQuestion === true`; onClick dispatches removeDefaultQuestion(row.questionBankId) for default questions (BANK-05)
- ContentTree: ESTIMATE_SIZE extended with add-section-trigger: 120 and add-topic-trigger: 120; addSectionOpen + addTopicOpenFor state added; dispatch renders AddSectionForm or trigger button, AddTopicForm or trigger button per row type
- 1266 tests pass; build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AddSectionForm + AddTopicForm inline form components** - `06dc643` (feat)
2. **Task 2: Add delete buttons to SectionRow/TopicRow/QuestionCard, extend ContentTree** - `308a200` (feat)

## Files Created/Modified
- `src/components/AddSectionForm.tsx` - Inline form for adding a section; calls addSection store action; uses custom-section-${Date.now()} ID
- `src/components/AddTopicForm.tsx` - Inline form for adding a topic; calls addTopic store action; uses custom-topic-${sectionId}-${Date.now()} ID
- `src/components/SectionRow.tsx` - × delete button for non-default sections (row.isDefault === false), removeSection, stopPropagation
- `src/components/TopicRow.tsx` - × delete button for non-default topics (row.topic.isDefault === false), removeTopic, stopPropagation
- `src/components/QuestionCard.tsx` - Extended delete condition to cover default questions; removeDefaultQuestion(row.questionBankId) for isDefaultQuestion===true
- `src/components/ContentTree.tsx` - ESTIMATE_SIZE with trigger row entries; addSectionOpen/addTopicOpenFor state; AddSectionForm/AddTopicForm dispatch

## Decisions Made
- ESTIMATE_SIZE for trigger rows uses 120px (form height) instead of 32px (trigger height): the same VirtualRow entry serves both states, so the larger height prevents layout shift when the form opens.
- add-section-trigger and add-topic-trigger rows are dual-purpose (trigger or form) — no separate `add-section-form` / `add-topic-form` row types emitted from buildFlatRows. Plan 02 already only emits the trigger variants, which aligns with the final decision in Plan 04 task spec.
- removeDefaultQuestion receives `row.questionBankId` (the V4Question.id field) — semantically correct per RESEARCH Pitfall 3, equal to score key for Phase 11 materializations but future-proof.

## Deviations from Plan

None - plan executed exactly as written. The FINAL DECISION in Task 2 spec (trigger rows as dual-purpose, no separate form row types) was implemented directly — buildFlatRows already emitted only trigger variants from Plan 02, so no buildFlatRows changes were needed.

## Issues Encountered
None — build was clean and all 1266 tests passed on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 05 (integration tests) can proceed — all BANK-01..05 UI affordances are wired and functional
- The full add/delete bank editing flow is visible in ContentTree: users can add sections, add topics, remove non-default sections/topics, and remove default questions
- YAML round-trip (Plan 03) is already complete and independent; all three plans (01, 02, 03, 04) are now merged

## Known Stubs
None — all new components are fully wired to store actions. No hardcoded empty values or placeholder text in rendered UI output.

## Threat Flags
None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All new surface (form inputs + delete buttons) is purely client-side, local-state UI per T-14-07, T-14-08, T-14-09 in the plan threat register.

## Self-Check: PASSED

All created/modified files confirmed present. All task commits confirmed in git history.

---
*Phase: 14-editable-bank-yaml-schema-expansion*
*Completed: 2026-06-18*
