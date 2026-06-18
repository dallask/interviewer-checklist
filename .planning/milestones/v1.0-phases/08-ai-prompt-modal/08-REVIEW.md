---
phase: 08-ai-prompt-modal
reviewed: 2026-06-17T20:15:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/utils/buildAiPrompt.ts
  - src/utils/buildAiPrompt.test.ts
  - src/components/AiPromptModal.tsx
  - src/components/AiPromptModal.test.tsx
  - src/components/ActionsGroup.tsx
  - src/components/ActionsGroup.test.tsx
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-06-17T20:15:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Re-review after the iteration-1 fix pass. Three of the four prior findings are confirmed resolved:

- **WR-01 (prior)** — Close button disabled during never-settling clipboard write: **FIXED**. `disabled={isPending}` was removed from the Close button; only the Copy button retains the guard. The companion test `isPending disables copy button but NOT close button` now correctly asserts the Close button remains enabled during an in-flight write.
- **WR-02 (prior)** — Partial store mocks in dark-mode tests: **FIXED**. Both dark-mode `mockImplementation` blocks now include `resetAll`, `setCandidate`, `manifest`, `activeSessionId`, and `candidate`.
- **WR-03 (prior)** — `getAllByRole('button')` over unmocked child buttons: **FIXED**. The focus-visible test now enumerates buttons by name using `ownButtonNames` and `getByRole`.

One prior finding persists (IN-01), promoted to **WARNING** because the affected guard is a single-character conditional that is vulnerable to silent regression, and no test covers the absence of the `Notes:` line.

One new WARNING is raised: the default `beforeEach` mock in `ActionsGroup.test.tsx` still omits `resetAll` and `setCandidate` from its store state, leaving the majority of tests in the suite exposed to `undefined` values for those selectors in unmocked child components.

---

## Warnings

### WR-01: Default `beforeEach` mock omits `resetAll` and `setCandidate` — all non-overriding tests inherit the gap

**File:** `src/components/ActionsGroup.test.tsx:33-52`

**Issue:** The `beforeEach` default mock state does not include `resetAll` or `setCandidate`. Every test that does not override the mock (roughly 12 of the 14 tests in the suite) renders `ActionsGroup` with these fields absent from the store.

`CandidateModal` calls `useAppStore((s) => s.setCandidate)` during render. `ResetConfirmDialog` calls `useAppStore((s) => s.resetAll)` during render. With the default mock, both selectors return `undefined`. The components store these as local variables but only invoke them on explicit user interaction (form submit, reset confirm), so no render-time crash occurs today.

The two dark-mode override tests (lines 85-108 and 118-141) were fixed in the prior pass to add `resetAll` and `setCandidate`, but the `beforeEach` block was not aligned. This creates a split where most tests are in a weaker state than the dark-mode tests.

**Fix:** Add `resetAll` and `setCandidate` to the `beforeEach` default mock:

```ts
beforeEach(() => {
  vi.clearAllMocks();
  mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      expandAll,
      collapseAll,
      hideMarked: false,
      setHideMarked,
      darkMode: false,
      setDarkMode,
      manifest: MANIFEST,
      activeSessionId: SESSION_ID,
      scores: {},
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
      resetAll: vi.fn(),       // add: consumed by ResetConfirmDialog
      setCandidate: vi.fn(),   // add: consumed by CandidateModal
    }),
  );
});
```

---

### WR-02: No negative assertion guards the `candidate.details` empty-string suppression in `buildAiPrompt`

**File:** `src/utils/buildAiPrompt.test.ts:109-113`

**Issue:** The test suite verifies that `Notes:` appears when `candidate.details` is non-empty, but no test asserts the line is absent when `details` is `''`. The guard in `buildAiPrompt.ts:42` is:

```ts
if (c?.details) lines.push(`Notes: ${c.details}`);
```

This is a truthiness check. A refactor changing it to `if (c?.details !== undefined)` or `if (c?.details != null)` would silently emit `Notes: ` (with an empty body) and no existing test would catch the regression. The `sessionWithCandidate` fixture already has `details: ''` and is used in another test (line 104), but that test only asserts the candidate name is present — not the absence of `Notes:`.

**Fix:** Add one negative assertion using the existing fixture:

```ts
it('does NOT emit "Notes:" line when candidate.details is empty string', () => {
  const result = buildAiPrompt(sessionWithCandidate, DEFAULT_SECTIONS);
  expect(result).not.toContain('Notes:');
});
```

---

## Info

### IN-01: `buildAiPrompt` excluded from coverage thresholds

**File:** `vitest.config.ts:22`

**Issue:** The coverage `include` list covers `src/scoring/**`, `src/storage/**`, `src/store/**`, and `src/utils/buildFlatRows.ts`. `src/utils/buildAiPrompt.ts` is not included, so its coverage is not enforced by the CI gate. The file currently has a thorough hand-written test suite, but future changes are not protected from regressions that reduce coverage.

**Fix:** Add `buildAiPrompt` to the coverage include list or expand the utils glob:

```ts
include: [
  'src/scoring/**',
  'src/storage/**',
  'src/store/**',
  'src/utils/buildFlatRows.ts',
  'src/utils/buildAiPrompt.ts',   // add
],
```

---

_Reviewed: 2026-06-17T20:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
