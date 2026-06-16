---
phase: 01-foundation-scaffolding
plan: 01
subsystem: infra
tags: [vite, react, typescript, biome, vitest, crxjs, tailwindcss, npm, chrome-extension]

# Dependency graph
requires: []
provides:
  - npm project with all Phase 1 dev dependencies installed and locked in package-lock.json
  - package.json with "type":"module" and 11 npm scripts (dev, build, preview, typecheck, lint, format, check, ci, ci:check-dist, test, test:watch)
  - tsconfig.json with Bundler moduleResolution and chrome/vite/client types
  - tsconfig.node.json for Vite/script node context
  - biome.json using Biome 2.5.0 schema with single-quote JS, Tailwind CSS parsing, VCS integration
  - vitest.config.ts with happy-dom environment, globals, setupFiles, passWithNoTests
  - src/test/setup.ts importing @testing-library/jest-dom/vitest
  - .nvmrc pinning Node 22
  - .gitignore protecting dist/, node_modules/, secrets, and key.pem
affects:
  - 01-02
  - 01-03
  - all subsequent phases that build on the scaffold

# Tech tracking
tech-stack:
  added:
    - react@19.2.7
    - react-dom@19.2.7
    - vite@8.x (Rolldown-based)
    - "@vitejs/plugin-react-swc"
    - "@crxjs/vite-plugin@2.6"
    - "typescript@6.0"
    - "@types/react, @types/react-dom, @types/chrome"
    - "vitest@4.x"
    - "@testing-library/react, @testing-library/jest-dom"
    - happy-dom
    - "@biomejs/biome@2.5.0 (--save-exact)"
    - chrome-webstore-upload-cli
    - "@tailwindcss/vite, tailwindcss@4.x"
  patterns:
    - biome.json replaces ESLint+Prettier with single tool (Biome 2.5.0 schema)
    - tsconfig with moduleResolution:Bundler for Vite + Chrome extension TS compatibility
    - vitest.config.ts separate from vite.config.ts for clarity
    - src/test/setup.ts uses /vitest entry point (not root jest-dom import) to avoid @types/jest dependency

key-files:
  created:
    - package.json
    - package-lock.json
    - .nvmrc
    - .gitignore
    - tsconfig.json
    - tsconfig.node.json
    - biome.json
    - vitest.config.ts
    - src/test/setup.ts
  modified: []

key-decisions:
  - "Biome 2.5.0 schema changed from PATTERNS.md: files.ignore removed, organizeImports moved to assist.actions.source, linter.rules.recommended deprecated in favor of preset"
  - "src/test/setup.ts uses @testing-library/jest-dom/vitest (not root import) to avoid @types/jest TS errors with Vitest globals"
  - "vitest.config.ts adds passWithNoTests:true so npm test exits 0 when no test files exist yet"

patterns-established:
  - "Pattern: Biome 2.5.0 config uses assist.actions.source.organizeImports (not top-level organizeImports)"
  - "Pattern: jest-dom is imported via @testing-library/jest-dom/vitest in setup file for Vitest compatibility"
  - "Pattern: npm run ci = biome ci src/ && tsc --noEmit (two-step quality gate)"

requirements-completed:
  - FOUND-01

# Metrics
duration: 18min
completed: 2026-06-16
---

# Phase 1 Plan 01: Initialize Project Scaffold Summary

**npm project bootstrapped with React 19, Vite 8, CRXJS 2.6, TypeScript 6, Biome 2.5.0, Vitest 4, and Tailwind 4 — all dependencies installed and quality pipeline (biome ci + tsc --noEmit + vitest) passing**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- All Phase 1 npm packages installed and locked in package-lock.json (react@19, vite@8, @crxjs/vite-plugin@2.6, typescript@6, biome@2.5.0, vitest@4, testing-library, tailwindcss@4)
- TypeScript configured with Bundler module resolution and chrome.* + vite/client globals visible
- Biome 2.5.0 config (corrected for actual 2.5.0 schema vs PATTERNS.md which used 2.3 structure)
- `npm run ci` exits 0 (biome ci + tsc --noEmit); `npm test` exits 0 (Vitest with passWithNoTests)
- Security: .gitignore protects key.pem; @biomejs/biome pinned with --save-exact (no ^ prefix)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize package.json, install dependencies, and create project-level configs** - `701d114` (chore)
2. **Task 2: Create TypeScript configs, Biome config, Vitest config, and test setup file** - `7ee0dd5` (chore)

## Files Created/Modified

- `package.json` - Project manifest with "type":"module", 11 npm scripts, all Phase 1 deps; @biomejs/biome pinned at 2.5.0 (no ^)
- `package-lock.json` - Lockfile pinning all resolved dep versions
- `.nvmrc` - Node 22 pin
- `.gitignore` - Protects dist/, node_modules/, .env*, .DS_Store, .vscode/, .idea/, *.pem, key.pem
- `tsconfig.json` - Bundler moduleResolution, types:["chrome","vite/client"], strict, noEmit, jsx:react-jsx
- `tsconfig.node.json` - Covers vite.config.ts, vitest.config.ts, scripts/ in Node context
- `biome.json` - Biome 2.5.0 schema; space indent, LF, single-quote JS, Tailwind CSS directives, VCS integration, assist.organizeImports
- `vitest.config.ts` - happy-dom environment, globals:true, setupFiles:["./src/test/setup.ts"], passWithNoTests:true
- `src/test/setup.ts` - Imports @testing-library/jest-dom/vitest (vitest-compatible entry point)

## Decisions Made

- Used `@testing-library/jest-dom/vitest` import entry point (not root import) to avoid TypeScript errors when `@types/jest` is not installed; the root `jest.d.ts` references Jest globals not present in Vitest
- Added `passWithNoTests: true` to vitest.config.ts so `npm test` exits 0 until real test files are added in later tasks
- Biome 2.5.0 schema differs from PATTERNS.md (written against 2.3): fixed schema automatically

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed biome.json for Biome 2.5.0 actual schema**
- **Found during:** Task 2 (Create TypeScript configs, Biome config, Vitest config, and test setup file)
- **Issue:** PATTERNS.md biome.json pattern used `files.ignore` (removed in 2.5.0), `organizeImports` as top-level key (moved to `assist.actions.source`), and `linter.rules.recommended` (deprecated; now `linter.rules.preset`). Biome 2.5.0 rejected the config with deserialization errors.
- **Fix:** Generated canonical biome.json via `npx @biomejs/biome init`, then applied project-specific settings (space indent, single-quote JS, Tailwind CSS directives, LF line endings) using the correct 2.5.0 key paths.
- **Files modified:** biome.json
- **Verification:** `npm run ci` (biome ci src/) exits 0
- **Committed in:** 7ee0dd5 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed src/test/setup.ts to use vitest-compatible jest-dom entry**
- **Found during:** Task 2 (after biome fix, during npm run ci)
- **Issue:** `import '@testing-library/jest-dom'` causes TypeScript error `Cannot find type definition file for 'jest'` because the root entry's `jest.d.ts` references `@types/jest` which is not installed (we use Vitest, not Jest).
- **Fix:** Changed import to `import '@testing-library/jest-dom/vitest'` which uses `vitest.d.ts` — the Vitest-compatible type declarations.
- **Files modified:** src/test/setup.ts
- **Verification:** `tsc --noEmit` exits 0 with no errors
- **Committed in:** 7ee0dd5 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Added passWithNoTests:true to vitest.config.ts**
- **Found during:** Task 2 (during npm test verification)
- **Issue:** Vitest exits code 1 when no test files are found; plan states "npm test exits 0 (Vitest finds no test files yet but does not error on the empty run)". Without `passWithNoTests`, the acceptance criterion cannot be met.
- **Fix:** Added `passWithNoTests: true` to vitest.config.ts test config.
- **Files modified:** vitest.config.ts
- **Verification:** `npm test` exits 0 with "No test files found, exiting with code 0"
- **Committed in:** 7ee0dd5 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. The PATTERNS.md patterns were written against Biome 2.3; installed version is 2.5.0 with breaking schema changes. No scope creep.

## Issues Encountered

- Biome 2.5.0 has breaking schema changes from 2.3 (documented as deviations above). The RESEARCH.md and PATTERNS.md reference Biome "2.3+" but specify patterns that were already superseded by 2.5.0.

## User Setup Required

None — no external service configuration required.

## Threat Flags

No new threat surface beyond what was planned. .gitignore correctly excludes *.pem and key.pem (T-01-02 mitigated). @biomejs/biome pinned with --save-exact at 2.5.0 (T-01-03 mitigated). All packages were pre-approved in RESEARCH.md Package Legitimacy Audit.

## Next Phase Readiness

- node_modules/ populated; package-lock.json committed
- TypeScript, Biome, and Vitest pipelines all pass (`npm run ci && npm test` exits 0)
- chrome.* types are resolvable; ready for background service worker in Phase 1 Plan 02
- Plans 01-02 and 01-03 can proceed: they depend on node_modules and configs established here

---
*Phase: 01-foundation-scaffolding*
*Completed: 2026-06-16*
