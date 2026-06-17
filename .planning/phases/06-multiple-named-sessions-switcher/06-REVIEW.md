---
phase: 06-multiple-named-sessions-switcher
reviewed: 2026-06-17T18:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/storage/adapter.ts
  - src/store/app.ts
  - src/components/SessionSwitcherModal.tsx
  - src/components/DeleteSessionConfirmDialog.tsx
  - src/components/SessionRow.tsx
  - src/app/main.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 06: Code Review Report (Final Re-review — Iteration 3)

**Reviewed:** 2026-06-17T18:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Final re-review after two fix iterations. All five previously-CRITICAL issues are now resolved: CR-01 (`StorageAdapter.remove()` method added, race eliminated), CR-02/WR-05 (module-level `undoTimer` with cancellation), CR-03 (`cancelledRef` in `SessionRow`), CR-04 (optional chaining on `manifest?.activeSessionId`), and CR-05 (`handleNewSession` is now `async` with `try/catch`). WR-01, WR-02, WR-03, WR-04, WR-05, and WR-07 are all resolved.

WR-06 (double focus restore sequence when delete is confirmed) was explicitly deferred in iteration 2 and remains open.

One new WARNING was introduced by the CR-01 fix: `StorageAdapter.remove()` proceeds to call `chrome.storage.local.remove()` even when the preceding `#flush()` failed, which can leave buffered session data that will be re-written by the next debounce cycle — partially undoing the delete on storage error. This is a latent correctness issue in the new `remove()` method.

IN-01 (focus-trap code duplication) remains unresolved.

---

## Warnings

### WR-01: `StorageAdapter.remove()` proceeds after flush failure — re-write risk on storage error

**File:** `src/storage/adapter.ts:106-114`
**Issue:** `remove()` calls `await this.#flush()` (line 112), then unconditionally calls `await chrome.storage.local.remove(keys)` (line 114). The `#flush()` method does not propagate errors: its internal `catch` block logs the error, restores `#dirty = true` and repopulates `#pendingData` (lines 73-76), and returns normally. So `await this.#flush()` always resolves — `remove()` has no mechanism to detect that the flush failed.

When the flush fails:
1. `#pendingData` is restored with `session:${sessionId}` (written by the Zustand subscribe callback before `remove()` was called).
2. `chrome.storage.local.remove(keys)` executes anyway and deletes the key from storage.
3. The debounce timer fires 300ms later (from any subsequent Zustand mutation), flushing the still-buffered `session:${sessionId}` back to storage — silently un-deleting the session.

Under the happy path (flush succeeds), the race is correctly eliminated. Under a storage error, the delete is completed but then reversed by the next flush.

**Fix:** After awaiting `#flush()`, check `#dirty` to detect a flush failure and bail out rather than proceeding with the remove:
```typescript
async remove(keys: string | string[]): Promise<void> {
  if (this.#dirty && this.#pendingData !== null) {
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    await this.#flush();
    // If flush failed, #dirty was restored. Do not remove — the key would be
    // re-written by the next debounce cycle, silently undoing the delete.
    if (this.#dirty) {
      throw new Error('[StorageAdapter] remove() aborted: flush failed before remove');
    }
  }
  await chrome.storage.local.remove(keys);
}
```
The thrown error propagates to `deleteSession` in `app.ts`, which currently has no `try/catch` around `await storageAdapter.remove(...)` — the rejection would surface to the caller (DeleteSessionConfirmDialog's `handleDelete`), which does have a `try/catch` that logs the error, so the failure path is already handled at the UI layer.

---

### WR-02: WR-06 (deferred): spurious intermediate focus after delete confirmation

**File:** `src/components/DeleteSessionConfirmDialog.tsx:59`, `src/components/SessionSwitcherModal.tsx:159`
**Issue:** This finding was flagged in the previous review iteration and explicitly deferred. It remains open. When a session is deleted via the confirm dialog:

1. `handleDelete` calls `dialogRef.current?.close()` (line 59), which fires the delete dialog's `close` event.
2. The `close` event listener (`handleClose`, lines 43-47) immediately focuses `document.getElementById(focusRestoreId)` — the `delete-session-${pendingDelete.id}` button inside the **still-open parent modal**.
3. Milliseconds later, `onDeleted()` in the `finally` block (line 68) calls the parent modal's `.close()`.
4. The parent modal's own `handleClose` (SessionSwitcherModal.tsx line 49-52) then focuses `open-session-switcher`.

Step 2 moves focus to a node inside a dialog that is in the process of closing. This can produce a brief spurious focus announcement to screen readers, since the element is about to become hidden. The final focus destination (step 4) is correct.

**Fix:** Introduce a `skipFocusRestore` ref that `handleDelete` sets to `true` before calling `.close()`, which `handleClose` checks before calling `.focus()`:
```typescript
// In DeleteSessionConfirmDialog, inside the useEffect:
const skipFocusRestore = { current: false }; // or useRef if extracted

function handleClose() {
  if (skipFocusRestore.current) {
    skipFocusRestore.current = false;
    return;
  }
  const restoreId = focusRestoreId ?? 'open-session-switcher';
  document.getElementById(restoreId)?.focus();
}

// In handleDelete:
const handleDelete = async () => {
  skipFocusRestore.current = true;
  dialogRef.current?.close();
  // ...
};
```
This prevents the intermediate focus step when the user confirms deletion (the parent modal's close will handle final focus restoration). Cancellation continues to restore focus normally.

---

## Info

### IN-01: Identical focus-trap implementation copy-pasted across two components (unchanged)

**File:** `src/components/SessionSwitcherModal.tsx:31-45`
**File:** `src/components/DeleteSessionConfirmDialog.tsx:25-41`

**Issue:** The Tab/Shift-Tab focus-trap `handleKeyDown` function is byte-for-byte identical in both files (and per comments, also in ResetConfirmDialog.tsx which is not in scope). Any change to the focus-trap logic must be applied manually to every copy. This was not addressed in either fix iteration.

**Fix:** Extract a `useDialogFocusTrap(dialogRef, returnFocusId)` custom hook used by all dialog components.

---

### IN-02: `renameSession` and `duplicateSession` do not call `flushPending()` — 300ms data-loss window (unchanged)

**File:** `src/store/app.ts:379-389`, `src/store/app.ts:391-423`
**Issue:** Both `renameSession` and `duplicateSession` update the Zustand store via `set(...)`, which triggers the subscribe callback, which calls `storageAdapter.write(...)` — a debounced write with a 300ms delay. If the page is closed within the debounce window after a rename or duplicate, the manifest change (updated name or new session entry) is lost and reverted on next load. `switchSession` calls `storageAdapter.flushPending()` before any mutations to protect cross-session writes, but no equivalent protection exists for rename/duplicate.

**Fix:** Call `storageAdapter.flushPending()` at the end of `renameSession` and `duplicateSession`, or add an explicit `storageAdapter.write({ manifest: updatedManifest })` call inside each action (bypassing the subscribe relay) so the write is at least enqueued before function return. Add a comment documenting the 300ms best-effort window if a full flush is not desired.

---

## Verification Matrix

| Finding | Status |
|---------|--------|
| CR-01: Raw `chrome.storage.local.remove` bypasses adapter; flush race | **FIXED** — `StorageAdapter.remove()` method added; awaits `#flush()` before `chrome.storage.local.remove()` |
| CR-02/WR-05: Leaked/unstored undo timer | **FIXED** — module-level `undoTimer` with cancel in both `deleteSession` and `undoDeleteSession` |
| CR-03: Escape-then-blur double-trigger in SessionRow | **FIXED** — `cancelledRef` pattern correctly implemented |
| CR-04: Missing optional-chain on `manifest?.activeSessionId` | **FIXED** — `initialState.manifest?.activeSessionId ?? ''` at main.tsx:29 |
| CR-05: `handleNewSession` swallows `createSession` rejection | **FIXED** — `async` with `try/catch` at SessionSwitcherModal.tsx:61-69 |
| WR-01: `onDeleted()` never called on `deleteSession` throw | **FIXED** — `try/finally` in `handleDelete` |
| WR-02: Focus-trap crash on empty focusable list | **FIXED** — length guard in both dialog components |
| WR-03: `switchSession` fire-and-forget, closes before load | **FIXED** — `await` + `try/catch` in `onSwitch` |
| WR-04: Focus restore targets wrong element | **FIXED** — `focusRestoreId` prop wired through; `handleClose` uses it |
| WR-05: Undo timer handle not stored | **FIXED** — combined with CR-02 |
| WR-06: Spurious intermediate focus after delete confirmation | **NOT FIXED** — deferred in iteration 2; remains open as WR-02 in this report |
| WR-07: `onRename` / `onDuplicate` fire-and-forget without error handling | **FIXED** — `.catch(console.error)` added for both |
| IN-01: Focus-trap code duplication across components | Not addressed |
| IN-02: `renameSession`/`duplicateSession` 300ms data-loss window | Not addressed |
| **NEW** WR-01 (this report): `remove()` proceeds after flush failure | New finding introduced by CR-01 fix |

---

_Reviewed: 2026-06-17T18:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
