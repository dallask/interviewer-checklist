# Phase 13: Filter Overhaul - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 13 adds "All" rows, color/emoji indicators, and live question counts to both filter widgets in the sidebar. The filter logic itself (multi-select Set semantics) is unchanged — the phase only augments visual affordances and adds `clearDifficulties` / `clearSections` as thin store actions.

**In scope:**
- UI-16: DifficultyFilter — "All levels" first row (∞ icon), color dot per difficulty, question count per row
- UI-17: SectionFilter — "All sections" first row (📋 icon), emoji per section (reuse `Section.icon`), question count per row
- New store actions: `clearDifficulties()` and `clearSections()`
- Difficulty label normalization: Novice / Intermediate / Advanced / Expert (drop multiplier text)

**Out of scope:**
- Editable bank (Phase 14) — custom-question question counts are intentionally excluded from these counts (default bank only)
- Sidebar sticky header / footer (Phase 15)
- Any change to filter selection semantics (Set toggle behavior stays identical)

</domain>

<decisions>
## Implementation Decisions

### D-01: "All levels" / "All sections" visual state

The "All" row is highlighted (pressed state) when the corresponding Set is **empty** (no specific filter selected = show all). When the set is non-empty, "All" is unstyled. This communicates the current filter mode clearly.

Clicking "All" when the set is already empty → **no-op** (set is already empty; avoid flash-and-restore).

Clicking "All" when one or more specific filters are selected → call `clearDifficulties()` / `clearSections()` to empty the set.

### D-02: Question count scope

Per-row counts are **global** — they count raw questions in `DEFAULT_SECTIONS` regardless of the other filter's active state. Counts do NOT cross-filter (difficulty rows do not narrow by active sections and vice versa).

Count source: `DEFAULT_SECTIONS` only (no custom questions). Custom questions are an edge case; their counts are not shown in the filter badge.

Counts update reactively via `useMemo` over `DEFAULT_SECTIONS` — since the bank is static (in v1.1), the memo deps change only when `customQuestions` change (Phase 14 will wire this properly). For Phase 13, the count computed from `DEFAULT_SECTIONS` is a compile-time constant in effect; use `useMemo` to be Phase-14-ready.

### D-03: New store actions

Add two thin actions to `src/store/app.ts`:

```ts
clearDifficulties: () => void
clearSections: () => void
```

Each simply sets the corresponding Set to `new Set()`:
```ts
clearDifficulties: () => set({ selectedDifficulties: new Set() }),
clearSections: () => set({ selectedSections: new Set() }),
```

These are separate from `toggleDifficulty` / `toggleSection` — do NOT repurpose toggle with a sentinel value.

### D-04: Difficulty labels

Drop the multiplier from visible label text. New labels:

| Store key | Display label |
|-----------|--------------|
| `novice` | Novice |
| `intermediate` | Intermediate |
| `advanced` | Advanced |
| `expert` | Expert |

The `DIFFICULTY_LABELS` map in `DifficultyFilter.tsx` is updated in-place.

### D-05: Count computation in components

Each filter component computes its own counts via `useMemo`. No store changes needed for counts — this avoids storing derived data.

**DifficultyFilter count:**
```ts
const questionCounts = useMemo(() => {
  const all = DEFAULT_SECTIONS.flatMap(s => s.items).flatMap(t => t.questions);
  return {
    novice: all.filter(q => q.level === 'novice').length,
    intermediate: all.filter(q => q.level === 'intermediate').length,
    advanced: all.filter(q => q.level === 'advanced').length,
    expert: all.filter(q => q.level === 'expert').length,
  };
}, []);
```

**SectionFilter count:**
```ts
const sectionCounts = useMemo(
  () => Object.fromEntries(
    DEFAULT_SECTIONS.map(s => [s.id, s.items.reduce((n, t) => n + t.questions.length, 0)])
  ),
  []
);
```

### D-06: Color dots for DifficultyFilter

Inline `<span>` dot placed before the label. Static Tailwind classes:

| Difficulty | Dot class |
|------------|-----------|
| novice | `bg-green-500` |
| intermediate | `bg-blue-500` |
| advanced | `bg-orange-500` |
| expert | `bg-pink-500` |

Dot size: `w-2 h-2 rounded-full flex-shrink-0` (8×8px circle).

### D-07: SectionFilter right side — count replaces score

The current SectionFilter shows the section mark (score) on the right. Phase 13 **replaces** this with the question count (e.g., "12"). The section score remains accessible via ContentTree in the main panel — the filter widget's right slot is repurposed for the count badge.

Remove `scores`, `overrides`, `customQuestions`, `computeTopicMark`, `computeSectionMark`, `BAND_COLORS`, and `MarkBand` imports from SectionFilter — they are no longer needed after this change.

### D-08: SectionFilter emoji — reuse Section.icon

`Section` already has an `icon: string` field containing the section emoji. Use `section.icon` directly. No hardcoded emoji map needed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope

- `.planning/REQUIREMENTS.md` §Filters — UI-16 and UI-17 are the locked requirements
- `.planning/ROADMAP.md` §Phase 13 — Goal + 4 success criteria are the verification target

### Component files to modify

- `src/components/DifficultyFilter.tsx` — UI-16: add "All levels" row, color dots, count badges, normalized labels
- `src/components/SectionFilter.tsx` — UI-17: add "All sections" row, use section.icon, count badge (replace score)
- `src/store/app.ts` — add `clearDifficulties` and `clearSections` actions

### Store interface

- `src/store/app.ts` lines ~61–116 — `selectedDifficulties: Set<Difficulty>`, `selectedSections: Set<string>`, `toggleDifficulty`, `toggleSection` (lines ~262–281). Add `clearDifficulties` and `clearSections` after `toggleSection`.

### Type definitions

- `src/data/bank/types.ts` — `Difficulty` union, `Question.level`, `Section.icon` field
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` export

### Reference component

- `src/components/DifficultyFilter.tsx` (current) — 44 lines; multi-select toggle, `aria-pressed`, `DIFFICULTY_LABELS` map
- `src/components/SectionFilter.tsx` (current) — 72 lines; scoring imports to REMOVE after change

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `selectedDifficulties.size === 0` / `selectedSections.size === 0` — use as the "all" guard; empty Set = show all
- `Section.icon` — already populated for all 9 sections; no new data needed for SectionFilter emoji
- `DIFFICULTY_COEFFICIENTS` in `types.ts` — not needed here (multipliers dropped from labels)
- `toggleDifficulty` / `toggleSection` — unchanged; only the "All" row handler calls the new clear actions

### Integration Points

- Store `subscribe` block persists `selectedDifficulties` and `selectedSections` (lines ~627–628): `[...state.selectedDifficulties]` / `[...state.selectedSections]`. No changes needed — `clearDifficulties()` produces an empty `Set` which serializes to `[]`, which on rehydration produces `new Set()` as expected.
- `resetAll` action (store line ~339) already clears both Sets to `new Set()` — the clear actions follow the same pattern.

### Established Patterns

- `aria-pressed` on filter buttons — already used; extend to "All" row
- `isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'` — existing difficulty button pressed state; "All" row uses the same pressed/unpressed classes
- `border-l-2 border-blue-600 bg-blue-50` — existing section button pressed state; "All sections" uses the same

</code_context>

<specifics>
## Specific Ideas

- "All levels" row: use the Unicode ∞ character (`∞`) or the text `∞` in a `<span aria-hidden="true">` — no SVG import needed
- "All sections" row: use `📋` as the inline icon (same approach as SidebarGroup emoji icons in Phase 12)
- Question count badge: right-aligned `<span className="ml-auto text-xs tabular-nums text-gray-400 dark:text-gray-500">` matching the visual weight of the old score display
- "All" row count badge: can show the total question count across all difficulties / all sections to give global context

</specifics>

<deferred>
## Deferred Ideas

- Including custom question counts in the per-row badge — deferred to Phase 14 when the editable bank UI lands. The `useMemo([], [])` dep array should be updated to `[customQuestions]` in Phase 14.
- Cross-filter counts (difficulty counts narrowed by active section filter) — rejected in smart discuss; global counts only.

</deferred>

---

*Phase: 13-filter-overhaul*
*Context gathered: 2026-06-18*
