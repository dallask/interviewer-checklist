---
phase: 03-storage-layer-migration-bootstrap
plan: 02
subsystem: storage
tags: [storage, chrome-extension, tdd, vitest-chrome, debounce, quota, snapshot]

requires:
  - phase: 03-storage-layer-migration-bootstrap
    plan: 01
    provides: "V2Session, V2Manifest types in src/storage/types.ts; vitest-chrome global installed; chrome.storage mocks available in tests"

provides:
  - "StorageAdapter class with read(), write(), flushPending(), snapshot() public methods"
  - "storageAdapter singleton exported from src/storage/adapter.ts"
  - "300ms debounced writes with dirty-flag guard and coalescing via #pendingData merge"
  - "Synchronous fire-and-forget flushPending() for pagehide/visibilitychange handlers"
  - "#checkQuota dispatches storage-quota-warning CustomEvent at 80% of 10MB"
  - "#trimSnapshots uses get(null) + prefix filter for FIFO trim to 3 snapshots"
  - "16 unit tests covering STORE-01, STORE-04, STORE-05, STORE-06 behaviors"

affects:
  - 03-storage-layer-migration-bootstrap (plan 03: bootstrap.ts imports storageAdapter)
  - 04-zustand-stores (Zustand stores call storageAdapter.write() on state change)
  - 03-storage-layer-migration-bootstrap (plan 03: lifecycle.ts calls storageAdapter.flushPending())

tech-stack:
  added: []
  patterns:
    - "vitest-chrome named import pattern: import { chrome } from 'vitest-chrome' (NOT * as chrome which nests chrome.chrome)"
    - "require.resolve() in vitest.config.ts for worktree-safe node_modules alias resolution"
    - "Native private class fields (#dirty, #pendingData, #debounceTimer) for StorageAdapter state"
    - "Fire-and-forget async pattern: void this.#flush() — synchronous initiation, no await"
    - "get(null) + Object.keys() filter pattern for FIFO trim without getKeys() dependency"

key-files:
  created:
    - "src/storage/adapter.ts"
    - "src/storage/adapter.test.ts"
  modified:
    - "src/test/setup.ts"
    - "vitest.config.ts"

key-decisions:
  - "flushPending() is synchronous (void this.#flush() not await this.#flush()) — fire-and-forget required for pagehide handlers where async completion is not guaranteed"
  - "#trimSnapshots uses chrome.storage.local.get(null) not getKeys() — getKeys() is Chrome 117+ only and absent from @types/chrome 0.1.43"
  - "setup.ts import { chrome } not * as chrome — namespace import creates nested chrome.chrome which makes chrome.storage undefined as a global"
  - "vitest.config.ts uses require.resolve() not path.resolve() for worktree-safe ESM alias"

requirements-completed:
  - STORE-01
  - STORE-04
  - STORE-05
  - STORE-06

duration: 35min
completed: 2026-06-17
---

# Phase 03, Plan 02: StorageAdapter class — debounce, quota, snapshot (TDD) Summary

**StorageAdapter class with 300ms debounced writes, synchronous flushPending, getBytesInUse quota warning, and FIFO snapshot trim — all via chrome.storage.local.get(null) without getKeys()**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-17T08:08:00Z
- **Completed:** 2026-06-17T08:21:00Z
- **Tasks:** 1 (TDD: RED → GREEN → REFACTOR)
- **Files modified:** 4 (adapter.ts created, adapter.test.ts created, setup.ts fixed, vitest.config.ts fixed)

## Accomplishments

- Implemented StorageAdapter class with all four requirement areas: read/write with error handling (STORE-01), 300ms debounce + dirty flag + synchronous flushPending (STORE-04), snapshot + FIFO trim to 3 via get(null) prefix scan (STORE-05), getBytesInUse quota warning CustomEvent at 80% (STORE-06)
- 16 adapter unit tests covering all behaviors in the plan's `<behavior>` block — all passing
- Full test suite: 94 tests pass (78 pre-existing + 16 new)
- npm run ci: Biome clean, tsc --noEmit clean

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Failing StorageAdapter tests | `83331b1` | src/storage/adapter.test.ts |
| GREEN | StorageAdapter implementation + deviations | `3ecfbc0` | src/storage/adapter.ts, src/test/setup.ts, vitest.config.ts |

_TDD gate compliance: RED commit (83331b1) precedes GREEN commit (3ecfbc0) — confirmed._

## Files Created/Modified

- `src/storage/adapter.ts` — StorageAdapter class (138 lines); constants QUOTA_WARNING_THRESHOLD, QUOTA_BYTES, DEBOUNCE_MS; native private fields; storageAdapter singleton export
- `src/storage/adapter.test.ts` — 16 tests in 5 describe blocks covering all public methods (451 lines); vi.useFakeTimers for debounce; chrome mock implementations per describe
- `src/test/setup.ts` — Fixed: `import { chrome }` (named) instead of `import * as chrome` (namespace)
- `vitest.config.ts` — Fixed: `require.resolve()` instead of `path.resolve()` for worktree-safe alias

## Decisions Made

- **flushPending() is synchronous fire-and-forget:** `void this.#flush()` not `await this.#flush()`. Chrome extension pagehide handlers cannot guarantee Promise resolution before teardown. Synchronous initiation maximizes the chance that chrome.storage.local.set() completes.
- **#trimSnapshots uses get(null):** avoids `chrome.storage.local.getKeys()` which is Chrome 117+ only and typed in @types/chrome 0.1.43 as absent. `get(null)` returns all stored items as Record<string, unknown>; Object.keys() + startsWith(prefix) filter is universally compatible.
- **#flush re-dirties on set() failure:** captures `data` before clearing state; on catch, merges captured data back with any new pending writes via `{ ...data, ...(this.#pendingData ?? {}) }`. This ensures no data loss on transient storage errors.
- **getBytesInUse(null) in #checkQuota:** calls with `null` to get total bytes for all extension storage, not just specific keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest-chrome namespace import creates nested chrome.chrome global**
- **Found during:** GREEN phase — all tests failing with "Cannot read properties of undefined (reading 'local')" inside adapter.ts
- **Issue:** `src/test/setup.ts` used `import * as chrome from 'vitest-chrome'`. The module namespace object is `{ chrome: <Proxy> }`. `Object.assign(globalThis, { chrome })` then sets `globalThis.chrome = { chrome: <Proxy> }` — a nested object. So the adapter's global `chrome` reference has `.storage === undefined`.
- **Fix:** Changed to `import { chrome } from 'vitest-chrome'` (named import of the actual Proxy). Now `globalThis.chrome` is the Proxy with `.storage.local` properly accessible.
- **Files modified:** `src/test/setup.ts`
- **Verification:** All 16 adapter tests pass; full suite 94/94
- **Committed in:** 3ecfbc0 (GREEN gate)

**2. [Rule 1 - Bug] vitest.config.ts path.resolve() uses wrong node_modules in git worktree**
- **Found during:** GREEN phase — initial test run failed with "Failed to resolve import 'vitest-chrome'"
- **Issue:** `path.resolve('node_modules/vitest-chrome/lib/index.esm.js')` resolves relative to cwd. In a git worktree, cwd is the worktree directory which has an empty `node_modules/`. The actual packages are in the main repo root's `node_modules/`.
- **Fix:** Changed to `require.resolve('vitest-chrome/lib/index.esm.js')` using `createRequire(import.meta.url)`. Node's require.resolve follows the standard module resolution algorithm which correctly finds the package in the nearest ancestor `node_modules/`.
- **Files modified:** `vitest.config.ts`
- **Verification:** vitest-chrome resolves to `/Users/dallask/Projects/dallask/interviewer-checklist/node_modules/vitest-chrome/lib/index.esm.js`
- **Committed in:** 3ecfbc0 (GREEN gate)

**3. [Rule 1 - Bug] TypeScript error: spreading null type**
- **Found during:** GREEN phase — `npm run ci` (tsc --noEmit)
- **Issue:** `this.#pendingData = { ...data, ...this.#pendingData }` — `this.#pendingData` is `Record<string, unknown> | null`; spreading null is a TS error (TS2698)
- **Fix:** `this.#pendingData = { ...data, ...(this.#pendingData ?? {}) }`
- **Files modified:** `src/storage/adapter.ts`
- **Committed in:** 3ecfbc0 (GREEN gate)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs discovered during GREEN phase)
**Impact on plan:** All fixes required to achieve GREEN gate. No scope creep.

## TDD Gate Compliance

- RED gate commit: `83331b1` — `test(03-02): add failing StorageAdapter tests (TDD RED)` — tests failed with "Failed to resolve import './adapter.js'" (expected: adapter.ts did not exist yet)
- GREEN gate commit: `3ecfbc0` — `feat(03-02): implement StorageAdapter class (TDD GREEN)` — all 16 tests pass
- REFACTOR: no code changes needed; code was clean after Biome auto-fix in GREEN

## Known Stubs

None — all methods are fully implemented with real chrome.storage.local calls and proper error handling.

## Threat Flags

No new security-relevant surface beyond what is in the plan's threat model (T-03-02-01 through T-03-02-SC). All mitigations are implemented:
- T-03-02-02 (quota exhaustion): #checkQuota dispatches storage-quota-warning at 80% (IMPLEMENTED)
- T-03-02-03 (snapshot accumulation): #trimSnapshots FIFO trim to 3 (IMPLEMENTED)
- T-03-02-04 (data loss on tab close): fire-and-forget flushPending (ACCEPTED — Chrome limitation)
- T-03-02-05 (race between write and snapshot): snapshot uses chrome.storage.local.set directly, not write() (IMPLEMENTED)

## Self-Check

Files exist:
- src/storage/adapter.ts: FOUND
- src/storage/adapter.test.ts: FOUND

Commits in git log:
- 83331b1: FOUND (RED)
- 3ecfbc0: FOUND (GREEN)

## Next Phase Readiness

- Plan 03-03 (bootstrap.ts) can import `storageAdapter` from `src/storage/adapter.js`
- Plan 03-03 (lifecycle.ts) can call `storageAdapter.flushPending()` from page lifecycle handlers
- Phase 4 Zustand stores can call `storageAdapter.write(state)` on state change subscriptions
- Phase 5 Reset-all can call `storageAdapter.snapshot(sessionId)` before executing reset
- Phase 7 YAML import can call `storageAdapter.snapshot(sessionId)` before import applies

---
*Phase: 03-storage-layer-migration-bootstrap*
*Completed: 2026-06-17*
