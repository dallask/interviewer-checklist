---
phase: 08-ai-prompt-modal
reviewed: 2026-06-17T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/utils/buildAiPrompt.ts
  - src/utils/buildAiPrompt.test.ts
  - src/components/AiPromptModal.tsx
  - src/components/AiPromptModal.test.tsx
  - src/components/ActionsGroup.tsx
  - src/components/ActionsGroup.test.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the AI prompt modal implementation: a pure utility (`buildAiPrompt`), a prop-driven modal component (`AiPromptModal`), and the orchestrating `ActionsGroup`. Overall structure is clean and the separation of concerns is well-executed. One hard blocker was found: a `Math.max` spread over an empty array produces `-Infinity` in the prompt output for any topic with zero questions. Four warnings cover a type-safety escape hatch, a missing setTimeout cleanup, implicit DOM coupling via a hardcoded ID, and a gap in the `ActionsGroup` test suite. Two info items cover missing negative-assertion coverage and fragile partial-state test mocks.

---

## Critical Issues

### CR-01: `Math.max(...[])` produces `-Infinity` in prompt output for topics with empty question arrays

**File:** `src/utils/buildAiPrompt.ts:44-51`

**Issue:** When `topic.questions` is an empty array, `topic.questions.map(...)` produces `[]`, and `Math.max(...[])` returns `-Infinity` (JavaScript spec). The `Object.entries(DIFFICULTY_COEFFICIENTS).find(([, v]) => v === maxCoef)` lookup then finds no matching entry (`-Infinity` is not a coefficient value), so `diffEntry` is `undefined`. The fallback `diffLevel = 'novice'` is applied correctly for the label, **but `maxCoef` itself (`-Infinity`) is still written into the output string on line 66**:

```
Difficulty: Novice — weighted -Infinity×
```

This garbled text is sent verbatim to the AI. Although no existing bank topic currently has zero questions, the `Topic` type places no minimum constraint on `questions`, so this is a latent data-driven bug.

**Fix:**

```ts
// Guard against empty question arrays before calling Math.max
const coefficients = topic.questions.map((q) => DIFFICULTY_COEFFICIENTS[q.level]);
const maxCoef = coefficients.length > 0 ? Math.max(...coefficients) : DIFFICULTY_COEFFICIENTS['novice'];
```

Alternatively, replace the spread with `Math.max.apply(null, coefficients)` guarded by a length check, or derive `diffLabel` from `maxCoef` only when `isFinite(maxCoef)`.

---

## Warnings

### WR-01: `as unknown as V3Session` cast in `ActionsGroup` silences legitimate type errors

**File:** `src/components/ActionsGroup.tsx:38-46`

**Issue:** `handleOpenAiPrompt` constructs a plain object with only the six fields that `buildAiPrompt` currently reads, then bypasses the type system with `as unknown as V3Session`:

```ts
const currentSession = {
  scores,
  overrides,
  notes,
  topicNotes,
  customQuestions,
  candidate,
};
const generated = buildAiPrompt(currentSession as unknown as V3Session, DEFAULT_SECTIONS);
```

`V3Session` requires `version: 3` and `id: string`. The double-cast suppresses the missing-fields error. If `buildAiPrompt` is ever extended to read `session.id` (e.g., for a prompt header or logging), this will produce `undefined` silently at runtime with no TypeScript warning.

**Fix:** Either pass the full `V3Session` object by reading it from storage/store, or define a narrow interface that `buildAiPrompt` actually depends on and use that instead:

```ts
// In buildAiPrompt.ts — replace V3Session param with a purpose-built type
export interface AiPromptInput {
  candidate: V3Session['candidate'];
  scores: V3Session['scores'];
  overrides: V3Session['overrides'];
  notes: V3Session['notes'];
  topicNotes: V3Session['topicNotes'];
  customQuestions: V3Session['customQuestions'];
}

export function buildAiPrompt(session: AiPromptInput, sections: readonly Section[]): string { ... }
```

This removes the need for any cast and future-proofs the function signature.

---

### WR-02: `setTimeout` in `handleCopy` has no cleanup — can fire on unmounted component

**File:** `src/components/AiPromptModal.tsx:72`

**Issue:** `setTimeout(() => setCopied(false), 2000)` is created inside an async event handler with no stored handle and no cleanup. If the modal is closed (unmounted) within 2 seconds of a successful copy, the timeout fires and calls `setCopied` on an unmounted component. In React 18 this is a silent no-op rather than a crash, but it leaks a timer that holds a stale closure reference. The test suite does not catch this because the fake-timer test always waits for the timeout to fire before checking.

**Fix:** Store the timer handle in a ref and clear it on cleanup:

```ts
const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In handleCopy after setCopied(true):
if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);

// Add a cleanup effect:
useEffect(() => {
  return () => {
    if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
  };
}, []);
```

---

### WR-03: Focus restore in `AiPromptModal` hardcodes a DOM element ID — implicit coupling

**File:** `src/components/AiPromptModal.tsx:54`

**Issue:** The `handleClose` event listener restores focus via `document.getElementById('open-ai-prompt')?.focus()`. This hardcodes the `id` of the trigger button from `ActionsGroup`. If the button's `id` is renamed or the modal is reused in a different context without that button, focus silently drops to `<body>` with no error. The `?.` guard masks the failure.

**Fix:** Accept a `triggerRef` prop (or a `returnFocusRef`) from the caller and call `.focus()` on it:

```tsx
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  triggerRef?: RefObject<HTMLElement | null>; // element to restore focus to on close
  prompt: string;
  onClose: () => void;
}

// In handleClose:
function handleClose() {
  triggerRef?.current?.focus();
}
```

`ActionsGroup` would pass `aiPromptTriggerRef` pointing to the `#open-ai-prompt` button. This removes the cross-component ID coupling and makes `AiPromptModal` self-contained.

---

### WR-04: `ActionsGroup` test suite has no test that clicks "AI feedback prompt" and verifies `buildAiPrompt` is called / modal opens

**File:** `src/components/ActionsGroup.test.tsx:166-171`

**Issue:** The only test for the AI prompt button checks that the button exists and has the correct `id`. No test clicks the button to verify:
1. `buildAiPrompt` is invoked with the correct session state.
2. `aiPromptRef.current?.showModal()` is called.
3. The modal receives the generated prompt string.

This means a regression in `handleOpenAiPrompt` (e.g., swapped arguments, wrong store selectors, `showModal` not called) would not be caught by the test suite.

**Fix:** Add a test that clicks the button and asserts `showModal` was called on the AI prompt dialog, analogous to the existing `Switch session` / `showModal` test at line 188-196:

```tsx
it('clicking "AI feedback prompt" calls showModal() on the AI prompt dialog', () => {
  render(<ActionsGroup />);
  // The AiPromptModal renders a <dialog> — query it or stub showModal on the ref
  const dialog = document.querySelector('dialog[aria-labelledby="ai-prompt-title"]') as HTMLDialogElement;
  const showModal = vi.fn();
  Object.defineProperty(dialog, 'showModal', { value: showModal, writable: true });
  fireEvent.click(screen.getByRole('button', { name: /ai feedback prompt/i }));
  expect(showModal).toHaveBeenCalledTimes(1);
});
```

---

## Info

### IN-01: No negative-assertion test for `candidate.details` empty-string suppression

**File:** `src/utils/buildAiPrompt.test.ts:109-113`

**Issue:** The test suite verifies that `Notes:` appears when `candidate.details` is non-empty (line 109), but no test asserts that the `Notes:` line is **absent** when `details` is `''`. The `sessionWithCandidate` fixture (line 27) already has `details: ''`, but its usage at line 105 only checks that the candidate name appears — not that `Notes:` is omitted. A future refactor that changes the conditional from `if (c?.details)` to `if (c?.details !== undefined)` would silently emit `Notes: ` with an empty body and no test would catch it.

**Fix:** Add a test:

```ts
it('does NOT emit "Notes:" line when candidate.details is empty string', () => {
  const result = buildAiPrompt(sessionWithCandidate, DEFAULT_SECTIONS);
  expect(result).not.toContain('Notes:');
});
```

---

### IN-02: Partial-state mocks in `ActionsGroup.test.tsx` omit store fields required by `handleOpenAiPrompt`

**File:** `src/components/ActionsGroup.test.tsx:85-98, 107-121`

**Issue:** Three test cases (dark mode toggle variants) mock the store with only a subset of fields — `expandAll`, `collapseAll`, `hideMarked`, `setHideMarked`, `darkMode`, `setDarkMode` — omitting `scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, and `candidate`. If a future test added a click on the AI prompt button using one of those partial-state render setups, `handleOpenAiPrompt` would pass `undefined` for several fields to `buildAiPrompt`, causing a runtime crash (confirmed: `undefined.filter(...)` throws when `customQuestions` is absent). The current tests happen not to click the AI button, so no crash occurs today, but the mocks are fragile.

**Fix:** Extend the partial-state mocks to include the full store shape, or extract a shared `fullMockState` constant that the `beforeEach` mock already uses and reference it in the partial overrides:

```ts
mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
  selector({ ...fullMockState, darkMode: true, setDarkMode }),
);
```

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
