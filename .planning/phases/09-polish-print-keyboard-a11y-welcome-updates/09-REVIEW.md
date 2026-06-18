---
phase: 09-polish-print-keyboard-a11y-welcome-updates
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/app/App.tsx
  - src/app/main.tsx
  - src/app/welcome-main.tsx
  - src/app/welcome.html
  - src/app/Welcome.tsx
  - src/background/index.ts
  - src/components/ChangelogViewer.tsx
  - src/components/QuestionCard.tsx
  - src/components/Sidebar.tsx
  - src/components/SidebarFooter.tsx
  - src/components/TopicRow.tsx
  - src/components/UpdateBanner.tsx
  - src/hooks/useKeyboardShortcuts.ts
  - src/hooks/usePrintExpansion.ts
  - src/store/app.ts
findings:
  critical: 4
  warning: 9
  info: 5
  total: 18
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

The phase delivers print expansion, keyboard shortcuts, the Welcome page, the
update banner, and the changelog viewer. The print-expansion hook, the
keyboard shortcut listener cleanup, and the `UpdateBanner` stale-closure fix
are correct in isolation. However, the background service worker has two
schema-shape bugs in the seeded manifest (will fail valibot validation on
first install) and — more importantly — **unconditionally writes
`lastSeenVersion = currentVersion` on every install/update event**, which
defeats the entire `UpdateBanner` feature: the banner condition
`lastSeen !== version` can never be true for the user, so the banner will
never render after an update. Additional issues include a duplicate sidebar
backdrop, missing modifier-key guard in the keyboard hook, and Escape
clearing the search query even when a modal is open.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Background unconditionally sets `lastSeenVersion`, defeating the UpdateBanner

**File:** `src/background/index.ts:39-40`
**Classification:** BLOCKER
**Issue:** The line `await chrome.storage.local.set({ lastSeenVersion: currentVersion });`
runs on every `onInstalled` event (install, update, chrome_update). On an
extension update — the only case the banner is intended to surface — the
background SW overwrites `lastSeenVersion` with the *new* manifest version
*before* the app reads it. The `UpdateBanner` condition
`lastSeen && lastSeen !== version && dismissed !== version`
(`src/components/UpdateBanner.tsx:40-43`) is therefore always false on
update, and the user will never see the banner. The whole POLISH-07 feature
is silently inert.

**Fix:** Only seed `lastSeenVersion` on first install. On update, let the
app (e.g., `UpdateBanner` dismiss handler or a one-shot post-load effect)
write `lastSeenVersion = currentVersion` after the user has seen the banner.

```ts
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      // …seed manifest + demo session…
      await chrome.storage.local.set({ lastSeenVersion: currentVersion });
    }
    // On update / chrome_update: DO NOT touch lastSeenVersion here —
    // UpdateBanner reads it, compares to manifest version, shows the
    // banner, and writes lastSeenVersion only after dismissal.
  } catch (err) { … }
});
```

Also consider: `UpdateBanner.handleDismiss` currently sets
`dismissedUpdateVersion` but never updates `lastSeenVersion`. Either the
banner-dismiss path or a post-mount effect needs to write
`lastSeenVersion = version` so the banner does not re-appear on next launch.

### CR-02: Seeded manifest in background has wrong schema version and wrong `createdAt` type

**File:** `src/background/index.ts:8-14`
**Classification:** BLOCKER
**Issue:** Two schema mismatches against `V2ManifestSchema`
(`src/storage/types.ts:78-89`):
1. `version: 1` — schema requires `v.literal(2)`.
2. `sessions[0].createdAt: Date.now()` — a `number`, but schema requires
   `v.string()` (ISO timestamp). The schema also requires `updatedAt`,
   which is omitted entirely.

On the first launch after install, `bootstrap()` will run valibot
validation against this seed and fail (or, depending on how bootstrap
handles invalid manifests, silently fall back), masking the install flow
the Welcome CTA depends on (the demo session reference in
`manifest.activeSessionId` and `sessions[].id`).

**Fix:** Use the project's factory or hand-roll a v2-shaped object:

```ts
const now = new Date().toISOString();
await chrome.storage.local.set({
  manifest: {
    version: 2,
    activeSessionId: 'demo',
    sessions: [{ id: 'demo', name: 'Demo Candidate', createdAt: now, updatedAt: now }],
  },
});
```

### CR-03: Duplicate sidebar backdrop in App + Sidebar — double-fires close handler

**File:** `src/app/App.tsx:66-73`, `src/components/Sidebar.tsx:17-24`
**Classification:** BLOCKER
**Issue:** Both `App.tsx` and `Sidebar.tsx` render an identical
`fixed inset-0 bg-black/40` backdrop when `sidebarOpen` is true on narrow
viewports. The two divs stack, the click target is whichever has higher
z-order, and stacked semi-transparent overlays double the opacity (visible
40% → effective ~64%). One of them must be removed. The `Sidebar.tsx`
backdrop is missing `z-40 print:hidden md:hidden` parity (it does have
`md:hidden` but the App one also has `print:hidden`), so removing the
Sidebar one is the safer choice — but pick one place and own it.

**Fix:** Delete the backdrop block from one component. Recommend deleting
the one in `Sidebar.tsx` (lines 17-24) since `App.tsx` owns the layout
shell and already has `print:hidden`.

### CR-04: `useKeyboardShortcuts` triggers on modifier-key combos, hijacking browser shortcuts

**File:** `src/hooks/useKeyboardShortcuts.ts:36-49`
**Classification:** BLOCKER
**Issue:** The handler does not check `e.ctrlKey`, `e.metaKey`, `e.altKey`,
or `e.shiftKey`. `Ctrl+/`, `Cmd+/`, `Ctrl+\`, `Cmd+\`, etc., will all match
`e.key === '/'` / `'\\'` and the handler will `preventDefault()` —
clobbering OS- and browser-level shortcuts (e.g., DevTools, accessibility
zoom). `Cmd+/` is a common "show shortcuts" binding in many apps; here it
will silently focus the search input and swallow the keystroke. Same for
`Esc` with modifiers: `Cmd+Esc` should not clear the search query.

**Fix:** Bail early when any modifier other than Shift (which is sometimes
needed to type `/` on non-US layouts) is held. Even better: require *no*
modifiers for these single-character shortcuts.

```ts
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // …rest unchanged…
}
```

## Warnings

### WR-01: `useKeyboardShortcuts` clears searchQuery on Escape even when a dialog is open

**File:** `src/hooks/useKeyboardShortcuts.ts:32-49`
**Classification:** WARNING
**Issue:** The dialog guard only suppresses *non-Escape* keys: `if (openDialog && e.key !== 'Escape') return;`. When the user presses Esc to close a `<dialog open>` modal (e.g., CandidateModal, DeleteSessionConfirmDialog, ResetConfirmDialog), the native dialog closes AND `setSearchQuery('')` fires. The user loses their search query as a side effect of dismissing an unrelated modal.

**Fix:** Also short-circuit Escape when a dialog is open:

```ts
if (openDialog) return; // let the browser handle Esc; don't touch other state
```

### WR-02: `usePrintExpansion` issues three separate `set()` calls inside `beforeprint`

**File:** `src/hooks/usePrintExpansion.ts:23-37`
**Classification:** WARNING
**Issue:** `handleBeforePrint` calls `state.expandAll()`, then
`useAppStore.setState({ sectionOpen: {} })`, then
`useAppStore.setState({ printMode: true })`. Each `set()` fires the
module-level subscribe in `store/app.ts:597`, which writes
`uiState`/`manifest`/`session:<id>` to chrome.storage — three writes per
print. Worse, `expandAll()` already replaces `topicOpen` with a new
object — the saved snapshot taken on line 25 is still correct (it was
shallow-cloned), but the additional writes risk a race where the browser
snapshots the page between updates. React 18 auto-batching applies inside
React event handlers; for a `window` `beforeprint` event handler, updates
flush at micro-task boundaries — non-trivial to reason about.

**Fix:** Collapse to a single `setState` update so the store mutates once:

```ts
function handleBeforePrint() {
  const state = useAppStore.getState();
  savedTopicOpen = { ...state.topicOpen };
  savedSectionOpen = { ...state.sectionOpen };
  const topicOpen: Record<string, boolean> = {};
  for (const section of DEFAULT_SECTIONS) {
    for (const topic of section.items) topicOpen[topic.id] = true;
  }
  useAppStore.setState({ topicOpen, sectionOpen: {}, printMode: true });
}
```

### WR-03: `Welcome` marks `hasSeenWelcome` before user reads the page

**File:** `src/app/Welcome.tsx:17-25`
**Classification:** WARNING
**Issue:** The mount effect immediately writes `hasSeenWelcome: true`.
If the user closes the tab without clicking either CTA — e.g., they were
mid-install and aren't ready — the page will not re-open on the next
browser restart (background only re-checks the flag on a future install
event, which won't happen). Combined with CR-02 (seed manifest is invalid
and the install flow may fall over), the user can miss the welcome
experience entirely. Consider marking only on CTA click, or on a
non-trivial scroll/dwell.

**Fix:** Move the storage write into `handleOpenExtension` /
`handleViewDemo`, so the welcome page only "stops re-opening" once the
user actually transitions out of it.

### WR-04: `chrome.storage.local.set` in `Welcome` wrapped in try/catch that cannot catch the rejection

**File:** `src/app/Welcome.tsx:20-24`, `src/app/Welcome.tsx:34`
**Classification:** WARNING
**Issue:** In MV3, `chrome.storage.local.set` returns a Promise. The
`try`/`catch` block here is synchronous — it only catches *synchronous*
throws (e.g., bad argument types). A rejection from quota-exceeded or
storage IO is unhandled. Same pattern in `handleViewDemo` (no try/catch
at all, line 34). Either `await` inside an async function and try/catch
properly, or attach `.catch(console.error)`.

**Fix:**

```ts
useEffect(() => {
  chrome.storage.local
    .set({ hasSeenWelcome: true })
    .catch((err) => console.error('[interviewer-checklist] hasSeenWelcome set failed:', err));
}, []);
```

### WR-05: `handleViewDemo` race — sets storage then immediately navigates

**File:** `src/app/Welcome.tsx:32-37`
**Classification:** WARNING
**Issue:** `chrome.storage.local.set({ activeSessionOverride: 'demo' })`
returns a Promise that is not awaited before `chrome.tabs.create({ url })`.
If the new tab's `main.tsx` reads `activeSessionOverride` before the
write commits (chrome.storage IO is async even though the API looks
fire-and-forget), the demo switch will be skipped silently. The user
clicks "View demo session" and lands on whatever session was active.

**Fix:**

```ts
async function handleViewDemo() {
  await chrome.storage.local.set({ activeSessionOverride: 'demo' });
  const url = chrome.runtime.getURL('src/app/app.html');
  await chrome.tabs.create({ url });
}
```

### WR-06: Background `onInstalled` async handler may be killed before completion

**File:** `src/background/index.ts:1-44`
**Classification:** WARNING
**Issue:** In MV3, service workers may terminate while a Promise is
pending. The `addListener` callback is `async` and the runtime does not
keep the SW alive across multiple awaits in `onInstalled` (it only does so
for the *first* returned promise in messaging contexts). If the SW dies
between the `chrome.tabs.create` and the `chrome.storage.local.set` calls
on install, the seeded manifest/demo session is missing and Welcome's
"View demo session" lands on a session that doesn't exist. Either
sequence all writes ahead of `tabs.create` (cheap async work first), or
move the seeding to `bootstrap()` so the SW lifetime isn't load-bearing.

**Fix:** Write storage *before* opening the tab so the most critical
state-persisting work happens first:

```ts
if (details.reason === 'install') {
  await chrome.storage.local.set({ manifest: …, 'session:demo': …, lastSeenVersion: currentVersion });
  const seen = await chrome.storage.local.get('hasSeenWelcome');
  if (!seen.hasSeenWelcome) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/app/welcome.html') });
  }
  return;
}
```

### WR-07: `useKeyboardShortcuts` `/` shortcut breaks on non-US keyboard layouts

**File:** `src/hooks/useKeyboardShortcuts.ts:36`
**Classification:** WARNING
**Issue:** `e.key === '/'` requires the user to actually produce a `/`
character. On German, French (AZERTY), and many other layouts, `/` is a
Shift- or AltGr-modified key — and per CR-04, with modifier keys held,
the handler should not fire at all. Net effect: international users have
no search-focus shortcut. Document the limitation and either use
`e.code === 'Slash'` (US-layout key position) or accept the trade-off.

**Fix:** Switch to `e.code` for layout-independent matching, or surface
the shortcut binding as configurable.

### WR-08: `UpdateBanner` does not refresh when storage changes externally

**File:** `src/components/UpdateBanner.tsx:24-48`
**Classification:** WARNING
**Issue:** The component reads storage exactly once on mount. If the
background SW writes `lastSeenVersion` *after* mount (e.g., during a hot
extension update), or another tab dismisses the banner via
`dismissedUpdateVersion`, the banner stays out of sync. Subscribe to
`chrome.storage.onChanged` to keep `showBanner` reactive.

**Fix:**

```ts
useEffect(() => {
  const listener = (changes: …, area: string) => {
    if (area !== 'local') return;
    if ('dismissedUpdateVersion' in changes && changes.dismissedUpdateVersion.newValue === versionRef.current) {
      setShowBanner(false);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}, []);
```

### WR-09: `usePrintExpansion` does not snapshot `printMode` itself

**File:** `src/hooks/usePrintExpansion.ts:39-45`
**Classification:** WARNING
**Issue:** `handleAfterPrint` restores `topicOpen` and `sectionOpen` from
the closure snapshot but forces `printMode: false` unconditionally. If
the user prints, then prints again without leaving the page, and the
second `beforeprint` fires before React has reconciled the first
`afterprint`, the saved snapshots from the second `beforeprint` will
hold *expanded* topicOpen (the post-print, not pre-print state). The user
loses their collapse state after the second print. Snapshot every key you
write so the restore is idempotent.

## Info

### IN-01: `welcome-main.tsx` import inconsistency (`./Welcome.js` vs `./App.tsx`)

**File:** `src/app/welcome-main.tsx:3`
**Classification:** WARNING (style)
**Issue:** `welcome-main.tsx` writes `import { Welcome } from './Welcome.js';`
but `main.tsx:10` writes `import { App } from './App.tsx';`. Pick one
convention project-wide (the `.js` extension is the project-wide pattern
elsewhere — see `App.tsx:3-12` imports).

**Fix:** Change `main.tsx` to use `./App.js` to match the rest of the
codebase, or change `welcome-main.tsx` to `./Welcome.tsx`. Consistency.

### IN-02: `SidebarFooter` button has no `aria-controls` for the changelog

**File:** `src/components/SidebarFooter.tsx:29-37`
**Classification:** WARNING (a11y)
**Issue:** The "What's new" button uses `aria-expanded` but has no
`aria-controls` pointing at the changelog region. Assistive tech can't
navigate from the toggle to the expanded region.

**Fix:** Give the `<pre>` in `ChangelogViewer` an `id="changelog-region"`
and add `aria-controls="changelog-region"` on the button.

### IN-03: `ChangelogViewer` `<pre>` is `print:hidden` — printed page omits changelog

**File:** `src/components/ChangelogViewer.tsx:14`
**Classification:** INFO
**Issue:** If hiding the changelog from the print snapshot is intentional,
add a comment to that effect. The phase plan implies print should include
notes; whether the changelog is also expected on the printed page is
unclear from the source alone.

### IN-04: `Welcome.tsx` `version` may render an empty string on local dev without manifest

**File:** `src/app/Welcome.tsx:15, 56`
**Classification:** INFO
**Issue:** `chrome.runtime.getManifest().version` is always present in a
real extension context, but if the welcome page is ever served outside
the extension (e.g., for component-test storybook), `chrome.runtime` is
undefined and the destructure throws at import time. Guard the call:

```ts
const version = typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.().version || 'dev';
```

### IN-05: `UpdateBanner` `currentVersion` state is unused outside JSX

**File:** `src/components/UpdateBanner.tsx:21, 72`
**Classification:** INFO
**Issue:** `currentVersion` is set via `setCurrentVersion(version)` in
the effect (line 29) purely to drive the JSX text on line 72. Since the
value is identical to `versionRef.current`, the state slot exists only
to trigger one re-render after mount. You can drop the state and read
`versionRef.current` directly (or, simpler, store the manifest version
synchronously in a `useState(() => chrome.runtime.getManifest().version)`
initializer so the JSX is correct on first render). Minor.

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
