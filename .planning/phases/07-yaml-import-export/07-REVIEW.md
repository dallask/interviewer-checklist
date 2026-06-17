---
phase: 07-yaml-import-export
reviewed: 2026-06-17T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/utils/yamlExport.ts
  - src/utils/yamlExport.test.ts
  - src/utils/yamlImport.ts
  - src/utils/yamlImport.test.ts
  - src/components/ImportPreviewModal.tsx
  - src/components/ImportPreviewModal.test.tsx
  - src/store/app.ts
  - src/store/app.test.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 07: Code Review Report (Re-review)

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This is a re-review after the iteration-2 fix pass (07-REVIEW-FIX.md). All six prior
findings (CR-01, CR-02, WR-01 through WR-04) were addressed in code. Five of the six
fixes are correct and effective. However, CR-01 was only partially fixed: the applied
fix added a `flushPending()` call before `snapshot()`, but `flushPending()` is a
`void` / fire-and-forget function — it starts an async chain but returns immediately
without waiting for `chrome.storage.local.set()` to complete. `snapshot()` therefore
still races with the in-flight flush and may capture stale storage state. This constitutes
a new critical finding because the fix claimed to resolve data loss but left the race
intact.

Four new warnings are also raised that were not present in the prior review: the Cancel
button is not guarded against clicks during an in-flight confirm; the Confirm button is
not disabled when `preview` is `null`; `modifiedCount` in `parseStructural` understates
the import scope when custom questions carry scores; and `downloadYaml` creates a
detached anchor that fails silently in Firefox.

Both previously-reported Info items (IN-01, IN-02) remain unaddressed in the current
codebase.

---

## Critical Issues

### CR-01: `flushPending()` is fire-and-forget — snapshot still races with in-flight flush

**File:** `src/store/app.ts:536-539`

**Issue:** The iteration-2 fix added `storageAdapter.flushPending()` before
`storageAdapter.snapshot()`, matching the fix suggested in the prior review. However,
`flushPending()` is declared `void` and its implementation (adapter.ts:49-56) calls
`void this.#flush()` — meaning the async chain is started but not awaited. Specifically:

1. `flushPending()` synchronously nulls `#pendingData` and `#dirty`, then calls
   `void this.#flush()` which runs until its first `await` (`this.#checkQuota()`)
   and suspends.
2. Control returns to `importSession`, which immediately calls
   `await storageAdapter.snapshot(activeSessionId)`.
3. `snapshot()` calls `this.read([key])` which queues
   `chrome.storage.local.get(keys)` into the chrome storage task queue.
4. Meanwhile, `#flush()` is still suspended inside `#checkQuota` (awaiting
   `chrome.storage.local.getBytesInUse`). When that resolves, `#flush()` queues
   `chrome.storage.local.set(data)`.

The chrome storage task queue therefore receives these operations in order:
`getBytesInUse` → `get(key)` → `set(data)`. The `get` used by `snapshot()` executes
**before** the `set` from the pending flush, so the snapshot captures stale data.

The three tests that assert "snapshot before write" in `app.test.ts` (lines 904-973)
track mock-function call order (`callOrder.push('snapshot')` / `callOrder.push('write')`).
The `'write'` events they track are calls to the `storageAdapter.write()` method from
the subscribe callback — not from `#flush()`. The tests do not expose whether the
`chrome.storage.local.set` from the pending flush precedes the `chrome.storage.local.get`
inside `snapshot()`. The race is invisible to the test suite.

Compare with `storageAdapter.remove()` (adapter.ts:107-120), which correctly `await`s
`this.#flush()` before proceeding, guaranteeing ordering. The same pattern must be
applied here.

**Fix:** Add an `async flushPendingAsync()` method to `StorageAdapter` that awaits the
internal flush, then use it in `importSession`:

```typescript
// In adapter.ts — add alongside flushPending():
async flushPendingAsync(): Promise<void> {
  if (!this.#dirty || this.#pendingData === null) return;
  if (this.#debounceTimer !== null) {
    clearTimeout(this.#debounceTimer);
    this.#debounceTimer = null;
  }
  await this.#flush();
}
```

```typescript
// In app.ts importSession — replace the fire-and-forget call:
await storageAdapter.flushPendingAsync();     // guaranteed complete before read
await storageAdapter.snapshot(activeSessionId); // now sees current storage state
```

Update the mock in `app.test.ts` to add `flushPendingAsync: vi.fn().mockResolvedValue(undefined)`
and update the call-order tests to track `'flushPendingAsync'` instead of `'flushPending'`.

---

## Warnings

### WR-01: `modifiedCount` underreports when custom questions carry scores

**File:** `src/utils/yamlImport.ts:462-464`

**Issue:** In `parseStructural`, `modifiedCount` is incremented only when a
standard-question score is written (line 408). When a custom question has a score
(lines 462-464), the score is written to `result.scores[newId]` but `modifiedCount` is
not incremented. The import preview modal shows "Will modify N questions" using
`preview.modifiedCount`. If an imported YAML contains 3 scored standard questions and
2 scored custom questions, the modal reports "Will modify 3 questions" — omitting the
2 custom-question scores that will also overwrite storage. The user sees an inaccurate
scope summary before confirming.

**Fix:** Increment `modifiedCount` when a custom question score is written:

```typescript
if (typeof cq.score === 'number') {
  result.scores[newId] = cq.score;
  modifiedCount++; // add this line
}
```

### WR-02: Cancel button not disabled while confirm is in flight — orphan session risk

**File:** `src/components/ImportPreviewModal.tsx:154-160`

**Issue:** The Cancel button calls `dialogRef.current?.close()` unconditionally without
checking `isPending`. In the `overwriteActive=false` path, `handleConfirm` calls
`createSession()` (which adds a new `SessionMeta` to the manifest and writes blank
session data to storage) before calling `set()` to apply the imported data. If the user
clicks Cancel between these two steps:

1. The dialog closes and focus returns to `#open-import-yaml`.
2. `onConfirm` continues running in the background.
3. `createSession()` may already have committed a new blank session to the manifest.
4. The subsequent `set()` still applies to that new session.

The user is left with an extra session in their session list — either blank or
partially-populated — with no feedback. The `isPending` state added by the prior fix
guards double-submission on Confirm but does not guard Cancel.

**Fix:** Disable the Cancel button while `isPending`:

```tsx
<button
  type="button"
  disabled={isPending}
  onClick={handleCancel}
  className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
>
  Cancel
</button>
```

### WR-03: Confirm button enabled when `preview` is `null` — unguarded `onConfirm` call

**File:** `src/components/ImportPreviewModal.tsx:161-170`

**Issue:** The Confirm button's `disabled` attribute is bound only to `isPending`
(line 163). When `preview` is `null` (the prop's initial value, or any state where no
parsed YAML is available), the button is clickable and fires `onConfirm(overwriteActive)`
with no import data available to the caller. The component's design contract documents
"purely prop-driven — caller owns store interaction" but provides no guard to prevent
the caller from receiving a spurious confirmation event with a null context.

**Fix:** Disable Confirm when `preview` is null:

```tsx
<button
  type="button"
  disabled={isPending || preview === null}
  onClick={() => { void handleConfirm(); }}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isPending ? 'Importing…' : 'Confirm'}
</button>
```

### WR-04: `downloadYaml` anchor not appended to DOM — silent failure in Firefox

**File:** `src/utils/yamlExport.ts:91-99`

**Issue:** `downloadYaml` creates an `<a>` element, sets `href` and `download`, calls
`a.click()`, then revokes the object URL. The anchor is never appended to the document
body. Chromium processes programmatic `.click()` on detached Blob-URL anchors, but
Firefox requires the element to be present in the DOM for the click to trigger a
file-save dialog. If this extension is used in a Firefox-based browser, downloads fail
silently — no file is saved and no error is surfaced.

**Fix:** Briefly append the anchor to the document body before clicking:

```typescript
export function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## Info

### IN-01: Redundant double-null ternary in `parseStructural` for override and score

**File:** `src/utils/yamlImport.ts:352-357` and `397-401`

**Issue:** Both the `override` and `score` parsing blocks use a three-branch ternary
where the second branch and the final else both return `null`, making the second branch
dead code:

```typescript
// override (lines 352-357):
result.overrides[topicId] =
  typeof topic.override === 'number'
    ? topic.override
    : topic.override === null
      ? null   // dead — identical to else branch
      : null;

// score (lines 397-401): same pattern
const score =
  typeof q.score === 'number'
    ? q.score
    : q.score === null
      ? null   // dead — identical to else branch
      : null;
```

**Fix:** Collapse each to a single ternary:

```typescript
result.overrides[topicId] =
  typeof topic.override === 'number' ? topic.override : null;

const score = typeof q.score === 'number' ? q.score : null;
```

### IN-02: Round-trip test calls `js-yaml load()` directly instead of `parseYaml()`

**File:** `src/utils/yamlImport.test.ts:1` and `143`

**Issue:** The round-trip test (`parseStructural round-trip`) imports `load` from
`js-yaml` directly (line 1) and calls `load(yamlString)` at line 143 rather than using
the application's `parseYaml` wrapper. If `parseYaml`'s schema options or error
handling are changed, the round-trip test continues to pass against the raw `load()`
call, missing the regression.

**Fix:**

```typescript
// Replace:
const parsed = load(yamlString);
const preview = parseStructural(parsed, DEFAULT_SECTIONS);

// With:
const parseResult = parseYaml(yamlString);
expect(parseResult.ok).toBe(true);
if (!parseResult.ok) return;
const preview = parseStructural(parseResult.value, DEFAULT_SECTIONS);
```

Remove the `import { load } from 'js-yaml'` import at line 1 if no longer needed
elsewhere in the test file.

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
