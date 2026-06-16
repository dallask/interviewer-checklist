---
phase: 01-foundation-scaffolding
plan: 03
subsystem: infra
tags: [ci, github-actions, check-dist, chrome-webstore, release-pipeline, mv3-safety]

# Dependency graph
requires:
  - 01-01 (package.json with "type":"module" and ci:check-dist script)
  - 01-02 (dist/ build artifact from CRXJS+Vite pipeline, manifest.json with permissions)
provides:
  - scripts/check-dist.js: Post-build MV3/CSP/permissions safety audit — exits 1 on any violation
  - .github/workflows/build-check.yml: CI on every push/PR to main
  - .github/workflows/release.yml: Release pipeline on semver tag push
affects:
  - all subsequent phases (CI runs on every PR; safety gate enforces no MV3 regressions)

# Tech tracking
tech-stack:
  added:
    - GitHub Actions build-check workflow (Node 22, npm ci, biome+tsc+build+check-dist)
    - GitHub Actions release workflow (same + zip + chrome-webstore-upload-cli)
  patterns:
    - check-dist.js uses node: prefix for all Node built-in imports (ES module style)
    - process.exit(1) on first failure (no error accumulation)
    - Release workflow uses vars.EXTENSION_ID (variable, not secret) + secrets for OAuth
    - Safety checks duplicated in release workflow — independent of build-check workflow

key-files:
  created:
    - scripts/check-dist.js
    - .github/workflows/build-check.yml
    - .github/workflows/release.yml
  modified: []

key-decisions:
  - "check-dist.js pattern used verbatim from PATTERNS.md — no schema drift (unlike Plan 01 Biome issue)"
  - "release.yml uses npx chrome-webstore-upload-cli (already in devDependencies from Plan 01)"
  - "EXTENSION_ID stored as vars (not secrets) — it is public on the CWS store page"
  - "Safety checks repeated in release.yml — tags can be pushed without a branch build having run"

requirements-completed:
  - FOUND-04
  - FOUND-05

# Metrics
duration: 2min
completed: 2026-06-16
---

# Phase 1 Plan 03: CI Safety Script and GitHub Actions Workflows Summary

**MV3 safety audit script and GitHub Actions CI/release pipeline created — `npm run ci:check-dist` exits 0 on clean build and exits 1 on eval/localhost/bad-permissions/default_popup violations; both workflows wire lint+typecheck+build+safety**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-16T17:04:21Z
- **Completed:** 2026-06-16T17:06:26Z
- **Tasks:** 2 of 3 automated (1 checkpoint awaiting human verification)
- **Files created:** 3

## Accomplishments

- `scripts/check-dist.js` created as a Node ES module with `node:` prefix imports; FORBIDDEN_PATTERNS (eval/new Function/unsafe-eval/inline script) and DEV_PATTERNS (localhost/127.0.0.1/vite-hmr/@vite/client/5173) correctly flagged
- Manifest checks: permissions must equal exactly `["storage"]`; `action.default_popup` must be absent
- Positive test: `npm run build && npm run ci:check-dist` exits 0, prints "All dist/ safety checks passed."
- Negative tests verified: eval() → exit 1 (FAIL [MV3 CSP]); localhost → exit 1 (FAIL [dev artifact]); extra permission → exit 1 (FAIL [permissions])
- `.github/workflows/build-check.yml` triggers on push and pull_request to `main`; steps: checkout → setup-node@v4 (Node 22) → npm ci → npm run ci → npm run build → npm run ci:check-dist
- `.github/workflows/release.yml` triggers on `v*.*.*` tag push; same steps + zip dist/ + CWS upload via chrome-webstore-upload-cli; EXTENSION_ID as GitHub variable, OAuth tokens as secrets
- All 28 existing Vitest tests still passing; `npm run ci` (biome + tsc) exits 0

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create scripts/check-dist.js with MV3 safety checks | 5b944cc | scripts/check-dist.js |
| 2 | Create GH Actions CI and release workflows | e97ef40 | .github/workflows/build-check.yml, .github/workflows/release.yml |

## Files Created/Modified

- `scripts/check-dist.js` — Node ES module; FORBIDDEN_PATTERNS + DEV_PATTERNS + manifest permission/popup checks; exits 1 on any violation; exits 0 + prints success on clean build
- `.github/workflows/build-check.yml` — Build & Check workflow; triggers on push/PR to main; Node 22, npm ci, lint+typecheck+build+dist-safety
- `.github/workflows/release.yml` — Release workflow; triggers on v*.*.* tag; same as build-check + zip + chrome-webstore-upload-cli upload using CWS_CLIENT_ID/SECRET/REFRESH_TOKEN secrets and EXTENSION_ID variable

## Decisions Made

- Used the exact pattern from PATTERNS.md verbatim for all three files — no deviations needed
- `vars.EXTENSION_ID` is a GitHub Actions variable (not secret) — EXTENSION_ID is visible in the Chrome Web Store URL, so storing it as a secret provides no security benefit
- Release workflow repeats the full safety check pipeline; does not assume build-check.yml ran (tags can be pushed directly)

## Deviations from Plan

None — plan executed exactly as written. All three files matched PATTERNS.md verbatim. No schema drift, no build errors, no type errors.

## Checkpoint Pending

**Task 3 (checkpoint:human-verify):** Human smoke-test required to verify the extension loads in Chrome and toolbar click behavior works correctly. See checkpoint details below.

This checkpoint verifies the complete Phase 1 scaffold end-to-end (Plans 01-01 + 01-02 + 01-03):
- Extension loads in chrome://extensions/ without errors
- Toolbar click opens a full-page tab showing "Interviewer Checklist"
- Second click focuses the existing tab (dedup behavior from service worker)
- No console errors in DevTools

## Known Stubs

None — this plan creates only a safety script and CI config files. No UI stubs introduced.

## Threat Flags

No new threat surface beyond what was in the threat model. All T-03 mitigations satisfied:
- T-03-01: check-dist.js greps every .js and .html file in dist/ and exits 1 on match; both CI workflows call it
- T-03-02: CWS OAuth credentials stored as GH Actions secrets (${{ secrets.CWS_* }}); EXTENSION_ID as variable (public); never hardcoded in YAML
- T-03-04: .gitignore *.pem protection carried forward from Plan 01

## Self-Check: PASSED

Files verified present:
- scripts/check-dist.js: FOUND
- .github/workflows/build-check.yml: FOUND
- .github/workflows/release.yml: FOUND

Commits verified:
- 5b944cc: feat(01-03): create scripts/check-dist.js MV3 safety audit — FOUND
- e97ef40: feat(01-03): add GH Actions CI and release workflows — FOUND

---
*Phase: 01-foundation-scaffolding*
*Completed: 2026-06-16 (automated tasks); awaiting human-verify checkpoint*
