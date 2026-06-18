---
phase: 09-polish-print-keyboard-a11y-welcome-updates
plan: 02
status: complete
completed: 2026-06-18
requirements: [POLISH-03, POLISH-05, POLISH-06, POLISH-07]
key_files:
  created:
    - src/hooks/useKeyboardShortcuts.ts
    - src/hooks/usePrintExpansion.ts
    - src/hooks/useKeyboardShortcuts.test.ts
    - src/hooks/usePrintExpansion.test.ts
    - src/components/UpdateBanner.tsx
    - src/components/ChangelogViewer.tsx
    - src/components/SidebarFooter.tsx
    - src/components/UpdateBanner.test.tsx
    - src/components/SidebarFooter.test.tsx
    - CHANGELOG.md
  modified:
    - src/app/App.tsx
    - src/components/Sidebar.tsx
    - src/components/Sidebar.test.tsx
    - src/store/app.ts
metrics:
  tasks: 2
  commits: 2
  tests_added: 23
  tests_passing: 510
---

# Phase 9 Plan 02: Polish hooks, UpdateBanner, SidebarFooter — Summary

POLISH-03 keyboard shortcuts (`/`, `\`, Esc), POLISH-05 print expansion hook,
POLISH-06 sidebar footer with CHANGELOG viewer, and POLISH-07 update banner
implemented, wired into App.tsx and Sidebar.tsx, and covered by 23 new tests.
510 / 510 full test suite passes.

## What was built

### Task 1 — hooks + CHANGELOG + store field (commit `8d56dc1`)

- **`src/hooks/useKeyboardShortcuts.ts`** — document-level keydown listener.
  Routes `/` to focus the search input (located via
  `document.querySelector('[aria-label="Search questions"]')`), `\` to toggle
  the sidebar, and `Esc` to clear the search query. Guards against
  `INPUT` / `TEXTAREA` / `contenteditable` and `dialog[open]`. State reads
  use `useAppStore.getState()` at event time, so the effect attaches once
  on mount and is immune to stale closures (RESEARCH.md Pitfall 2).
- **`src/hooks/usePrintExpansion.ts`** — `beforeprint` listener snapshots
  `topicOpen` / `sectionOpen`, calls `expandAll()`, resets `sectionOpen = {}`,
  and sets `printMode = true`. `afterprint` restores all three. Mandatory
  because `@tanstack/react-virtual` never renders collapsed rows; CSS-only
  `print:block` is insufficient (user authorized JS-hook override
  2026-06-17 per 09-CONTEXT.md).
- **`src/store/app.ts`** — added `printMode: boolean` to `AppState` and
  default `false` in `DEFAULT_STATE`. No new action; `usePrintExpansion`
  writes the flag directly via `useAppStore.setState`.
- **`CHANGELOG.md`** at the repo root, bundled into the build via Vite's
  `?raw` import in `ChangelogViewer.tsx`.

### Task 2 — UpdateBanner, ChangelogViewer, SidebarFooter, App/Sidebar wiring (commit `24bbeda`)

- **`src/components/UpdateBanner.tsx`** (POLISH-07) — sticky amber banner
  with `role="status"` / `aria-live="polite"`. Reads
  `chrome.runtime.getManifest().version` synchronously into a **local
  const** before calling `chrome.storage.local.get`, then compares the
  local const (NOT the React `currentVersion` state) inside the callback.
  Stashes the version in a `useRef` so `handleDismiss` can write
  `dismissedUpdateVersion` without a second `getManifest()` call. The
  "What's new" inline button dispatches an `open-changelog` window
  CustomEvent so SidebarFooter can open its collapsible without prop
  plumbing.
- **`src/components/ChangelogViewer.tsx`** (POLISH-06) — renders the
  bundled CHANGELOG.md (via `import changelogContent from '../../CHANGELOG.md?raw'`)
  inside a `<pre>` with `whitespace-pre-wrap max-h-64 overflow-y-auto`.
- **`src/components/SidebarFooter.tsx`** (POLISH-06) — reads
  `chrome.runtime.getManifest().version` synchronously, renders the
  `v{version}` row + "What's new" toggle. Listens for `open-changelog` to
  open the collapsible (UpdateBanner → SidebarFooter link). Includes
  `aria-expanded` on the toggle and `print:hidden` on the wrapper.
- **`src/components/Sidebar.tsx`** — render `<SidebarFooter />` after the
  Actions `<SidebarGroup>`, append `print:hidden` to the `<aside>` class
  list.
- **`src/app/App.tsx`** — call `useKeyboardShortcuts()` and
  `usePrintExpansion()` at the top of the function body; mount
  `<UpdateBanner />` as the first child of the right-column flex div
  (above the `☰` toggle and main content). Add `print:hidden` to the
  backdrop overlay and the ☰ toggle button.
- **`src/components/Sidebar.test.tsx`** — added a `chrome.runtime.getManifest()`
  mock to the test's `beforeEach` because `<SidebarFooter />` now renders
  inside `<Sidebar />` and reads the manifest version synchronously
  (deviation Rule 1 — see below).

## Verification

- `npx vitest run` — 510 / 510 tests pass (38 test files).
- 23 new tests added across `useKeyboardShortcuts.test.ts` (9),
  `usePrintExpansion.test.ts` (3), `UpdateBanner.test.tsx` (6), and
  `SidebarFooter.test.tsx` (5).
- Plan verification grep checks pass:
  - `grep -c "print:hidden" src/components/Sidebar.tsx src/app/App.tsx` → 1, 2
  - `grep -c "usePrintExpansion\|useKeyboardShortcuts" src/app/App.tsx` → 4
  - `grep -c "UpdateBanner" src/app/App.tsx` → 2
  - `grep -c "SidebarFooter" src/components/Sidebar.tsx` → 2
- `npx tsc --noEmit` — 0 new TS errors in any file touched by this plan.
  Pre-existing TS errors in `src/background/index.test.ts` (Plan 09-01
  territory) are out of scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `chrome.runtime.getManifest` mock missing in `Sidebar.test.tsx`**

- **Found during:** Task 2 (running the full test suite after wiring
  `<SidebarFooter />` into `<Sidebar />`).
- **Issue:** `Sidebar.test.tsx` did not stub `chrome.runtime.getManifest`.
  Once `<SidebarFooter />` was rendered inside `<Sidebar />`, the
  destructuring `const { version } = chrome.runtime.getManifest()`
  threw `TypeError: Cannot destructure property 'version' of
  'chrome.runtime.getManifest(...)' as it is undefined` and all 6 Sidebar
  tests failed.
- **Fix:** Added a default `chrome.runtime.getManifest.mockReturnValue({…
  version: '1.0.0'…})` in `beforeEach` and imported `chrome` from
  `vitest-chrome` so the typed mock methods are available.
- **Files modified:** `src/components/Sidebar.test.tsx`.
- **Commit:** included in `24bbeda` (Task 2).

**2. [Rule 1 — Bug] Test isolation: spies on store actions persisted across tests**

- **Found during:** Task 1 (the `\\ is suppressed when a dialog[open] is present`
  test was failing with 2 spy calls instead of 0).
- **Issue:** `vi.spyOn(useAppStore.getState(), 'setSidebarOpen')` in
  `beforeEach` returned the same underlying spy across tests because
  `vi.spyOn` reuses the existing wrapper on an already-spied method. The
  call counter accumulated across the file run, so by test 8 the spy
  already had calls from tests 2 and 3.
- **Fix:** Added `spy.mockClear()` after `vi.spyOn` in `beforeEach` so each
  test starts with a fresh call counter.
- **Files modified:** `src/hooks/useKeyboardShortcuts.test.ts`.
- **Commit:** included in `8d56dc1` (Task 1).

No other deviations. No architectural changes. No package installs.

## Threat surface scan

No new network endpoints, no new auth paths, no new file access. All new
data displayed is either extension-owned (`chrome.runtime.getManifest().version`)
or a bundled static asset (`CHANGELOG.md` via `?raw`), both rendered as
React text nodes / `<pre>` content (auto-escaped). The threat register
entries `T-09-05`, `T-09-06`, `T-09-07`, `T-09-08` (all `accept`) remain
accurate; `T-09-SC` `accept` holds — zero new packages installed.

## Known Stubs

None. The UpdateBanner, ChangelogViewer, and SidebarFooter are fully wired
to live data (`chrome.runtime.getManifest`, `chrome.storage.local`, and the
bundled `CHANGELOG.md`). The `printMode` store field is read by
`usePrintExpansion` and is currently unused by render code — QuestionCard
and TopicRow will read it in Plan 09-03 (where the textarea print
visibility is implemented). This is the intended split per the plan's
explicit ownership boundary ("Do NOT touch QuestionCard.tsx or TopicRow.tsx
in this plan — those files are owned by Plan 09-03").

## Self-Check

- `src/hooks/useKeyboardShortcuts.ts` — FOUND
- `src/hooks/usePrintExpansion.ts` — FOUND
- `src/hooks/useKeyboardShortcuts.test.ts` — FOUND
- `src/hooks/usePrintExpansion.test.ts` — FOUND
- `src/components/UpdateBanner.tsx` — FOUND
- `src/components/ChangelogViewer.tsx` — FOUND
- `src/components/SidebarFooter.tsx` — FOUND
- `src/components/UpdateBanner.test.tsx` — FOUND
- `src/components/SidebarFooter.test.tsx` — FOUND
- `CHANGELOG.md` — FOUND
- Commit `8d56dc1` (Task 1) — FOUND in `git log`
- Commit `24bbeda` (Task 2) — FOUND in `git log`

## Self-Check: PASSED
