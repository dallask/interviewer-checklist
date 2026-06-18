---
phase: 06-multiple-named-sessions-switcher
plan: "01"
subsystem: store
tags: [zustand, session-management, tdd, storage, manifest]
dependency_graph:
  requires: []
  provides:
    - UndoBuffer interface (exported from src/store/app.ts)
    - manifest state field (V2Manifest | null)
    - undoBuffer state field (UndoBuffer | null)
    - createSession action
    - renameSession action
    - duplicateSession action
    - deleteSession action
    - switchSession action (SESS-04 flush-before-switch)
    - undoDeleteSession action
    - setManifest action
    - setUndoBuffer action
  affects:
    - src/store/app.ts (extended)
    - src/store/app.test.ts (extended with 23 new tests)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle
    - Zustand store extension with session management actions
    - flushPending-before-switch pattern (SESS-04)
    - In-memory undo buffer (never persisted)
    - nextSessionName auto-number helper
key_files:
  created: []
  modified:
    - src/store/app.ts
    - src/store/app.test.ts
decisions:
  - switchSession calls storageAdapter.flushPending() synchronously BEFORE any set() (SESS-04)
  - All per-session fields + activeSessionId updated in ONE set() call to prevent race (Pitfall 2)
  - deleteSession captures undoBuffer BEFORE chrome.storage.local.remove (T-06-01-02)
  - createSession computes name via nextSessionName helper using highest existing N + 1
  - duplicateSession reads from storage by sessionId (not Zustand state) to support non-active duplication
  - subscribe callback extended to write manifest on every state change when manifest is non-null (Pitfall 6 guard)
  - undoDeleteSession re-writes session data via storageAdapter.write and re-inserts SessionMeta into manifest
metrics:
  duration: "~10 minutes"
  completed: "2026-06-17"
  tasks_completed: 2
  files_created: 0
  files_modified: 2
---

# Phase 06 Plan 01: Session Store Actions Summary

**One-liner:** Zustand store extended with manifest/undoBuffer state and six session management actions (createSession, renameSession, duplicateSession, deleteSession, switchSession, undoDeleteSession) with TDD coverage for SESS-01 and SESS-04.

## What Was Built

Extended `src/store/app.ts` to deliver the behavioral contract for multi-session management:

1. **UndoBuffer interface** — exported type `{ sessionMeta, sessionData, wasActive }` for in-memory delete undo
2. **AppState additions** — `manifest: V2Manifest | null` and `undoBuffer: UndoBuffer | null`
3. **AppActions additions** — eight new action signatures (six async + two sync setters)
4. **DEFAULT_STATE additions** — `manifest: null, undoBuffer: null`
5. **New imports** — `V2Manifest`, `V3Session` (type import), `createDefaultV3Session` from `../storage/types.js`
6. **Session actions implementation**:
   - `switchSession` — flushPending() FIRST, read session data, single set() with all per-session fields + activeSessionId + manifest.activeSessionId (SESS-04 compliant)
   - `deleteSession` — reads undo buffer from storage BEFORE chrome.storage.local.remove; auto-switches to most-recently-updated remaining session; starts 10s timeout for undoBuffer auto-clear
   - `createSession` — nextSessionName helper for auto-numbering, writes session to storage, switches to new session
   - `duplicateSession` — reads from storage by sessionId (not Zustand state), creates "{original} (copy)" session
   - `renameSession` — updates matching SessionMeta.name + updatedAt in manifest
   - `undoDeleteSession` — re-writes session data, re-inserts SessionMeta, switches back if wasActive
   - `setManifest` / `setUndoBuffer` — simple setters
7. **Subscribe callback extended** — adds `storageAdapter.write({ manifest: state.manifest })` guarded by `if (state.manifest)` (Pitfall 6 guard)

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | 4b9b44f | `test(06-01): add failing session action tests` — 23 new tests fail, 40 existing pass |
| GREEN | 7ae4a47 | `feat(06-01): implement session management actions` — all 63 tests pass |

## Tasks Completed

| Task | Type | Commit | Status |
|------|------|--------|--------|
| Task 1: RED — Write failing tests for session store actions | tdd (RED) | 4b9b44f | DONE |
| Task 2: GREEN — Implement session store actions to pass all tests | tdd (GREEN) | 7ae4a47 | DONE |

## Verification Results

- `npx vitest run src/store/app.test.ts` — 63 tests pass (40 pre-existing + 23 new)
- `npm test` — 691 tests pass across 48 test files
- `npx tsc --noEmit` — exits 0 (no type errors)
- switchSession body: exactly ONE `set({})` call containing activeSessionId alongside all per-session fields
- subscribe callback: `if (state.manifest) { storageAdapter.write({ manifest: state.manifest }); }`

## Deviations from Plan

None — plan executed exactly as written.

The mock update (adding `flushPending: vi.fn()` to the existing storageAdapter mock) was a necessary extension for the RED phase tests to call `storageAdapter.flushPending` as a spy. This was part of the planned test setup described in Task 1.

## Known Stubs

None — no hardcoded empty values or placeholder text that flow to UI rendering. The session actions are fully implemented.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All changes are internal Zustand store actions operating over existing chrome.storage.local API. The threat mitigations listed in the plan's threat model were implemented:

- T-06-01-01 (cross-session write): `storageAdapter.flushPending()` called before any `set()` in switchSession; all per-session fields + activeSessionId in one `set()` call
- T-06-01-02 (deleteSession undo buffer): `storageAdapter.read()` + `set({ undoBuffer })` executed BEFORE `chrome.storage.local.remove()`

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/store/app.ts exists | FOUND |
| src/store/app.test.ts exists | FOUND |
| 06-01-SUMMARY.md exists | FOUND |
| Commit 4b9b44f (RED) exists | FOUND |
| Commit 7ae4a47 (GREEN) exists | FOUND |
| UndoBuffer exported from app.ts | VERIFIED |
| manifest state field in AppState | VERIFIED |
| undoBuffer state field in AppState | VERIFIED |
| flushPending() called in switchSession | VERIFIED |
| All 691 tests pass | VERIFIED |
| npx tsc --noEmit exits 0 | VERIFIED |
