---
phase: 18
slug: icon-library
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 18 — Validation Strategy

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
- **After all tasks complete:** Run `npm test` (full suite, 2693+ tests must pass)
- **Before `/gsd-verify-work`:** Full suite must be green + `npx tsc --noEmit` + `npx biome check src/`
- **Max feedback latency:** ~15 seconds

---

## Nyquist Validation

**Wave 1 (icon replacements):**
- After each file's emoji→Lucide swap: run `npm test -- --reporter=dot` to catch test breakage immediately
- Known breaking tests: `SessionRow.test.tsx` lines 85 + 101 (`getByText('✓')` → fix to use `getAllByRole` or `aria-label` query)
- After SessionRow test fix: verify full `npm test` passes
- TypeScript compile check: `npx tsc --noEmit` must return 0 errors (catches wrong Lucide icon names at import)
- Biome lint check: `npx biome check src/` must return 0 errors

**Success bar:** All 2693+ tests passing, 0 type errors, 0 lint errors.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Icon visual appearance matches design intent | VIS-03 | Cannot automated-test SVG rendering | Load extension, inspect each replaced location — confirm Lucide icon renders correctly and is visually appropriate |
| No emoji remain in rendered UI | VIS-03 | Browser visual check | Open extension in Chrome, navigate all panels — confirm no emoji in interactive controls or structural UI elements |

---

## Acceptance Gates

| Gate | Command | Expected |
|------|---------|----------|
| Tests green | `npm test` | 0 failures |
| Type check | `npx tsc --noEmit` | 0 errors (catches bad import names) |
| Lint | `npx biome check src/` | 0 errors |
