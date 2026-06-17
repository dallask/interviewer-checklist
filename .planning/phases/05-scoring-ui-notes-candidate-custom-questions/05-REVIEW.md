---
phase: 05-scoring-ui-notes-candidate-custom-questions
reviewed: 2026-06-17T00:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - src/app/App.tsx
  - src/app/main.tsx
  - src/app/styles.css
  - src/components/ActionsGroup.test.tsx
  - src/components/ActionsGroup.tsx
  - src/components/CandidateModal.test.tsx
  - src/components/CandidateModal.tsx
  - src/components/CustomQuestionForm.test.tsx
  - src/components/CustomQuestionForm.tsx
  - src/components/QuestionCard.test.tsx
  - src/components/QuestionCard.tsx
  - src/components/ResetConfirmDialog.test.tsx
  - src/components/ResetConfirmDialog.tsx
  - src/components/SectionFilter.test.tsx
  - src/components/SectionFilter.tsx
  - src/components/Sidebar.test.tsx
  - src/components/TopicMarkDisplay.test.tsx
  - src/components/TopicMarkDisplay.tsx
  - src/components/TopicRow.test.tsx
  - src/components/TopicRow.tsx
  - src/storage/bootstrap.ts
  - src/storage/migrations/fixtures/v2-session-fixture.ts
  - src/storage/migrations/index.ts
  - src/storage/migrations/v1-to-v2.test.ts
  - src/storage/migrations/v2-to-v3.test.ts
  - src/storage/migrations/v2-to-v3.ts
  - src/storage/types.ts
  - src/store/app.test.ts
  - src/store/app.ts
  - src/utils/buildFlatRows.test.ts
  - src/utils/buildFlatRows.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

This phase introduces the scoring UI (sliders, notes, overrides), candidate modal, reset dialog, custom question form, and persistence layer upgrades (v2→v3 migration). The architecture is well-structured overall, with consistent patterns, good use of debouncing, and solid test coverage. However, three blockers were found: a hard HTML validity violation that produces undefined browser behavior, a data-integrity gap where `resetAll` does not match its own UI description, and a bootstrap gap where V3 sessions stored under a V2 manifest are silently downgraded. Five additional warnings cover real edge-case and correctness risks.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Interactive elements (input + button) nested inside `<button>` — invalid HTML, undefined behavior

**File:** `src/components/TopicRow.tsx:53-66`

**Issue:** `TopicMarkDisplay` renders an `<input type="number">` and conditionally a `<button>` (the clear-override button). `TopicRow` places `<TopicMarkDisplay>` as a child of the topic-header `<button>` (line 65). The HTML specification forbids interactive content inside a `<button>` element. Browser handling is undefined: Chrome may silently strip the inner `<input>`'s interactivity, prevent clicks from reaching it, or bubble the click to the outer button (toggling the topic collapse) when the user intends only to change the override value. This produces broken UX that is difficult to reproduce consistently across browsers.

**Fix:** Move `TopicMarkDisplay` outside the header button. One proven pattern is to replace the `<button>` wrapper with a styled `<div role="button" tabIndex={0}>` (or a flex row where the clickable toggle area is a separate element), so the mark display sits alongside — not inside — the toggle target:

```tsx
// TopicRow.tsx — replace the single <button> with a split-row layout
<div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 w-full flex items-center">
  <button
    type="button"
    aria-expanded={row.isOpen}
    onClick={() => toggleTopic(topicId)}
    className="flex-1 flex items-center px-4 py-2 pl-8 font-normal text-sm cursor-pointer text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none text-left"
  >
    <span className="flex-1">{row.topic.name}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
      {row.questionCount} q
    </span>
  </button>
  {/* TopicMarkDisplay rendered OUTSIDE the toggle button */}
  <TopicMarkDisplay topicId={topicId} topic={row.topic} />
</div>
```

---

### CR-02: `resetAll` does not reset filters despite UI promise of "active filters" being cleared

**File:** `src/store/app.ts:235-244` / `src/components/ResetConfirmDialog.tsx:72-75`

**Issue:** The confirmation dialog tells the user: *"This will clear all scores, notes, overrides, custom questions, candidate details, and **active filters**."* But `resetAll()` only clears `scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, and `candidate`. The filter state fields `selectedSections`, `selectedDifficulties`, `searchQuery`, and `hideMarked` are left untouched. A user who had filtered to a single section before pressing Reset will still see only that section after the reset — directly contradicting the displayed guarantee. This is a correctness bug with user-visible data-integrity impact: the user is led to believe their scoring environment is clean when it is not.

**Fix:** Either update `resetAll` to clear filters, or remove "and active filters" from the dialog copy. Clearing filters is the more correct resolution:

```ts
// src/store/app.ts — resetAll
resetAll: () =>
  set({
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
    // Clear filter state as advertised in the confirmation dialog
    searchQuery: '',
    selectedDifficulties: new Set<Difficulty>(),
    selectedSections: new Set<string>(),
    hideMarked: false,
    // activeSessionId is NOT reset — session identity must persist across resets
  }),
```

---

### CR-03: `bootstrap.ts` loads V3 sessions via `V2SessionSchema`, silently discarding v3-only fields and replacing valid data with empty defaults

**File:** `src/storage/bootstrap.ts:125-131`

**Issue:** The `bootstrap()` function's Scenario B path (valid v2 manifest) reads session keys and validates each with `V2SessionSchema` (line 128). However, Phase 5 now writes sessions as V3 format (`version: 3`, fields `scores`/`overrides`/`notes`/`topicNotes`/`customQuestions`) under the same manifest. A V3 session fails `V2SessionSchema` validation (literal `version: 2` check), so `sessionParseResult.success` is `false`, and `createDefaultSession(s.id)` is returned — silently wiping all scores, notes, and custom questions written in Phase 5. Every app restart after the first session save loses all Phase 5 data.

The flow in `main.tsx` bypasses this by reading the session key directly (line 43-44), so the app appears to work in the happy path. But `bootstrap()` still returns empty V2 sessions for Phase 5 data, and any consumer of the `sessions` return value from `bootstrap()` will see empty state.

**Fix:** Update `bootstrap.ts` Scenario B to try V3 validation first, falling back to V2. Import `V3SessionSchema` and `createDefaultV3Session`:

```ts
// src/storage/bootstrap.ts — inside the for-of loop (Scenario B)
import { V3SessionSchema, createDefaultV3Session } from './types.js';

for (const s of manifest.sessions) {
  const key = `session:${s.id}`;
  const raw = sessionData[key];
  // Try V3 first (Phase 5 format), then V2 (legacy), then default
  const v3Result = v.safeParse(V3SessionSchema, raw);
  if (v3Result.success) {
    sessions[s.id] = v3Result.output as unknown as V2Session; // or use a union return type
  } else {
    const v2Result = v.safeParse(V2SessionSchema, raw);
    sessions[s.id] = v2Result.success
      ? v2Result.output
      : createDefaultSession(s.id);
  }
}
```

Alternatively, change the `bootstrap()` return type to handle both V2 and V3 sessions, or move the session loading responsibility entirely to `main.tsx` and deprecate the `sessions` field from the `bootstrap()` return value.

---

## Warnings

### WR-01: `overrideInput` local state in `TopicMarkDisplay` is not synced when the store `override` changes externally

**File:** `src/components/TopicMarkDisplay.tsx:44-46`

**Issue:** `overrideInput` is initialized from `override` at mount time via `useState`. There is no `useEffect` to sync `overrideInput` when `override` changes from outside (e.g., after a session load or `resetAll()`). When `resetAll()` is called, `override` becomes `null` and `setOverride` is called, but `overrideInput` retains whatever string was typed before the reset. The input box will still show the old value (e.g., "7.5") while the computed mark display correctly shows "—". This is the same pattern correctly addressed for `localNote` (which has a `useEffect` sync at `QuestionCard.tsx:52-54`) but is missing here.

**Fix:**
```tsx
// TopicMarkDisplay.tsx — add sync effect after the useState declaration
useEffect(() => {
  setOverrideInput(override !== null ? String(override) : '');
}, [override]);
```

---

### WR-02: Non-numeric input in the override field is silently swallowed with no user feedback

**File:** `src/components/TopicMarkDisplay.tsx:66-69`

**Issue:** When `handleOverrideBlur` receives a non-numeric or non-finite value (e.g., the user types "abc" and then the browser clears `e.target.value` to `''` for `type="number"`, or they paste Infinity), the function returns without dispatching and without resetting `overrideInput`. The input is left showing whatever was typed, creating a stuck state where the display value and the store value diverge without any error indication to the user. Combined with WR-01, this can produce a permanently desynchronized input that only recovers on the next render cycle that replaces the component.

**Fix:** On the non-numeric branch, reset the local input to match the current store value so the field snaps back cleanly:
```tsx
if (Number.isNaN(n) || !Number.isFinite(n)) {
  // Reset input to current store value to avoid stuck display
  setOverrideInput(override !== null ? String(override) : '');
  return;
}
```

---

### WR-03: `storageAdapter.snapshot` is called with an empty string when `activeSessionId` is `''`

**File:** `src/components/ResetConfirmDialog.tsx:53-55`

**Issue:** `activeSessionId` defaults to `''` (see `app.ts:116`). If `handleReset` is triggered before the store is hydrated from storage (a narrow but possible race in slow environments, or in tests where hydration is skipped), `activeSessionId` will be `''`. `storageAdapter.snapshot('')` reads key `session:`, finds no data, and returns early — so no data loss occurs, but the subsequent `resetAll()` then fires and clears whatever scoring state was in memory. This is silent data loss (the reset proceeds with no error or guard), and the snapshot that was supposed to be the safety net was never written. The fix is a guard before calling snapshot.

**Fix:**
```tsx
const handleReset = async () => {
  if (activeSessionId) {
    await storageAdapter.snapshot(activeSessionId);
  }
  resetAll();
  dialogRef.current?.close();
};
```

---

### WR-04: Custom question `index` in `buildFlatRows` uses `customForTopic.indexOf(cq)` — O(n) inside an O(n) loop

**File:** `src/utils/buildFlatRows.ts:180`

**Issue:** For each custom question `cq` in `customForTopic`, `customForTopic.indexOf(cq)` performs a linear scan of `customForTopic` by reference equality. Since `customForTopic` is built via `.filter()` which creates new object references from the store array, this works correctly only if the same object references are preserved (which they are in Zustand's immutable update model). However, the `indexOf` call is still an O(n) operation inside the O(n) loop over `customForTopic`, making the custom-question index assignment O(n²) for large custom-question lists per topic. More critically, if the `customQuestions` array is ever reconstructed in a way that changes references (e.g., after deserialization), `indexOf` will return `-1`, causing all custom question indices to collapse to `topic.questions.length - 1` — making every custom question collide on the same score key.

**Fix:** Replace `indexOf` with an explicit loop index:
```ts
for (let i = 0; i < customForTopic.length; i++) {
  const cq = customForTopic[i];
  rows.push({
    type: 'question',
    sectionId: section.id,
    topicId: topic.id,
    question: { q: cq.text, level: cq.level },
    index: topic.questions.length + i,
    isCustom: true,
    customId: cq.id,
  });
}
```

---

### WR-05: `main.tsx` imports `App` with a `.tsx` extension, which is non-standard for ES module resolution

**File:** `src/app/main.tsx:10`

**Issue:** `import { App } from './App.tsx';` uses a `.tsx` literal extension in the import specifier. ES module resolution (and the TypeScript module resolver in `bundler`/`node16`/`nodenext` modes) does not recommend using `.tsx` in import paths — the convention is to use `.js` extension aliases (as done correctly everywhere else in this codebase, e.g., `'../store/app.js'`). This works under Vite's dev server (which rewrites specifiers) but may break in environments that use native ESM or stricter TypeScript module resolution settings. It is inconsistent with every other import in the project.

**Fix:**
```ts
import { App } from './App.js';
```

---

## Info

### IN-01: `CandidateModal` focus-return uses a hardcoded `getElementById` that breaks if the button is not in the DOM

**File:** `src/components/CandidateModal.tsx:53-55`

**Issue:** `handleClose` calls `document.getElementById('open-candidate-modal')?.focus()`. This is a hardcoded coupling to a specific DOM id. If `ActionsGroup` is unmounted while the dialog is open (unlikely but possible in future layout changes), focus is silently dropped to the body. The optional-chaining `?.` prevents a throw but swallows the failure. The same pattern exists in `ResetConfirmDialog.tsx:37`.

**Fix:** Pass the trigger element (or a `triggerRef`) as a prop to the modal so the focus return does not depend on global DOM state. This is a quality/robustness improvement rather than an immediate bug.

---

### IN-02: `V2_SESSION_EMPTY` fixture name is misleading — it has a non-empty `candidate` and non-empty `customQuestions`

**File:** `src/storage/migrations/fixtures/v2-session-fixture.ts:7-26`

**Issue:** The fixture named `V2_SESSION_EMPTY` contains `candidate: { name: 'Alice', ... }` and `customQuestions: { 'topic-a': [...] }`. It is only "empty" in the sense that `questionScore`, `topicOverride`, `questionComment`, and `cardComment` are empty records. The name misleads future maintainers who may expect it to represent a baseline with no data at all.

**Fix:** Rename to `V2_SESSION_EMPTY_SCORES` or `V2_SESSION_WITH_CANDIDATE_ONLY` to accurately describe what is empty vs populated.

---

### IN-03: `markedTopicIds` in `App.tsx` iterates `DEFAULT_SECTIONS` but does not include custom questions in "marked" detection

**File:** `src/app/App.tsx:24-36`

**Issue:** The `markedTopicIds` memo checks whether `topic.questions` (built-in bank questions only) have any non-null score. Custom questions added to a topic are not included in this check. A topic that has only custom questions scored will not be added to `markedTopicIds`, so `hideMarked` will never hide it even if all its questions are scored. This is a minor behavioral inconsistency rather than a crash.

**Fix:** If the intent is "topic has at least one scored question (including custom)", extend the check to include custom questions for the topic:
```ts
const markedTopicIds = useMemo(() => {
  const marked = new Set<string>();
  for (const section of DEFAULT_SECTIONS) {
    for (const topic of section.items) {
      const builtInScored = topic.questions.some((_, i) => {
        const key = `${topic.id}-${i}`;
        return scores[key] !== null && scores[key] !== undefined;
      });
      const customForTopic = customQuestions.filter(
        (cq) => cq.topicId === topic.id,
      );
      const customScored = customForTopic.some((_, i) => {
        const key = `${topic.id}-${topic.questions.length + i}`;
        return scores[key] !== null && scores[key] !== undefined;
      });
      if (builtInScored || customScored) marked.add(topic.id);
    }
  }
  return marked;
}, [scores, customQuestions]);
```

---

_Reviewed: 2026-06-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
