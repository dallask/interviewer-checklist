---
phase: 02-question-bank-scoring-engine
verified: 2026-06-17T07:33:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 2: Question Bank & Scoring Engine Verification Report

**Phase Goal:** The complete built-in question bank and scoring engine exist as pure, tested modules that define the behavioral contract for all downstream UI
**Verified:** 2026-06-17T07:33:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `DEFAULT_SECTIONS` exports 9 groups, ~86 topics, and 1000+ questions each typed with one of four difficulty levels (coefficients 1.00, 1.25, 1.50, 1.75) | VERIFIED | `src/data/bank/index.ts` exports `DEFAULT_SECTIONS: readonly Section[]` with 9 groups; bank.test.ts assertions confirm 9 groups / 86 topics / 1066 questions (>=1000) / all levels valid — test passes in live run (66/66 tests) |
| 2 | The scoring engine computes a difficulty-weighted topic mark, a plain-mean group mark, and a plain-mean overall mark, and recomputes correctly when any score or override changes | VERIFIED | `computeTopicMark`, `computeSectionMark`, `computeOverallMark` in `src/scoring/scoring.ts` implement the full algorithm; 32 unit tests in `scoring.test.ts` cover weighted average, plain means, and override replacement — all pass |
| 3 | Manual topic overrides replace computed marks without affecting other topics | VERIFIED | `computeTopicMark` override guard `typeof override === 'number' && override >= 0 && override <= 10` isolates override to a single topic call; tests assert override=9 and override=0 both work; other topics are unaffected by design (function is pure, stateless) |
| 4 | Vitest tests covering bank structure and scoring functions pass with prototype-derived fixtures | VERIFIED | `bank.test.ts` (6 tests) and `scoring.test.ts` (32 tests) all pass; scoring tests use prototype-derived Twig fixture with 12 questions and exact coefficient values; `npx vitest run --coverage` exits 0 with 100% statements/branches/functions/lines on `src/scoring/**` |

**Score:** 4/4 truths verified

---

### Must-Have Truths (Plan Frontmatter — 02-01-PLAN.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DEFAULT_SECTIONS importable from src/data/bank/index.ts and contains exactly 9 Section objects | VERIFIED | `index.ts` exports `DEFAULT_SECTIONS: readonly Section[]` assembled from all 9 group files; bank.test.ts `has exactly 9 groups` passes |
| 2 | Total topic count across all groups is exactly 86 | VERIFIED | bank.test.ts `has exactly 86 topics` assertion passes; file-level grep confirms 13+5+22+8+6+6+5+9+12 = 86 |
| 3 | Total question count across all groups is at least 1000 (actual: 1066) | VERIFIED | bank.test.ts `>=1000 questions` passes with 1066 questions present; SUMMARY claimed 1067 but live count is 1066 — still satisfies >=1000 |
| 4 | Every question has a level property that is one of: novice \| intermediate \| advanced \| expert | VERIFIED | bank.test.ts asserts `VALID_LEVELS.has(q.level)` for every question; passes in live run |
| 5 | DIFFICULTY_COEFFICIENTS exported from types.ts with values novice=1.00, intermediate=1.25, advanced=1.50, expert=1.75 | VERIFIED | `types.ts` lines 23–28: exact values present as `Record<Difficulty, number> as const` |
| 6 | bank.test.ts passes all structural assertions: npm test exits 0 | VERIFIED | `npm test` exits 0 — 66/66 tests pass; bank.test.ts has 6 tests (5 original + 1 added by WR-06 post-review fix) |
| 7 | @vitest/coverage-v8 is installed and vitest.config.ts has a coverage block targeting src/scoring/** | VERIFIED | `package.json` declares `@vitest/coverage-v8: ^4.1.9`; `npm ls` confirms version 4.1.9 after `npm install`; `vitest.config.ts` has coverage block with `provider: 'v8'`, `include: ['src/scoring/**']`, and 100% thresholds |

### Must-Have Truths (Plan Frontmatter — 02-02-PLAN.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | computeTopicMark returns null mark when no questions are scored | VERIFIED | Test: "returns null mark when no scores provided" — passes |
| 2 | computeTopicMark treats score=0 as a valid scored value (not unscored) | VERIFIED | Test: "score of 0 is valid and scores the question" — passes; guard is `typeof score !== 'number' \|\| !Number.isFinite(score)` |
| 3 | computeTopicMark applies difficulty-weighted average: sum(coef*score)/sum(coef) over scored questions only | VERIFIED | Test: "computes weighted average correctly with multiple scores" — 8+1.5*6=17, coeffSum=2.5, mark=6.8 — passes |
| 4 | A manual override (0–10) passed as third argument replaces the computed mark entirely | VERIFIED | Tests: override=9 and override=0 both pass; scoredCount preserved correctly (WR-05 fix) |
| 5 | computeSectionMark returns the plain arithmetic mean of non-null topic marks | VERIFIED | Tests confirm empty → null, two marks average to mean, mixed null/scored uses only non-null — all pass |
| 6 | computeOverallMark accepts flat TopicResult[] (not SectionResult[]) — mean-of-topics matches prototype | VERIFIED | Signature in `scoring.ts` is `computeOverallMark(allTopicResults: TopicResult[])`. Behavioral test with 22 backend topics vs 5 design topics asserts mean-of-topics (~1.85) not mean-of-groups (5.0) |
| 7 | getMarkBand uses CONTEXT.md thresholds: null=none, <5=low, 5–6.49=mid, 6.5–7.99=good, >=8=high | VERIFIED | 11 boundary-value tests cover null, NaN, Infinity, 0, 4.99, 5.0, 6.49, 6.5, 7.99, 8.0, 10 — all pass |
| 8 | npx vitest run --coverage exits 0 with 100% lines/branches/functions/statements on src/scoring/** | VERIFIED | Live run: Statements 37/37, Branches 25/25, Functions 11/11, Lines 30/30 — all 100% |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/bank/types.ts` | Difficulty union, Question/Topic/Section interfaces, DIFFICULTY_COEFFICIENTS | VERIFIED | All exports present; readonly interfaces; no TypeScript enum |
| `src/data/bank/frontend.ts` | Section data constant (13 topics) | VERIFIED | 158 questions, typed `: Section`, imports from `./types.js` |
| `src/data/bank/design.ts` | Section data constant (5 topics) | VERIFIED | 60 questions |
| `src/data/bank/backend.ts` | Section data constant (22 topics) | VERIFIED | 275 questions |
| `src/data/bank/environment.ts` | Section data constant (8 topics) | VERIFIED | 99 questions |
| `src/data/bank/testing.ts` | Section data constant (6 topics) | VERIFIED | 75 questions |
| `src/data/bank/cicd.ts` | Section data constant (6 topics) | VERIFIED | 76 questions |
| `src/data/bank/tooling.ts` | Section data constant (5 topics) | VERIFIED | 63 questions |
| `src/data/bank/integrations.ts` | Section data constant (9 topics) | VERIFIED | 111 questions |
| `src/data/bank/ai.ts` | Section data constant (12 topics) | VERIFIED | 149 questions |
| `src/data/bank/index.ts` | DEFAULT_SECTIONS barrel + type re-exports | VERIFIED | Assembles all 9 groups in prototype order; re-exports types and DIFFICULTY_COEFFICIENTS |
| `src/data/bank/bank.test.ts` | Structural assertions: 9 groups, 86 topics, >=1000 questions, valid levels | VERIFIED | 6 tests — 5 original + 1 uniqueness test added by WR-06; all pass |
| `src/scoring/scoring.ts` | computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand + 5 types | VERIFIED | All 4 functions and 5 types exported; NaN/Infinity guard added by CR-01 fix |
| `src/scoring/index.ts` | Public API barrel — all functions and types | VERIFIED | Type-only exports for types, value exports for functions |
| `src/scoring/scoring.test.ts` | 100%-coverage unit tests with Twig fixture | VERIFIED | 32 tests; prototype-derived Twig fixture; all 9 getMarkBand boundary values |
| `vitest.config.ts` | Coverage config with provider v8, 100% thresholds scoped to src/scoring/** | VERIFIED | Exact config present; all 4 threshold metrics at 100 |
| `package.json` | @vitest/coverage-v8 devDependency | VERIFIED | `^4.1.9` declared in devDependencies |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/data/bank/frontend.ts` (and 8 siblings) | `src/data/bank/types.ts` | `import type { Section } from './types.js'` | WIRED | All 9 group files import `Section` type from `./types.js` |
| `src/data/bank/index.ts` | `src/data/bank/frontend.ts` (and 8 siblings) | Named import of each group export | WIRED | index.ts imports all 9 group constants; assembles DEFAULT_SECTIONS |
| `src/data/bank/bank.test.ts` | `src/data/bank/index.ts` | `import { DEFAULT_SECTIONS } from './index.js'` | WIRED | Test file imports DEFAULT_SECTIONS and uses it in all 6 assertions |
| `src/scoring/scoring.ts` | `src/data/bank/types.ts` | `import type { Topic }` and `import { DIFFICULTY_COEFFICIENTS }` | WIRED | Both imports present; DIFFICULTY_COEFFICIENTS used in weighted sum computation |
| `src/scoring/scoring.test.ts` | `src/scoring/index.ts` | `import { computeTopicMark, ... } from './index.js'` | WIRED | All 4 functions imported and exercised across 32 tests |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces pure modules (build-time constants and pure functions), not UI components that render dynamic data. No data-source trace needed.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All tests pass | `npm test` | 66/66 tests pass, exit 0 | PASS |
| 100% coverage on src/scoring/** | `npx vitest run --coverage` | 100% stmts/branches/funcs/lines | PASS |
| CI clean (biome + tsc) | `npm run ci` | Exit 0, no violations | PASS |
| No TypeScript enum in bank | `grep -rn "^export enum\|^enum " src/data/bank/` | No matches | PASS |
| All relative imports use .js | `grep -n "from '\." src/data/bank/*.ts \| grep -v "\.js'"` | No matches | PASS |
| No DEFAULT_SECTIONS import in scoring.ts | `grep "DEFAULT_SECTIONS" src/scoring/scoring.ts` | No matches | PASS |

---

### Probe Execution

No probe scripts declared in PLAN files. Step skipped.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BANK-01 | 02-01-PLAN.md | Built-in question bank: 9 groups / ~86 topics / 1000+ questions / 4 difficulty levels | SATISFIED | DEFAULT_SECTIONS: 9 groups, 86 topics, 1066 questions, all 4 levels with correct coefficients |
| BANK-02 | 02-02-PLAN.md | Weighted scoring engine: difficulty-weighted topic marks, manual overrides, plain-mean group/overall, live recompute, colored mark bands | SATISFIED | computeTopicMark / computeSectionMark / computeOverallMark / getMarkBand implement full contract; override tested; mark bands cover all 5 values |
| BANK-03 | 02-01 + 02-02-PLAN.md | Vitest unit coverage on bank structure and scoring engine with prototype-derived fixtures | SATISFIED | bank.test.ts (6 tests, structural), scoring.test.ts (32 tests, prototype-derived Twig fixture), 100% branch/line/function/statement coverage on src/scoring/** |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No debt markers found | — | TBD/FIXME/XXX | — | None |
| No warning markers found | — | TODO/HACK/PLACEHOLDER | — | None |

---

### Notable Observations

**Post-summary fixes included in final codebase:** After the SUMMARYs were written, a code review identified issues that were fixed before this verification:

- **CR-01** (`9181bf1`): `NaN` and `Infinity` scores were corrupting `computeTopicMark` results (NaN passes `typeof` guard). Fixed by adding `Number.isFinite()` to score guard and `getMarkBand`. Four new tests added.
- **WR-05** (`0398c05`): When an override was provided, `scoredCount` was hardcoded to 0 rather than reflecting actual scored questions. Fixed + two new tests.
- **WR-06** (`9a56824`): Added a topic ID uniqueness test to `bank.test.ts` to guard the score key scheme.
- **WR-02/WR-03** (`b67669f`, `4e6da0f`): Duplicate questions removed from `environment.ts` and `cicd.ts`.

These fixes strengthen the behavioral contract. All 66 tests pass after fixes.

**node_modules state:** `@vitest/coverage-v8` was declared in `package.json` but absent from `node_modules` at verification start (known worktree behavior documented in 02-02-SUMMARY). `npm install` restored it. Coverage gate verified at 100% after install.

**Question count discrepancy:** PLAN frontmatter stated "actual: 1067" but live count is 1066. The test assertion is `>=1000`, which 1066 satisfies. No impact on any acceptance criterion.

---

### Human Verification Required

None. All must-haves are verifiable programmatically. The scoring engine is a pure-function module with no UI, no external services, and no visual output. All behavioral truths were verified by running the test suite and coverage gate directly.

---

## Gaps Summary

No gaps. All 4 roadmap success criteria are verified. All must-have truths from both plan frontmatter sections are verified. All artifacts exist, are substantive, and are wired. Coverage gate runs at 100%. CI is clean.

---

_Verified: 2026-06-17T07:33:00Z_
_Verifier: Claude (gsd-verifier)_
