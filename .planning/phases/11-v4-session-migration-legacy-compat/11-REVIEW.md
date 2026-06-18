---
phase: 11-v4-session-migration-legacy-compat
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/app/App.tsx
  - src/app/main.tsx
  - src/components/ActionsGroup.tsx
  - src/components/MigrationErrorBanner.tsx
  - src/storage/bootstrap.test.ts
  - src/storage/bootstrap.ts
  - src/storage/migrations/fixtures/v3-session-fixture.ts
  - src/storage/migrations/index.ts
  - src/storage/migrations/v1-to-v2.test.ts
  - src/storage/migrations/v3-to-v4.test.ts
  - src/storage/migrations/v3-to-v4.ts
  - src/storage/types.ts
  - src/store/app.test.ts
  - src/store/app.ts
  - src/utils/yamlImport.test.ts
  - src/utils/yamlImport.ts
findings:
  critical: 4
  warning: 4
  info: 3
  total: 11
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 11 introduces V3→V4 session migration (score key re-keying from `${topicId}-N` to `${topicId}-qN`), a pre-migration snapshot mechanism, skip-and-continue error handling, and a `MigrationErrorBanner`. The migration logic in `v3-to-v4.ts` and the `bootstrap.ts` orchestration are well-structured and individually correct.

However, the phase introduced a **critical key-format split**: `bootstrap.ts` migrates stored scores to V4 keys (`-qN`), but `QuestionCard.tsx` (not changed in this phase) continues to write scores using V3 keys (`-N`). This creates a persistent two-format coexistence in the store that breaks the `hideMarked` feature in `App.tsx` (which exclusively reads V4 keys) and causes `yamlExport` to silently discard all scores migrated from V3 storage.

A second critical issue is that the V1 migration path in `bootstrap.ts` returns a blank V4 session to the caller instead of the migrated data, causing all V1 user scores and notes to be silently discarded on first load after upgrade.

The `reKeyImportResultToV4` function in `yamlImport.ts` also incorrectly re-keys custom question score keys, orphaning them permanently (the re-keyed key is never read by any consumer).

---

## Critical Issues

### CR-01: V4 score keys not read by `QuestionCard` — `hideMarked` permanently broken for migrated sessions

**File:** `src/app/App.tsx:43`
**Issue:** Phase 11 changed `App.tsx` to read `markedTopicIds` using V4-format keys (`${topic.id}-q${i}`), but `QuestionCard.tsx` still writes scores using V3-format keys (`${row.topicId}-${row.index}` — plain integer suffix). The two formats never overlap in the store, so `scores["twig-q0"]` is always undefined for any score entered via the UI. The `hideMarked` toggle is permanently non-functional: no topic will ever be marked.

The same split affects `scoring.ts:52` (`${topic.id}-${i}`) and `buildAiPrompt.ts:87` (`${topic.id}-${index}`), which also use V3 keys and therefore miss all scores that were migrated from V3 storage (which are stored under V4 keys).

```typescript
// App.tsx line 43 — reads V4 key format:
const key = `${topic.id}-q${i}`;  // ← "twig-q0"

// QuestionCard.tsx line 33 — writes V3 key format:
const questionId = `${row.topicId}-${row.index}`;  // ← "twig-0"
```

**Fix:** Either update `QuestionCard.tsx` to emit V4 keys (`${row.topicId}-q${row.index}`), or revert `App.tsx` to use V3 keys. The canonical key format must be consistent across all producers and consumers. Given the migration intent, `QuestionCard.tsx` should be updated to use the V4 format, and `scoring.ts` and `buildAiPrompt.ts` must be updated to match.

---

### CR-02: V1 migration path silently discards all user scoring data

**File:** `src/storage/bootstrap.ts:88-100`
**Issue:** When a V1 blob is found, `bootstrap.ts` writes the migrated V2 session to storage at line 92, but then returns `createDefaultV4Session(migrated.session.id)` — a **completely blank** V4 session — in the `sessions` map at line 97. `main.tsx` hydrates the Zustand store from `initialState.sessions` (line 52-68), so the store is populated with an empty session. The `useAppStore.subscribe` callback then fires within 300 ms and overwrites `session:<id>` in storage with the blank state, destroying the V2 session that was written at line 92. Any V1 user upgrading loses all scores, notes, overrides, and candidate data.

```typescript
// bootstrap.ts lines 88-100 — V2 session written but blank V4 returned:
await chrome.storage.local.set({
  manifest: migrated.manifest,
  [`session:${migrated.session.id}`]: migrated.session,  // V2 written...
});
return {
  manifest: migrated.manifest,
  sessions: {
    [migrated.session.id]: createDefaultV4Session(migrated.session.id),  // ...but blank V4 returned
  },
  failedSessionIds: [],
};
```

**Fix:** After writing the V2 session to storage, run it through `migrateV2ToV3` → `migrateV3ToV4` and return the fully-migrated V4 session instead of `createDefaultV4Session`. Alternatively, if the intent is that V1 data should not be carried forward (intentional data reset), that must be explicitly documented and the V2 session write at line 92 should be removed to avoid storing data that is immediately discarded.

---

### CR-03: `reKeyImportResultToV4` corrupts custom question score keys, producing orphaned entries

**File:** `src/utils/yamlImport.ts:503-519`
**Issue:** `parseStructural` generates custom question IDs in the form `custom-${topicId}-${Date.now()}-${cqIndex}` (e.g. `custom-twig-1714000000000-0`) and stores the score at `scores["custom-twig-1714000000000-0"]`. When `reKeyImportResultToV4` runs the regex `/^(.+)-(\d+)$/` against this key, it matches the trailing `-0` and re-keys it to `custom-twig-1714000000000-q0`. The `customQuestion.id` field is never updated, so it remains `custom-twig-1714000000000-0`. No consumer ever reads `scores["custom-twig-1714000000000-q0"]`:

- `QuestionCard.tsx` looks up `scores["${topicId}-${numericIndex}"]` (e.g. `scores["twig-5"]`)
- `yamlExport.ts:50` looks up `scores[cq.id]` = `scores["custom-twig-1714000000000-0"]`
- `buildAiPrompt.ts:100` looks up `scores[cq.id]`

After import, all custom question scores are permanently invisible and are silently discarded on re-export.

The test at `yamlImport.test.ts:224-240` has an **incorrect comment** claiming the ID does not match the regex (it does match), and only asserts `toHaveLength(1)` without verifying the actual key name, so the bug passes silently.

**Fix:** The regex in `reKeyImportResultToV4` must exclude keys that start with `custom-`. One approach:

```typescript
function remap<T>(record: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    // Custom question keys (custom-*) must not be re-keyed
    const match = !key.startsWith('custom-') && /^(.+)-(\d+)$/.exec(key);
    out[match ? `${match[1]}-q${match[2]}` : key] = value;
  }
  return out;
}
```

Fix the test comment and add a test that asserts the exact key after re-keying for a custom question ID.

---

### CR-04: `MigrationErrorBanner` displays an incorrect backup key pattern — users cannot locate their snapshots

**File:** `src/components/MigrationErrorBanner.tsx:32`
**Issue:** The banner tells users their backup is stored at `snapshot:<id>:pre-v4`, but `bootstrap.ts:159` writes the key as `` `snapshot:${s.id}:pre-v4-${Date.now()}` `` (with a millisecond timestamp suffix). The key shown in the banner will never exist in `chrome.storage.local`. A user following the banner's instructions to recover data will look for the wrong key and conclude no backup was made.

```tsx
// MigrationErrorBanner.tsx line 32 — missing timestamp suffix:
<code>snapshot:&lt;id&gt;:pre-v4</code>

// bootstrap.ts line 159 — actual key written:
[`snapshot:${s.id}:pre-v4-${Date.now()}`]: rawSession,
```

**Fix:** Update the banner to show the actual pattern:

```tsx
<code>snapshot:&lt;id&gt;:pre-v4-&lt;timestamp&gt;</code>
```

---

## Warnings

### WR-01: YAML export silently produces null scores for any session migrated from V3 storage

**File:** `src/components/ActionsGroup.tsx:73-90` / `src/utils/yamlExport.ts:38-44`
**Issue:** `handleExportYaml` builds a `V3Session` object using the store's `scores` (which for migrated sessions contain V4 keys like `twig-q0`). `yamlExport.ts:39` looks up `session.scores["twig-0"]` (V3 key). The V4 keys never match, so every question score in a migrated session exports as `null`. The YAML file appears valid but contains no scoring data for the user's interview.

This is a direct consequence of CR-01, but the export failure is silent — no error is shown, and the downloaded YAML looks superficially complete.

**Fix:** Either update `yamlExport.ts` to use V4 keys (`${topic.id}-q${index}`), or translate the store's V4 scores back to V3 format before passing to `exportSession`. The cleanest fix is to update `yamlExport.ts` to use the V4 key format consistently.

---

### WR-02: `onDismiss` prop in `App.tsx` calls `useAppStore.setState` directly in JSX

**File:** `src/app/App.tsx:84`
**Issue:** The `onDismiss` callback is defined inline as `() => useAppStore.setState({ migrationFailedCount: 0, migrationFailedIds: [] })`. Calling `useAppStore.setState` directly in JSX bypasses the action layer (`AppActions`), making the state mutation invisible to the action interface and untestable without directly inspecting internal store state. It also triggers the subscribe callback with partial state that is missing the `session` write (because `activeSessionId` is already set), which is harmless here but fragile.

**Fix:** Add a `clearMigrationError` action to `AppActions` and call it from `onDismiss`:

```typescript
// In app.ts AppActions:
clearMigrationError: () => void;

// Implementation:
clearMigrationError: () => set({ migrationFailedCount: 0, migrationFailedIds: [] }),
```

---

### WR-03: `bootstrap.ts` V1 path writes a V2 session to storage that is immediately overwritten

**File:** `src/storage/bootstrap.ts:92`
**Issue:** The `chrome.storage.local.set` at line 92 writes the migrated V2 session to storage, but (per CR-02) the caller receives a blank V4 session. The subscribe callback in `app.ts` fires within 300 ms and overwrites `session:<id>` in storage with the blank V4 state. The V2 write at line 92 is therefore a no-op write that wastes a storage call and may confuse future debugging. If CR-02 is fixed by migrating through to V4, this write should be removed or replaced with the V4 write.

**Fix:** After resolving CR-02, remove or replace the V2 session write at line 92 so storage always holds V4 data and there is no window where a V2 blob sits in storage only to be overwritten.

---

### WR-04: Duplicate `describe('bootstrap() — Scenario E', ...)` blocks in test file create misleading test identifiers

**File:** `src/storage/bootstrap.test.ts:491` and `src/storage/bootstrap.test.ts:690`
**Issue:** There are two separate `describe` blocks both labelled `Scenario E`. Additionally there are two `Scenario B` blocks (lines 132 and 362). Test runners (Vitest, Jest) deduplicate describe names in output — if either block has a failing test, the output will not clearly identify which `Scenario E` failed. One of the `Scenario E` blocks (line 569) contains a test titled `'includes session in failedSessionIds when migration throws'` but its body tests a **success** path (two V3 sessions both migrate cleanly) and asserts `failedSessionIds === []`. The test description contradicts the assertions.

**Fix:** Rename the second `Scenario E` block to `Scenario E2` or a descriptive name. Rename the misleading test at line 569 to accurately reflect its purpose (e.g., `'two V3 sessions both migrate successfully → failedSessionIds is empty'`).

---

## Info

### IN-01: Unused import `createDefaultSession` in `bootstrap.test.ts`

**File:** `src/storage/bootstrap.test.ts:10`
**Issue:** `createDefaultSession` (V2 factory function) is imported from `'./types.js'` but never referenced in the test file. The only occurrence is the import line itself.

**Fix:** Remove the unused import:

```typescript
import {
  // createDefaultSession,  ← remove
  createDefaultV4Session,
  V2ManifestSchema,
  V2SessionSchema,
  V3SessionSchema,
  V4SessionSchema,
} from './types.js';
```

---

### IN-02: Stale JSDoc comment in `AppState.scores` describes V3 key format

**File:** `src/store/app.ts:69`
**Issue:** The JSDoc comment reads `key: "${topicId}-${questionIndex}"` (V3 format with plain integer suffix). After Phase 11, migrated sessions use V4 format `${topicId}-q${questionIndex}`, and `App.tsx` already documents this as `'${topicId}-q${idx}'`. The comment is now misleading to anyone reading the store type definition.

**Fix:**

```typescript
/** Per-question scores (questionId → score | null); key: "${topicId}-q${questionIndex}" (V4 format, D-04) */
scores: Record<string, number | null>;
```

---

### IN-03: `reKeyImportResultToV4` test comment is factually wrong

**File:** `src/utils/yamlImport.test.ts:235`
**Issue:** The comment states `// custom-twig-1714000000000-0 does NOT match /^(.+)-(\d+)$/ because it ends in '-0'`. This is incorrect — the key **does** match (the suffix `-0` is a digit run, so the regex captures `custom-twig-1714000000000` as group 1 and `0` as group 2). The test passes because it only asserts `toHaveLength(1)`, which is true regardless of whether the key was transformed. The comment gives the implementer false confidence that custom keys are safely passed through.

**Fix:** Correct the comment and add an assertion for the exact key after re-keying. Once CR-03 is fixed (custom keys excluded from remapping), add a regression test that asserts the key is unchanged:

```typescript
expect(Object.keys(rekeyed.scores)[0]).toBe('custom-twig-1714000000000-0');
```

---

_Reviewed: 2026-06-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
