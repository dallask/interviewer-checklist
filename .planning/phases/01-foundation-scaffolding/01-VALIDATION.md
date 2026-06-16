---
phase: 1
slug: foundation-scaffolding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 |
| **Config file** | `vitest.config.ts` (created in Wave 1) |
| **Quick run command** | `npm run build && npm run ci:check-dist` |
| **Full suite command** | `npm test && npm run typecheck && npm run ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && npm run ci:check-dist`
- **After every plan wave:** Run `npm test && npm run typecheck && npm run ci`
- **Before `/gsd-verify-work`:** Full suite must be green + manual Chrome smoke test
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01-01 | 1 | FOUND-01 | — | No secrets in build env | build smoke | `npm install && npm run typecheck` | ❌ Wave 0 | ⬜ pending |
| 01-01-T2 | 01-01 | 1 | FOUND-01 | — | Biome lint/format clean | lint | `npm run ci` (biome ci) | ❌ Wave 0 | ⬜ pending |
| 01-02-T1 | 01-02 | 2 | FOUND-01, FOUND-02, FOUND-03 | T-manifest | No default_popup; permissions=["storage"] only | build + script | `npm run build && npm run ci:check-dist` | ❌ Wave 0 | ⬜ pending |
| 01-02-T2 | 01-02 | 2 | FOUND-03 | T-sw | SW ≤30 LOC, no mutable module state | unit | `npm test -- src/background/index.test.ts` | ❌ Wave 0 | ⬜ pending |
| 01-03-T1 | 01-03 | 3 | FOUND-04 | T-eval | CI rejects eval/unsafe-eval/localhost/vite-hmr | script | `npm run ci:check-dist` | ❌ Wave 0 | ⬜ pending |
| 01-03-T2 | 01-03 | 3 | FOUND-05 | — | Release workflow YAML valid, runs on tag push | CI | GH Actions on `v*` tag push | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test framework config (created in Wave 1, plan 01-01)
- [ ] `src/test/setup.ts` — shared test setup (import @testing-library/jest-dom)
- [ ] `src/background/index.test.ts` — SW module structure smoke test
- [ ] `scripts/check-dist.js` — FOUND-04 safety check (created in Wave 3, plan 01-03)
- [ ] `.github/workflows/build-check.yml` — CI for every PR (FOUND-04)
- [ ] `.github/workflows/release.yml` — release pipeline (FOUND-05)

*All Wave 0 artifacts are created by the phase plans — no pre-existing test infrastructure exists (greenfield project).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toolbar icon opens full-page tab in Chrome | FOUND-03 | Requires real Chrome browser with unpacked extension loaded | 1. `npm run build` 2. Open `chrome://extensions` 3. Load `dist/` as unpacked extension 4. Click toolbar icon 5. Verify new tab opens (may be blank) without errors |

---

## Security Threat Model

| Threat | STRIDE | Mitigation | Status |
|--------|--------|------------|--------|
| MV3 CSP bypass via `eval` in dependency | Tampering | CI grep for `eval`/`unsafe-eval` in `dist/` (check-dist.js) | ⬜ pending |
| Dev server artifacts in production build | Info Disclosure | CI grep for `localhost`/`vite-hmr` in `dist/` (check-dist.js) | ⬜ pending |
| Excess permissions triggers CWS rejection | Elevation of Privilege | CI manifest permissions check — `["storage"]` only enforced | ⬜ pending |
| `key.pem` loss = impossible to update extension | Denial of Service | Do NOT generate local key.pem; CWS manages the key after first dashboard upload | ✅ documented |
