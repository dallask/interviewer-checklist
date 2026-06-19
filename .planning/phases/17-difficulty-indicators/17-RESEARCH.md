# Phase 17: Difficulty Indicators - Research

**Researched:** 2026-06-19
**Domain:** React UI — Tailwind v4 utility classes, badge chip pattern, static color maps
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Left Border**
- Use `border-l-4` (4px) — "thick" per ROADMAP spec, strong visual anchor
- Full saturation colors: `border-green-500` (novice), `border-blue-500` (intermediate), `border-orange-500` (advanced), `border-pink-500` (expert) — exact match to DifficultyFilter dot colors for cross-component consistency
- Same color in dark mode — green/blue/orange/pink -500 are saturated enough to read in dark backgrounds without a separate dark: variant
- Apply border to custom questions too — they have a difficulty level and the indicator should be consistent regardless of question source

**Badge Chip**
- Text is uppercase: `NOVICE`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` — per ROADMAP VIS-02 spec
- Color style: light-mode pill with `bg-[color]-100 text-[color]-700`, dark: `dark:bg-[color]-900/30 dark:text-[color]-400` — follows existing `custom` badge pattern in QuestionCard
- Position: after question text `<span>`, before the note icon button — right-side grouping with other metadata
- Always visible — difficulty is a primary informational signal, not a hover state

**Print & Test Handling**
- Show border + badge in print — difficulty context is useful in exported/printed output; no `print:hidden`
- No monochrome fallback — modern browsers print colors when "background graphics" is enabled; keeping it simple
- Add class-presence tests per difficulty value — verify correct Tailwind classes appear given each difficulty level; follows existing QuestionCard test patterns
- Use static literal color-map objects for Tailwind class strings per established D-06 pattern (same approach as DifficultyFilter's `DOT_CLASSES`)

### Claude's Discretion
- Exact wrapper `<div>` structure for the left border (whether border is on the outer container or a sub-element)
- Whether to colocate the difficulty color maps in QuestionCard.tsx or extract to a shared constants file

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Lucide React icons (Phase 18), 13px font (Phase 19), CSS transitions (Phase 19) are explicitly out of scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Each QuestionCard row has a thick left border whose color corresponds to its difficulty (green = novice, blue = intermediate, orange = advanced, pink = expert) | BORDER_CLASSES map + `border-l-4` on outer container div; exact classes confirmed in codebase |
| VIS-02 | Each QuestionCard shows a difficulty badge chip (NOVICE / INTERMEDIATE / ADVANCED / EXPERT) on the right side of the row | BADGE_CLASSES map + `<span>` after question text with `uppercase` CSS class; `aria-label` for accessibility |
</phase_requirements>

---

## Summary

Phase 17 is a pure UI styling change confined to a single component (`QuestionCard.tsx`) and its test file. No new libraries, store changes, or data model changes are required. The `row.question.level: Difficulty` value is already available in the component prop and the `Difficulty` type (`'novice' | 'intermediate' | 'advanced' | 'expert'`) is already defined in `src/data/bank/types.ts`.

The implementation pattern is fully established by existing code: `DifficultyFilter.tsx` already defines `DOT_CLASSES: Record<Difficulty, string>` using static Tailwind class literals (D-06 pattern), and `QuestionCard.tsx` already renders a badge chip for custom questions using the exact `bg-[color]-100 text-[color]-700 dark:bg-[color]-900/30 dark:text-[color]-400` pattern. This phase replicates those patterns with difficulty-specific colors.

The UI-SPEC (17-UI-SPEC.md) is fully approved and provides exact class strings, DOM structure, contrast ratios, and accessibility requirements. All research is grounded in direct codebase inspection. No third-party packages are introduced — this is a zero-dependency change.

**Primary recommendation:** Implement by adding two static `Record<Difficulty, string>` maps in `QuestionCard.tsx`, applying `border-l-4 {BORDER_CLASSES[question.level]}` to the outer container, inserting a badge chip `<span>` after the question text `<span>`, and adding 8 new test assertions (one border class check + one badge class check per difficulty level).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Difficulty color left border | Browser / Client (React component) | — | Pure CSS utility class applied at render time; no server involvement |
| Difficulty badge chip | Browser / Client (React component) | — | Derived from `row.question.level` already in component prop; no store selector needed |
| Color-to-difficulty mapping | Browser / Client (static constants) | — | Static `Record<Difficulty, string>` object colocated in or near `QuestionCard.tsx` |
| Test coverage | Vitest / happy-dom | — | Class-presence assertions on rendered output; follows existing QuestionCard test pattern |

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.7 | Component rendering | Project-locked stack |
| Tailwind CSS | ^4.3.1 | Utility classes for border + badge colors | Project-locked stack; `@import "tailwindcss"` in styles.css |
| TypeScript | (project TS) | `Record<Difficulty, string>` type safety on color maps | Project-locked stack |
| Vitest | ^4.1.9 | Test runner for class-presence assertions | Project-locked stack |
| @testing-library/react | ^16.3.2 | Render + query for badge chip tests | Project-locked stack |

### Supporting (already installed — no new packages)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest-chrome | ^0.1.0 | Chrome API mocking for test environment | Already in setupFiles; no action needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind static class literals | Dynamic template strings (e.g. `border-${color}-500`) | Template strings make classes invisible to Tailwind's content scanner → colors purged in production build. Static literals are mandatory (D-06). |
| CSS `uppercase` utility | `.toUpperCase()` in JSX | Runtime string manipulation is unnecessary; CSS utility is sufficient and avoids a code smell per CONTEXT.md locked decision. |
| Single combined class string per color | Separate border/badge maps | Combined map would couple border and badge concerns; two separate maps are cleaner and more maintainable. |

**Installation:** No new packages required. Zero `npm install` commands.

---

## Package Legitimacy Audit

No new packages are introduced in this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
row.question.level (Difficulty)
        │
        ▼
  BORDER_CLASSES[level]          BADGE_CLASSES[level]
  (Record<Difficulty,string>)    (Record<Difficulty,string>)
        │                                │
        ▼                                ▼
  outer <div>                     <span> chip
  border-l-4 + color class       text-xs + color classes
  (VIS-01)                       (VIS-02)
        │                                │
        └───────────┬────────────────────┘
                    ▼
            QuestionCard render
            (no store, no side effects)
```

### Recommended Project Structure

No new files are required. Changes are confined to:

```
src/
├── components/
│   ├── QuestionCard.tsx         # Add BORDER_CLASSES + BADGE_CLASSES maps; apply in JSX
│   └── QuestionCard.test.tsx    # Add 8 new test assertions (4 border + 4 badge)
└── data/bank/
    └── types.ts                 # No change — Difficulty type already defined here
```

**Discretion call (colocate vs. extract):** Keep `BORDER_CLASSES` and `BADGE_CLASSES` colocated in `QuestionCard.tsx`. The phase touches only one component, and the DifficultyFilter already has its own `DOT_CLASSES` map. A shared constants file would be premature abstraction for two co-owners. Revisit if Phase 18/19 introduces a third consumer.

### Pattern 1: Static Literal Color Maps (D-06)

**What:** `Record<Difficulty, string>` objects with full Tailwind class strings as static literals. Tailwind v4's content scanner requires complete class names to appear in source — no computed/template strings.

**When to use:** Whenever a component needs to look up a color or style by a discriminated union key (like `Difficulty`). Already used in `DifficultyFilter.tsx`.

**Example:**
```typescript
// Source: DifficultyFilter.tsx (verified in codebase) + UI-SPEC section "Color Map Implementation Pattern"
const BORDER_CLASSES: Record<Difficulty, string> = {
  novice:       'border-green-500',
  intermediate: 'border-blue-500',
  advanced:     'border-orange-500',
  expert:       'border-pink-500',
};

const BADGE_CLASSES: Record<Difficulty, string> = {
  novice:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert:       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};
```

### Pattern 2: Badge Chip `<span>` (existing custom badge pattern)

**What:** A `<span>` with `text-xs font-normal px-1.5 py-0.5 rounded shrink-0` base classes plus dynamic color classes from a map. `shrink-0` prevents flex shrink in the card's flex row.

**When to use:** Any inline pill/chip badge in a flex row inside QuestionCard.

**Example:**
```tsx
// Source: QuestionCard.tsx line 85 (verified in codebase) — existing custom badge pattern
// Difficulty badge extension (from UI-SPEC):
<span
  className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
  aria-label={`${question.level} difficulty`}
>
  {question.level}
</span>
```

Note: `uppercase` CSS class renders lowercase `question.level` value as all-caps visually (NOVICE, INTERMEDIATE, etc.) without string manipulation.

### Pattern 3: Border on Outer Container

**What:** Apply `border-l-4` and a dynamic border color class directly to the outermost `<div>` of QuestionCard, alongside the existing `border-b` class.

**When to use:** Left border indicators that should span the full height of a card/row.

**Example:**
```tsx
// Source: UI-SPEC section "DOM Structure" (derived from CONTEXT.md locked decision)
<div
  className={`bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 border-l-4 ${BORDER_CLASSES[question.level]}`}
>
```

Note: `border-l-4` alongside `border-b` — Tailwind applies them to different edges so there is no conflict. The existing `border-gray-100` class controls the bottom border color; `border-l-4` adds thickness only to the left edge, and the difficulty color class controls the left edge color.

**Tailwind v4 note:** The project uses `@import "tailwindcss"` (v4 CSS-first config) with no `tailwind.config.js`. All standard utility classes including `border-l-4`, `border-green-500`, `bg-green-100` etc. are available without configuration. [VERIFIED: codebase — src/app/styles.css line 1]

### Anti-Patterns to Avoid

- **Dynamic class construction via template literals:** `border-${color}-500` — Tailwind's content scanner cannot detect these; classes will be purged in production. Always use full static strings in the map. [VERIFIED: codebase — DifficultyFilter.tsx comment line 19 and D-06 pattern]
- **Conditional rendering of the badge chip:** The badge should always render (per CONTEXT.md locked decision "Always visible"). Do NOT wrap it in `{row.isCustom === true && ...}` or any other conditional.
- **Using `.toUpperCase()` in JSX:** Per locked decision, use the `uppercase` CSS utility class instead.
- **Separate dark: color map:** Do NOT create a parallel map for dark mode colors — they are bundled into the same string value in `BADGE_CLASSES` using `dark:` prefixes, matching the `custom` badge pattern.
- **Adding border to the print-only div separately:** The print div is a sibling element — it does not inherit the outer `<div>` border. If difficulty is needed in print, duplicate the badge `<span>` inside the print-only div (per UI-SPEC section "Print Row").

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Uppercase badge text | `.toUpperCase()` call or computed string | `uppercase` Tailwind utility on `<span>` | Simpler, zero runtime cost, no test needed for string transform |
| Color lookup by difficulty | `if/else` or `switch` statement | `Record<Difficulty, string>` map lookup | Exhaustive type safety (TypeScript errors if a new Difficulty is added without updating the map), O(1) lookup, matches existing D-06 pattern |
| Dark mode color variants | Separate `dark:` class map | Bundle in same string value per key | Matches existing `custom` badge pattern; single source of truth per difficulty |

**Key insight:** Everything needed is already in the codebase. The implementation is direct application of two existing patterns (DOT_CLASSES map + custom badge chip) with no novel logic required.

---

## Common Pitfalls

### Pitfall 1: Tailwind Class Purging from Dynamic Strings

**What goes wrong:** Developer writes `border-${BORDER_COLOR[level]}-500` or `bg-${color}-100` — classes appear correct in dev but are absent in production build.
**Why it happens:** Tailwind v4's content scanner uses static analysis to find class names; template literals with variables are not detected.
**How to avoid:** Use full static string literals in the map values, exactly as shown in `BORDER_CLASSES` and `BADGE_CLASSES` examples. This is D-06.
**Warning signs:** Classes work in `npm run dev` but disappear after `npm run build`.

### Pitfall 2: Conflicting Border Classes

**What goes wrong:** Adding `border-l-4 border-green-500` to a div that already has `border-b border-gray-100` causes unexpected styling — developer worries the `border-gray-100` overrides the left border color.
**Why it happens:** Confusion about how Tailwind border utilities interact. `border-b` adds a bottom border only. `border-l-4` adds a left border with 4px width. `border-gray-100` sets the color for ALL borders not explicitly overridden. `border-green-500` sets the left border color specifically.
**How to avoid:** In Tailwind v4, `border-l-{color}` is a specific directional color utility that overrides the global `border-{color}` for the left side only. All four classes can coexist correctly. [ASSUMED — standard Tailwind v4 behavior based on training knowledge; verify visually after implementation]
**Warning signs:** The left border appears gray instead of green/blue/orange/pink.

### Pitfall 3: Missing `shrink-0` on Badge Chip

**What goes wrong:** The difficulty badge chip gets squeezed to zero width or wraps awkwardly when the question text is long.
**Why it happens:** The flex row uses `flex-1` on the question text span, which correctly pushes other flex children to their natural size — but without `shrink-0`, the badge can still be compressed.
**How to avoid:** Include `shrink-0` in the badge chip's className, exactly as the `custom` badge does (QuestionCard.tsx line 85). [VERIFIED: codebase — QuestionCard.tsx line 85]
**Warning signs:** Badge text appears clipped or missing on cards with long question text.

### Pitfall 4: Test Assertions Not Targeting the Right Element

**What goes wrong:** A test queries `screen.getByText('NOVICE')` but the element text is lowercase `novice` (the CSS `uppercase` transforms it visually, not in the DOM).
**Why it happens:** CSS `text-transform: uppercase` does not change the DOM text content — only the visual rendering.
**How to avoid:** Test for class presence (`expect(el.className).toContain('uppercase')` + `expect(el.className).toContain('bg-green-100')`) or query by the raw text (`screen.getByText('novice')`). The existing test pattern in `QuestionCard.test.tsx` tests class names directly (e.g., `badge.className.toContain('bg-purple-100')`). Follow that pattern. [VERIFIED: codebase — QuestionCard.test.tsx lines 216-224]
**Warning signs:** `screen.getByText('NOVICE')` throws "unable to find element" even when the badge is rendering.

### Pitfall 5: Print-Only Row Missing Difficulty Badge

**What goes wrong:** The screen row gets the difficulty badge but the print-only `<div>` (line 122-127 in QuestionCard.tsx) does not — difficulty is absent from printed output.
**Why it happens:** The print `<div>` is a separate sibling element, not a CSS-toggled copy of the screen row. Adding the badge to the screen row's flex container does not affect the print row.
**How to avoid:** Duplicate the difficulty badge `<span>` inside the print-only `<div>`. Per CONTEXT.md locked decision and UI-SPEC section "Print Row", the badge should appear in print. [VERIFIED: codebase — QuestionCard.tsx lines 122-127; UI-SPEC "Print Row" section]

---

## Code Examples

Verified patterns from official codebase inspection:

### Existing Custom Badge (reference implementation)
```tsx
// Source: QuestionCard.tsx lines 83-88 (verified in codebase)
{/* Custom badge — shown only for custom questions */}
{row.isCustom === true && (
  <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shrink-0">
    custom
  </span>
)}
```

### Existing DOT_CLASSES Pattern (reference implementation)
```typescript
// Source: DifficultyFilter.tsx lines 19-25 (verified in codebase)
// Full class strings as static literals so Tailwind's content scanner includes them (D-06)
const DOT_CLASSES: Record<Difficulty, string> = {
  novice: 'bg-green-500',
  intermediate: 'bg-blue-500',
  advanced: 'bg-orange-500',
  expert: 'bg-pink-500',
};
```

### Existing Badge Test Pattern (reference implementation)
```typescript
// Source: QuestionCard.test.tsx lines 215-224 (verified in codebase)
it('custom badge has correct classes including purple colors', () => {
  render(<QuestionCard row={mockCustomRow} />);
  const badge = screen.getByText('custom');
  expect(badge.className).toContain('bg-purple-100');
  expect(badge.className).toContain('text-purple-700');
  expect(badge.className).toContain('dark:bg-purple-900/30');
  expect(badge.className).toContain('dark:text-purple-400');
});
```

### Existing SectionFilter Left Border (reference — `border-l-2` used already)
```tsx
// Source: SectionFilter.tsx (verified in codebase) — shows border-l pattern already in use
'border-l-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
```

### Target QuestionCard Implementation (planned)
```tsx
// Source: derived from UI-SPEC "DOM Structure" + CONTEXT.md locked decisions

import type { Difficulty } from '../data/bank/types.js';

const BORDER_CLASSES: Record<Difficulty, string> = {
  novice:       'border-green-500',
  intermediate: 'border-blue-500',
  advanced:     'border-orange-500',
  expert:       'border-pink-500',
};

const BADGE_CLASSES: Record<Difficulty, string> = {
  novice:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert:       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

// In render:
return (
  <div className={`bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 border-l-4 ${BORDER_CLASSES[question.level]}`}>
    {/* screen row */}
    <div className="px-3 py-1.5 pl-10 flex items-center gap-2 min-h-[44px] group print:hidden">
      {/* ... score select, question text span ... */}
      <span
        className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
        aria-label={`${question.level} difficulty`}
      >
        {question.level}
      </span>
      {/* ... custom badge, note button, delete button ... */}
    </div>

    {/* print row — also include badge */}
    <div className="hidden print:flex print:items-center print:gap-2 print:px-3 print:py-1.5 print:pl-10">
      <span className="text-sm font-normal text-gray-900">{question.q}</span>
      <span
        className={`text-xs font-normal px-1.5 py-0.5 rounded uppercase shrink-0 ${BADGE_CLASSES[question.level]}`}
        aria-label={`${question.level} difficulty`}
      >
        {question.level}
      </span>
      <span className="ml-auto text-sm font-normal text-gray-700">
        Score: {score !== null ? `${score} / 10` : '— / 10'}
      </span>
    </div>
    {/* ... notes section ... */}
  </div>
);
```

### Target Test Assertions (planned)
```typescript
// Source: derived from QuestionCard.test.tsx existing pattern + CONTEXT.md "class-presence tests"

// Border class tests (VIS-01) — need to target the outer container
it('outer container has border-l-4 class', () => {
  render(<QuestionCard row={mockRow} />); // mockRow.question.level = 'intermediate'
  // The outermost div — can use container.firstChild from render result
  const { container } = render(<QuestionCard row={mockRow} />);
  expect(container.firstChild).toHaveClass('border-l-4');
  expect(container.firstChild).toHaveClass('border-blue-500');
});

// Badge chip tests (VIS-02) — query by the raw lowercase text value
it('renders difficulty badge chip with correct classes for novice', () => {
  const noviceRow = { ...mockRow, question: { q: 'Test?', level: 'novice' as const } };
  render(<QuestionCard row={noviceRow} />);
  const badge = screen.getByLabelText('novice difficulty');
  expect(badge.className).toContain('bg-green-100');
  expect(badge.className).toContain('text-green-700');
  expect(badge.className).toContain('uppercase');
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No difficulty visible on card | Colored left border + badge chip | Phase 17 | VIS-01 + VIS-02 addressed |
| Tailwind config.js with `content` array | Tailwind v4 CSS-first (`@import "tailwindcss"`) | Phase 1 setup | Full class string literals still required for dynamic classes |

**No deprecated approaches relevant to this phase.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `border-l-4 border-green-500` and `border-b border-gray-100` on the same element apply to different edges and do not conflict — left border takes the difficulty color, bottom border takes gray-100 | Common Pitfalls #2 | Left border could appear gray; fix: test visually post-implementation |

**All other claims in this research were verified against the codebase directly.**

---

## Open Questions (RESOLVED)

1. **Outer div vs. inner sub-element for left border**
   - What we know: CONTEXT.md leaves this to Claude's discretion; UI-SPEC recommends the outer container
   - What's unclear: Whether a wrapping sub-element (e.g., a `<div>` that only holds the colored left border) gives more layout control
   - Recommendation: Apply `border-l-4` to the outer container (the existing `<div>` at line 57 of QuestionCard.tsx). This is simpler, has no extra DOM nodes, and the UI-SPEC explicitly shows this approach. The outer div already has full card height, so the border spans correctly.

2. **Colocate BORDER_CLASSES and BADGE_CLASSES vs. extract to constants file**
   - What we know: `DifficultyFilter.tsx` has its own `DOT_CLASSES` — two components, two separate maps
   - What's unclear: If Phase 18 or 19 adds a third consumer of difficulty colors, extraction becomes worthwhile
   - Recommendation: Colocate in `QuestionCard.tsx` for this phase. Add a comment noting the pattern is shared with `DifficultyFilter.tsx` for future discoverability.

---

## Environment Availability

Step 2.6: SKIPPED — this phase introduces no external dependencies. All tooling (Vitest, Tailwind, React) is already installed and confirmed passing (2007 tests green as of 2026-06-19).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=verbose src/components/QuestionCard.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Outer container has `border-l-4` class | unit | `npm test -- src/components/QuestionCard.test.tsx` | ✅ (new tests added to existing file) |
| VIS-01 | Outer container has `border-green-500` for novice | unit | same | ✅ |
| VIS-01 | Outer container has `border-blue-500` for intermediate | unit | same | ✅ |
| VIS-01 | Outer container has `border-orange-500` for advanced | unit | same | ✅ |
| VIS-01 | Outer container has `border-pink-500` for expert | unit | same | ✅ |
| VIS-02 | Badge chip renders with `aria-label="{level} difficulty"` | unit | same | ✅ |
| VIS-02 | Badge chip has correct light/dark classes per difficulty (×4) | unit | same | ✅ |
| VIS-02 | Badge chip has `uppercase` class | unit | same | ✅ |
| VIS-02 | Badge chip renders `question.level` as text content | unit | same | ✅ |
| Regression | All 2007 existing tests continue to pass | regression | `npm test` | ✅ existing suite |

### Sampling Rate

- **Per task commit:** `npm test -- src/components/QuestionCard.test.tsx`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. `QuestionCard.test.tsx` exists and already has the mock structure, `makeState()` helper, and `mockRow`/`mockCustomRow` fixtures needed for new tests. No new fixture files required.

---

## Security Domain

`security_enforcement: true` is set in `.planning/config.json`, ASVS level 1.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase introduces no auth paths |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | No new data access patterns |
| V5 Input Validation | No | `question.level` is typed as `Difficulty` union — TypeScript enforces valid values; no user input in this phase |
| V6 Cryptography | No | No cryptographic operations |

**Threat assessment:** This phase adds read-only visual rendering of a value already present in the component prop. The `Difficulty` type is a TypeScript union (`'novice' | 'intermediate' | 'advanced' | 'expert'`) with no user-controlled input path. The `Record<Difficulty, string>` lookup is safe because TypeScript ensures the key is always a valid member of the union. No XSS risk (value is rendered as text content, not `dangerouslySetInnerHTML`). No security concerns for this phase.

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `src/components/QuestionCard.tsx` — full file read; confirmed existing custom badge pattern, flex row structure, outer container classes
- `src/components/DifficultyFilter.tsx` — full file read; confirmed `DOT_CLASSES` pattern and `Difficulty` color mapping
- `src/components/QuestionCard.test.tsx` — full file read; confirmed test patterns for class-presence assertions
- `src/data/bank/types.ts` — full file read; confirmed `Difficulty` type definition and `Question.level` field
- `src/utils/buildFlatRows.ts` — full file read; confirmed `QuestionRow.question.level` availability
- `.planning/phases/17-difficulty-indicators/17-UI-SPEC.md` — full file read; confirmed exact class strings, DOM structure, contrast ratios
- `.planning/phases/17-difficulty-indicators/17-CONTEXT.md` — full file read; confirmed all locked decisions
- `vitest.config.ts` — full file read; confirmed test environment and coverage config
- `src/app/styles.css` — full file read; confirmed Tailwind v4 CSS-first setup

### Secondary (MEDIUM confidence)
- `package.json` — grep output; confirmed library versions (React 19, Tailwind 4.3.1, Vitest 4.1.9)
- `npm test` output — confirmed 2007 tests passing as of 2026-06-19

### Tertiary (LOW confidence)
- A1 (Assumptions Log): Tailwind border directional class interaction behavior — training knowledge, verify visually

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new installs
- Architecture: HIGH — all patterns verified in codebase; exact class strings confirmed in UI-SPEC
- Pitfalls: HIGH (P1, P3, P4, P5) / LOW (P2) — most verified against codebase; P2 is standard Tailwind behavior
- Test strategy: HIGH — existing test file structure confirmed; patterns directly replicable

**Research date:** 2026-06-19
**Valid until:** 2026-07-19 (stable stack — Tailwind v4 and React 19 APIs are stable)
