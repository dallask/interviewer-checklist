# Phase 3: Storage Layer, Migration & Bootstrap - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

All state safely survives tab close, version upgrades, and session switches, with no possibility of silent data loss. This phase delivers: chrome.storage.local adapter, schema migration pipeline, bootstrap() orchestration, Zustand integration with debounced writes + synchronous flush, auto-snapshot before destructive ops, and storage quota guard. No UI components are built here — only the persistence layer consumed by Phase 4+.

</domain>

<decisions>
## Implementation Decisions

### Storage Adapter & Zustand Integration
- **chrome.storage.local mocking:** use `vitest-chrome` npm package — typed mock, drops into Vitest with full storage API
- **Zustand wiring:** custom `StorageAdapter` class wrapping `chrome.storage.local` — not Zustand persist middleware; more control over debounce and flush behavior
- **Debounce ownership:** 300ms trailing debounce + synchronous `flushPending()` live inside `StorageAdapter` — single owner for all write timing
- **Quota check:** async `getBytesInUse()` before each write; if usage exceeds configurable threshold, dispatch a `storage-quota-warning` custom event (UI toast in Phase 4)

### Migration Pipeline Architecture
- **Schema versions:** v1 (legacy localStorage flat format from prototype) → v2 (chrome.storage sharded format with `manifest` + `session:<id>` keys) initially; additional versions added as later phases introduce new fields
- **Migration failure:** preserve original payload under `recovery:<timestamp>` key in chrome.storage.local, log error to console, bootstrap with empty/default state — never block the app
- **Migration functions:** pure functions — `(prev: V1Schema) => V2Schema` — each tested with a frozen input fixture; no mutations
- **bootstrap() location:** `src/storage/bootstrap.ts` — exported async function called in `src/app/main.tsx` before `createRoot`; awaited to completion before mounting

### Auto-Snapshot & Flush
- **Snapshot trigger:** before any Reset-all operation or YAML import (destructive ops) — synchronous call to `snapshot()` before applying the operation
- **Snapshot key scheme:** `snapshot:<sessionId>:<timestamp>` with rolling FIFO trim to last 3 snapshots; trim runs after each snapshot write
- **Flush events:** `visibilitychange === 'hidden'` + `pagehide` — both registered in `src/storage/lifecycle.ts` which calls `StorageAdapter.flushPending()`
- **Dirty flag:** `StorageAdapter` tracks dirty state internally; `flushPending()` is a no-op when clean — prevents double-flush on rapid tab hide/restore

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scoring/index.ts` — barrel pattern to follow for `src/storage/index.ts`
- `src/app/main.tsx` — `bootstrap()` will be awaited here before `createRoot(rootEl)`
- `vitest.config.ts` — `setupFiles: ['src/test/setup.ts']` already configured; add vitest-chrome setup there
- `src/test/setup.ts` — existing Vitest setup to extend with vitest-chrome mock install

### Established Patterns
- TypeScript strict mode, `.js` extensions on all relative imports
- Pure functions + unit tests in co-located `*.test.ts` files
- Named exports only (no default exports) per existing bank/scorer pattern
- Biome 2.5.0 for lint/format

### Integration Points
- Phase 4+ Zustand stores import `StorageAdapter` from `src/storage/index.ts`
- Phase 5 Reset-all calls `StorageAdapter.snapshot()` before executing reset
- Phase 7 YAML import calls `StorageAdapter.snapshot()` before import applies
- `src/app/main.tsx` awaits `bootstrap()` before `createRoot`

</code_context>

<specifics>
## Specific Ideas

- Sharded keys: `manifest` key holds session IDs + metadata; `session:<id>` holds full session state — matches STORE-01 exactly
- The prototype uses `localStorage` with `STORE_KEY = 'checklist_state'` — v1 schema is that flat JSON blob
- `chrome.storage.local` has a 5MB default quota per extension (10MB with `unlimitedStorage` permission — we don't request that)
- Use `chrome.runtime.lastError` check pattern after every storage operation — STORE-01 requirement
- 300ms debounce matches the prototype's `setTimeout(saveState, 300)` exactly

</specifics>

<deferred>
## Deferred Ideas

- Additional schema versions beyond v2 are deferred to the phases that introduce new fields (Phase 5 adds custom questions field, Phase 6 adds session slots v3, etc.)
- `chrome.storage.sync` cross-instance sync — explicitly out of scope per PROJECT.md
- Cloud backup / export-on-snapshot — deferred; YAML export in Phase 7 covers portability

</deferred>
