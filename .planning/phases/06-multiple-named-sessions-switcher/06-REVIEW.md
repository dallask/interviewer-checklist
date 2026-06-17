---
phase: 06-multiple-named-sessions-switcher
reviewed: 2026-06-17T12:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/app/main.tsx
  - src/components/DeleteSessionConfirmDialog.tsx
  - src/components/SessionRow.tsx
  - src/components/SessionSwitcherModal.tsx
  - src/store/app.ts
findings:
  critical: 2
  warning: 2
  info: 2
  total: 6
status: issues_found
---

# Phase 06: Code Review Report (Re-review)

**Reviewed:** 2026-06-17T12:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Re-review after fixes for CR-01 through CR-04 and WR-01 through WR-05. Five of the eight findings are fully resolved: CR-02 (leaked undo timer), CR-03 (Escape-then-blur double-trigger), CR-04 (missing manifest optional-chain), WR-02 (focus-trap empty-list crash), and WR-03 (switchSession fire-and-forget) are all correctly fixed. WR-01, WR-04, and WR-05 are also resolved.

**CR-01 is not fixed.** The comment at `app.ts:441-443` claims the abstraction boundary is no longer violated, but `chrome.storage.local.remove` is still called directly on line 445; no `remove()` method was added to `StorageAdapter`. More critically, the `flushPending()` call on line 444 is fire-and-forget inside the adapter (`void this.#flush()`), meaning the pending-write set and the subsequent `remove` execute concurrently — the remove can complete before `#flush`'s `chrome.storage.local.set` finishes, leaving the deleted session key silently re-written by the flush.

Two new issues were introduced by the WR-01 and WR-03 fixes. One new warning was introduced by partial WR-04 fix. One existing informational finding (IN-01, code duplication) remains unresolved.

---

## Critical Issues

### CR-01: Raw `chrome.storage.local.remove` still present; `flushPending()` race not eliminated

**File:** `src/store/app.ts:444-445`
**Issue:** `deleteSession` calls `storageAdapter.flushPending()` on line 444 and then `await chrome.storage.local.remove(...)` on line 445. The fix comment at line 441 claims this satisfies the abstraction requirement, but it does not:

1. **No `remove()` on `StorageAdapter`** — the adapter's public API is `read()`, `write()`, `flushPending()`, `snapshot()`. Calling `chrome.storage.local.remove` directly still bypasses the abstraction layer.

2. **`flushPending()` is fire-and-forget** — `flushPending()` calls `void this.#flush()` internally (adapter.ts:55). `#flush()` captures `#pendingData` synchronously and clears `#dirty`/`#pendingData` before the first `await` (adapter.ts:66-68), then calls `await chrome.storage.local.set(data)`. This means after `flushPending()` returns, two async I/O operations are simultaneously in flight: the adapter's `set(data)` (which includes the `session:${sessionId}` key written by the subscribe callback) and `deleteSession`'s own `remove(session:${sessionId})`. The remove can win the race and complete first; the set then re-writes the deleted key, silently un-deleting the session.

3. **Subscribe re-writes the key before `flushPending`** — `set({ undoBuffer: ... })` on line 438 triggers the Zustand subscribe callback (app.ts:520). At that point `state.activeSessionId` still equals the session being deleted, so the subscribe writes `session:${sessionId}` into the adapter's pending buffer (app.ts:543-554). `flushPending()` on line 444 then flushes this write. The race described in (2) follows.

**Fix:** Add a `remove(keys: string | string[])` method to `StorageAdapter` that (a) calls `flushPending()` synchronously to drain any pending writes first, (b) awaits `chrome.storage.local.remove(keys)`, and (c) returns a `Promise<void>`. Replace the two-line sequence with a single awaited `storageAdapter.remove(...)` call:

```typescript
// StorageAdapter.remove (new method in adapter.ts):
async remove(keys: string | string[]): Promise<void> {
  // Drain pending writes synchronously so they don't race with the remove.
  // flushPending() is fire-and-forget by design for lifecycle use, but here
  // we need to await the actual storage operation.
  if (this.#dirty && this.#pendingData !== null) {
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    await this.#flush();
  }
  await chrome.storage.local.remove(keys);
}

// In deleteSession (app.ts), replace lines 444-445:
await storageAdapter.remove(`session:${sessionId}`);
```

Note: this approach requires making `#flush` awaitable from `remove`, which it already is (it returns `Promise<void>`). The `async remove` method can call `await this.#flush()` instead of `void this.#flush()` to ensure the pending write completes before the remove executes.

---

### CR-05: `handleNewSession` swallows `createSession` rejection silently

**File:** `src/components/SessionSwitcherModal.tsx:61-65`
**Issue:** This is a new defect introduced when the WR-03 fix pattern (await + error handling) was applied to `onSwitch` but not to `handleNewSession`. The current code is:

```typescript
function handleNewSession() {
  void createSession().then(() => {
    dialogRef.current?.close();
  });
}
```

`void expr.then(...)` — if `createSession()` rejects, the rejection propagates into `.then()`, which produces a rejected promise that is then discarded by `void`. The user sees no feedback, the dialog does not close (because `.then()` doesn't run on rejection), and the UI is left open and unresponsive with no indication of what happened. This is the identical pattern that WR-03 identified for `switchSession` — one was fixed, the other was not.

**Fix:** Apply the same async/await + try/catch pattern used in `onSwitch`:
```typescript
async function handleNewSession() {
  try {
    await createSession();
    dialogRef.current?.close();
  } catch (err) {
    console.error('[SessionSwitcherModal] createSession failed:', err);
  }
}
```

---

## Warnings

### WR-06: `handleDelete` close triggers `handleClose` focus restore before `onDeleted` closes parent modal — spurious focus sequence

**File:** `src/components/DeleteSessionConfirmDialog.tsx:59` and `src/components/SessionSwitcherModal.tsx:148`
**Issue:** The WR-01 fix changed `handleDelete` to call `dialogRef.current?.close()` first (line 59), then `onDeleted()` in `finally` (line 68). The `onDeleted` prop from `SessionSwitcherModal` is `() => dialogRef.current?.close()` (the parent modal's close). This creates a double-focus-restore sequence:

1. `DeleteSessionConfirmDialog.close()` (line 59) fires the delete dialog's `close` event → `handleClose` (lines 43-48) focuses `delete-session-${pendingDelete.id}` — the delete button inside the **already-closing parent modal**.
2. Shortly after, `onDeleted()` calls the parent modal's `.close()` → `SessionSwitcherModal`'s `handleClose` (lines 49-52) focuses `open-session-switcher`.

Step 1 moves focus into a DOM element that is part of the parent modal, which is about to close. Depending on browser implementation, focusing a node inside a dialog that is closing can produce a brief focus flash or announce a spurious accessible name to screen readers, since the element is inside an element with `display: none` being applied. The final focus destination (step 2) is correct, but the intermediate step is not.

**Fix:** Clear the delete dialog's focus-restore behavior when deletion is confirmed (as opposed to cancelled), since the parent modal is closing anyway and will restore focus itself:
```typescript
const handleDelete = async () => {
  // Suppress delete dialog's own focus restore — parent modal close (via
  // onDeleted) will fire its own handleClose and restore to 'open-session-switcher'.
  dialogEl.removeEventListener('close', handleClose); // or use a ref flag
  dialogRef.current?.close();
  try {
    await deleteSession(sessionId);
  } catch (err) {
    console.error('[DeleteSessionConfirmDialog] deleteSession failed:', err);
  } finally {
    onDeleted();
  }
};
```
A simpler alternative: introduce a `skipFocusRestore` ref that `handleDelete` sets to `true` before closing, which `handleClose` checks before calling `.focus()`.

---

### WR-07: `onRename` and `onDuplicate` callbacks fire-and-forget without error handling

**File:** `src/components/SessionSwitcherModal.tsx:116-121`
**Issue:** Both `onRename` and `onDuplicate` in `SessionSwitcherModal` use `void` fire-and-forget:
```typescript
onRename={(name) => { void renameSession(session.id, name); }}
onDuplicate={() => { void duplicateSession(session.id); }}
```
If either `renameSession` or `duplicateSession` throws (e.g., storage adapter write failure), the rejection is silently discarded. For `onRename`, the session name in the `SessionRow` UI will revert to the old value on next render (since the manifest update failed), but no error is surfaced to the user — the rename input disappears and the old name reappears, which appears as a silent no-op. For `onDuplicate`, the new session is never created but the UI shows no indication.

This was present in the original code and was not addressed by the WR-03 fix (which only covered `onSwitch`). It is escalated to WARNING because the same fix pattern was applied selectively, making the inconsistency more visible.

**Fix:**
```typescript
onRename={(name) => {
  renameSession(session.id, name).catch((err) => {
    console.error('[SessionSwitcherModal] renameSession failed:', err);
  });
}}
onDuplicate={() => {
  duplicateSession(session.id).catch((err) => {
    console.error('[SessionSwitcherModal] duplicateSession failed:', err);
  });
}}
```

---

## Info

### IN-01: Identical focus-trap implementation copy-pasted across two components (unchanged)

**File:** `src/components/SessionSwitcherModal.tsx:31-45`
**File:** `src/components/DeleteSessionConfirmDialog.tsx:21-35`

**Issue:** The Tab/Shift-Tab focus-trap `handleKeyDown` function is byte-for-byte identical in both files. The comment in `DeleteSessionConfirmDialog.tsx` explicitly says "verbatim from ResetConfirmDialog.tsx". This was not addressed by the current round of fixes. Any future change to the focus-trap logic must be applied manually to all copies.

**Fix:** Extract a `useDialogFocusTrap(dialogRef, returnFocusId)` custom hook used by all dialog components.

---

### IN-02: `renameSession` does not persist manifest to storage

**File:** `src/store/app.ts:379-389`
**Issue:** `renameSession` updates `state.manifest` in the Zustand store via `set(...)`. The module-level subscribe callback (app.ts:520) will pick up the change and write the manifest to storage. This is the correct path. However, `renameSession` does not call `storageAdapter.flushPending()` before or after the rename. This means if the page is closed within 300ms of a rename (before the debounce fires), the manifest change is lost and the old name is restored on next load. The same issue applies to `duplicateSession`. This is a pre-existing quality issue (not introduced by the fixes) but worth noting given the rename-race could produce user-visible data loss on close.

**Fix:** Add `storageAdapter.flushPending()` at the end of `renameSession` and `duplicateSession`, or document that these operations are best-effort within the debounce window.

---

## Verification Matrix

| Finding | Status |
|---------|--------|
| CR-01: Raw `chrome.storage.local.remove` bypasses adapter | **NOT FIXED** — see CR-01 above |
| CR-02: Leaked undo timer | FIXED (module-level `undoTimer` with cancel) |
| CR-03: Escape-then-blur double-trigger | FIXED (`cancelledRef` pattern) |
| CR-04: Missing optional-chain on `manifest?.activeSessionId` | FIXED |
| WR-01: `onDeleted()` never called on `deleteSession` throw | FIXED (try/finally) |
| WR-02: Focus-trap crash on empty focusable list | FIXED (length guard) |
| WR-03: `switchSession` fire-and-forget, closes before load | FIXED (await + try/catch) |
| WR-04: Focus restore targets wrong element | FIXED (`focusRestoreId` prop) |
| WR-05: Undo timer handle not stored | FIXED (module-level `undoTimer`) |
| IN-01: Focus-trap code duplication | Not addressed |
| IN-02: Unused `V2Manifest` import / missing null guard | FIXED (import removed, optional-chain added) |
| IN-03: No test coverage for undo timer auto-clear | Not verified in this pass (test files not in scope) |

---

_Reviewed: 2026-06-17T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
