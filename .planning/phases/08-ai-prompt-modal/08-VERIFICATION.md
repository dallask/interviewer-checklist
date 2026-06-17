---
phase: 08-ai-prompt-modal
verified: 2026-06-17T21:50:30Z
status: human_needed
score: 17/17 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the extension sidebar, click 'AI feedback prompt' button, verify modal opens with pre-filled editable prompt"
    expected: "Modal opens with full prompt text visible in scrollable editable textarea; candidate details, scored questions, topic marks, difficulty notes, and ## Task block all present"
    why_human: "Native dialog .showModal() behavior and textarea rendering require a real browser; jsdom does not implement showModal() or dialog open state"
  - test: "In the open modal, click 'Copy to clipboard', then paste into a text editor"
    expected: "Clipboard receives the full prompt text (or the edited version if user modified it before copying); 'Copied!' flash appears briefly then disappears"
    why_human: "Real clipboard API availability depends on the browser context; jsdom mocks clipboard — actual system clipboard write must be confirmed in a Chrome extension context"
  - test: "Close the modal by clicking the Close button; verify focus returns to the 'AI feedback prompt' trigger button in the sidebar"
    expected: "Focus is visually on the 'AI feedback prompt' button after dialog closes; screen reader announces the button"
    why_human: "Focus-restore behavior (document.getElementById('open-ai-prompt')?.focus()) requires a real browser environment with proper DOM focus management"
  - test: "When clipboard API is unavailable (e.g. tested with devtools override), click 'Copy to clipboard'"
    expected: "The textarea text is auto-selected and 'Select all and copy manually' instruction appears below the copy button"
    why_human: "Clipboard permission denial must be tested in a real browser environment; cannot be confirmed by automated tests alone"
---

# Phase 8: AI Prompt Modal Verification Report

**Phase Goal:** Users can generate an editable AI feedback prompt for the active session and copy it to the clipboard in one click
**Verified:** 2026-06-17T21:50:30Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | buildAiPrompt returns a non-empty string for any V3Session, including an empty one | VERIFIED | `buildAiPrompt.ts` line 125 returns `lines.join('\n')` which always contains candidate block + ## Task block; test "returns a non-empty string for a minimal empty session" asserts `result.length > 0` |
| 2 | The output contains candidate name when set, '(not set)' when candidate is null | VERIFIED | `buildAiPrompt.ts` lines 38-41: `${c?.name \|\| '(not set)'}` pattern; tests "contains '(not set)' for null candidate" and "contains the candidate name when candidate is set" both pass |
| 3 | Each scored question appears with its numeric score in the output | VERIFIED | `buildAiPrompt.ts` lines 90-91: `typeof score === 'number' ? String(score) : 'skipped'` renders numeric score; test "contains '[8]' for a question scored 8" passes |
| 4 | Unscored questions are marked as 'skipped' | VERIFIED | `buildAiPrompt.ts` line 90-91: falls back to `'skipped'` when score is not a number; test "contains '[skipped]' for an unscored question" passes |
| 5 | Custom questions appear inline after bank questions for their parent topic, using cq.id for score lookup | VERIFIED | `buildAiPrompt.ts` lines 96-105: filters by `cq.topicId === topic.id`, uses `session.scores[cq.id]` (not positional); test "uses cq.id as the score key for custom questions (not positional index)" passes — asserts `[7]` appears when score keyed on `custom-twig-1` |
| 6 | Each topic has a one-sentence difficulty note using the highest coefficient | VERIFIED | `buildAiPrompt.ts` lines 59-82: `Math.max(...coefficients)` then `Difficulty: ${diffLabel} — weighted ${maxCoef}×`; tests "contains 'weighted' keyword" and "contains 'Difficulty:' label" pass |
| 7 | A '## Task' block appears at the end of every generated prompt | VERIFIED | `buildAiPrompt.ts` lines 117-123: always pushes `'---'` then `'## Task'` then instruction text; test "contains '## Task' block at the end" passes |
| 8 | Topic notes appear in the prompt when set | VERIFIED | `buildAiPrompt.ts` lines 108-110: `if (session.topicNotes[topic.id])` emits `Topic notes: ${value}`; tests "includes the topic note" and "includes 'Topic notes:' label" pass |
| 9 | Per-question notes appear beneath the question line when set | VERIFIED | `buildAiPrompt.ts` lines 89-92: `if (note) lines.push('  Note: ${note}')` after the question line; test "appends 'Note:' beneath the question line when a note is present" passes |
| 10 | An empty session generates 'No scores yet' placeholder mark text | VERIFIED | `buildAiPrompt.ts` lines 77-79: when `result.mark !== null` is false, emits `Mark: No scores yet (${scoredCount}/${totalCount} scored)`; test "contains 'No scores yet' placeholder" passes |
| 11 | Modal opens with prompt pre-filled in editable textarea | VERIFIED (automated) | `AiPromptModal.tsx` line 113-118: `<textarea value={editablePrompt}>` with `onChange` handler; `useEffect([prompt])` resets state on prop change; test "renders prompt in textarea" and "textarea resets when prompt prop changes" pass — human check needed for browser dialog behavior |
| 12 | Copy calls clipboard.writeText with current content | VERIFIED | `AiPromptModal.tsx` line 84: `await navigator.clipboard.writeText(editablePrompt)`; test "copy button calls clipboard.writeText with current textarea content" and "calls writeText with edited content" both pass |
| 13 | "Copied!" flash appears and disappears after 2s | VERIFIED | `AiPromptModal.tsx` lines 85-87: `setCopied(true)` + `setTimeout(() => setCopied(false), 2000)`; tests "'Copied!' flash appears after successful copy" and "'Copied!' flash disappears after 2 seconds" pass (fake timers used) |
| 14 | Clipboard failure shows "Select all and copy manually" instruction | VERIFIED | `AiPromptModal.tsx` lines 88-92: catch block calls `textareaRef.current?.select()` and `setShowFallback(true)`, renders `<p>Select all and copy manually</p>` conditionally; test "clipboard failure shows fallback text" passes |
| 15 | Dialog stays open after copy | VERIFIED | `AiPromptModal.tsx` copy handler never calls `onClose` or `dialogRef.current?.close()`; no `close()` call in copy path |
| 16 | Close button closes dialog; focus returns to trigger button (id='open-ai-prompt') | VERIFIED | `AiPromptModal.tsx` lines 62-73: `handleClose()` calls `document.getElementById('open-ai-prompt')?.focus()`; registered on `dialog` 'close' event; `ActionsGroup.tsx` line 127: `onClose={() => { aiPromptRef.current?.close(); }}`; test "Close button calls onClose callback" passes — human check needed for real focus behavior |
| 17 | ActionsGroup has trigger button with id='open-ai-prompt' after session switcher | VERIFIED | `ActionsGroup.tsx` lines 66-73: `<button id="open-ai-prompt">` immediately after the Switch session button and before `<hr>`; test "renders 'AI feedback prompt' button with id='open-ai-prompt'" passes |

**Score:** 17/17 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/buildAiPrompt.ts` | Pure prompt builder function, exports `buildAiPrompt` | VERIFIED | Exists, 127 lines, exports `buildAiPrompt` and `AiPromptInput` interface; imports `computeTopicMark`, `DIFFICULTY_COEFFICIENTS`, `V3Session` |
| `src/utils/buildAiPrompt.test.ts` | TDD test suite, describe('buildAiPrompt') | VERIFIED | Exists, 188 lines, contains `describe('buildAiPrompt — basic structure'`, 17 tests across 7 describe blocks |
| `src/components/AiPromptModal.tsx` | Prop-driven native dialog component, exports `AiPromptModal` | VERIFIED | Exists, 154 lines, no `useAppStore` import, prop-driven with `dialogRef`, `prompt`, `onClose` |
| `src/components/AiPromptModal.test.tsx` | Component behavior tests, describe('AiPromptModal') | VERIFIED | Exists, 179 lines, 11 tests, contains `describe('AiPromptModal'`; covers clipboard, flash, fallback, close, prop-change, isPending |
| `src/components/ActionsGroup.tsx` | Updated with AI prompt trigger + modal wiring, contains 'open-ai-prompt' | VERIFIED | Exists, contains `id="open-ai-prompt"` at line 68, `AiPromptModal` at line 124, `buildAiPrompt` import at line 4 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/utils/buildAiPrompt.ts` | `src/scoring/scoring.ts` | `import computeTopicMark` | WIRED | Line 4: `import { computeTopicMark } from '../scoring/scoring.js'`; used at line 51-55 with real session data |
| `src/utils/buildAiPrompt.ts` | `src/data/bank/types.ts` | `import DIFFICULTY_COEFFICIENTS` | WIRED | Line 2: `import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js'`; used at line 59 via `DIFFICULTY_COEFFICIENTS[q.level]` |
| `src/utils/buildAiPrompt.test.ts` | `src/data/bank/index.ts` | `import DEFAULT_SECTIONS` | WIRED | Line 2: `import { DEFAULT_SECTIONS } from '../data/bank/index.js'`; used in all test calls to `buildAiPrompt` |
| `src/components/ActionsGroup.tsx` | `src/utils/buildAiPrompt.ts` | `import buildAiPrompt` | WIRED | Line 4: `import { buildAiPrompt } from '../utils/buildAiPrompt.js'`; called at line 45 inside `handleOpenAiPrompt` |
| `src/components/ActionsGroup.tsx` | `src/components/AiPromptModal.tsx` | render AiPromptModal | WIRED | Line 5: `import { AiPromptModal } from './AiPromptModal.js'`; rendered at lines 124-128 with `dialogRef`, `prompt`, `onClose` props |
| `src/components/AiPromptModal.tsx` | `navigator.clipboard` | `handleCopy` async function | WIRED | Line 84: `await navigator.clipboard.writeText(editablePrompt)` in try/catch; `showFallback` set in catch block |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AiPromptModal.tsx` | `editablePrompt` | `prompt` prop, reset by `useEffect([prompt])` | Yes — prop flows from `ActionsGroup.aiPrompt` state | FLOWING |
| `ActionsGroup.tsx` | `aiPrompt` | `buildAiPrompt(currentSession, DEFAULT_SECTIONS)` called in `handleOpenAiPrompt` | Yes — `currentSession` assembled from 6 live store selectors (`scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, `candidate`) | FLOWING |
| `buildAiPrompt.ts` | prompt string | `computeTopicMark(topic, session.scores, session.overrides[...])` + direct reads of `session.notes`, `session.topicNotes`, `session.customQuestions` | Yes — reads real store field values; no hardcoded empty data | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 17 buildAiPrompt unit tests pass | `npx vitest run src/utils/buildAiPrompt.test.ts` | 17/17 pass, exit 0 | PASS |
| All 11 AiPromptModal component tests pass | `npx vitest run src/components/AiPromptModal.test.tsx` | 11/11 pass, exit 0 | PASS |
| All 17 ActionsGroup tests pass (includes 2 new AI prompt tests) | `npx vitest run src/components/ActionsGroup.test.tsx` | 17/17 pass, exit 0 | PASS |
| Combined: 47 tests across 3 files | `npx vitest run src/utils/buildAiPrompt.test.ts src/components/AiPromptModal.test.tsx src/components/ActionsGroup.test.tsx` | 47/47 pass, exit 0 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AI-01 | 08-01, 08-02 | AI candidate-feedback prompt modal — generates tool-agnostic editable prompt embedding candidate details, scored marks, per-topic detail, difficulty weighting, task spec | SATISFIED | `buildAiPrompt.ts` implements all sub-requirements; `AiPromptModal.tsx` renders in editable textarea; `ActionsGroup.tsx` wires trigger; all tests pass |
| AI-02 | 08-02 | Copy-to-clipboard via `navigator.clipboard.writeText`; fallback pre-selects textarea for manual copy | SATISFIED | `AiPromptModal.tsx` line 84: `await navigator.clipboard.writeText(editablePrompt)`; catch block calls `textareaRef.current?.select()` + `setShowFallback(true)`; both code paths tested |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `buildAiPrompt.test.ts` | 121 | `"No scores yet" placeholder` in test description string | Info | The word "placeholder" appears inside a string literal in a test name — not an implementation stub. The text describes the expected output string. No impact. |

No blocker or warning anti-patterns found. No TBD, FIXME, XXX, or unreferenced debt markers in any phase file.

---

### Notable Implementation Deviation

**Close button disabled state:** The plan 08-02 spec said both Close and Copy buttons should be `disabled={isPending}`. The actual implementation only disables the Copy button during in-flight writes (`disabled={isPending}` on Copy only; Close button has no `disabled` attribute). The test file explicitly tests this behavior with the name "isPending disables copy button but NOT close button" — this was a deliberate decision documented in the Summary's `decisions` section ("Both Close and Copy buttons are disabled when isPending=true") which contradicts the actual implementation. However, the test explicitly validates the actual behavior (Close NOT disabled), so the implementation is self-consistent and tested. This does not block goal achievement.

---

### Human Verification Required

The following require manual testing in a Chrome browser environment:

### 1. Modal Opens with Pre-filled Editable Prompt

**Test:** Install the extension, open the sidebar, score a few questions, then click "AI feedback prompt" in the sidebar
**Expected:** A native dialog opens containing a scrollable textarea pre-filled with a structured prompt including candidate info, all scored topics with marks, difficulty notes, and a "## Task" instruction block at the bottom. The textarea should be editable.
**Why human:** `HTMLDialogElement.showModal()` is not implemented in jsdom; real browser rendering is required to confirm the dialog appears and textarea is editable in the extension context

### 2. Copy to Clipboard Works in Browser

**Test:** With the modal open, click "Copy to clipboard"; then paste (Cmd+V) into any text editor
**Expected:** The full prompt text appears in the editor. "Copied!" flash appears briefly below the copy button (disappearing after ~2 seconds). The dialog remains open after copying.
**Why human:** The `navigator.clipboard.writeText` Permissions API behavior depends on Chrome extension context and user permissions; cannot be fully confirmed by unit tests with mocked clipboard

### 3. Focus Returns to Trigger After Close

**Test:** Open the AI prompt modal, then close it using the Close button (or Esc key). Observe where keyboard focus lands.
**Expected:** Focus returns to the "AI feedback prompt" button in the sidebar. The button should be visually focused (ring outline visible). Tab/Shift+Tab navigation should work correctly within the modal while it is open.
**Why human:** DOM focus management with `document.getElementById('open-ai-prompt')?.focus()` must be verified in a real browser; jsdom focus behavior differs from Chrome's

### 4. Clipboard Failure Fallback

**Test:** With DevTools open, override `navigator.clipboard.writeText` to reject (or test in a non-HTTPS context), then click "Copy to clipboard"
**Expected:** The textarea content is auto-selected (highlighted), and "Select all and copy manually" text appears below the copy button. User can then manually copy with Cmd+C.
**Why human:** Triggering real clipboard permission denial requires browser context; the fallback textarea selection (`textareaRef.current?.select()`) must be verified visually

---

## Gaps Summary

No gaps found. All 17 must-have truths are VERIFIED against the codebase. All 47 tests pass. The phase goal is achieved in code.

Status is `human_needed` (not `passed`) because clipboard interaction, native dialog behavior, and focus management require browser-level verification that automated tests cannot fully cover.

---

_Verified: 2026-06-17T21:50:30Z_
_Verifier: Claude (gsd-verifier)_
