# Phase 4: Shell, Sidebar & Read-Only Content Tree - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse the full question bank in a polished, accessible shell with dark mode and sidebar filtering — no scoring yet. This phase delivers the visual shell, the four-group collapsible sidebar, search/filter/expand-all, dark mode toggle, and the read-only question tree. No scoring inputs, notes, or candidate fields are built here. Phase 5+ adds interactivity.

</domain>

<decisions>
## Implementation Decisions

### Layout & Component Architecture
- **CSS:** Tailwind v4 (already installed in Phase 1) — utility classes throughout, no CSS Modules
- **Dark mode:** `class="dark"` on `<html>` toggled by JS; persisted via StorageAdapter; Tailwind `dark:` variant for all dark styles; system preference (`prefers-color-scheme`) as initial default
- **State management:** First Zustand store created in Phase 4 — `useAppStore` in `src/store/app.ts`; wired to StorageAdapter.write() on every state change; sidebar collapsed/group-open states live here
- **Question tree rendering:** Virtualized list using `@tanstack/virtual` for 1067 questions grouped by section/topic — prevents DOM overload; flat row model with section/topic/question row types

### Sidebar Features & Filtering
- **Search debounce:** 150ms trailing debounce on search input; searches question names, descriptions, tags, and full question text; shows live result count
- **Filter persistence:** Multi-select difficulty + section filters in Zustand store (same `useAppStore`), persisted via StorageAdapter — survive sessions
- **Section labels with marks:** Section filter shows group name + placeholder mark "—" in Phase 4 (scoring state empty); marks populate in Phase 5 when scoring engine is wired
- **Collapse/expand all:** "Expand all" and "Collapse all" buttons in sidebar Actions group; "Hide already-marked topics" toggle (always off in Phase 4)

### Accessibility & Animation
- **Skip link:** `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` — visible on keyboard focus, hidden otherwise
- **Sidebar ARIA:** `aria-expanded` on sidebar toggle button; `<aside aria-label="Filters">` with `role="complementary"`; `aria-pressed` on filter buttons
- **Sidebar animation:** `transition-transform duration-200` CSS on sidebar panel; wrapped in `@media (prefers-reduced-motion: reduce)` override to `transition: none` — matches UI-08
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` on all interactive elements via Tailwind

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` for the content tree
- `src/storage/index.ts` — `storageAdapter` singleton for persistence
- `src/storage/types.ts` — V2Schema shape (sidebar state goes in the session data)
- `src/scoring/index.ts` — scoring types for marks (read-only in Phase 4, populated Phase 5)
- `src/app/App.tsx` — Phase 1 placeholder, to be replaced by full shell layout
- `src/app/main.tsx` — already awaits `bootstrap()`, registers lifecycle listeners

### Established Patterns
- TypeScript strict, `.js` extensions on relative imports
- Biome 2.5.0 (no ESLint/Prettier), named exports only
- Vitest 4.1.9 with vitest-chrome setup, coverage on src/scoring + src/storage
- Component tests: co-located `*.test.tsx` files

### Integration Points
- Phase 5 adds scoring inputs to the question tree cards
- Phase 5 wires `scoring engine` → Zustand → live marks in sidebar section labels
- Phase 3 StorageAdapter's `flushPending()` is already called on visibility change
- Phase 4 Zustand store must call `storageAdapter.write()` on every state mutation

</code_context>

<specifics>
## Specific Ideas

- The prototype `stack-checklist.html` has the exact sidebar group structure: Search / Difficulty / Sections / Actions
- `<main id="main-content">` is the skip link target
- Sidebar overlays on narrow viewports (≤768px) — use `position: fixed` overlay with backdrop
- Dark mode toggle in sidebar Actions group or top-right corner of the page
- Question card shows: name, description, difficulty pill, tag badge — read-only in Phase 4
- Keyboard shortcuts declared in Phase 9 (`/` focus search, `\` toggle sidebar) — not in Phase 4

</specifics>

<deferred>
## Deferred Ideas

- Scoring inputs on question cards (Phase 5)
- Session switcher (Phase 6)
- YAML export/import button (Phase 7)
- AI prompt button (Phase 8)
- Print stylesheet (Phase 9)
- `chrome.commands` keyboard shortcuts (Phase 9)

</deferred>
