# Phase 21: Layout & Content Ordering — Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent improvements to the content area:
- **LAYOUT-01**: Horizontally center the content at 1200px max-width on wide viewports, full-width on narrow viewports with no horizontal scroll.
- **CONT-01**: Within each topic, display questions in difficulty order: novice → intermediate → advanced → expert. Custom questions appear at their assigned difficulty position within the same sorted list (not appended at the end).

No new features. No sidebar changes. No score/note storage changes.

</domain>

<decisions>
## Implementation Decisions

### LAYOUT-01 — Max-Width Centered Container

- **D-01**: The virtualizer scroll container (`<div ref={parentRef}>` in `ContentTree.tsx` line 79) must remain `width: '100%'` so the scrollbar tracks the full viewport — do not apply max-width here.
- **D-02**: Each virtual row item already has `style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}`. Add a centering wrapper **inside** the row item div but **outside** the row component:
  ```jsx
  <div key={virtualItem.key} data-index={...} ref={...} style={{ position: 'absolute', ... }}>
    <div className="mx-auto w-full max-w-[1200px] px-4">
      {/* row content */}
    </div>
  </div>
  ```
- **D-03**: `px-4` (16px horizontal padding) provides breathing room at all viewport widths and prevents content from touching the edge on narrow screens.
- **D-04**: The print-only candidate header block (lines 83–93 of ContentTree.tsx) should also be wrapped in the same `max-w-[1200px] mx-auto` class so printed output is also constrained.
- **D-05**: No changes needed to App.tsx, Sidebar.tsx, or the main container — the centering is local to ContentTree.

### CONT-01 — Difficulty Sort Within Sections

- **D-06**: Sort order (ascending difficulty): `novice=0, intermediate=1, advanced=2, expert=3`. This matches `DIFFICULTY_COEFFICIENTS` in `src/data/bank/types.ts`.
- **D-07**: Sorting happens inside `buildFlatRows.ts` after `filteredQuestions` is built for a topic. Sort `filteredQuestions` in-place before pushing to `visibleTopics`. `originalIndex` is preserved on each entry so score key lookups (`${topicId}-q${originalIndex}`) are not affected.
- **D-08**: Custom questions must be merged into the same sorted display (ROADMAP SC-4). Instead of appending custom questions at the end, merge them into a unified sorted list with default questions and emit all rows in difficulty order.
- **D-09**: For a unified sort, build a discriminated union after filtering:
  ```ts
  type MergedQuestion =
    | { kind: 'default'; id: string; text: string; level: Difficulty; originalIndex: number; isDefault: boolean }
    | { kind: 'custom'; cq: CustomQuestion; sortIndex: number };
  ```
  Sort by `level` using the difficulty order map, then emit rows based on `kind`.
- **D-10**: The `index` field on custom question rows is currently `topic.questions.length + customForTopic.indexOf(cq)`. After merging into a unified sort this becomes arbitrary — but the score storage for custom questions uses `customId` not `index`, so the `index` value on custom rows is cosmetic. Keep it valid by using the merged array position.
- **D-11**: When sort order is stable (same difficulty), preserve the original ordering (stable sort) — do not shuffle questions of the same level.

### Claude's Discretion

- Whether to add regression tests for the sort behavior is Claude's call (encouraged — buildFlatRows.test.ts already covers the function thoroughly).
- The exact padding value (`px-4` vs `px-6`) can be adjusted if it looks wrong in review.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### LAYOUT-01 Fix Targets
- `src/components/ContentTree.tsx` — virtual row item div (lines 104–150). Add the centering wrapper inside each virtualItem div. The `ref={parentRef}` scroll container must NOT get max-width.
- `src/app/App.tsx` — read-only; `<ContentTree>` is rendered inside `<main className="flex-1 overflow-y-auto ...">`. No changes needed here.

### CONT-01 Fix Targets
- `src/utils/buildFlatRows.ts` — `filteredQuestions` accumulation loop (lines 128–152). After building the list, sort by difficulty. Custom question emission (lines 217–231) must be merged into the sorted display instead of appended.
- `src/data/bank/types.ts` — `Difficulty` type: `'novice' | 'intermediate' | 'advanced' | 'expert'`. Read-only reference for sort key.
- `src/utils/buildFlatRows.test.ts` — add sort regression tests.

### Supporting Context
- `src/store/app.ts` — `CustomQuestion` type at the top of the file. Has fields: `id`, `topicId`, `text`, `level: Difficulty`.
- `src/components/QuestionCard.tsx` — reads `row.question.level` and `row.index`. Both are set in `buildFlatRows`. The `index` field drives score key construction for default questions only; custom question scores use `row.customId`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Centering wrapper pattern
The print-only header (ContentTree.tsx lines 83–93) is a direct child of `parentRef`. It should also get `max-w-[1200px] mx-auto` for consistent print layout. All other content goes through the virtualizer and gets the centering wrapper per-item.

### buildFlatRows loop structure
```
for section → for topic → build filteredQuestions → push visibleTopics
then for visibleTopics → emit TopicRow → for filteredQuestions → emit QuestionRow
then for customForTopic → emit QuestionRow (custom)
```
The D-09 merge means the "emit QuestionRow" and "emit QuestionRow (custom)" sections collapse into a single loop over the merged+sorted array.

### Score key stability
Default question score keys: `${topicId}-q${originalIndex}` where `originalIndex` = index in `topic.questions` array. This is preserved in the `filteredQuestions` entry and must not be changed by sorting.
Custom question score keys: stored by `customId` (from `useAppStore`). The `index` field on the row is not used for score storage.

### Established Patterns
- Tailwind v4 static literal class strings required — `max-w-[1200px]` is a valid JIT literal.
- buildFlatRows produces a flat array of VirtualRow — no tree mutations.
- `DIFFICULTY_COEFFICIENTS` in types.ts already defines the numeric progression; reuse that ordering.

</code_context>

<specifics>
## Specific Ideas

### LAYOUT-01 Wrapper
Inside `ContentTree.tsx`, change the virtual item render from:
```jsx
<div key={...} data-index={...} ref={...} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: ... }}>
  {row.type === 'section' && <SectionRow row={row} />}
  ...
</div>
```
to:
```jsx
<div key={...} data-index={...} ref={...} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: ... }}>
  <div className="mx-auto w-full max-w-[1200px] px-4">
    {row.type === 'section' && <SectionRow row={row} />}
    ...
  </div>
</div>
```

### CONT-01 Sort
In `buildFlatRows.ts`, define a difficulty order constant (or reuse DIFFICULTY_COEFFICIENTS as a proxy) and sort after filtering:
```ts
const DIFF_ORDER: Record<Difficulty, number> = { novice: 0, intermediate: 1, advanced: 2, expert: 3 };
filteredQuestions.sort((a, b) => DIFF_ORDER[a.level] - DIFF_ORDER[b.level]);
```
Then for custom+default merge, collect `customForTopic` before the emit loop and merge into a unified sorted array.

</specifics>

<deferred>
## Deferred Ideas

None — scope is well-bounded.

</deferred>

---

*Phase: 21-Layout-Content-Ordering*
*Context gathered: 2026-06-22*
