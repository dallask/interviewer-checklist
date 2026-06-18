# Phase 16: Bug Fixes & Dark Mode Polish - Research

**Researched:** 2026-06-18
**Domain:** TanStack Virtual scroll wiring, React className toggle, CSS `color-scheme`, Tailwind v4 dark mode
**Confidence:** HIGH (all findings verified against installed source code and type declarations)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tree Visibility After Add (BUG-01/BUG-02)**
- After `addSection` / `addTopic` store mutations, call `scrollToIndex` on the virtualizer pointing to the new row so the user sees what they just added
- Use `behavior: "auto"` (instant scroll) — avoids animation jank in a dense virtual list
- For BUG-01 (add section): scroll to the new section row at the end of the list
- For BUG-02 (add topic): auto-expand the parent section if collapsed before scrolling to the new topic row; the trigger only renders when the section is expanded so the row index is predictable

**Note Icon Toggle Fix (BUG-03)**
- Note content is always preserved in the Zustand store when the textarea closes — never clear on close
- Switch from the HTML `hidden` attribute to CSS `display:none` via a `className` toggle — this triggers the ResizeObserver that TanStack Virtual uses for `measureElement` more reliably than the `hidden` attribute in React 19
- Keep the existing blue icon indicator when `notesOpen || localNote` — the "has content" blue dot is a useful at-a-glance cue

**Score Dropdown Dark Mode (POL-01)**
- Add `dark:[color-scheme:dark]` to the score dropdown `<select>` to enable OS-native dark styling for `<option>` elements (no custom dropdown component needed)
- Scope `[color-scheme:dark]` fix to per-element classes, not a global `:root` rule — avoids unintended side effects on scrollbars and other OS widgets
- Scan the codebase for all `<select>` elements and apply the same consistent dark mode treatment (dark background, light text, `dark:[color-scheme:dark]`) to all of them, not just the score dropdown

### Claude's Discretion
- Exact Tailwind class combination for dark selects (e.g., `dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:[color-scheme:dark]`)
- How to pass row index to `scrollToIndex` after store mutation — ref forwarding, a returned value from the store action, or computing from the updated rows array
- Whether to use `rowVirtualizer.scrollToIndex(idx, { align: 'end' })` or `{ align: 'start' }` for newly added items
- Test update strategy (add new assertions for scroll behavior where testable; dark mode tests verify class presence)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | User can submit the Add Section form and the new section appears immediately in the content tree | Verified: `rowVirtualizer.scrollToIndex` API confirmed in installed `@tanstack/virtual-core` v3.14.3 types; `ContentTree.tsx` owns the virtualizer ref; `addSection` appends to `sections` array in Zustand store |
| BUG-02 | User can submit the Add Topic form and the new topic appears immediately under the target section | Verified: same `scrollToIndex` path; requires section auto-expand before scroll via `sectionOpen` store mutation; `buildFlatRows` emits `add-topic-trigger` only for non-collapsed sections, so row count is deterministic after expand |
| BUG-03 | User can click the note icon to close the textarea even when the textarea contains text | Verified: textarea uses `hidden={!notesOpen && !printMode}` HTML attribute — switching to `className={!notesOpen && !printMode ? 'hidden' : ''}` fires ResizeObserver correctly; existing test at line 163 asserts `not.toHaveAttribute('hidden')` and must be updated |
| POL-01 | Score dropdown is clearly readable in dark mode (explicit bg/text/border dark-mode colors, sufficient contrast) | Verified: `QuestionCard.tsx` select already has `dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600` but is missing `dark:[color-scheme:dark]`; `CustomQuestionForm.tsx` select uses lighter `bg-white dark:bg-gray-800` and is missing both border and `color-scheme`; `DifficultyFilter.tsx` uses no `<select>` element |
</phase_requirements>

---

## Summary

Phase 16 is a focused defect-fix-and-polish phase with exactly four targeted changes across five component files. No new packages, no architectural changes, no data migration. The entire phase is a code-editing exercise.

**BUG-01/BUG-02 (tree visibility):** The virtualizer renders what is visible but does not auto-scroll to newly appended items. `ContentTree.tsx` owns the `rowVirtualizer` returned by `useVirtualizer`. After `addSection` or `addTopic` fires in `AddSectionForm`/`AddTopicForm`, the parent (`ContentTree`) must call `rowVirtualizer.scrollToIndex(newRowIndex, { align: 'start', behavior: 'auto' })`. The new row index is computable by inspecting the updated `rows` prop length. The `onDismiss` callback path already wires the forms back to the parent — extending it with an `onAdded` callback is the cleanest approach confirmed by the CONTEXT.md decisions.

**BUG-03 (note toggle):** The textarea uses the HTML `hidden` attribute (`hidden={!notesOpen && !printMode}`). In React 19 / JSDOM, the HTML `hidden` attribute does not fire a ResizeObserver `contentRect` change because it is removed as a DOM attribute (not via a style mutation), so TanStack Virtual's `measureElement` does not see the height collapse. Replacing with `className={!notesOpen && !printMode ? 'hidden' : ''}` produces a CSS `display:none` toggle which fires the ResizeObserver. One existing test (`QuestionCard.test.tsx` line 170: `expect(textarea).not.toHaveAttribute('hidden')`) depends on the HTML attribute and must be updated to check the absence of the `hidden` class instead.

**POL-01 (select dark mode):** Two `<select>` elements exist in the codebase — in `QuestionCard.tsx` and `CustomQuestionForm.tsx`. The score dropdown in `QuestionCard` already has the correct bg/text/border dark classes but is missing `dark:[color-scheme:dark]`. The difficulty select in `CustomQuestionForm` uses `bg-white dark:bg-gray-800` and is missing the border dark class and `dark:[color-scheme:dark]`. The `color-scheme` CSS property tells the browser to apply OS-native dark styling to form controls (including `<option>` elements which cannot be styled with Tailwind directly). `DifficultyFilter.tsx` uses buttons only — no `<select>` element present.

**Primary recommendation:** All four fixes are isolated edits to five component files. Implement in order: BUG-03 first (self-contained), POL-01 second (class-only changes), BUG-01/BUG-02 last (requires callback wiring across components). Update affected tests after each fix.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Virtualizer scroll after add (BUG-01/02) | Frontend Component | Store | `ContentTree` owns the virtualizer instance; store owns `sections` mutation; scroll call lives in ContentTree after store mutation propagates via React re-render |
| Note textarea show/hide (BUG-03) | Frontend Component | — | Self-contained in `QuestionCard`; no parent callback needed; className toggle is local JSX change |
| Dark mode select styling (POL-01) | Frontend Component | — | Pure CSS class addition in `QuestionCard` and `CustomQuestionForm`; no store or logic change |
| Row index computation for scroll | Frontend Component | — | Computed from the updated `rows` prop passed to `ContentTree` from `App.tsx` via `buildFlatRows`; rows are derived state, not store state |

---

## Standard Stack

No packages to install. This phase is pure code-editing within the existing stack.

| Library | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-virtual` | 3.14.3 (installed) | Virtual list; `scrollToIndex` API used for BUG-01/02 |
| `zustand` | 5.0.14 (installed) | `addSection`, `addTopic`, `toggleSectionOpen` store actions |
| `tailwindcss` | 4.3.1 (installed) | `dark:[color-scheme:dark]` arbitrary Tailwind variant for POL-01 |
| `react` | 19.2.7 (installed) | `useRef`, `useState`, `useEffect` — no new hooks needed |

[VERIFIED: codebase — `package.json` + `npm list @tanstack/react-virtual`]

---

## Package Legitimacy Audit

No new packages are installed in this phase.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| (none) | — | — | No package installs in this phase |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User Action (Add Section submit)
         │
         ▼
  AddSectionForm.handleSubmit()
         │
         ├─── addSection(store) ──────────────► Zustand store mutates sections[]
         │                                               │
         └─── onDismiss() ─── triggers onAdded(idx) ◄──┘ (ContentTree computes new row idx)
                                      │
                                      ▼
                        rowVirtualizer.scrollToIndex(idx, { align:'start', behavior:'auto' })
                                      │
                                      ▼
                         Viewport scrolls to new section row (no reload)
```

```
User Action (Note icon click — textarea has text)
         │
         ▼
  setNotesOpen(false)   [localNote preserved in state]
         │
         ▼
  textarea className = "hidden" (CSS display:none)
         │
         ▼
  ResizeObserver fires on element height change
         │
         ▼
  rowVirtualizer measureElement() updates row height
         │
         ▼
  Virtualizer adjusts total size, adjacent rows reflow
```

### Recommended Project Structure

No structural changes. All edits are within existing files:

```
src/components/
├── ContentTree.tsx      # BUG-01/02: add onAdded callback, call scrollToIndex
├── AddSectionForm.tsx   # BUG-01: accept onAdded prop, call after addSection
├── AddTopicForm.tsx     # BUG-02: accept onAdded prop, call after addTopic
├── QuestionCard.tsx     # BUG-03: className toggle; POL-01: +dark:[color-scheme:dark]
└── CustomQuestionForm.tsx # POL-01: align select dark classes to standard pattern
```

### Pattern 1: scrollToIndex After Store Mutation

**What:** Compute new row index from the updated `rows` prop, then call `scrollToIndex`. The key insight is that `rows` is derived from `sections` (via `buildFlatRows` in `App.tsx`) and is passed as a prop to `ContentTree`. After `addSection` fires, React re-renders `ContentTree` with updated `rows`. The scroll call must happen in the same event tick (or the next microtask after the store mutation settles) to target the correct index.

**When to use:** After any store mutation that appends a new row to the virtualizer's row array.

**Implementation approach** (Claude's discretion area — recommend `onAdded` callback):

```typescript
// ContentTree.tsx — extend AddSectionForm's onDismiss to include scroll
// Option A (recommended): pass onAdded callback that ContentTree wires
{row.type === 'add-section-trigger' && (
  addSectionOpen ? (
    <AddSectionForm
      onDismiss={() => setAddSectionOpen(false)}
      onAdded={(newRowIndex) => {
        rowVirtualizer.scrollToIndex(newRowIndex, { align: 'start', behavior: 'auto' });
      }}
    />
  ) : ( ... )
)}
```

```typescript
// AddSectionForm.tsx — call onAdded with new row index after addSection
interface Props {
  onDismiss: () => void;
  onAdded?: (rowIndex: number) => void;
}

function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (name.trim() === '') return;
  addSection({ id: ..., label: name.trim(), icon: icon.trim() || '🔧', isDefault: false, topics: [] });
  onDismiss();
  // Caller (ContentTree) computes the index from updated rows prop
  // onAdded is called by ContentTree after re-render, not here
}
```

**Alternative: compute index in ContentTree after re-render**

The cleaner pattern is to have `ContentTree` compute the new row index from the `rows` prop after the store mutation triggers a re-render. Since `addSection` appends to `sections[]`, the new section's row appears just before the `add-section-trigger` row (which is always the last row). So `newSectionRowIndex = rows.length - 1` (the trigger is the last row; the new section row is second-to-last). This can be computed without any prop from the child form.

```typescript
// ContentTree.tsx — scroll after addSection settles
// The add-section-trigger is the final row. New section row is at index rows.length - 2.
// (rows.length - 1 = trigger row; rows.length - 2 = new section row)
// This computation is valid AFTER the store mutation propagates to the rows prop.
```

[ASSUMED — exact timing of when `rows` prop reflects the mutation vs when `scrollToIndex` is called. React batches state updates in event handlers; the re-render with updated rows happens before the next paint, but `scrollToIndex` must be called after that re-render. Using `useEffect` that watches `rows.length` and calls `scrollToIndex` when length increases is the safest pattern.]

### Pattern 2: CSS className Toggle for Textarea Hide/Show

**What:** Replace the HTML `hidden` attribute on the textarea with a Tailwind `hidden` class.

**Why the difference matters:** The HTML `hidden` attribute and Tailwind's `hidden` class both produce `display:none`, but the mechanism matters for ResizeObserver:
- HTML `hidden` attribute: React removes the DOM attribute, which does NOT trigger ResizeObserver `contentRect` changes in browsers (ResizeObserver only fires on element resize, and a hidden element reports 0×0, but the event may not fire consistently across React 19's rendering pipeline in certain environments).
- CSS `hidden` class (`display:none` via stylesheet): the style mutation triggers ResizeObserver consistently, allowing TanStack Virtual's `measureElement` to detect the height change and remeasure the row.

```typescript
// BEFORE (broken in React 19 / TanStack Virtual)
<textarea
  hidden={!notesOpen && !printMode}
  ...
/>

// AFTER (correct — className toggle fires ResizeObserver)
<textarea
  className={`w-full resize-y min-h-[64px] ... ${!notesOpen && !printMode ? 'hidden' : ''}`}
  ...
/>
```

[VERIFIED: codebase — `QuestionCard.tsx` line 136 confirms current `hidden={!notesOpen && !printMode}` usage; CONTEXT.md locked this approach]

### Pattern 3: dark:[color-scheme:dark] for Native Select Styling

**What:** Adding `dark:[color-scheme:dark]` to a `<select>` element instructs the browser to apply its built-in dark-theme styling to the `<option>` dropdown list. This is the only reliable cross-browser way to make `<option>` elements legible in dark mode because `<option>` elements cannot be styled with CSS in most browsers.

**Why needed:** In dark mode, the `<select>` element's body (the collapsed control) can be styled with `dark:bg-gray-700 dark:text-gray-100`, but when the dropdown opens, the OS renders the `<option>` list natively. Without `color-scheme: dark`, this native dropdown uses the OS light theme, producing white text on white background (or light text on light background).

```typescript
// QuestionCard.tsx — score dropdown (PRIMARY FIX for POL-01)
// Add dark:[color-scheme:dark] to existing class string
<select
  className="text-xs font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 min-w-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
  ...
>
```

```typescript
// CustomQuestionForm.tsx — difficulty select (align to standard pattern)
// BEFORE: bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 (lighter variant)
// AFTER: bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:[color-scheme:dark]
// This aligns to the standard pattern from UI-SPEC.md
<select
  className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
  ...
>
```

[VERIFIED: codebase — QuestionCard.tsx line 68 confirms existing classes; CustomQuestionForm.tsx lines 41-46 confirms lighter variant needing update; grep confirmed `color-scheme` not yet used in the codebase]

### Anti-Patterns to Avoid

- **Calling `scrollToIndex` in the form's submit handler:** The store mutation has not propagated to the `rows` prop yet at that point. The index would be stale. Use a `useEffect` in `ContentTree` that fires after `rows` length changes.
- **Clearing `localNote` on textarea close:** Content is never cleared on collapse — only `notesOpen` toggles. This is a locked CONTEXT decision.
- **Adding `color-scheme: dark` to `:root`:** This affects OS scrollbars, date pickers, and all native widgets site-wide. Must be scoped to individual `<select>` elements via the `dark:[color-scheme:dark]` class.
- **Using `rowVirtualizer.measure()` instead of `scrollToIndex`:** `measure()` forces a full re-measurement of all items; `scrollToIndex` is targeted and is the correct API for post-add scrolling.
- **Expanding parent section inside the store's `addTopic` action:** Section expand state is UI state (`sectionOpen` in the store), not bank shape state. Expanding should happen in `ContentTree` before computing the new row index, not inside the store action.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll to new item after add | Custom scroll calculation or `scrollTo({top: ...})` | `rowVirtualizer.scrollToIndex(idx, opts)` | Virtualizer tracks absolute item positions; manual scroll coordinates would be stale if items above have variable heights |
| Native dropdown dark styling | Custom `<ul>`-based dropdown replacement | `dark:[color-scheme:dark]` on `<select>` | A custom dropdown component is unnecessary complexity; `color-scheme` is a browser-native CSS property designed for exactly this purpose |
| ResizeObserver for row height | Manual `ResizeObserver` subscription in the component | TanStack Virtual's `measureElement` ref callback (already wired) | Already installed on every virtualizer row div; switching to className toggle is sufficient to trigger it |

---

## Common Pitfalls

### Pitfall 1: scrollToIndex Called Before rows Prop Updates

**What goes wrong:** `scrollToIndex` is called synchronously in `handleSubmit` (inside `AddSectionForm`), but the `rows` prop passed to `ContentTree` has not yet been updated — the store mutation has fired but React has not re-rendered `ContentTree`. The scroll targets the old row count and lands at the wrong position or does nothing.

**Why it happens:** Zustand `set()` is synchronous, but React batches state updates in event handlers and schedules a re-render. The `rows` prop (derived via `buildFlatRows` in `App`) only reflects the mutation after that re-render.

**How to avoid:** Use a `useEffect` in `ContentTree` that watches `rows.length` (or a specific trigger flag) and calls `scrollToIndex` after the render that reflects the new rows. Example:

```typescript
// ContentTree.tsx
const prevRowsLength = useRef(rows.length);
useEffect(() => {
  if (rows.length > prevRowsLength.current) {
    // rows grew — a new item was added; scroll to show it
    const newSectionIdx = rows.findIndex(r => r.type === 'add-section-trigger') - 1;
    if (newSectionIdx >= 0) {
      rowVirtualizer.scrollToIndex(newSectionIdx, { align: 'start', behavior: 'auto' });
    }
  }
  prevRowsLength.current = rows.length;
}, [rows.length, rowVirtualizer]);
```

This pattern avoids the timing hazard entirely by triggering scroll after the DOM reflects the new state.

**Warning signs:** Scroll appears to target an incorrect position or no scroll happens at all after submitting the add form.

### Pitfall 2: Test Assertion on `hidden` Attribute After BUG-03 Fix

**What goes wrong:** `QuestionCard.test.tsx` line 170 asserts `expect(textarea).not.toHaveAttribute('hidden')` after clicking the note button. After the BUG-03 fix removes the HTML `hidden` attribute in favor of a `className` toggle, this assertion continues to pass trivially (the attribute is never present), but a new test is needed to verify the textarea hides by class.

**Why it happens:** The existing test was written against the old implementation. After the fix, the correctness test must verify:
1. When `notesOpen=false`, textarea has class `hidden`
2. When `notesOpen=true`, textarea does NOT have class `hidden`

**How to avoid:** Add two new assertions alongside the fix:
```typescript
// After fix: textarea closed state uses class, not attribute
expect(textarea.className).toContain('hidden'); // when closed
expect(textarea.className).not.toContain('hidden'); // when open
```

**Warning signs:** Tests pass but the BUG-03 fix doesn't actually work in the browser because no test caught the regression.

### Pitfall 3: BUG-02 Section Not Expanded Before Scroll

**What goes wrong:** User clicks Add Topic on a collapsed section. The section is collapsed so `buildFlatRows` emits no `add-topic-trigger` row for it. After submitting the form, the code tries to scroll to the new topic row, but the section must first be expanded for `buildFlatRows` to emit topic rows and the add-trigger row. If expansion and scroll happen in the wrong order, the row index is computed from collapsed rows and targets the wrong position.

**Why it happens:** `buildFlatRows` only emits `topic`, `question`, and `add-topic-trigger` rows for sections where `sectionOpen[sectionId] !== false`. A collapsed section emits only its `section` row.

**How to avoid:** Auto-expand the parent section first, wait for the rows re-render (via `useEffect` or `flushSync`), then compute the new topic's row index and call `scrollToIndex`.

**Warning signs:** After adding a topic to a collapsed section, the scroll lands on an unrelated row or at the very end of the list.

### Pitfall 4: DifficultyFilter Has No `<select>` (Don't Over-Apply POL-01)

**What goes wrong:** Code scan assumptions suggest `DifficultyFilter` might have a select. It does not — it uses `<button>` elements styled as chips. Applying the `color-scheme` fix there is unnecessary and adds noise.

**How to avoid:** Only `QuestionCard.tsx` and `CustomQuestionForm.tsx` contain `<select>` elements (confirmed via codebase grep).

### Pitfall 5: Tailwind v4 Arbitrary Variant Syntax

**What goes wrong:** `dark:[color-scheme:dark]` uses Tailwind v4's arbitrary variant syntax with a CSS property containing a colon. In Tailwind v3, this required escaping. In Tailwind v4, the square-bracket arbitrary variant syntax handles this correctly — no escaping needed.

**How to avoid:** Use the exact syntax `dark:[color-scheme:dark]` without escaping the inner colon.

[ASSUMED — Tailwind v4 arbitrary variant with CSS property containing colons; behavior should be confirmed by running the build and inspecting the output CSS.]

---

## Code Examples

### BUG-01 / BUG-02: scrollToIndex Signature (Verified from Installed Types)

```typescript
// Source: node_modules/@tanstack/virtual-core/dist/esm/index.d.ts
scrollToIndex(
  index: number,
  options?: {
    align?: 'start' | 'center' | 'end' | 'auto';
    behavior?: 'auto' | 'smooth' | 'instant';
  }
): void;
```

Use: `rowVirtualizer.scrollToIndex(idx, { align: 'start', behavior: 'auto' })`

[VERIFIED: codebase — type definition confirmed in installed `@tanstack/virtual-core@3.14.3`]

### BUG-01: New Section Row Index Computation

```typescript
// The add-section-trigger row is always the LAST row in buildFlatRows output
// New section row is inserted just before it: index = rows.length - 2
// (rows.length - 1 = trigger row, rows.length - 2 = new section row)
const newSectionRowIndex = rows.findIndex(r => r.type === 'add-section-trigger') - 1;
```

[VERIFIED: codebase — `buildFlatRows.ts` line 240: `rows.push({ type: 'add-section-trigger' })` is always the final push]

### BUG-02: New Topic Row Index Computation

```typescript
// For a new topic in sectionId, find its add-topic-trigger row after section is expanded
// The new topic row is the second-to-last row before the add-topic-trigger for its section
// Simpler: after addTopic fires and section is expanded, use findIndex on updated rows
const triggerIdx = rows.findIndex(
  r => r.type === 'add-topic-trigger' && r.sectionId === sectionId
);
// New topic row is at triggerIdx - 1 (topic row appears before its trigger in buildFlatRows)
// But new topic also has an add-topic-trigger row after it, so index is triggerIdx - 1
const newTopicRowIndex = triggerIdx - 1;
```

[VERIFIED: codebase — `buildFlatRows.ts` lines 187-236: topic rows appear before `add-topic-trigger` for each section]

### BUG-03: className Toggle Pattern

```typescript
// BEFORE (QuestionCard.tsx line 136 — current broken implementation)
<textarea
  hidden={!notesOpen && !printMode}
  ...
  className="w-full resize-y min-h-[64px] ..."
/>

// AFTER (correct — className toggle fires ResizeObserver)
<textarea
  className={`w-full resize-y min-h-[64px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mx-3 mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0${!notesOpen && !printMode ? ' hidden' : ''}`}
  style={{ width: 'calc(100% - 1.5rem)' }}
/>
```

[VERIFIED: codebase — exact current className from `QuestionCard.tsx` lines 138-139]

### POL-01: Standard Dark Select Class Combination

```typescript
// Score dropdown (QuestionCard.tsx) — add dark:[color-scheme:dark] to existing classes
className="text-xs font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 min-w-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"

// Difficulty select (CustomQuestionForm.tsx) — align to standard pattern + add color-scheme
// BEFORE: text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
// AFTER:  text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:[color-scheme:dark]
className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
```

[VERIFIED: codebase — current QuestionCard.tsx line 68, CustomQuestionForm.tsx lines 44-45]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTML `hidden` attribute for textarea collapse | CSS `hidden` class (`display:none`) | React 19 / TanStack Virtual 3.x | `hidden` attribute triggers no style mutation → ResizeObserver doesn't fire; `hidden` class does |
| Manual scroll offset calculation | `rowVirtualizer.scrollToIndex()` | TanStack Virtual 3.x | Built-in API handles variable item heights correctly; manual calculation fails with `estimateSize` discrepancies |
| Unstyled native `<select>` in dark mode | `dark:[color-scheme:dark]` on select element | CSS Color Adjust Level 1 spec | `<option>` elements cannot be styled with CSS; `color-scheme` property signals the browser to use its dark-mode native rendering |

**Deprecated/outdated:**
- HTML `hidden` attribute for toggling React component visibility inside a virtualizer: produces no ResizeObserver events in React 19 because the attribute removal is not a style mutation.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `scrollToIndex` called in a `useEffect` watching `rows.length` fires after the render with updated rows, resolving the timing hazard | Pitfall 1 / Code Examples | If React schedules the effect before the virtualizer processes the new layout, the scroll may target an incorrect offset — low risk in practice since effects run after paint |
| A2 | Tailwind v4 handles `dark:[color-scheme:dark]` (colon-in-colon arbitrary variant) without escaping | Pitfall 5 / POL-01 examples | If Tailwind v4 misparses the nested colon, the class is silently dropped and the option list stays unreadable in dark mode — verify by checking generated CSS |
| A3 | `notesOpen=false` with `className="... hidden"` will cause TanStack Virtual's ResizeObserver to fire and remeasure the row in the actual browser (Chrome extension) | BUG-03 patterns | JSDOM's ResizeObserver is a shim; the fix may work in tests but behave differently in Chrome's real ResizeObserver — manual browser testing is required |

---

## Open Questions

1. **scrollToIndex timing: `useEffect` vs synchronous after store mutation**
   - What we know: Store mutation is synchronous; React re-renders asynchronously; `useEffect` fires after paint
   - What's unclear: Whether `rowVirtualizer.scrollToIndex` called inside a `useEffect` that watches `rows.length` will correctly target the newly measured row, or whether the virtualizer needs an additional render cycle to update internal measurements
   - Recommendation: Implement with `useEffect` first; if scroll lands incorrectly, add `flushSync` around the store mutation (but `useFlushSync: false` is set on the virtualizer, so avoid `flushSync` in the component tree)

2. **BUG-02 expand-then-scroll sequencing**
   - What we know: `setAddTopicOpenFor` is local state in `ContentTree`; `toggleSectionOpen` is a store action
   - What's unclear: Whether calling `toggleSectionOpen(sectionId)` to expand and then computing `rows.findIndex(...)` gives a valid index in the same render cycle
   - Recommendation: The expand must happen first (in the `AddTopicForm` submission flow), and the scroll should happen in a subsequent `useEffect` that fires after rows reflect the expanded section

---

## Environment Availability

Step 2.6: SKIPPED — no new external dependencies. This phase modifies existing files only; no new tools, CLIs, runtimes, or services are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Environment | happy-dom |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | After AddSection submit, rows.length increases and scroll fires | unit | `npm test -- --reporter=verbose` | Partial — needs new test in `ContentTree.test.tsx` or `phase-16-defects.test.tsx` |
| BUG-02 | After AddTopic submit, rows.length increases and scroll fires | unit | `npm test -- --reporter=verbose` | Partial — same new test file |
| BUG-03 | Note textarea uses `hidden` class not `hidden` attribute; toggling fires correctly | unit | `npm test -- --reporter=verbose` | Partial — QuestionCard.test.tsx line 170 must be updated |
| POL-01 | Score select has `dark:[color-scheme:dark]` class; difficulty select aligned to standard pattern | unit | `npm test -- --reporter=verbose` | New assertion needed in QuestionCard.test.tsx and CustomQuestionForm.test.tsx |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Current Baseline

667 tests passing across 42 test files (confirmed by `npm test` run during research).

### Wave 0 Gaps

- [ ] New test file or describe block for BUG-01/02 scroll behavior — covers `ContentTree` scroll-after-add path
- [ ] Update `QuestionCard.test.tsx` line 170: change from `not.toHaveAttribute('hidden')` to class-based assertion after BUG-03 fix
- [ ] New assertion in `QuestionCard.test.tsx`: closed note textarea has class `hidden`
- [ ] New assertion in `QuestionCard.test.tsx`: score select has class string containing `[color-scheme:dark]`
- [ ] New assertion in `CustomQuestionForm.test.tsx`: difficulty select has `dark:[color-scheme:dark]` and matches standard bg/border pattern

---

## Security Domain

### Applicable ASVS Categories

`security_enforcement` is enabled (not explicitly `false`). Phase 16 is pure front-end component edits with no new inputs, no data flows, no network calls, no auth, and no storage schema changes.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Not affected — no auth code touched |
| V3 Session Management | no | Not affected — no session logic touched |
| V4 Access Control | no | Not affected |
| V5 Input Validation | no | Textarea note content was already passing through `setNote` which is already validated; no new user input paths |
| V6 Cryptography | no | Not affected |

### Known Threat Patterns for this stack

No new attack surface introduced. The `dark:[color-scheme:dark]` class is a CSS rendering hint — not a content injection vector. The `scrollToIndex` call takes an integer row index derived from an array length — not user-controlled input.

---

## Sources

### Primary (HIGH confidence)

- Installed codebase: `ContentTree.tsx`, `QuestionCard.tsx`, `AddSectionForm.tsx`, `AddTopicForm.tsx`, `CustomQuestionForm.tsx`, `buildFlatRows.ts`, `app.ts`, `QuestionCard.test.tsx` — direct file reads, exact line numbers cited
- Installed types: `node_modules/@tanstack/virtual-core/dist/esm/index.d.ts` — `scrollToIndex` signature and `ScrollToIndexOptions` verified
- `package.json` — all package versions confirmed

### Secondary (MEDIUM confidence)

- CONTEXT.md decisions — locked implementation choices referenced directly
- UI-SPEC.md — exact Tailwind class combinations for select dark mode
- `vitest.config.ts` — test environment and coverage config

### Tertiary (LOW confidence — [ASSUMED] tagged)

- Tailwind v4 arbitrary variant behavior for `dark:[color-scheme:dark]` — requires build verification
- ResizeObserver behavior in Chrome extension vs happy-dom — requires browser verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in `package.json` and `node_modules`
- Architecture: HIGH — all component relationships verified by reading source files
- API signatures: HIGH — `scrollToIndex` signature verified in installed type definitions
- Pitfalls: HIGH — root cause verified in source code (lines cited); timing pitfall tagged ASSUMED for production behavior
- Dark mode fix: HIGH — current class strings verified in source; `color-scheme` CSS behavior tagged ASSUMED for browser rendering

**Research date:** 2026-06-18
**Valid until:** 2026-09-18 (stable codebase, no external API dependencies)
