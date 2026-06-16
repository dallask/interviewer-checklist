---
phase: 2
slug: question-bank-scoring-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vitest.config.ts` (needs `coverage` block — added in Wave 1) |
| **Quick run command** | `npm test` |
| **Coverage run command** | `npx vitest run --coverage` |
| **Full suite command** | `npm test && npm run ci` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run ci`
- **Before `/gsd-verify-work`:** `npm test && npx vitest run --coverage` — coverage must pass
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 02-01 | 1 | BANK-01 | Read-only data module, no runtime writes | structural unit | `npm test src/data/bank/bank.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-01-T2 | 02-01 | 1 | BANK-01 | DIFFICULTY_COEFFICIENTS immutable | unit | `npm test src/data/bank/bank.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-02-T1 | 02-02 | 2 | BANK-02 | Pure function, no side effects | unit | `npm test src/scoring/scoring.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-02-T2 | 02-02 | 2 | BANK-02, BANK-03 | 100% branch coverage on scorer | coverage | `npx vitest run --coverage` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/bank/bank.test.ts` — structural assertions (9 groups, 86 topics, ≥1000 questions, all levels valid)
- [ ] `src/scoring/scoring.test.ts` — scorer unit tests with prototype-derived fixtures
- [ ] `vitest.config.ts` — add `coverage` block with `provider: 'v8'`, 100% thresholds for `src/scoring/`
- [ ] Install `@vitest/coverage-v8` via `npm install --save-dev @vitest/coverage-v8`

*All Wave 0 artifacts are created by the phase plans — no pre-existing test infrastructure exists for these modules.*

---

## Manual-Only Verifications

None — Phase 2 is pure logic/data with no runtime browser interaction required.

---

## Security Threat Model

| Threat | STRIDE | Mitigation | Status |
|--------|--------|------------|--------|
| Prototype data drift (bank diverges from spec) | Tampering | Structural unit tests assert exact counts + valid levels | ⬜ pending |
| Scoring formula regression in future phases | Tampering | 100% branch coverage on scorer gates any change | ⬜ pending |
| Coefficient mutation at runtime | Tampering | `as const` assertion on DIFFICULTY_COEFFICIENTS; no writes in pure functions | ⬜ pending |
