---
phase: 06-multiple-named-sessions-switcher
fixed_at: 2026-06-17T16:03:00Z
review_path: .planning/phases/06-multiple-named-sessions-switcher/06-REVIEW.md
iteration: 2
findings_in_scope: 4
fixed: 3
skipped: 1
status: partial
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-06-17T16:03:00Z
**Source review:** .planning/phases/06-multiple-named-sessions-switcher/06-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 4 (CR-01, CR-05, WR-06, WR-07)
- Fixed: 3 (CR-01, CR-05, WR-07)
- Skipped: 1 (WR-06)

## Fixed Issues

### CR-01: Raw `chrome.storage.local.remove` still present; `flushPending()` race not eliminated

**Files modified:** `src/storage/adapter.ts`, `src/store/app.ts`, `src/store/app.test.ts`
**Commits:** `cb27704`, `b07ecdd`
**Applied fix:**
1. Added `async remove(keys: string | string[]): Promise<void>` method to `StorageAdapter` in `src/storage/adapter.ts`. The method checks if `#dirty && #pendingData !== null`, cancels the debounce timer, then awaits `this.#flush()` before calling `chrome.storage.local.remove(keys)`. This ensures the pending set() and remove() never execute concurrently — the previous fire-and-forget `flushPending()` left both in flight simultaneously, allowing the set() to win the race and silently re-write the deleted key.
2. Updated `deleteSession` in `src/store/app.ts` to replace the two-line `storageAdapter.flushPending(); await chrome.storage.local.remove(...)` sequence with a single `await storageAdapter.remove(`session:${sessionId}`)` call, restoring the abstraction boundary.
3. Updated `src/store/app.test.ts` to add `remove: vi.fn().mockResolvedValue(undefined)` to the `storageAdapter` mock, reset it in `beforeEach`, and update the ordering test to track `storageAdapter.remove` calls instead of `chrome.storage.local.remove`.

---

### CR-05: `handleNewSession` swallows `createSession` rejection silently

**Files modified:** `src/components/SessionSwitcherModal.tsx`
**Commit:** `6c5618c`
**Applied fix:** Changed `handleNewSession` from `function handleNewSession() { void createSession().then(...) }` to `async function handleNewSession()` with `try { await createSession(); dialogRef.current?.close(); } catch (err) { console.error('[SessionSwitcherModal] createSession failed:', err); }`. Rejected promise was silently discarded by `void expr.then()`, leaving the dialog open and unresponsive with no user feedback on failure. Pattern is consistent with WR-03 fix already applied to `onSwitch`.

---

### WR-07: `onRename` and `onDuplicate` callbacks fire-and-forget without error handling

**Files modified:** `src/components/SessionSwitcherModal.tsx`
**Commit:** `05cfc17`
**Applied fix:** Replaced `void renameSession(session.id, name)` and `void duplicateSession(session.id)` with `.catch((err) => { console.error(...) })` chains on each callback. Storage failures in `renameSession` and `duplicateSession` now surface in the console rather than being silently discarded. Pattern is consistent with WR-03 fix already applied to `onSwitch`.

---

## Skipped Issues

### WR-06: `handleDelete` close triggers `handleClose` focus restore before `onDeleted` closes parent modal

**File:** `src/components/DeleteSessionConfirmDialog.tsx:59`, `src/components/SessionSwitcherModal.tsx:148`
**Reason:** Skipped per scope instructions — the fix requires either removing a `close` event listener inside `handleDelete` before calling `dialogRef.current?.close()` (changing lifecycle semantics) or introducing a `skipFocusRestore` ref. The intermediate focus step is a marginal screen-reader quality issue (brief focus flash to a node that is about to be hidden), not a correctness bug. The final focus destination (`open-session-switcher`) is correct. Acceptable to leave for a future accessibility pass.
**Original issue:** When a session is deleted, `DeleteSessionConfirmDialog.close()` fires the dialog's own `close` event, causing `handleClose` to focus `delete-session-${pendingDelete.id}` (inside the about-to-close parent modal). Moments later, `onDeleted()` closes the parent modal, which correctly restores focus to `open-session-switcher`. The intermediate focus step targets a DOM element inside a closing dialog, which can produce a brief spurious screen-reader announcement.

---

_Fixed: 2026-06-17T16:03:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
