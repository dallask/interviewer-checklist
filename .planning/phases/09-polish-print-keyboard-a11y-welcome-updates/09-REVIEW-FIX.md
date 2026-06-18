---
phase: 09-polish-print-keyboard-a11y-welcome-updates
fixed_at: 2026-06-18T08:10:00Z
review_path: .planning/phases/09-polish-print-keyboard-a11y-welcome-updates/09-REVIEW.md
iteration: 2
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report (Iteration 2)

**Fixed at:** 2026-06-18T08:10:00Z
**Source review:** .planning/phases/09-polish-print-keyboard-a11y-welcome-updates/09-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 3 (0 Critical, 3 Warning)
- Fixed: 3
- Skipped: 0

All three Warning findings from the iteration-2 re-review were applied
cleanly. The full vitest suite was re-run after the third fix and all
509 tests across 38 files pass. No findings required rollback. Info-tier
findings (IN-01, IN-02, IN-03) were intentionally out of scope per
`fix_scope: critical_warning`.

## Fixed Issues

### WR-01: Background comment claims dismiss writes `lastSeenVersion`, but it does not

**Files modified:** `src/background/index.ts`
**Commit:** f049df1
**Applied fix:** Rewrote the post-install comment block in
`onInstalled` so it accurately describes the dismiss mechanism. The
new comment states that `UpdateBanner.handleDismiss` writes
`dismissedUpdateVersion` (not `lastSeenVersion`), explains that banner
suppression on next launch is gated on
`dismissedUpdateVersion === currentVersion`, and clarifies that
`lastSeenVersion` is only ever written here on first install — it is
the trigger signal, never advanced from the UI side. Chose the
comment-update path (review's option 2) rather than rewriting the
dismiss handler because changing runtime behavior in a comment-fix
commit would have broken the existing UpdateBanner.test.tsx contract
without justification beyond "match the old comment", and the actual
working mechanism (dismissedUpdateVersion-as-suppression-key) is sound.

### WR-02: `UpdateBanner.handleDismiss` ignores `chrome.storage.local.set` rejection

**Files modified:** `src/components/UpdateBanner.tsx`
**Commit:** d3ab9cf
**Applied fix:** Attached `.catch((err) => console.error('[interviewer-checklist] dismiss banner failed:', err))`
to the `chrome.storage.local.set` call in `handleDismiss`, matching the
project's existing error-handling pattern (used in `Welcome.tsx` and
`background/index.ts`). Kept the structure of the original handler
intact: `setShowBanner(false)` still runs synchronously after the set
call is dispatched, so UI dismissal remains instant. The fix prevents
the unhandled-promise-rejection that would have fired on quota-exceeded
or IO failure. Did NOT switch to the `.then`-gated variant from the
review (which would have kept the banner visible until the set
succeeded), because that introduces a UX regression: a transient
storage failure would leave the banner stuck. Logging-only is the
project's established pattern for non-critical writes.

### WR-03: `useKeyboardShortcuts` Escape branch is unreachable when focus is in the search input

**Files modified:** `src/hooks/useKeyboardShortcuts.ts`
**Commit:** a548766
**Applied fix:** Implemented option (a) per the user's directive.
Special-cased Escape in the editable-element guard: when
`activeElement` is an `INPUT` with `aria-label="Search questions"`
(the project's canonical selector for the sidebar search input, used
elsewhere in this same hook and in `SearchGroup.tsx`), Escape is
allowed to fall through to the Escape branch which calls
`setSearchQuery('')`. All other editable surfaces (TEXTAREA,
contenteditable, unrelated INPUTs like the candidate-name field)
still swallow Escape so user-entered notes/values are not clobbered.
Used the existing `aria-label` selector rather than `id='sidebar-search'`
because no such id exists in the codebase — aria-label is the
project's established convention for identifying the search input.
Existing test `'Escape' calls setSearchQuery('')` still passes
(focus is on document.body in that test, so the guard short-circuits
on the non-INPUT branch and the existing assertion holds).

---

## Verification

- TypeScript: `npx tsc --noEmit -p .` reports only pre-existing errors
  in `src/background/index.test.ts` (chrome-types mismatch unrelated
  to any file I touched). No new errors introduced in any of the
  three modified source files.
- Tests: `npx vitest run` — 38 files, 509 tests, all passing.

---

_Fixed: 2026-06-18T08:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
