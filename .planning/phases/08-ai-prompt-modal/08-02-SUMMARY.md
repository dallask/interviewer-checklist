---
phase: 08-ai-prompt-modal
plan: "02"
subsystem: components
tags: [tdd, modal, clipboard, react, vitest, ai-prompt]
dependency_graph:
  requires:
    - src/utils/buildAiPrompt.ts (buildAiPrompt pure function — from 08-01)
    - src/storage/types.ts (V3Session)
    - src/data/bank/index.ts (DEFAULT_SECTIONS)
    - src/components/ImportPreviewModal.tsx (analog patterns — focus trap, isPending, reset effect)
  provides:
    - src/components/AiPromptModal.tsx (prop-driven native dialog)
    - src/components/AiPromptModal.test.tsx (11 component behavior tests)
  affects:
    - src/components/ActionsGroup.tsx (trigger button + modal wired)
    - src/components/ActionsGroup.test.tsx (extended mock + new test)
tech_stack:
  added: []
  patterns:
    - TDD RED → GREEN cycle (no REFACTOR needed)
    - Prop-driven native dialog (no store import in modal)
    - isPending double-submit guard (WR-01, T-08-04)
    - Focus trap + focus restore with WR-02 guard
    - Clipboard API with fallback (textareaRef.current.select())
    - Async void wrapper in onClick for async handlers
    - Per-field useAppStore selectors (existing ActionsGroup pattern)
    - Reset internal state on prop change (useEffect dependency)
key_files:
  created:
    - src/components/AiPromptModal.tsx
    - src/components/AiPromptModal.test.tsx
  modified:
    - src/components/ActionsGroup.tsx
    - src/components/ActionsGroup.test.tsx
decisions:
  - "AiPromptModal is purely prop-driven — no useAppStore import; all state management lives in ActionsGroup"
  - "Both Close and Copy buttons are disabled when isPending=true (per RESEARCH.md Pitfall 6 and plan spec)"
  - "currentSession cast as unknown as V3Session since ActionsGroup reads only the scoring fields; version and id are not used by buildAiPrompt"
  - "AiPromptModal added at end of modal render block (after ResetConfirmDialog) following existing modal ordering convention"
  - "AI feedback prompt trigger button placed directly after Switch session and before hr divider per CONTEXT.md spec"
metrics:
  duration_minutes: 4
  completed_date: "2026-06-17"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
requirements:
  - AI-01
  - AI-02
---

# Phase 08 Plan 02: AiPromptModal Component + ActionsGroup Wiring Summary

**One-liner:** Prop-driven `AiPromptModal` native dialog with editable textarea, clipboard copy, "Copied!" flash, and fallback instruction; wired into `ActionsGroup` via trigger button that generates the prompt on click.

## What Was Built

`src/components/AiPromptModal.tsx` — a prop-driven native `<dialog>` component (no store import) that accepts `dialogRef`, `prompt`, and `onClose` props. Features: editable textarea pre-filled on open, async clipboard copy with isPending guard (WR-01), "Copied!" aria-live flash that auto-clears after 2s, "Select all and copy manually" fallback on clipboard failure, focus trap with WR-02 guard, focus restore to `#open-ai-prompt`, and state reset on prop change.

`src/components/AiPromptModal.test.tsx` — 11 Vitest tests covering all specified behaviors: prompt pre-fill, textarea editability, clipboard writeText call, edited content copy, "Copied!" flash appearance, 2s flash clear with fake timers, clipboard failure fallback, Close callback, prompt prop change reset, and isPending disabling both buttons.

`src/components/ActionsGroup.tsx` (modified) — added 6 new store selectors (`scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, `candidate`), `aiPromptRef` useRef, `aiPrompt` useState, `handleOpenAiPrompt` that calls `buildAiPrompt` and `showModal()`, trigger button `id="open-ai-prompt"` after "Switch session" and before `<hr>`, and `AiPromptModal` rendered with all required props.

`src/components/ActionsGroup.test.tsx` (modified) — extended `beforeEach` mock with `scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, `candidate` fields; added test for "AI feedback prompt" button presence and id attribute.

## TDD Gate Compliance

- RED commit `e914df7`: `test(08-02): add failing tests for AiPromptModal` — 11 tests, all failing (module not found)
- GREEN commit `e8565bb`: `feat(08-02): implement AiPromptModal component` — all 11 tests passing
- REFACTOR: not needed — implementation was clean on first pass

## Verification

```
npx vitest run src/components/AiPromptModal.test.tsx        -> 11/11 pass
npx vitest run src/components/ActionsGroup.test.tsx         -> 17/17 pass (includes new test)
npx vitest run src/components/AiPromptModal.test.tsx src/components/ActionsGroup.test.tsx  -> 28/28 pass
npx tsc --noEmit                                            -> no errors
npx vitest run                                              -> 469/469 pass (33 test files)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — `AiPromptModal` is fully implemented and wired. The trigger button generates a prompt via `buildAiPrompt` on click and passes it to the modal. No placeholder data, no empty wiring.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The component uses `navigator.clipboard` (accepted per T-08-02 — user-authored content only) and `textareaRef.current.select()` as fallback (local DOM operation). T-08-04 (isPending guard) is mitigated as required — `if (isPending) return` guard and `disabled={isPending}` on both buttons, `finally` block always clears isPending.

## Self-Check: PASSED

- [x] `src/components/AiPromptModal.tsx` exists — FOUND
- [x] `src/components/AiPromptModal.test.tsx` exists — FOUND
- [x] `src/components/ActionsGroup.tsx` contains `id="open-ai-prompt"` — FOUND
- [x] `src/components/ActionsGroup.test.tsx` contains new store fields in mock — FOUND
- [x] RED commit `e914df7` exists — FOUND
- [x] GREEN commit `e8565bb` exists — FOUND
- [x] Task 2 commit `45c5612` exists — FOUND
- [x] All 11 AiPromptModal tests pass
- [x] All 17 ActionsGroup tests pass (including new AI prompt button test)
- [x] Full suite 469/469 green
- [x] No TypeScript errors
- [x] No new dependencies added to package.json
- [x] No changes to manifest.json
