# Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/welcome.html` | config | request-response | `src/app/app.html` | exact |
| `src/app/Welcome.tsx` | component | request-response | `src/app/App.tsx` | exact |
| `src/hooks/useKeyboardShortcuts.ts` | hook | event-driven | `src/components/StorageToast.tsx` (event listener pattern) | role-match |
| `src/components/UpdateBanner.tsx` | component | event-driven | `src/components/StorageToast.tsx` | exact |
| `src/components/Sidebar.tsx` (modified) | component | CRUD | `src/components/Sidebar.tsx` | exact (self) |
| `src/background/index.ts` (modified) | service | event-driven | `src/background/index.ts` | exact (self) |
| `manifest.json` (modified) | config | — | `manifest.json` | exact (self) |
| `src/components/CandidateModal.tsx` (audit) | component | request-response | `src/components/ResetConfirmDialog.tsx` | exact |
| `src/components/ImportPreviewModal.tsx` (audit) | component | request-response | `src/components/ResetConfirmDialog.tsx` | exact |

## Pattern Assignments

### `src/app/welcome.html` (config, request-response)

**Analog:** `src/app/app.html` (lines 1–14)

**HTML entry point pattern** (lines 1–14):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interviewer Checklist</title>
    <!-- theme.ts runs BEFORE main.tsx; applies dark class immediately to prevent FOUC -->
    <script type="module" src="./theme.ts"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Key notes:**
- Use `theme.ts` script tag before main entry to prevent FOUC (dark mode flash)
- `id="root"` is the React mount point
- Separate Vite entry means `vite.config.ts` rollupOptions.input must include `'src/app/welcome': 'src/app/welcome.html'`
- The `@crxjs/vite-plugin` automatically handles MV3 entry point bundling — add `welcome.html` to `web_accessible_resources` in `manifest.json`

---

### `src/app/Welcome.tsx` (component, request-response)

**Analog:** `src/app/App.tsx` (lines 1–89)

**Imports pattern** (lines 1–9):
```typescript
import './styles.css';
import { useMemo } from 'react';
import { ContentTree } from '../components/ContentTree.js';
import { Sidebar } from '../components/Sidebar.js';
import { useAppStore } from '../store/app.js';
```

**Root component shell pattern** (lines 48–89):
```tsx
export function App() {
  // ...
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
        {/* ... */}
      </div>
    </>
  );
}
```

**Key notes for Welcome.tsx:**
- Import `'./styles.css'` at the top — this pulls in Tailwind base styles
- Include skip link (`sr-only focus:not-sr-only`) for a11y — same as App.tsx line 50–55
- Use `dark:` Tailwind variants throughout — no hardcoded colors
- `chrome.runtime.getManifest().version` is available in any extension page context
- `chrome.storage.local.set({ hasSeenWelcome: true })` on mount to prevent re-open
- Static HTML welcome page (no store state needed) — no `useAppStore` import required

---

### `src/hooks/useKeyboardShortcuts.ts` (hook, event-driven)

**Analog:** `src/components/StorageToast.tsx` (lines 1–34) — event listener lifecycle pattern

**Event listener useEffect pattern** (lines 6–13):
```typescript
useEffect(() => {
  const handler = () => setVisible(true);
  window.addEventListener('storage-quota-warning', handler);
  return () => {
    window.removeEventListener('storage-quota-warning', handler);
  };
}, []);
```

**Second analog:** `src/components/ResetConfirmDialog.tsx` (lines 14–46) — keydown handler pattern

**Keydown handler pattern** (lines 20–35):
```typescript
function handleKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  // ... handler logic
}
dialogEl.addEventListener('keydown', handleKeyDown);
return () => {
  dialogEl.removeEventListener('keydown', handleKeyDown);
};
```

**Key notes for useKeyboardShortcuts.ts:**
```typescript
// Guard pattern from CONTEXT.md — apply before all key handling:
const tag = (document.activeElement as HTMLElement).tagName;
const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' ||
  (document.activeElement as HTMLElement).isContentEditable;
if (isEditable) return;
```

- Attach to `document` (not a dialog element) with `useEffect(() => { ... }, [])`
- Accept a `searchInputRef: RefObject<HTMLInputElement>` prop or retrieve via `document.querySelector` for `/` shortcut focus
- `setSidebarOpen` from `useAppStore` for `\` toggle shortcut
- Empty dependency array — attach once on mount, clean up on unmount

---

### `src/components/UpdateBanner.tsx` (component, event-driven)

**Analog:** `src/components/StorageToast.tsx` (lines 1–34) — closest match (dismissible banner/toast)

**Full component pattern** (lines 1–34):
```typescript
import { useEffect, useState } from 'react';

export function StorageToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('storage-quota-warning', handler);
    return () => {
      window.removeEventListener('storage-quota-warning', handler);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 max-w-sm"
    >
      <p className="flex-1 text-sm">
        Storage is almost full. Export a YAML backup to free space.
      </p>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}
```

**Second analog:** `src/components/UndoToast.tsx` (lines 1–41) — top-of-screen sticky banner variant

**Top banner layout pattern** (lines 14–16):
```typescript
className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 flex items-center justify-between py-2 px-4"
```

**Key notes for UpdateBanner.tsx:**
- Use `role="alert"` for screen reader announcement on first show (same as StorageToast.tsx line 17)
- Dismiss stores `dismissedUpdateVersion` in `chrome.storage.local` (not component state) so it survives re-render
- Version detection on mount: `const { version } = chrome.runtime.getManifest(); const { lastSeenVersion } = await chrome.storage.local.get('lastSeenVersion')`
- Use `top-0` sticky positioning (not `bottom-4 right-4`) — it sits above the question list, full-width
- Dismiss button: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` — same as all other interactive elements

---

### `src/components/Sidebar.tsx` — modified for version display + CHANGELOG viewer

**Analog:** `src/components/Sidebar.tsx` self (lines 1–67) — adding footer section after last `SidebarGroup`

**Existing sidebar structure pattern** (lines 25–64):
```tsx
<aside
  aria-label="Filters"
  className={`w-[280px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex flex-col overflow-y-auto ...`}
>
  <SidebarGroup groupId="search" ...>
    <SearchGroup />
  </SidebarGroup>
  {/* ... more groups */}
  <SidebarGroup groupId="actions" ...>
    <ActionsGroup />
  </SidebarGroup>
  {/* ADD: version + changelog footer AFTER last SidebarGroup */}
</aside>
```

**SidebarGroup pattern for collapsible changelog** (from `src/components/SidebarGroup.tsx`):
- Add a new `SidebarGroup groupId="changelog"` or inline collapsible `<details>`/`<summary>` element
- Version string: `chrome.runtime.getManifest().version` — read once in a `useState`/`useEffect` on mount
- `chrome.runtime` is available in extension tab pages — no special import needed

---

### `src/background/index.ts` — modified for install/update lifecycle

**Analog:** `src/background/index.ts` self (lines 1–16) — adding `onInstalled` listener

**Existing background pattern** (lines 1–16):
```typescript
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

**Key notes for onInstalled addition:**
```typescript
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    if (details.reason === 'install') {
      const { hasSeenWelcome } = await chrome.storage.local.get('hasSeenWelcome');
      if (!hasSeenWelcome) {
        await chrome.tabs.create({ url: chrome.runtime.getURL('src/app/welcome.html') });
      }
    }
    // Store current version for update detection (used by UpdateBanner)
    await chrome.storage.local.set({ lastSeenVersion: chrome.runtime.getManifest().version });
  } catch (err) {
    console.error('[interviewer-checklist] onInstalled handler failed:', err);
  }
});
```
- Use same `try/catch` + `console.error` pattern as existing listener (lines 3–15)
- Same `chrome.runtime.getURL(...)` approach for welcome tab URL

---

### `manifest.json` — modified for `commands` key + `web_accessible_resources`

**Existing manifest structure:**
```json
{
  "manifest_version": 3,
  "name": "Interviewer Checklist",
  "version": "1.0.0",
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "permissions": ["storage"],
  "minimum_chrome_version": "116"
}
```

**Keys to add:**
```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+I"
      },
      "description": "Open Interviewer Checklist"
    }
  },
  "web_accessible_resources": [
    {
      "resources": ["src/app/welcome.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Key notes:**
- `_execute_action` is the reserved MV3 command name for opening the extension action
- `@crxjs/vite-plugin` may auto-handle `web_accessible_resources` for HTML entry points — verify at build time
- `permissions` array already has `"storage"` — no addition needed for `chrome.storage.local`

---

### Focus trap audit: CandidateModal, ImportPreviewModal (compliance check)

**Source of truth:** `src/components/ResetConfirmDialog.tsx` (lines 14–46)

**Reference focus trap pattern** (lines 14–46):
```typescript
useEffect(() => {
  const maybeDialog = dialogRef.current;
  if (!maybeDialog) return;
  const dialogEl: HTMLDialogElement = maybeDialog;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleClose() {
    document.getElementById('open-reset-dialog')?.focus();
  }

  dialogEl.addEventListener('keydown', handleKeyDown);
  dialogEl.addEventListener('close', handleClose);
  return () => {
    dialogEl.removeEventListener('keydown', handleKeyDown);
    dialogEl.removeEventListener('close', handleClose);
  };
}, [dialogRef]);
```

**WR-02 guard** (applied in SessionSwitcherModal and AiPromptModal, but NOT in ResetConfirmDialog):
```typescript
// Add after querySelectorAll:
if (focusable.length === 0) return;
```

**Compliance checklist for audit:**
- [ ] `handleKeyDown`: `querySelectorAll` uses the full selector string (button, input, textarea, select, [tabindex]:not([tabindex="-1"]))
- [ ] `handleKeyDown`: WR-02 guard `if (focusable.length === 0) return;` present
- [ ] `handleClose`: calls `document.getElementById('<trigger-id>')?.focus()` with the correct trigger button ID
- [ ] `dialogEl.addEventListener` / `removeEventListener` in cleanup
- [ ] `<dialog>` element: never has `open` attribute set — always `.showModal()` imperatively
- [ ] `<dialog>` has `aria-labelledby` pointing to `<h2>` with matching `id`

**Status from code review:**
- `ResetConfirmDialog.tsx`: compliant EXCEPT missing WR-02 guard (focusable.length === 0 check)
- `SessionSwitcherModal.tsx`: fully compliant (has WR-02 guard, lines 37–38)
- `AiPromptModal.tsx`: fully compliant (has WR-02 guard, lines 49–50)
- `CandidateModal.tsx` and `ImportPreviewModal.tsx`: need to read to verify

---

## Shared Patterns

### Dismissible Banner/Toast
**Source:** `src/components/StorageToast.tsx` lines 1–34
**Apply to:** `UpdateBanner.tsx`
```typescript
if (!visible) return null;
// ... JSX with role="alert", dismiss button with focus-visible ring
```

### Focus-Visible Ring (all interactive elements)
**Source:** All component files uniformly
**Apply to:** All new interactive elements (buttons in UpdateBanner, Welcome page CTAs, keyboard hook N/A)
```typescript
className="... focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Dark Mode Tailwind Variants
**Source:** `src/app/App.tsx` lines 56–83, all component files
**Apply to:** All new components (UpdateBanner, Welcome.tsx)
```typescript
// Pattern: always pair light/dark:
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
```

### Chrome Storage Async Pattern
**Source:** `src/background/index.ts` (pattern for chrome.storage.local)
**Apply to:** `UpdateBanner.tsx` (dismiss), `Welcome.tsx` (hasSeenWelcome), `background/index.ts` (onInstalled)
```typescript
// Always await chrome.storage.local — it returns a Promise
const { key } = await chrome.storage.local.get('key');
await chrome.storage.local.set({ key: value });
```

### Background Error Handling
**Source:** `src/background/index.ts` lines 3–15
**Apply to:** All new `chrome.*` API calls in background/index.ts
```typescript
try {
  // chrome API call
} catch (err) {
  console.error('[interviewer-checklist] <action> failed:', err);
}
```

### Skip Link (a11y)
**Source:** `src/app/App.tsx` lines 50–55
**Apply to:** `Welcome.tsx` root component
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white dark:focus:bg-gray-900 focus:rounded focus:ring-2 focus:ring-blue-500"
>
  Skip to main content
</a>
```

## No Analog Found

No files are without analogs. All new files have direct equivalents in the codebase.

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/background/`, `src/store/`, `public/`, `manifest.json`, `vite.config.ts`
**Files scanned:** 12 source files read
**Pattern extraction date:** 2026-06-17
