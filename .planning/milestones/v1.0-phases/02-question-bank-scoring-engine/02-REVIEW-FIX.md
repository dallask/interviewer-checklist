---
phase: 02-question-bank-scoring-engine
fixed_at: 2026-06-17T07:30:00Z
review_path: .planning/phases/02-question-bank-scoring-engine/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-17T07:30:00Z
**Source review:** .planning/phases/02-question-bank-scoring-engine/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: NaN score corrupts computeTopicMark — silently returns band 'high'

**Files modified:** `src/scoring/scoring.ts`, `src/scoring/scoring.test.ts`
**Commit:** 9181bf1
**Applied fix:** Changed the score guard in `computeTopicMark` from `typeof score !== 'number'` to `typeof score !== 'number' || !Number.isFinite(score)` so that `NaN`, `Infinity`, and `-Infinity` are treated as unscored (skipped) rather than corrupting the weighted average. Added the same defense-in-depth guard in `getMarkBand` so non-finite marks return `'none'`. Added four new tests: two in `computeTopicMark` (NaN and Infinity inputs) and two in `getMarkBand` (NaN and Infinity).

### WR-01: @vitest/coverage-v8 is an optional dependency — thresholds never enforced

**Files modified:** none (operational fix — package installed into node_modules)
**Commit:** n/a (no tracked files changed)
**Applied fix:** `@vitest/coverage-v8` was already declared as a plain `devDependency` in `package.json` (not optional). The package was simply missing from `node_modules` due to a prior install skipping optional peer deps. Running `npm install` installed the package. Coverage now runs successfully with `npx vitest run --coverage` and all four 100% thresholds pass (37/37 statements, 25/25 branches, 11/11 functions, 30/30 lines).

### WR-02: Duplicate question within environment.ts Docker topic

**Files modified:** `src/data/bank/environment.ts`
**Commit:** b67669f
**Applied fix:** Removed the second occurrence of `'What is the difference between an image and a container?'` (novice level) that appeared after `'What is a container?'`. The first occurrence at the top of the docker topic's question list is retained.

### WR-03: Duplicate question within cicd.ts patching topic

**Files modified:** `src/data/bank/cicd.ts`
**Commit:** 4e6da0f
**Applied fix:** Replaced the intermediate-level duplicate of `'How do you generate a patch from a git diff?'` with a distinct question: `'How do you apply a patch with git apply versus patch -p1?'`. The advanced-level original is retained.

### WR-05: computeTopicMark with override returns scoredCount 0 regardless of actual scores

**Files modified:** `src/scoring/scoring.ts`, `src/scoring/scoring.test.ts`
**Commit:** 0398c05
**Applied fix (Option B):** Moved the question-scoring loop before the override branch so `scoredCount` is computed from the actual scores map (using the same `Number.isFinite` guard) in all cases. When an override is active the returned `scoredCount` now reflects how many questions were actually scored, enabling consumers to display accurate "X of N scored (mark overridden)" information. Added two new tests asserting the corrected behaviour.

### WR-06: bank.test.ts does not assert topic ID uniqueness across sections

**Files modified:** `src/data/bank/bank.test.ts`
**Commit:** 9a56824
**Applied fix:** Added the test `'every topic id is unique across all sections'` that collects all topic IDs via `DEFAULT_SECTIONS.flatMap(s => s.items.map(t => t.id))` and asserts `ids.length === new Set(ids).size`. The test passes on the current bank (all 86 IDs are unique) and will catch any future accidental duplicate.

---

_Fixed: 2026-06-17T07:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
