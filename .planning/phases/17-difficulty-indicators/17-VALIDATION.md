---
phase: 17
slug: difficulty-indicators
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot`
- **After all tasks complete:** Run `npm test` (full suite, 2007+ tests must pass)

---

## Acceptance Gates

| Gate | Command | Expected |
|------|---------|----------|
| Tests green | `npm test` | 0 failures |
| Type check | `npx tsc --noEmit` | 0 errors |
| Lint | `npx biome check src/` | 0 errors |

---

## Nyquist Validation

**Wave 1 (QuestionCard changes):**
- After task 1 (difficulty maps + left border): verify `npm test -- QuestionCard` passes
- After task 2 (badge chip + tests): verify full `npm test` passes

**Success bar:** All 2007+ tests passing, 0 type errors, 0 lint errors.
