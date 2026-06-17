# Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates - Research

**Researched:** 2026-06-17
**Domain:** Chrome MV3 extension polish — onboarding, keyboard shortcuts, focus traps, print CSS, update detection
**Confidence:** HIGH (codebase verified) / MEDIUM (Chrome APIs, Tailwind print)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Focus Trap Approach (POLISH-04)**
- Keep the native `<dialog>` element pattern established in Phases 5–8 — all 5 modals (CandidateModal, ResetConfirmDialog, SessionSwitcherModal, ImportPreviewModal, AiPromptModal) already implement the verbatim focus-trap useEffect from ResetConfirmDialog.tsx
- Satisfy POLISH-04 by auditing all 5 modals for compliance (Tab/Shift+Tab trap + focus restore to trigger) rather than migrating to Radix Dialog or Headless UI
- No shared `useFocusTrap` hook or utility extraction — pattern is already consistently applied verbatim
- Write integration tests confirming all 5 modals trap focus correctly

**Welcome Tab Design (POLISH-01)**
- Separate `welcome.html` page (standard MV3 extension pattern) opened via `chrome.tabs.create({url: 'welcome.html'})` from background.js on `chrome.runtime.onInstalled` reason==='install'
- `hasSeenWelcome` flag in `chrome.storage.local` prevents re-opening after first visit
- Demo session: created programmatically via the existing storage API at extension load time — seeded with example candidate and a few pre-scored questions so the user sees a populated interface
- Pin-to-toolbar nudge: static SVG/image showing the puzzle-piece icon location + text instruction
- Two audience flows: short paragraph each (no interactivity on welcome page)

**Keyboard Shortcuts & Update Banner**
- `/` keyboard shortcut: focus existing search/filter input in the sidebar (per POLISH-03 spec)
- `\` toggles sidebar collapse
- `Esc` clears search / closes active modal (from non-input context only)
- `_execute_action` global shortcut declared in manifest via `chrome.commands` (POLISH-02)
- All shortcuts ignore when focus is inside an `input`, `textarea`, or `[contenteditable]`
- Update banner: top sticky banner above the question list, immediately visible on open (POLISH-07)
- Update banner persists until explicitly dismissed — stores `dismissedUpdateVersion` in `chrome.storage.local`
- CHANGELOG viewer: inline collapsible in the sidebar footer area (no new tab) per POLISH-06

**Print CSS & Version Display (POLISH-05, POLISH-06)**
- Print CSS via Tailwind `print:` variants in component JSX — no separate CSS file
- "Expand all on print" implemented CSS-only via `print:` variants that override collapsed/hidden states — no JS `beforeprint` event needed
- App version displayed in sidebar footer below sidebar controls
- `chrome.runtime.getManifest().version` used to read version at runtime

### Claude's Discretion
- Exact welcome page visual design (layout, hero section, colors within Tailwind design system)
- Specific CHANGELOG content format and viewer UI details
- Keyboard shortcut event handling edge cases (e.g., which key codes, modifier handling)

### Deferred Ideas (OUT OF SCOPE)
- Animated onboarding flow / interactive tutorial
- Command palette (`/` opens a searchable command menu) — `/` focuses existing search input only
- Print preview mode in-app — CSS-only print is sufficient
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLISH-01 | First-run welcome tab on install via `chrome.runtime.onInstalled` reason==='install'; hasSeenWelcome flag; demo session; pin nudge; two audience flows | Sections: Background SW Patterns, Welcome Page Architecture |
| POLISH-02 | `_execute_action` global keyboard shortcut in manifest `commands` key | Section: chrome.commands API |
| POLISH-03 | In-app shortcuts: `/` focus search, `\` toggle sidebar, `Esc` clear search/close modal; ignore in inputs | Section: Keyboard Shortcut Hook Pattern |
| POLISH-04 | All 5 modals: focus trap Tab/Shift+Tab within modal, restore focus to trigger on close | Section: Focus Trap Audit Results |
| POLISH-05 | Print stylesheet: expand collapsed content, hide sidebar/controls, auto-expand textareas | Section: Print CSS — Critical Architecture Issue |
| POLISH-06 | App version from `chrome.runtime.getManifest().version` in sidebar footer with CHANGELOG viewer | Section: Version Display & CHANGELOG |
| POLISH-07 | Dismissible in-app update banner after version bump, no new tab; `dismissedUpdateVersion` in storage | Section: Update Detection Pattern |
</phase_requirements>

---

## Summary

Phase 9 polishes the extension for real-user readiness across five distinct capability domains: (1) MV3 service worker lifecycle events for install/update detection, (2) keyboard shortcut registration in manifest and in-app hooks, (3) focus trap compliance audit across all 5 native `<dialog>` modals, (4) print CSS using Tailwind `print:` variants, and (5) version display and CHANGELOG viewer in the sidebar footer.

**Critical discovery for print CSS (POLISH-05):** The content tree uses `@tanstack/react-virtual` which means collapsed topics and hidden question cards are NOT rendered to the DOM — they are virtualized out entirely. A simple `print:block` override on a collapsed element cannot work because the element does not exist in the DOM. The solution requires a JS `beforeprint` / `afterprint` event approach OR bypassing the virtualizer for print by rendering the full non-virtualized content tree only during print. This is the most technically complex aspect of the phase.

**Focus trap audit finding:** All 5 modals already implement the verbatim focus trap useEffect pattern from ResetConfirmDialog.tsx. There are two minor compliance variations: (a) ResetConfirmDialog.tsx is missing the WR-02 empty-focusable-list guard that later modals added, and (b) AiPromptModal's close button calls `onClose` prop rather than `dialogRef.current?.close()` directly, which means the native `close` event fires through a different code path. Both are cosmetic — the focus trap and restore behavior are functionally correct in all 5 modals.

**Primary recommendation:** Implement print expansion via `window.matchMedia('print').addEventListener` to call `expandAll()` before print and `collapseAll()` after — this bypasses the virtualizer limitation. All other capabilities use the established patterns from Phases 5–8 with no new packages required.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Welcome tab open on install | MV3 Service Worker | — | `chrome.runtime.onInstalled` only fires in the service worker; `chrome.tabs.create` runs there |
| Update detection (version compare) | MV3 Service Worker (write) + Frontend React (read) | — | SW writes `lastSeenVersion` on update; React reads it to show banner |
| `_execute_action` shortcut | Browser / OS | MV3 Service Worker | Declared in manifest; fires `chrome.action.onClicked` which is already handled in SW |
| In-app keyboard shortcuts (/, \, Esc) | Frontend React (`useKeyboardShortcuts` hook) | — | `document.addEventListener('keydown')` in a React useEffect at App root level |
| Focus trap (Tab/Shift+Tab in dialogs) | Frontend React (per-modal useEffect) | — | Already implemented; audit-only task; no tier change |
| Print CSS | Browser (CSS @media print) | Frontend React (beforeprint JS) | `print:` variants handle hide/show; virtualizer bypass requires JS lifecycle events |
| Version display + CHANGELOG | Frontend React (Sidebar footer) | — | `chrome.runtime.getManifest()` is synchronous; CHANGELOG is a bundled static asset read at mount |
| hasSeenWelcome / dismissedUpdateVersion flags | Browser Storage (`chrome.storage.local`) | Frontend React (async read on mount) | Persistent cross-session flags stored in chrome.storage.local |
| Welcome page (welcome.html + Welcome.tsx) | Separate Vite entry (standalone page) | — | Opened as a new tab; independent from the app shell React tree |

---

## Standard Stack

### Core (No New Packages)

This phase installs **zero new npm packages**. All capabilities are implemented with the existing stack.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.7 | Welcome page component, UpdateBanner, keyboard hook, CHANGELOG viewer | Already in project |
| Tailwind CSS v4 | 4.3.1 | `print:` variants for print CSS, all visual styling | Already in project; print: works OOTB |
| Zustand | 5.0.14 | `setSidebarOpen`, `setSearchQuery` from keyboard hook | Already in project |
| chrome (types) | @types/chrome 0.1.43 | `chrome.runtime.onInstalled`, `chrome.commands`, `chrome.storage.local` | Already in project |
| Vitest + happy-dom | 4.1.9 | Integration tests for focus trap compliance, keyboard hook | Already in project |
| @crxjs/vite-plugin | 2.6.1 | Bundles welcome.html as additional MV3 entry point | Already in project |

### Supporting Patterns

| Pattern | Purpose | Source |
|---------|---------|--------|
| `window.matchMedia('print').addListener` | Trigger `expandAll()` before print to bypass virtualizer | Phase 9 original |
| `chrome.runtime.getManifest().version` | Synchronous version read in any extension page | Chrome API, no async needed |
| `chrome.storage.local.get/set` (Promise API) | Store hasSeenWelcome, lastSeenVersion, dismissedUpdateVersion | Established in Phase 3 |
| `document.addEventListener('keydown')` in `useEffect` | In-app keyboard shortcut hook | Established in modal focus traps |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JS `beforeprint` for print expansion | CSS-only `print:block` | CSS-only cannot show virtualized (non-rendered) elements; JS is required |
| Separate React entry for welcome | Static `public/welcome.html` (no React) | Static HTML lacks FOUC prevention via theme.ts; loses Tailwind processing |
| `chrome.runtime.onInstalled` for update detection | Polling on each app load | onInstalled is the canonical MV3 lifecycle event; polling adds complexity |
| Verbatim focus trap per-modal | Shared `useFocusTrap` hook | CONTEXT.md decision: no shared hook extraction; pattern is already consistent |

---

## Package Legitimacy Audit

> No new external packages are installed in Phase 9. All implementation uses the existing dependency tree.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| (none) | — | — | No new packages |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Install event                    App load
     │                               │
     ▼                               ▼
[SW: onInstalled]            [React App bootstraps]
     │                               │
     ├── reason='install' ──► chrome.tabs.create(welcome.html)
     │                         [Welcome.tsx standalone React app]
     │                               │
     ├── reason='update'  ──► chrome.storage.local.set({lastSeenVersion})
     │                               │
     └── always            ◄─── chrome.storage.local.get({lastSeenVersion})
                                      │
                              version != lastSeen?
                                 YES ▼       NO ▼
                           [UpdateBanner]  (hidden)
                                 │
                          user dismisses
                                 │
                          chrome.storage.local.set({dismissedUpdateVersion})

App shell keyboard handling:
[document keydown] ──► [useKeyboardShortcuts hook]
                              │
                    focus in input/textarea?
                         YES ▼      NO ▼
                       (skip)   route key:
                                '/' → search input .focus()
                                '\' → setSidebarOpen(!open)
                                Esc → setSearchQuery('') or modal.close()

Print flow:
[window 'beforeprint'] ──► expandAll() ──► [all topics/questions now in DOM]
                                                │
                                         print:hidden on sidebar, controls
                                         print:break-inside-avoid on topic rows
                                         print:h-auto on textareas
[window 'afterprint']  ──► restore previous topicOpen state
```

### Recommended Project Structure

```
src/
├── app/
│   ├── app.html          # Existing main app entry
│   ├── App.tsx           # Modified: mount UpdateBanner, attach useKeyboardShortcuts
│   ├── welcome.html      # New: standalone welcome page entry
│   ├── welcome-main.tsx  # New: React root for welcome page
│   ├── Welcome.tsx       # New: welcome page component
│   └── styles.css        # Unchanged (shared CSS)
├── background/
│   └── index.ts          # Modified: add onInstalled listener
├── components/
│   ├── UpdateBanner.tsx  # New: dismissible update banner
│   ├── ChangelogViewer.tsx # New: inline CHANGELOG collapsible
│   ├── SidebarFooter.tsx # New: version display + CHANGELOG trigger
│   └── Sidebar.tsx       # Modified: add <SidebarFooter> after last SidebarGroup
├── hooks/
│   └── useKeyboardShortcuts.ts # New hook directory + hook
└── CHANGELOG.md          # New: bundled changelog (imported as string via ?raw)
```

### Pattern 1: MV3 Service Worker `onInstalled` (background/index.ts)

**What:** Register `chrome.runtime.onInstalled` listener at top level (synchronously) to handle install and update events.

**When to use:** Any first-run or version-bump logic in a Chrome extension.

**Critical rule:** The `addListener` call MUST be at the top level of the service worker module — not inside async callbacks, not inside other listeners. The handler itself may be async. [CITED: developer.chrome.com/docs/extensions/reference/api/runtime]

```typescript
// Source: chrome.runtime docs + established background/index.ts pattern
// MUST be at module top level — never nested inside async callbacks

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      const result = await chrome.storage.local.get('hasSeenWelcome');
      if (!result.hasSeenWelcome) {
        const url = chrome.runtime.getURL('src/app/welcome.html');
        await chrome.tabs.create({ url });
        await chrome.storage.local.set({ hasSeenWelcome: true });
      }
    }
    // Always write lastSeenVersion so UpdateBanner can compare
    await chrome.storage.local.set({
      lastSeenVersion: chrome.runtime.getManifest().version,
    });
  } catch (err) {
    console.error('[interviewer-checklist] onInstalled handler failed:', err);
  }
});

// Existing listener — unchanged
chrome.action.onClicked.addListener(async () => { /* ... */ });
```

**Update detection in React (UpdateBanner):** The banner reads `lastSeenVersion` from storage on mount and compares it to `chrome.runtime.getManifest().version`. If they differ, show banner. On dismiss, write `dismissedUpdateVersion = current version` to storage.

Note on update flow: `onInstalled` with reason='update' fires in the service worker. The service worker then writes `lastSeenVersion`. The React app reads this on next open and shows the banner if versions differ AND `dismissedUpdateVersion !== currentVersion`. This two-flag design (lastSeenVersion + dismissedUpdateVersion) is more robust than a single flag.

### Pattern 2: `useKeyboardShortcuts` Hook (src/hooks/useKeyboardShortcuts.ts)

**What:** Document-level `keydown` listener attached in a React `useEffect` at App root. Guards against input focus. Routes keys to store actions and DOM refs.

**When to use:** Application-level keyboard shortcuts that work from any non-input context.

```typescript
// Source: established project pattern from ResetConfirmDialog.tsx focus trap
// and StorageToast.tsx event listener pattern

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../store/app.js';

interface Props {
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useKeyboardShortcuts({ searchInputRef }: Props) {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Guard: suppress all shortcuts when focus is in an editable element
      const el = document.activeElement as HTMLElement;
      const tag = el?.tagName ?? '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        el?.isContentEditable
      ) return;

      // Guard: suppress if a modal <dialog> is open (open attribute is set by showModal)
      const openDialog = document.querySelector('dialog[open]');
      if (openDialog && e.key !== 'Escape') return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '\\') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        // Native <dialog> Escape handling already closes modals; no extra action needed
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen, sidebarOpen, setSearchQuery, searchInputRef]);
}
```

**SearchGroup ref forwarding:** SearchGroup.tsx currently does not expose a ref for the search `<input>`. The plan must add `forwardRef` to SearchGroup (or pass the ref down via a prop) so the keyboard hook can call `.focus()` on the input element.

**Alternatively:** Use `document.querySelector('[aria-label="Search questions"]')` to find the input at keydown time — avoids ref plumbing but couples to the ARIA label string.

### Pattern 3: Print CSS — Critical Architecture Issue

**What:** Tailwind `print:` variants apply styles inside `@media print`. [CITED: Tailwind v4 docs — print: variant ships OOTB, no config needed]

**The virtualizer problem:** `ContentTree.tsx` renders with `@tanstack/react-virtual`. The virtualizer only renders rows that are visible in the scroll window. Collapsed topics (where `topicOpen[id] === false`) are excluded from `rows` entirely in `buildFlatRows` — they are never rendered to the DOM. A CSS-only approach using `print:block` cannot make non-rendered elements appear.

**Consequence:** The CONTEXT.md decision "expand all on print via CSS-only `print:` variants" is **not achievable** as described for the virtualizer content area. The sidebar, banner, and controls CAN be handled with CSS-only `print:hidden`.

**Required approach for content expansion:**

```typescript
// In App.tsx or a dedicated usePrintExpansion hook
import { useEffect } from 'react';
import { useAppStore } from '../store/app.js';

export function usePrintExpansion() {
  const expandAll = useAppStore((s) => s.expandAll);
  const topicOpen = useAppStore((s) => s.topicOpen); // to restore after print
  const collapseAll = useAppStore((s) => s.collapseAll);

  useEffect(() => {
    let prevTopicOpen: Record<string, boolean> | null = null;

    function handleBeforePrint() {
      // Save state before expanding
      prevTopicOpen = { ...useAppStore.getState().topicOpen };
      expandAll();
    }

    function handleAfterPrint() {
      // Restore state after print
      if (prevTopicOpen !== null) {
        useAppStore.setState({ topicOpen: prevTopicOpen });
        prevTopicOpen = null;
      }
    }

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [expandAll]);
}
```

**CSS-only print classes (for elements that ARE in the DOM):**
- `print:hidden` on: `<aside>` (sidebar), UpdateBanner, view toolbar buttons, score sliders, action buttons, StorageToast, UndoToast
- `print:block` on: candidate print header (currently `hidden`)
- `print:break-inside-avoid` on: topic row wrapper divs
- `print:h-auto print:overflow-visible` on: `<textarea>` elements (question notes, topic notes)

**Notes textarea visibility:** Textareas in QuestionCard and TopicRow use the `hidden` HTML attribute (not `display:none` CSS class) when `notesOpen === false`. The `hidden` attribute makes elements invisible AND removes them from layout. `print:block` cannot override `hidden` attribute — the `hidden` attribute is removed by setting `hidden={false}` in React. This means the `beforeprint` handler must also call a store action to expand all notes, OR the print approach must accept that closed notes don't print.

**Recommended print approach for textareas:** The simpler path is to show textareas in print only if they have content. Add `print:block` and `print:h-auto` to textareas AND remove the `hidden` attribute conditionally for print. The `beforeprint` handler can set a store flag `printMode: true` that causes all textarea `hidden` props to evaluate to `false`.

### Pattern 4: `_execute_action` manifest command

**What:** Declares a global OS-level keyboard shortcut that opens the extension action.

```json
// Source: developer.chrome.com/docs/extensions/reference/api/commands
// Add to manifest.json:
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+I",
        "mac": "Command+Shift+I"
      },
      "description": "Open Interviewer Checklist"
    }
  }
}
```

**Key rules** [CITED: developer.chrome.com/docs/extensions/reference/api/commands]:
- Must include Ctrl or Alt (Ctrl is converted to Command on macOS automatically)
- `_execute_action` does NOT fire `chrome.commands.onCommand` — it fires `chrome.action.onClicked` which is already handled in background/index.ts
- Max 4 suggested shortcuts per extension (this is the only one)
- `Ctrl+Alt` combinations are prohibited
- Users can change the shortcut at `chrome://extensions/shortcuts`

**No code change needed in background/index.ts** — the existing `chrome.action.onClicked` listener handles the shortcut automatically.

### Pattern 5: Welcome Page (separate Vite entry point)

**Architecture:** `src/app/welcome.html` + `src/app/welcome-main.tsx` + `src/app/Welcome.tsx` as a second React app entry, following the exact `app.html` / `main.tsx` / `App.tsx` pattern. [VERIFIED: codebase — app.html/main.tsx pattern]

**vite.config.ts change:**
```typescript
// Add welcome entry to rollupOptions.input
build: {
  rollupOptions: {
    input: {
      'src/app/app': 'src/app/app.html',
      'src/app/welcome': 'src/app/welcome.html',  // ADD THIS
    },
  },
}
```

**Known CRXJS issue:** GitHub issue #876 reports that `build.rollupOptions.inputs` can break the build because CRXJS strips plugins. [ASSUMED — the issue was reported for an older build; testing at build time is required to confirm it works with CRXJS 2.6.1 and Vite 8.]

**manifest.json change:** Add `web_accessible_resources` for welcome.html so the service worker can open it via `chrome.runtime.getURL`:
```json
{
  "web_accessible_resources": [
    {
      "resources": ["src/app/welcome.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**FOUC prevention on welcome page:** Use the same `theme.ts` script tag approach as `app.html` — include `<script type="module" src="./theme.ts"></script>` before `main` in `welcome.html`.

**Welcome page state needed:** `chrome.storage.local.set({ hasSeenWelcome: true })` on mount. `chrome.runtime.getManifest().version` to display version. No Zustand store needed — welcome page is read-only and standalone.

**Demo session:** `createSession()` is an async action in `useAppStore`. The welcome page does not mount the app store, so seeding a demo session from the welcome page requires either: (a) calling the storage adapter directly (not the store), or (b) passing a URL parameter to the main app tab that triggers demo seeding on first load. Simpler: background/index.ts seeds the demo session during `reason='install'` using the storage adapter directly before opening welcome.html.

### Pattern 6: Focus Trap Audit — Detailed Compliance Results

**Source of truth:** `src/components/ResetConfirmDialog.tsx` lines 14–46.

**Audit findings from direct code inspection:**

| Modal | Tab Trap | Shift+Tab Trap | WR-02 Guard | Focus Restore | `aria-labelledby` | Compliance |
|-------|----------|----------------|-------------|---------------|-------------------|------------|
| ResetConfirmDialog.tsx | YES | YES | NO (missing) | `#open-reset-dialog` | `reset-dialog-title` | MINOR GAP |
| CandidateModal.tsx | YES | YES | NO (missing) | `#open-candidate-modal` | `candidate-modal-title` | MINOR GAP |
| SessionSwitcherModal.tsx | YES | YES | YES | `#open-session-switcher` | `session-switcher-title` | COMPLIANT |
| ImportPreviewModal.tsx | YES | YES | YES | `#open-import-yaml` | `import-preview-title` | COMPLIANT |
| AiPromptModal.tsx | YES | YES | YES | `#open-ai-prompt` | `ai-prompt-title` | COMPLIANT |
| DeleteSessionConfirmDialog.tsx | YES | YES | YES | `focusRestoreId` prop | `delete-session-dialog-title` | COMPLIANT |

**Note on modal count:** The CONTEXT.md says "all 5 modals" but the codebase has 6 dialog components (including `DeleteSessionConfirmDialog` which is nested inside `SessionSwitcherModal`). POLISH-04 audit should cover all 6.

**WR-02 gap:** `ResetConfirmDialog` and `CandidateModal` are missing the `if (focusable.length === 0) return;` guard. This is not a functional regression (both modals always have at least 2 focusable buttons), but the audit task should add the guard for consistency. A single-line fix per modal.

**AiPromptModal close path:** The "Close" button calls `onClose` prop (which calls `aiPromptRef.current?.close()`), not `dialogRef.current?.close()` directly. This correctly fires the native `close` event, so `handleClose` focus restore fires correctly.

### Pattern 7: Version Display & CHANGELOG

**Version read (synchronous):**
```typescript
// chrome.runtime.getManifest() is synchronous — no useEffect needed
// Available in any extension page context (not just service worker)
const { version } = chrome.runtime.getManifest();
```

**CHANGELOG bundling:** Import CHANGELOG.md as a raw string using Vite's `?raw` suffix:
```typescript
import changelogContent from '../../CHANGELOG.md?raw';
```
This bundles the CHANGELOG.md content as a string at build time. No runtime fetch needed. No CSP issues (no inline scripts).

**CHANGELOG rendering:** Plain preformatted text (`<pre>`) or simple line-by-line rendering — no markdown parser needed at this fidelity. The UI spec says "plain preformatted text or simple paragraph-per-version-block layout — Claude's discretion."

**Sidebar footer placement:**
```tsx
// In Sidebar.tsx — add after the last <SidebarGroup> inside <aside>:
// The aside already has className="... flex flex-col ..."
// Add mt-auto to push footer to bottom
<SidebarFooter />  // or inline JSX
```

The `SidebarFooter` component reads `chrome.runtime.getManifest().version` synchronously and renders the version row + CHANGELOG collapsible.

### Anti-Patterns to Avoid

- **Nested async `addListener`:** NEVER register `chrome.runtime.onInstalled.addListener` inside an async callback or inside another listener. Must be top-level synchronous call.
- **CSS-only print expand for virtualizer content:** `print:block` on collapsed items that aren't in the DOM does nothing. Always use `beforeprint` JS expansion.
- **Setting `open` attribute on `<dialog>`:** All modals use `.showModal()` imperatively — never set the `open` prop/attribute in JSX. (T-05-03-04 rule already enforced in all modals.)
- **Stale closure in keyboard hook:** The `useEffect` dependency array must include `sidebarOpen` and `setSidebarOpen` — otherwise the `\` shortcut captures stale `sidebarOpen` state.
- **`?raw` import outside Vite context:** The `?raw` CHANGELOG import works in Vite but would fail in a Node.js test context. Tests for ChangelogViewer should mock the import or test the rendered output, not the raw string.
- **Using `document` in service worker:** Service workers do not have `document`. The welcome tab open happens in background/index.ts (service worker context) using `chrome.tabs.create` — no `document` access needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Print expand/collapse | Custom CSS `data-*` attribute toggle system | `window.beforeprint` + existing `expandAll()` | Store already has `expandAll()`; CSS cannot reach virtualized DOM |
| Focus trap utility | New shared `useFocusTrap` hook | Verbatim pattern already in all 5 modals | CONTEXT.md decision; hook extraction is deferred |
| Keyboard shortcut routing | A key-map config system | Simple `if/else if` in `handleKeyDown` | Only 3 shortcuts; abstractions add complexity |
| CHANGELOG parser | Markdown-to-HTML renderer | `?raw` import + `<pre>` or split-by-newline | No markdown parser needed at this fidelity |
| Version comparison | Semver library | String comparison `a !== b` | Only need "same or different" — no semver needed |
| Tab/window management for welcome | Custom tab manager | `chrome.tabs.create` with URL check | Existing background.ts already has the pattern |

**Key insight:** Every capability in this phase has a direct analog in the existing codebase. The implementation is pattern-application, not system-building.

---

## Runtime State Inventory

> This phase adds new `chrome.storage.local` keys. No rename/refactor. Included to document new storage state.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | New keys added: `hasSeenWelcome` (bool), `lastSeenVersion` (string), `dismissedUpdateVersion` (string) | Write in background/index.ts and UpdateBanner; read in background/index.ts and UpdateBanner |
| Live service config | None — no external service config | None |
| OS-registered state | `manifest.json` `commands` key registers `_execute_action` shortcut — Chrome registers at extension load | Manifest change; takes effect on next extension reload |
| Secrets/env vars | None — no secrets introduced | None |
| Build artifacts | `src/app/welcome.html` as second Vite entry adds output to `dist/src/app/` | Verify CI dist check (`check-dist.js`) handles second HTML file |

**CI dist-check concern:** `scripts/check-dist.js` walks all `.html` and `.js` files in `dist/` checking for forbidden patterns. The second `welcome.html` entry will be included in this walk automatically — no change needed. The check already covers all files recursively.

---

## Common Pitfalls

### Pitfall 1: Print Virtualizer Mismatch

**What goes wrong:** Developer adds `print:block` to collapsed topic rows, prints, and collapsed content is still missing from the print output.

**Why it happens:** `buildFlatRows` excludes rows where `topicOpen[id] === false` — they are never passed to the virtualizer. No DOM element exists to apply `print:block` to.

**How to avoid:** Use `window.addEventListener('beforeprint', () => expandAll())` in a hook. This forces all topics into the DOM before the browser captures the print snapshot.

**Warning signs:** Print output shows gaps or missing topics when any topics are collapsed at print time.

### Pitfall 2: Stale Closure in Keyboard Hook

**What goes wrong:** The `\` shortcut always opens the sidebar or always closes it — never toggles correctly.

**Why it happens:** `sidebarOpen` value is captured in the closure at `useEffect` registration time. If the dependency array omits `sidebarOpen`, the closure has a stale value.

**How to avoid:** Include `sidebarOpen` in the `useEffect` dependency array. The effect re-registers the listener whenever `sidebarOpen` changes.

**Alternative:** Use `useAppStore.getState().sidebarOpen` inside the handler to read the current value at event time, avoiding the dependency entirely.

### Pitfall 3: `_execute_action` vs `chrome.commands.onCommand`

**What goes wrong:** Developer adds a `chrome.commands.onCommand` listener expecting it to fire when the user presses the `_execute_action` shortcut — but nothing happens.

**Why it happens:** `_execute_action` is reserved and does NOT fire `onCommand`. It fires `chrome.action.onClicked` instead.

**How to avoid:** No code change needed. The existing `chrome.action.onClicked` listener in background/index.ts already handles the shortcut. Just declare the key in manifest.json.

### Pitfall 4: CRXJS + `rollupOptions.input` Build Break

**What goes wrong:** Adding `'src/app/welcome': 'src/app/welcome.html'` to `rollupOptions.input` breaks the TypeScript build or causes CRXJS to fail.

**Why it happens:** CRXJS issue #876 — the plugin's `pluginFileWriter` strips all non-crx plugins, which can cause Rollup to fail when additional inputs are present.

**How to avoid:** Test the build after adding the welcome entry. If it fails, alternative: declare `welcome.html` in `manifest.json` as `web_accessible_resources` and add it to rollupOptions.input as a separate Vite config pass (or use a different workaround). Build-time verification is required.

**Warning signs:** `npm run build` fails with plugin or Rollup errors after adding the second input.

### Pitfall 5: `hidden` Attribute Cannot Be Overridden by CSS

**What goes wrong:** Notes textareas use `hidden={!notesOpen}` (the HTML `hidden` attribute). Adding `print:block` CSS does NOT override the HTML `hidden` attribute — the element stays hidden during print.

**Why it happens:** The HTML `hidden` attribute has higher specificity than CSS (it's an attribute, not a class). `print:block` adds `display: block` to the stylesheet, but the `hidden` attribute is equivalent to `display: none !important` in most browsers.

**How to avoid:** The `beforeprint` handler must also set a store flag (e.g., `setPrintMode(true)`) that causes all notes textareas to render without the `hidden` attribute. The `afterprint` handler clears the flag. Alternatively: only show textareas on print when they have content (conditional hidden prop).

### Pitfall 6: Service Worker Welcome Tab Timing

**What goes wrong:** `chrome.runtime.onInstalled` fires but the welcome tab doesn't open because `chrome.storage.local.get` is async and the service worker shuts down before it completes.

**Why it happens:** MV3 service workers can terminate mid-async-operation if no other listeners are holding them awake.

**How to avoid:** The `onInstalled` listener itself being async is fine — Chrome extends the service worker lifetime while the listener is running. The critical rule is that `addListener` is called synchronously at module level. [CITED: developer.chrome.com service worker lifecycle docs]

### Pitfall 7: Demo Session Seeding Location

**What goes wrong:** Demo session seeding is placed in `Welcome.tsx` (React app), but Welcome.tsx can't easily access the Zustand store's `createSession` action without mounting the full store.

**Why it happens:** Welcome page is a separate React app with its own entry point. It doesn't share the same Zustand store instance as the main app.

**How to avoid:** Seed the demo session in `background/index.ts` during `onInstalled` reason='install', using `storageAdapter.write()` directly to write session data to `chrome.storage.local` without going through the store.

---

## Focus Trap Audit Checklist (POLISH-04)

The planner should create one audit task per modal that verifies the following checklist in code and adds the WR-02 guard where missing:

**Required checklist (per modal):**
- [ ] `useEffect` depends on `[dialogRef]` (or `[dialogRef, focusRestoreId]` for DeleteSessionConfirmDialog)
- [ ] `handleKeyDown` checks `e.key !== 'Tab'` at entry
- [ ] `querySelectorAll` uses full selector: `'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'`
- [ ] WR-02 guard: `if (focusable.length === 0) return;` after querySelectorAll
- [ ] Shift+Tab wrap: `if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }`
- [ ] Tab wrap: `else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }`
- [ ] `handleClose` calls `document.getElementById('<correct-trigger-id>')?.focus()`
- [ ] Both `addEventListener` and `removeEventListener` cleanup in return function
- [ ] `<dialog>` has `aria-labelledby` matching an `<h2 id="...">` inside the dialog
- [ ] No `open` attribute/prop set on `<dialog>` element (always `.showModal()` imperatively)

**Modals needing WR-02 guard addition:** `ResetConfirmDialog.tsx`, `CandidateModal.tsx`

---

## Code Examples

### Background Service Worker — Install + Update Handler

```typescript
// src/background/index.ts — full file after modification
// Source: chrome.runtime API docs + established background/index.ts pattern

// CRITICAL: Both listeners must be registered synchronously at module top level
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      const result = await chrome.storage.local.get('hasSeenWelcome');
      if (!result.hasSeenWelcome) {
        const url = chrome.runtime.getURL('src/app/welcome.html');
        await chrome.tabs.create({ url });
        // hasSeenWelcome is set to true inside Welcome.tsx on mount
      }
      // Seed demo session directly via chrome.storage.local (not store)
      // (demo session seeding logic here)
    }
    // Always write lastSeenVersion (for UpdateBanner comparison)
    const currentVersion = chrome.runtime.getManifest().version;
    await chrome.storage.local.set({ lastSeenVersion: currentVersion });
  } catch (err) {
    console.error('[interviewer-checklist] onInstalled handler failed:', err);
  }
});

chrome.action.onClicked.addListener(async () => {
  try {
    const url = chrome.runtime.getURL('src/app/app.html');
    const [existing] = await chrome.tabs.query({ url });
    if (existing?.id != null) {
      await chrome.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (err) {
    console.error('[interviewer-checklist] toolbar click failed:', err);
  }
});
```

### UpdateBanner — Version Comparison Logic

```typescript
// Source: established chrome.storage.local pattern from Phase 3/4
import { useEffect, useState } from 'react';

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    const currentVersion = chrome.runtime.getManifest().version;
    setVersion(currentVersion);

    chrome.storage.local.get(
      ['lastSeenVersion', 'dismissedUpdateVersion'],
      (result) => {
        if (chrome.runtime.lastError) return;
        const lastSeen = result.lastSeenVersion as string | undefined;
        const dismissed = result.dismissedUpdateVersion as string | undefined;
        // Show banner if version changed AND user hasn't dismissed this version
        if (lastSeen && lastSeen !== currentVersion && dismissed !== currentVersion) {
          setShowBanner(true);
        }
      }
    );
  }, []);

  function handleDismiss() {
    const currentVersion = chrome.runtime.getManifest().version;
    chrome.storage.local.set({ dismissedUpdateVersion: currentVersion });
    setShowBanner(false);
  }

  if (!showBanner) return null;
  // ... render banner JSX per UI-SPEC
}
```

### Print Expansion Hook

```typescript
// src/hooks/usePrintExpansion.ts
import { useEffect } from 'react';
import { useAppStore } from '../store/app.js';

export function usePrintExpansion() {
  const expandAll = useAppStore((s) => s.expandAll);

  useEffect(() => {
    let savedTopicOpen: Record<string, boolean> = {};
    let savedSectionOpen: Record<string, boolean> = {};

    function handleBeforePrint() {
      const state = useAppStore.getState();
      savedTopicOpen = { ...state.topicOpen };
      savedSectionOpen = { ...state.sectionOpen };
      expandAll();
      // Also expand all sections
      useAppStore.setState({ sectionOpen: {} }); // empty = all open (default)
    }

    function handleAfterPrint() {
      useAppStore.setState({
        topicOpen: savedTopicOpen,
        sectionOpen: savedSectionOpen,
      });
    }

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [expandAll]);
}
```

### CHANGELOG Import Pattern

```typescript
// Source: Vite ?raw import feature
// Works in browser context; mock in tests
import changelogContent from '../../CHANGELOG.md?raw';

export function ChangelogViewer() {
  return (
    <pre className="text-xs font-normal text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-64 overflow-y-auto px-3 pb-3 print:hidden">
      {changelogContent || 'No changelog entries found.'}
    </pre>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MV2 background page (persistent) | MV3 service worker (ephemeral) | Chrome 88+ required | Listeners must be top-level synchronous; no persistent state in service worker |
| MV2 `_execute_browser_action` | MV3 `_execute_action` | MV3 migration | Different command name; same pattern |
| `window.beforeprint` polyfills needed | Native `beforeprint`/`afterprint` | Modern browsers (2015+) | No polyfill needed; Chrome 116+ (project minimum) supports it |
| Tailwind config.js for print | Tailwind v4 CSS-first with print: variant built in | v4.0 (Jan 2025) | No config needed; `print:` works OOTB |

**Deprecated/outdated:**
- `chrome.runtime.onInstalled` with `addListener` nested inside async: was a common MV2 pattern that silently fails in MV3. The listener fires and the handler executes, but any async work after the service worker context is lost may not complete. Use top-level registration.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CRXJS 2.6.1 with Vite 8 handles `rollupOptions.input` with a second HTML entry without breaking the build | Pattern 5: Welcome Page | Build fails; alternative: static HTML in public/ without React or a different workaround |
| A2 | `window.beforeprint` / `afterprint` events fire reliably in Chrome 116+ before/after print capture | Print CSS Pattern | Print expansion doesn't work; fallback: print button in UI that calls expandAll() then browser print |
| A3 | Demo session seeding in background/index.ts via `storageAdapter.write()` directly (bypassing Zustand store) produces valid V3Session schema | Pattern 7 / Demo session | Schema validation fails on load; fix: use `createDefaultV3Session()` from storage types |
| A4 | `?raw` import of CHANGELOG.md works in the CRXJS-compiled extension bundle without CSP or bundler issues | Pattern 7 / CHANGELOG | CHANGELOG import fails; fallback: hardcode CHANGELOG content as a TypeScript string constant |
| A5 | The `hidden` HTML attribute on textareas cannot be overridden by `print:block` CSS (requires JS `beforeprint` flag) | Pitfall 5 | If browsers DO override hidden via print CSS, simpler CSS-only approach works |

---

## Open Questions

1. **CRXJS + second rollupOptions.input**
   - What we know: GitHub issue #876 reports a build break when adding extra inputs. The workaround of `content_scripts` with never-matching URL is hacky.
   - What's unclear: Whether CRXJS 2.6.1 has fixed this or whether there's a cleaner path.
   - Recommendation: Test `npm run build` immediately after adding the second input. If it fails, fall back to a plain `public/welcome.html` static file (no React, no Tailwind — just inline CSS) and replace `src/app/welcome.html` reference accordingly.

2. **Demo session data seeding format**
   - What we know: The store has `createSession()` and `createDefaultV3Session()` from `storage/types.ts`.
   - What's unclear: Exactly what data to pre-populate (which questions to pre-score, which candidate name to use).
   - Recommendation: Claude's discretion — seed with candidate name "Demo Candidate", role "Senior Engineer", and 3–4 pre-scored questions in the first section. Keep minimal.

3. **Notes print behavior**
   - What we know: Notes textareas use the HTML `hidden` attribute which CSS cannot override.
   - What's unclear: Whether the requirement is "show ALL notes on print" or "show notes that have content."
   - Recommendation: Show notes textareas on print only when they have non-empty content (conditional `hidden` prop: `hidden={!notesOpen && !localNote}`). This avoids needing a `printMode` store flag.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | YES | v20.20.2 | — |
| npm | Package management | YES | 10.8.2 | — |
| Vitest | Test runner | YES | 4.1.9 | — |
| Chrome (for manual test) | Smoke test POLISH-02 shortcut | assumed YES | — | Use chrome://extensions/shortcuts to verify |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 + happy-dom 20.10.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (33 test files, 471 tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLISH-01 | background onInstalled opens welcome tab on install, not on update | unit | `npm test -- --reporter=verbose background` | No — Wave 0 |
| POLISH-01 | hasSeenWelcome flag prevents re-opening | unit | `npm test -- --reporter=verbose background` | No — Wave 0 |
| POLISH-02 | manifest.json contains `commands._execute_action` with valid key | unit (manifest.test.ts) | `npm test` | Partial — manifest.test.ts exists, extend it |
| POLISH-03 | useKeyboardShortcuts: `/` focuses search, `\` toggles sidebar, suppressed in input | unit | `npm test -- --reporter=verbose keyboard` | No — Wave 0 |
| POLISH-03 | useKeyboardShortcuts: ignores when activeElement is INPUT/TEXTAREA | unit | as above | No — Wave 0 |
| POLISH-04 | All 6 modal focus traps: Tab wraps to first, Shift+Tab wraps to last | integration | `npm test -- --reporter=verbose modal` | Partial — existing modal tests, extend |
| POLISH-04 | All 6 modals restore focus to trigger on close | integration | as above | Partial |
| POLISH-05 | usePrintExpansion: beforeprint calls expandAll, afterprint restores state | unit | `npm test -- --reporter=verbose print` | No — Wave 0 |
| POLISH-06 | SidebarFooter displays correct version from chrome.runtime.getManifest | unit | `npm test -- --reporter=verbose footer` | No — Wave 0 |
| POLISH-07 | UpdateBanner shows when lastSeenVersion !== currentVersion | unit | `npm test -- --reporter=verbose banner` | No — Wave 0 |
| POLISH-07 | UpdateBanner hidden when dismissedUpdateVersion === currentVersion | unit | as above | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (471+ tests) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/background/background.test.ts` — covers POLISH-01 (onInstalled listener logic)
- [ ] `src/hooks/useKeyboardShortcuts.test.ts` — covers POLISH-03
- [ ] `src/hooks/usePrintExpansion.test.ts` — covers POLISH-05
- [ ] `src/components/UpdateBanner.test.ts` — covers POLISH-07
- [ ] `src/components/SidebarFooter.test.ts` — covers POLISH-06
- [ ] Extend `src/test/manifest.test.ts` — add POLISH-02 assertion for `commands._execute_action`
- [ ] Extend existing modal test files — add focus trap Tab/Shift+Tab and focus-restore assertions for POLISH-04

---

## Security Domain

> `security_enforcement` is enabled (not set to false in config.json). ASVS Level 1 applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No authentication in this phase |
| V3 Session Management | No | Session switching not modified in this phase |
| V4 Access Control | No | No access control changes |
| V5 Input Validation | Partial | Keyboard hook reads `e.key` (browser-supplied, trusted). No user-supplied string processing except CHANGELOG display. |
| V6 Cryptography | No | No crypto operations |

### Known Threat Patterns for This Phase's Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Welcome page opens arbitrary URL | Tampering | URL is constructed via `chrome.runtime.getURL()` — extension-controlled; no user input in URL |
| Version string display (XSS) | Tampering | `chrome.runtime.getManifest().version` is extension-owned; rendered as React text node (auto-escaped) |
| CHANGELOG content injection | Tampering | CHANGELOG.md is a bundled static file (`?raw` import); not user-supplied; rendered in `<pre>` (auto-escaped) |
| Keyboard shortcut privilege escalation | Spoofing | `_execute_action` only fires existing `chrome.action.onClicked` — no new privilege surface |
| `hasSeenWelcome` / `dismissedUpdateVersion` tamper | Tampering | These are convenience flags, not security controls; no risk from tampering |

**Security verdict:** No high-risk surface area introduced in this phase. All new data displayed is either extension-owned (version, CHANGELOG) or browser-trusted (keyboard event codes).

---

## Sources

### Primary (HIGH confidence — verified from codebase)
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/ResetConfirmDialog.tsx` — focus trap source of truth pattern
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/CandidateModal.tsx` — focus trap compliance check
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/SessionSwitcherModal.tsx` — focus trap compliance check (WR-02 guard)
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/ImportPreviewModal.tsx` — focus trap compliance check
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/AiPromptModal.tsx` — focus trap compliance check
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/components/DeleteSessionConfirmDialog.tsx` — 6th modal (nested)
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/background/index.ts` — service worker pattern
- `/Users/dallask/Projects/dallask/interviewer-checklist/src/utils/buildFlatRows.ts` — virtualizer architecture (critical for print CSS understanding)
- `/Users/dallask/Projects/dallask/interviewer-checklist/vite.config.ts` — Vite entry point configuration
- `/Users/dallask/Projects/dallask/interviewer-checklist/manifest.json` — current manifest (no commands key)

### Secondary (MEDIUM confidence — official docs)
- [chrome.runtime API — developer.chrome.com](https://developer.chrome.com/docs/extensions/reference/api/runtime) — onInstalled event, details.reason values, previousVersion
- [chrome.commands API — developer.chrome.com](https://developer.chrome.com/docs/extensions/reference/api/commands) — _execute_action syntax, key requirements
- [Tailwind v4 print: variant — tailwindlabs discussions](https://github.com/tailwindlabs/tailwindcss/discussions/12887) — print: works OOTB in v4

### Tertiary (LOW confidence — web search only)
- [CRXJS issue #876](https://github.com/crxjs/chrome-extension-tools/issues/876) — known issue with rollupOptions.input; needs build-time verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; all patterns verified in codebase
- Architecture: HIGH — codebase read directly; virtualizer critical issue discovered from source
- Chrome APIs: MEDIUM — verified against official Chrome Developer docs
- Pitfalls: HIGH — discovered from direct code inspection (virtualizer, hidden attribute, stale closure)
- CRXJS welcome.html entry: LOW — known open issue; requires build-time test

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (Chrome API docs stable; Tailwind v4 stable)
