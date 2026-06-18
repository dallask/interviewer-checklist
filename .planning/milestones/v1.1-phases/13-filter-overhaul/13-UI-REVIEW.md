# Phase 13 — UI Review

**Audited:** 2026-06-18
**Baseline:** 13-UI-SPEC.md (approved design contract)
**Screenshots:** Not captured (no dev server detected on ports 3000 or 5173)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All spec-mandated copy matches exactly; no generic labels |
| 2. Visuals | 2/4 | Touch targets below 44px minimum; SectionFilter missing icon-label gap |
| 3. Color | 3/4 | Count badge color deviates from spec on pressed rows |
| 4. Typography | 4/4 | Exactly text-sm / text-xs; no font-weight classes (correct) |
| 5. Spacing | 2/4 | SectionFilter uses px-3 where spec declares px-4; no min-h-[44px] anywhere |
| 6. Experience Design | 3/4 | No-op "All" click handled correctly; missing visual disabled affordance and cursor feedback |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **Touch targets below 44px on all filter rows** — Users on touch devices cannot reliably tap filter rows; the `py-2` + `text-sm` combination produces ~36px height — Add `min-h-[44px]` to every `<button>` in both DifficultyFilter and SectionFilter (spec explicitly requires this, citing Phase 12 SidebarGroup pattern)

2. **SectionFilter section rows use `px-3` instead of spec-declared `px-4`** — Section rows have 4px less horizontal padding than the design contract requires, misaligning them visually against spec — Change `px-3` to `px-4` on the `DEFAULT_SECTIONS.map()` button at SectionFilter.tsx:56; the "All sections" row may also need `px-4` to match (spec says `px-3` for "All sections" layout, so only section rows need the change)

3. **Count badge color overrides spec on pressed rows** — When a row is pressed, the count badge changes to `text-blue-200/text-blue-300` (DifficultyFilter) or `text-blue-500/text-blue-400` (SectionFilter); the UI-SPEC declares the badge should always use `text-gray-400 dark:text-gray-500` with no pressed-state exception — Remove the conditional color ternary on count badge spans and use a fixed `text-gray-400 dark:text-gray-500` class in both components

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All copywriting contract elements verified:

- `All levels` — DifficultyFilter.tsx:66 — exact match
- `All sections` — SectionFilter.tsx:37 — exact match
- `Novice` / `Intermediate` / `Advanced` / `Expert` — DifficultyFilter.tsx:14-17 — exact match, no multiplier text
- Count badges render numeric integers only — no "questions" suffix — confirmed via useMemo output, no string concatenation present
- No generic labels (`Submit`, `OK`, `Cancel`, `Save`, `Click Here`) found in either file
- No empty-state or error-state copy needed (spec declares "not applicable" for both)

PASS — no deviations.

### Pillar 2: Visuals (2/4)

**WARNING: Touch target height below 44px minimum**

The UI-SPEC Spacing Scale section explicitly states: "Touch target minimum: `min-h-[44px]` on SidebarGroup toggle buttons (existing Phase 12 pattern; applies to 'All' rows by same rule)."

Neither the "All levels" button (DifficultyFilter.tsx:53-74) nor any difficulty row (DifficultyFilter.tsx:79-103) nor the "All sections" button (SectionFilter.tsx:25-45) nor any section row (SectionFilter.tsx:51-72) has `min-h-[44px]`. All buttons rely solely on `py-2` (8px top + 8px bottom) plus `text-sm` line height (~21px) = ~37px rendered height. This is below Apple HIG and WCAG 2.5.5 recommended 44px touch target.

**WARNING: SectionFilter icon-label spacing absent**

DifficultyFilter uses `gap-2` on its row buttons (lines 59, 84), creating 8px spacing between dot, label, and count badge. SectionFilter section rows have no `gap-` class on their button (line 56) — the emoji icon `<span>` and the `<span className="flex-1">` are adjacent with no declared spacing. The "All sections" row also lacks `gap-` (line 30). This creates tighter visual crowding compared to DifficultyFilter and is inconsistent within the same sidebar.

**PASS: Visual hierarchy**

The pressed-state contrast (full blue fill on DifficultyFilter pills; left-border + tinted bg on SectionFilter) provides clear visual differentiation. Difficulty color dots (`bg-green-500`, `bg-blue-500`, `bg-orange-500`, `bg-pink-500`) add semantic color signals before labels. Section emoji icons are correctly decorative (`aria-hidden="true"`). Count badges use the lowest visual weight (`text-gray-400`/`text-xs`) — correct hierarchy.

### Pillar 3: Color (3/4)

**WARNING: Count badge color deviates from spec on pressed state**

UI-SPEC Color section states count badge color is `text-gray-400 dark:text-gray-500` — no pressed-state exception is declared. The implementation applies a conditional ternary:

- DifficultyFilter.tsx:67-71: pressed → `text-blue-200 dark:text-blue-300`; unpressed → `text-gray-400 dark:text-gray-500`
- SectionFilter.tsx:38-42: pressed → `text-blue-500 dark:text-blue-400`; unpressed → `text-gray-400 dark:text-gray-500`
- SectionFilter.tsx:64-68: same conditional on section rows when selected

The spec declares the badge is "supplementary context, not hierarchy anchor" and gives only one color value. The pressed-state overrides are undocumented additions. The DifficultyFilter version (`text-blue-200`) may fail contrast against the `bg-blue-600` pressed pill background (white text on blue — `text-blue-200` is very light and could be near-invisible on dark mode where `dark:bg-blue-500` is the background).

**PASS: No hardcoded hex or rgb values** — zero matches found.

**PASS: No design-token class names (`text-primary`, `bg-primary`)** — correct, this project uses plain Tailwind.

**PASS: Accent (blue) used only on declared elements** — `bg-blue-600`/`bg-blue-500` pressed pills, `border-blue-600`/`border-blue-400` section row border, `ring-blue-500` focus ring. No undeclared accent usage.

### Pillar 4: Typography (4/4)

Font sizes in use: `text-sm` (filter row labels) and `text-xs` (count badges) — exactly matches the spec's 3-row typography table (the third size `text-base font-semibold` is SidebarGroup headings, outside this phase's files).

Font weights: no `font-*` class appears in either file — both components rely on browser default (400 regular), which matches the spec's declaration of regular weight for filter row labels and count badges.

No deviations from the typography contract.

### Pillar 5: Spacing (2/4)

**BLOCKER-adjacent WARNING: SectionFilter section rows use px-3 instead of spec px-4**

UI-SPEC Spacing Scale table lists `md = 16px` with usage "Horizontal padding inside filter buttons (`px-4` on section rows)". SectionFilter section row buttons (line 56) use `px-3` (12px). The "All sections" row (line 30) also uses `px-3`. This is a 4px deviation from the declared spacing scale on every single section row.

DifficultyFilter correctly uses `px-3` for its pill buttons — the spec may be specifying px-4 specifically for the full-width section row style. The spec table note is unambiguous: "px-4 on section rows."

**WARNING: No min-h-[44px] anywhere** (also flagged in Pillar 2) — the spec's spacing exceptions table explicitly lists this value; it is absent from all buttons in both components.

**PASS: No arbitrary spacing values** — zero `[*px]` or `[*rem]` spacing found.

**PASS: Gap, padding, and vertical rhythm** — `gap-2` (8px) between filter rows in DifficultyFilter; `py-2` (8px vertical padding) consistent across all rows; `px-3` consistent within each component.

### Pillar 6: Experience Design (3/4)

**WARNING: No visual cursor or disabled affordance on no-op "All" click**

The interaction contract (spec line: "no-op when empty") is correctly implemented in JS (`if (selectedDifficulties.size > 0) clearDifficulties()`). However there is no `cursor-default` or `aria-disabled="true"` applied when the "All" row is already in pressed state. Users who hover the already-pressed "All levels" button see a pointer cursor, inviting a click that silently does nothing. Adding `cursor-default` or `cursor-not-allowed` conditionally would communicate the no-op state.

**PASS: aria-pressed semantics** — all four required cases implemented:
- "All levels" `aria-pressed={selectedDifficulties.size === 0}` — DifficultyFilter.tsx:55
- "All sections" `aria-pressed={selectedSections.size === 0}` — SectionFilter.tsx:26
- Individual difficulty rows `aria-pressed={isSelected}` — DifficultyFilter.tsx:82
- Individual section rows `aria-pressed={isSelected}` — SectionFilter.tsx:54

**PASS: Decorative elements hidden from screen readers** — all `∞`, `📋`, color dots, and section emoji spans carry `aria-hidden="true"`.

**PASS: Focus-visible rings** — `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` present on all interactive rows in both components.

**PASS: useMemo with empty dep array** — D-05 requirement met in both components; Phase-14-ready.

**N/A: Loading, error, empty states** — spec declares all as "not applicable" for this phase (static bank data, no async operations).

---

## Additional Findings (beyond top 3)

4. **DifficultyFilter pressed count badge contrast risk** (DifficultyFilter.tsx:69) — `text-blue-200` on `bg-blue-600` pressed background. Blue-200 (#bfdbfe) on blue-600 (#2563eb) has an approximate contrast ratio of 2.3:1, which fails WCAG AA (requires 4.5:1 for normal text). Dark mode `text-blue-300 dark:bg-blue-500` is similarly low contrast. Since the count badge is supplementary, this is a WARNING not a BLOCKER, but the spec's intended fix (use `text-gray-400` always) also resolves this.

5. **SectionFilter `gap-` missing on section rows creates icon-label crowding** (SectionFilter.tsx:56) — The emoji icon `<span>` and the `<span className="flex-1">` are adjacent without gap. Add `gap-2` to the section row button className to match DifficultyFilter's treatment.

6. **SectionFilter "All sections" row also missing gap** (SectionFilter.tsx:30) — Same issue as section rows; add `gap-2` for consistency.

---

## Registry Safety

No shadcn components.json found. Registry audit skipped.

---

## Files Audited

- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/DifficultyFilter.tsx`
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/SectionFilter.tsx`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/13-filter-overhaul/13-UI-SPEC.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/13-filter-overhaul/13-CONTEXT.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/13-filter-overhaul/13-01-PLAN.md`
- `/Users/dallask/Projects/dallask/interviewer-checklist/.planning/phases/13-filter-overhaul/13-01-SUMMARY.md`
