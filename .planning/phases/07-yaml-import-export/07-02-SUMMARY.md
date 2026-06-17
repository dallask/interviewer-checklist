---
phase: 07-yaml-import-export
plan: "02"
subsystem: store+components
tags:
  - yaml
  - import
  - store
  - modal
  - tdd
  - snapshot-before-write
dependency_graph:
  requires:
    - src/utils/yamlImport.ts (ImportResult, ImportPreview types — plan 07-01)
    - src/storage/index.js (storageAdapter.snapshot — STORE-05)
    - src/store/app.ts (createSession, renameSession — plan 07-01 deps)
    - src/components/ResetConfirmDialog.tsx (focus trap pattern)
    - src/components/CandidateModal.tsx (WR-02 guard pattern)
  provides:
    - src/store/app.ts (importSession action on AppActions interface)
    - src/components/ImportPreviewModal.tsx
  affects:
    - src/components/ActionsGroup.tsx (plan 07-03 wires ImportPreviewModal and calls importSession)
tech_stack:
  added: []
  patterns:
    - TDD RED-GREEN-REFACTOR per-task cycle
    - STORE-05 snapshot-before-mutation (T-07-05 mitigated)
    - Native dialog focus trap with WR-02 focusable.length guard
    - Prop-driven component (no store dependency in modal)
    - aria-pressed toggle buttons for new-session/overwrite mode
    - overwriteActive reset on preview change via useEffect
key_files:
  created:
    - src/components/ImportPreviewModal.tsx
    - src/components/ImportPreviewModal.test.tsx
  modified:
    - src/store/app.ts
    - src/store/app.test.ts
decisions:
  - "importSession uses getState() after each await to read fresh activeSessionId — closure capture would stale-read the pre-action ID"
  - "ImportPreviewModal is purely prop-driven (no useAppStore import) — caller owns store interaction per plan spec"
  - "Test spying on dialogRef.current.close must be done AFTER render (React overwrites ref.current during mount)"
  - "Tests call dialogRef.current.showModal() before role queries — JSDOM hides closed dialog contents from accessibility tree"
metrics:
  duration_minutes: 3
  completed_date: "2026-06-17T14:16:39Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 7 Plan 02: importSession Store Action + ImportPreviewModal Summary

**One-liner:** importSession store action with snapshot-before-mutation (STORE-05/T-07-05) and ImportPreviewModal native dialog with new-session/overwrite toggle, both fully TDD-covered.

## What Was Built

### `src/store/app.ts` (modified)

- Added `import type { ImportResult } from '../utils/yamlImport.js'` at top
- Added `importSession: (data: ImportResult, overwriteActive: boolean) => Promise<void>` to `AppActions` interface
- Implemented `importSession`:
  1. Reads `activeSessionId` from `getState()` (not closure)
  2. Calls `await storageAdapter.snapshot(activeSessionId)` FIRST — STORE-05 / T-07-05 mitigation
  3. If `overwriteActive=true`: single `set()` applying scores/overrides/notes/topicNotes/customQuestions/candidate
  4. If `overwriteActive=false`: `await createSession()`, reads new `activeSessionId` from `getState()`, optionally `await renameSession(newId, data.sessionName)`, then single `set()`

### `src/store/app.test.ts` (modified)

- Added `snapshot: vi.fn().mockResolvedValue(undefined)` to storageAdapter mock
- Added `describe('importSession', ...)` with 7 tests:
  - Snapshot called once before createSession (call-order spy)
  - Snapshot called once before set() in overwrite mode (call-order spy)
  - activeSessionId differs after new-session import
  - activeSessionId unchanged after overwrite import
  - renameSession called with sessionName when provided
  - state.scores matches data.scores after overwrite
  - Snapshot is first in callOrder (shared call-order spy test)

### `src/components/ImportPreviewModal.tsx` (created)

- Native `<dialog>` (never `open` attribute — T-05-03-04)
- Props: `dialogRef`, `preview: ImportPreview | null`, `onConfirm: (overwriteActive: boolean) => Promise<void>`
- `const [overwriteActive, setOverwriteActive] = useState(false)`
- `useEffect([preview])` resets `overwriteActive` to false when preview changes
- Focus trap `useEffect` verbatim from ResetConfirmDialog with WR-02 guard (`if (focusable.length === 0) return`)
- Focus restore target: `document.getElementById('open-import-yaml')?.focus()` on close
- Two `<button type="button" aria-pressed={...} aria-label={...}>` toggles: "Import as new session" / "Overwrite active session"
- Confirm: `onClick={() => { void handleConfirm(); }}` — async void wrapper
- Cancel: `dialogRef.current?.close()` — no onConfirm call
- Null-safe: renders dialog shell without crashing when `preview=null`

### `src/components/ImportPreviewModal.test.tsx` (created)

- 10 tests covering all must_haves from plan spec
- Uses `dialogRef.current.showModal()` before role queries (JSDOM accessibility tree requires open dialog)
- Spies on `dialogRef.current.close` AFTER render (React overwrites ref.current during mount — deviation noted)
- No store mock needed (purely prop-driven component)

## Tests

| File | Tests | Result |
|------|-------|--------|
| app.test.ts | 70 | All pass (was 63, +7 importSession) |
| ImportPreviewModal.test.tsx | 10 | All pass |
| Full suite (31 files) | 440 | All pass — no regressions |

## Commits

| Hash | Message |
|------|---------|
| 598179f | feat(07-02): add importSession store action with snapshot-before-mutation (YAML-02/YAML-03) |
| 6fcd7ba | feat(07-02): implement ImportPreviewModal component with TDD (YAML-03) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test: close spy must be set up AFTER render**
- **Found during:** Task 2 GREEN phase
- **Issue:** Plan spec says "Mock dialogRef as { current: document.createElement('dialog') }". When spy was set on `dialogRef.current.close` BEFORE render, React's `ref={dialogRef}` caused `dialogRef.current` to be replaced with the actual rendered DOM element during mount. The spy was on the old standalone element, not the rendered one, so click assertions failed.
- **Fix:** Moved `vi.spyOn(dialogRef.current, 'close')` to AFTER `render(...)` call so the spy targets the actual rendered dialog element.
- **Files modified:** src/components/ImportPreviewModal.test.tsx
- **Commit:** 6fcd7ba

**2. [Rule 1 - Bug] JSDOM hides closed dialog content from accessibility tree**
- **Found during:** Task 2 GREEN phase (first test run)
- **Issue:** `screen.getByRole('button', { name: /import as new session/i })` failed — JSDOM does not expose buttons inside a closed `<dialog>` element to the accessibility tree. Tests for toggle, confirm, and cancel all failed.
- **Fix:** Added `dialogRef.current.showModal()` before role queries in interactive tests. Text-content queries (`getByText`) work without this as they search the full DOM, not the accessibility tree.
- **Files modified:** src/components/ImportPreviewModal.test.tsx
- **Commit:** 6fcd7ba

## Known Stubs

None. All exported functions and components are fully implemented — no placeholder values, no TODOs, no hardcoded returns.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes. The `importSession` action enforces `storageAdapter.snapshot()` as the first operation before any mutation — T-07-05 mitigated. The `overwriteActive` flag is controlled only by the UI toggle (T-07-08 mitigated — snapshot happens in store, UI cannot bypass it).

## Self-Check: PASSED
