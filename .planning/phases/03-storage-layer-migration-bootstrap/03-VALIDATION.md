---
phase: 3
slug: storage-layer-migration-bootstrap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 3 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 + vitest-chrome 0.1.0 |
| **Config file** | `vitest.config.ts` (exists; vitest-chrome added to setup.ts) |
| **Quick run command** | `npx vitest run src/storage/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** `npx vitest run src/storage/`
- **After every plan wave:** `npm test && npm run ci`
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 03-01 | 1 | STORE-01, STORE-04, STORE-05, STORE-06 | unit | `npx vitest run src/storage/adapter.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | STORE-02 | unit | `npx vitest run src/storage/migrations/` | ❌ Wave 0 | ⬜ pending |
| 03-02-T1 | 03-02 | 2 | STORE-03 | unit | `npx vitest run src/storage/bootstrap.test.ts` | ❌ Wave 0 | ⬜ pending |
| 03-02-T2 | 03-02 | 2 | STORE-03, STORE-04 | unit | `npx vitest run src/storage/lifecycle.test.ts` | ❌ Wave 0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] Install `vitest-chrome` + `valibot` + `zustand` via npm
- [ ] Add vitest-chrome to `src/test/setup.ts` (2-line setup)
- [ ] `src/storage/adapter.test.ts` — StorageAdapter unit tests
- [ ] `src/storage/migrations/v1-to-v2.test.ts` — migration pure function tests
- [ ] `src/storage/bootstrap.test.ts` — bootstrap() orchestration tests
- [ ] `src/storage/lifecycle.test.ts` — event handler registration tests

---

## Manual-Only Verifications

None — all STORE-01 through STORE-06 behaviors are unit-testable with vitest-chrome mock.

---

## Security Threat Model

| Threat | STRIDE | Mitigation | Status |
|--------|--------|------------|--------|
| Storage overflow corrupts extension data | Denial of Service | getBytesInUse check before each write; storage-quota-warning event | ⬜ pending |
| Migration failure destroys session data | Tampering | recovery:<timestamp> key preserves payload; bootstrap returns defaults | ⬜ pending |
| Rapid writes exceed Chrome 120/min rate limit | Denial of Service | 300ms trailing debounce keeps well under limit | ⬜ pending |
| chrome.runtime.lastError swallowed silently | Info Disclosure | Explicit lastError check after every storage operation | ⬜ pending |
