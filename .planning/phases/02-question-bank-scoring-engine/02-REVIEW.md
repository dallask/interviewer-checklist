---
phase: 02-question-bank-scoring-engine
reviewed: 2026-06-17T07:25:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/data/bank/types.ts
  - src/data/bank/index.ts
  - src/data/bank/bank.test.ts
  - src/data/bank/frontend.ts
  - src/data/bank/backend.ts
  - src/data/bank/ai.ts
  - src/scoring/scoring.ts
  - src/scoring/index.ts
  - src/scoring/scoring.test.ts
  - vitest.config.ts
findings:
  critical: 1
  warning: 6
  info: 2
  total: 9
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-17T07:25:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the question bank data layer (types, section files, index, bank tests) and the scoring engine
(scoring.ts, index.ts, scoring tests) together with the vitest configuration.

The scoring algorithm logic is sound for its stated purpose: difficulty-weighted average per topic,
arithmetic mean of non-null topic marks for section and overall, and a correctly implemented band
classifier with boundary tests. The TypeScript types are well-structured with `readonly` constraints
throughout, and the `override=0` edge case is handled correctly via `typeof` guard.

One blocker was found: `NaN` passes the `typeof score !== 'number'` guard and, once it enters the
weighted-sum computation, silently corrupts the final mark to `NaN`. `getMarkBand(NaN)` then
returns `'high'` instead of `'none'`, producing a nonsensical score with no error or indication of
the corruption. This affects any caller who stores a non-finite number in `ScoreMap`.

Six warnings were found, covering duplicate questions in the bank data, an unenforceable coverage
threshold, the fragility of a hardcoded test fixture, and missing tests for out-of-range inputs.

---

## Critical Issues

### CR-01: `NaN` score corrupts `computeTopicMark` — silently returns band `'high'`

**File:** `src/scoring/scoring.ts:65-72`

**Issue:** The score guard `if (typeof score !== 'number') return;` correctly filters out `null` and
`undefined`, but `typeof NaN === 'number'` is `true` in JavaScript. A `NaN` value stored in
`ScoreMap` (which is typed as `Record<string, number | null>`) will:

1. Pass the guard and increment `scoredCount` (inflated by 1).
2. Propagate into `weightedSum` as `NaN` (`coeff * NaN = NaN`).
3. Make every subsequent addition to `weightedSum` also `NaN`.
4. Produce `mark = NaN / coeffSum` — a `NaN` mark (not `null`).
5. Reach `getMarkBand(NaN)`: every comparison with `NaN` is `false`, so the function falls
   through all branches and returns `'high'` — the highest possible band.

The same corruption path exists for `Infinity` scores (e.g. from a division-by-zero upstream).

Concretely, a single `NaN` entry in the score map silently turns an incomplete or bad assessment
into `mark: NaN, band: 'high'` with no thrown error and no indication in the output.

**Reproduction:**
```ts
const result = computeTopicMark(TWIG_TOPIC, { 'twig-0': NaN });
// result.mark === NaN  (not null)
// result.band === 'high'   (wrong — should be 'none' or throw)
// result.scoredCount === 1 (inflated)
```

**Fix — add a `Number.isFinite` guard before accepting a score:**
```ts
// scoring.ts line 65 — replace the existing guard:
if (typeof score !== 'number' || !Number.isFinite(score)) return;
```

This makes `NaN`, `Infinity`, and `-Infinity` behave identically to `null`: the question is
skipped and does not contribute to the weighted average. Optionally, add the same guard in
`getMarkBand` as a defense-in-depth fallback:

```ts
export function getMarkBand(mark: number | null): MarkBand {
  if (mark === null || !Number.isFinite(mark)) return 'none';
  // ... rest unchanged
}
```

---

## Warnings

### WR-01: `@vitest/coverage-v8` is an optional dependency — 100% coverage thresholds are never enforced

**File:** `vitest.config.ts:9-15`

**Issue:** `vitest.config.ts` declares 100% line/branch/function/statement coverage thresholds for
`src/scoring/**`. However, `@vitest/coverage-v8` is marked as `"optional": true` in
`package-lock.json` and is not present in `node_modules/@vitest/`. Running `vitest run --coverage`
fails immediately with `MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'`. The
thresholds are therefore never checked in any CI or local run without explicit extra installation
steps.

The gap matters here because the NaN edge case (CR-01) is uncovered — the threshold was supposed
to catch it.

**Fix:** Remove the `optional` flag from `package-lock.json`  by changing
`@vitest/coverage-v8` in `package.json` from a dev-optional entry to a plain `devDependency` and
running `npm install`. Then re-run `npm test` to confirm coverage gates apply.

---

### WR-02: Duplicate question within `environment.ts` Docker topic

**File:** `src/data/bank/environment.ts:70,91`

**Issue:** The question `'What is the difference between an image and a container?'` appears twice
inside the single `docker` topic:

- Line 70: `level: 'novice'`
- Line 91: `level: 'novice'`

Because the key scheme is `${topic.id}-${questionIndex}`, both questions receive distinct keys
(`docker-0` and `docker-6` or similar), so they are independently scoreable. A candidate would be
asked the same question twice in the same topic with no differentiation, and an interviewer could
score it twice, inflating that topic's weighted average.

**Fix:** Remove the duplicate at line 91, or replace it with a distinct question at the appropriate
level.

---

### WR-03: Duplicate question within `cicd.ts` patching topic

**File:** `src/data/bank/cicd.ts:273,291`

**Issue:** The question `'How do you generate a patch from a git diff?'` appears twice within the
same topic:

- Line 273: `level: 'advanced'`
- Line 291: `level: 'intermediate'`

This is the same authoring defect as WR-02, compounded by the two copies having different
difficulty levels, which means scoring the same question twice at different weights is possible.

**Fix:** Remove the duplicate and either retain the `advanced` variant or replace the `intermediate`
slot with a distinct question (e.g., `'How do you apply a patch with git apply vs patch -p1?'`).

---

### WR-04: Near-duplicate questions in `ai.ts` `claude-hooks` topic

**File:** `src/data/bank/ai.ts:144,160`

**Issue:** The `claude-hooks` topic contains two questions that are functionally identical:

- Line 144: `'How do you debug a hook that is silently failing?'` (level: `advanced`)
- Line 160: `'How do you debug a hook that silently fails?'` (level: `expert`)

The wording difference ("is silently failing" vs "silently fails") is cosmetically distinct but
semantically the same question. The bank test does not detect near-duplicates, so this passes all
automated checks.

**Fix:** Differentiate the two into genuinely distinct questions, for example:
- `advanced`: `'How do you debug a hook that is silently failing?'` (diagnostic approach)
- `expert`: `'How would you add automated observability so hook failures are never silent?'`

---

### WR-05: `computeTopicMark` with override returns `scoredCount: 0` even when scores are present — contract is ambiguous and untested

**File:** `src/scoring/scoring.ts:49-54`

**Issue:** When an `override` value is used, `computeTopicMark` hard-codes `scoredCount: 0`
regardless of how many entries the `scores` map contains. A consumer displaying "X of N questions
scored" would show `0 of 12` even when there are fully scored questions, then see the mark jump to
the override value — a confusing state for a UI.

The two override tests (`'override replaces computed mark'`, `'override of 0 is valid'`) assert
only `mark` and `band`; neither asserts `scoredCount` or `totalCount`, so the behaviour is
untested and callers cannot rely on the field's meaning when an override is in effect.

**Fix — two options:**

Option A (document and test the intent): If `scoredCount: 0` on override is intentional (override
means "ignore individual scores"), add a test that asserts it:
```ts
it('override sets scoredCount to 0 regardless of scores map', () => {
  const result = computeTopicMark(TWIG_TOPIC, { 'twig-0': 3 }, 9);
  expect(result.scoredCount).toBe(0);
  expect(result.totalCount).toBe(12);
});
```
And add a JSDoc note to the return type explaining the convention.

Option B (fix the value): Return the actual scored count so the UI can show "2 of 12 scored (mark
overridden to 9)":
```ts
// compute scoredCount before the override check, then return it:
const scoredCount = topic.questions.filter((_, i) =>
  typeof scores[`${topic.id}-${i}`] === 'number'
).length;
if (typeof override === 'number' && override >= 0 && override <= 10) {
  return { mark: override, band: getMarkBand(override), scoredCount, totalCount: topic.questions.length };
}
```

---

### WR-06: `bank.test.ts` does not assert topic ID uniqueness across sections

**File:** `src/data/bank/bank.test.ts`

**Issue:** The score key scheme `${topic.id}-${questionIndex}` relies on topic IDs being globally
unique across all sections. If two topics in different sections share the same `id`, their score
entries would silently overwrite each other in a single `ScoreMap`, causing one topic's scores to
contaminate another's computation. The bank test does not verify this constraint. Duplicate topic
IDs currently do not exist (verified by static analysis), but there is nothing to prevent one from
being introduced in a future bank file.

**Fix:** Add a test to `bank.test.ts`:
```ts
it('every topic id is unique across all sections', () => {
  const ids = DEFAULT_SECTIONS.flatMap((s) => s.items.map((t) => t.id));
  expect(ids.length).toBe(new Set(ids).size);
});
```

---

## Info

### IN-01: `scoring.test.ts` test fixture `TWIG_TOPIC` is a manual copy of production data

**File:** `src/scoring/scoring.test.ts:14-33`

**Issue:** The `TWIG_TOPIC` fixture is a hand-copied snapshot of the `twig` topic from
`src/data/bank/frontend.ts`. The fixture comment even acknowledges this ("Prototype-derived
fixture"). If the order or levels of questions in the `twig` topic change in `frontend.ts`, the
fixture silently diverges and test calculations (`scoredCount`, weighted average values) remain
"correct" relative to the fixture but wrong relative to the real data.

This is a testing-strategy issue rather than a correctness bug today, but it creates a
maintenance trap: the scoring computation test passes while the fixture is stale.

**Fix:** Either import `frontendSection` directly and extract the twig topic in the test setup:
```ts
import { frontendSection } from '../data/bank/frontend.js';
const TWIG_TOPIC = frontendSection.items.find((t) => t.id === 'twig')!;
```
Or keep the fixture but add a snapshot assertion that validates it against the real data at test
time.

---

### IN-02: `vitest.config.ts` sets `globals: true` but both test files explicitly import `describe`/`it`/`expect`

**File:** `vitest.config.ts:6`, `src/scoring/scoring.test.ts:1`, `src/data/bank/bank.test.ts:1`

**Issue:** With `globals: true`, vitest injects `describe`, `it`, and `expect` into the global
scope automatically. Both test files also explicitly import these from `'vitest'`, making the
imports redundant. The code functions correctly, but the inconsistency means a reader cannot tell
whether globals are relied upon or whether the project requires explicit imports.

**Fix:** Pick one convention and apply it consistently:
- If globals are intentional, remove the explicit imports from both test files.
- If explicit imports are preferred (better for IDE tooling and portability), set `globals: false`
  in `vitest.config.ts`.

---

_Reviewed: 2026-06-17T07:25:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
