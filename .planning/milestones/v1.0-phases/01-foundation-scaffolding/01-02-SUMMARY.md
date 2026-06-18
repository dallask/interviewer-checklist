---
phase: 01-foundation-scaffolding
plan: 02
subsystem: infra
tags: [manifest, vite, crxjs, react, service-worker, icons, vitest, tdd]

# Dependency graph
requires:
  - 01-01 (npm project, tsconfig, biome, vitest scaffold)
provides:
  - manifest.json: Chrome MV3 manifest with permissions ["storage"] only, no default_popup
  - vite.config.ts: CRXJS + React SWC + Tailwind v4, sourcemap hidden
  - src/app/app.html: HTML5 CRXJS entry with <div id="root"> and module script
  - src/app/main.tsx: React 19 root mount with throw-on-null guard
  - src/app/App.tsx: Phase 1 placeholder component (named export)
  - src/background/index.ts: Stateless MV3 service worker, 12 LOC, tab dedup
  - src/background/index.test.ts: 6 structural smoke tests for SW constraints
  - src/test/manifest.test.ts: 22 tests verifying manifest/vite/scaffold structure
  - public/icons/: 4 minimal valid PNG placeholders (16, 32, 48, 128)
  - dist/ production build artifact
affects:
  - 01-03 (CI workflows will read dist/ and manifest.json produced here)
  - all subsequent phases (react app scaffold is the base for all feature work)

# Tech tracking
tech-stack:
  added:
    - CRXJS vite-plugin (manifest.json as Vite entry, auto-rewrites hashes)
    - Tailwind v4 via @tailwindcss/vite plugin
    - React 19 app scaffold (StrictMode, createRoot)
  patterns:
    - MV3 service worker pattern: chrome.action.onClicked → tab dedup → chrome.tabs.create
    - Stateless SW: no module-level let/const; only addListener at module scope
    - TDD structural test: readFileSync source as string, make assertions without running chrome.* APIs
    - vite.config.ts: plugins ordered as [react(), tailwindcss(), crx({ manifest })]
    - tsconfig.json types includes "node" for Node.js APIs in test files

key-files:
  created:
    - manifest.json
    - vite.config.ts
    - src/app/app.html
    - src/app/main.tsx
    - src/app/App.tsx
    - src/background/index.ts
    - src/background/index.test.ts
    - src/test/manifest.test.ts
    - public/icons/icon-16.png
    - public/icons/icon-32.png
    - public/icons/icon-48.png
    - public/icons/icon-128.png
  modified:
    - tsconfig.json (added "node" to types array)

key-decisions:
  - "SW stub created in Task 1 to unblock build (Rule 3), replaced by full implementation in Task 2"
  - "tsconfig.json types array extended with node to resolve node:fs/path/url in test files"
  - "SW line count: 12 LOC (well under 30 LOC constraint) — uses pattern verbatim from PATTERNS.md"
  - "PNG icons: minimal 1x1 transparent PNG bytes (valid format, placeholder for Phase 9 polish)"
  - "Test approach for SW: readFileSync source text + string assertions (no chrome.* runtime needed)"

requirements-completed:
  - FOUND-02
  - FOUND-03

# Metrics
duration: 4min
completed: 2026-06-16
---

# Phase 1 Plan 02: Extension Manifest, Vite Config, React Scaffold, Service Worker Summary

**Chrome MV3 extension artifact created: manifest.json with storage-only permissions, CRXJS+React+Tailwind Vite config, React 19 app scaffold, 12-LOC stateless service worker with tab dedup, and 28 passing structural tests**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-16T16:57:22Z
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified/created:** 13

## Accomplishments

- manifest.json created with exactly `permissions: ["storage"]`, no default_popup, no host_permissions, background.type "module" — all threat model mitigations satisfied
- vite.config.ts with CRXJS plugin, React SWC, Tailwind v4, and `sourcemap: 'hidden'` (MV3 CSP safe)
- src/app/app.html with no inline scripts (MV3 CSP compliant); src/app/main.tsx with throw-on-null root guard; src/app/App.tsx with named export
- src/background/index.ts: 12 LOC stateless SW — `chrome.action.onClicked` → `chrome.tabs.query` dedup → focus existing or `chrome.tabs.create`
- 28 Vitest tests passing: 22 testing manifest/vite/scaffold structure, 6 testing SW structural constraints
- `npm run build` exits 0, producing dist/manifest.json with correct permissions
- `npm test` exits 0; `npm run ci` exits 0 (Biome + tsc)
- All STRIDE threat mitigations verified: T-02-01 (permissions), T-02-02 (no popup), T-02-03 (sourcemap hidden), T-02-04 (no module state), T-02-05 (no inline scripts)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create manifest, Vite config, React scaffold, icon placeholders | ba7daad | manifest.json, vite.config.ts, src/app/*, public/icons/*, src/test/manifest.test.ts, tsconfig.json |
| 2 | Implement service worker and smoke tests | d7936ae | src/background/index.ts, src/background/index.test.ts |

## Files Created/Modified

- `manifest.json` — Chrome MV3 manifest; permissions: ["storage"]; no default_popup; background.type: "module"
- `vite.config.ts` — CRXJS + React SWC + Tailwind, sourcemap: 'hidden', outDir: 'dist'
- `src/app/app.html` — HTML5 entry; `<div id="root">`; `<script type="module" src="./main.tsx">`; no inline scripts
- `src/app/main.tsx` — React 19 createRoot with `throw new Error('Root element not found')` null guard
- `src/app/App.tsx` — Named export `export function App()`, Phase 1 placeholder content
- `src/background/index.ts` — 12 LOC stateless service worker; onClicked → tabs.query dedup → tabs.create
- `src/background/index.test.ts` — 6 smoke tests: onClicked present, tabs.query present, no onInstalled, ≤30 lines, no module-level let/const
- `src/test/manifest.test.ts` — 22 tests: manifest structure, vite config, app scaffold files, icon files
- `public/icons/icon-{16,32,48,128}.png` — Minimal valid 1x1 transparent PNG placeholders
- `tsconfig.json` — Added "node" to types array (supports node:fs/path/url in test files)

## Decisions Made

- Created a minimal SW stub in Task 1 to unblock the build (Rule 3 auto-fix), then replaced it with the full implementation in Task 2 — this is the correct TDD sequence when the build references a file that doesn't exist yet
- Extended tsconfig.json `types` array with `"node"` so test files using `readFileSync` / `join` / `fileURLToPath` typecheck cleanly — `@types/node` was already installed transitively via Vitest
- PNG icons use the minimal valid 1×1 transparent PNG binary format — sufficient for Phase 1; real icons are a Phase 9 polish item
- SW test strategy: read source file as text and assert string patterns rather than trying to run chrome.* APIs in happy-dom (which doesn't implement them)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created minimal SW stub in Task 1 to unblock build**
- **Found during:** Task 1 (after creating manifest.json which references src/background/index.ts)
- **Issue:** `npm run build` failed with `[UNRESOLVED_ENTRY] Cannot resolve entry module src/background/index.ts` — manifest.json's `background.service_worker` field references the file before Task 2 creates it
- **Fix:** Created a 4-line minimal stub `src/background/index.ts` so Task 1's build verification could proceed; Task 2 replaced it with the full implementation
- **Files modified:** src/background/index.ts (stub → full implementation)
- **Commit:** ba7daad (stub created alongside Task 1), d7936ae (full implementation)

**2. [Rule 3 - Blocking] Added "node" to tsconfig.json types array**
- **Found during:** Task 1 (after Biome auto-fixed imports, during `npm run ci` tsc step)
- **Issue:** `tsc --noEmit` failed with `Cannot find name 'node:fs'` — test file uses Node APIs but tsconfig `types` only listed `["chrome", "vite/client"]`; `@types/node` was installed (transitively via Vitest) but not referenced in tsconfig
- **Fix:** Added `"node"` to the `types` array in tsconfig.json
- **Files modified:** tsconfig.json
- **Commit:** ba7daad

**3. [Rule 1 - Bug] Biome auto-fixed import ordering in manifest.test.ts**
- **Found during:** Task 1 (during `npm run ci` biome step)
- **Issue:** Import declarations in `src/test/manifest.test.ts` were not in alphabetical order (Biome's organize-imports rule)
- **Fix:** Ran `npx @biomejs/biome check --write src/` to auto-fix import ordering
- **Files modified:** src/test/manifest.test.ts (import order)
- **Commit:** ba7daad

## TDD Gate Compliance

Task 1 (manifest/scaffold files):
- RED: `src/test/manifest.test.ts` written first; 22 tests failed because files didn't exist
- GREEN: All source files created; 22 tests passed

Task 2 (service worker):
- RED: `src/background/index.test.ts` written first; 1 test failed (`chrome.tabs.query` missing from stub)
- GREEN: Full `src/background/index.ts` written; all 6 tests passed; total 28/28 tests passing

## Known Stubs

- `src/app/App.tsx` — Phase 1 placeholder returning "Interviewer Checklist" h1 + "Phase 1 scaffold" paragraph. This is intentional — feature UI begins in Phase 2+. The stub is noted in the component itself.
- `public/icons/icon-{16,32,48,128}.png` — 1×1 transparent PNG placeholders. Intentional — real icons are a Phase 9 polish item per PROJECT.md.

## Threat Flags

No new threat surface beyond what was planned. All STRIDE threats mitigated:
- T-02-01: permissions ["storage"] only — verified in dist/manifest.json
- T-02-02: no default_popup — verified in manifest.json source and dist/manifest.json
- T-02-03: sourcemap 'hidden' — present in vite.config.ts
- T-02-04: no module-level state in SW — verified by Vitest test
- T-02-05: no inline scripts in app.html — verified by Vitest test

## Self-Check: PASSED

Files verified present:
- manifest.json: FOUND
- vite.config.ts: FOUND
- src/app/app.html: FOUND
- src/app/main.tsx: FOUND
- src/app/App.tsx: FOUND
- src/background/index.ts: FOUND
- src/background/index.test.ts: FOUND
- src/test/manifest.test.ts: FOUND
- public/icons/icon-16.png: FOUND
- public/icons/icon-32.png: FOUND
- public/icons/icon-48.png: FOUND
- public/icons/icon-128.png: FOUND

Commits verified:
- ba7daad: feat(01-02): create extension manifest, Vite config, React scaffold, and icon placeholders — FOUND
- d7936ae: feat(01-02): implement stateless MV3 service worker with tab dedup and smoke tests — FOUND

---
*Phase: 01-foundation-scaffolding*
*Completed: 2026-06-16*
