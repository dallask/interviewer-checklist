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
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase implements YAML export and import for interview sessions, including a pure-function export utility, a parser that handles both structural and legacy formats, an `ImportPreviewModal` React component, and a new `importSession` action wired into the Zustand store.

The export path is clean. The import path has two blockers: imported scores and overrides bypass the `[0, 10]` clamping that `setScore`/`setOverride` enforce, allowing out-of-range values to be persisted directly; and `parseStructural` accepts arbitrary floating-point or negative values for `q.index`, constructing synthetic keys like `twig-1.5` or `twig--1` that pollute the scores map permanently. Four warnings follow, the most impactful being the `onConfirm` rejection silently swallowed in the modal and `MAX_YAML_BYTES` exported but never enforced at the only call site in this phase.

---

## Critical Issues

### CR-01: `importSession` bypasses score clamping — out-of-range values persist to storage

**File:** `src/store/app.ts:534-560`

**Issue:** `setScore` and `setOverride` both enforce `Math.min(10, Math.max(0, …))` (lines 272, 282). `importSession` does not call these actions; it calls `set({scores: data.scores, overrides: data.overrides, …})` directly. A YAML file with `score: 999` or `score: -5` (or `override: 50`) therefore writes unclamped values straight to the Zustand state and to `chrome.storage.local` via the subscribe callback. The subscriber at line 591 fires immediately after `set()` and persists whatever is in `state.scores` — no second chance to clamp.

`parseStructural` and `parseLegacy` perform no bounds check on score values either; they only check `typeof value === 'number'` (yamlImport.ts lines 163-164, 368-372).

**Fix:** Either run imported scores through the clamping helper before storing, or call `setScore`/`setOverride` in a loop instead of calling `set()` directly. The simplest targeted fix:

```ts
// src/store/app.ts — inside importSession, before each set() call
function clampScore(v: number | null): number | null {
  return v !== null ? Math.min(10, Math.max(0, v)) : null;
}

const clampedScores = Object.fromEntries(
  Object.entries(data.scores).map(([k, v]) => [k, clampScore(v)]),
);
const clampedOverrides = Object.fromEntries(
  Object.entries(data.overrides).map(([k, v]) => [k, clampScore(v)]),
);

set({
  scores: clampedScores,
  overrides: clampedOverrides,
  notes: data.notes,
  topicNotes: data.topicNotes,
  customQuestions: data.customQuestions,
  candidate: data.candidate,
});
```

---

### CR-02: `parseStructural` accepts non-integer and negative `q.index` values, polluting the scores map with synthetic orphan keys

**File:** `src/utils/yamlImport.ts:362-366`

**Issue:** The index guard is only `typeof q.index === 'number'`. A YAML file with `index: 1.5` or `index: -3` satisfies this check, and `questionKey` becomes `twig-1.5` or `twig--3`. These keys:

1. Are written unconditionally into `result.scores[questionKey] = score` (line 374).
2. Never match any canonical question ID (which are always non-negative integers), so they persist in the store and in `chrome.storage.local` as orphan keys.
3. Are not counted in `unmatchedCount` — they are invisible to the user preview.

Because the subscribe callback writes the full `state.scores` object on every mutation, these orphan keys survive indefinitely across sessions.

**Fix:** Add an integer and non-negative check before using the index:

```ts
const index = typeof q.index === 'number' &&
  Number.isInteger(q.index) &&
  q.index >= 0
    ? q.index
    : null;
if (index === null) continue;
```

---

## Warnings

### WR-01: `handleConfirm` rejection silently swallowed — errors from `onConfirm` are lost

**File:** `src/components/ImportPreviewModal.tsx:59-62`

**Issue:** `handleConfirm` is `async` and `await`s `onConfirm(overwriteActive)`. The button's `onClick` uses `void handleConfirm()` (line 140) which explicitly discards the returned promise. If `onConfirm` rejects (e.g., `importSession` throws, or `storageAdapter.snapshot` rejects), the rejection is silently dropped — no error state, no UI feedback, the dialog still closes normally via `dialogRef.current?.close()` on line 61 only if `onConfirm` resolves. But if it throws before `close()`, the dialog stays open with no feedback.

```ts
const handleConfirm = async () => {
  await onConfirm(overwriteActive);  // if this rejects, close() never fires
  dialogRef.current?.close();        // never reached on rejection
};
```

**Fix:** Wrap in try/catch and either surface an error state or at minimum ensure the dialog can be dismissed:

```ts
const [error, setError] = useState<string | null>(null);

const handleConfirm = async () => {
  try {
    await onConfirm(overwriteActive);
    dialogRef.current?.close();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Import failed');
  }
};
```

---

### WR-02: `MAX_YAML_BYTES` size guard is exported but never enforced — DoS protection is documentation-only

**File:** `src/utils/yamlImport.ts:7-10`

**Issue:** The comment at line 7 says "Exported so the file-picker caller can check file.size before readAsText()." However, `ActionsGroup.tsx` (the only caller wired in this phase) does not import `MAX_YAML_BYTES` and contains no `<input type="file">` element, no `FileReader`, and no file size check. The `open-import-yaml` button ID referenced in `ImportPreviewModal.tsx` line 48 does not exist anywhere in `ActionsGroup.tsx`.

This means: (a) the DoS mitigation noted in the plan as "T-07-02 mitigation" is unimplemented, and (b) the focus-restore target `open-import-yaml` will silently fail (`getElementById` returns `null`) on every dialog close, breaking keyboard accessibility.

**Fix:** Implement the file picker in `ActionsGroup.tsx` with the guard enforced:

```tsx
import { MAX_YAML_BYTES } from '../utils/yamlImport.js';

// In JSX:
<input
  type="file"
  id="open-import-yaml"
  accept=".yaml,.yml"
  style={{ display: 'none' }}
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_YAML_BYTES) {
      // surface error to user
      return;
    }
    // read and parse
  }}
/>
<button
  type="button"
  id="open-import-yaml-btn"
  onClick={() => document.getElementById('open-import-yaml')?.click()}
>
  Import YAML
</button>
```

Until the file picker is wired, the `MAX_YAML_BYTES` constant provides no protection and the focus restore on dialog close is a silent no-op.

---

### WR-03: `modifiedCount` inflated by non-numeric score values in both `parseLegacy` and `parseStructural`

**File:** `src/utils/yamlImport.ts:149-168` (parseLegacy), `src/utils/yamlImport.ts:379-382` (parseStructural)

**Issue:** In `parseLegacy`, `modifiedCount` is incremented for every key that exists in `idSet`, regardless of whether the value is actually a valid number. A YAML with `twig-0: true` or `twig-1: "high"` will store `null` into `result.scores` but still count towards `modifiedCount`. The user sees "Will modify N questions" where N includes invalid entries that have been silently nulled — a misleading preview count.

In `parseStructural`, the mirror issue exists: `modifiedCount` only increments when `score !== null` (line 380), but this means a score value of `false` or `"high"` is normalized to `null` (lines 368-372), not counted, yet the score key IS still written to `result.scores[questionKey]` as `null` (line 374). So the stored data diverges from what modifiedCount reflects in a different way — the key exists but the count does not reflect it.

**Fix:** In `parseLegacy`, gate the `modifiedCount` increment:

```ts
const numericValue = typeof value === 'number' ? value : null;
result.scores[key] = numericValue;
if (numericValue !== null) {
  modifiedCount++;
}
```

---

### WR-04: `parseStructural` writes `null`-score entries for every question in the YAML unconditionally, even unscored ones

**File:** `src/utils/yamlImport.ts:374`

**Issue:** `result.scores[questionKey] = score` (line 374) is executed for every question entry regardless of whether `score` is `null`. This means importing a structural YAML with 200 questions all unscored will write 200 `null` entries into `result.scores`. When `importSession` applies this via `set({scores: data.scores})`, the subscriber writes this inflated object to `chrome.storage.local`. The original un-imported session would have `scores: {}`. Post-import it has `scores: { 'twig-0': null, 'twig-1': null, … }` for every question across all topics.

This diverges from the behavior of `resetAll()` (which sets `scores: {}`) and could inflate storage consumption for large banks. It also means the round-trip is not identity-preserving for the `scores` map shape.

**Fix:** Only write the score entry when it is non-null:

```ts
if (score !== null) {
  result.scores[questionKey] = score;
  modifiedCount++;
}
if (typeof q.note === 'string' && q.note !== '') {
  result.notes[questionKey] = q.note;
}
```

---

## Info

### IN-01: Redundant third arm in score ternary chain is dead code

**File:** `src/utils/yamlImport.ts:163-164` (also `339-344`, `368-372`)

**Issue:** The pattern `typeof v === 'number' ? v : v === null ? null : null` appears three times. The third `null` arm (`else null`) is identical to the second (`=== null ? null`) — both return `null`. The distinction exists to handle the case where value is a non-null, non-number type (string, boolean, array), but both the null-check arm and the catch-all arm return the same value, making the null-check redundant. This is confusing and looks like a copy-paste error where the intent may have been to count or log the invalid-type case differently.

**Fix:** Simplify to:

```ts
typeof value === 'number' ? value : null
```

---

### IN-02: `buildFilename` produces a double-dash filename for empty or whitespace-only session names

**File:** `src/utils/yamlExport.ts:69-75`

**Issue:** `buildFilename('')` returns `"interview--2026-06-17.yaml"` (double dash before date). `buildFilename('   ')` returns `"interview---2026-06-17.yaml"` (three dashes — the whitespace collapses to one dash, sandwiched between the prefix dash and the date dash). These are valid filenames on most filesystems but are visually odd and untested.

**Fix:** Trim leading/trailing dashes from `safe` before interpolation:

```ts
const safe = sessionName
  .replace(/[^a-zA-Z0-9\-_. ]/g, '')
  .replace(/\s+/g, '-')
  .replace(/^-+|-+$/g, '');  // strip leading/trailing dashes
const name = safe || 'session';  // fallback for empty result
return `interview-${name}-${date}.yaml`;
```

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
