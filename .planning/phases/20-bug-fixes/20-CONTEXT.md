# Phase 20: Bug Fixes - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix two specific regressions from v1.2:
- **BUG-01**: Adding a topic to a section does not appear in the tree and is not visible after reload (root cause: `buildFlatRows` filters out topics with no questions)
- **BUG-02**: QuestionCard left border appears gray instead of the expected difficulty color (root cause: Tailwind v4 cascade — `border-gray-100` overrides `border-{color}-500` at the stylesheet level)

No new features. No layout changes. No other polish items.

</domain>

<decisions>
## Implementation Decisions

### BUG-01 — Empty Topic Visibility

- **D-01**: Root cause is in `src/utils/buildFlatRows.ts` line 154. The condition `filteredQuestions.length > 0` excludes newly-added topics with no questions. These topics never appear in the tree (not even after reload — the data is saved correctly but never rendered).
- **D-02**: Fix: modify the topic inclusion condition to also include topics where `topic.questions.length === 0`. Both cases should render a TopicRow: topics with visible filtered questions AND topics that are simply empty (no questions yet).
- **D-03**: The section-skip guard at line 168 (`if (visibleTopics.length === 0 && section.topics.length > 0) continue`) will self-correct once empty topics are in `visibleTopics` — no separate fix needed there.
- **D-04**: Empty topic renders as a TopicRow with the existing custom question form (`src/components/TopicRow.tsx` line 123). No special empty-state message needed — the "Add custom question" affordance already in TopicRow is sufficient.
- **D-05**: The section add form (`AddSectionForm`) itself works correctly — sections appear immediately. The bug is only in topic add.

### BUG-02 — Difficulty Border Color

- **D-06**: Root cause is in `BORDER_CLASSES` in `src/components/QuestionCard.tsx` line 8–13. Using `border-{color}-500` (shorthand, sets all border colors) conflicts with `border-gray-100` (also shorthand) already in the className. In Tailwind v4, stylesheet cascade order determines which wins — `border-gray-100` wins, making the left border appear gray.
- **D-07**: Fix: replace all `border-{color}-500` entries in `BORDER_CLASSES` with `border-l-{color}-700`. The `border-l-{color}` utility sets only `border-left-color` (not the global `border-color`), avoiding the cascade conflict entirely.
- **D-08**: Shade should be `-700` (not `-500`) to match the badge text colors in `BADGE_CLASSES` exactly: `text-green-700`, `text-blue-700`, `text-orange-700`, `text-pink-700`. User confirmed exact shade match is desired.
- **D-09**: The full comment "Full class strings as static literals so Tailwind's content scanner includes them (D-06)" must be updated to reflect the new class names so the scanner still picks them up.

### Claude's Discretion

- Order of fixes (BUG-01 vs BUG-02 first) is Claude's call.
- Whether to add a test for the BUG-01 empty-topic scenario is Claude's call (existing test suite covers buildFlatRows; a targeted case would be valuable).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### BUG-01 Fix Targets
- `src/utils/buildFlatRows.ts` — topic inclusion logic at line 154; section-skip guard at line 168. This is the ONLY file that needs changing for BUG-01.
- `src/components/TopicRow.tsx` — verify the custom question form (line 123) renders correctly for a topic with no questions (read-only check, no expected change)
- `src/components/AddTopicForm.tsx` — topic add form that calls `addTopic(sectionId, { ..., questions: [] })`
- `src/store/app.ts` — `addTopic` action at line 362; `addSection` at line 354; module-level subscribe at line 723 (persistence path)

### BUG-02 Fix Targets
- `src/components/QuestionCard.tsx` — `BORDER_CLASSES` at line 8–13 and `BADGE_CLASSES` at line 16–24. The fix is in `BORDER_CLASSES` only; `BADGE_CLASSES` is correct and must not change.
- `src/data/bank/types.ts` — `Difficulty` type: `'novice' | 'intermediate' | 'advanced' | 'expert'`. All four levels are confirmed mismatched.

### Supporting Context
- `src/components/ContentTree.tsx` — renders `add-topic-trigger` rows (line 131–146); virtualizer setup with `useFlushSync: false` for React 19 (line 44)
- `src/utils/buildFlatRows.test.ts` — existing test coverage for buildFlatRows; add a case for topic with `questions: []`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TopicRow` (`src/components/TopicRow.tsx`): already renders a custom question form at line 123 — empty topics will naturally show this affordance with no changes to TopicRow
- `BADGE_CLASSES` (`src/components/QuestionCard.tsx` line 16): correct color mapping at `-700` shade; `BORDER_CLASSES` should be updated to match

### Established Patterns
- Tailwind v4 static literal class strings: all class strings in JS must appear as full literals (not constructed dynamically) so the content scanner picks them up. The `BORDER_CLASSES` fix must keep all new class strings as full literals (e.g., `'border-l-4 border-l-green-700'` not templated).
- `buildFlatRows` receives `sections: readonly V4Section[]` — the fix must not mutate the input; use the existing `filteredQuestions` accumulation pattern
- Storage persistence: `addTopic` triggers the module-level subscribe → `storageAdapter.write()` with 300ms debounce. No changes needed to the persist path.

### Integration Points
- `App.tsx` line 63: `buildFlatRows` call — no change needed here; the fix is inside `buildFlatRows`
- `ContentTree.tsx` line 116: `row.type === 'topic' && <TopicRow row={row} />` — topic rows will now include empty custom topics; TopicRow must handle `row.topic.questions.length === 0` gracefully (verify it does)

</code_context>

<specifics>
## Specific Ideas

- BUG-01: The fix is a single conditional change in `buildFlatRows.ts`. Consider: `if (filteredQuestions.length > 0 || topic.questions.length === 0)` — include topics that either have visible questions OR have no questions at all (newly added empty topic).
- BUG-02: New `BORDER_CLASSES`:
  ```ts
  const BORDER_CLASSES: Record<Difficulty, string> = {
    novice: 'border-l-4 border-l-green-700',
    intermediate: 'border-l-4 border-l-blue-700',
    advanced: 'border-l-4 border-l-orange-700',
    expert: 'border-l-4 border-l-pink-700',
  };
  ```
- Both bugs have isolated, single-file fixes. The planner should be able to create compact, focused plans.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-Bug-Fixes*
*Context gathered: 2026-06-22*
