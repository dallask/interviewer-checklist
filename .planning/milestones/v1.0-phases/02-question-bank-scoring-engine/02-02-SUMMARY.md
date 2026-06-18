---
phase: 02-question-bank-scoring-engine
plan: 02
subsystem: scoring

tags:
  - scoring-engine
  - tdd
  - vitest-coverage
  - pure-functions
  - typescript-types

# Dependency graph
requires:
  - 02-01 (src/data/bank/types.ts with Topic interface and DIFFICULTY_COEFFICIENTS; @vitest/coverage-v8 devDependency; vitest.config.ts coverage block)
provides:
  - src/scoring/scoring.ts: computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand + 5 exported types (MarkBand, ScoreMap, TopicResult, SectionResult, OverallResult)
  - src/scoring/index.ts: public API barrel re-exporting all 4 functions and 5 types
  - src/scoring/scoring.test.ts: 26 unit tests with prototype-derived Twig fixture and all 9 getMarkBand boundary values; 100% branch/line/function/statement coverage
affects:
  - Phase 3 Storage (imports ScoreMap, TopicResult types)
  - Phase 4+ UI (imports all 4 scorer functions for live mark computation)
  - Phase 5 Custom Questions (computeTopicMark accepts arbitrary Topic — no bank import)
  - Phase 8 AI Prompt (imports OverallResult, TopicResult for prompt generation)

# Tech tracking
tech-stack:
  added:
    - "@vitest/coverage-v8@4.1.9 re-installed in worktree (already declared in package.json from Wave 1)"
  patterns:
    - "Pure function scoring engine — no class, no singleton, no side effects; fully testable in isolation"
    - "typeof score !== 'number' guard — admits score=0 as valid, skips null/undefined/missing keys (Pitfall 1)"
    - "typeof override === 'number' && override >= 0 && override <= 10 — admits override=0 as valid"
    - "computeOverallMark accepts TopicResult[] (flat) — mean-of-topics not mean-of-groups (Pitfall 2)"
    - "getMarkBand uses CONTEXT.md thresholds: <5=low, 5-6.5=mid, 6.5-8=good, >=8=high (not prototype thresholds)"
    - "Question key scheme locked: ${topic.id}-${questionIndex} — compatible with Phase 3 storage and Phase 7 YAML import"
    - "All relative imports use .js extension (moduleResolution: Bundler)"
    - "Biome organizeImports auto-applied: exports/imports alphabetically sorted"

key-files:
  created:
    - src/scoring/scoring.ts
    - src/scoring/index.ts
    - src/scoring/scoring.test.ts
  modified:
    - .gitignore (coverage/ added)

key-decisions:
  - "computeOverallMark signature takes TopicResult[] not SectionResult[] — mean-of-topics matches prototype behavior (backend: 22 topics > design: 5 topics in weighting)"
  - "getMarkBand thresholds use CONTEXT.md values (low<5, mid 5-6.5, good 6.5-8, high>=8) — deliberately diverge from prototype (low<4, mid<6.5, good<8.5)"
  - "Override guard uses typeof === number check — admits override=0 as a valid override per CONTEXT.md D-override decision"
  - "coverage/ directory added to .gitignore — coverage output is generated, not source-controlled"

# Metrics
duration: ~2min (accelerated — all patterns fully specified in RESEARCH.md)
completed: 2026-06-17
---

# Phase 2 Plan 02: Scoring Engine Summary

**Pure scoring engine with difficulty-weighted topic marks, plain-mean section/overall marks, getMarkBand with CONTEXT.md thresholds; 26 unit tests with prototype-derived Twig fixture; 100% branch/line/function/statement coverage on src/scoring/***

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-17T04:16:32Z
- **Completed:** 2026-06-17
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `src/scoring/scoring.ts` created with 4 pure functions and 5 exported types:
  - `computeTopicMark(topic, scores, override?)` — difficulty-weighted avg with typeof score guard, typeof override guard
  - `computeSectionMark(topicResults[])` — plain arithmetic mean of non-null topic marks
  - `computeOverallMark(allTopicResults[])` — flat TopicResult[] mean-of-topics (not SectionResult[] mean-of-groups)
  - `getMarkBand(mark)` — CONTEXT.md thresholds: null=none, <5=low, 5-6.5=mid, 6.5-8=good, >=8=high
  - Types: `MarkBand`, `ScoreMap`, `TopicResult`, `SectionResult`, `OverallResult`
- `src/scoring/index.ts` barrel re-exports all 4 functions (value) and 5 types (type-only)
- `src/scoring/scoring.test.ts` — 26 unit tests:
  - `computeTopicMark`: 9 tests (null marks, score=0 valid, weighted avg, override, override=0, null override fallthrough, undefined override fallthrough, empty topic, null value in ScoreMap)
  - `computeSectionMark`: 4 tests (empty, two-topic mean, mixed null/scored, all-null)
  - `computeOverallMark`: 4 tests (no scored topics, empty array, flat [5,null,9] fixture, mean-of-topics vs mean-of-groups behavioral assertion)
  - `getMarkBand`: 9 boundary-value tests (all 9 CONTEXT.md boundary values)
- `npx vitest run --coverage` exits 0: 100% statements (37/37), branches (21/21), functions (11/11), lines (30/30)
- Full test suite: 59 tests passing (33 pre-existing + 26 new scoring tests)
- `npm run ci` exits 0 — no Biome violations, no TypeScript errors

## Task Commits

Each task was committed atomically using TDD RED/GREEN cycle:

1. **Task 1 RED: Failing scoring engine tests** - `2d76189` (test)
2. **Task 1 GREEN: Implement scoring engine** - `2d40896` (feat)
3. **Task 2: Coverage gate verification** - `3c82d35` (chore)

## Files Created/Modified

- `src/scoring/scoring.ts` — 4 pure scorer functions + 5 exported types; no import of DEFAULT_SECTIONS (data-agnostic)
- `src/scoring/index.ts` — public API barrel: value exports for functions, type-only exports for types
- `src/scoring/scoring.test.ts` — 26 unit tests, prototype-derived Twig fixture, all boundary values
- `.gitignore` — coverage/ directory added (generated output, not source-controlled)

## Decisions Made

- `computeOverallMark` takes `TopicResult[]` (flat) not `SectionResult[]` — matches prototype's mean-of-topics behavior; explicitly verified with a behavioral test asserting backend (22 topics) outweighs design (5 topics) in overall scoring
- `getMarkBand` implements CONTEXT.md thresholds (low<5) not prototype thresholds (low<4) — 9 boundary-value tests pin the exact behavior and will catch any regression
- `coverage/` output directory added to `.gitignore` — generated files should not be tracked in git history

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / Rule 3 - Blocking] Biome organizeImports violations on index.ts and scoring.test.ts**
- **Found during:** Task 1 GREEN — running `npm run ci` after creating scoring.ts + index.ts
- **Issue:** Biome's `organizeImports` requires exports and imports to be sorted alphabetically. `index.ts` had value exports before type exports; `scoring.test.ts` had `computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand` order.
- **Fix:** Ran `npm run check` to auto-apply Biome's deterministic import/export sort. All 3 files fixed at once.
- **Files modified:** `src/scoring/index.ts`, `src/scoring/scoring.test.ts`, `src/scoring/scoring.ts`
- **Commit:** `2d40896` (included in GREEN commit)

**2. [Rule 3 - Blocking] @vitest/coverage-v8 not installed in worktree node_modules**
- **Found during:** Task 2 — running `npx vitest run --coverage`
- **Issue:** The worktree's node_modules was empty; @vitest/coverage-v8 was declared in package.json (from Wave 1 install) but not present in the shared node_modules.
- **Fix:** Ran `npm install --save-dev @vitest/coverage-v8` — package is pre-approved in RESEARCH.md legitimacy audit (OK verdict, github.com/vitest-dev/vitest, ~10M/wk downloads).
- **Files modified:** package.json (no change — already declared), package-lock.json (updated)
- **Commit:** included in `3c82d35`

## TDD Gate Compliance

RED gate: `2d76189` — `test(02-02): add failing scoring engine tests (TDD RED)` — confirmed failure (module import error, no source files existed)

GREEN gate: `2d40896` — `feat(02-02): implement scoring engine (scoring.ts + index.ts) — TDD GREEN` — confirmed 26/26 tests passing

REFACTOR: Not needed — implementation was clean on first pass (Biome auto-fix was mechanical, not logic refactoring).

## Known Stubs

None — all 4 functions are fully implemented with complete logic. No placeholder returns, no TODO items. Coverage at 100% confirms all branches execute.

## Threat Flags

No new threat surface beyond what was specified in the plan's threat model:

- T-02-05: `typeof score !== 'number'` guard implemented — undefined/null/missing keys treated as unscored; out-of-range values computed as-is (Phase 3/4 callers must validate before storing)
- T-02-06: `getMarkBand` is a single pure function with hardcoded constants; 9 boundary-value tests pin thresholds
- T-02-07: `computeOverallMark` signature accepts `TopicResult[]` only — no way for caller to pass pre-aggregated group results; behavioral test explicitly asserts mean-of-topics
- T-02-SC: No new packages installed beyond pre-approved @vitest/coverage-v8 (re-install of declared devDependency)

## Self-Check: PASSED

Files exist on disk:
- `src/scoring/scoring.ts` — FOUND
- `src/scoring/index.ts` — FOUND
- `src/scoring/scoring.test.ts` — FOUND

Commits exist in git history:
- `2d76189` — FOUND (test RED)
- `2d40896` — FOUND (feat GREEN)
- `3c82d35` — FOUND (chore coverage)

Verification:
- `npm test` exits 0 (59 tests including 26 new scoring tests)
- `npx vitest run --coverage` exits 0 (100% statements/branches/functions/lines on src/scoring/**)
- `npm run ci` exits 0 (biome ci + tsc --noEmit)
- No `import DEFAULT_SECTIONS` in src/scoring/scoring.ts — confirmed
- All relative imports in src/scoring/ use .js extension — confirmed
- computeOverallMark accepts TopicResult[] not SectionResult[] — confirmed by type signature and behavioral test
