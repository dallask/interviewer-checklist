---
phase: 06-multiple-named-sessions-switcher
plan: "03"
subsystem: ui
tags: [react, session-management, tdd, zustand, chrome-extension]
dependency_graph:
  requires:
    - manifest state field (from 06-01 src/store/app.ts)
    - activeSessionId state field (from 06-01 src/store/app.ts)
    - SessionSwitcherModal component (from 06-02 src/components/SessionSwitcherModal.tsx)
    - UndoToast component (from 06-02 src/components/UndoToast.tsx)
    - bootstrap() initialState.manifest (from src/storage/bootstrap.ts)
  provides:
    - ActionsGroup with session label + Switch session trigger wired to SessionSwitcherModal
    - UndoToast mounted at App root level (overlays full viewport)
    - manifest hydrated from chrome.storage into Zustand store on bootstrap
    - slide-up CSS keyframe animation for UndoToast
  affects:
    - src/components/ActionsGroup.tsx (modified — SESS-02 trigger)
    - src/components/ActionsGroup.test.tsx (modified — SESS-02 test coverage)
    - src/app/App.tsx (modified — SESS-03 UndoToast root mount)
    - src/app/main.tsx (modified — SESS-01 manifest hydration)
    - src/app/styles.css (modified — UndoToast animation)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle
    - Dialog trigger via useRef + showModal() — same pattern as CandidateModal/ResetConfirmDialog
    - Manifest hydration at bootstrap time via standalone useAppStore.setState({ manifest })
    - UndoToast mounted at root level (not inside ActionsGroup) for full-viewport overlay
key_files:
  created: []
  modified:
    - src/components/ActionsGroup.tsx
    - src/components/ActionsGroup.test.tsx
    - src/app/App.tsx
    - src/app/main.tsx
    - src/app/styles.css
key_decisions:
  - "SessionSwitcherModal is mounted inside ActionsGroup (alongside CandidateModal and ResetConfirmDialog) so sessionSwitcherRef stays co-located with the trigger button"
  - "UndoToast is mounted in App.tsx at root level (not inside ActionsGroup) so it can overlay the full viewport after the switcher modal closes"
  - "manifest hydration is a separate standalone setState call after the uiState block in main.tsx — keeps concerns separated and matches the existing session hydration pattern"
  - "V2Manifest type import added to main.tsx for explicit documentation even though it is inferred from bootstrap() return type"
patterns_established:
  - "Session label above trigger button: <p aria-label='Active session'> + truncate class for 50-char names"
  - "hr separator (border-gray-200 dark:border-gray-700 my-1) between session switcher block and existing action buttons"
requirements_completed:
  - SESS-01
  - SESS-02
  - SESS-03
  - SESS-04
duration: ~5min
completed: "2026-06-17"
---

# Phase 06 Plan 03: Wiring Summary

**ActionsGroup wired with session label + Switch session trigger + SessionSwitcherModal mount; UndoToast mounted at App root; manifest hydrated from chrome.storage into Zustand on bootstrap; slide-up keyframe added to styles.css.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-17T15:16:00Z
- **Completed:** 2026-06-17T15:18:00Z
- **Tasks:** 1 of 2 (Task 2 is a human checkpoint — not executed by agent)
- **Files modified:** 5

## Accomplishments

- ActionsGroup now shows the active session name (truncated, `aria-label="Active session"`) above a "Switch session" button (`id="open-session-switcher"`) that opens `SessionSwitcherModal` via `sessionSwitcherRef.current?.showModal()`
- App.tsx mounts `<UndoToast />` immediately after `<StorageToast />` at the root level, giving the toast full-viewport z-index coverage
- main.tsx hydrates `initialState.manifest` into the Zustand store via `useAppStore.setState({ manifest: initialState.manifest })` after bootstrap, enabling reactive session list rendering
- `@keyframes slide-up` animation added to `src/app/styles.css` for `motion-safe:animate-[slide-up_150ms_ease-out]` on UndoToast (Tailwind motion-safe variant gates it on `prefers-reduced-motion: no-preference`)
- ActionsGroup.test.tsx extended with 3 new tests (session label renders activeSessionName, Switch session button present with correct id, showModal called on click)

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (Task 1) | b82a750 | `test(06-03): add failing tests for session label and Switch session button in ActionsGroup` — 3 new tests fail (ActionsGroup not yet modified) |
| GREEN (Task 1) | d4be838 | `feat(06-03): wire session switcher into ActionsGroup, App.tsx, main.tsx, styles.css` — all 16 ActionsGroup tests pass |

## Task Commits

| Task | Type | Commit | Status |
|------|------|--------|--------|
| Task 1 RED — add failing tests for session switcher in ActionsGroup | test | b82a750 | DONE |
| Task 1 GREEN — wire ActionsGroup, App.tsx, main.tsx, styles.css | feat | d4be838 | DONE |
| Task 2 — Human smoke test in Chrome | checkpoint:human-verify | — | AWAITING |

## Files Created/Modified

- `src/components/ActionsGroup.tsx` — added session label `<p>`, Switch session `<button id="open-session-switcher">`, `<hr>` separator, `SessionSwitcherModal` import + mount with `sessionSwitcherRef`; added `manifest` + `activeSessionId` store selectors; computed `activeSessionName`
- `src/components/ActionsGroup.test.tsx` — added `vi.mock('./SessionSwitcherModal.js')` stub; added `manifest` + `activeSessionId` fields to `mockUseAppStore`; added 3 new test cases in `describe('Session switcher', ...)`
- `src/app/App.tsx` — added `import { UndoToast }` + `<UndoToast />` after `<StorageToast />`
- `src/app/main.tsx` — added `V2Manifest` to type import from `../storage/types.js`; added `useAppStore.setState({ manifest: initialState.manifest })` standalone call after the existing uiState setState block
- `src/app/styles.css` — appended `@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`

## Decisions Made

- Session label and switcher button are inserted BEFORE the existing "Expand all" button — session context is primary, per CONTEXT.md decision
- `<hr>` separator added between the switcher button and existing action buttons for visual grouping
- `SessionSwitcherModal` mounted alongside `CandidateModal` and `ResetConfirmDialog` at the bottom of ActionsGroup's JSX div (not a portal) — consistent with Phase 5 pattern and keeps the ref co-located with the trigger

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npx vitest run src/components/ActionsGroup.test.tsx` — 16 tests pass (13 pre-existing + 3 new)
- `npm test` — 397 tests pass across 28 test files in worktree context
- `npx tsc --noEmit` — exits 0 (no type errors)
- `ActionsGroup.tsx` contains `id="open-session-switcher"` and `aria-label="Active session"` confirmed
- `App.tsx` contains `<UndoToast />` after `<StorageToast />` confirmed
- `main.tsx` contains `manifest: initialState.manifest` in standalone setState confirmed
- `styles.css` contains `@keyframes slide-up` confirmed

## Known Stubs

None — all wiring is complete. Session label, switcher trigger, modal mount, UndoToast root mount, and manifest hydration are all live, not stubbed. The only reason Task 2 is pending is that it requires human Chrome smoke testing.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Changes are pure wiring — connecting existing store fields to existing components via JSX.

Threat mitigations per plan:
- T-06-03-01 (activeSessionName before manifest hydrated): `?? ''` fallback on `activeSessionName` computation; manifest hydration in main.tsx runs before `createRoot().render()` so component sees correct value on first render
- T-06-03-03 (reduced motion): `motion-safe:animate-[slide-up_150ms_ease-out]` pattern in UndoToast.tsx already uses Tailwind motion-safe variant; `@keyframes slide-up` added to styles.css as required

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/ActionsGroup.tsx contains id="open-session-switcher" | VERIFIED |
| src/components/ActionsGroup.tsx contains aria-label="Active session" | VERIFIED |
| src/app/App.tsx contains UndoToast mount | VERIFIED |
| src/app/main.tsx contains manifest: initialState.manifest | VERIFIED |
| src/app/styles.css contains @keyframes slide-up | VERIFIED |
| Commit b82a750 (RED) exists | VERIFIED |
| Commit d4be838 (GREEN) exists | VERIFIED |
| All 16 ActionsGroup tests pass | VERIFIED |
| npx tsc --noEmit exits 0 | VERIFIED |
