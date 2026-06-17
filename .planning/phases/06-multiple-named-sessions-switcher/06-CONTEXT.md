# Phase 6: Multiple Named Sessions & Switcher - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers full multi-session management: a session switcher modal (opened from the ActionsGroup sidebar) that lets users create, rename, duplicate, and delete named sessions, plus a safe switching mechanism that flushes pending writes synchronously before changing `activeSessionId`. The underlying storage model (`session:<id>` + `manifest` keys) was established in Phase 3; Phase 6 only adds the management UI and switch orchestration on top of it.

</domain>

<decisions>
## Implementation Decisions

### UI Entry Point & Switcher Display
- Switcher trigger button lives in the **ActionsGroup sidebar** — consistent with the Candidate/Reset pattern established in Phase 5
- Active session name shown in a **small label above the switcher button** in the ActionsGroup
- Session list inside modal uses **compact text rows with inline icon buttons** (rename ✎, duplicate ⧉, delete ×) — table-density, not cards
- **8 rows** visible before the list scrolls

### Session Create & Naming
- Default name for a new session: **"Session N"** (auto-incrementing from the highest existing session number + 1)
- Duplicate copies the **full session state** from the active session: scores, overrides, notes, topicNotes, customQuestions, candidate
- Rename UX: **inline click-to-edit** — click the name row, text becomes an `<input>`, Enter/blur commits; Escape cancels
- Session name max length: **50 characters**

### Delete Flow & State Boundaries
- Deleting the **active session** auto-switches to the most-recently-updated remaining session; if no sessions remain, a blank "Session 1" is auto-created
- **Per-session state** (saved/restored on switch): scores, overrides, notes, topicNotes, customQuestions, candidate
- **Global state** (not reset on switch): darkMode, sidebar collapsed state, selectedSections, selectedDifficulties, hideMarked, searchQuery
- Undo toast appears at the **fixed bottom of the extension popup**, full-width, for ~10 seconds
- Deletion is **committed immediately** on storage write; undo only works while the popup is open (closing the popup during the undo window commits the deletion permanently)

### Claude's Discretion
- Session switcher modal title and exact button copy
- Animation/transition on toast appearance
- Visual styling of the active session row (highlight, checkmark, or other indicator)
- How "Switch session" confirmation is conveyed (immediate or brief loading indicator)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActionsGroup.tsx` — existing sidebar component; switcher button and session label go here alongside the existing Candidate/Reset triggers
- `CandidateModal.tsx` / `ResetConfirmDialog.tsx` — native `<dialog>` + manual focus-trap pattern established in Phase 5; SessionSwitcherModal and DeleteConfirmDialog follow the same pattern
- `StorageAdapter.flushPending()` + `storageAdapter.read/write` — Phase 3 storage layer; switch orchestration calls `flushPending()` then updates `manifest.activeSessionId`
- `src/storage/types.ts` — `V2Manifest` (with `sessions: SessionMeta[]`, `activeSessionId`), `SessionMeta` type, `createV2Manifest()`, `createDefaultV3Session()` — all directly usable
- `src/store/app.ts` — `activeSessionId` state + subscribe/persist pattern; new session actions (create, rename, duplicate, delete, switch) extend this store

### Established Patterns
- **Native `<dialog>` + imperative `showModal()`** — never `<dialog open>` prop; focus-trap via `addEventListener('keydown')` on the dialog
- **Focus restore** — `dialog.addEventListener('close', ...)` returns focus to the trigger button by id
- **Zustand store extension** — add new state slices + actions to `app.ts`; subscribe pattern in `main.tsx` handles persistence
- **Tailwind CSS** — existing color tokens and spacing; dark mode via `dark:` prefix classes
- **`crypto.randomUUID()`** — already used for session IDs in `createV2Manifest()`

### Integration Points
- `ActionsGroup.tsx` — add `<button id="open-session-switcher">` + `<SessionSwitcherModal>` with `dialogRef`
- `src/store/app.ts` — add `manifest: V2Manifest | null`, `sessions: SessionMeta[]`, and actions: `createSession`, `renameSession`, `duplicateSession`, `deleteSession`, `switchSession`
- `src/app/main.tsx` — already reads `manifest` and `activeSessionId` from storage; `switchSession` action must flush + reload session state into the store
- `src/storage/adapter.ts` — `flushPending()` already exists; switch orchestrator calls it before writing the new `activeSessionId` to `manifest`

</code_context>

<specifics>
## Specific Ideas

- The session switcher modal is opened from ActionsGroup (same pattern as CandidateModal)
- `resetAll()` (Phase 5) now also clears filters — switching sessions should NOT call `resetAll()`; instead, the switch action reads the target session's scoring data and loads it into the store directly
- The undo toast for delete must not overlap with the session switcher modal; closing the modal before the undo expires is fine (toast stays)
- "Duplicate" in the modal duplicates the active session, not the row being clicked — if the user wants to duplicate session B while viewing the list, clicking ⧉ on B duplicates B regardless of active session

</specifics>

<deferred>
## Deferred Ideas

- Per-session UI state (filters, search, expanded topics) — Phase 6 keeps filters as global state; per-session filter persistence is a Phase 9 polish candidate
- Session re-ordering (drag to reorder) — deferred beyond Phase 6
- Session export from the switcher modal — covered in Phase 7 (YAML Export)
- Session templates / presets — out of scope for this milestone

</deferred>
