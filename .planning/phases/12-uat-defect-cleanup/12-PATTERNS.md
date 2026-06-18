# Phase 12: UAT Defect Cleanup - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 8 files to modify
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/TopicRow.tsx` | component | event-driven | `src/components/SessionRow.tsx` (stopPropagation pattern) | role-match |
| `src/components/SessionSwitcherModal.tsx` | component | request-response | `src/components/CandidateModal.tsx` | exact |
| `src/store/app.ts` | store | CRUD | existing `hideMarked` / `darkMode` boolean fields in same file | exact |
| `src/components/ActionsGroup.tsx` | component | event-driven | itself — `hideMarked` toggle already wired with `aria-pressed` | exact |
| `src/components/SidebarGroup.tsx` | component | request-response | itself — existing `label` prop, add `icon` alongside | exact |
| `src/components/Sidebar.tsx` | component | request-response | `src/app/App.tsx` — `sidebarOpen` conditional class pattern | role-match |
| `src/app/App.tsx` | layout | event-driven | itself — backdrop `onClick` + `sidebarOpen` toggle already present | exact |
| `src/components/QuestionCard.tsx` | component | event-driven | `src/components/TopicRow.tsx` — `hidden` attr + `printMode` override | role-match |

---

## Pattern Assignments

### SCORE-07: `src/components/TopicRow.tsx` — stop override click from toggling topic

**Problem:** Clicks on `TopicMarkDisplay` (the override `<input>` and clear `<button>` rendered inside the topic header `<button>`) bubble up and fire the `onClick={() => toggleTopic(topicId)}` on the outer `<button>`.

**Analog for stopPropagation:** `src/components/SessionRow.tsx` lines 106–131 — the rename/duplicate/delete buttons inside a list item that has its own click target. Each inner button has its own `onClick` without stopping propagation there, but the structural lesson is clear: any interactive element nested inside a larger clickable area needs isolation.

**Direct fix pattern — wrap TopicMarkDisplay in a stopPropagation container:**

```tsx
// In TopicRow.tsx — wrap the <TopicMarkDisplay> already inside the header <button>
// with a click-stopper span/div so the input and clear button don't bubble.
<span
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
>
  <TopicMarkDisplay topicId={topicId} topic={row.topic} />
</span>
```

Note: `TopicMarkDisplay` renders a `<fieldset>` containing an `<input>` and a `<button>`. These are already focusable/interactive but are nested inside a `<button>` element in TopicRow. The stopPropagation wrapper is applied on the container, not inside TopicMarkDisplay itself (per D-02: no new state, no new action, minimal change).

---

### SESS-05: `src/components/SessionSwitcherModal.tsx` — backdrop click close

**Analog:** `src/components/CandidateModal.tsx` — identical `<dialog>` pattern: `ref={dialogRef}`, `showModal()` called imperatively, Esc close is native, focus-trap via `keydown` on `dialogEl`.

**CandidateModal structure to mirror** (lines 98–104):
```tsx
<dialog
  ref={dialogRef}
  aria-labelledby="candidate-modal-title"
  className="fixed inset-0 m-auto w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

**Backdrop click pattern to ADD to `SessionSwitcherModal.tsx`** — add an `onClick` handler on the `<dialog>` element itself (per D-03). When `event.target === dialogRef.current` the user clicked the native backdrop (outside the dialog box content):

```tsx
<dialog
  ref={dialogRef}
  aria-labelledby="session-switcher-title"
  onClick={(e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current.close();
    }
  }}
  className="..."
>
```

**Existing close button** (SessionSwitcherModal.tsx lines 87–94) already works — no change needed:
```tsx
<button
  type="button"
  aria-label="Close sessions"
  id="close-session-switcher"
  onClick={() => dialogRef.current?.close()}
  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ×
</button>
```

**Existing focus-trap pattern** in SessionSwitcherModal.tsx lines 25–58 already mirrors CandidateModal exactly (comment on line 24 says "verbatim from CandidateModal.tsx"). No change needed there.

---

### UI-09: `src/store/app.ts` — add `hideNotes: boolean` state + action

**Closest analog:** `hideMarked` boolean in the same file.

**State field pattern** (app.ts lines 65–66):
```ts
/** Whether to hide topics with all questions already marked */
hideMarked: boolean;
```
Copy this pattern for `hideNotes`:
```ts
/** Whether to hide all note areas (per-question and per-topic) — UI-only, not persisted */
hideNotes: boolean;
```

**Default value pattern** (app.ts line 168):
```ts
hideMarked: false,
```
Add alongside:
```ts
hideNotes: false,
```

**Action signature pattern** (app.ts line 115):
```ts
setHideMarked: (v: boolean) => void;
```
Add:
```ts
setHideNotes: (v: boolean) => void;
```

**Action implementation pattern** (app.ts line 280):
```ts
setHideMarked: (v) => set({ hideMarked: v }),
```
Add:
```ts
setHideNotes: (v) => set({ hideNotes: v }),
```

**CRITICAL — subscribe block exclusion** (app.ts lines 613–626): `hideNotes` must NOT appear in the `uiState` object written to storage. The subscribe block already writes `hideMarked` and `darkMode` — `hideNotes` is intentionally absent per D-07. The existing `uiState` write block stays unchanged.

---

### UI-09: `src/components/ActionsGroup.tsx` — wire "Hide notes" button

**Analog for toggle button with `aria-pressed`** — existing `hideMarked` toggle in ActionsGroup.tsx lines 183–189:
```tsx
<button
  type="button"
  aria-pressed={hideMarked}
  onClick={() => setHideMarked(!hideMarked)}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Hide marked topics
</button>
```

**Copy this pattern exactly** for the "Hide notes" button. Add `hideNotes` and `setHideNotes` selectors at the top of `ActionsGroup` (lines 30–33 pattern):
```tsx
const hideNotes = useAppStore((s) => s.hideNotes);
const setHideNotes = useAppStore((s) => s.setHideNotes);
```

Then wire the existing "Hide notes" button text to match this pattern with `aria-pressed={hideNotes}` and `onClick={() => setHideNotes(!hideNotes)}`.

---

### UI-09: `src/components/TopicRow.tsx` — hide topic notes area when `hideNotes === true`

**Analog:** existing `hidden` attribute logic on the topic note textarea (TopicRow.tsx line 90):
```tsx
hidden={!topicNotesOpen && !localTopicNote && !printMode}
```

**Pattern to extend:** add `hideNotes` as an additional hiding condition. Also hide the "Add topic notes" toggle button. Read `hideNotes` from store:
```tsx
const hideNotes = useAppStore((s) => s.hideNotes);
```

Apply to the textarea:
```tsx
hidden={hideNotes || (!topicNotesOpen && !localTopicNote && !printMode)}
```

Apply to the toggle button — wrap with conditional or add hidden class:
```tsx
// Hide the toggle button too when hideNotes is active (print:hidden already exists)
className={`... ${hideNotes ? 'hidden' : ''} print:hidden`}
```

`printMode` already takes priority because `printMode=true` causes `!printMode` to be `false`, which means the textarea's hidden condition becomes `false` — content shows. The `hideNotes` addition must be `hideNotes && !printMode` to preserve print behavior:
```tsx
hidden={(hideNotes && !printMode) || (!topicNotesOpen && !localTopicNote && !printMode)}
```

---

### UI-10: `src/components/ActionsGroup.tsx` — icon-only buttons with `title` tooltips

**Analog for icon-only button pattern:** `src/components/SessionRow.tsx` lines 106–131 — the rename/duplicate/delete controls use emoji glyphs (✎, ⧉, ×) with `aria-label` and no visible text label:
```tsx
<button
  type="button"
  aria-label={`Rename ${session.name}`}
  onClick={startRename}
  className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ✎
</button>
```

**Pattern for Actions buttons** (per D-14, D-15): keep `aria-label`, add `title` matching `aria-label`, replace visible text with icon glyph. Example for "Expand all":
```tsx
<button
  type="button"
  aria-label="Expand all"
  title="Expand all"
  onClick={expandAll}
  className="text-sm px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ⤢
</button>
```

Current buttons in ActionsGroup.tsx all use the same `className` pattern (lines 151–247). The class string stays the same — only the visible text becomes an icon glyph and `title` is added.

---

### UI-11: `src/components/SidebarGroup.tsx` — add optional `icon` prop

**Current component interface** (SidebarGroup.tsx lines 3–9):
```tsx
export interface SidebarGroupProps {
  groupId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}
```

**Pattern to add** (per D-17):
```tsx
export interface SidebarGroupProps {
  groupId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  icon?: ReactNode;  // optional — backwards-compatible
}
```

**Render pattern** — current button content (SidebarGroup.tsx lines 24–31):
```tsx
<button
  type="button"
  aria-expanded={isOpen}
  onClick={onToggle}
  className="min-h-[44px] w-full flex items-center justify-between px-4 font-semibold text-base text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  <span>{label}</span>
  <span className={`transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}>▾</span>
</button>
```

Update `<span>{label}</span>` to:
```tsx
<span className="flex items-center gap-2">
  {icon && <span aria-hidden="true">{icon}</span>}
  {label}
</span>
```

**Call sites in Sidebar.tsx** (lines 24–58) — add `icon` prop to each `<SidebarGroup>` instance:
```tsx
<SidebarGroup groupId="search" label="Search" icon="🔍" ...>
<SidebarGroup groupId="difficulty" label="Difficulty" icon="🎯" ...>
<SidebarGroup groupId="sections" label="Sections" icon="📋" ...>
<SidebarGroup groupId="actions" label="Actions" icon="⚡" ...>
```

---

### UI-12: `src/components/Sidebar.tsx` + `src/app/App.tsx` — sidebar controlled by store boolean only

**Current Sidebar className** (Sidebar.tsx line 22):
```tsx
className={`w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out motion-reduce:transition-none md:relative md:translate-x-0 fixed inset-y-0 left-0 z-50 print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
```

**Fix:** Remove `md:relative md:translate-x-0` so `sidebarOpen` is the only visibility signal at all viewports (per D-10). Result:
```tsx
className={`w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out motion-reduce:transition-none fixed inset-y-0 left-0 z-50 print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
```

**Current backdrop in App.tsx** (App.tsx lines 71–77):
```tsx
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 md:hidden print:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

**Fix:** Remove `md:hidden` so backdrop shows at all viewports when sidebar is open (per D-11):
```tsx
{sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-40 print:hidden"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

**Store default** (app.ts line 161): `sidebarOpen: true` — already set correctly (per D-12, no change needed).

**Sidebar toggle button in App.tsx** (lines 88–97): currently no breakpoint `hidden` class — it is already visible at all viewports. No change needed per D-13 verification:
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

---

## Shared Patterns

### Boolean store toggle (applies to UI-09 `hideNotes`, analog: `hideMarked`)

**Source:** `src/store/app.ts` lines 65, 115, 168, 280

```ts
// AppState field
hideMarked: boolean;

// AppActions signature
setHideMarked: (v: boolean) => void;

// DEFAULT_STATE
hideMarked: false,

// Implementation
setHideMarked: (v) => set({ hideMarked: v }),
```

Apply identical pattern for `hideNotes`. Difference: `hideNotes` is NOT added to the `uiState` subscribe write block (lines 614–626).

### `aria-pressed` toggle button (applies to UI-09 ActionsGroup "Hide notes")

**Source:** `src/components/ActionsGroup.tsx` lines 183–189

```tsx
<button
  type="button"
  aria-pressed={hideMarked}
  onClick={() => setHideMarked(!hideMarked)}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Hide marked topics
</button>
```

### Icon-only button with `aria-label` (applies to UI-10, analog: SessionRow controls)

**Source:** `src/components/SessionRow.tsx` lines 107–113

```tsx
<button
  type="button"
  aria-label={`Rename ${session.name}`}
  onClick={startRename}
  className="p-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  ✎
</button>
```

For UI-10, add `title="[action name]"` matching `aria-label` (D-14). SessionRow does not use `title` because these buttons are only hover-revealed in a list; Actions buttons are always visible and need browser tooltip discovery.

### `<dialog>` backdrop-click close (applies to SESS-05)

**Source:** `src/components/CandidateModal.tsx` — provides the base structure. The backdrop pattern itself does not exist yet in the codebase and must be added per D-03:

```tsx
// Add onClick on the <dialog> element
onClick={(e) => {
  if (e.target === dialogRef.current) {
    dialogRef.current.close();
  }
}}
```

This works because native `<dialog>` with `showModal()` renders in the top layer; the visible dialog box is the `::backdrop` pseudo-element. Clicks on the backdrop area have `event.target === dialog element` since no child element is hit.

### `hidden` HTML attribute with `printMode` override (applies to UI-09 note areas)

**Source:** `src/components/TopicRow.tsx` line 90

```tsx
hidden={!topicNotesOpen && !localTopicNote && !printMode}
```

The `hidden` HTML attribute (not a CSS class) is used because `print:*` Tailwind variants cannot override `hidden` (noted in code comment at TopicRow.tsx line 13–18 and in RESEARCH.md Pitfall 5). When extending this condition for `hideNotes`, `printMode` must still take priority:

```tsx
hidden={(hideNotes && !printMode) || (!topicNotesOpen && !localTopicNote && !printMode)}
```

---

## No Analog Found

None — all 6 fixes have direct codebase analogs.

---

## Metadata

**Analog search scope:** `src/components/`, `src/store/`, `src/app/`
**Files read:** 10
**Pattern extraction date:** 2026-06-18
