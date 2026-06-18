# Phase 12: UAT Defect Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 12-uat-defect-cleanup
**Areas discussed:** Override dropdown isolation, Modal backdrop close, Hide notes wiring, Sidebar desktop toggle, Actions icon-only tooltips, Section title icons
**Mode:** --auto (all decisions auto-selected via recommended defaults)

---

## Override Dropdown Isolation (SCORE-07)

| Option | Description | Selected |
|--------|-------------|----------|
| stopPropagation at dropdown wrapper | Add `e.stopPropagation()` to the override control container in TopicRow — minimal, targeted fix | ✓ |
| Separate click target | Restructure TopicRow so override control and topic header are fully separate DOM zones | |

**Auto-selected:** stopPropagation at dropdown wrapper (recommended — minimal change)
**Notes:** Matches existing pattern in SessionRow.tsx for rename/delete controls.

---

## Modal Backdrop Close (SESS-05)

| Option | Description | Selected |
|--------|-------------|----------|
| onClick on dialog element | Check `event.target === dialogRef.current` on the `<dialog>` click handler — standard backdrop detection | ✓ |
| Separate backdrop div | Render a positioned div behind the dialog for click handling | |

**Auto-selected:** onClick on dialog element (recommended — idiomatic native dialog pattern)
**Notes:** `<dialog>` with `showModal()` uses the top layer — already above sidebar z-index. Esc is native. Close button already exists. Only backdrop click needed.

---

## Hide Notes Wiring (UI-09)

| Option | Description | Selected |
|--------|-------------|----------|
| Store boolean + component reads | New `hideNotes: boolean` in AppState (not persisted), components read via useAppStore | ✓ |
| CSS-only approach | Add a global CSS class to body and use CSS selectors | |

**Auto-selected:** Store boolean + component reads (recommended — consistent with existing store patterns)
**Notes:** Not persisted to chrome.storage.local. Print mode must still force notes visible (existing behavior preserved).

---

## Sidebar Desktop Toggle (UI-12)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove md: breakpoint classes | Remove `md:translate-x-0 md:relative` from Sidebar; `sidebarOpen` controls all viewports | ✓ |
| Media query JS detection | Detect viewport width in JS and set initial sidebarOpen accordingly | |

**Auto-selected:** Remove md: breakpoint classes (recommended — minimal, declarative)
**Notes:** Default `sidebarOpen: true` in store. Removes `md:hidden` from backdrop as well.

---

## Actions Icon-Only Tooltips (UI-10)

| Option | Description | Selected |
|--------|-------------|----------|
| Native title attribute | Add `title` matching `aria-label`; remove visible text | ✓ |
| Custom tooltip component | Build/import a tooltip component | |

**Auto-selected:** Native title attribute (recommended — zero dependency, accessible)

---

## Section Title Icons (UI-11)

| Option | Description | Selected |
|--------|-------------|----------|
| icon prop on SidebarGroup | Add optional `icon?: ReactNode` prop; render before label text | ✓ |
| Hard-code icons per group | Inline icons directly in each SidebarGroup render call | |

**Auto-selected:** icon prop on SidebarGroup (recommended — backwards compatible, reusable)
**Notes:** Search 🔍, Sections 📋; Difficulty and Actions icons at Claude's discretion.

---

## Claude's Discretion

- Exact icon choices for Difficulty and Actions section labels
- CSS class toggle vs conditional rendering for hide-notes
- Whether stopPropagation on `<select>` element or wrapper div

## Deferred Ideas

None.
