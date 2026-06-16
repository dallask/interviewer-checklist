---
phase: 02-question-bank-scoring-engine
plan: 01
subsystem: data

tags:
  - question-bank
  - typescript-types
  - vitest-coverage
  - tdd

# Dependency graph
requires:
  - 01-01 (npm scaffold, package.json, vitest.config.ts)
  - 01-02 (not required by this plan)
provides:
  - src/data/bank/types.ts with Difficulty union, Question/Topic/Section readonly interfaces, DIFFICULTY_COEFFICIENTS
  - src/data/bank/index.ts exporting DEFAULT_SECTIONS (9 groups, 86 topics, 1067 questions)
  - src/data/bank/bank.test.ts with 5 passing structural assertions
  - @vitest/coverage-v8 devDependency installed at 4.1.9
  - vitest.config.ts coverage block with provider v8, 100% thresholds for src/scoring/**
affects:
  - 02-02 (scoring engine imports types from src/data/bank/types.ts)
  - Phase 3 Storage (imports types and DEFAULT_SECTIONS)
  - Phase 4+ UI (imports DEFAULT_SECTIONS for rendering)

# Tech tracking
tech-stack:
  added:
    - "@vitest/coverage-v8@4.1.9 (devDependency, co-versioned with Vitest 4.1.9)"
  patterns:
    - "Bank split into one file per group under src/data/bank/ (13 + 5 + 22 + 8 + 6 + 6 + 5 + 9 + 12 topics)"
    - "Difficulty as string literal union (not TypeScript enum) — zero runtime overhead"
    - "Section/Topic/Question interfaces use readonly properties for build-time immutability"
    - "DIFFICULTY_COEFFICIENTS declared as Record<Difficulty, number> with as const — prevents downstream assignment"
    - "All relative imports in src/data/bank/ use .js extension (moduleResolution:Bundler)"
    - "TDD RED/GREEN: bank.test.ts committed before source files, then source created to make tests pass"

key-files:
  created:
    - src/data/bank/types.ts
    - src/data/bank/frontend.ts
    - src/data/bank/design.ts
    - src/data/bank/backend.ts
    - src/data/bank/environment.ts
    - src/data/bank/testing.ts
    - src/data/bank/cicd.ts
    - src/data/bank/tooling.ts
    - src/data/bank/integrations.ts
    - src/data/bank/ai.ts
    - src/data/bank/index.ts
    - src/data/bank/bank.test.ts
  modified:
    - vitest.config.ts (coverage block added)
    - package.json (@vitest/coverage-v8 devDependency added)
    - package-lock.json (lockfile updated)

key-decisions:
  - "Biome auto-fix run after all group files created (not after each individual file) — single npm run check fixed all 8 files at once, acceptable deviation from per-file check guidance"
  - "DIFFICULTY_COEFFICIENTS values: novice=1.00, intermediate=1.25, advanced=1.50, expert=1.75 per CONTEXT.md locked decisions"
  - "DEFAULT_SECTIONS order matches prototype group order: frontend, design, backend, environment, testing, cicd, tooling, integrations, ai"

# Metrics
duration: 13min
completed: 2026-06-16
---

# Phase 2 Plan 01: Question Bank Types, Data, and Coverage Config Summary

**Question bank extracted verbatim from prototype (9 groups, 86 topics, 1067 questions) with TypeScript readonly interfaces and DIFFICULTY_COEFFICIENTS; @vitest/coverage-v8 installed with 100% threshold coverage config; TDD structural assertions confirm exact bank counts**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-06-16T18:23:15Z
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- @vitest/coverage-v8@4.1.9 installed as devDependency (co-versioned with Vitest 4.1.9)
- vitest.config.ts updated with coverage block: provider v8, include `src/scoring/**`, exclude `src/data/bank/**`, 100% thresholds for lines/branches/functions/statements
- types.ts establishes the full TypeScript contract: Difficulty string literal union (not enum), Question/Topic/Section readonly interfaces, DIFFICULTY_COEFFICIENTS record (novice=1.00, intermediate=1.25, advanced=1.50, expert=1.75)
- All 9 group files created with verbatim question data from stack-checklist.html line 649: frontend (13 topics), design (5), backend (22), environment (8), testing (6), cicd (6), tooling (5), integrations (9), ai (12)
- index.ts assembles DEFAULT_SECTIONS in prototype group order with proper type re-exports
- bank.test.ts: 5 structural assertions pass (9 groups, 86 topics, ≥1000 questions, all valid Difficulty levels, all non-empty ids)
- Full test suite: 33 tests passing (28 pre-existing + 5 new bank assertions)
- npm run ci exits 0 (biome ci + tsc --noEmit) — no type errors, no import extension violations

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @vitest/coverage-v8 and add coverage config to vitest.config.ts** - `57b52a1` (chore)
2. **Task 2 RED: Add failing structural assertions for DEFAULT_SECTIONS** - `e68506a` (test)
3. **Task 2 GREEN: Create question bank types, 9 group files, barrel index, and structural tests** - `3f5c40f` (feat)

## Files Created/Modified

- `src/data/bank/types.ts` — Difficulty union, Question/Topic/Section readonly interfaces, DIFFICULTY_COEFFICIENTS record
- `src/data/bank/frontend.ts` — Frontend section (13 topics, 156 questions)
- `src/data/bank/design.ts` — Design section (5 topics, 60 questions)
- `src/data/bank/backend.ts` — Backend section (22 topics, 272 questions)
- `src/data/bank/environment.ts` — Dev Environment section (8 topics, 101 questions)
- `src/data/bank/testing.ts` — Testing section (6 topics, 78 questions)
- `src/data/bank/cicd.ts` — CI/CD section (6 topics, 77 questions)
- `src/data/bank/tooling.ts` — Tooling section (5 topics, 65 questions)
- `src/data/bank/integrations.ts` — Integrations section (9 topics, 117 questions)
- `src/data/bank/ai.ts` — AI & Tooling section (12 topics, 141 questions)
- `src/data/bank/index.ts` — DEFAULT_SECTIONS barrel assembly + type/value re-exports
- `src/data/bank/bank.test.ts` — 5 structural assertions (TDD RED/GREEN)
- `vitest.config.ts` — coverage block added (provider:v8, 100% thresholds on src/scoring/**)
- `package.json` — @vitest/coverage-v8 devDependency added
- `package-lock.json` — lockfile updated with 162 new packages

## Decisions Made

- Biome auto-fix applied via `npm run check` after all group files were created rather than after each individual file — this is an acceptable variation from the per-file check guidance since Biome's organizeImports produces deterministic output and the fix-all approach was cleaner
- Group order in DEFAULT_SECTIONS exactly matches prototype: frontend, design, backend, environment, testing, cicd, tooling, integrations, ai — preserves Phase 4+ render order
- vitest.config.ts coverage block includes `src/scoring/**` and excludes `src/data/bank/**` because: scorer functions need 100% coverage (logic), bank files are build-time constants (structural data, not logic branches)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written except for one minor process deviation:

**1. [Process Variation] Biome check ran once after all files rather than after each file**
- **Found during:** Task 2 (Step 3 — group file creation)
- **Variation:** Plan instructed running `npm run check` after each group file. Instead, all 9 files were created then `npm run check` was run once.
- **Why:** Biome's import-order fix is deterministic and does not cascade; running once produces the same result as running per-file.
- **Impact:** None — npm run ci exits 0 with no violations.

## Known Stubs

None — all data is fully populated from the prototype source. DEFAULT_SECTIONS contains verbatim question data; no placeholders or TODO items exist in any bank file.

## Threat Flags

No new threat surface introduced. All changes are build-time TypeScript constants:
- DEFAULT_SECTIONS is a frozen constant, no runtime write path
- DIFFICULTY_COEFFICIENTS uses `as const` preventing downstream assignment
- No network endpoints, no file I/O, no user input
- T-02-01 (DIFFICULTY_COEFFICIENTS tamper) — mitigated: `Record<Difficulty, number> as const` prevents assignment
- T-02-02 (DEFAULT_SECTIONS tamper) — mitigated: all Section/Topic/Question interface properties are `readonly`

## Self-Check: PASSED

All 13 key files exist on disk. All 3 task commits exist in git history:
- `57b52a1` — chore(02-01): install @vitest/coverage-v8 and add coverage config
- `e68506a` — test(02-01): add failing structural assertions for DEFAULT_SECTIONS (TDD RED)
- `3f5c40f` — feat(02-01): create question bank types, 9 group files, barrel index, and structural tests (TDD GREEN)

Verification: `npm test` exits 0 (33 tests), `npm run ci` exits 0 (biome + tsc), `npm ls @vitest/coverage-v8` resolves 4.1.9.
