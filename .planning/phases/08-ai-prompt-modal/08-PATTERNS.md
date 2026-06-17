# Phase 8: AI Prompt Modal - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 4 (2 new utility + 2 new component)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/buildAiPrompt.ts` | utility | transform | `src/utils/yamlExport.ts` | exact (pure transform: `V3Session + Section[]` → string) |
| `src/utils/buildAiPrompt.test.ts` | test | — | `src/utils/yamlExport.test.ts` | exact (pure utility Vitest test, V3Session fixture, DEFAULT_SECTIONS) |
| `src/components/AiPromptModal.tsx` | component | request-response | `src/components/ImportPreviewModal.tsx` | exact (prop-driven native dialog, isPending guard, focus trap, dialogRef pattern) |
| `src/components/AiPromptModal.test.tsx` | test | — | `src/components/ImportPreviewModal.test.tsx` | exact (prop-driven component test, makeDialogRef, vi.fn mock, fireEvent pattern) |

Also modified (integration points, extend in place):
- `src/components/ActionsGroup.tsx` — add `aiPromptRef` + trigger button + `AiPromptModal` render (analog: self)

---

## Pattern Assignments

### `src/utils/buildAiPrompt.ts` (utility, transform)

**Analog:** `src/utils/yamlExport.ts`

**Imports pattern** (`src/utils/yamlExport.ts` lines 1–3):
```typescript
import { dump } from 'js-yaml';
import type { Section } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
```

`buildAiPrompt.ts` does not need `js-yaml`. Apply the same `import type` convention and `.js` extension on all relative imports:
```typescript
import type { Section } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
```

**JSDoc + pure-function pattern** (`src/utils/yamlExport.ts` lines 5–18):
```typescript
/**
 * Export a V3Session to a YAML string in the structural format.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-${questionIndex}` (0-based index within topic.questions).
 * This matches the store key format confirmed at src/store/app.ts line 68.
 */
export function exportSession(
  session: V3Session,
  sessionName: string,
  sections: readonly Section[],
): string {
```

Apply the same structure for `buildAiPrompt`:
```typescript
/**
 * Build an AI feedback prompt string from a V3Session and section data.
 *
 * Pure function — no side effects, no DOM calls, no React.
 *
 * Score key format: `${topicId}-${questionIndex}` (matches src/store/app.ts line 70).
 * Custom question score key: cq.id (e.g. 'custom-twig-1') — same as store.
 */
export function buildAiPrompt(
  session: V3Session,
  sections: readonly Section[],
): string {
```

**Score key lookup pattern** (`src/utils/yamlExport.ts` lines 38–45):
```typescript
questions: topic.questions.map((_, index) => {
  const questionId = `${topic.id}-${index}`;
  return {
    index,
    score: session.scores[questionId] ?? null,
    note: session.notes[questionId] ?? '',
  };
}),
```

Use the same `${topic.id}-${index}` key to read scores and notes in `buildAiPrompt`. Custom question scores use `session.scores[cq.id]` where `cq.id` is the custom question's own id string.

**Custom question lookup pattern** (`src/utils/yamlExport.ts` lines 29–33):
```typescript
const topicCustomQs = session.customQuestions.filter(
  (cq) => cq.topicId === topic.id,
);
```

Apply the same filter per topic to append custom questions inline after the bank questions for that topic, per CONTEXT.md section order rule.

**Null/empty guard pattern** (`src/utils/yamlExport.ts` lines 36–37):
```typescript
override: session.overrides[topic.id] ?? null,
topicNote: session.topicNotes[topic.id] ?? '',
```

Use `?? null` and `?? ''` throughout when reading from Record maps. For unscored questions, use `?? null` to detect missing score and emit `"No scores yet"` placeholder text at the topic level when all scores are null.

**Multiple named exports pattern** (`src/utils/yamlExport.ts` lines 13, 70, 91):
```typescript
export function exportSession(...): string { ... }
export function buildFilename(sessionName: string): string { ... }
export function downloadYaml(content: string, filename: string): void { ... }
```

`buildAiPrompt.ts` needs only one export — the single `buildAiPrompt` function. No helpers need to be exported unless unit-testable independently.

---

### `src/utils/buildAiPrompt.test.ts` (test)

**Analog:** `src/utils/yamlExport.test.ts`

**Imports pattern** (`src/utils/yamlExport.test.ts` lines 1–4):
```typescript
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildFilename, exportSession } from './yamlExport.js';
```

Apply same pattern:
```typescript
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildAiPrompt } from './buildAiPrompt.js';
```

**Minimal fixture pattern** (`src/utils/yamlExport.test.ts` lines 7–16):
```typescript
const minimalSession: V3Session = {
  version: 3,
  id: 'test-session-1',
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
};
```

Copy verbatim — same fixture applies for `buildAiPrompt` tests. Score fixture for targeted tests:
```typescript
const sessionWithScore: V3Session = {
  ...minimalSession,
  scores: { 'twig-0': 8 },
  notes: { 'twig-0': 'Knows Twig basics well.' },
};
```

**Describe-block-per-scenario pattern** (`src/utils/yamlExport.test.ts` lines 18–29, 31–47, 49–63):
```typescript
describe('exportSession — basic structure', () => {
  it('returns a string starting with "meta:" ...', () => { ... });
  it('includes "sections:" key ...', () => { ... });
});

describe('exportSession — null and zero scores', () => {
  it('includes `score: null` for unscored questions ...', () => { ... });
  it('includes `score: 0` for a question scored zero ...', () => { ... });
});
```

Apply same grouping for `buildAiPrompt`:
- `describe('buildAiPrompt — basic structure', ...)` — returns non-empty string, contains candidate heading
- `describe('buildAiPrompt — empty session', ...)` — returns "No scores yet" placeholder
- `describe('buildAiPrompt — scored session', ...)` — score value appears in output, note appears in output
- `describe('buildAiPrompt — custom questions', ...)` — custom question text appears in output
- `describe('buildAiPrompt — difficulty weighting note', ...)` — one-sentence difficulty note per topic

**No `beforeEach` for pure function tests** — `yamlExport.test.ts` has no `beforeEach` and no mocks. Same applies here. Call `buildAiPrompt(session, DEFAULT_SECTIONS)` directly and assert on the returned string.

---

### `src/components/AiPromptModal.tsx` (component, request-response)

**Primary analog:** `src/components/ImportPreviewModal.tsx` (exact — prop-driven native dialog with isPending guard)

**Imports pattern** (`src/components/ImportPreviewModal.tsx` lines 1–2):
```typescript
import { type RefObject, useEffect, useState } from 'react';
import type { ImportPreview } from '../utils/yamlImport.js';
```

Apply for `AiPromptModal.tsx`:
```typescript
import { type RefObject, useEffect, useRef, useState } from 'react';
```

Note: `useRef` is needed for `textareaRef` (clipboard fallback select-all). No store import — modal is purely prop-driven.

**Props interface pattern** (`src/components/ImportPreviewModal.tsx` lines 7–11):
```typescript
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  preview: ImportPreview | null;
  onConfirm: (overwriteActive: boolean) => Promise<void>;
}
```

Apply for `AiPromptModal.tsx` per UI-SPEC.md:
```typescript
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  prompt: string;
  onClose: () => void;
}
```

**Local state pattern** (`src/components/ImportPreviewModal.tsx` lines 14–17):
```typescript
const [overwriteActive, setOverwriteActive] = useState(false);
const [importError, setImportError] = useState<string | null>(null);
// WR-01: prevent double-submit
const [isPending, setIsPending] = useState(false);
```

Apply for `AiPromptModal.tsx`:
```typescript
const [editablePrompt, setEditablePrompt] = useState(prompt);
const [isPending, setIsPending] = useState(false);
const [copied, setCopied] = useState(false);
const [showFallback, setShowFallback] = useState(false);
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

**Reset on prop change pattern** (`src/components/ImportPreviewModal.tsx` lines 19–24):
```typescript
useEffect(() => {
  setOverwriteActive(false);
  setImportError(null);
  setIsPending(false);
}, [preview]);
```

Apply the same for `AiPromptModal.tsx` — reset editable content whenever the `prompt` prop changes (i.e., on each modal open with a freshly generated prompt):
```typescript
useEffect(() => {
  setEditablePrompt(prompt);
  setIsPending(false);
  setCopied(false);
  setShowFallback(false);
}, [prompt]);
```

**Focus trap + focus restore pattern** (`src/components/ImportPreviewModal.tsx` lines 27–62) — copy verbatim:
```typescript
useEffect(() => {
  const maybeDialog = dialogRef.current;
  if (!maybeDialog) return;
  const dialogEl: HTMLDialogElement = maybeDialog;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    // WR-02: guard against empty focusable list
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleClose() {
    document.getElementById('open-ai-prompt')?.focus();
  }

  dialogEl.addEventListener('keydown', handleKeyDown);
  dialogEl.addEventListener('close', handleClose);
  return () => {
    dialogEl.removeEventListener('keydown', handleKeyDown);
    dialogEl.removeEventListener('close', handleClose);
  };
}, [dialogRef]);
```

Note: focus restore target is `'open-ai-prompt'` (matches the trigger button `id` in ActionsGroup).

**Async handler + isPending guard pattern** (`src/components/ImportPreviewModal.tsx` lines 64–77):
```typescript
const handleConfirm = async () => {
  // WR-01: guard against double-submit
  if (isPending) return;
  setIsPending(true);
  try {
    await onConfirm(overwriteActive);
    dialogRef.current?.close();
  } catch (err) {
    console.error('Import failed:', err);
    setImportError(err instanceof Error ? err.message : 'Import failed');
  } finally {
    setIsPending(false);
  }
};
```

Apply same pattern for the copy handler — `navigator.clipboard.writeText` is async:
```typescript
const handleCopy = async () => {
  if (isPending) return;
  setIsPending(true);
  try {
    await navigator.clipboard.writeText(editablePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // Clipboard API unavailable — select all text as fallback
    textareaRef.current?.select();
    setShowFallback(true);
  } finally {
    setIsPending(false);
  }
};
```

**Async void wrapper in onClick** (`src/components/ImportPreviewModal.tsx` lines 165–167):
```typescript
onClick={() => {
  void handleConfirm();
}}
```

Apply same pattern for copy button:
```typescript
onClick={() => { void handleCopy(); }}
```

**Dialog element pattern** (`src/components/ImportPreviewModal.tsx` lines 84–89):
```typescript
// T-05-03-04: Never pass open prop — always call .showModal() imperatively
<dialog
  ref={dialogRef}
  aria-labelledby="import-preview-title"
  className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

Apply for `AiPromptModal.tsx`:
```tsx
<dialog
  ref={dialogRef}
  aria-labelledby="ai-prompt-title"
  className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

**Heading pattern** (`src/components/ImportPreviewModal.tsx` lines 91–95):
```typescript
<h2
  id="import-preview-title"
  className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3"
>
  Import YAML
</h2>
```

Apply:
```tsx
<h2
  id="ai-prompt-title"
  className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3"
>
  AI feedback prompt
</h2>
```

**Footer button row pattern** (`src/components/ImportPreviewModal.tsx` lines 153–173):
```typescript
<div className="flex gap-3 justify-end">
  <button
    type="button"
    disabled={isPending}
    onClick={handleCancel}
    className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Cancel
  </button>
  <button
    type="button"
    disabled={isPending || preview === null}
    onClick={() => { void handleConfirm(); }}
    className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isPending ? 'Importing…' : 'Confirm'}
  </button>
</div>
```

Apply for `AiPromptModal.tsx` (Close is secondary, Copy is primary per UI-SPEC.md):
```tsx
<div className="flex gap-3 justify-end">
  <button
    type="button"
    onClick={onClose}
    className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
  >
    Close
  </button>
  <button
    type="button"
    disabled={isPending}
    onClick={() => { void handleCopy(); }}
    className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Copy to clipboard
  </button>
</div>
```

---

### `src/components/AiPromptModal.test.tsx` (test)

**Analog:** `src/components/ImportPreviewModal.test.tsx`

**Imports and test setup pattern** (`src/components/ImportPreviewModal.test.tsx` lines 1–10):
```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportPreviewModal } from './ImportPreviewModal.js';
import type { ImportPreview } from '../utils/yamlImport.js';

// ImportPreviewModal is purely prop-driven — no store mock needed.

const makeDialogRef = () => ({
  current: document.createElement('dialog'),
});
```

Apply for `AiPromptModal.test.tsx`:
```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPromptModal } from './AiPromptModal.js';

// AiPromptModal is purely prop-driven — no store mock needed.

const makeDialogRef = () => ({
  current: document.createElement('dialog'),
});

const SAMPLE_PROMPT = 'Candidate: Alice Smith\nTopic: Twig\n- Q0: 8/10';
```

**vi.fn mock + beforeEach clear pattern** (`src/components/ImportPreviewModal.test.tsx` lines 30–34):
```typescript
describe('ImportPreviewModal', () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });
```

Apply:
```typescript
describe('AiPromptModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });
```

**showModal() before assertions on accessible content** (`src/components/ImportPreviewModal.test.tsx` lines 94–99):
```typescript
// Open dialog so accessibility tree exposes buttons
dialogRef.current.showModal();
const newSessionBtn = screen.getByRole('button', { name: /import as new session/i });
```

Apply the same pattern — call `dialogRef.current.showModal()` before querying roles when the dialog must be open for the accessibility tree to expose elements.

**closeSpy pattern** (`src/components/ImportPreviewModal.test.tsx` lines 163–169):
```typescript
// Spy AFTER render so dialogRef.current points to the real rendered dialog element
const closeSpy = vi.spyOn(dialogRef.current, 'close');
dialogRef.current.showModal();
const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
fireEvent.click(cancelBtn);
expect(closeSpy).toHaveBeenCalledTimes(1);
expect(onConfirm).not.toHaveBeenCalled();
```

Apply for Close button test. Spy on `dialogRef.current.close` and assert it was called when Close is clicked.

**vi.waitFor for async handlers** (`src/components/ImportPreviewModal.test.tsx` lines 131–133):
```typescript
fireEvent.click(confirmBtn);
// Allow async handler to settle
await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledWith(false));
```

Apply same `vi.waitFor` pattern for the copy button click test — `handleCopy` is async.

**Clipboard mock for copy test** — no existing analog in codebase; use:
```typescript
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});
```
Place in `beforeEach` or top-level so all copy tests have a working clipboard mock.

---

### `src/components/ActionsGroup.tsx` (modify in place)

**Analog:** Self — extend existing file.

**Existing ref pattern** (`src/components/ActionsGroup.tsx` lines 17–19):
```typescript
const candidateDialogRef = useRef<HTMLDialogElement>(null);
const resetDialogRef = useRef<HTMLDialogElement>(null);
const sessionSwitcherRef = useRef<HTMLDialogElement>(null);
```

Add:
```typescript
const aiPromptRef = useRef<HTMLDialogElement>(null);
```

**Existing modal render pattern** (`src/components/ActionsGroup.tsx` lines 87–89):
```typescript
<SessionSwitcherModal dialogRef={sessionSwitcherRef} />
<CandidateModal dialogRef={candidateDialogRef} />
<ResetConfirmDialog dialogRef={resetDialogRef} />
```

Add:
```typescript
<AiPromptModal
  dialogRef={aiPromptRef}
  prompt={aiPrompt}
  onClose={() => aiPromptRef.current?.close()}
/>
```

Where `aiPrompt` is a `useState<string>('')` local state. Trigger button onClick generates the prompt and opens the dialog:
```typescript
const [aiPrompt, setAiPrompt] = useState('');

// In onClick:
const generated = buildAiPrompt(currentSession, DEFAULT_SECTIONS);
setAiPrompt(generated);
aiPromptRef.current?.showModal();
```

`currentSession` is assembled from store selectors (`scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, `candidate`) — same fields as `V3Session`. Use `useAppStore((s) => s.scores)` etc. following the existing per-field selector pattern (`src/components/ActionsGroup.tsx` lines 8–15).

**Existing trigger button pattern** (`src/components/ActionsGroup.tsx` lines 32–38):
```typescript
<button
  type="button"
  id="open-session-switcher"
  onClick={() => sessionSwitcherRef.current?.showModal()}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Switch session
</button>
```

Add the AI prompt trigger button directly after the session switcher button (before the `<hr>`):
```typescript
<button
  type="button"
  id="open-ai-prompt"
  onClick={handleOpenAiPrompt}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  AI feedback prompt
</button>
```

---

## Shared Patterns

### Native `<dialog>` — Never set `open` attribute
**Source:** `src/components/ImportPreviewModal.tsx` line 84 comment; `src/components/ResetConfirmDialog.tsx` line 60 comment
**Apply to:** `AiPromptModal.tsx`
```typescript
// T-05-03-04: Never pass open prop — always call .showModal() imperatively
<dialog ref={dialogRef} aria-labelledby="ai-prompt-title">
```
Caller always opens via `aiPromptRef.current?.showModal()`. Never `<dialog open>`.

### Focus trap useEffect (verbatim copy)
**Source:** `src/components/ImportPreviewModal.tsx` lines 27–62
**Apply to:** `AiPromptModal.tsx`

Copy the entire useEffect verbatim. Two changes from ImportPreviewModal:
1. Focus restore target: `document.getElementById('open-ai-prompt')?.focus()` (not `'open-import-yaml'`)
2. No other changes — WR-02 guard, Tab wrapping, and cleanup are identical.

### isPending double-submit guard (WR-01)
**Source:** `src/components/ImportPreviewModal.tsx` lines 65–76
**Apply to:** `AiPromptModal.tsx` copy handler
```typescript
if (isPending) return;
setIsPending(true);
try { ... } catch { ... } finally { setIsPending(false); }
```

### Async void wrapper for onClick
**Source:** `src/components/ImportPreviewModal.tsx` lines 165–167
**Apply to:** `AiPromptModal.tsx` Copy button
```typescript
onClick={() => { void handleCopy(); }}
```

### Reset internal state on prop change
**Source:** `src/components/ImportPreviewModal.tsx` lines 19–24
**Apply to:** `AiPromptModal.tsx` — reset `editablePrompt`, `isPending`, `copied`, `showFallback` whenever `prompt` prop changes:
```typescript
useEffect(() => {
  setEditablePrompt(prompt);
  setIsPending(false);
  setCopied(false);
  setShowFallback(false);
}, [prompt]);
```

### `.js` extension on relative imports
**Source:** All existing source files (`src/utils/yamlExport.ts` lines 1–3, `src/store/app.ts`, etc.)
**Apply to:** All new files
```typescript
import type { Section } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
import { buildAiPrompt } from '../utils/buildAiPrompt.js';
```

### Button className (sidebar button style)
**Source:** `src/components/ActionsGroup.tsx` line 36
**Apply to:** AI prompt trigger button in `ActionsGroup.tsx`
```
"w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Score key format
**Source:** `src/store/app.ts` line 70 comment; `src/utils/yamlExport.ts` lines 38–39
**Apply to:** `src/utils/buildAiPrompt.ts`
```typescript
// Per-question scores: key = "${topicId}-${questionIndex}" (0-based)
const questionId = `${topic.id}-${index}`;
const score = session.scores[questionId] ?? null;
// Custom question scores: key = cq.id (e.g. 'custom-twig-1')
const customScore = session.scores[cq.id] ?? null;
```

---

## No Analog Found

All new files have strong analogs. The following sub-capabilities have no existing codebase examples:

| Capability | Reason | Approach |
|------------|--------|----------|
| `navigator.clipboard.writeText` | No clipboard interaction in codebase | Use standard Web API; wrap in try/catch; mock with `vi.fn().mockResolvedValue(undefined)` in tests |
| `textareaRef.current?.select()` fallback | No textarea selection in codebase | Standard DOM call in `.catch` handler; not unit-tested (DOM side effect) |
| `aria-live="polite"` flash pattern | No aria-live flash in codebase | Render `<p aria-live="polite">` conditionally on `copied` state; `setTimeout(() => setCopied(false), 2000)` |
| Text prompt string generation | No string-based prompt builder in codebase | Follow `exportSession` return-string pattern; use template literals + string concatenation |

---

## Metadata

**Analog search scope:** `src/components/`, `src/utils/`, `src/store/`
**Files scanned:** 8 (ImportPreviewModal.tsx, ImportPreviewModal.test.tsx, yamlExport.ts, yamlExport.test.ts, buildFlatRows.ts, buildFlatRows.test.ts, ActionsGroup.tsx, app.ts)
**Pattern extraction date:** 2026-06-17
