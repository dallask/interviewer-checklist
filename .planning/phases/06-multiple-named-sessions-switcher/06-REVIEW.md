---
phase: 06-multiple-named-sessions-switcher
reviewed: 2026-06-17T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/app/App.tsx
  - src/app/main.tsx
  - src/app/styles.css
  - src/components/ActionsGroup.test.tsx
  - src/components/ActionsGroup.tsx
  - src/components/DeleteSessionConfirmDialog.test.tsx
  - src/components/DeleteSessionConfirmDialog.tsx
  - src/components/SessionRow.test.tsx
  - src/components/SessionRow.tsx
  - src/components/SessionSwitcherModal.test.tsx
  - src/components/SessionSwitcherModal.tsx
  - src/components/UndoToast.test.tsx
  - src/components/UndoToast.tsx
  - src/store/app.test.ts
  - src/store/app.ts
findings:
  critical: 4
  warning: 5
  info: 3
  total: 12
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase adds multiple named sessions with a switcher modal, undo-on-delete, inline rename, duplicate, and focus-management plumbing. The overall architecture is sound — the SESS-04 flush-before-switch invariant is correctly implemented, the single atomic `set()` guard in `switchSession` is in place, and the undo buffer is captured before deletion. However, four blocker-level defects were found: a raw `chrome.storage.local.remove` call that bypasses the storage abstraction layer, a leaked undo timer that fires after a second delete (creating an undo-race), an Escape-then-blur double-trigger that can corrupt the rename commit path, and an unused `V2Manifest` import in `main.tsx` that reveals a real missing manifest-null guard at bootstrap. Five additional warnings cover a missing `onDeleted` race after async deletion, a focus-trap crash on empty focusable collections, missing `await`/error handling on async fire-and-forget calls in `switchSession`, duplicate focus-restore wiring that targets the wrong element, and a `setTimeout`-return value that is never stored (preventing any potential future cancellation). Three informational items cover code duplication and an untested timer path.

---

## Critical Issues

### CR-01: Raw `chrome.storage.local.remove` in `deleteSession` bypasses storage abstraction

**File:** `src/store/app.ts:438`
**Issue:** `deleteSession` calls `chrome.storage.local.remove(`session:${sessionId}`)` directly, bypassing `storageAdapter`. Every other storage write/delete in the codebase goes through `storageAdapter.write()`/`storageAdapter.read()`. The raw call (a) does not route through the pending-write flush (so if the debounce timer fires simultaneously the deleted key could be re-written by the pending batch), (b) bypasses any future quota or error-handling logic in the adapter, and (c) makes the storage layer inconsistent: it is possible for `storageAdapter`'s pending buffer to contain a stale `session:<id>` entry that will be written back to storage after the remove completes, effectively un-deleting the session silently.

**Fix:** Replace the direct remove with a write of `null` through the adapter (which `chrome.storage.local.set` treats as a delete for extension storage) or add a `remove(keys)` method to `StorageAdapter` and call that. The safest option that works with the existing API:
```typescript
// Step 3: commit deletion to storage via the adapter (not raw chrome API)
// First flush pending to prevent stale re-write of the deleted session.
storageAdapter.flushPending();
await chrome.storage.local.remove(`session:${sessionId}`);
```
A fuller fix adds `remove` to the adapter so the abstraction boundary is never violated.

---

### CR-02: Leaked undo timer — rapid double-delete corrupts undo buffer

**File:** `src/store/app.ts:466-469`
**Issue:** `deleteSession` unconditionally calls `setTimeout(() => { set({ undoBuffer: null }); }, 10_000)` without storing or cancelling a previous timer. If the user deletes a second session within 10 seconds of the first:
1. Timer A fires and clears `undoBuffer` even though `undoBuffer` now belongs to the second delete.
2. The undo toast for the second delete disappears after only the remaining time from Timer A (at most a few seconds).
3. If the user immediately clicks "Undo" after Timer A fires, `undoBuffer` is already null and the undo is silently lost.

This is a correctness defect, not just a UX issue — data that the user intended to restore can never be recovered.

**Fix:** Store the timer handle in module-level state (or Zustand state) and cancel it on each new delete call:
```typescript
// In AppState:
_undoTimer: ReturnType<typeof setTimeout> | null;

// In deleteSession, before the new setTimeout:
const prevTimer = useAppStore.getState()._undoTimer;
if (prevTimer !== null) clearTimeout(prevTimer);
const timer = setTimeout(() => {
  set({ undoBuffer: null, _undoTimer: null });
}, 10_000);
set({ _undoTimer: timer });
```
Alternatively, set the timer handle in a module-level variable outside Zustand (avoids adding to persisted state):
```typescript
let undoTimer: ReturnType<typeof setTimeout> | null = null;
// In deleteSession:
if (undoTimer !== null) clearTimeout(undoTimer);
undoTimer = setTimeout(() => { set({ undoBuffer: null }); undoTimer = null; }, 10_000);
```

---

### CR-03: Escape key followed by blur fires `commitRename` after `cancelRename`

**File:** `src/components/SessionRow.tsx:44-50`
**Issue:** When the user presses Escape, `handleKeyDown` calls `cancelRename()` which sets `setEditing(false)`. However, the `onBlur` handler (`commitRename`) fires immediately after `handleKeyDown` (the browser dispatches blur when the input loses focus due to the component re-render). At that point `editing` is still `true` in the stale closure captured by `commitRename`, so:
1. `cancelRename` runs: `setEditing(false)`, `setDraft(session.name)` — correct.
2. `onBlur → commitRename` runs: `trimmed = draft.trim()` is the stale _draft_ value (the in-progress edit, NOT yet reset to `session.name` because React hasn't re-rendered yet), so `onRename(trimmed)` is called with the dirty/cancelled draft value.

The net effect: pressing Escape can still commit the rename with the partially edited draft text if the draft is non-empty. This is incorrect behavior — Escape must always cancel without saving.

**Fix:** Use a ref to track cancellation intent so `commitRename` can bail out when Escape was pressed:
```typescript
const cancelledRef = useRef(false);

function cancelRename() {
  cancelledRef.current = true;
  setDraft(session.name);
  setEditing(false);
}

function commitRename(e: React.FocusEvent<HTMLInputElement>) {
  if (cancelledRef.current) {
    cancelledRef.current = false;
    return;
  }
  const li = e.currentTarget.closest('li');
  if (li?.contains(e.relatedTarget as Node)) return;
  const trimmed = draft.trim();
  if (!trimmed) { cancelRename(); return; }
  onRename(trimmed);
  setEditing(false);
}
```

---

### CR-04: `V2Manifest` imported but not used in `main.tsx` — masks a missing bootstrap guard

**File:** `src/app/main.tsx:7`
**Issue:** `V2Manifest` is imported as a type on line 7 but is never referenced in the file body. This is not merely a lint warning: its presence reveals that the original code intended to type-assert `initialState.manifest` (the return value of `bootstrap()`), but that type annotation was removed. As a consequence, `initialState.manifest.activeSessionId` on line 28 is accessed without checking whether `initialState.manifest` is non-null. If `bootstrap()` returns a state where `manifest` is undefined (e.g., first-launch race or migration failure), the `?? ''` on line 28 safely handles the `undefined` case — but `initialState.manifest.activeSessionId` will throw a `TypeError: Cannot read properties of undefined` before that fallback is reached. The real guard needed is:

```typescript
const activeSessionId = initialState.manifest?.activeSessionId ?? '';
```

The unused import is the indicator that this was originally written more carefully and then accidentally broken.

**Fix:**
```typescript
// line 28 — use optional chaining
const activeSessionId = initialState.manifest?.activeSessionId ?? '';

// Remove unused import from line 7:
import type { V3Session } from '../storage/types.js';
```

---

## Warnings

### WR-01: `onDeleted()` called after async `deleteSession` — race with modal close

**File:** `src/components/DeleteSessionConfirmDialog.tsx:49-52`
**Issue:** `handleDelete` closes the dialog, awaits `deleteSession(sessionId)`, then calls `onDeleted()`. `onDeleted` closes the parent `SessionSwitcherModal` (`dialogRef.current?.close()`). If the `deleteSession` async path takes time (e.g., slow storage), the parent modal is still open while `deleteSession` executes. Additionally, if `deleteSession` throws an unhandled exception (e.g., storage failure), `onDeleted()` is never called and the parent modal stays open with stale state. The void-wrapped call site on line 84 (`void handleDelete()`) means rejection is silently swallowed.

**Fix:** Wrap with try/finally to ensure `onDeleted` always fires, and add error handling:
```typescript
const handleDelete = async () => {
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

---

### WR-02: Focus trap crashes on empty focusable list

**File:** `src/components/SessionSwitcherModal.tsx:36-44`
**File:** `src/components/DeleteSessionConfirmDialog.tsx:26-34`

**Issue:** Both focus-trap `handleKeyDown` implementations query `focusable` elements and then unconditionally access `focusable[0]` and `focusable[focusable.length - 1]`. If the dialog is rendered with no focusable elements (e.g., during an error state, or in a test environment that strips buttons), `first` and `last` are `undefined`, and calling `last.focus()` or `first.focus()` throws `TypeError: Cannot read properties of undefined (reading 'focus')`.

**Fix:** Guard against empty focusable lists:
```typescript
if (focusable.length === 0) return;
const first = focusable[0];
const last = focusable[focusable.length - 1];
```

---

### WR-03: `switchSession` — `void switchSession(session.id)` swallows async errors and closes dialog prematurely

**File:** `src/components/SessionSwitcherModal.tsx:103-106`
**Issue:** The `onSwitch` callback calls `void switchSession(session.id)` and then immediately calls `dialogRef.current?.close()` synchronously, before the switch completes. This means:
1. The dialog closes before the new session data is loaded, leaving the UI in a transitional state (old scores visible) while the switch is in progress.
2. If `switchSession` rejects (e.g., storage read failure), the error is silently discarded — the user sees no feedback and the session may not have switched.

**Fix:** Await the switch before closing, and handle errors:
```typescript
onSwitch={async () => {
  try {
    await switchSession(session.id);
    dialogRef.current?.close();
  } catch (err) {
    console.error('[SessionSwitcherModal] switchSession failed:', err);
  }
}}
```

---

### WR-04: `DeleteSessionConfirmDialog` focus restore targets `open-session-switcher` instead of its own trigger

**File:** `src/components/DeleteSessionConfirmDialog.tsx:37-39`
**Issue:** The `handleClose` focus-restore callback hardcodes `document.getElementById('open-session-switcher')` — the trigger for the _parent_ `SessionSwitcherModal`, not for the delete dialog itself. When the delete dialog is closed via "Keep session" (cancel), focus should return to the element that opened the delete dialog (the delete button within `SessionRow`), not to the session switcher trigger at the top of the sidebar. The current implementation is a copy-paste from `SessionSwitcherModal` that was not adapted. This violates WCAG 2.1 SC 3.2.2 (expected focus behavior).

**Fix:** Accept an `onClose` callback prop or a `triggerId` prop so the correct element can be focused, or pass a `triggerRef` from `SessionSwitcherModal` into `DeleteSessionConfirmDialog`.

---

### WR-05: Undo timer handle not stored — future cancellation impossible

**File:** `src/store/app.ts:467`
**Issue:** The return value of `setTimeout(...)` is discarded. This is the same timer referenced in CR-02 but evaluated independently: even if CR-02 is fixed by clearing the timer on a second delete, there is currently no stored handle to cancel the timer if the user manually dismisses the undo toast via the "×" button. The dismiss calls `setUndoBuffer(null)`, but the timer keeps running and will attempt `set({ undoBuffer: null })` again after 10 seconds — a harmless but wasteful no-op. If logic is ever added that reacts to `undoBuffer` becoming null (e.g., analytics, auto-save), the timer firing after user-dismiss could produce incorrect side effects.

**Fix:** Store and cancel the timer when the undo buffer is manually cleared (see CR-02 fix pattern).

---

## Info

### IN-01: Identical focus-trap implementation copy-pasted across two components

**File:** `src/components/SessionSwitcherModal.tsx:31-45`
**File:** `src/components/DeleteSessionConfirmDialog.tsx:21-35`

**Issue:** The Tab/Shift-Tab focus-trap `handleKeyDown` function is byte-for-byte identical in both files. The comment in `DeleteSessionConfirmDialog.tsx` explicitly says "verbatim from ResetConfirmDialog.tsx". This duplication will drift over time — any fix applied to one (e.g., the WR-02 empty-focusable guard) must be applied manually to all copies.

**Fix:** Extract a `useDialogFocusTrap(dialogRef, returnFocusId)` custom hook used by all three dialogs.

---

### IN-02: Unused `V2Manifest` import in `main.tsx`

**File:** `src/app/main.tsx:7`
**Issue:** `V2Manifest` is imported as a type but never referenced in the file. (This finding is related to CR-04 but noted separately as a standalone dead-code issue.)

**Fix:** Remove `V2Manifest` from the import line:
```typescript
import type { V3Session } from '../storage/types.js';
```

---

### IN-03: No test coverage for the undo-timer auto-clear path in `deleteSession`

**File:** `src/store/app.test.ts`
**Issue:** The `deleteSession` test suite covers buffer capture, manifest update, and auto-switch, but there is no test asserting that `undoBuffer` is cleared after 10 seconds (the `setTimeout` callback at `app.ts:467`). This is the path most likely to be broken by the CR-02 fix (adding timer tracking), and it is the path that exercises the store's auto-expiry contract.

**Fix:** Add a test using `vi.useFakeTimers()` to advance time by 10 seconds and verify `undoBuffer` becomes null:
```typescript
it('deleteSession clears undoBuffer after 10 seconds', async () => {
  vi.useFakeTimers();
  // ... setup delete ...
  await useAppStore.getState().deleteSession(SESSION_ID_1);
  expect(useAppStore.getState().undoBuffer).not.toBeNull();
  vi.advanceTimersByTime(10_000);
  expect(useAppStore.getState().undoBuffer).toBeNull();
  vi.useRealTimers();
});
```

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
