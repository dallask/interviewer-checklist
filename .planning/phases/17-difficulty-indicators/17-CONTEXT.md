# Phase 17: Difficulty Indicators - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual difficulty indicators to each QuestionCard: a thick colored left border and an uppercase badge chip. Both are derived from the question's existing `difficulty` level (`novice`, `intermediate`, `advanced`, `expert`). No new data or store changes — `row.question.level` is already available in `QuestionCard` via `QuestionRow`.

</domain>

<decisions>
## Implementation Decisions

### Left Border
- Use `border-l-4` (4px) — "thick" per ROADMAP spec, strong visual anchor
- Full saturation colors: `border-green-500` (novice), `border-blue-500` (intermediate), `border-orange-500` (advanced), `border-pink-500` (expert) — exact match to DifficultyFilter dot colors for cross-component consistency
- Same color in dark mode — green/blue/orange/pink -500 are saturated enough to read in dark backgrounds without a separate dark: variant
- Apply border to custom questions too — they have a difficulty level and the indicator should be consistent regardless of question source

### Badge Chip
- Text is uppercase: `NOVICE`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` — per ROADMAP VIS-02 spec
- Color style: light-mode pill with `bg-[color]-100 text-[color]-700`, dark: `dark:bg-[color]-900/30 dark:text-[color]-400` — follows existing `custom` badge pattern in QuestionCard
- Position: after question text `<span>`, before the note icon button — right-side grouping with other metadata
- Always visible — difficulty is a primary informational signal, not a hover state

### Print & Test Handling
- Show border + badge in print — difficulty context is useful in exported/printed output; no `print:hidden`
- No monochrome fallback — modern browsers print colors when "background graphics" is enabled; keeping it simple
- Add class-presence tests per difficulty value — verify correct Tailwind classes appear given each difficulty level; follows existing QuestionCard test patterns
- Use static literal color-map objects for Tailwind class strings per established D-06 pattern (same approach as DifficultyFilter's `DOT_CLASSES`)

### Claude's Discretion
- Exact wrapper `<div>` structure for the left border (whether border is on the outer container or a sub-element)
- Whether to colocate the difficulty color maps in QuestionCard.tsx or extract to a shared constants file

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DifficultyFilter.tsx` — already defines `DOT_CLASSES: Record<Difficulty, string>` with `bg-green-500`, `bg-blue-500`, `bg-orange-500`, `bg-pink-500` and `DIFFICULTY_LABELS` — reference or replicate pattern
- `QuestionCard.tsx` — already uses a colored `custom` badge pill (`bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`) — replicate the pill pattern for difficulty
- `QuestionRow` type in `buildFlatRows.ts` — `row.question.level: Difficulty` is already available, no store changes needed
- `Difficulty` type is in `src/data/bank/types.ts` — import from there

### Established Patterns
- Static Tailwind class literals in Record objects per D-06 (see `DOT_CLASSES` in DifficultyFilter)
- `shrink-0` on badge chips to prevent flex shrink (see `custom` badge)
- `text-xs font-normal px-1.5 py-0.5 rounded` for badge chip base classes (existing `custom` badge)
- Dark mode badge: `dark:bg-[color]-900/30 dark:text-[color]-400` pattern

### Integration Points
- `QuestionCard.tsx` is the only file that needs changes — receives `row` prop with `row.question.level`
- `QuestionCard.test.tsx` needs new tests for left border class and badge chip presence per difficulty

</code_context>

<specifics>
## Specific Ideas

No specific implementation requests — open to standard Tailwind approaches following the established D-06 pattern and existing badge pill style.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
