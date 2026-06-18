# Phase 6: Multiple Named Sessions & Switcher - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 8 (5 new, 3 modified)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/store/app.ts` (modified) | store | CRUD + event-driven | `src/store/app.ts` (self) | exact |
| `src/app/main.tsx` (modified) | bootstrap/provider | request-response | `src/app/main.tsx` (self) | exact |
| `src/app/App.tsx` (modified) | component/root | event-driven | `src/app/App.tsx` (self) | exact |
| `src/components/ActionsGroup.tsx` (modified) | component | request-response | `src/components/ActionsGroup.tsx` (self) | exact |
| `src/components/SessionSwitcherModal.tsx` (new) | component/modal | request-response | `src/components/CandidateModal.tsx` | exact (same role + data flow) |
| `src/components/SessionRow.tsx` (new) | component | CRUD + event-driven | `src/components/CandidateModal.tsx` (input pattern) | role-match |
| `src/components/DeleteSessionConfirmDialog.tsx` (new) | component/modal | request-response | `src/components/ResetConfirmDialog.tsx` | exact |
| `src/components/UndoToast.tsx` (new) | component/notification | event-driven | `src/components/StorageToast.tsx` | exact |

---

## Pattern Assignments

### `src/store/app.ts` (modified — store, CRUD + event-driven)

**Analog:** `src/store/app.ts` (self — extend existing file)

**Existing AppState additions** — add after `activeSessionId: string` (line 65):
```typescript
// --- Session management (Phase 6) ---
/** Full manifest object mirrored in store for reactive session list. */
manifest: V2Manifest | null;
/** In-memory undo buffer for session delete — never persisted. */
undoBuffer: UndoBuffer | null;
```

**New UndoBuffer type** — add before AppState interface:
```typescript
export interface UndoBuffer {
  sessionMeta: V2Manifest['sessions'][number]; // SessionMeta
  sessionData: V3Session;
  wasActive: boolean;
}
```

**New AppActions additions** — add after `resetAll` (line 96):
```typescript
createSession: () => Promise<void>;
renameSession: (sessionId: string, newName: string) => Promise<void>;
duplicateSession: (sessionId: string) => Promise<void>;
deleteSession: (sessionId: string) => Promise<void>;
switchSession: (targetId: string) => Promise<void>;
undoDeleteSession: () => Promise<void>;
setUndoBuffer: (buf: UndoBuffer | null) => void;
setManifest: (manifest: V2Manifest) => void;
```

**DEFAULT_STATE additions** — add after `activeSessionId: ''` (line 116):
```typescript
manifest: null,
undoBuffer: null,
```

**switchSession action pattern** — derived from RESEARCH.md Pattern 2 and the existing store structure:
```typescript
switchSession: async (targetId) => {
  // SESS-04: flush pending writes BEFORE changing activeSessionId
  storageAdapter.flushPending();

  const key = `session:${targetId}`;
  const raw = await storageAdapter.read([key]);
  const session = raw[key] as V3Session | undefined;

  // Update manifest.activeSessionId in-memory
  set((s) => ({
    manifest: s.manifest
      ? { ...s.manifest, activeSessionId: targetId }
      : s.manifest,
    // Per-session fields + activeSessionId in ONE setState — Pitfall 2 guard
    scores: session?.scores ?? {},
    overrides: session?.overrides ?? {},
    notes: session?.notes ?? {},
    topicNotes: session?.topicNotes ?? {},
    customQuestions: session?.customQuestions ?? [],
    candidate: session?.candidate ?? null,
    activeSessionId: targetId,
  }));
},
```

**deleteSession action pattern** — capture undo buffer BEFORE remove:
```typescript
deleteSession: async (sessionId) => {
  const state = useAppStore.getState();
  const meta = state.manifest?.sessions.find((s) => s.id === sessionId);
  const raw = await storageAdapter.read([`session:${sessionId}`]);
  const data = raw[`session:${sessionId}`] as V3Session | undefined;
  const wasActive = sessionId === state.activeSessionId;

  // Capture undo buffer BEFORE deletion — Pitfall "Async deleteSession" guard
  if (meta && data) {
    set({ undoBuffer: { sessionMeta: meta, sessionData: data, wasActive } });
  }

  await chrome.storage.local.remove(`session:${sessionId}`);

  // Update manifest: remove entry, re-activate if needed
  // ... (auto-switch or createSession logic for last session)

  // Start undo timer — auto-clear after 10 seconds
  setTimeout(() => {
    set({ undoBuffer: null });
  }, 10_000);
},
```

**createSession auto-number pattern** — derived from RESEARCH.md Pattern 4:
```typescript
// Inside createSession action:
function nextSessionName(sessions: V2Manifest['sessions']): string {
  const numbers = sessions
    .map((s) => {
      const match = /^Session (\d+)$/.exec(s.name);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `Session ${max + 1}`;
}
const id = crypto.randomUUID();
const now = new Date().toISOString();
```

**Subscribe extension** — add manifest write to existing subscribe (lines 254-285 of app.ts):
```typescript
// ADD inside the existing useAppStore.subscribe callback, after the uiState write:
if (state.manifest) {
  storageAdapter.write({ manifest: state.manifest });
}
// The session:<id> write block already exists — do NOT replace it.
```

**Required new imports** (add to top of app.ts):
```typescript
import type { V2Manifest, V3Session } from '../storage/types.js';
import { createDefaultV3Session } from '../storage/types.js';
```

---

### `src/app/main.tsx` (modified — bootstrap/provider, request-response)

**Analog:** `src/app/main.tsx` (self — extend existing hydration block)

**Existing hydration pattern** (lines 18-57 of main.tsx — copy and extend):
```typescript
const initialState = await bootstrap();
// ... existing uiState read and setState ...

// Phase 6 addition: hydrate manifest into store
useAppStore.setState({
  manifest: initialState.manifest,
});
```

**Existing session hydration block** (lines 42-57) is the template for switchSession's load logic:
```typescript
if (activeSessionId) {
  const sessionRaw = await storageAdapter.read([`session:${activeSessionId}`]);
  const session = sessionRaw[`session:${activeSessionId}`] as V3Session | undefined;
  if (session) {
    useAppStore.setState({
      scores: session.scores ?? {},
      overrides: session.overrides ?? {},
      notes: session.notes ?? {},
      topicNotes: session.topicNotes ?? {},
      customQuestions: session.customQuestions ?? [],
      candidate: session.candidate ?? null,
    });
  }
}
```
The `switchSession` store action must replicate this same read + setState sequence.

**Required new import** (add to main.tsx imports):
```typescript
import type { V2Manifest } from '../storage/types.js';
```

---

### `src/app/App.tsx` (modified — root component, event-driven)

**Analog:** `src/app/App.tsx` (self — add UndoToast mount)

**StorageToast mount pattern** (line 84 of App.tsx) — copy for UndoToast:
```typescript
// Existing pattern (line 84):
<StorageToast />

// Phase 6 addition: mount UndoToast at same level — AFTER StorageToast
// so z-index stacking is predictable:
<UndoToast />
```

**UndoToast must be conditional** — render null when `undoBuffer` is null:
```typescript
// In App.tsx, read from store:
const undoBuffer = useAppStore((s) => s.undoBuffer);
// ...
{undoBuffer && <UndoToast />}
// OR let UndoToast itself guard — StorageToast pattern: `if (!visible) return null;`
```

**New import** to add to App.tsx:
```typescript
import { UndoToast } from '../components/UndoToast.js';
```

---

### `src/components/ActionsGroup.tsx` (modified — component, request-response)

**Analog:** `src/components/ActionsGroup.tsx` (self — extend existing pattern)

**Existing dialog trigger pattern** (lines 49-66 of ActionsGroup.tsx) — copy for session switcher:
```typescript
// Existing CandidateModal trigger (lines 49-56) — copy this pattern:
const candidateDialogRef = useRef<HTMLDialogElement>(null);
// ...
<button
  type="button"
  id="open-candidate-modal"
  onClick={() => candidateDialogRef.current?.showModal()}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Candidate details
</button>
```

**Session label + switcher insertion** — add BEFORE existing "Expand all" button (line 19), following RESEARCH.md ActionsGroup Extension Pattern:
```typescript
const sessionSwitcherRef = useRef<HTMLDialogElement>(null);
const manifest = useAppStore((s) => s.manifest);
const activeSessionId = useAppStore((s) => s.activeSessionId);
const activeSessionName =
  manifest?.sessions.find((s) => s.id === activeSessionId)?.name ?? '';

// In JSX, before "Expand all" button:
<p
  className="text-xs font-normal text-gray-500 dark:text-gray-400 px-1 truncate"
  aria-label="Active session"
>
  {activeSessionName}
</p>
<button
  type="button"
  id="open-session-switcher"
  onClick={() => sessionSwitcherRef.current?.showModal()}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Switch session
</button>
<hr className="border-gray-200 dark:border-gray-700 my-1" />
```

**SessionSwitcherModal mount** — add alongside CandidateModal (line 65):
```typescript
<SessionSwitcherModal dialogRef={sessionSwitcherRef} />
```

**New imports** to add:
```typescript
import { SessionSwitcherModal } from './SessionSwitcherModal.js';
```

---

### `src/components/SessionSwitcherModal.tsx` (new — component/modal, request-response)

**Analog:** `src/components/CandidateModal.tsx`

**Imports pattern** — copy from CandidateModal.tsx (lines 1-3), adapt:
```typescript
import { type RefObject, useEffect, useRef } from 'react';
import { useAppStore } from '../store/app.js';
import { DeleteSessionConfirmDialog } from './DeleteSessionConfirmDialog.js';
import { SessionRow } from './SessionRow.js';
```

**Props interface** — exact copy from CandidateModal.tsx (lines 5-7):
```typescript
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
}
```

**Focus trap + focus restore pattern** — copy verbatim from CandidateModal.tsx (lines 31-63):
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
    // Focus restore target: the button that opened this modal
    document.getElementById('open-session-switcher')?.focus();
  }

  dialogEl.addEventListener('keydown', handleKeyDown);
  dialogEl.addEventListener('close', handleClose);
  return () => {
    dialogEl.removeEventListener('keydown', handleKeyDown);
    dialogEl.removeEventListener('close', handleClose);
  };
}, [dialogRef]);
```

**Dialog element pattern** — copy from CandidateModal.tsx (line 98-101), adapt width:
```typescript
// T-05-03-04: Never pass open prop — always call .showModal() imperatively
<dialog
  ref={dialogRef}
  aria-labelledby="session-switcher-title"
  className="fixed inset-0 m-auto w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

**DeleteSessionConfirmDialog child** — nested inside modal (per RESEARCH.md architecture):
```typescript
// deleteDialogRef lives in SessionSwitcherModal
const deleteDialogRef = useRef<HTMLDialogElement>(null);
// ...
<DeleteSessionConfirmDialog
  dialogRef={deleteDialogRef}
  sessionId={pendingDeleteId}
  sessionName={pendingDeleteName}
  onDeleted={() => dialogRef.current?.close()}
/>
```

**Session list scroll container** — 8 rows visible (CONTEXT.md decision):
```typescript
<ul
  role="listbox"
  aria-label="Sessions"
  className="max-h-[352px] overflow-y-auto flex flex-col gap-1"
>
  {sessions.map((session) => (
    <SessionRow
      key={session.id}
      session={session}
      isActive={session.id === activeSessionId}
      onSwitch={() => { void switchSession(session.id); dialogRef.current?.close(); }}
      onRename={(name) => { void renameSession(session.id, name); }}
      onDuplicate={() => { void duplicateSession(session.id); }}
      onDelete={() => { setPendingDelete(session); deleteDialogRef.current?.showModal(); }}
    />
  ))}
</ul>
```

---

### `src/components/SessionRow.tsx` (new — component, CRUD + event-driven)

**Analog:** `src/components/CandidateModal.tsx` (input pattern from lines 119-128)

**Imports pattern:**
```typescript
import { useRef, useState } from 'react';
import type { V2Manifest } from '../storage/types.js';
```

**Props interface:**
```typescript
type SessionMeta = V2Manifest['sessions'][number];

interface Props {
  session: SessionMeta;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}
```

**Inline rename state pattern** — local `useState` for editing:
```typescript
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState(session.name);
const inputRef = useRef<HTMLInputElement>(null);

function startRename() {
  setDraft(session.name);
  setEditing(true);
  // focus input on next tick
  setTimeout(() => inputRef.current?.focus(), 0);
}

function commitRename(e: React.FocusEvent<HTMLInputElement>) {
  // Pitfall 5: don't commit if focus moved within the same <li>
  const li = e.currentTarget.closest('li');
  if (li?.contains(e.relatedTarget as Node)) return;
  const trimmed = draft.trim();
  if (!trimmed) { cancelRename(); return; }
  onRename(trimmed);
  setEditing(false);
}

function cancelRename() {
  setDraft(session.name);
  setEditing(false);
}

function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') { e.currentTarget.blur(); } // triggers blur → commit
  if (e.key === 'Escape') { cancelRename(); }
}
```

**Rename input** — copy input pattern from CandidateModal.tsx (lines 119-127), adapt:
```typescript
<input
  ref={inputRef}
  type="text"
  maxLength={50}
  value={draft}
  onChange={(e) => setDraft(e.target.value)}
  onBlur={commitRename}
  onKeyDown={handleKeyDown}
  className="flex-1 text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
  aria-label="Rename session"
/>
```

**Icon button pattern** — copy focus ring from ActionsGroup.tsx button (line 22):
```typescript
// All icon buttons use the same focus-visible ring:
className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
```

**Active session indicator** — static class map (no dynamic construction):
```typescript
// Static classes — never template literals with variable color names
const activeClass = 'text-blue-600 dark:text-blue-400 font-semibold';
const defaultClass = 'text-gray-900 dark:text-gray-100';
```

---

### `src/components/DeleteSessionConfirmDialog.tsx` (new — component/modal, request-response)

**Analog:** `src/components/ResetConfirmDialog.tsx` — exact structural match

**Imports pattern** — copy from ResetConfirmDialog.tsx (lines 1-3), adapt:
```typescript
import { type RefObject, useEffect } from 'react';
import { useAppStore } from '../store/app.js';
```

**Props interface** — extend beyond ResetConfirmDialog to include session info:
```typescript
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  sessionId: string;
  sessionName: string;
  onDeleted: () => void; // callback so parent (SessionSwitcherModal) can close itself
}
```

**Focus trap useEffect** — copy verbatim from ResetConfirmDialog.tsx (lines 14-46), change focus restore target:
```typescript
function handleClose() {
  // After deletion the switcher modal closes too; focus goes to the trigger
  document.getElementById('open-session-switcher')?.focus();
}
```

**Action handler pattern** — copy handleReset structure from ResetConfirmDialog.tsx (lines 53-57):
```typescript
// T-05-03-03 analog: capture undo buffer BEFORE any deletion
const handleDelete = async () => {
  await deleteSession(sessionId);  // store action — captures undoBuffer first
  dialogRef.current?.close();
  onDeleted(); // closes SessionSwitcherModal
};
```

**Keep button** — copy verbatim from ResetConfirmDialog.tsx (lines 78-84):
```typescript
<button
  type="button"
  onClick={() => dialogRef.current?.close()}
  className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Keep session
</button>
```

**Delete button** — copy red button pattern from ResetConfirmDialog.tsx (lines 85-92):
```typescript
<button
  type="button"
  onClick={() => { void handleDelete(); }}
  className="text-sm font-normal px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Delete session
</button>
```

**Dialog element** — copy from ResetConfirmDialog.tsx (lines 61-65):
```typescript
<dialog
  ref={dialogRef}
  aria-labelledby="delete-session-dialog-title"
  className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

---

### `src/components/UndoToast.tsx` (new — component/notification, event-driven)

**Analog:** `src/components/StorageToast.tsx` — exact structural match

**Imports pattern** — copy from StorageToast.tsx (line 1), adapt:
```typescript
import { useEffect } from 'react';
import { useAppStore } from '../store/app.js';
```

**Visibility guard pattern** — copy from StorageToast.tsx (lines 14):
```typescript
// StorageToast: if (!visible) return null;
// UndoToast: reads from store instead of local state
const undoBuffer = useAppStore((s) => s.undoBuffer);
const undoDeleteSession = useAppStore((s) => s.undoDeleteSession);
const setUndoBuffer = useAppStore((s) => s.setUndoBuffer);

if (!undoBuffer) return null;
```

**Toast container** — adapt StorageToast.tsx (lines 18-33), change position to full-width bottom:
```typescript
<div
  role="alert"
  aria-live="assertive"
  className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 dark:bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-lg"
  // Note: motion-safe animation for slide-up per RESEARCH.md Pattern UndoToast CSS
  style={{ animation: 'slide-up 150ms ease-out' }}
>
  <p className="text-sm">
    &ldquo;{undoBuffer.sessionMeta.name}&rdquo; deleted
  </p>
  <div className="flex gap-2 items-center">
    <button
      type="button"
      onClick={() => { void undoDeleteSession(); }}
      className="text-sm font-semibold underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      Undo
    </button>
    <button
      type="button"
      aria-label="Dismiss"
      onClick={() => setUndoBuffer(null)}
      className="text-gray-400 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      ×
    </button>
  </div>
</div>
```

**Auto-dismiss** — the store's deleteSession action already sets the 10s timeout. The component dismisses on Undo or × click via `setUndoBuffer(null)`.

**CSS keyframe** — add to `src/app/styles.css`:
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

---

## Shared Patterns

### Named Exports Only
**Source:** All existing source files (RESEARCH.md inferred constraint)
**Apply to:** All new/modified files
```typescript
// Correct — named export:
export function SessionSwitcherModal({ dialogRef }: Props) { ... }
// Never:
export default function SessionSwitcherModal(...) { ... }
```

### `.js` Extension on Relative Imports
**Source:** All existing source files (RESEARCH.md inferred constraint)
**Apply to:** All new/modified files
```typescript
// Correct — .js extension even for .tsx source:
import { useAppStore } from '../store/app.js';
import { DeleteSessionConfirmDialog } from './DeleteSessionConfirmDialog.js';
```

### Focus Ring on All Interactive Elements
**Source:** `src/components/ActionsGroup.tsx` line 22; `src/components/ResetConfirmDialog.tsx` lines 80, 88
**Apply to:** All buttons and inputs in new components
```typescript
// Required on every button and input:
className="... focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Native `<dialog>` — Never `open` Prop
**Source:** `src/components/CandidateModal.tsx` line 98 comment; `src/components/ResetConfirmDialog.tsx` line 61 comment
**Apply to:** `SessionSwitcherModal.tsx`, `DeleteSessionConfirmDialog.tsx`
```typescript
// Always imperative open:
dialogRef.current?.showModal()
// Never:
<dialog open={isOpen}>
```

### Focus Trap + Focus Restore via useEffect
**Source:** `src/components/CandidateModal.tsx` lines 31-63; `src/components/ResetConfirmDialog.tsx` lines 14-46
**Apply to:** `SessionSwitcherModal.tsx`, `DeleteSessionConfirmDialog.tsx`

The full pattern (Tab/Shift+Tab wrap + close event restore) must be copied verbatim. Only the `document.getElementById(...)` target changes per dialog.

### No Dynamic Tailwind Class Construction
**Source:** RESEARCH.md anti-patterns; established from Phase 4 QuestionCard
**Apply to:** `SessionRow.tsx` (active indicator), all new components
```typescript
// Correct — static class map:
const labelClass = isActive
  ? 'text-blue-600 dark:text-blue-400 font-semibold'
  : 'text-gray-900 dark:text-gray-100';
// Never:
className={`text-${isActive ? 'blue' : 'gray'}-600`}
```

### Async Action void-cast at Call Site
**Source:** `src/components/ResetConfirmDialog.tsx` line 87
**Apply to:** All async action invocations in JSX `onClick`
```typescript
// Correct:
onClick={() => { void handleDelete(); }}
// Never:
onClick={handleDelete}  // returns Promise, React warns on Promise in event handler
```

### Valibot Imports
**Source:** `src/storage/types.ts` line 1
**Apply to:** Any new validation in store actions
```typescript
import * as v from 'valibot';
// Use v.safeParse(V2ManifestSchema, data) — never hand-roll manifest validation
```

### crypto.randomUUID() for New Session IDs
**Source:** `src/storage/types.ts` line 164 (`createDefaultManifest`)
**Apply to:** `createSession`, `duplicateSession` actions in `app.ts`
```typescript
const id = crypto.randomUUID();
const now = new Date().toISOString();
```

---

## No Analog Found

All files have close analogs in the codebase. No files require falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `src/components/`, `src/store/`, `src/app/`, `src/storage/`
**Files read:** 9 (app.ts, main.tsx, App.tsx, ActionsGroup.tsx, CandidateModal.tsx, ResetConfirmDialog.tsx, StorageToast.tsx, storage/types.ts, 06-RESEARCH.md)
**Pattern extraction date:** 2026-06-17
