# Phase 6: Multiple Named Sessions & Switcher — Research

**Researched:** 2026-06-17
**Domain:** Multi-session management, Zustand store extension, Chrome storage, React native dialog
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**UI Entry Point & Switcher Display**
- Switcher trigger button lives in the **ActionsGroup sidebar** — consistent with the Candidate/Reset pattern established in Phase 5
- Active session name shown in a **small label above the switcher button** in the ActionsGroup
- Session list inside modal uses **compact text rows with inline icon buttons** (rename ✎, duplicate ⧉, delete ×) — table-density, not cards
- **8 rows** visible before the list scrolls

**Session Create & Naming**
- Default name for a new session: **"Session N"** (auto-incrementing from the highest existing session number + 1)
- Duplicate copies the **full session state** from the active session: scores, overrides, notes, topicNotes, customQuestions, candidate
- Rename UX: **inline click-to-edit** — click the name row, text becomes an `<input>`, Enter/blur commits; Escape cancels
- Session name max length: **50 characters**

**Delete Flow & State Boundaries**
- Deleting the **active session** auto-switches to the most-recently-updated remaining session; if no sessions remain, a blank "Session 1" is auto-created
- **Per-session state** (saved/restored on switch): scores, overrides, notes, topicNotes, customQuestions, candidate
- **Global state** (not reset on switch): darkMode, sidebar collapsed state, selectedSections, selectedDifficulties, hideMarked, searchQuery
- Undo toast appears at the **fixed bottom of the extension popup**, full-width, for ~10 seconds
- Deletion is **committed immediately** on storage write; undo only works while the popup is open (closing the popup during the undo window commits the deletion permanently)

### Claude's Discretion
- Session switcher modal title and exact button copy
- Animation/transition on toast appearance
- Visual styling of the active session row (highlight, checkmark, or other indicator)
- How "Switch session" confirmation is conveyed (immediate or brief loading indicator)

### Deferred Ideas (OUT OF SCOPE)
- Per-session UI state (filters, search, expanded topics) — Phase 6 keeps filters as global state; per-session filter persistence is a Phase 9 polish candidate
- Session re-ordering (drag to reorder) — deferred beyond Phase 6
- Session export from the switcher modal — covered in Phase 7 (YAML Export)
- Session templates / presets — out of scope for this milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SESS-01 | Multiple named sessions stored as individual `session:<id>` keys in `chrome.storage.local` plus a `manifest` key listing session IDs and metadata | Storage model already in place from Phase 3; Phase 6 adds create/rename/duplicate/delete management operations on top of existing V2Manifest + V3Session structure |
| SESS-02 | In-app session switcher modal — create new session, rename, duplicate, and delete existing sessions | SessionSwitcherModal using native `<dialog>` pattern from Phase 5; store actions: createSession, renameSession, duplicateSession, deleteSession, switchSession |
| SESS-03 | Session delete requires explicit modal confirmation; after delete a soft-delete undo toast appears for ~10 seconds | DeleteSessionConfirmDialog (same pattern as ResetConfirmDialog) + UndoToast with in-memory undo buffer + setTimeout auto-dismiss |
| SESS-04 | Session switch calls `flushPending()` synchronously before updating `activeSessionId` to prevent cross-session write corruption | `storageAdapter.flushPending()` already exists; switchSession action must call it before reading target session from storage and updating store state |
</phase_requirements>

---

## Summary

Phase 6 adds full multi-session management on top of storage infrastructure laid in Phase 3. The `V2Manifest` + `session:<id>` key structure is already present and validated. What Phase 6 adds is: (1) Zustand actions to create, rename, duplicate, delete, and switch sessions; (2) the `SessionSwitcherModal` component following the native `<dialog>` + focus-trap pattern established in Phase 5; (3) a `DeleteSessionConfirmDialog` and `UndoToast` for safe delete with soft-undo; and (4) a safe `switchSession` orchestration that calls `storageAdapter.flushPending()` synchronously before loading new session state.

The key architectural insight is that `switchSession` is the only truly complex operation: it must flush pending writes for the current session, delete all session-specific keys from the Zustand store, load the target session from `chrome.storage.local`, and set `activeSessionId` — all in the correct order to avoid write corruption (SESS-04). The existing `subscribe` callback in `app.ts` will immediately start writing to the new session key once `activeSessionId` changes, so that change must happen last.

The in-memory undo buffer is the other non-obvious piece: the deleted session's full data must be held in component/store state during the 10-second window, and the `undoDeleteSession` action must re-create both the manifest entry and the `session:<id>` storage key. Since deletion is committed immediately to `chrome.storage.local`, undo must re-write the data — it cannot simply "cancel" a pending write.

**Primary recommendation:** Extend `app.ts` with session management actions and an in-memory `undoBuffer` state field; build the three new components (`SessionSwitcherModal`, `DeleteSessionConfirmDialog`, `UndoToast`) following Phase 5 dialog patterns; extend `ActionsGroup` with the session label and switcher trigger.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session metadata (list, active ID) | Zustand store (app.ts) | chrome.storage.local via subscribe | Manifest is the source of truth; store mirrors it for reactive UI |
| Session scoring data (scores, notes, etc.) | chrome.storage.local (session:<id> key) | Zustand store (loaded on switch) | Each session is an independent storage shard; only active session lives in store |
| Switch orchestration (flush → load → activate) | Zustand action (switchSession) | StorageAdapter.flushPending() | Action coordinates cross-boundary concerns: flush, read, setState |
| Undo buffer (deleted session data) | Zustand store (in-memory only) | — | Never persisted; lives only until popup closes or timer expires |
| Modal/dialog lifecycle (open/close/focus) | Browser native `<dialog>` | React useRef | Consistent with CandidateModal/ResetConfirmDialog pattern from Phase 5 |
| Toast notification rendering | App.tsx root | — | Must overlay full viewport; mounted above SessionSwitcherModal z-stack |
| Auto-number new session names | Zustand createSession action | — | Compute "Session N" from manifest.sessions at action time |

---

## Standard Stack

### Core (no new packages — all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.14 | Session actions + in-memory undo buffer | Already used for all app state; subscribe pattern handles persistence |
| valibot | 1.4.1 | V2Manifest validation on session create/load | Already used for all schema validation; V2ManifestSchema is reusable |
| react | 19.2.7 | Component rendering (SessionSwitcherModal, SessionRow, UndoToast) | Project stack |
| vitest + @testing-library/react | 4.1.9 + 16.3.2 | Component unit tests | Project test stack |

[VERIFIED: package.json in repo] — no new npm packages needed for Phase 6.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| chrome.storage.local (native) | MV3 built-in | Read target session on switch; delete session key on commit | Direct API, not wrapped further |
| crypto.randomUUID() (native) | Chrome 92+ built-in | Generate new session IDs | Already used in createDefaultManifest() |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` + manual focus trap | Radix Dialog / Headless UI | Phase 5 established native pattern; adding a dependency for one more dialog is unjustified |
| In-memory undo buffer in Zustand | Store deleted session in chrome.storage.local under `deleted:<id>` | In-memory is simpler and correct — undo only works while popup is open by design |
| `setTimeout` for toast auto-dismiss | `useEffect` + interval | setTimeout is simpler; single dismiss timer is sufficient |

**Installation:** No new packages. Phase 6 is code-only.

---

## Package Legitimacy Audit

**No new packages are introduced in Phase 6.** All dependencies are already installed and have been verified in prior phases.

| Package | Registry | Status | Disposition |
|---------|----------|--------|-------------|
| zustand | npm | Already installed (Phase 4) | Approved |
| valibot | npm | Already installed (Phase 3) | Approved |
| react / react-dom | npm | Already installed (Phase 1) | Approved |
| vitest + @testing-library/react | npm | Already installed (Phase 1/2) | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
ActionsGroup (sidebar)
  │
  ├─ [session label: activeSessionName, truncated]
  ├─ [button: "Switch session" id="open-session-switcher"]
  │     │
  │     └─ calls sessionSwitcherRef.current.showModal()
  │
  └─ SessionSwitcherModal (native <dialog>)
        │
        ├─ [header: "Sessions" + close × button]
        │
        ├─ [<ul role="listbox"> max-h-[352px] overflow-y-auto]
        │     │
        │     └─ SessionRow × N (one per manifest.sessions entry)
        │           ├─ [active? checkmark ✓ (blue) : spacer]
        │           ├─ [button: session name → calls switchSession(id)]
        │           │     └─ switchSession:
        │           │           1. flushPending()                   ← SESS-04
        │           │           2. read session:<targetId> from storage
        │           │           3. setState({ ...sessionData, activeSessionId: targetId })
        │           │           4. update manifest.activeSessionId
        │           │           5. dialog.close()
        │           ├─ [button ✎ → starts inline rename]
        │           ├─ [button ⧉ → duplicateSession(id)]
        │           └─ [button × → opens DeleteSessionConfirmDialog]
        │
        └─ [footer: "New session" button → createSession()]

DeleteSessionConfirmDialog (native <dialog>, child of SessionSwitcherModal)
  │
  ├─ "Delete session?" title
  ├─ '"Name" will be permanently deleted...' body
  ├─ [Keep session → dialog.close()]
  └─ [Delete session →
        1. dialog.close()
        2. capture session data into undoBuffer
        3. chrome.storage.local.remove('session:<id>')
        4. update manifest (remove session entry)
        5. if deleted was active → switchSession(mostRecentRemaining) or createSession('Session 1')
        6. SessionSwitcherModal.close()
        7. mount UndoToast at App root]

App.tsx (root)
  └─ UndoToast (conditional, fixed bottom-0 full-width, z-50)
        ├─ '"Name" deleted'
        ├─ [Undo → undoDeleteSession() → re-insert session data + manifest entry]
        └─ [auto-dismiss after 10s via setTimeout]
```

### Recommended Project Structure

```
src/
├── components/
│   ├── ActionsGroup.tsx          # Extended: add session label + switcher trigger
│   ├── SessionSwitcherModal.tsx  # New: <dialog> with session list + new session footer
│   ├── SessionRow.tsx            # New: single list row (default, active, rename states)
│   ├── DeleteSessionConfirmDialog.tsx  # New: confirm dialog following ResetConfirmDialog pattern
│   └── UndoToast.tsx             # New: fixed-position ephemeral notification
├── store/
│   └── app.ts                    # Extended: manifest state, session actions, undoBuffer
└── app/
    └── App.tsx                   # Extended: mount UndoToast at root
```

### Pattern 1: Native `<dialog>` with Imperative showModal() and Focus Trap

**What:** Native HTML `<dialog>` element opened via `dialogRef.current?.showModal()`. Focus trap implemented via `addEventListener('keydown')` on the dialog element. Focus restore via `addEventListener('close', ...)`.

**When to use:** All modal dialogs in this project. Established in Phase 5 for CandidateModal and ResetConfirmDialog.

**Example (from ResetConfirmDialog.tsx — existing code):**
```typescript
// Source: src/components/ResetConfirmDialog.tsx (Phase 5, verified in codebase)
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

### Pattern 2: switchSession Action — Flush Before Switch

**What:** Session switching must be orchestrated in the correct sequence to prevent the subscribe callback from writing the current session's data under the new session's key.

**When to use:** Any time `activeSessionId` changes in the store.

**Correct sequence:**
```typescript
// Source: derived from SESS-04 requirement + existing subscribe pattern in app.ts
async function switchSession(targetId: string) {
  // 1. Flush any pending writes for the CURRENT session FIRST
  //    (storageAdapter.write() is debounced; flushPending() cancels the timer and writes now)
  storageAdapter.flushPending();

  // 2. Read target session data from chrome.storage.local
  const key = `session:${targetId}`;
  const raw = await storageAdapter.read([key]);
  const session = raw[key] as V3Session | undefined;

  // 3. Update manifest.activeSessionId in storage
  //    (must update manifest BEFORE or SIMULTANEOUSLY with store setState
  //     to keep storage and store consistent)

  // 4. Atomically update store: replace per-session fields + set activeSessionId LAST
  //    The subscribe callback fires after set(), so activeSessionId must be the new one
  //    when the first write fires, or the data lands under the wrong key.
  useAppStore.setState({
    scores: session?.scores ?? {},
    overrides: session?.overrides ?? {},
    notes: session?.notes ?? {},
    topicNotes: session?.topicNotes ?? {},
    customQuestions: session?.customQuestions ?? [],
    candidate: session?.candidate ?? null,
    activeSessionId: targetId,  // ← set LAST so subscribe writes to correct key
  });
}
```

**Critical ordering constraint:** `activeSessionId` must change in the same `setState` call as the session data. If changed separately, the subscribe callback may write old data to the new key between the two `set()` calls.

### Pattern 3: In-Memory Undo Buffer

**What:** Deleted session data (full V3Session + SessionMeta) is held in Zustand state for the 10-second undo window. Never persisted to storage.

**When to use:** Immediately before issuing `chrome.storage.local.remove()` for the deleted session.

**Example:**
```typescript
// Source: derived from CONTEXT.md delete flow + existing Zustand patterns in app.ts
interface UndoBuffer {
  sessionMeta: SessionMeta;  // from V2Manifest sessions array
  sessionData: V3Session;    // full scoring payload
  wasActive: boolean;        // if true, restore as active on undo
}

// In store state:
undoBuffer: UndoBuffer | null;  // null = no undo available

// deleteSession action:
deleteSession: async (sessionId: string) => {
  const state = useAppStore.getState();
  const meta = state.manifest.sessions.find(s => s.id === sessionId);
  const rawData = await storageAdapter.read([`session:${sessionId}`]);
  const data = rawData[`session:${sessionId}`] as V3Session;
  const wasActive = sessionId === state.activeSessionId;

  // Capture undo buffer BEFORE any deletions
  set({ undoBuffer: { sessionMeta: meta!, sessionData: data, wasActive } });

  // Commit deletion to storage immediately
  await chrome.storage.local.remove(`session:${sessionId}`);

  // Update manifest
  // ... remove from sessions array, update activeSessionId if needed ...

  // Start undo timer
  setTimeout(() => {
    set({ undoBuffer: null });
  }, 10_000);
};
```

### Pattern 4: SessionMeta Auto-Number ("Session N")

**What:** When creating a new session, name defaults to "Session N" where N is `highest existing session number + 1`.

**Example:**
```typescript
// Source: derived from CONTEXT.md naming rule
function nextSessionName(sessions: SessionMeta[]): string {
  const numbers = sessions
    .map(s => {
      const match = /^Session (\d+)$/.exec(s.name);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `Session ${max + 1}`;
}
```

### Pattern 5: Duplicate Session

**What:** Duplicates any session row's data, creating a new session. The duplicate is NOT auto-activated.

**Key rule from CONTEXT.md:** "clicking ⧉ on B duplicates B regardless of active session" — so the action receives the target session's ID, not the active session's ID.

**Duplicate name:** `"{originalName} (copy)"`.

**Steps:**
1. Read `session:<targetId>` from storage.
2. Generate new ID via `crypto.randomUUID()`.
3. Write a new `session:<newId>` with all data from target session, but `id: newId`.
4. Append `SessionMeta` to `manifest.sessions` with name `"{original} (copy)"`.
5. Update Zustand manifest state (does NOT change `activeSessionId`).

### Pattern 6: Zustand Manifest State Extension

**What:** Add `manifest: V2Manifest | null` and `sessions: SessionMeta[]` (derived from manifest for convenience) to the Zustand store.

**Rationale:** The subscribe pattern already persists session data. Adding manifest as store state allows reactive updates to the session list when sessions are created/renamed/deleted/switched. The existing `activeSessionId` field in the store is already used and must stay.

**Extension to AppState:**
```typescript
// Additions to AppState in app.ts
manifest: V2Manifest | null;           // full manifest object
undoBuffer: UndoBuffer | null;         // in-memory undo; never persisted
```

**Additions to subscribe callback (do NOT replace existing subscribe):**
```typescript
// Existing subscribe already handles uiState + session:<id> writes.
// ADD: persist manifest when it changes
storageAdapter.write({ manifest: state.manifest });
```

**NOTE:** The subscribe writes manifest on every state change. The manifest should only be written when it actually changes. Guard with a previous-manifest comparison OR accept the minor overhead of writing manifest on every scoring update (acceptable given chrome.storage.local is local and fast). [ASSUMED] — either approach works; the planner can choose.

### Anti-Patterns to Avoid

- **Switching activeSessionId before flushPending:** The subscribe callback will immediately write the CURRENT session's data to `session:<newId>` if `activeSessionId` changes first. Always flush, then switch.
- **Calling resetAll() on session switch:** resetAll() clears filters and searchQuery which are global state. Session switch must surgically replace only per-session fields (scores, overrides, notes, topicNotes, customQuestions, candidate).
- **`<dialog open>` prop:** Never — always `dialogRef.current?.showModal()` imperatively. [VERIFIED: CandidateModal.tsx comment "T-05-03-04: Never pass open prop"]
- **Rendering UndoToast inside SessionSwitcherModal:** Toast must be at App root so it can be visible after the modal closes. CONTEXT.md: "toast stays" even if modal closes.
- **Async deleteSession without capturing undo buffer first:** Read the session data and capture `undoBuffer` BEFORE `chrome.storage.local.remove()` — once deleted from storage, the data is gone if undo is later requested.
- **Dynamic Tailwind class construction:** Never `\`text-${color}-500\``. Use static class maps (established pattern from Phase 4 QuestionCard).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal focus trapping | Custom FocusTrap class | Manual `querySelectorAll` + Tab/Shift+Tab in keydown handler | Already established in Phase 5; consistent pattern; no dep |
| Session ID generation | Custom UUID or timestamp ID | `crypto.randomUUID()` | Already used in `createDefaultManifest()`; collision-free |
| Schema validation for V2Manifest on create | Ad-hoc checks | `v.safeParse(V2ManifestSchema, ...)` | Already in bootstrap.ts; same function for validation |
| Storage write debouncing | Custom debounce | `storageAdapter.write()` | 300ms debounce already implemented |
| Synchronous pre-switch flush | await storageAdapter.flush | `storageAdapter.flushPending()` | Already exists; designed for this use case |

**Key insight:** All infrastructure for this phase is already built. Phase 6 is pure orchestration (new actions) + UI (new components).

---

## Runtime State Inventory

> Phase 6 is not a rename/refactor/migration phase. This section is included because Phase 6 modifies the `manifest` storage key and must account for pre-existing manifest state.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `manifest` key (already validated as V2Manifest by bootstrap.ts); each `session:<id>` key already exists | No migration needed — Phase 6 CRUD operations on existing format |
| Live service config | None — chrome.storage.local only | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None relevant to session management | None |

**Existing manifest format is compatible with Phase 6 operations.** `V2Manifest.sessions` array already has `id`, `name`, `createdAt`, `updatedAt` fields. Phase 6 `renameSession` and `duplicateSession` update `updatedAt` to `new Date().toISOString()`. [ASSUMED] — updatedAt must be updated on rename/duplicate to support "most recently updated" sort for auto-switch-on-delete.

---

## Common Pitfalls

### Pitfall 1: Cross-Session Write Corruption on Switch

**What goes wrong:** User switches sessions while a score change is debouncing. The debounce fires 300ms later and writes the previous session's data to `session:<newId>`.

**Why it happens:** `storageAdapter.write()` uses a 300ms debounce. If `activeSessionId` changes in the store, the subscribe callback fires with the new `activeSessionId` but the debounce may still have old data pending from the previous write call.

**How to avoid:** Call `storageAdapter.flushPending()` BEFORE changing `activeSessionId` in the store. `flushPending()` cancels the timer and synchronously initiates the flush. This is SESS-04.

**Warning signs:** After switching sessions, the new session's data matches the previous session's final state.

### Pitfall 2: setState Race — Per-Session Fields and activeSessionId in Separate Calls

**What goes wrong:** `set({ activeSessionId: targetId })` fires, subscribe writes, then `set({ scores: newScores })` fires, subscribe writes again — but now the second write lands under the correct key. HOWEVER, between the two `set()` calls, React re-renders with the new `activeSessionId` but OLD `scores`. UI briefly shows new session ID with wrong data.

**How to avoid:** Always `setState` all per-session fields AND `activeSessionId` in a single call.

### Pitfall 3: Undo After Popup Close

**What goes wrong:** User deletes session, leaves popup open, returns, clicks Undo — but `undoBuffer` is null because the popup was navigated away from (page reload or extension re-open clears in-memory state).

**Why it happens:** `undoBuffer` is in-memory Zustand state; it does not survive page reload.

**How to avoid:** This is by design (CONTEXT.md: "closing the popup during the undo window commits the deletion permanently"). No fix needed — just don't persist `undoBuffer` to storage, and don't restore it on bootstrap.

### Pitfall 4: Auto-Switch After Deleting Active Session — Empty State

**What goes wrong:** Last session is deleted. Auto-switch finds no remaining sessions and crashes with undefined.

**How to avoid:** Before auto-switching, check `manifest.sessions.length` after removal. If 0, call `createSession("Session 1")` first, THEN switch to the new session. The `createSession` action must run synchronously (no async gap) before the store settles to avoid a render with empty sessions.

**Warning signs:** `manifest.sessions` is an empty array; `activeSessionId` is an empty string.

### Pitfall 5: Inline Rename Blurs Immediately (Input in List Focus Battle)

**What goes wrong:** The inline rename input is inserted into a `<ul>` with `role="listbox"`. The `blur` event fires when clicking the icon buttons inside the same row, committing an empty rename.

**How to avoid:** On `blur`, check `e.relatedTarget` — if focus moved to an element inside the same `<li>`, do NOT commit. Use `e.currentTarget.closest('li')?.contains(e.relatedTarget as Node)` guard.

**Warning signs:** Empty session names appear after clicking adjacent buttons while rename is active.

### Pitfall 6: Manifest Not Written After Session Operations

**What goes wrong:** `createSession`, `renameSession`, `duplicateSession`, `deleteSession` update Zustand state but the `manifest` key in `chrome.storage.local` is not updated, so on next bootstrap the new/renamed/deleted session is not reflected.

**How to avoid:** The Zustand subscribe callback MUST include a `manifest` write. Add `storageAdapter.write({ manifest: state.manifest })` to the existing subscribe alongside the `uiState` write. This ensures every state change persists the manifest.

**Alternative:** Each session action calls `storageAdapter.write({ manifest: updatedManifest })` directly. Either approach works; subscribing is more consistent with the established pattern.

### Pitfall 7: `SessionRow` Rename Input `maxLength` vs Validation

**What goes wrong:** `maxLength={50}` enforces at the DOM level, but if the session name already has 50 characters and the user types, the input silently rejects. Empty-on-blur validation must also handle the "exactly 50 char" case as valid.

**How to avoid:** Validation on blur: `if (!value.trim()) { cancelRename(); return; }`. Length is already enforced by `maxLength`. Do not add a separate length check that would reject valid 50-char names.

---

## Code Examples

Verified patterns from existing codebase:

### V2Manifest + SessionMeta (existing types, Phase 3)
```typescript
// Source: src/storage/types.ts (verified in codebase)
export const V2ManifestSchema = v.object({
  version: v.literal(2),
  activeSessionId: v.string(),
  sessions: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      createdAt: v.string(),
      updatedAt: v.string(),
    }),
  ),
});
export type V2Manifest = v.InferOutput<typeof V2ManifestSchema>;
// SessionMeta = V2Manifest['sessions'][number]
```

### StorageAdapter.flushPending() (existing, Phase 3)
```typescript
// Source: src/storage/adapter.ts (verified in codebase)
flushPending(): void {
  if (!this.#dirty || this.#pendingData === null) return;
  if (this.#debounceTimer !== null) {
    clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;
  }
  void this.#flush();
}
```

### Zustand Store Subscribe Pattern (existing, Phase 5)
```typescript
// Source: src/store/app.ts (verified in codebase)
useAppStore.subscribe((state) => {
  storageAdapter.write({ uiState: { /* ... */ } });
  if (state.activeSessionId) {
    storageAdapter.write({
      [`session:${state.activeSessionId}`]: {
        version: 3,
        id: state.activeSessionId,
        scores: state.scores,
        // ... other per-session fields
      },
    });
  }
});
```

### Focus Restore Pattern (existing, Phase 5)
```typescript
// Source: src/components/ResetConfirmDialog.tsx (verified in codebase)
function handleClose() {
  document.getElementById('open-reset-dialog')?.focus();
}
dialogEl.addEventListener('close', handleClose);
```

### ActionsGroup Extension Pattern (existing, Phase 5)
```typescript
// Source: src/components/ActionsGroup.tsx (verified in codebase)
// Session switcher elements insert BEFORE existing "Expand all" button
// following the same w-full text-sm px-4 py-2 text-left pattern:
<p className="text-xs font-normal text-gray-500 dark:text-gray-400 px-1 truncate"
   aria-label="Active session">
  {activeSessionName}
</p>
<button
  type="button"
  id="open-session-switcher"
  onClick={() => sessionSwitcherRef.current?.showModal()}
  className="w-full text-sm px-4 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Switch session
</button>
<hr className="border-gray-200 dark:border-gray-700 my-1" />
```

### UndoToast CSS Keyframe (new — add to styles.css)
```css
/* Source: 06-UI-SPEC.md — new keyframe for slide-up animation */
@keyframes slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
/* No new Tailwind config needed — use motion-safe:animate-[slide-up_150ms_ease-out] */
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Third-party dialog libraries (react-modal, @radix-ui/dialog) | Native `<dialog>` + manual focus trap | Phase 5 decision (this project) | No dependency, native browser behavior, simpler focus semantics |
| Storing undo state in localStorage / sessionStorage | In-memory Zustand state for ephemeral undo | Phase 6 decision | Correct behavior — undo only works while popup is open |
| Separate "session management page" | In-sidebar switcher modal | CONTEXT.md locked | Consistent with single-surface design philosophy |

**Deprecated/outdated in this codebase:**
- `V2Session` (version: 2) — used for migration compatibility only; all active sessions are V3Session (version: 3) after Phase 5 migration. Phase 6 creates only V3Sessions.
- `createDefaultSession()` (creates V2Session) — Phase 6 uses `createDefaultV3Session()` exclusively.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `updatedAt` on SessionMeta should be updated to `new Date().toISOString()` on rename and duplicate, to support "most recently updated" sort for auto-switch-on-delete | Common Pitfalls (Pitfall 4) + switchSession | Auto-switch after deleting active session may not select the most recent session; minor UX issue |
| A2 | The `manifest` write in the subscribe callback is acceptable overhead on every state change (including score changes) | Architecture Patterns (Pattern 6) | If manifest writes cause measurable performance issues on rapid scoring, a selector-based guard is needed; unlikely to be a problem with chrome.storage.local |
| A3 | `duplicateSession` copies data from the clicked row's session, not the active session's CURRENT Zustand state | Interaction Contract (Duplicate) | If the planner reads the session from Zustand store instead of chrome.storage.local, duplicating a non-active session will copy active session data; must always read from storage by session ID |

**If this table is empty:** Would mean all claims are verified — but A1, A2, A3 above represent design decisions where multiple reasonable approaches exist.

---

## Open Questions

1. **Where is `undoBuffer` cleared on popup close / page unload?**
   - What we know: `undoBuffer` is in-memory Zustand state; clearing it explicitly on pagehide is not necessary (the page unloads anyway). The `deleteSession` action writes to `chrome.storage.local` immediately, so if the popup closes during the undo window, the deletion is permanent by design.
   - What's unclear: Should a `pagehide` handler explicitly null out `undoBuffer`? This is pure cleanup with no behavioral difference.
   - Recommendation: No explicit cleanup needed; Zustand state is ephemeral to the page lifetime.

2. **Should the manifest write be a separate subscribe or combined with the existing subscribe?**
   - What we know: The existing subscribe in `app.ts` writes `uiState` and `session:<activeId>` on every state change. Adding `manifest` to the same subscribe ensures atomic ordering.
   - What's unclear: If manifest is written on every scoring change (even when unchanged), the write is redundant but harmless.
   - Recommendation: Add manifest write to the existing subscribe callback alongside uiState. The planner may optionally add a guard to only write manifest when `state.manifest !== prevManifest` using the two-argument subscribe form.

3. **Focus target after SessionSwitcherModal closes following a delete?**
   - What we know: UI-SPEC says focus returns to `#open-session-switcher`. But after deleting the active session, the modal closes. The toast appears at the bottom. Focus returning to `#open-session-switcher` is correct.
   - What's unclear: Nothing — the UI-SPEC is clear. Document for implementer awareness only.
   - Recommendation: `dialog.addEventListener('close', () => document.getElementById('open-session-switcher')?.focus())` — same pattern as all Phase 5 dialogs.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is pure code changes using already-installed packages and browser built-ins (chrome.storage.local, crypto.randomUUID, native dialog). No new external dependencies.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` (root) |
| Environment | happy-dom |
| Quick run command | `npx vitest run src/components/SessionSwitcherModal.test.tsx` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-01 | Manifest + session:<id> keys written on create/rename/duplicate/delete | unit (store actions) | `npx vitest run src/store/app.test.ts` | ❌ Wave 0 gap — extend existing app.test.ts |
| SESS-02 | SessionSwitcherModal renders session list, "New session" button, close button | unit (component) | `npx vitest run src/components/SessionSwitcherModal.test.tsx` | ❌ Wave 0 |
| SESS-02 | ActionsGroup renders session label + "Switch session" trigger button with correct id | unit (component) | `npx vitest run src/components/ActionsGroup.test.tsx` | ✅ (exists, must be extended) |
| SESS-02 | Inline rename: input appears, Enter commits, Escape cancels, blur commits | unit (SessionRow) | `npx vitest run src/components/SessionRow.test.tsx` | ❌ Wave 0 |
| SESS-03 | DeleteSessionConfirmDialog: "Keep session" closes without deleting; "Delete" triggers delete + undo toast | unit (component) | `npx vitest run src/components/DeleteSessionConfirmDialog.test.tsx` | ❌ Wave 0 |
| SESS-03 | UndoToast: appears after delete, "Undo" restores session, auto-dismisses after 10s | unit (component) | `npx vitest run src/components/UndoToast.test.tsx` | ❌ Wave 0 |
| SESS-04 | switchSession calls flushPending() before setState; activeSessionId changes in same setState as session data | unit (store action) | `npx vitest run src/store/app.test.ts` | ❌ Wave 0 gap |

### Test Mock Patterns (consistent with Phase 5)

```typescript
// Mock pattern from ResetConfirmDialog.test.tsx (verified in codebase):
vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));
vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    flushPending: vi.fn(),
    read: vi.fn().mockResolvedValue({}),
    write: vi.fn(),
  },
}));
// chrome mock via vitest-chrome (already in vitest.config.ts alias)
vi.mock('chrome', () => ({
  storage: { local: { remove: vi.fn(), set: vi.fn() } }
}));
```

### Sampling Rate
- **Per task commit:** `npx vitest run` (full suite — fast enough; no per-task subsets needed)
- **Per wave merge:** `npx vitest run` (full suite green)
- **Phase gate:** Full suite green + typecheck clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/SessionSwitcherModal.test.tsx` — covers SESS-02 modal rendering
- [ ] `src/components/SessionRow.test.tsx` — covers SESS-02 rename flow
- [ ] `src/components/DeleteSessionConfirmDialog.test.tsx` — covers SESS-03 confirm flow
- [ ] `src/components/UndoToast.test.tsx` — covers SESS-03 undo toast behavior
- [ ] `src/store/app.test.ts` — extend with session action tests for SESS-01 and SESS-04

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this extension (chrome.storage.local only) |
| V3 Session Management | yes | `chrome.storage.local` isolation (extension-partitioned); `flushPending()` prevents cross-session writes |
| V4 Access Control | no | Single-user, no roles |
| V5 Input Validation | yes | Session name: `maxLength={50}` on input + server-side (store action) trim + non-empty validation before commit |
| V6 Cryptography | no | No keys/passwords in session management |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-session write pollution | Tampering | `flushPending()` before activeSessionId change (SESS-04) |
| Session name XSS injection | Tampering | React JSX escapes all string values; no dangerouslySetInnerHTML used |
| Orphaned session key in storage | Information Disclosure | `deleteSession` must remove `session:<id>` key via `chrome.storage.local.remove()`; not just remove from manifest |
| Storage quota exhaustion via session creation | DoS | Existing `#checkQuota()` in StorageAdapter warns at 80%; no additional guard needed for Phase 6 |

**Security note:** Session name is user-supplied input displayed in JSX. React escapes it. No sanitization beyond `maxLength` + `trim()` is needed for a local-only extension with no backend.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md does not exist in the working directory. No project-specific directives to enforce beyond what is documented in REQUIREMENTS.md and the established patterns from Phases 1–5.

**Inferred constraints from existing codebase (treat as binding):**
- Named exports only — no default exports [VERIFIED: all existing source files]
- `.js` extension on all relative imports even from `.tsx` source files [VERIFIED: all existing imports]
- `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` on all interactive elements [VERIFIED: every button in existing components]
- No dynamic Tailwind class construction — static class maps only [VERIFIED: QuestionCard.tsx comment]
- Never `<dialog open>` — always `.showModal()` imperatively [VERIFIED: CandidateModal.tsx comment T-05-03-04]
- Biome 2.5.0 for linting/formatting [VERIFIED: package.json devDependencies]
- TypeScript strict mode (`~6.0`) [VERIFIED: package.json]

---

## Sources

### Primary (HIGH confidence — verified in codebase)
- `src/storage/types.ts` — V2Manifest, V2ManifestSchema, V3Session, createDefaultV3Session, SessionMeta type
- `src/storage/adapter.ts` — StorageAdapter.flushPending(), write(), read(), #flush() implementation
- `src/storage/bootstrap.ts` — session loading pattern, V3SessionSchema validation on read
- `src/store/app.ts` — Zustand store shape, subscribe pattern, activeSessionId field, resetAll() semantics
- `src/components/ActionsGroup.tsx` — existing sidebar structure, dialog trigger pattern
- `src/components/CandidateModal.tsx` — native dialog + focus trap + focus restore pattern
- `src/components/ResetConfirmDialog.tsx` — confirm dialog + async action + snapshot ordering
- `src/app/App.tsx` — root component structure, StorageToast mount position (model for UndoToast)
- `src/app/main.tsx` — hydration pattern: bootstrap() → setState({ activeSessionId, ...sessionData })
- `.planning/phases/06-multiple-named-sessions-switcher/06-CONTEXT.md` — all locked decisions
- `.planning/phases/06-multiple-named-sessions-switcher/06-UI-SPEC.md` — full component specs, interaction contracts, accessibility contract
- `vitest.config.ts` — test framework, coverage config, environment

### Secondary (MEDIUM confidence — from planning documents)
- `.planning/REQUIREMENTS.md` — SESS-01 through SESS-04 requirement text
- `.planning/phases/05-scoring-ui-notes-candidate-custom-questions/05-PATTERNS.md` — Phase 5 pattern map

### Tertiary (LOW confidence — none in this research)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase verified, no new packages
- Architecture: HIGH — existing patterns fully read and understood; all integration points confirmed
- Pitfalls: HIGH — derived from direct inspection of subscribe + flushPending() + dialog patterns
- Test map: MEDIUM — test files don't exist yet (Wave 0 gaps); commands are standard Vitest invocations

**Research date:** 2026-06-17
**Valid until:** 2026-08-17 (stable stack; no fast-moving dependencies)
