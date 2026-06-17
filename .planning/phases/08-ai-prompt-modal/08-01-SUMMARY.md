---
phase: 08-ai-prompt-modal
plan: "01"
subsystem: utils
tags: [tdd, pure-function, ai-prompt, scoring, vitest]
dependency_graph:
  requires:
    - src/scoring/scoring.ts (computeTopicMark)
    - src/data/bank/types.ts (DIFFICULTY_COEFFICIENTS, Section)
    - src/storage/types.ts (V3Session)
  provides:
    - src/utils/buildAiPrompt.ts (buildAiPrompt pure function)
  affects:
    - Phase 08-02 (AiPromptModal.tsx consumes buildAiPrompt output)
tech_stack:
  added: []
  patterns:
    - TDD RED → GREEN cycle (no REFACTOR needed)
    - Pure utility function following yamlExport.ts pattern
    - Line-by-line string assembly via lines.push() + join('\n')
key_files:
  created:
    - src/utils/buildAiPrompt.ts
    - src/utils/buildAiPrompt.test.ts
  modified: []
decisions:
  - "Use Math.max over topic.questions to find highest difficulty coefficient for per-topic difficulty note"
  - "Render 'No scores yet' at mark line when result.mark is null (0/N scored)"
  - "Topic notes and per-question notes only rendered when non-empty string"
metrics:
  duration_minutes: 2
  completed_date: "2026-06-17"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
requirements:
  - AI-01
---

# Phase 08 Plan 01: buildAiPrompt Pure Utility (TDD) Summary

**One-liner:** Pure `buildAiPrompt(session, sections)` function that assembles a multi-section AI feedback prompt string from V3Session data, with difficulty-weighted topic notes and a structured task spec block.

## What Was Built

`src/utils/buildAiPrompt.ts` — a pure function (no React, no DOM, no store) that accepts a `V3Session` and `readonly Section[]` and returns a structured plain-text AI feedback prompt string.

`src/utils/buildAiPrompt.test.ts` — 17 Vitest unit tests covering all behavior cases from the plan spec.

## Output Structure

The generated prompt contains three blocks:

1. **Candidate block** — name, role, date, interviewer (all fields show `(not set)` when `session.candidate` is null); optional `Notes:` line when `details` is non-empty.

2. **Per-section / per-topic blocks** — for each section: `## {label}` heading; for each topic: `### {name}`, mark line (`Mark: X.X (N/M scored)` or `Mark: No scores yet (0/M scored)`), difficulty note (`Difficulty: {Label} — weighted {coef}×`), then bank questions with `[score]` or `[skipped]` prefix + optional `  Note:` lines, then custom questions (same format with `(custom)` label, score key is `cq.id`), then optional `Topic notes:` line.

3. **Task spec block** — `---`, `## Task`, fixed instruction template.

## TDD Gate Compliance

- RED commit `a5b94f1`: `test(08-01): add failing tests for buildAiPrompt` — 17 tests, all failing against stub returning `''`
- GREEN commit `133e1cf`: `feat(08-01): implement buildAiPrompt pure utility` — all 17 tests passing
- REFACTOR: not needed — implementation was clean on first pass

## Verification

```
npx vitest run src/utils/buildAiPrompt.test.ts  → 17/17 pass
npx tsc --noEmit                                 → no errors
npx vitest run                                   → 457/457 pass (32 test files)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — `buildAiPrompt` is fully implemented and returns complete prompt content for all session states (empty, scored, custom questions, candidate set/null, topic notes, per-question notes).

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The function produces a plain text string. No security concerns beyond T-08-01 (already accepted in plan threat model).

## Self-Check: PASSED

- [x] `src/utils/buildAiPrompt.ts` exists — FOUND
- [x] `src/utils/buildAiPrompt.test.ts` exists — FOUND
- [x] RED commit `a5b94f1` exists — FOUND
- [x] GREEN commit `133e1cf` exists — FOUND
- [x] All 17 tests pass
- [x] No TypeScript errors
- [x] Full suite (457 tests) green
