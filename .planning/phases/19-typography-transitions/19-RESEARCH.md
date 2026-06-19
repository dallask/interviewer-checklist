# Phase 19: Typography & Transitions - Research

**Researched:** 2026-06-19
**Domain:** Tailwind v4 typography, CSS transitions, `@starting-style`, `grid-template-rows` animation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Font replacement scope:** Replace `text-sm` → `text-[13px]` for body text. Keep `text-base` on section/group headers. Leave `text-xs` (12px) accents unchanged. D-06 compliance: static class literals only (no template string construction). Files affected: SidebarGroup, SidebarHeader, SidebarFooter, SectionFilter, SectionRow, TopicRow, QuestionCard, SessionRow, SessionSwitcherModal, SearchGroup, ActionsGroup, DifficultyFilter, ContentTree add-forms.
- **D-02 — Padding / density reduction:** Tighten vertical padding per table below without dropping below `min-h-[44px]` touch targets.
  - SectionRow toggle button: `py-3` → `py-2`
  - SectionRow delete button: `py-3` → `py-2`
  - TopicRow toggle button: `py-2` → `py-1.5`
  - TopicRow delete button: `py-2` → `py-1.5`
  - SectionFilter buttons: `py-2` → `py-1.5`
  - SidebarGroup content: `pb-3` → `pb-2`
  - ContentTree add-section/topic buttons: `py-2` → `py-1.5`
- **D-03 — SidebarGroup expand/collapse animation:** `grid-template-rows: 0fr → 1fr` transition. Remove `hidden` attribute. Use `motion-safe:transition-[grid-template-rows] motion-safe:duration-200`.
- **D-04 — Note textarea toggle animation (QuestionCard + TopicRow):** Same `grid-template-rows` technique as D-03. Remove `hidden` conditional. Keep `print:h-auto print:overflow-visible print:resize-none` on textarea.
- **D-05 — Content-tree row fade-in animation:** `@keyframes fade-in` in `src/app/styles.css`. Class `motion-safe:animate-[fade-in_150ms_ease-out]` on outermost div of SectionRow, TopicRow, QuestionCard. No exit animation.
- **D-06 — Modal open/close animation:** CSS `@starting-style` + `transition` on `<dialog>` elements in `src/app/styles.css`. Chrome 117+ guaranteed. No JS changes needed.
- **D-07 — motion-safe convention:** All Phase 19 transitions use `motion-safe:` prefix. Do not retroactively change `motion-reduce:transition-none` on Sidebar.tsx or SidebarGroup chevron.
- **D-08 — Tailwind compliance:** All new Tailwind classes must be static string literals. Dynamic `grid-template-rows` values via inline `style` prop is acceptable.

### Claude's Discretion

None specified.

### Deferred Ideas (OUT OF SCOPE)

- Sidebar open/close transition — already implemented (`transition-transform duration-200 ease-in-out` in Sidebar.tsx)
- Changing `motion-reduce:transition-none` on existing Sidebar.tsx / SidebarGroup chevron
- Animating dialog close (handled by `display allow-discrete` in D-06 CSS)
- Any font changes beyond `text-sm` → `text-[13px]`
- Welcome.tsx typography changes
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POL-02 | Base font size is 13px and key spacing is tightened for a more compact layout throughout the sidebar and content tree | D-01 text-sm replacement (65 instances across 20 component files confirmed by grep); D-02 padding tightening (7 specific locations confirmed by grep) |
| POL-03 | Key interactions (sidebar open/close, topic/section expand/collapse, modal open/close, note toggle) have CSS transitions or animations for a smooth feel | D-03 SidebarGroup grid-rows; D-04 textarea grid-rows; D-05 fade-in keyframe; D-06 dialog @starting-style; sidebar already done |
</phase_requirements>

---

## Summary

Phase 19 is a pure visual-polish phase: no new features, no new packages, no data model changes. It consists of two categories of change — (1) global font-size reduction from `text-sm` (14px) to `text-[13px]` across 65 instances in 20 component files, and (2) CSS transitions for four interaction patterns (sidebar group expand/collapse, textarea note toggle, row mount fade-in, and dialog open).

All decisions are locked in CONTEXT.md. Research confirms the decisions are technically sound: `grid-template-rows: 0fr → 1fr` is the correct CSS-only accordion pattern; `@starting-style` is supported in Chrome 117+ (guaranteed for Chrome Extension target); and the `motion-safe:animate-[...]` arbitrary-value pattern already exists in UndoToast and can be extended identically.

The primary planning risk is test breakage. Two test files assert against implementation details that will change: `SidebarGroup.test.tsx` has `expect(region).toHaveAttribute('hidden')` (line 67) which will fail after D-03 removes the `hidden` attribute, and `QuestionCard.test.tsx` has `expect(textarea.className).toContain('hidden')` (line 182) which tests the className-based toggle that D-04 replaces with a grid-rows wrapper. Both tests must be updated as part of the same task that modifies the component.

**Primary recommendation:** Split into three focused plans: (1) font/density changes (D-01 + D-02), (2) textarea and group animations with test updates (D-03 + D-04), (3) fade-in and modal animations (D-05 + D-06). This keeps each plan's test-risk scope narrow.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Font-size replacement (`text-sm` → `text-[13px]`) | Browser / Client (component JSX) | — | Class names live in TSX component files; no server involvement |
| Padding density reduction | Browser / Client (component JSX) | — | Inline Tailwind classes in component files |
| SidebarGroup grid-row transition | Browser / Client (component JSX) | CSS (`src/app/styles.css` not needed — inline style prop) | State-driven `style` prop on existing div |
| Textarea note toggle animation | Browser / Client (component JSX) | — | Wrapping div + inline style prop — no CSS file change |
| Row mount fade-in | CSS (`src/app/styles.css`) + Browser / Client | — | Keyframe must be global; class applied in TSX |
| Modal open animation | CSS (`src/app/styles.css`) | — | `@starting-style` rule targets `dialog` element globally; no JS change |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v4 | ^4.3.1 | Utility-class framework (installed) | Already in project; `text-[13px]` arbitrary value and `motion-safe:` variant are native v4 features |
| React 19 | ^19.2.7 | Component rendering (installed) | Project stack |
| Vitest | ^4.1.9 | Test runner (installed) | Project test framework |

No new packages are required for Phase 19. [ASSUMED based on CONTEXT.md scope — confirmed by codebase inspection: no import needed for CSS transitions or @starting-style]

### Supporting
None — pure CSS and Tailwind utility class changes.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `grid-template-rows: 0fr → 1fr` | `max-height` transition | max-height requires a hard-coded max value that may clip content; grid-rows animates to actual content height. D-03 is locked. |
| `@starting-style` dialog animation | JS-controlled class toggling | JS approach requires modifying showModal/close call sites; @starting-style is zero-JS per D-06. |
| `motion-safe:` prefix | `motion-reduce:` prefix (opt-out) | opt-out is pre-existing pattern in Sidebar.tsx; D-07 locks opt-in for all new Phase 19 work |

**Installation:** No new packages. Zero npm installs required.

---

## Package Legitimacy Audit

No external packages are installed in this phase.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
TSX Component Files (src/components/)
    │
    ├── text-sm class literals          →  Replace: text-[13px]   (D-01)
    ├── py-3 / py-2 padding literals    →  Reduce per D-02 table  (D-02)
    ├── hidden attr on SidebarGroup     →  Remove + add grid div   (D-03)
    ├── hidden class on QCard textarea  →  Remove + wrap grid div  (D-04)
    └── outermost div of SectionRow     →  Add fade-in class       (D-05)
         TopicRow, QuestionCard

src/app/styles.css (global CSS)
    ├── @keyframes slide-up (existing)
    ├── @keyframes fade-in  (ADD — D-05)
    └── dialog { ... }      (ADD — D-06)
         @starting-style { dialog[open] { ... } }
         @media (prefers-reduced-motion: reduce) { dialog { transition: none } }

Test Files (src/components/*.test.tsx)
    ├── SidebarGroup.test.tsx line 67   →  Update: hidden → no-hidden assertion (D-03)
    └── QuestionCard.test.tsx line 182  →  Update: grid-wrapper assertion (D-04)
```

### Recommended Project Structure
No structural changes. All edits are in-place on existing files.

```
src/
├── app/
│   └── styles.css        # ADD @keyframes fade-in + dialog @starting-style
└── components/
    ├── SidebarGroup.tsx   # D-03: grid-rows wrapper replaces hidden attr
    ├── QuestionCard.tsx   # D-01 text-sm, D-04 grid-rows textarea wrapper
    ├── TopicRow.tsx       # D-01 text-sm, D-02 padding, D-04 grid-rows textarea
    ├── SectionRow.tsx     # D-01 text-sm, D-02 padding, D-05 fade-in
    ├── SectionFilter.tsx  # D-01 text-sm, D-02 padding
    ├── ContentTree.tsx    # D-01 text-sm, D-02 padding
    ├── ActionsGroup.tsx   # D-01 text-sm
    ├── SessionRow.tsx     # D-01 text-sm
    ├── CandidateModal.tsx # D-01 text-sm (11 instances — largest single file)
    ├── ImportPreviewModal.tsx  # D-01 text-sm
    ├── AiPromptModal.tsx       # D-01 text-sm
    ├── AddTopicForm.tsx        # D-01 text-sm
    ├── AddSectionForm.tsx      # D-01 text-sm
    ├── AboutModal.tsx          # D-01 text-sm
    ├── CustomQuestionForm.tsx  # D-01 text-sm
    ├── ResetConfirmDialog.tsx  # D-01 text-sm
    ├── DeleteSessionConfirmDialog.tsx # D-01 text-sm
    ├── DifficultyFilter.tsx    # D-01 text-sm
    ├── SearchGroup.tsx         # D-01 text-sm
    └── StorageToast.tsx        # D-01 text-sm
```

### Pattern 1: `grid-template-rows` Accordion (D-03 / D-04)

**What:** Transition a collapsible region by animating `grid-template-rows` between `0fr` (collapsed) and `1fr` (expanded). The outer grid container manages height; an inner `min-h-0` div allows the content to shrink below its natural height.

**When to use:** Whenever a region needs to animate open/close without knowing its content height at authoring time.

**Example (SidebarGroup — D-03):**
```tsx
// Source: CONTEXT.md D-03 (locked pattern)
<div
  id={regionId}
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
>
  <div className="min-h-0 px-4 pb-2">
    {children}
  </div>
</div>
```
The outer div needs `display: grid` (`grid` class) to enable `grid-template-rows`. The `overflow-hidden` clips content during animation. The `min-h-0` on the inner div is required — without it the inner div has an implicit `min-height: auto` that prevents collapsing below its content height.

**Example (Textarea toggle — D-04):**
```tsx
// Source: CONTEXT.md D-04 (locked pattern)
<div
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: notesOpen ? '1fr' : '0fr' }}
>
  <div className="min-h-0">
    <textarea
      {/* keep: print:h-auto print:overflow-visible print:resize-none */}
    />
  </div>
</div>
```

### Pattern 2: CSS `@starting-style` for Modal Entry (D-06)

**What:** Native CSS (no JS) animation for the first render of a `<dialog>` opened with `showModal()`. `@starting-style` sets the initial style values before the browser applies the `open` attribute, allowing a transition to run on first paint.

**When to use:** Animating dialog/popover open in Chrome 117+ targets. No JS changes needed.

**Example:**
```css
/* Source: CONTEXT.md D-06 (locked CSS) — add to src/app/styles.css */
dialog {
  opacity: 1;
  scale: 1;
  transition: opacity 150ms ease-out, scale 150ms ease-out,
              display 150ms allow-discrete, overlay 150ms allow-discrete;
}

@starting-style {
  dialog[open] {
    opacity: 0;
    scale: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog {
    transition: none;
  }
}
```
`allow-discrete` in the transition value is required to animate the discrete `display` and `overlay` properties (they normally can't be transitioned).

### Pattern 3: Keyframe Animation via Tailwind Arbitrary Value (D-05)

**What:** Define a `@keyframes` block in global CSS, then apply it via Tailwind's arbitrary animation syntax `animate-[name_duration_easing]`.

**When to use:** One-shot enter animations on DOM-mounted elements. Already used by UndoToast (`animate-[slide-up_150ms_ease-out]`).

**Example:**
```css
/* Add to src/app/styles.css */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```
```tsx
// Applied to outermost div of SectionRow, TopicRow, QuestionCard
<div className="... motion-safe:animate-[fade-in_150ms_ease-out]">
```

### Anti-Patterns to Avoid

- **`hidden` attribute on animated regions:** The HTML `hidden` attribute sets `display: none`, which makes the element invisible to CSS transitions — the browser skips the animation entirely. Remove `hidden` from the SidebarGroup region div and replace with `grid-template-rows: 0fr` control. [ASSUMED — well-known CSS behavior]
- **`max-height` accordion:** Hard-coding a `max-height` value for height animation causes jumpy easing because the easing curve applies to the max-height range (e.g., 0 → 1000px), not the actual content height. Use `grid-template-rows` instead.
- **Dynamic Tailwind class construction:** D-06 (project rule) forbids template-string class construction. The `gridTemplateRows` value belongs in an inline `style` prop, not a Tailwind class, because its value is runtime-dynamic (`isOpen ? '1fr' : '0fr'`). This is explicitly sanctioned in D-08.
- **Applying `motion-safe:` retroactively to existing patterns:** D-07 locks that Sidebar.tsx and SidebarGroup chevron keep their existing `motion-reduce:transition-none` pattern. Do not convert them to the `motion-safe:` variant — this is a risk-mitigation decision.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Height animation for unknown-height regions | Custom JS measuring element.offsetHeight + setting max-height | `grid-template-rows: 0fr → 1fr` CSS | CSS approach is declarative, no JS, handles dynamic content height automatically |
| Modal enter animation | JS class toggling on showModal/close | `@starting-style` + `transition` | Zero JS changes; works natively with `<dialog>` open/close |
| Reduced-motion detection | JS `window.matchMedia('prefers-reduced-motion')` | `motion-safe:` Tailwind prefix + `@media (prefers-reduced-motion: reduce)` | Declarative CSS; no JS runtime overhead |

**Key insight:** Every animation in this phase is implemented in CSS only. No new event handlers, no new state, no new effects. The only JS-adjacent change is `style={{ gridTemplateRows: ... }}` which reads existing React state — no new state is introduced.

---

## Runtime State Inventory

> SKIPPED — This is a greenfield visual-polish phase. No renames, no data migrations, no stored state changes.

---

## Common Pitfalls

### Pitfall 1: `hidden` Attribute Prevents CSS Animation

**What goes wrong:** After removing `hidden` from SidebarGroup's region div and adding the grid-rows transition, the component appears to always show its content (never collapses).

**Why it happens:** The `grid-template-rows: 0fr` only works if the outer element is `display: grid`. If `hidden` is left in place, `display: none` overrides grid and prevents animation. If the `grid` class is missing from the outer div, `grid-template-rows` has no effect.

**How to avoid:** The outer div must have class `grid` (sets `display: grid`) AND the `hidden` attribute must be removed. Add `overflow-hidden` to clip content during animation. The inner wrapper must have `min-h-0`.

**Warning signs:** Content visible at all times (forgot to remove `hidden`), or no animation plays (missing `grid` class or `min-h-0`).

---

### Pitfall 2: SidebarGroup Test Assertion on `hidden` Attribute Will Fail

**What goes wrong:** After D-03 removes `hidden` from the SidebarGroup region div, `SidebarGroup.test.tsx` line 67 (`expect(region).toHaveAttribute('hidden')`) will throw a test failure.

**Why it happens:** The test was written to verify the pre-D-03 implementation where `hidden={!isOpen}` was a React prop on the region div. The implementation is changing; the test must change with it.

**How to avoid:** In the same task that modifies SidebarGroup.tsx (D-03), update the test. The replacement assertion should verify that collapsed content is still in the DOM (for `aria-controls`) but not visible. With grid-rows: `expect(region).not.toHaveAttribute('hidden')` and verify `region.style.gridTemplateRows` equals `'0fr'` when collapsed.

**Warning signs:** Test suite failure on `SidebarGroup.test.tsx` line 67 immediately after D-03 implementation.

---

### Pitfall 3: QuestionCard Test Assertion on `hidden` className Will Fail

**What goes wrong:** After D-04 wraps the QuestionCard textarea in a grid-rows container, `QuestionCard.test.tsx` line 182 (`expect(textarea.className).toContain('hidden')`) and line 187 (`expect(textarea.className).not.toContain('hidden')`) will both fail because the textarea no longer uses the `hidden` class — the outer wrapper handles visibility.

**Why it happens:** The existing test targeted the className-toggle approach (`${!notesOpen && !printMode ? ' hidden' : ''}` in the textarea's className). D-04 moves visibility control to the wrapper div's `gridTemplateRows` style, so the textarea className no longer includes `hidden`.

**How to avoid:** Update the test in the same task as D-04 implementation. The new assertion should check the wrapper div's style or verify the textarea is rendered but the wrapper has `gridTemplateRows: '0fr'` when closed.

**Warning signs:** QuestionCard note-toggle test failure immediately after D-04 implementation.

---

### Pitfall 4: `motion-safe:transition-[grid-template-rows]` Is a Tailwind v4 Arbitrary Transition

**What goes wrong:** The class `motion-safe:transition-[grid-template-rows]` doesn't compile or has no effect.

**Why it happens:** Tailwind v4 supports arbitrary transition-property values via `transition-[value]` syntax. However, the variant prefix `motion-safe:` must precede the full class name. Confusion with v3 `motion-safe` syntax or forgetting that `transition-[grid-template-rows]` also requires a `duration-*` class to set duration.

**How to avoid:** Always pair `motion-safe:transition-[grid-template-rows]` with `motion-safe:duration-200`. The `motion-safe:` prefix applies to each utility individually.

**Warning signs:** No animation plays even with the grid class in place. Check DevTools — if `transition-property: none` on the element, the prefix or duration is missing.

---

### Pitfall 5: SectionRow Does Not Have `min-h-[44px]` Touch Target Enforced Via Class

**What goes wrong:** The D-02 padding reduction on SectionRow toggle/delete buttons from `py-3` to `py-2` drops the button height below 44px on small text lines.

**Why it happens:** SectionRow's toggle button (`flex-1 flex items-center justify-between px-4 py-3`) does not currently have `min-h-[44px]` in its class list (confirmed by grep). The 44px minimum was maintained via `py-3` providing sufficient height. Reducing to `py-2` reduces padding but the button naturally stretches because it's `flex-1` inside a flex container that also gets its height from the flex parent.

**How to avoid:** After changing `py-3` → `py-2` on SectionRow, verify the rendered button height in DevTools. If it drops below 44px, add `min-h-[44px]` to the button className. QuestionCard already has `min-h-[44px]` on its interactive buttons — use that as the model. TopicRow has `min-h-[44px]` on its interactive buttons at line 82 and 129.

**Warning signs:** Rendered button height below 44px in DevTools after padding change.

---

### Pitfall 6: `@starting-style` + `allow-discrete` Requires Exact CSS Property Names

**What goes wrong:** The modal fade-in animation plays but close animation doesn't work, or no animation plays at all.

**Why it happens:** The `display` and `overlay` properties require `allow-discrete` in the transition value to be animated. `overlay` is a browser-internal property controlling the top-layer stacking. Missing either keyword means the dialog snaps instead of fades.

**How to avoid:** Use the exact CSS from D-06 verbatim. The `@media (prefers-reduced-motion: reduce)` block sets `transition: none` — this overrides the `motion-safe` approach used elsewhere (dialog is handled in global CSS, not in TSX, so `motion-safe:` prefix is not applicable here).

**Warning signs:** Dialog snaps open with no animation. Chrome DevTools Animations panel shows no animation for the dialog element.

---

## Code Examples

### Current SidebarGroup Structure (to be replaced by D-03)
```tsx
// CURRENT: hidden attr prevents CSS animation
<div
  id={regionId}
  hidden={!isOpen}
  className="px-4 pb-3"
>
  {children}
</div>
```

### D-03 Replacement
```tsx
// Source: CONTEXT.md D-03 (locked)
<div
  id={regionId}
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
>
  <div className="min-h-0 px-4 pb-2">
    {children}
  </div>
</div>
```

### Current QuestionCard Textarea (to be replaced by D-04)
```tsx
// CURRENT: hidden class on textarea
<div className={hideNotes && !printMode ? 'hidden' : ''}>
  <textarea
    className={`... ${!notesOpen && !printMode ? ' hidden' : ''}`}
  />
</div>
```

### D-04 Replacement
```tsx
// Source: CONTEXT.md D-04 (locked)
<div
  className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 overflow-hidden"
  style={{ gridTemplateRows: notesOpen ? '1fr' : '0fr' }}
>
  <div className="min-h-0">
    <textarea
      className="w-full resize-y min-h-[64px] text-[13px] font-normal ... print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
    />
  </div>
</div>
```
Note: The outer `div className={hideNotes && !printMode ? 'hidden' : ''}` wrapper in QuestionCard controls whether the entire notes region (button + textarea) shows. This wrapper is separate from the D-04 grid-rows wrapper and must be preserved.

### Global CSS Additions (src/app/styles.css)
```css
/* Source: CONTEXT.md D-05 + D-06 (locked) */

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

dialog {
  opacity: 1;
  scale: 1;
  transition: opacity 150ms ease-out, scale 150ms ease-out,
              display 150ms allow-discrete, overlay 150ms allow-discrete;
}

@starting-style {
  dialog[open] {
    opacity: 0;
    scale: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog {
    transition: none;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `max-height` animation for accordions | `grid-template-rows: 0fr → 1fr` | ~2022 (CSS Grid widely supported) | No hard-coded max value; easing matches actual content height |
| JS-driven modal open animation | `@starting-style` + `transition` | Chrome 117 (Sep 2023), FF 129 (Aug 2024) | Zero JS; declarative; Chrome Extension target guarantees support |
| `motion-reduce:` opt-out | `motion-safe:` opt-in | Both are long-standing | Opt-in is safer; users who want no motion don't need to declare it |

**Deprecated/outdated:**
- `hidden` attribute for animated collapsibles: Still valid for static hide/show but incompatible with CSS transitions. Do not use where animation is desired.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No new packages required for Phase 19 | Standard Stack | If a polyfill is needed for `@starting-style`, an install task would be missing. Confirmed not needed: Chrome Extension guarantees Chrome 117+. |
| A2 | `min-h-[44px]` touch target maintained by flex stretch on SectionRow even after `py-3` → `py-2` | Common Pitfalls #5 | Touch target may drop below 44px; mitigation: add `min-h-[44px]` to the button class if verified below 44px in DevTools |
| A3 | TopicRow `hidden={!topicNotesOpen && !localTopicNote && !printMode}` (HTML `hidden` attribute on textarea, line 111) will also need updating under D-04 | Architecture | If the plan doesn't include TopicRow's `hidden` attribute removal, the animation won't work there |

---

## Open Questions

1. **QuestionCard outer `hideNotes` wrapper and D-04 interaction**
   - What we know: QuestionCard has two layers — an outer `div` with `className={hideNotes && !printMode ? 'hidden' : ''}` controlling the entire notes section visibility, and the textarea's own className toggle (`!notesOpen && !printMode ? ' hidden' : ''`). D-04 wraps the textarea in a grid-rows div to animate the open/close.
   - What's unclear: The outer `hideNotes` wrapper uses the `hidden` class, not the `hidden` HTML attribute — so it doesn't need to become a grid-rows transition. Only the inner textarea toggle needs D-04 treatment.
   - Recommendation: Keep the outer `hideNotes` wrapper as-is (it's a static show/hide for a notes-disabled mode, not an animated toggle). Apply D-04 grid-rows only to the inner `notesOpen` toggle layer.

2. **SidebarGroup test update specifics**
   - What we know: Test at line 52-68 asserts `expect(region).toHaveAttribute('hidden')`. After D-03, `hidden` is removed.
   - What's unclear: What the replacement assertion should be — the test title says "hidden attribute when isOpen=false (aria-controls always resolves)" which was testing a specific WR-02 fix.
   - Recommendation: Replace the `toHaveAttribute('hidden')` assertion with a check that `region` is still in the DOM (for aria-controls to resolve) AND that `region.style.gridTemplateRows === '0fr'` when isOpen=false. This preserves the intent (aria-controls resolves) while testing the new implementation.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Build/test | ✓ | (project running) | — |
| Tailwind CSS v4 | `text-[13px]`, `motion-safe:` | ✓ | ^4.3.1 | — |
| Vitest | Test suite | ✓ | ^4.1.9 | — |
| Chrome 117+ | `@starting-style` support | ✓ | guaranteed (Chrome Extension) | — |

No missing dependencies. All capabilities needed are available.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

Current test count: **2693 tests across 168 test files** (verified by running `npx vitest run`).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POL-02 | `text-sm` → `text-[13px]` applied in all 20 component files | unit (className assertion) | `npx vitest run --reporter=verbose src/components/` | Existing test files cover components; font class tests not pre-existing — Wave 0 gap |
| POL-02 | Padding reductions (D-02) do not violate `min-h-[44px]` touch targets | manual visual check | manual | — |
| POL-03 | SidebarGroup grid-rows transition renders — no `hidden` attr when isOpen=false | unit (style/class assertion) | `npx vitest run src/components/SidebarGroup.test.tsx` | ✅ exists — test MUST be updated |
| POL-03 | QuestionCard textarea wrapped in grid div when note toggled | unit (className/structure assertion) | `npx vitest run src/components/QuestionCard.test.tsx` | ✅ exists — test MUST be updated |
| POL-03 | TopicRow textarea uses grid-rows wrapper (D-04) | unit (aria-expanded + structure) | `npx vitest run src/components/TopicRow.test.tsx` | ✅ exists |
| POL-03 | Fade-in keyframe defined in styles.css | manual/visual | n/a | — |
| POL-03 | Dialog `@starting-style` renders without JS error | manual visual | n/a | — |

### Sampling Rate
- **Per task commit:** `npx vitest run` (full suite — fast at 5.74s)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- SidebarGroup.test.tsx assertion on `hidden` attribute (line 67) **must be updated in the same task as D-03** — cannot wait for a later task.
- QuestionCard.test.tsx assertions on `hidden` className (lines 182, 187) **must be updated in the same task as D-04**.
- No new test files need to be created — existing component tests cover the changed behaviors once updated.

---

## Security Domain

> `security_enforcement: true` in config.json. ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Phase 19 adds no new inputs; textarea values flow through existing store handlers unchanged |
| V6 Cryptography | no | — |

**Security assessment:** Phase 19 is purely presentational (CSS classes, transitions, font sizes). No user input paths are added or modified. No data flows change. No new API calls. No new package installs. Security domain is not applicable to this phase's changes.

---

## Sources

### Primary (HIGH confidence)
- CONTEXT.md D-01 through D-08 — locked decisions with implementation patterns
- `src/components/` grep audit — confirmed 65 `text-sm` instances in 20 files [VERIFIED: codebase grep]
- `src/app/styles.css` — confirmed existing `@keyframes slide-up` pattern for D-05 analogy [VERIFIED: codebase read]
- `SidebarGroup.tsx` — confirmed `hidden={!isOpen}` at line 42, `pb-3` at line 43 [VERIFIED: codebase read]
- `SidebarGroup.test.tsx` line 67 — confirmed `toHaveAttribute('hidden')` assertion breaking change [VERIFIED: codebase read]
- `QuestionCard.test.tsx` lines 182/187 — confirmed `hidden` className assertion breaking change [VERIFIED: codebase read]
- `TopicRow.tsx` line 111 — confirmed `hidden={!topicNotesOpen ...}` HTML attribute on textarea [VERIFIED: codebase read]
- `vitest.config.ts` — confirmed test environment: happy-dom, no coverage gates on component files [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- `@starting-style` browser support claim (Chrome 117+) — sourced from CONTEXT.md D-06 rationale [CITED: 19-CONTEXT.md]
- `grid-template-rows: 0fr → 1fr` pattern description — [ASSUMED: established CSS technique widely documented]

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — no new packages; existing stack confirmed via package.json
- Architecture: HIGH — all patterns locked in CONTEXT.md; codebase read confirms current state
- Pitfalls: HIGH — pitfalls derived from direct code inspection of the test files and components being modified
- Test breakage risk: HIGH — two specific test assertions identified that will fail on implementation

**Research date:** 2026-06-19
**Valid until:** 2026-07-19 (stable CSS spec; no fast-moving dependencies)
