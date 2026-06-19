# Phase 18: Icon Library - Research

**Researched:** 2026-06-19
**Domain:** Lucide React icon migration — emoji-to-SVG replacement across React 19 / Tailwind v4 / CRXJS Chrome extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Lucide React — already decided (STATE.md). Tree-shakeable, MIT, React 19 compatible, material-like aesthetic.
- **D-02:** Import individual named icons: `import { Menu, Pencil, X, Search } from 'lucide-react'` — enables tree-shaking, same pattern used in most React projects.
- **D-03:** `×` (U+00D7 MULTIPLICATION SIGN) in 11 components is IN SCOPE — replace with Lucide `X` icon.
- **D-04:** `✓` (U+2713 CHECK MARK) in SessionRow is IN SCOPE — replace with Lucide `Check` icon.
- **D-05:** AddSectionForm editable icon field (default `🔧`, user can enter any emoji) is OUT OF SCOPE — this is user-authored content, not UI chrome.
- **D-06:** Two-tier sizing: `w-4 h-4` (16px) inline icons; `w-5 h-5` (20px) standalone action buttons.
- **D-07:** `strokeWidth` — use Lucide default (1.5). Do not override unless a specific icon looks too thin/thick.
- **D-08:** `aria-hidden="true"` on every SVG icon — the containing `<button>` already carries `aria-label`, the icon is decorative.
- **D-09:** Tests querying by emoji text must be updated to `getByRole('button', {name: '...'})` using existing `aria-label` attributes.
- **D-10:** `×` dismiss buttons that lack `aria-label` must receive one during replacement. Do NOT add `data-testid`.

### Claude's Discretion

- Exact Lucide icon name when multiple candidates exist (e.g., `Pencil` vs `FilePen` vs `Edit` for the note icon — pick best visual fit)
- Whether to create a shared `Icon` wrapper component or import Lucide directly at each site
- `strokeWidth` value per-icon if default looks off at the target size

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-03 | All UI chrome icons (sidebar actions, toggle buttons, section icons, badges) are replaced with glyphs from a consistent material-like icon library (Lucide React) instead of ad-hoc emoji | Lucide React v1.21.0 confirmed on npm; icon name mapping verified from UI-SPEC; 32 replacement sites enumerated |
</phase_requirements>

---

## Summary

Phase 18 replaces all ad-hoc emoji and special characters used as UI chrome icons with named SVG icons from the `lucide-react` package. The replacement is cross-cutting — 32 icon sites across 14 component files — but is mechanically straightforward: install the package, import named icons per-file, swap each character for the corresponding `<LucideIcon className="w-4 h-4" aria-hidden="true" />` or `<LucideIcon className="w-5 h-5" aria-hidden="true" />`, and ensure buttons that lacked `aria-label` receive one.

The `SidebarGroup` component already declares `icon?: ReactNode` as its prop type — the prop signature change required in the UI-SPEC is already done. The call sites in `Sidebar.tsx` pass emoji strings today; those strings must become JSX elements (`<Search className="w-5 h-5" aria-hidden="true" />`).

The test impact is narrow: only `SessionRow.test.tsx` lines 85 and 101 use `getByText('✓')` to find the checkmark span. All other tests in affected files already use `getByRole('button', { name: ... })` patterns — they will continue to pass without changes. The `getByText('✓')` tests must be rewritten to query the containing `<span>` by a class predicate or by restructuring the assertion.

**Primary recommendation:** Plan two sequential tasks — (1) install package and replace all 32 icon sites, (2) fix the two broken `getByText('✓')` tests and add missing `aria-label` attributes where found.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Icon rendering | Browser / Client | — | SVG icons are rendered into React component output; no server tier |
| Icon import / tree-shaking | Build (Vite + CRXJS) | — | Named imports are statically analyzed at build time; no runtime overhead |
| Accessibility metadata | Browser / Client | — | `aria-hidden`, `aria-label` are DOM attributes set in component JSX |
| Test query migration | Test layer | — | RTL queries must reference stable ARIA roles; no production architecture change |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | 1.21.0 | SVG icon components for React | Official React binding for Lucide; tree-shakeable named exports; MIT; React 16.5–19 peer dep range |

`lucide-react` is confirmed on npm registry at v1.21.0 (published 2026-06-18). [VERIFIED: npm registry via `npm view lucide-react version`]

### Supporting

No additional packages required. Tailwind `w-4 h-4` / `w-5 h-5` utilities are already in the project content scanner.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `lucide-react` | `@heroicons/react` | heroicons has a different aesthetic; locked to `lucide-react` by D-01 |
| `lucide-react` | Inline SVG literals | More verbose, no design system consistency; rejected |

**Installation:**

```bash
npm install lucide-react
```

Add to `dependencies` (not `devDependencies`) — it is a runtime dep bundled into the extension.

**Version verification:** `npm view lucide-react version` returned `1.21.0` (published 2026-06-18). [VERIFIED: npm registry]

---

## Package Legitimacy Audit

> Package legitimacy gate was run via `gsd-tools query package-legitimacy check --ecosystem npm lucide-react`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `lucide-react` | npm | published 2026-06-18 (latest version; package itself is years old) | 87,299,279/wk | github.com/lucide-icons/lucide | SUS (too-new latest version) | Approved — see note |

**Legitimacy gate verdict: SUS (reason: `too-new`)** — the seam flagged the latest version (1.21.0, published 2026-06-18) as "too new." However:

1. The `lucide-react` package has 87M+ weekly downloads and a long-established source repo (`github.com/lucide-icons/lucide`).
2. This is a version freshness flag, not a slopsquat or suspicious actor signal.
3. No `postinstall` script is present (`npm view lucide-react scripts.postinstall` returned null).
4. The decision to use this package is a LOCKED decision (D-01 / STATE.md).

**Planner action:** The planner MUST NOT block on this SUS flag given the locked decision and 87M weekly download signal. The SUS flag is a version-freshness artifact on a well-established package. No additional `checkpoint:human-verify` task is required beyond what the locked decision already implies.

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious [SUS]:** `lucide-react` — approved as a locked decision; no checkpoint needed.

---

## Architecture Patterns

### System Architecture Diagram

```
Source components (14 files)
         │
         │  emoji / × / ✓ character in JSX
         │
         ▼
  Replace character
         │
         │  import { IconName } from 'lucide-react'
         │  <IconName className="w-N h-N" aria-hidden="true" />
         │
         ▼
  Vite + CRXJS bundler
         │
         │  tree-shakes: only imported named icons included in bundle
         │
         ▼
    Extension dist/
         │
         │  SVG paths inlined as React component output (no external SVG files)
         │
         ▼
    Chrome extension tab (React 19 renderer)
```

### Recommended Project Structure

No new directories. All icons are imported directly at each call site. No shared icon wrapper component (Claude's Discretion decision: do NOT create one per UI-SPEC).

```
src/
├── app/
│   └── App.tsx              # ☰ → Menu
├── components/
│   ├── ActionsGroup.tsx     # 🔄 🤖 ☀/🌙 ↕ ↔ 👁 📥 📤 🗑 → 9 icons
│   ├── QuestionCard.tsx     # 📝 × → Pencil X
│   ├── SearchGroup.tsx      # × → X
│   ├── SectionFilter.tsx    # 📋 → ClipboardList
│   ├── SectionRow.tsx       # × → X
│   ├── SessionRow.tsx       # ✓ ✎ ⧉ × → Check Pencil Copy X
│   ├── SessionSwitcherModal.tsx  # × → X
│   ├── Sidebar.tsx          # 🔍 🎯 📋 ⚡ icon props → JSX elements
│   ├── SidebarHeader.tsx    # ☰ 👤 → Menu User
│   ├── StorageToast.tsx     # × → X
│   ├── TopicMarkDisplay.tsx # × → X
│   ├── TopicRow.tsx         # × → X
│   ├── UndoToast.tsx        # × → X
│   └── UpdateBanner.tsx     # × → X
```

### Pattern 1: Direct Named Import at Call Site

**What:** Import only the icons used in that file, render with size and aria-hidden.

**When to use:** Every replacement site — no wrapper abstraction.

**Example:**

```tsx
// Source: lucide-react API (ASSUMED from training knowledge + npm registry confirmation)
// Inline icon inside a button — Inline tier (w-4 h-4)
import { X } from 'lucide-react';

<button type="button" aria-label="Dismiss" onClick={onDismiss} className="...">
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

```tsx
// Standalone action button — Action tier (w-5 h-5)
import { Menu } from 'lucide-react';

<button type="button" aria-label="Open sidebar" onClick={...} className="...">
  <Menu className="w-5 h-5" aria-hidden="true" />
</button>
```

### Pattern 2: SidebarGroup Icon Prop Migration

**What:** `Sidebar.tsx` passes `icon="🔍"` (string) to `SidebarGroup`. The `SidebarGroup` prop type is already `icon?: ReactNode` (verified in codebase). The call sites must change the string to a JSX element.

**When to use:** The four `<SidebarGroup>` call sites in `Sidebar.tsx` only.

**Example:**

```tsx
// Before (CURRENT in Sidebar.tsx)
<SidebarGroup
  groupId="search"
  label="Search"
  icon="🔍"
  ...
>

// After
import { Search } from 'lucide-react';

<SidebarGroup
  groupId="search"
  label="Search"
  icon={<Search className="w-5 h-5" aria-hidden="true" />}
  ...
>
```

`SidebarGroup` renders `{icon && <span aria-hidden="true">{icon}</span>}` — the wrapping `<span aria-hidden="true">` is already in place. No structural change to `SidebarGroup` needed. [VERIFIED: codebase grep — SidebarGroup.tsx line 31]

### Pattern 3: Conditional Icon (e.g., Sun/Moon toggle)

**What:** When a button's icon changes based on state, use a conditional JSX expression.

**Example:**

```tsx
// Before (ActionsGroup.tsx line 183)
{darkMode ? '☀' : '🌙'}

// After
import { Sun, Moon } from 'lucide-react';

{darkMode ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
```

### Pattern 4: `✓` Checkmark as Decorative Span

**What:** `SessionRow` uses `✓` inside a `<span aria-hidden="true">` to show active state — visibility toggled by `text-transparent` class. After replacement, the `<Check>` icon goes inside the same span.

**Example:**

```tsx
// Before
<span className={checkmarkClass} aria-hidden="true">
  ✓
</span>

// After
import { Check } from 'lucide-react';

<span className={checkmarkClass} aria-hidden="true">
  <Check className="w-4 h-4" />
</span>
```

Note: `aria-hidden="true"` is on the `<span>`, not on the `<Check>` SVG — do NOT also add it to the SVG, as the span already hides the whole subtree from assistive tech. This is a deviation from D-08 for this specific case only. [VERIFIED: codebase grep — SessionRow.tsx line 77]

### Anti-Patterns to Avoid

- **Namespace import:** `import * as Icons from 'lucide-react'` — defeats tree-shaking; every icon in the 1300+ icon library is bundled. Never use.
- **`aria-hidden` on span AND SVG:** When `<span aria-hidden="true">` wraps the icon, do NOT also set `aria-hidden="true"` on the SVG — redundant and can confuse some screen readers.
- **Color classes on the icon component:** Do NOT add `text-*` color classes to `<LucideIcon>` itself. Lucide icons use `currentColor` by default and inherit color from the parent button's text class. Adding color to the icon breaks existing hover/dark-mode color transitions on the parent.
- **`data-testid` on icon elements:** D-10 explicitly forbids this. Tests should use `getByRole('button', { name: ... })` targeting the button's existing `aria-label`.
- **`strokeWidth` override by default:** Only override if the specific icon looks visually wrong at the target size during implementation review.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG icon components | Custom SVG literals per icon | `lucide-react` named imports | 1300+ icons, consistent strokeWidth, React-optimized, tree-shakeable |
| Icon sizing convention | Custom CSS classes | `w-4 h-4` / `w-5 h-5` Tailwind | Already established in the project; D-06 locks it |
| Accessibility wrapping | Custom aria wrapper component | `aria-hidden="true"` directly on SVG + `aria-label` on parent `<button>` | Lucide SVGs are self-contained; no wrapper needed |

**Key insight:** `lucide-react` is a React component library — each icon is a `React.FC<LucideProps>`. The props include `className`, `size`, `strokeWidth`, `color`, and all standard SVG attributes. Callers should use `className` for size (Tailwind) and rely on `currentColor` for color inheritance.

---

## Complete Replacement Map (Authoritative)

Source of truth from `18-UI-SPEC.md` (verified against codebase grep):

| Char | File | Line (approx) | Lucide Icon | Size Tier |
|------|------|----------------|-------------|-----------|
| `☰` | `src/app/App.tsx` | 96 | `Menu` | `w-5 h-5` |
| `☰` | `src/components/SidebarHeader.tsx` | 79 | `Menu` | `w-5 h-5` |
| `👤` | `src/components/SidebarHeader.tsx` | 89 | `User` | `w-5 h-5` |
| `📝` | `src/components/QuestionCard.tsx` | 130 | `Pencil` | `w-4 h-4` |
| `×` | `src/components/QuestionCard.tsx` | 149 | `X` | `w-4 h-4` |
| `📋` | `src/components/SectionFilter.tsx` | 44 | `ClipboardList` | `w-4 h-4` |
| `🔍` | `src/components/Sidebar.tsx` | 38 (icon prop) | `Search` | `w-5 h-5` |
| `🎯` | `src/components/Sidebar.tsx` | 48 (icon prop) | `Target` | `w-5 h-5` |
| `📋` | `src/components/Sidebar.tsx` | 58 (icon prop) | `ClipboardList` | `w-5 h-5` |
| `⚡` | `src/components/Sidebar.tsx` | 68 (icon prop) | `Zap` | `w-5 h-5` |
| `🔄` | `src/components/ActionsGroup.tsx` | 163 | `RefreshCw` | `w-5 h-5` |
| `🤖` | `src/components/ActionsGroup.tsx` | 173 | `Bot` | `w-5 h-5` |
| `☀/🌙` | `src/components/ActionsGroup.tsx` | 183 | `Sun`/`Moon` | `w-5 h-5` |
| `↕` | `src/components/ActionsGroup.tsx` | 192 | `ChevronsUpDown` | `w-5 h-5` |
| `↔` | `src/components/ActionsGroup.tsx` | 201 | `ChevronsLeftRight` | `w-5 h-5` |
| `👁` | `src/components/ActionsGroup.tsx` | 211 | `Eye` | `w-5 h-5` |
| `📥` | `src/components/ActionsGroup.tsx` | 231 | `Download` | `w-5 h-5` |
| `📤` | `src/components/ActionsGroup.tsx` | 240 | `Upload` | `w-5 h-5` |
| `🗑` | `src/components/ActionsGroup.tsx` | 250 | `Trash2` | `w-5 h-5` |
| `✓` | `src/components/SessionRow.tsx` | 78 | `Check` | `w-4 h-4` |
| `✎` | `src/components/SessionRow.tsx` | 111 | `Pencil` | `w-4 h-4` |
| `⧉` | `src/components/SessionRow.tsx` | 119 | `Copy` | `w-4 h-4` |
| `×` | `src/components/SessionRow.tsx` | 128 | `X` | `w-4 h-4` |
| `×` | `src/components/SearchGroup.tsx` | 124 | `X` | `w-4 h-4` |
| `×` | `src/components/SectionRow.tsx` | 39 | `X` | `w-4 h-4` |
| `×` | `src/components/TopicRow.tsx` | 86 | `X` | `w-4 h-4` |
| `×` | `src/components/SessionSwitcherModal.tsx` | 100 | `X` | `w-4 h-4` |
| `×` | `src/components/StorageToast.tsx` | 30 | `X` | `w-4 h-4` |
| `×` | `src/components/UndoToast.tsx` | 36 | `X` | `w-4 h-4` |
| `×` | `src/components/UpdateBanner.tsx` | 123 | `X` | `w-4 h-4` |
| `×` | `src/components/TopicMarkDisplay.tsx` | 116 | `X` | `w-4 h-4` |
| `×` | `src/components/MigrationErrorBanner.tsx` | 40 | `X` | `w-4 h-4` |

**Total:** 32 replacement sites across 14 files. [VERIFIED: codebase grep on each file]

**Out of scope (data content, not UI chrome):**
- `src/data/bank/ai.ts:6` — `icon: '🤖'` is a section data field (user content)
- `AddSectionForm` default icon — user-authored content (D-05)

---

## Common Pitfalls

### Pitfall 1: Passing emoji string where `ReactNode` is expected (SidebarGroup)

**What goes wrong:** `Sidebar.tsx` currently passes `icon="🔍"` (string). This still renders correctly today because `SidebarGroup` renders `{icon}` inside a `<span>` — a string is valid ReactNode. After replacement, the string must become a JSX element or the icon won't render as an SVG.

**Why it happens:** The prop type is already `ReactNode` (verified in SidebarGroup.tsx), but the string form keeps working silently. TypeScript won't error on it.

**How to avoid:** Change the four `icon="..."` calls in `Sidebar.tsx` to JSX elements before testing.

**Warning signs:** The Tailwind `className` on the icon has no effect if passed as a string prop — if icons remain the same visual size as the emoji, the JSX transform didn't happen.

### Pitfall 2: `getByText('✓')` tests break after Check icon replacement

**What goes wrong:** `SessionRow.test.tsx` lines 85 and 101 use `screen.getByText('✓')` to find the checkmark span and assert its CSS classes. After replacing `✓` with `<Check className="w-4 h-4" />`, `getByText('✓')` finds nothing and the tests throw.

**Why it happens:** The checkmark is no longer a text node — it's an SVG element. `getByText` scans text content of DOM nodes, which the SVG doesn't have.

**How to avoid:** Rewrite the two failing assertions. The `<span>` element's class is what matters (checking `text-transparent` vs `text-blue-600`). Use `document.querySelector` with the span's known `aria-hidden="true"` attribute, or restructure to query the `<li>` element's class via its `id`:

```tsx
// Pattern A: query by id (already used in tests for the li element)
const li = document.getElementById('session-row-session-1');
const checkSpan = li?.querySelector('[aria-hidden="true"]');
expect(checkSpan?.className).toContain('text-blue-600');

// Pattern B: use container.querySelector
const { container } = render(<SessionRow ... />);
const checkSpan = container.querySelector('[aria-hidden="true"]');
```

**Warning signs:** Test runner reports `Unable to find an element with the text: ✓`.

### Pitfall 3: Icon `className` overrides vs. inheritance

**What goes wrong:** Adding `className="w-4 h-4 text-red-500"` on a Lucide icon when the parent button already applies `text-red-600` — the icon's class takes precedence over the parent's `currentColor`.

**Why it happens:** Lucide SVGs use `currentColor` for stroke. If `className` includes a `text-*` class, that sets the icon's own color and breaks hover/dark transitions on the parent button.

**How to avoid:** Only put sizing classes (`w-4 h-4` or `w-5 h-5`) in the icon's `className`. Let the parent button's text color cascade.

**Warning signs:** Icon doesn't change color on hover or in dark mode, even though the parent button class should trigger it.

### Pitfall 4: Missing `aria-label` on `×` dismiss buttons

**What goes wrong:** Some `×` dismiss buttons may lack `aria-label`. After replacing `×` with `<X />`, the button has no accessible name at all — screen readers announce "button" with no description.

**Why it happens:** Some components were written before the Phase 9 aria-label convention was established, or the `×` itself served as the accessible text.

**How to avoid:** For each `×` replacement site, verify the parent `<button>` has `aria-label` before replacing. If missing, add one. Pattern: `aria-label="Dismiss [context]"` (e.g., "Dismiss storage warning", "Close modal", "Dismiss error").

**Confirmed aria-label status (from codebase read):**
- `StorageToast.tsx:30` — has `aria-label="Dismiss storage warning"` ✓
- `UndoToast.tsx:36` — has `aria-label="Dismiss"` ✓
- `SessionSwitcherModal.tsx:100` — has `aria-label="Close sessions"` ✓
- `TopicMarkDisplay.tsx:116` — has `aria-label="Clear override mark for {topic.name}"` ✓
- `MigrationErrorBanner.tsx:40` — needs verification
- `UpdateBanner.tsx:123` — needs verification
- `SearchGroup.tsx:124` — needs verification
- `SectionRow.tsx:39` — has `aria-label="Remove section {label}"` ✓
- `TopicRow.tsx:86` — needs verification
- `QuestionCard.tsx:149` — needs verification (note button has aria-label "Toggle note for...")
- `SessionRow.tsx:128` — has `aria-label="Delete {session.name}"` ✓

### Pitfall 5: Lucide SVG `aria-hidden` placement with span wrapper

**What goes wrong:** SidebarGroup renders `<span aria-hidden="true">{icon}</span>`. If the executor also adds `aria-hidden="true"` to the `<LucideIcon>` inside, there are now two levels of `aria-hidden`. This is redundant (not harmful) but inconsistent.

**How to avoid:** For icons inside `<span aria-hidden="true">` (SidebarGroup, SectionFilter), do NOT add `aria-hidden="true"` to the icon itself — the span already does it. For icons directly inside buttons (all other cases), add `aria-hidden="true"` to the icon. D-08 applies to direct-in-button cases.

---

## Code Examples

Verified patterns from codebase:

### Inline icon in button (w-4 h-4 tier)

```tsx
// Source: based on existing button pattern in SearchGroup.tsx (confirmed by codebase read)
import { X } from 'lucide-react';

<button
  type="button"
  aria-label="Clear search"
  onClick={onClear}
  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

### Action button (w-5 h-5 tier)

```tsx
// Source: based on existing btnBase pattern in ActionsGroup.tsx (confirmed by codebase read)
import { Download } from 'lucide-react';

<button
  type="button"
  aria-label="Import YAML"
  onClick={handleOpenImportYaml}
  className={btnBase}
>
  <Download className="w-5 h-5" aria-hidden="true" />
</button>
```

### SidebarGroup icon prop (ReactNode)

```tsx
// Source: SidebarGroup.tsx interface (confirmed by codebase read)
import { Search } from 'lucide-react';

<SidebarGroup
  groupId="search"
  label="Search"
  icon={<Search className="w-5 h-5" aria-hidden="true" />}
  isOpen={groupOpen.search ?? true}
  onToggle={() => toggleGroup('search')}
>
  <SearchGroup />
</SidebarGroup>
```

### Conditional icon (dark mode toggle)

```tsx
// Source: based on existing conditional render in ActionsGroup.tsx (confirmed by codebase read)
import { Sun, Moon } from 'lucide-react';

<button
  type="button"
  aria-label={darkMode ? 'Light mode' : 'Dark mode'}
  aria-pressed={darkMode}
  onClick={() => setDarkMode(!darkMode)}
  className={darkMode ? btnActive : btnBase}
>
  {darkMode
    ? <Sun className="w-5 h-5" aria-hidden="true" />
    : <Moon className="w-5 h-5" aria-hidden="true" />}
</button>
```

### SessionRow checkmark (decorative span pattern)

```tsx
// Source: SessionRow.tsx line 77 (confirmed by codebase read)
import { Check } from 'lucide-react';

<span className={checkmarkClass} aria-hidden="true">
  <Check className="w-4 h-4" />
</span>
// NOTE: do NOT add aria-hidden="true" to <Check> — the span already hides it
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Emoji as button labels | SVG icon library (Lucide) | This phase | Consistent sizing, color inheritance, no font emoji rendering variance |
| String icons in icon prop | ReactNode icons in icon prop | This phase | SidebarGroup already accepts ReactNode; call sites change only |

**Deprecated/outdated:**
- Emoji as UI chrome icons: replaced by Lucide. Emoji still valid for user-authored content (out of scope).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Lucide icon names `Target`, `Zap`, `ChevronsUpDown`, `ChevronsLeftRight`, `RefreshCw`, `Bot`, `Copy`, `User`, `ClipboardList` exist in lucide-react v1.21.0 | Replacement Map | If a name doesn't exist, TypeScript build fails — caught immediately |
| A2 | `lucide-react` SVG components accept `className` prop for Tailwind sizing | Code Examples | If they don't, sizing would require `size` prop (numeric pixels) instead — easy fix |
| A3 | `MigrationErrorBanner.tsx`, `UpdateBanner.tsx`, `SearchGroup.tsx`, `TopicRow.tsx`, `QuestionCard.tsx` delete buttons already have `aria-label` attributes | Pitfall 4 | If missing, test migration would also need aria-label additions; low risk given Phase 9 established pattern |

**If this table is empty:** Not empty — A1, A2, A3 require implementation-time confirmation.

---

## Open Questions

1. **`MigrationErrorBanner.tsx` line 40 `×` button — aria-label present?**
   - What we know: not confirmed by codebase read in this research session
   - What's unclear: whether the button has an existing `aria-label`
   - Recommendation: check during implementation; add `aria-label="Dismiss migration error"` if missing

2. **`UpdateBanner.tsx` line 123 `×` button — aria-label present?**
   - What we know: the banner has aria-label context on its container
   - What's unclear: whether the specific `×` dismiss button carries one
   - Recommendation: check during implementation; add `aria-label="Dismiss update notification"` if missing

3. **Test count after icon migration**
   - What we know: current test suite is 2693 tests across 168 test files; 2 tests in `SessionRow.test.tsx` will break on `getByText('✓')` (lines 85, 101)
   - What's unclear: whether any other test file queries emoji/special chars we haven't found
   - Recommendation: run `npm test` immediately after the icon replacement wave and before the test-fix wave to confirm the exact list of failures

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Package install | ✓ | (project is running) | — |
| `lucide-react` on npm | Icon components | ✓ | 1.21.0 | — |
| Vite + CRXJS | SVG bundling from lucide-react | ✓ | vite ^8.0.16 + crxjs ^2.6.1 | — |
| TypeScript | Type-check icon imports | ✓ | ~6.0 | — |

**Missing dependencies with no fallback:** none

**CRXJS / Vite note:** `lucide-react` ships pre-compiled React components (not raw SVG files). No additional Vite SVG plugin is needed — Vite handles the module import naturally. [ASSUMED — based on how lucide-react packages its output]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-03 | Emoji chars no longer render as button text content in UI chrome | unit | `npm test` | ✅ (existing tests cover button rendering) |
| VIS-03 | `×` buttons all have accessible names via `aria-label` | unit | `npm test` | ✅ (aria-label queries already in tests) |
| VIS-03 | Existing 2693 tests continue to pass | unit | `npm test` | ✅ |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. The two `getByText('✓')` tests in `SessionRow.test.tsx` must be rewritten (they are existing tests, not new test gaps — this is task work, not Wave 0 scaffolding).

---

## Security Domain

`security_enforcement: true` in `.planning/config.json`. ASVS Level 1.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Icons are not user input; no dynamic icon selection |
| V6 Cryptography | no | — |

### Known Threat Patterns for icon library migration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply chain via npm package | Tampering | Package is 87M/wk downloads, MIT, source at lucide-icons/lucide — low risk; no postinstall script |
| XSS via icon prop | Tampering | Icon prop type is `ReactNode` rendered via JSX — React escapes all dynamic values; no `dangerouslySetInnerHTML` used |

**Security verdict:** No ASVS controls applicable. No new attack surface introduced — lucide-react renders pre-defined SVG paths, not user-controlled SVG markup.

---

## Sources

### Primary (MEDIUM confidence)

- Codebase grep + direct file reads — all 14 component files verified; emoji locations confirmed [VERIFIED: grep]
- `npm view lucide-react version` — 1.21.0 confirmed [VERIFIED: npm registry]
- `npm view lucide-react peerDependencies` — React 19 confirmed as peer dep [VERIFIED: npm registry]
- `gsd-tools query package-legitimacy check` — SUS verdict (too-new version) documented [VERIFIED: seam]

### Secondary (MEDIUM confidence)

- `18-CONTEXT.md`, `18-UI-SPEC.md` — locked decisions and icon mapping [CITED: .planning/phases/18-icon-library/18-CONTEXT.md]
- `SidebarGroup.tsx` — `icon?: ReactNode` prop type already in place [VERIFIED: codebase]
- `SessionRow.test.tsx` — two `getByText('✓')` tests confirmed that will break [VERIFIED: codebase]

### Tertiary (LOW confidence)

- Lucide React API details (className prop, currentColor, strokeWidth default of 1.5) — [ASSUMED] from training knowledge; icon name existence in v1.21.0 not individually verified via Context7

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — lucide-react confirmed on npm, version verified, peer deps checked
- Architecture: HIGH — all 14 component files read directly; replacement map sourced from UI-SPEC and codebase grep
- Pitfalls: HIGH — two test files confirmed to have breaking emoji text queries; aria-label coverage spot-checked
- Icon name mapping: MEDIUM — icon names from UI-SPEC (human-researched during discuss phase); specific names not individually queried against lucide v1.21.0 docs (TypeScript build will catch any mismatch immediately)

**Research date:** 2026-06-19
**Valid until:** 2026-07-19 (lucide-react is stable; icon API doesn't change between minor versions)
