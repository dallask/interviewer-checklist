# Phase 12: UAT Defect Cleanup - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 12 closes the six small-touch defects surfaced during the v1.0 Chrome Web Store smoke test. Each fix is an isolated surgical change to one component or one store action. No new capabilities, no new routes, no schema changes.

**In scope:**
- SCORE-07: Stop topic override dropdown from collapsing/expanding its parent topic section
- SESS-05: Session switcher modal — backdrop click close, Esc close (if not already wired), visible Close button, rendered as a proper overlay above all sidebar content
- UI-09: Wire the "Hide notes" ActionsGroup toggle to actually hide/show all note areas (per-question and per-topic)
- UI-12: Sidebar collapse/expand works on ≥768px desktop (currently pinned visible via `md:translate-x-0`)
- UI-10: Sidebar Actions buttons render as icon-only with `title` tooltips
- UI-11: Sidebar section titles (Search, Difficulty, Sections, Actions) gain a leading icon before their text label

**Out of scope:**
- Compact QuestionCard redesign (Phase 15 — SCORE-08)
- Sidebar sticky header, candidate button, final-mark progress (Phase 15 — UI-13)
- Credit footer / About modal (Phase 15 — UI-14, UI-15)
- Filter "All rows" + counts (Phase 13)
- Editable bank (Phase 14)

</domain>

<decisions>
## Implementation Decisions

### SCORE-07: Override Dropdown / Topic Toggle Isolation

- **D-01: Stop propagation at the override control container.** Add `e.stopPropagation()` (and `e.preventDefault()` on `mousedown` if needed) to the override dropdown/select wrapper in `TopicRow.tsx` so clicks on the override control do not bubble to the topic header click handler that toggles `topicOpen`.
- **D-02: No new state, no new action.** The override control and topic header collapse are independent — stopPropagation at the DOM event level is the minimum viable fix.

### SESS-05: Session Switcher Modal — Backdrop Close

- **D-03: Backdrop close via `onClick` on the `<dialog>` element itself.** The native `<dialog>` with `showModal()` renders in the top layer, so it is already above the sidebar regardless of z-index. The current Close button (×) already works. Add a `mousedown` (or `click`) handler on the `<dialog>` element: if `event.target === dialogRef.current` the user clicked the backdrop area, so call `dialogRef.current.close()`.
- **D-04: Esc is natively handled by `<dialog>` — no extra wiring needed.** Confirm `keydown` handler does not accidentally swallow Esc.
- **D-05: The Close button already exists** (`#close-session-switcher`) and calls `dialogRef.current?.close()`. No changes needed for the close button itself.

### UI-09: Hide Notes — Store State + Component Wiring

- **D-06: New `hideNotes: boolean` field in `AppState`** (default `false`), with a `setHideNotes: (v: boolean) => void` action. This mirrors the existing `darkMode` boolean pattern exactly.
- **D-07: `hideNotes` is NOT persisted to `chrome.storage.local`.** It is a per-session UI preference that resets on reload, like `topicOpen`. The subscribe block in `app.ts` must NOT write it to storage.
- **D-08: Components read `hideNotes` from the store and conditionally render notes:**
  - `QuestionCard.tsx` — hide the note textarea area (`notes-${questionId}`) when `hideNotes === true`
  - `TopicRow.tsx` — hide the per-topic notes textarea when `hideNotes === true`
  - Both must still reveal their note areas during print (the existing `print:` Tailwind override in QuestionCard for notes with content must be preserved — D-07 exception: `printMode` already forces reveal)
- **D-09: ActionsGroup "Hide notes" button** already exists in the UI (it renders text). Wire its `onClick` to `setHideNotes(!hideNotes)` and add visual active state (e.g., `aria-pressed` + highlight class) when `hideNotes === true`.

### UI-12: Sidebar Desktop Toggle

- **D-10: Remove responsive-breakpoint overrides from `Sidebar.tsx`.** Currently `md:relative md:translate-x-0` pins the sidebar visible at ≥768px. Remove these classes so `sidebarOpen` from the store is the sole visibility signal on every viewport.
- **D-11: Remove `md:hidden` from the backdrop overlay in `App.tsx`.** The backdrop must be shown whenever the sidebar is open (handles mobile + desktop floating overlay). 
- **D-12: Default `sidebarOpen` to `true` in the store initial state.** Desktop users expect the sidebar open on first load. No media-query JS detection needed — `true` is the right universal default.
- **D-13: The "Open sidebar" toggle button in `App.tsx`** (currently `md:hidden`?) must be visible at ALL viewports. Verify and remove the breakpoint hide class if present.

### UI-10: Actions Buttons — Icon-Only with Tooltips

- **D-14: Use native `title` attribute for tooltips.** Zero dependency, accessible via browser tooltip, consistent with the existing icon button pattern. No custom tooltip component needed.
- **D-15: Remove visible text labels from Actions buttons.** Keep `aria-label` (already present for screen readers). Add `title="[action name]"` that matches the existing `aria-label` text.
- **D-16: Icons for Actions buttons:** Use emoji or inline SVG character references that match the action intent. Specific icons are Claude's discretion — see specifics below for guidance.

### UI-11: Sidebar Section Title Icons

- **D-17: Add optional `icon?: ReactNode` prop to `SidebarGroup`.** Render it before the `<span>{label}</span>` inside the button: `{icon && <span className="mr-2">{icon}</span>}`. Backwards-compatible: groups that don't receive `icon` render exactly as before.
- **D-18: Icons to add** (in `Sidebar.tsx` or wherever `SidebarGroup` is mounted):
  - **Search** — 🔍
  - **Difficulty** — ◆ or 🎯 (Claude's discretion)
  - **Sections** — 📋
  - **Actions** — ⚡ or ⋮ (Claude's discretion)

### Claude's Discretion

- Exact icon choices for UI-10 Actions buttons and UI-11 Difficulty/Actions section labels — use judgment given the filter-icon precedent (emoji used for section/difficulty rows in Phase 13)
- Whether to use a CSS class toggle (`hidden`) or conditional rendering (`{!hideNotes && ...}`) for UI-09 — either is fine; prefer `hidden` class if it avoids React re-mount
- Whether to apply `e.stopPropagation()` at the `<select>` element level or its wrapper div for SCORE-07

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope

- `.planning/REQUIREMENTS.md` §Score, Sessions, Sidebar Shell — SCORE-07, SESS-05, UI-09, UI-10, UI-11, UI-12 are the locked requirements
- `.planning/ROADMAP.md` §Phase 12 — Goal + 5 success criteria are the verification target

### Component files to modify

- `src/components/TopicRow.tsx` — SCORE-07: override dropdown event isolation
- `src/components/SessionSwitcherModal.tsx` — SESS-05: backdrop click close
- `src/components/QuestionCard.tsx` — UI-09: hide notes wiring
- `src/components/ContentTree.tsx` or `TopicRow.tsx` — UI-09: per-topic notes
- `src/components/Sidebar.tsx` — UI-12: remove `md:translate-x-0 md:relative`; UI-11: add icons to SidebarGroup instances
- `src/app/App.tsx` — UI-12: remove `md:hidden` from backdrop; sidebar toggle visible at all viewports
- `src/components/ActionsGroup.tsx` — UI-09: wire Hide notes toggle; UI-10: icon-only buttons
- `src/components/SidebarGroup.tsx` — UI-11: add `icon?: ReactNode` prop

### Store

- `src/store/app.ts` — UI-09: add `hideNotes: boolean`, `setHideNotes` action (not persisted)

### UAT source-of-truth

- `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` — D1 (SCORE-07), D2 (SESS-05), D3 (UI-09), D6 (UI-10), D7 (UI-11), D8 (UI-12) are the exact defects

### Modal close pattern reference

- `src/components/CandidateModal.tsx` — existing `<dialog>` backdrop/Esc pattern to follow
- `src/test/modal-focus-trap.test.tsx` — existing modal test patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `CandidateModal.tsx` — same `<dialog>` pattern with `showModal()`, focus trap, Esc close via native behavior; use as the reference for SESS-05 backdrop click pattern
- `UpdateBanner.tsx` / `MigrationErrorBanner.tsx` — sticky top UI patterns
- `SidebarGroup.tsx` — receives `label`, `isOpen`, `onToggle`, `children`; add `icon` prop here
- `useAppStore` boolean state pattern (`darkMode`, `hideMarked`) — mirror for `hideNotes`

### Established Patterns

- `md:hidden` / `md:relative` breakpoint classes control mobile-only sidebar overlay — these are the classes to REMOVE for UI-12
- `aria-label` + `title` on icon buttons — already used on some controls; extend to all Actions buttons for UI-10
- `e.stopPropagation()` used in `SessionRow.tsx` rename/delete controls — same pattern for SCORE-07
- Native `<dialog>.showModal()` for all modals (AiPromptModal, CandidateModal, ImportPreviewModal, SessionSwitcherModal)

### Integration Points

- `hideNotes` state must NOT be in the `subscribe` block's `sessionSnapshot` write (it's UI-only, not session data)
- `TopicRow.tsx` note area: look for the `topicNotesOpen` state and note textarea rendering — `hideNotes` should override this
- `QuestionCard.tsx` existing print-reveal logic: `printMode` forces note areas visible for print; `hideNotes` must not override print mode

</code_context>

<specifics>
## Specific Ideas

- UAT report `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` is the ground truth — planner must read it to see exact tester feedback for each defect
- SESS-05: the tester complained the modal "renders inside the sidebar" — confirmed the fix is removing sidebar z-index interference, NOT a layout change. The `<dialog>` top layer already solves this when `showModal()` is called.
- UI-12: tester was on desktop; confirmed `md:translate-x-0` is the root cause — removing it is the minimal fix

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-uat-defect-cleanup*
*Context gathered: 2026-06-18*
