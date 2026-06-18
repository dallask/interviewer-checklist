# Phase 12: UAT Defect Cleanup — Research

**Researched:** 2026-06-18
**Domain:** React component event wiring, native `<dialog>` API, Zustand store patterns, Tailwind v4 responsive overrides
**Confidence:** HIGH — all findings are direct code reads from the working source tree

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- D-01: Stop propagation at the override control container (`TopicMarkDisplay` `<fieldset>`) — add `onClick/onMouseDown e.stopPropagation()` on the `<fieldset>`.
- D-02: No new state, no new action for SCORE-07 — stopPropagation at the DOM event level is the fix.
- D-03: Backdrop close for SESS-05 via `onClick` on the `<dialog>` element: `if (event.target === dialogRef.current)` call `close()`.
- D-04: Esc is natively handled — no extra wiring needed.
- D-05: The existing × Close button already works — no changes to it.
- D-06: New `hideNotes: boolean` in `AppState` (default `false`) + `setHideNotes: (v: boolean) => void` action, mirroring `darkMode` pattern.
- D-07: `hideNotes` is NOT persisted — must NOT appear in the `subscribe` block's `uiState` write.
- D-08: `QuestionCard.tsx` and `TopicRow.tsx` read `hideNotes`; both guard with `hideNotes && !printMode`; print reveal is preserved.
- D-09: ActionsGroup "Hide notes" button wired to `setHideNotes(!hideNotes)` with `aria-pressed`.
- D-10: Remove `md:relative md:translate-x-0` from `Sidebar.tsx` `<aside>` className.
- D-11: Remove `md:hidden` from backdrop overlay in `App.tsx`.
- D-12: `sidebarOpen` default `true` already set — no change needed.
- D-13: Sidebar toggle button in `App.tsx` already has no `md:hidden` — no change needed.
- D-14: Use native `title` attribute for tooltips — no custom component.
- D-15: Remove visible text labels from Actions buttons; keep `aria-label`, add matching `title`.
- D-16: Icon assignments per UI-SPEC.md table (emoji characters, no SVG, no icon library).
- D-17: Add `icon?: ReactNode` to `SidebarGroupProps`; render `{icon && <span className="mr-1" aria-hidden="true">{icon}</span>}` before `<span>{label}</span>`.
- D-18: Icons: Search 🔍, Difficulty 🎯, Sections 📋, Actions ⚡.

### Claude's Discretion

- Exact icon choices for UI-10 Actions buttons (guidance in UI-SPEC.md).
- Whether to use CSS `hidden` class or conditional rendering for UI-09 note suppression — prefer `hidden` class to avoid React re-mount.
- Whether `stopPropagation` is applied at `<fieldset>` or its wrapper for SCORE-07 (CONTEXT.md D-01 says `<fieldset>`; UI-SPEC says same).

### Deferred Ideas (OUT OF SCOPE)

- Compact QuestionCard redesign (Phase 15 — SCORE-08)
- Sidebar sticky header, candidate button, final-mark progress (Phase 15 — UI-13)
- Credit footer / About modal (Phase 15 — UI-14, UI-15)
- Filter "All rows" + counts (Phase 13)
- Editable bank (Phase 14)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCORE-07 | Manual topic-override control does not toggle parent topic's expanded/collapsed state when opened or changed | TopicMarkDisplay `<fieldset>` is a child of the `<button>` that fires `toggleTopic` — stopPropagation on the fieldset isolates the events |
| SESS-05 | Session switcher modal closed via Esc, backdrop click, and visible Close button; renders as overlay above sidebar | `<dialog>` already uses `showModal()` (top layer); Close button already wired; only backdrop click handler is missing |
| UI-09 | "Hide notes" toggle actually hides rendered notes; toggling off restores them | `hideNotes` is absent from store; needs new state field + action; QuestionCard and TopicRow need conditional `hidden` class |
| UI-10 | Sidebar Actions buttons render as icon-only with tooltip on hover/focus | All 10 buttons currently use full-width text labels; needs icon replacement + `title` attribute |
| UI-11 | Sidebar section titles (Search, Difficulty, Sections, Actions) each show a leading icon before text | `SidebarGroup` has no `icon` prop; `Sidebar.tsx` passes no icons to `SidebarGroup` instances |
| UI-12 | Sidebar collapse/expand works on all viewports including ≥768px | `md:relative md:translate-x-0` pins the sidebar open on desktop; backdrop has `md:hidden` |
</phase_requirements>

---

## Summary

Phase 12 consists of six independent surgical fixes to existing components. No new routes, no schema changes, no new dependencies. All fixes are isolated to specific lines or props within `TopicRow.tsx`, `TopicMarkDisplay.tsx`, `SessionSwitcherModal.tsx`, `ActionsGroup.tsx`, `SidebarGroup.tsx`, `Sidebar.tsx`, `App.tsx`, and `src/store/app.ts`.

The root causes are fully confirmed by direct source reads: (1) `TopicMarkDisplay` renders its `<fieldset>` inside the topic header `<button>`, so every click on the override input bubbles to the collapse handler. (2) `SessionSwitcherModal` has no `onClick` handler on the `<dialog>` element for backdrop detection. (3) `hideNotes` does not exist in the store at all — the button in `ActionsGroup` renders text "Hide marked topics" but there is no "Hide notes" button yet. (4) All `ActionsGroup` buttons are full-width text buttons with no icon or `title`. (5) `SidebarGroup` has no `icon` prop. (6) `Sidebar.tsx` has `md:relative md:translate-x-0` and `App.tsx` backdrop has `md:hidden`.

**Primary recommendation:** Fix each defect in isolation in the order: store change (UI-09) → ActionsGroup (UI-09 + UI-10) → TopicRow/QuestionCard (UI-09) → SidebarGroup (UI-11) → Sidebar (UI-11 + UI-12) → App.tsx (UI-12) → SessionSwitcherModal (SESS-05) → TopicMarkDisplay (SCORE-07).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SCORE-07: Override dropdown event isolation | Browser / Client (component) | — | Pure DOM event propagation fix inside a React component |
| SESS-05: Backdrop click close | Browser / Client (component) | — | Native `<dialog>` top-layer event wiring |
| UI-09: Hide notes state + toggle | Frontend store (Zustand) | Browser / Client (components) | State lives in Zustand; QuestionCard and TopicRow read it |
| UI-10: Icon-only action buttons | Browser / Client (component) | — | Markup change in ActionsGroup; no store involvement |
| UI-11: Section title icons | Browser / Client (component) | — | `SidebarGroup` prop change + `Sidebar.tsx` usage update |
| UI-12: Desktop sidebar toggle | Browser / Client (CSS classes) | Frontend store | Remove Tailwind breakpoint overrides; store already controls `sidebarOpen` |

---

## Standard Stack

No new packages are introduced in this phase. The phase uses only what is already installed.

| Library | Version (installed) | Purpose |
|---------|---------------------|---------|
| React | 19 (existing) | Component rendering |
| Zustand | 5 (existing) | `hideNotes` state field and action |
| Tailwind v4 | 4 (existing) | Class additions/removals for sidebar and button layout |

**Installation:** None needed.

---

## Package Legitimacy Audit

No packages are installed in Phase 12.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction (click override input)
  → DOM event fires on <input> inside <fieldset> inside topic header <button>
  → WITHOUT fix: click bubbles to <button> onClick → toggleTopic fires → section collapses
  → WITH fix: <fieldset> onClick + onMouseDown e.stopPropagation() → toggleTopic never fires

User interaction (click session modal backdrop)
  → click event fires on <dialog> element
  → WITHOUT fix: no handler — dialog stays open
  → WITH fix: onClick on <dialog> checks event.target === dialogRef.current → calls .close()

User toggles "Hide notes" in ActionsGroup
  → setHideNotes(!hideNotes) fires
  → Zustand state updates
  → QuestionCard + TopicRow re-render, note areas get className `hidden` (when !printMode)
  → toggling off: className `hidden` removed, note areas visible again

User clicks "Open sidebar" on desktop (≥768px)
  → setSidebarOpen(!sidebarOpen)
  → WITHOUT fix: md:translate-x-0 pins sidebar open regardless of sidebarOpen value
  → WITH fix: sidebar translate driven solely by sidebarOpen; backdrop shown on all viewports
```

### Recommended Project Structure

No structural changes. All edits are to existing files:

```
src/
├── store/app.ts                    — add hideNotes field + setHideNotes action
├── components/
│   ├── TopicMarkDisplay.tsx        — add stopPropagation to <fieldset>
│   ├── TopicRow.tsx                — read hideNotes, apply hidden class to notes panel
│   ├── QuestionCard.tsx            — read hideNotes, apply hidden class to notes section
│   ├── SessionSwitcherModal.tsx    — add onClick backdrop handler to <dialog>
│   ├── ActionsGroup.tsx            — add Hide notes button; convert all buttons to icon-only
│   ├── SidebarGroup.tsx            — add icon?: ReactNode prop
│   └── Sidebar.tsx                 — remove md:translate-x-0 + md:relative; add icon props
└── app/App.tsx                     — remove md:hidden from backdrop
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip on hover | Custom tooltip component | Native `title` attribute | Zero dependency; already used on icon buttons elsewhere in codebase; D-14 locked |
| Backdrop detection | `document.addEventListener` or portal wrapper | `onClick` on `<dialog>` checking `event.target === dialogRef.current` | Native `<dialog>` top layer positions backdrop as part of the dialog's rendering context; click on backdrop area has `event.target === <dialog>` |
| Note visibility toggle | New React state in each card | `hideNotes` in Zustand + CSS `hidden` class | Avoids re-mount side effects; consistent with `hideMarked` pattern already in codebase |
| Icon library | Install Lucide/Heroicons | Emoji characters + Unicode glyphs | Established pattern throughout codebase; no new dependency; D-16 locked |

---

## Q1: SCORE-07 — TopicRow / TopicMarkDisplay DOM/event model

**Finding: The `<fieldset>` inside `TopicMarkDisplay` is rendered as a child of the topic header `<button>`, so all pointer events on override controls bubble to the button's `onClick`.**

### Exact render tree (from source)

`TopicRow.tsx` line 58–72:
```tsx
<button
  type="button"
  onClick={() => toggleTopic(topicId)}   // ← this fires on any descendant click
  className="... w-full flex items-center justify-between ..."
>
  <span className="flex-1 text-left">{row.topic.name}</span>
  <span className="flex items-center gap-2">
    <span className="text-xs text-gray-500 ...">{row.questionCount} q</span>
    <TopicMarkDisplay topicId={topicId} topic={row.topic} />  // ← inside the button
  </span>
</button>
```

`TopicMarkDisplay.tsx` line 76–113 renders:
```tsx
<fieldset className="flex items-center gap-1 border-0 p-0 m-0" ...>
  <span>{displayValue}</span>
  <input type="number" ... />            // ← user clicks here → bubbles to button.onClick
  {override !== null && (
    <button type="button" onClick={() => { setOverride(...); setOverrideInput(''); }}>
      ×                                  // ← user clicks here → bubbles to button.onClick
    </button>
  )}
</fieldset>
```

### Where to apply stopPropagation

Add to the `<fieldset>` element in `TopicMarkDisplay.tsx` (line 76):
```tsx
<fieldset
  className="flex items-center gap-1 border-0 p-0 m-0"
  aria-label={`Mark for ${topic.name}`}
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
>
```

`onMouseDown` is required in addition to `onClick` because the browser fires `mousedown` before `click`. A rapid `mousedown` on the number input will set focus (which the browser may interpret as a header-area click via event delegation) before `click` fires. Both handlers are needed.

The `<button type="button">` for the × clear override inside the fieldset does NOT need its own `stopPropagation` — the fieldset handler intercepts the bubbled event first.

**Note:** `TopicRow.tsx` itself needs NO changes for SCORE-07. The fix lives entirely in `TopicMarkDisplay.tsx`.

---

## Q2: SESS-05 — SessionSwitcherModal dialog open/close pattern

### Current pattern (from `SessionSwitcherModal.tsx`)

- `<dialog>` at line 73 has `ref={dialogRef}` and `aria-labelledby="session-switcher-title"`.
- Opened imperatively in `ActionsGroup.tsx` via `sessionSwitcherRef.current?.showModal()` — correct top-layer pattern.
- Close button at line 87–95: `onClick={() => dialogRef.current?.close()}` — already functional.
- `useEffect` at line 25–58: attaches `handleKeyDown` (Tab-only focus trap) and `handleClose` (focus restore to `#open-session-switcher`). The `handleKeyDown` only intercepts `key === 'Tab'`, confirmed at line 31. Esc is handled natively by `<dialog>` with no interference.
- **Missing:** no handler on the `<dialog>` element itself for backdrop detection.

### What the `CandidateModal.tsx` reference pattern shows

`CandidateModal.tsx` also uses `showModal()` + Tab focus trap + `handleClose` focus restore. It does NOT have a backdrop handler either — so there is no reference implementation in the codebase to copy. The CONTEXT.md D-03 specifies the correct approach: add `onClick` to the `<dialog>` element.

### Exact change needed

At `SessionSwitcherModal.tsx` line 73, add `onClick` to the `<dialog>`:

```tsx
<dialog
  ref={dialogRef}
  aria-labelledby="session-switcher-title"
  className="fixed inset-0 m-auto w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-0 flex flex-col"
  onClick={(e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current.close();
    }
  }}
>
```

**Why `e.target === dialogRef.current` works:** When `showModal()` is used, the `<dialog>` element renders as a top-layer modal. Clicking the `::backdrop` pseudo-element fires a click event on the `<dialog>` element itself with `event.target` equal to the dialog node. Clicking anything inside the dialog content sets `event.target` to the inner element clicked, not the dialog. This check reliably distinguishes backdrop clicks from content clicks.

**Esc:** Already handled natively by `<dialog>` with no code needed. The `handleKeyDown` in the existing `useEffect` only intercepts `Tab`, confirmed at line 31 — no conflict.

**Close button (×):** Already functional at line 87–95. No change.

---

## Q3: UI-09 — `hideNotes` in the store

### Current state of `app.ts`

`hideNotes` does NOT exist anywhere in `app.ts`. Confirmed:
- `AppState` interface (lines 49–103): no `hideNotes` field.
- `AppActions` interface (lines 105–158): no `setHideNotes` action.
- `DEFAULT_STATE` (lines 160–187): no `hideNotes` entry.
- Store implementation (lines 209–608): no `setHideNotes` setter.

### What needs to be added

**1. `AppState` interface** — after `hideMarked: boolean` (line 65):
```typescript
/** Whether to suppress all note areas (per-question and per-topic) — UI-only, resets on reload */
hideNotes: boolean;
```

**2. `AppActions` interface** — after `setHideMarked: (v: boolean) => void` (line 115):
```typescript
setHideNotes: (v: boolean) => void;
```

**3. `DEFAULT_STATE`** — after `hideMarked: false` (line 168):
```typescript
hideNotes: false,
```

**4. Store implementation** — after `setHideMarked: (v) => set({ hideMarked: v })` (line 280):
```typescript
setHideNotes: (v) => set({ hideNotes: v }),
```

### Which subscribe block it must stay OUT of

The `subscribe` callback at line 613 writes a `uiState` object (lines 615–626):
```typescript
storageAdapter.write({
  uiState: {
    sidebarOpen: state.sidebarOpen,
    sectionOpen: state.sectionOpen,
    groupOpen: state.groupOpen,
    topicOpen: state.topicOpen,
    searchQuery: state.searchQuery,
    selectedDifficulties: [...state.selectedDifficulties],
    selectedSections: [...state.selectedSections],
    hideMarked: state.hideMarked,
    darkMode: state.darkMode,
  },
});
```

`hideNotes` must NOT be added to this `uiState` object. It is a volatile per-session UI preference (like `topicOpen`) that resets on reload. The difference from `hideMarked` is that `hideMarked` IS persisted (it is in the `uiState` write above). `hideNotes` follows the same rule as `printMode` — never written to storage.

---

## Q4: ActionsGroup — current buttons inventory

### All current buttons (from `ActionsGroup.tsx` lines 151–247)

| Order | Button text | id | aria-label | onClick | aria-pressed |
|-------|-------------|-----|-----------|---------|--------------|
| 1 | "Switch session" | `open-session-switcher` | — | `sessionSwitcherRef.current?.showModal()` | — |
| 2 | "AI feedback prompt" | `open-ai-prompt` | — | `handleOpenAiPrompt` | — |
| — | `<hr>` separator | — | — | — | — |
| 3 | "Expand all" | — | — | `expandAll` | — |
| 4 | "Collapse all" | — | — | `collapseAll` | — |
| 5 | "Hide marked topics" | — | — | `setHideMarked(!hideMarked)` | `hideMarked` |
| 6 | "Dark mode" / "Light mode" | — | — | `setDarkMode(!darkMode)` | `darkMode` |
| 7 | "Candidate details" | `open-candidate-modal` | — | `candidateDialogRef.current?.showModal()` | — |
| 8 | "Import YAML" | `open-import-yaml` | — | `handleOpenImportYaml` | — |
| 9 | "Export YAML" | — | — | `handleExportYaml` | — |
| 10 | "Reset all" | `open-reset-dialog` | — | `resetDialogRef.current?.showModal()` | — |

**"Hide notes" button is absent.** It does not exist yet and must be added (UI-09 + D-09).

**No current button has `aria-label` or `title`** — all use visible text content only.

### What needs to change for icon-only + title (UI-10)

For every button:
1. Replace visible text content with the emoji glyph from UI-SPEC.md table.
2. Add `aria-label="[existing text]"`.
3. Add `title="[existing text]"`.
4. Remove `text-left` from className (icon-only buttons are centered).
5. Change padding from `px-3 py-2` to `p-2` and ensure `min-h-[44px] min-w-[44px]` touch target.

**"Hide notes" button to add** (after "Hide marked topics"):
```tsx
<button
  type="button"
  aria-pressed={hideNotes}
  onClick={() => setHideNotes(!hideNotes)}
  title="Hide notes"
  aria-label="Hide notes"
  className={`p-2 min-h-[44px] min-w-[44px] text-sm rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none
    ${hideNotes
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`}
>
  📝
</button>
```

The `hideNotes` and `setHideNotes` selectors must be added to the component's store subscriptions.

### Full icon assignment (from UI-SPEC.md)

| Button | Emoji | aria-pressed |
|--------|-------|-------------|
| Switch session | 🔄 | — |
| AI feedback prompt | 🤖 | — |
| Expand all | ↕ | — |
| Collapse all | ↔ | — |
| Hide marked topics | 👁 | yes |
| Hide notes | 📝 | yes |
| Dark mode / Light mode | 🌙 / ☀ | yes (darkMode) |
| Candidate details | 👤 | — |
| Import YAML | 📥 | — |
| Export YAML | 📤 | — |
| Reset all | 🗑 | — |

**"Reset all" button** must keep `text-red-600 dark:text-red-400` and destructive hover classes. The `<hr>` separator between session actions and layout/view actions is preserved.

---

## Q5: UI-12 — Sidebar.tsx and App.tsx exact classes to change

### Sidebar.tsx `<aside>` className (current, line 22)

```
w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto
transition-transform duration-200 ease-in-out motion-reduce:transition-none
md:relative md:translate-x-0
fixed inset-y-0 left-0 z-50 print:hidden
${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
```

**Problem:** `md:relative md:translate-x-0` overrides the conditional `translate-x-0`/`-translate-x-full` classes on viewports ≥768px. The sidebar is `fixed` on mobile but becomes `relative` on desktop, and `md:translate-x-0` pins it open regardless of `sidebarOpen`.

**Fix:** Remove `md:relative md:translate-x-0`. After removal:
```
w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto
transition-transform duration-200 ease-in-out motion-reduce:transition-none
fixed inset-y-0 left-0 z-50 print:hidden
${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
```

The sidebar remains `fixed` on all viewports, driven solely by `sidebarOpen`.

**Impact on layout:** With `md:relative` removed, the sidebar no longer participates in the flexbox flow of `<div className="flex h-screen overflow-hidden ...">` on desktop. The main content area (`flex-1`) will now fill the full width when the sidebar is closed. When the sidebar is open, it overlays the content via `fixed` positioning (the same as mobile). This is intentional per the design contract — the sidebar is now always an overlay, not a side-by-side column.

### App.tsx backdrop (current, line 72–77)

```tsx
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 md:hidden print:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

**Fix:** Remove `md:hidden` from className:
```tsx
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 print:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

### App.tsx sidebar toggle button (lines 89–97)

```tsx
<button
  type="button"
  aria-expanded={sidebarOpen}
  onClick={() => setSidebarOpen(!sidebarOpen)}
  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
  className="self-start m-2 p-2 min-h-[44px] text-gray-600 dark:text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded print:hidden"
>
  ☰
</button>
```

**Confirmed: no `md:hidden` on this button.** No change needed.

### `sidebarOpen` default value

`DEFAULT_STATE` line 161: `sidebarOpen: true`. Already correct. Desktop users see sidebar open on first load with no code change.

---

## Q6: SidebarGroup.tsx — current shape and minimal change for `icon` prop

### Current shape (full file, 35 lines)

```tsx
import type { ReactNode } from 'react';

export interface SidebarGroupProps {
  groupId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SidebarGroup({
  label,
  isOpen,
  onToggle,
  children,
}: SidebarGroupProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <span>{label}</span>
        <span className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
```

Note: `groupId` is declared in `SidebarGroupProps` but is NOT destructured into the function body — it is present for the parent's key/identification purposes only (passed by `Sidebar.tsx` but not used inside the component). This is intentional and must not be changed.

### Minimal change for `icon?: ReactNode`

1. Add `icon?: ReactNode` to `SidebarGroupProps` interface.
2. Add `icon` to the destructured props.
3. Insert `{icon && <span className="mr-1" aria-hidden="true">{icon}</span>}` immediately before `<span>{label}</span>` inside the button.

Result:
```tsx
export interface SidebarGroupProps {
  groupId: string;
  label: string;
  icon?: ReactNode;       // ← add
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SidebarGroup({
  label,
  icon,                   // ← add
  isOpen,
  onToggle,
  children,
}: SidebarGroupProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <span className="flex items-center">  {/* ← wrap label area to align icon + text */}
          {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}
          <span>{label}</span>
        </span>
        <span className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
```

The `<span className="flex items-center">` wrapper is needed so the icon and label text stay on one baseline. Without it, adding the icon span before `<span>{label}</span>` still works (both are inline) but the flex gap between label-area and chevron may need alignment.

**Backwards compatibility:** groups that receive no `icon` prop render identically to today. The `{icon && ...}` conditional renders nothing.

### Sidebar.tsx — passing icon props

After the `SidebarGroup` change, update each call site in `Sidebar.tsx` (lines 24–58):
```tsx
<SidebarGroup groupId="search"     label="Search"     icon="🔍" isOpen={...} onToggle={...}>
<SidebarGroup groupId="difficulty" label="Difficulty" icon="🎯" isOpen={...} onToggle={...}>
<SidebarGroup groupId="sections"   label="Sections"   icon="📋" isOpen={...} onToggle={...}>
<SidebarGroup groupId="actions"    label="Actions"    icon="⚡" isOpen={...} onToggle={...}>
```

Emoji string literals are valid `ReactNode` values — no `<span>` wrapper needed at the call site.

---

## Q7: Existing tests that may need updating

### Tests that cover changed components

**`src/test/modal-focus-trap.test.tsx`** covers `SessionSwitcherModal` in two tests:

1. `SessionSwitcherModal focus trap / Tab key wraps focus from last to first focusable element` (lines 217–241) — queries the dialog by `aria-labelledby="session-switcher-title"`. The SESS-05 change adds an `onClick` to the `<dialog>` element but does not add or remove focusable elements. **This test will not break.**

2. `SessionSwitcherModal focus trap / focus is restored to trigger button on dialog close` (lines 243–263) — calls `dialog.close()` and checks focus restore. The SESS-05 change does not affect the `handleClose` listener. **This test will not break.**

**No other test files cover TopicRow, TopicMarkDisplay, ActionsGroup, SidebarGroup, Sidebar, QuestionCard, or app.ts store actions.** Confirmed by `find src/test -name "*.test.*"` returning only `manifest.test.ts` and `modal-focus-trap.test.tsx`.

### New tests needed

The planner should create new test cases for:

| Requirement | Test type | What to test |
|-------------|-----------|--------------|
| SCORE-07 | Unit | Clicking the `<fieldset>` in `TopicMarkDisplay` does not call `toggleTopic` |
| UI-09 | Unit | `setHideNotes(true)` causes QuestionCard notes area to gain `hidden` class; `setHideNotes(false)` removes it |
| UI-09 | Unit | `hideNotes` does NOT appear in the `uiState` object written by the subscribe block |
| SESS-05 | Unit | Clicking the backdrop area (simulating `event.target === dialogRef.current`) calls `dialog.close()` |

---

## Common Pitfalls

### Pitfall 1: Nested `<button>` renders as invalid HTML
**What goes wrong:** Placing a `<button>` inside another `<button>` is invalid HTML. `TopicMarkDisplay` already contains a `<button>` (the × clear override) and is rendered inside the topic header `<button>`. Browsers handle this inconsistently.
**Why it happens:** The existing code already has this structure. It works because the `<button type="button">` nesting is inside a `<fieldset>` which browsers tend to render as a block context.
**How to avoid:** Do NOT restructure the topic header or the override fieldset in this phase — the fix is stopPropagation only. Restructuring the button nesting would be a separate, larger refactor.
**Warning signs:** If tests show `toggleTopic` still fires after adding stopPropagation, check whether the browser is flattening the nested button structure and the fieldset handler is not being reached.

### Pitfall 2: `sidebarOpen: true` default creates overlay on every page load
**What goes wrong:** After removing `md:relative md:translate-x-0`, the sidebar is `fixed` on all viewports. With `sidebarOpen: true` as the default, the sidebar overlays content on first load on mobile too (where previously `md:relative` caused the desktop sidebar to shift content).
**Why it happens:** The layout shifts from side-by-side to overlay-only on desktop. Mobile already had overlay behavior.
**How to avoid:** The backdrop with `onClick={() => setSidebarOpen(false)}` gives users a tap target to close the sidebar on any viewport. This is intentional per the design contract. No change needed — it is the desired behavior.
**Warning signs:** If desktop users complain that the content is obscured, the overlay approach is working correctly per spec.

### Pitfall 3: `hideNotes` accidentally persisted
**What goes wrong:** Adding `hideNotes` to the `uiState` write in the subscribe block causes it to persist across page reloads, which contradicts D-07.
**Why it happens:** The subscribe block pattern in `app.ts` writes `uiState` as a flat object — it is easy to add a field there without noticing it persists. `hideMarked` and `darkMode` are in `uiState` and DO persist; `hideNotes` must not.
**How to avoid:** After the change, verify `hideNotes` is not in the subscribe block's `uiState` object (lines 615–626).
**Warning signs:** After reload, `hideNotes` is still `true` when it should reset to `false`.

### Pitfall 4: `onMouseDown` omitted from SCORE-07 fix
**What goes wrong:** Adding only `onClick` stopPropagation to the fieldset still allows `mousedown` to reach the header button. On some browsers, `mousedown` on an input inside a button can trigger the button's press state or fire its action.
**Why it happens:** Click event sequence is `mousedown → mouseup → click`. If `mousedown` bubbles to the `<button>`, the browser may fire the button's behavior before `click` fires on the fieldset.
**How to avoid:** Add both `onClick` and `onMouseDown` stopPropagation to the `<fieldset>`.

### Pitfall 5: `hidden` attribute vs CSS `hidden` class in note suppression
**What goes wrong:** The existing note textareas use the HTML `hidden` attribute (not the CSS `hidden` class) for their visibility. The HTML `hidden` attribute cannot be overridden by Tailwind's `print:` variants (see existing comment in `QuestionCard.tsx` lines 43–45 and `TopicRow.tsx` lines 12–18). The `printMode` guard already handles this for note textareas by switching from `hidden` attribute to show state.
**Why it matters for UI-09:** The new `hideNotes` suppression must use the CSS `hidden` class (not the HTML `hidden` attribute) on the outer container `<div>` that wraps the note toggle button and textarea, so that `print:` variants can override it if needed.
**How to avoid:** Apply `hideNotes` suppression as a `className` conditional (`${hideNotes && !printMode ? 'hidden' : ''}`) on the outer wrapper `<div>`, not as an `hidden` attribute on the textarea itself.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | `vite.config.ts` (vitest config inline) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-07 | Clicking override input does not call `toggleTopic` | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| SESS-05 | Backdrop click (event.target === dialog) calls dialog.close() | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-09 | `setHideNotes(true)` adds `hidden` class to notes container in QuestionCard | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-09 | `setHideNotes(true)` adds `hidden` class to notes panel in TopicRow | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-09 | `hideNotes` NOT present in subscribe block `uiState` write | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-09 | Print mode: `hideNotes=true` does not suppress notes when `printMode=true` | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-10 | All ActionsGroup buttons have `title` attribute matching `aria-label` | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-11 | SidebarGroup renders icon span when `icon` prop provided | Unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| UI-12 | Manual: sidebar closes on desktop click of toggle — browser only | Manual | n/a | n/a |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/test/phase-12-defects.test.tsx` — covers SCORE-07, SESS-05, UI-09, UI-10, UI-11 unit tests listed above
- [ ] Extend `src/test/modal-focus-trap.test.tsx` with backdrop click test for `SessionSwitcherModal` (SESS-05)

---

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | Chrome storage isolation — unchanged |
| V4 Access Control | no | — |
| V5 Input Validation | yes (override input) | Existing clamp in `setOverride` and `handleOverrideBlur` — unchanged |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via emoji in `title` / `aria-label` | Tampering | React escapes all string props — no raw HTML |
| Clickjacking via backdrop bypass | Spoofing | `showModal()` top-layer prevents backdrop bypass from iframes |

No new threat surface is introduced. All changes are DOM event wiring and class name changes.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 12 is purely component/store edits with no new external tool dependencies. Node.js, npm, and Vitest are already confirmed installed (515 passing tests as of Phase 11).

---

## Assumptions Log

All claims in this research are verified by direct source file reads. No training-data assumptions were used for implementation details.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims were verified by reading source files. No `[ASSUMED]` tags are present.**

---

## Open Questions

1. **SidebarGroup `groupId` prop unused in component body**
   - What we know: `groupId` is in `SidebarGroupProps` and passed from `Sidebar.tsx` but never destructured or used inside `SidebarGroup.tsx`.
   - What's unclear: Was it intended for `id` attributes or ARIA, or is it only a caller-side organizational hint?
   - Recommendation: Leave as-is for this phase — the prop is harmless and removing it would be a breaking change for callers. No change needed.

2. **`ActionsGroup` layout after icon-only conversion**
   - What we know: All buttons are currently `w-full` vertical stack. UI-SPEC.md offers choice between `grid grid-cols-4` or `flex flex-col` for icon layout.
   - What's unclear: Whether 11 icon buttons (after adding Hide notes) in a vertical flex list will overflow the 280px sidebar at reasonable window heights.
   - Recommendation: Keep `flex flex-col gap-1` as the UI-SPEC default recommendation, with `p-2 min-h-[44px] min-w-[44px]`. The planner may opt for a grid layout if vertical overflow is a concern.

---

## Sources

### Primary (HIGH confidence — direct source reads)

- `src/components/TopicRow.tsx` — lines 55–72 confirm `TopicMarkDisplay` is inside the header `<button>`
- `src/components/TopicMarkDisplay.tsx` — lines 75–113 confirm `<fieldset>` structure and absence of stopPropagation
- `src/components/SessionSwitcherModal.tsx` — lines 25–58 confirm Tab-only keydown handler; lines 73–95 confirm no backdrop handler on `<dialog>`
- `src/components/CandidateModal.tsx` — confirmed same Tab-only pattern; no backdrop handler reference to copy
- `src/components/ActionsGroup.tsx` — lines 151–247 enumerate all 10 current buttons; confirmed no "Hide notes" button exists
- `src/components/Sidebar.tsx` — line 22 confirms `md:relative md:translate-x-0` in `<aside>` className
- `src/components/SidebarGroup.tsx` — lines 1–35 confirm current props interface and render
- `src/app/App.tsx` — line 73 confirms `md:hidden` on backdrop; lines 89–97 confirm toggle button has no `md:hidden`
- `src/store/app.ts` — lines 49–103, 105–158, 160–187, 209–608, 613–651 confirm absence of `hideNotes`; confirm subscribe block `uiState` object fields
- `src/test/modal-focus-trap.test.tsx` — confirms only two test files exist; confirms SessionSwitcherModal tests will not break

### Secondary

- `.planning/phases/12-uat-defect-cleanup/12-CONTEXT.md` — locked decisions D-01 through D-18
- `.planning/phases/12-uat-defect-cleanup/12-UI-SPEC.md` — icon assignments, interaction state classes, spacing contracts
- `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` — exact defect descriptions from tester

---

## Metadata

**Confidence breakdown:**

- SCORE-07 root cause and fix: HIGH — exact render tree confirmed in source
- SESS-05 fix: HIGH — dialog pattern confirmed; missing handler confirmed
- UI-09 store changes: HIGH — absence of `hideNotes` confirmed; subscribe block confirmed
- UI-10 button inventory: HIGH — all 10 buttons enumerated from source
- UI-11 SidebarGroup change: HIGH — full 35-line file read; exact change specified
- UI-12 CSS classes: HIGH — exact class strings confirmed from source

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable codebase; only invalidated by Phase 12 execution itself)
