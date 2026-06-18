# Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the extension ready for real users: a welcome tab onboards first-time users, keyboard shortcuts work from any non-input context, all existing modals are verified to trap focus correctly, print output is clean, and returning users after a version bump see a dismissible update banner with CHANGELOG access.

Covers requirements POLISH-01 through POLISH-07.

</domain>

<decisions>
## Implementation Decisions

### Focus Trap Approach (POLISH-04)
- Keep the native `<dialog>` element pattern established in Phases 5–8 — all 5 modals (CandidateModal, ResetConfirmDialog, SessionSwitcherModal, ImportPreviewModal, AiPromptModal) already implement the verbatim focus-trap useEffect from ResetConfirmDialog.tsx
- Satisfy POLISH-04 by auditing all 5 modals for compliance (Tab/Shift+Tab trap + focus restore to trigger) rather than migrating to Radix Dialog or Headless UI
- No shared `useFocusTrap` hook or utility extraction — pattern is already consistently applied verbatim
- Write integration tests confirming all 5 modals trap focus correctly

### Welcome Tab Design (POLISH-01)
- Separate `welcome.html` page (standard MV3 extension pattern) opened via `chrome.tabs.create({url: 'welcome.html'})` from background.js on `chrome.runtime.onInstalled` reason==='install'
- `hasSeenWelcome` flag in `chrome.storage.local` prevents re-opening after first visit
- Demo session: created programmatically via the existing storage API at extension load time — seeded with example candidate and a few pre-scored questions so the user sees a populated interface
- Pin-to-toolbar nudge: static SVG/image showing the puzzle-piece icon location + text instruction ("Click the puzzle piece → find the extension → click the pin icon")
- Two audience flows: short paragraph each (no interactivity on welcome page) explaining interviewer and candidate use cases

### Keyboard Shortcuts & Update Banner
- `/` keyboard shortcut: focus existing search/filter input in the sidebar (per POLISH-03 spec)
- `\` toggles sidebar collapse
- `Esc` clears search / closes active modal (from non-input context only)
- `_execute_action` global shortcut declared in manifest via `chrome.commands` (POLISH-02)
- All shortcuts ignore when focus is inside an `input`, `textarea`, or `[contenteditable]`
- Update banner: top sticky banner above the question list, immediately visible on open (POLISH-07)
- Update banner persists until explicitly dismissed — stores `dismissedUpdateVersion` in `chrome.storage.local`
- CHANGELOG viewer: inline collapsible in the sidebar footer area (no new tab) per POLISH-06

### Print CSS & Version Display (POLISH-05, POLISH-06)
- Print CSS via Tailwind `print:` variants in component JSX — no separate CSS file
- "Expand all on print" implemented via `usePrintExpansion` hook that calls `expandAll()` on `window.beforeprint` and restores state on `window.afterprint` — CSS-only approach is impossible because `@tanstack/react-virtual` never renders collapsed rows to the DOM; CSS `print:block` cannot make non-rendered elements appear (verified from source in RESEARCH.md). User authorized JS hook override 2026-06-17.
- App version displayed in sidebar footer below sidebar controls (the sidebar already has a footer area from Phase 4)
- `chrome.runtime.getManifest().version` used to read version at runtime

### Claude's Discretion
- Exact welcome page visual design (layout, hero section, colors within Tailwind design system)
- Specific CHANGELOG content format and viewer UI details
- Keyboard shortcut event handling edge cases (e.g., which key codes, modifier handling)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ResetConfirmDialog.tsx` — focus trap useEffect (source of truth for verbatim pattern used in all modals)
- `src/components/ActionsGroup.tsx` — sidebar footer area exists from Phase 4
- `src/store/app.ts` — `createSession()`, `renameSession()`, scoring state — usable for seeding demo session
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` for demo session data
- Background service worker already exists from Phase 1 scaffold

### Established Patterns
- Tailwind dark-mode via `dark:` variants; `print:` variants for print CSS
- Chrome extension MV3 background service worker for lifecycle events
- `chrome.storage.local` for persistent flags (hasSeenWelcome, dismissedUpdateVersion)
- Keyboard event handling: document-level `keydown` listener with `useEffect` in a hook
- All modals: native `<dialog>`, never set `open` attribute, focus trap + restore

### Integration Points
- `public/background.js` or `src/background.ts` — welcome tab open on install, update detection
- `public/welcome.html` (new file) — standalone MV3 welcome page
- `src/components/Sidebar.tsx` or App.tsx — keyboard shortcut handler attachment
- `src/components/ActionsGroup.tsx` or App.tsx — update banner render
- `manifest.json` — `commands` key for `_execute_action`

</code_context>

<specifics>
## Specific Ideas

- Welcome page should be a standalone `public/welcome.html` + `welcome.tsx` React app (separate Vite entry point) or a simple static HTML page — Claude's discretion based on what the current Vite config supports
- Keyboard shortcuts: a `useKeyboardShortcuts` hook attached at App level, with a guard `if (document.activeElement.tagName === 'INPUT' || 'TEXTAREA')` to skip
- Update detection: compare `chrome.runtime.getManifest().version` against last-seen version stored in `chrome.storage.local` on app load

</specifics>

<deferred>
## Deferred Ideas

- Animated onboarding flow / interactive tutorial — out of scope
- Command palette (`/` opens a searchable command menu) — out of scope; `/` focuses existing search input only
- Print preview mode in-app — out of scope; CSS-only print is sufficient

</deferred>
