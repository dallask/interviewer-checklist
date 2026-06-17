---
phase: 05-scoring-ui-notes-candidate-custom-questions
plan: 03
subsystem: ui-components
tags: [react, zustand, dialog, focus-trap, accessibility, tailwind, testing-library, tdd]

# Dependency graph
requires:
  - phase: 05-01
    provides: "ScoringState + ScoringActions (setCandidate, resetAll, activeSessionId) in useAppStore"
  - phase: 05-02
    provides: "dialog::backdrop CSS in styles.css, ActionsGroup existing buttons"
  - phase: 04-shell-sidebar-read-only-content-tree
    provides: "ActionsGroup, Sidebar, buildFlatRows"

provides:
  - "CandidateModal: native <dialog> with 6 fields (name/email/role/date/interviewer/details), focus trap, Save/Discard/Reset details"
  - "ResetConfirmDialog: native <dialog> with snapshot-before-reset, Keep scores/Reset buttons, focus trap"
  - "ActionsGroup extended with Candidate details (id=open-candidate-modal) and Reset all (id=open-reset-dialog) trigger buttons"
  - "App.tsx: markedTopicIds Set computed from scores + DEFAULT_SECTIONS, passed to buildFlatRows with hideMarked"

affects:
  - "Phase 6 (session switcher needs resetAll to fully clear state — already wired)"
  - "Phase 7 YAML export (reads candidate from store — CandidateDetails type already defined)"
  - "Phase 9 keyboard shortcuts (Esc closes dialogs natively — already works)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native <dialog> with imperative showModal() — never <dialog open> prop (T-05-03-04)"
    - "Focus trap via addEventListener('keydown') on dialog element — query focusable inside handler each time"
    - "Non-null type preservation in closures: assign to const with explicit HTMLDialogElement type after null guard"
    - "RefObject<HTMLDialogElement | null> for React 19 compatibility (createRef returns nullable in React 19)"
    - "Async reset handler: await storageAdapter.snapshot(sessionId) THEN resetAll() (T-05-03-03)"
    - "useMemo markedTopicIds pattern: iterate DEFAULT_SECTIONS + scores to build Set<string>"

key-files:
  created:
    - src/components/CandidateModal.tsx
    - src/components/CandidateModal.test.tsx
    - src/components/ResetConfirmDialog.tsx
    - src/components/ResetConfirmDialog.test.tsx
  modified:
    - src/components/ActionsGroup.tsx
    - src/components/ActionsGroup.test.tsx
    - src/app/App.tsx

key-decisions:
  - "RefObject<HTMLDialogElement | null> instead of RefObject<HTMLDialogElement> — React 19 createRef() returns nullable current; using non-null would cause TS2322 in tests"
  - "Focus trap captures dialogRef in const dialogEl: HTMLDialogElement after null guard — TypeScript does not preserve narrowing across async closure boundaries, explicit type annotation required"
  - "handleKeyDown queries focusable elements each invocation (not once at setup) — ensures correct wrapping after Reset details clears/restores form state dynamically"
  - "Pre-existing biome format issues in QuestionCard.test.tsx and TopicRow.test.tsx fixed as Rule 1 — required for npm run ci to exit 0 (plan done criteria)"

patterns-established:
  - "Native dialog open pattern: ActionsGroup holds refs, passes dialogRef prop to modal components; trigger buttons call showModal() via ref"
  - "Focus restore pattern: dialog.addEventListener('close', ...) restores focus to trigger button by id"
  - "markedTopicIds as useMemo: computed on each scores change, passed to buildFlatRows to activate hideMarked filter"

requirements-completed:
  - SCORE-04
  - SCORE-06

# Metrics
duration: 25min
completed: 2026-06-17
---

# Phase 05 Plan 03: CandidateModal, ResetConfirmDialog, and App.tsx hideMarked wiring

**Native `<dialog>` modals with manual focus traps for candidate details and reset confirmation, ActionsGroup trigger buttons, and hideMarked activation via markedTopicIds computation in App.tsx**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-17T11:52:00Z
- **Completed:** 2026-06-17T12:17:00Z
- **Tasks:** 2 (Task 1 TDD with RED+GREEN commits, Task 2 auto)
- **Files modified/created:** 9

## Accomplishments

- **CandidateModal** built with native `<dialog>`, 6 controlled form fields (name/email/role/date/interviewer/details), focus trap via keydown handler queried per invocation, 'close' event restores focus to trigger button, Save dispatches setCandidate with all fields, Discard closes without state change, Reset details clears fields and dispatches setCandidate(null)
- **ResetConfirmDialog** built with async `handleReset` that awaits `storageAdapter.snapshot(activeSessionId)` before `resetAll()` (T-05-03-03), focus trap, 'close' restores focus to reset trigger button
- **ActionsGroup** extended with two new trigger buttons: "Candidate details" (id=open-candidate-modal) calling `candidateDialogRef.current?.showModal()` and "Reset all" (id=open-reset-dialog, text-red-600) calling `resetDialogRef.current?.showModal()`; both modals rendered as siblings
- **App.tsx** extended with `useMemo`-computed `markedTopicIds` Set from `scores` and `DEFAULT_SECTIONS`, passed to `buildFlatRows` alongside `hideMarked` — activates the hide-marked-topics toggle introduced in Plan 01

## Task Commits

Each task was committed atomically (TDD task has RED + GREEN commits):

1. **Task 1 RED: failing tests for CandidateModal, ResetConfirmDialog, ActionsGroup wiring** — `66605ac` (test)
2. **Task 1 GREEN: CandidateModal, ResetConfirmDialog, ActionsGroup wiring** — `f865196` (feat)
3. **Task 2: App.tsx markedTopicIds computation and hideMarked wiring** — `c3392f0` (feat)

## Files Created/Modified

- `src/components/CandidateModal.tsx` — Native `<dialog>` candidate details form (6 fields, Save/Discard/Reset, focus trap, focus restore on close)
- `src/components/CandidateModal.test.tsx` — 10 tests for SCORE-04 behaviors (dialog.open, aria-labelledby, 6 fields, Save/Discard/Reset, pre-populate)
- `src/components/ResetConfirmDialog.tsx` — Native `<dialog>` reset confirmation (snapshot before resetAll, Keep scores/Reset buttons, focus trap)
- `src/components/ResetConfirmDialog.test.tsx` — 6 tests for SCORE-06 behaviors (dialog.open, aria-labelledby, Keep scores no-op, Reset awaits snapshot before resetAll)
- `src/components/ActionsGroup.tsx` — Extended with useRef for both dialogs, Candidate details + Reset all trigger buttons, CandidateModal + ResetConfirmDialog renders
- `src/components/ActionsGroup.test.tsx` — Extended with 4 new tests: candidate-modal id/classes, reset-dialog id/text-red-600 class
- `src/app/App.tsx` — Added useMemo markedTopicIds computation from scores + DEFAULT_SECTIONS; passes hideMarked + markedTopicIds to buildFlatRows
- `src/components/QuestionCard.test.tsx` — Pre-existing biome format issue fixed (Rule 1)
- `src/components/TopicRow.test.tsx` — Pre-existing biome format issue fixed (Rule 1)

## Decisions Made

- **RefObject<HTMLDialogElement | null>:** React 19's `createRef<T>()` returns `RefObject<T | null>` (current is always nullable). Using the non-null type `RefObject<HTMLDialogElement>` would cause TS2322 type errors in tests. Changed Props interface to accept the nullable variant.
- **Focus trap local const pattern:** `const dialogEl: HTMLDialogElement = maybeDialog` after null guard avoids `dialog!.querySelectorAll` non-null assertion (blocked by Biome `noNonNullAssertion`) while preserving TypeScript's non-null type in the closure body.
- **hideMarked in App.tsx:** The plan called for `useMemo` to compute `markedTopicIds` — confirmed correct; `scores` is the only dependency. Custom questions are NOT included in markedTopicIds calculation (only bank questions at original indices); this matches Plan 01's buildFlatRows behavior where custom questions use a separate index path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-null assertion `dialog!.querySelectorAll` blocked by Biome `noNonNullAssertion`**
- **Found during:** Task 1 GREEN — npm run ci check
- **Issue:** Focus trap closures used `dialog!.querySelectorAll` which triggers Biome `lint/style/noNonNullAssertion`. Dialog was already null-guarded but TS doesn't narrow across closure boundaries.
- **Fix:** Renamed variable to `maybeDialog`, added `const dialogEl: HTMLDialogElement = maybeDialog` after the null guard; all closure usages reference `dialogEl` (non-null typed const)
- **Files modified:** src/components/CandidateModal.tsx, src/components/ResetConfirmDialog.tsx
- **Verification:** tsc --noEmit exits 0; npm run ci exits 0; all tests pass
- **Committed in:** f865196 (Task 1 GREEN commit)

**2. [Rule 1 - Bug] React 19 `createRef<T>()` returns `RefObject<T | null>` — TS2322 in tests**
- **Found during:** Task 1 GREEN — tsc check
- **Issue:** `RefObject<HTMLDialogElement>` in Props doesn't accept `createRef<HTMLDialogElement>()` (returns `RefObject<HTMLDialogElement | null>`) in React 19
- **Fix:** Changed Props interface to `dialogRef: RefObject<HTMLDialogElement | null>` in both modal components
- **Files modified:** src/components/CandidateModal.tsx, src/components/ResetConfirmDialog.tsx
- **Verification:** tsc --noEmit exits 0
- **Committed in:** f865196 (Task 1 GREEN commit)

**3. [Rule 1 - Bug] Pre-existing biome format violations in QuestionCard.test.tsx and TopicRow.test.tsx**
- **Found during:** Task 1 GREEN — npm run ci check
- **Issue:** These files from Plan 02 had biome formatting differences that caused `biome ci` to fail with "File content differs from formatting output", blocking `npm run ci` exit 0
- **Fix:** Ran `npx biome format --write` on both files
- **Files modified:** src/components/QuestionCard.test.tsx, src/components/TopicRow.test.tsx
- **Verification:** npm run ci exits 0
- **Committed in:** f865196 (Task 1 GREEN commit)

**4. [Rule 1 - Bug] Import sort ordering in CandidateModal.test.tsx and ResetConfirmDialog.test.tsx**
- **Found during:** Task 1 GREEN — npm run ci check
- **Issue:** `createRef` import from 'react' was not in Biome's required alphabetical/scope order relative to component imports
- **Fix:** Ran `npx biome check --write` on both test files
- **Files modified:** src/components/CandidateModal.test.tsx, src/components/ResetConfirmDialog.test.tsx
- **Verification:** npm run ci exits 0 (no format errors)
- **Committed in:** f865196 (Task 1 GREEN commit)

---

**Total deviations:** 4 auto-fixed (all Rule 1 bugs — biome/TypeScript compliance)
**Impact on plan:** All auto-fixes necessary for CI compliance. No scope creep.

## Issues Encountered

- biome `noNonNullAssertion` rule does not allow `dialog!.querySelectorAll` inside closures even when the outer scope has a null guard — the fix (explicit typed const) is idiomatic and avoids both the biome error and the TypeScript narrowing limitation
- React 19 nullable refs are a breaking change from React 18 where `createRef<T>()` returned `RefObject<T>` with non-null current

## Known Stubs

None — all components are fully wired to real store state. CandidateModal reads from and writes to `useAppStore.candidate`. ResetConfirmDialog calls `storageAdapter.snapshot` and `resetAll` with real implementations.

## Threat Flags

None — no new network endpoints or auth paths. All data stays within Zustand store + chrome.storage.local boundary already in the threat model.

## Next Phase Readiness

- Full interactive scoring loop is complete: score sliders, notes, custom questions, candidate details modal, reset confirmation
- All 6 SCORE requirements (SCORE-01 through SCORE-06) have automated test coverage
- ResetConfirmDialog uses real `storageAdapter.snapshot` + `resetAll` — ready for Phase 6 session management
- App.tsx `markedTopicIds` computation is live — hideMarked toggle now functionally hides scored topics
- Phase 6 (session switcher) can proceed with the existing store shape and reset semantics

---
*Phase: 05-scoring-ui-notes-candidate-custom-questions*
*Completed: 2026-06-17*

## Self-Check: PASSED

- All 5 key implementation files exist on disk
- All 3 task commits exist: 66605ac (test), f865196 (feat), c3392f0 (feat)
- 330 tests pass (24 test files, 0 failures)
- npm run ci exits 0 (biome + tsc clean)
- npm run build exits 0
