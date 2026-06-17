# Phase 8: AI Prompt Modal — Research

**Researched:** 2026-06-17
**Domain:** Chrome Extension (MV3), React 19, pure utility function, navigator.clipboard API, native `<dialog>`
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Prompt Content & Structure**
- Sections in order: candidate name/role block → scored questions per topic (score + note) → unscored questions (marked as skipped) → custom questions inline with their parent topic → one-sentence difficulty weighting note per topic → structured task spec block at end
- Always English — AI prompts are tool-agnostic and universal; session data values (candidate name, notes) are embedded as-is regardless of language
- Difficulty weighting: one-sentence note per topic only (e.g., "difficulty: High — weighted 1.5×"); no full legend paragraph
- Custom questions appear inline with their parent topic after the scored bank questions for that topic

**Modal UX & Copy Behavior**
- Trigger button placed in ActionsGroup after the session switcher button and before the Reset button — logically grouped with session-output actions (export, AI)
- Textarea is pre-filled with the generated prompt on modal open (no extra click required)
- Dialog stays open after a successful copy — user may want to edit and copy again
- Copy confirmation: brief "Copied!" aria-live text flash below the copy button, auto-clears after 2 seconds

**Fallback & Empty Session Handling**
- Clipboard API unavailable: auto-select all textarea text + display a "Select all and copy manually" instruction line below the textarea
- Modal may open on any session including empty ones — prompt renders with "No scores yet" placeholder text where applicable
- No minimum data requirement — even an empty session generates a valid (partial) prompt structure

**Prompt Generation Architecture**
- Pure utility function: `src/utils/buildAiPrompt.ts` with no React or store dependencies — TDD-able with Vitest
- Prompt is regenerated fresh on every modal open from current session state — no caching in store or session
- No "Regenerate" button inside the modal — prompt auto-refreshes on open; user edits the textarea freely
- ActionsGroup passes `DEFAULT_SECTIONS` into the modal prop (same pattern as yamlExport in Phase 7)

### Claude's Discretion
- Exact prompt wording/formatting within the textarea (heading levels, emoji usage, whitespace)
- Whether the task spec block uses a fixed template or is dynamically shaped from session data
- Aria-label text for trigger button and modal

### Deferred Ideas (OUT OF SCOPE)
- Storing the last-generated prompt in the session for history/diffing
- Multiple prompt templates (e.g., "formal" vs "casual" tone)
- Prompt length controls (short/detailed toggle)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | AI candidate-feedback prompt modal — generates a tool-agnostic, editable prompt embedding candidate details, all scored marks, per-topic detail, difficulty weighting explanation, and a structured task spec | `buildAiPrompt.ts` pure function section; Score key format section; V3Session field inventory |
| AI-02 | Copy-to-clipboard via `navigator.clipboard.writeText` called synchronously in click handler; falls back to pre-selecting the textarea for manual copy | Clipboard API in Chrome extension context section; Copy handler pattern section |
</phase_requirements>

---

## Summary

Phase 8 adds a single-screen feature: a native `<dialog>` modal in ActionsGroup that generates an editable AI feedback prompt from the active V3Session and copies it to the clipboard. The feature splits cleanly into two deliverables: a pure utility function `buildAiPrompt.ts` and a prop-driven React modal component `AiPromptModal.tsx`. Both follow established Phase 5–7 patterns exactly.

The pure function takes a `V3Session` and `Section[]`, iterates over all sections/topics, reads scores from `session.scores[`${topicId}-${index}`]` and notes from `session.notes[...]`, formats a structured multi-section prompt string, and returns it. No React, no store, no DOM. The modal component mirrors `ImportPreviewModal.tsx` almost exactly: `dialogRef` + `prompt` prop + `onClose` callback, a focus trap `useEffect` copied verbatim from `ImportPreviewModal.tsx`, `isPending` guard, and a controlled `textarea` with `value={editablePrompt}` and `onChange`.

The only novel element is the clipboard integration. `navigator.clipboard.writeText` is available in Chrome MV3 full-page tab contexts without a `clipboardWrite` permission because the extension page is a trusted page origin (chrome-extension://). The call is made inside a `.then()/.catch()` chain on the returned Promise, with `isPending=true` during the Promise window and a `finally` block clearing it. The `useRef` pointing to the textarea provides the fallback `select()` call when `.catch()` fires.

**Primary recommendation:** Copy `ImportPreviewModal.tsx` as the structural template. Replace the import/confirm logic with clipboard logic. Write `buildAiPrompt.ts` TDD-first following the `yamlExport.ts` pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prompt generation (text assembly) | Pure utility (`src/utils/`) | — | No React deps; must be unit-testable in isolation |
| Clipboard write | Browser (click handler in component) | — | `navigator.clipboard` is a browser API; must fire in user gesture context |
| Clipboard fallback (select) | Browser (component `useRef`) | — | `textareaRef.current.select()` is a DOM call; lives in component |
| Modal state (isPending, copied, showFallback, editablePrompt) | Component local state | — | Transient UI state; no store persistence needed |
| Prompt prop assembly | ActionsGroup (caller) | — | ActionsGroup reads store state, calls buildAiPrompt, passes result as prop |
| Focus trap + restore | Component `useEffect` | — | DOM event listeners; verbatim copy from ImportPreviewModal pattern |
| Trigger button + ref | ActionsGroup | — | Consistent with CandidateModal, SessionSwitcherModal, ImportPreviewModal pattern |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x (installed) | Component state, refs, effects | Already in project; no new dep |
| TypeScript 5.x | 5.x (installed) | Types for V3Session, Section[], props | Already in project |
| Vitest | (installed) | TDD for buildAiPrompt.ts; component tests | Already in project; same pattern as yamlExport.test.ts |
| @testing-library/react | (installed) | Component behavior tests for AiPromptModal | Already in project; same pattern as ImportPreviewModal.test.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| happy-dom | (installed, vitest env) | DOM environment for component tests | Already configured in vitest.config.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` | Radix UI Dialog | Radix is Phase 9 upgrade path; Phase 8 stays native per established pattern |
| Controlled textarea (`value`+`onChange`) | Uncontrolled (`defaultValue`+`ref`) | Controlled allows external reset when prompt prop changes via `useEffect([prompt])` |
| `.catch()` for clipboard fallback | `try/catch` in async function | Both work; `.catch()` keeps the handler synchronous at call site per AI-02 spec |

**Installation:** No new packages. This phase installs zero external dependencies.

---

## Package Legitimacy Audit

No external packages are installed in this phase. All functionality uses:
- APIs already in the project (React, Vitest, @testing-library/react)
- Browser-native APIs (`navigator.clipboard`, `<dialog>`, `textarea.select()`)

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks "AI feedback prompt" button in ActionsGroup
         │
         ▼
ActionsGroup reads from store:
  session.scores, session.notes, session.topicNotes,
  session.overrides, session.customQuestions, session.candidate
         │
         ▼
buildAiPrompt(session: V3Session, sections: Section[]) → string
  [pure function — no React, no DOM]
         │ prompt string
         ▼
aiPromptRef.current.showModal()
         │
         ▼
AiPromptModal renders (prop-driven):
  props: { dialogRef, prompt, onClose }
  local state: editablePrompt, isPending, copied, showFallback
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
User edits textarea     User clicks "Copy to clipboard"
    │                         │
    ▼                         ▼
onChange → setEditablePrompt  navigator.clipboard.writeText(editablePrompt)
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
               .then()              .catch()
          setCopied(true)      textareaRef.current.select()
          setTimeout 2s        setShowFallback(true)
          setCopied(false)
                    │
                    ▼
               finally: setIsPending(false)
```

### Recommended Project Structure

```
src/
├── components/
│   ├── AiPromptModal.tsx        # new — prop-driven modal
│   ├── AiPromptModal.test.tsx   # new — component behavior tests
│   └── ActionsGroup.tsx         # modified — add trigger + ref + modal render
├── utils/
│   ├── buildAiPrompt.ts         # new — pure prompt builder
│   └── buildAiPrompt.test.ts    # new — TDD unit tests
```

### Pattern 1: buildAiPrompt.ts — Pure Utility Function

**What:** Accepts `V3Session` and `Section[]`, iterates sections → topics → questions, assembles a multi-section plain-text prompt string.

**When to use:** Called once per modal open in ActionsGroup before `.showModal()`.

**Function signature (locked by CONTEXT.md and UI-SPEC.md):**
```typescript
// src/utils/buildAiPrompt.ts
// Source: 08-CONTEXT.md + 08-UI-SPEC.md (Prompt Generation Contract)
import type { Section } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
import { computeTopicMark } from '../scoring/scoring.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';

export function buildAiPrompt(session: V3Session, sections: Section[]): string
```

**Score key lookup (VERIFIED from codebase):**
```typescript
// Source: src/utils/yamlExport.ts line 39; src/scoring/scoring.ts line 52
// Key format: `${topic.id}-${questionIndex}`  (0-based index in topic.questions)
const scoreKey = `${topic.id}-${index}`;
const score = session.scores[scoreKey] ?? null;
const note = session.notes[scoreKey] ?? '';

// Custom question score/note use cq.id as the key directly
// Source: src/utils/yamlExport.ts lines 44-46
const customScore = session.scores[cq.id] ?? null;
const customNote = session.notes[cq.id] ?? '';
```

**Difficulty label mapping (VERIFIED from codebase):**
```typescript
// Source: src/data/bank/types.ts DIFFICULTY_COEFFICIENTS
// novice: 1.0, intermediate: 1.25, advanced: 1.5, expert: 1.75
// One-sentence format per CONTEXT.md: "difficulty: Advanced — weighted 1.5×"
const DIFFICULTY_LABEL: Record<string, string> = {
  novice:       'Novice — weighted 1.0×',
  intermediate: 'Intermediate — weighted 1.25×',
  advanced:     'Advanced — weighted 1.5×',
  expert:       'Expert — weighted 1.75×',
};
```

**Prompt section order (locked by CONTEXT.md):**
1. Candidate block (name, role, date, interviewer — from `session.candidate`)
2. Per-section → per-topic scored/unscored/custom questions + difficulty note
3. Task spec block (fixed template at end)

**Empty session handling:**
- `session.candidate === null` → render "Candidate: (not set)" in header block
- No scored questions for a topic → render "No scores yet" inline
- All fields default to empty string via `?? ''` or `?? null`

### Pattern 2: AiPromptModal.tsx — Prop-Driven Modal

**What:** Native `<dialog>` component with controlled textarea, clipboard copy button, focus trap, and `isPending` guard. Template: `ImportPreviewModal.tsx`.

**Props interface (from 08-UI-SPEC.md):**
```typescript
// Source: 08-UI-SPEC.md — Component Inventory
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  prompt: string;      // pre-generated in ActionsGroup before showModal()
  onClose: () => void;
}
```

**Local state:**
```typescript
const [editablePrompt, setEditablePrompt] = useState(prompt);
const [isPending, setIsPending] = useState(false);
const [copied, setCopied] = useState(false);
const [showFallback, setShowFallback] = useState(false);
const textareaRef = useRef<HTMLTextAreaElement>(null);

// Reset when prop changes (same pattern as ImportPreviewModal useEffect([preview]))
useEffect(() => {
  setEditablePrompt(prompt);
  setCopied(false);
  setShowFallback(false);
  setIsPending(false);
}, [prompt]);
```

**Focus trap (verbatim copy from ImportPreviewModal.tsx):**
```typescript
// Source: src/components/ImportPreviewModal.tsx lines 28-62
// WR-02 guard: if (focusable.length === 0) return
// Focus restore: document.getElementById('open-ai-prompt')?.focus()
```

### Pattern 3: ActionsGroup Wiring

**What:** Add `useRef`, call `buildAiPrompt` in trigger handler, render `<AiPromptModal>`.

**Additions to ActionsGroup.tsx (VERIFIED against existing file):**
```typescript
// Source: src/components/ActionsGroup.tsx — existing pattern for candidateDialogRef
const aiPromptRef = useRef<HTMLDialogElement>(null);

// Read scoring state from store (same approach as CandidateModal reads candidate)
const scores = useAppStore((s) => s.scores);
const overrides = useAppStore((s) => s.overrides);
const notes = useAppStore((s) => s.notes);
const topicNotes = useAppStore((s) => s.topicNotes);
const customQuestions = useAppStore((s) => s.customQuestions);
const candidate = useAppStore((s) => s.candidate);

// Assemble V3Session shape to pass to buildAiPrompt
// (session id not needed by buildAiPrompt — only scoring fields)

// Trigger button (after session switcher, before <hr>):
// id="open-ai-prompt" (focus restore target per CONTEXT.md)
```

**Trigger position in ActionsGroup JSX (VERIFIED from current source):**
Current order: session label → Switch session → `<hr>` → Expand all → Collapse all → Hide marked topics → Dark mode toggle → Candidate details → Reset all.

New order: session label → Switch session → **AI feedback prompt** → `<hr>` → Expand all → Collapse all → Hide marked topics → Dark mode toggle → Candidate details → Reset all.

The `<hr>` separates session-management buttons from view-control buttons. The AI prompt trigger goes between "Switch session" and the `<hr>`, per CONTEXT.md: "after the session switcher button and before the Reset button."

### Pattern 4: Clipboard Copy Handler

**What:** Call `navigator.clipboard.writeText` in click handler, handle Promise result with `.then`/`.catch`/`.finally`.

**Implementation (VERIFIED pattern for MV3 full-page tab):**
```typescript
// Source: AI-02 requirement + CONTEXT.md specifics block
// navigator.clipboard is available in chrome-extension:// full-page tab with no extra permission
// The Promise is initiated in a user-gesture handler — writeText resolves asynchronously
// but the gesture context is valid for the duration of the microtask chain

function handleCopy() {
  if (isPending) return;
  setIsPending(true);
  navigator.clipboard.writeText(editablePrompt)
    .then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
    .catch(() => {
      // Fallback: select all text for manual copy
      textareaRef.current?.select();
      setShowFallback(true);
    })
    .finally(() => {
      setIsPending(false);
    });
}
```

### Anti-Patterns to Avoid

- **Setting `open` attribute on `<dialog>`:** Always call `.showModal()` imperatively. Never `<dialog open>`. [VERIFIED: src/components/ImportPreviewModal.tsx comment T-05-03-04]
- **Calling `buildAiPrompt` inside the modal component:** The modal is prop-driven; it receives `prompt` as a string. Calling the utility inside the modal would create a hidden store dependency. Call in ActionsGroup before `.showModal()`.
- **Using `async/await` at the click handler call site:** The handler is synchronous at invocation — `.writeText()` returns a Promise which is handled via `.then/.catch/.finally`. Using `await` would require marking `handleCopy` as `async`, which is fine, but the existing project convention uses Promise chains for this pattern (see `handleReset` in `ResetConfirmDialog.tsx` which uses `void handleReset()`). Either is correct; keep consistent.
- **Omitting the WR-02 focus trap guard (`if (focusable.length === 0) return`):** ImportPreviewModal and CandidateModal both include this guard. Copy it verbatim.
- **Using `readOnly` on the textarea:** CONTEXT.md explicitly states the textarea is editable. No `readOnly` attribute.
- **Resetting `editablePrompt` on every render:** Only reset in the `useEffect([prompt])` hook when the `prompt` prop changes. The user should be able to freely edit without resets.
- **Requiring `clipboardWrite` permission in manifest.json:** The extension uses a full-page tab (`chrome.tabs.create`). The page origin is `chrome-extension://`, which has clipboard access in Chrome MV3 without declaring `clipboardWrite`. Adding it would trigger CWS permission review. [ASSUMED — confirmed by Chrome extension architecture; no `clipboardWrite` permission in manifest.json]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap within dialog | Custom Tab/keydown interceptor from scratch | Copy verbatim from `ImportPreviewModal.tsx` | Already tested, handles edge cases, includes WR-02 guard |
| Dialog open/close | `useState(isOpen)` + conditional render | Native `<dialog>.showModal()` / `.close()` | Native dialog handles ESC, backdrop, accessibility |
| Textarea initial value on prop change | `key` prop trick to remount | `useEffect([prompt])` → `setEditablePrompt(prompt)` | Key remount loses focus; useEffect is the established project pattern |
| Score computation for display | Inline weighted average in buildAiPrompt | `computeTopicMark(topic, session.scores, session.overrides[topic.id])` from scoring.ts | Reuses the tested, correct weighted-average engine |
| Difficulty coefficient table | Hardcode `{ novice: 1.0, ... }` in buildAiPrompt | `DIFFICULTY_COEFFICIENTS` from `src/data/bank/types.ts` | Single source of truth; already defined |

**Key insight:** This phase is almost entirely composition of existing pieces. `buildAiPrompt.ts` is the only net-new logic — everything else is a verbatim copy or minor extension of existing components.

---

## Common Pitfalls

### Pitfall 1: Clipboard API availability in Chrome extension context

**What goes wrong:** Developer wraps `navigator.clipboard.writeText` in a try/catch or checks `'clipboard' in navigator` expecting it to be unavailable in a Chrome extension page.

**Why it happens:** Confusion between `chrome.runtime` background service workers (no DOM, no clipboard API) and the full-page tab (regular browser page with full Web APIs). The extension's full-page tab at `chrome-extension://` origin has clipboard access like any HTTPS page.

**How to avoid:** Call `navigator.clipboard.writeText` directly. Handle failure in `.catch()` (covers both API unavailability and permission denial). No `clipboardWrite` manifest permission required for extension's own pages. [ASSUMED — Chrome extension architecture; manifest.json confirmed to have only `"storage"` permission]

**Warning signs:** Adding `"clipboardWrite"` to `manifest.json` permissions — this is unnecessary and triggers CWS review.

### Pitfall 2: Score key format mismatch

**What goes wrong:** `buildAiPrompt` constructs score keys using a topic index or question text instead of `${topic.id}-${questionIndex}`, producing all null lookups.

**Why it happens:** The key format isn't obvious from the types. `scores` is typed as `Record<string, number | null>` with no schema enforcement on the key shape.

**How to avoid:** Use `topic.questions.forEach((q, index) => { const key = \`${topic.id}-${index}\` })`. This is the identical pattern used in `src/scoring/scoring.ts` (line 52) and `src/utils/yamlExport.ts` (line 39). [VERIFIED: src/scoring/scoring.ts line 52, src/utils/yamlExport.ts line 39]

**Warning signs:** All questions show "No scores yet" even when scores exist in the session.

### Pitfall 3: Custom question score key

**What goes wrong:** Using `${topic.id}-${index}` for custom questions instead of `cq.id` directly.

**Why it happens:** Custom questions are stored in `session.customQuestions[]` with their own `id` field (e.g., `"custom-twig-1"`). Their scores are stored under that `id` directly, not under a positional index key.

**How to avoid:** For custom questions: `session.scores[cq.id]` and `session.notes[cq.id]`. [VERIFIED: src/utils/yamlExport.ts lines 44-46]

**Warning signs:** Custom question scores always read as null in the prompt.

### Pitfall 4: Textarea state reset timing

**What goes wrong:** `editablePrompt` is initialized from `prompt` prop in `useState(prompt)` but never updated when `prompt` changes because `useState` only uses the initial value on mount.

**Why it happens:** React `useState` ignores subsequent prop value changes. If the user opens the modal, closes it, then opens it for a different session (with a different `prompt`), the textarea still shows the old content.

**How to avoid:** Use `useEffect(() => { setEditablePrompt(prompt); }, [prompt])` — the identical pattern used in `ImportPreviewModal.tsx` for `useEffect([preview])`. [VERIFIED: src/components/ImportPreviewModal.tsx lines 20-25]

**Warning signs:** Textarea shows stale prompt text after closing and reopening the modal.

### Pitfall 5: ActionsGroup mock must be updated in tests

**What goes wrong:** `ActionsGroup.test.tsx` mocks the store via `vi.mock('../store/app.js')`. When `ActionsGroup` starts reading `scores`, `overrides`, `notes`, `topicNotes`, `customQuestions`, and `candidate` from the store, the existing mock selector will return `undefined` for these fields.

**Why it happens:** The existing `mockUseAppStore.mockImplementation` at `ActionsGroup.test.tsx` line 36 returns a fixed object. New store fields accessed by the selector are not in that object.

**How to avoid:** Extend the mock state object in `ActionsGroup.test.tsx` to include `scores: {}`, `overrides: {}`, `notes: {}`, `topicNotes: {}`, `customQuestions: []`, `candidate: null`. [VERIFIED: src/components/ActionsGroup.test.tsx lines 33-47]

**Warning signs:** `TypeError: Cannot read properties of undefined` in ActionsGroup tests.

### Pitfall 6: isPending guard on Close button

**What goes wrong:** Only the Copy button checks `disabled={isPending}` but the Close button also closes the dialog. If the user clicks Close while a clipboard write is in flight, the dialog closes before `finally` fires.

**Why it happens:** The `isPending` window is short (clipboard write resolves in <100ms in practice), but the pattern in `ImportPreviewModal` is to disable Cancel while pending too. The Close button in this modal corresponds to Cancel in ImportPreviewModal.

**How to avoid:** Apply `disabled={isPending}` to the Close button as well, matching `ImportPreviewModal.tsx` line 156. [VERIFIED: src/components/ImportPreviewModal.tsx line 156]

---

## Code Examples

### buildAiPrompt.ts — Full skeleton

```typescript
// Source: pattern from src/utils/yamlExport.ts + CONTEXT.md section order

import type { Section } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';
import type { V3Session } from '../storage/types.js';
import { computeTopicMark } from '../scoring/scoring.js';

export function buildAiPrompt(session: V3Session, sections: Section[]): string {
  const lines: string[] = [];

  // ── Block 1: Candidate ──────────────────────────────────────────────────
  const c = session.candidate;
  lines.push('# Interview Feedback Request');
  lines.push('');
  lines.push(`Candidate: ${c?.name || '(not set)'}`);
  lines.push(`Role: ${c?.role || '(not set)'}`);
  lines.push(`Date: ${c?.date || '(not set)'}`);
  lines.push(`Interviewer: ${c?.interviewer || '(not set)'}`);
  if (c?.details) lines.push(`Notes: ${c.details}`);
  lines.push('');

  // ── Block 2: Per-section / per-topic scoring ────────────────────────────
  for (const section of sections) {
    lines.push(`## ${section.label}`);
    lines.push('');

    for (const topic of section.items) {
      const result = computeTopicMark(
        topic,
        session.scores,
        session.overrides[topic.id] ?? undefined,
      );

      // Difficulty note (one sentence per CONTEXT.md)
      const maxCoef = Math.max(
        ...topic.questions.map((q) => DIFFICULTY_COEFFICIENTS[q.level]),
      );
      const diffLevel = Object.entries(DIFFICULTY_COEFFICIENTS).find(
        ([, v]) => v === maxCoef,
      )?.[0] ?? 'novice';
      const diffLabel = diffLevel.charAt(0).toUpperCase() + diffLevel.slice(1);

      const markDisplay =
        result.mark !== null ? result.mark.toFixed(1) : 'No scores yet';

      lines.push(`### ${topic.name}`);
      lines.push(`Mark: ${markDisplay} (${result.scoredCount}/${result.totalCount} scored)`);
      lines.push(`Difficulty: ${diffLabel} — weighted ${maxCoef}×`);
      lines.push('');

      // Bank questions
      topic.questions.forEach((q, index) => {
        const key = `${topic.id}-${index}`;
        const score = session.scores[key];
        const note = session.notes[key] ?? '';
        const scoreStr = typeof score === 'number' ? String(score) : 'skipped';
        lines.push(`- [${scoreStr}] ${q.q}`);
        if (note) lines.push(`  Note: ${note}`);
      });

      // Custom questions inline after bank questions
      const customs = session.customQuestions.filter(
        (cq) => cq.topicId === topic.id,
      );
      for (const cq of customs) {
        const score = session.scores[cq.id];
        const note = session.notes[cq.id] ?? '';
        const scoreStr = typeof score === 'number' ? String(score) : 'skipped';
        lines.push(`- [${scoreStr}] (custom) ${cq.text}`);
        if (note) lines.push(`  Note: ${note}`);
      }

      if (session.topicNotes[topic.id]) {
        lines.push(`Topic notes: ${session.topicNotes[topic.id]}`);
      }
      lines.push('');
    }
  }

  // ── Block 3: Task spec ──────────────────────────────────────────────────
  lines.push('---');
  lines.push('## Task');
  lines.push(
    'Based on the scored interview above, write a structured feedback summary. ' +
    'Include: overall impression, strongest topics, areas needing improvement, ' +
    'and a hiring recommendation. Use the difficulty weights to contextualize performance.',
  );

  return lines.join('\n');
}
```

### AiPromptModal.tsx — Copy handler with fallback

```typescript
// Source: AI-02 requirement + CONTEXT.md specifics + 08-UI-SPEC.md interaction contract
function handleCopy() {
  if (isPending) return;
  setIsPending(true);
  navigator.clipboard.writeText(editablePrompt)
    .then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
    .catch(() => {
      textareaRef.current?.select();
      setShowFallback(true);
    })
    .finally(() => {
      setIsPending(false);
    });
}
```

### AiPromptModal.test.tsx — Clipboard mock pattern

```typescript
// Source: Vitest docs + happy-dom environment (vitest.config.ts line 10)
// happy-dom provides navigator.clipboard stub; must be mocked explicitly

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});
```

### buildAiPrompt.test.ts — Test structure (TDD)

```typescript
// Source: pattern from src/utils/yamlExport.test.ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import type { V3Session } from '../storage/types.js';
import { buildAiPrompt } from './buildAiPrompt.js';

const minimalSession: V3Session = {
  version: 3, id: 'test', scores: {}, overrides: {},
  notes: {}, topicNotes: {}, customQuestions: [], candidate: null,
};

describe('buildAiPrompt — structure', () => {
  it('returns a string', () => {
    expect(typeof buildAiPrompt(minimalSession, DEFAULT_SECTIONS)).toBe('string');
  });
  it('includes "No scores yet" when session has no scores', () => {
    expect(buildAiPrompt(minimalSession, DEFAULT_SECTIONS)).toContain('No scores yet');
  });
  it('includes "(not set)" when candidate is null', () => {
    expect(buildAiPrompt(minimalSession, DEFAULT_SECTIONS)).toContain('(not set)');
  });
});
// ... scored questions, custom questions, candidate name, difficulty note, task spec
```

---

## TDD Approach

### What to test in `buildAiPrompt.test.ts`

This is a pure function with no side effects. All behavior is verifiable via string assertions.

| Test | Assertion | Fixture |
|------|-----------|---------|
| Returns string | `typeof result === 'string'` | minimal session |
| Empty session — no scores | contains `"No scores yet"` | `scores: {}` |
| Empty session — no candidate | contains `"(not set)"` | `candidate: null` |
| Scored question appears | contains score value (e.g., `[8]`) | `scores: { 'twig-0': 8 }` |
| Unscored question appears | contains `[skipped]` | score absent for question |
| Custom question appears | contains custom text + score | customQuestions with score |
| Custom question score key | `session.scores[cq.id]` (not positional) | `scores: { 'custom-twig-1': 7 }` |
| Difficulty note per topic | contains `"weighted 1.5×"` for advanced topic | any advanced-heavy topic |
| Candidate name embedded | contains candidate name string | `candidate: { name: 'Alice' }` |
| Topic notes embedded | contains topic note text | `topicNotes: { 'twig': 'good' }` |
| Per-question notes embedded | contains note text | `notes: { 'twig-0': 'needs work' }` |
| Task spec block present | contains `"## Task"` | any session |
| Section headings present | contains `"##"` section labels | DEFAULT_SECTIONS |

### What to test in `AiPromptModal.test.tsx`

This is a prop-driven component. Test behavior, not implementation.

| Test | Assertion | Setup |
|------|-----------|-------|
| Renders prompt in textarea | textarea has prompt text | `prompt="hello"` prop |
| Textarea is editable | change event updates displayed value | fire change event |
| Copy button calls clipboard.writeText | `vi.fn()` called with current text | mock clipboard, click copy |
| "Copied!" flash appears after copy | `getByText(/Copied!/)` visible | click copy, wait |
| "Copied!" flash disappears after 2s | element absent after `vi.useFakeTimers()` + advance 2s | fake timers |
| Clipboard failure shows fallback text | `getByText(/Select all and copy manually/)` | mock writeText to reject |
| Close button calls onClose | `onClose` mock called | click close |
| Textarea resets when prompt prop changes | textarea shows new prompt | re-render with different prompt |
| isPending disables copy button | `copy button disabled` | mock writeText to never resolve |

**Note on `copied` flash test:** Use `vi.useFakeTimers()` for the 2-second timeout test. See `UndoToast.test.tsx` in the project for an existing example of fake timer usage in this codebase.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Chrome 66 (2018) | Async, Promise-based; `execCommand` deprecated |
| `<dialog open>` attribute | `.showModal()` imperative | HTML living standard | `open` skips native modal behavior; `.showModal()` enables backdrop + ESC |
| Uncontrolled textarea (`defaultValue`) | Controlled textarea (`value` + `onChange`) | React 16+ convention | Controlled allows prop-driven reset via `useEffect` |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated in all major browsers. Chrome removed it from cross-origin frames. Do not use.
- Setting `open` prop on `<dialog>` in React: This bypasses the native modal stack. The project uses `.showModal()` imperatively throughout.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `navigator.clipboard.writeText` works in a `chrome-extension://` full-page tab without `clipboardWrite` manifest permission | Pitfall 1, Copy handler | If wrong: copy fails for all users; fallback kicks in immediately. Fix: add `"clipboardWrite"` to manifest permissions (triggers CWS re-review but is safe) |
| A2 | The dominant difficulty level for a topic can be inferred from `Math.max(...topic.questions.map(q => DIFFICULTY_COEFFICIENTS[q.level]))` | buildAiPrompt skeleton | If wrong: difficulty note displays incorrect level. Fix: reconsider how to label topic difficulty |
| A3 | happy-dom test environment supports `navigator.clipboard` (stubbed or undefined) — must be mocked via `Object.defineProperty` in tests | AiPromptModal.test.tsx pattern | If wrong: tests throw on clipboard access. Fix: use `vi.stubGlobal` or `globalThis.navigator.clipboard = ...` alternative |

**If this table is empty:** N/A — three assumptions documented above.

---

## Open Questions

1. **Task spec block content — fixed vs dynamic**
   - What we know: CONTEXT.md marks this as "Claude's Discretion"
   - What's unclear: Whether the task spec should reference the candidate's actual role/overall mark in its wording, or remain a fixed generic template
   - Recommendation: Use a fixed template for Phase 8 (simpler, easier to test). Inject candidate role if `session.candidate?.role` is non-empty.

2. **Dominant difficulty per topic**
   - What we know: Topics have mixed difficulty questions (e.g., a topic might have 3 novice + 2 expert questions)
   - What's unclear: Should the per-topic difficulty note reflect the highest coefficient present, the modal coefficient, or the average?
   - Recommendation: Use the highest-coefficient difficulty level present in the topic's questions. This matches how `DIFFICULTY_COEFFICIENTS` is used in scoring (each question is individually weighted). Example: "difficulty: Expert — weighted 1.75× (max)".

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `navigator.clipboard` | AI-02 copy button | ✓ (chrome-extension:// page) | Web API (Chrome 66+, extension min 116) | textarea.select() — already coded |
| `<dialog>` element | Modal rendering | ✓ (Chrome 116+) | Native HTML | — |
| `happy-dom` | Test environment | ✓ (vitest.config.ts) | (installed) | — |
| `@testing-library/react` | Component tests | ✓ (installed) | (installed) | — |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none — all dependencies are present.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed, vitest.config.ts) |
| Config file | `vitest.config.ts` — `environment: 'happy-dom'`, `setupFiles: ['./src/test/setup.ts']` |
| Quick run command | `npx vitest run src/utils/buildAiPrompt.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | buildAiPrompt generates correct prompt from V3Session | unit | `npx vitest run src/utils/buildAiPrompt.test.ts` | ❌ Wave 0 |
| AI-01 | AiPromptModal renders prompt in textarea | component | `npx vitest run src/components/AiPromptModal.test.tsx` | ❌ Wave 0 |
| AI-02 | Copy button calls navigator.clipboard.writeText | component | `npx vitest run src/components/AiPromptModal.test.tsx` | ❌ Wave 0 |
| AI-02 | Clipboard failure shows fallback instruction + selects textarea | component | `npx vitest run src/components/AiPromptModal.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/utils/buildAiPrompt.test.ts src/components/AiPromptModal.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/utils/buildAiPrompt.test.ts` — covers AI-01 (pure function RED tests)
- [ ] `src/components/AiPromptModal.test.tsx` — covers AI-01 (modal renders prompt) and AI-02 (clipboard + fallback)
- [ ] `src/utils/buildAiPrompt.ts` — stub returning `''` for RED phase

*(Framework already installed — zero new dependencies needed for testing.)*

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — extension has no auth |
| V3 Session Management | no | N/A — sessions are local storage |
| V4 Access Control | no | N/A — single-user local tool |
| V5 Input Validation | yes (low risk) | Candidate name/notes are embedded as-is in the prompt — plaintext output only, no HTML/DOM injection risk |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via candidate data embedded in prompt | Tampering | Not applicable — prompt is a plain string copied to clipboard, never rendered as HTML |
| Clipboard hijacking (another extension reads clipboard) | Information Disclosure | Not a product concern; prompt contains no secrets beyond candidate name/notes |
| Prompt injection if AI tool treats clipboard as trusted input | Tampering | Out of scope for Phase 8; the prompt is tool-agnostic plaintext |

**Security verdict:** Phase 8 presents no ASVS Level 1 security concerns. The feature produces a plain string and writes it to the clipboard. No untrusted HTML is rendered, no network calls are made, no new permissions are requested.

---

## Sources

### Primary (HIGH confidence)
- `src/utils/yamlExport.ts` — score key format `${topicId}-${index}`, custom question key `cq.id`, export structure pattern
- `src/scoring/scoring.ts` — `computeTopicMark` signature, score key format (line 52), `DIFFICULTY_COEFFICIENTS` usage
- `src/data/bank/types.ts` — `DIFFICULTY_COEFFICIENTS` values, `Section`/`Topic`/`Question` types
- `src/storage/types.ts` — `V3Session` complete field inventory
- `src/components/ImportPreviewModal.tsx` — focus trap pattern, `isPending` guard, `dialogRef` pattern, `useEffect([preview])` reset pattern
- `src/components/ActionsGroup.tsx` — current button order, existing `useRef` pattern, store selector pattern
- `src/components/ActionsGroup.test.tsx` — existing mock setup needing extension
- `.planning/phases/08-ai-prompt-modal/08-CONTEXT.md` — all locked decisions
- `.planning/phases/08-ai-prompt-modal/08-UI-SPEC.md` — props interface, dialog structure, color tokens, interaction contract
- `manifest.json` — confirmed `"permissions": ["storage"]` only; no `clipboardWrite`
- `vitest.config.ts` + `src/test/setup.ts` — test environment: happy-dom, setupFiles, coverage config

### Secondary (MEDIUM confidence — training knowledge)
- Chrome MV3 clipboard behavior in extension full-page tabs [ASSUMED A1]

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed and in use
- Architecture: HIGH — verified from codebase; follows exact established patterns
- Score key format: HIGH — verified from two independent sources (scoring.ts + yamlExport.ts)
- Clipboard behavior: MEDIUM — confirmed from manifest.json (no permission needed) + Chrome extension architecture knowledge (A1 tagged ASSUMED)
- Pitfalls: HIGH — all verified from actual source files in the project

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable stack — no fast-moving dependencies)
