# Phase 16: Bug Fixes & Dark Mode Polish - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 7 (5 source components + 2 test files)
**Analogs found:** 7 / 7 (all files are modifications of existing files — each file IS its own analog)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/components/ContentTree.tsx` | component | event-driven | `src/components/ContentTree.tsx` (self) | exact — owns virtualizer, must add `useEffect` scroll-after-add |
| `src/components/AddSectionForm.tsx` | component | request-response | `src/components/AddTopicForm.tsx` | exact — same form-submit + `onDismiss` pattern |
| `src/components/AddTopicForm.tsx` | component | request-response | `src/components/AddSectionForm.tsx` | exact — same form-submit + `onDismiss` pattern |
| `src/components/QuestionCard.tsx` | component | event-driven | `src/components/QuestionCard.tsx` (self) | exact — owns `notesOpen` toggle, score select |
| `src/components/CustomQuestionForm.tsx` | component | request-response | `src/components/AddSectionForm.tsx` | role-match — same inline form pattern |
| `src/components/QuestionCard.test.tsx` | test | — | `src/components/CustomQuestionForm.test.tsx` | exact — same Vitest/Testing Library setup |
| `src/components/CustomQuestionForm.test.tsx` | test | — | `src/components/QuestionCard.test.tsx` | exact — same Vitest/Testing Library setup |

---

## Pattern Assignments

### `src/components/ContentTree.tsx` (BUG-01 / BUG-02)

**Change:** Add `useRef` to track previous `rows.length`, add `useEffect` that fires `rowVirtualizer.scrollToIndex` when rows grow.

**Current imports** (lines 1–9) — `useRef` is already imported, `useEffect` is NOT — must be added:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useState } from 'react';   // ADD useEffect here
import { useAppStore } from '../store/app.js';
import type { VirtualRow } from '../utils/buildFlatRows.js';
import { AddSectionForm } from './AddSectionForm.js';
import { AddTopicForm } from './AddTopicForm.js';
import { QuestionCard } from './QuestionCard.js';
import { SectionRow } from './SectionRow.js';
import { TopicRow } from './TopicRow.js';
```

**Current virtualizer setup** (lines 38–45) — `rowVirtualizer` ref to pass to `scrollToIndex`:
```typescript
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) => ESTIMATE_SIZE[rows[index].type],
  measureElement: (el) => el.getBoundingClientRect().height,
  overscan: 10,
  useFlushSync: false,
});
```

**Scroll-after-add pattern to insert** (after `rowVirtualizer` declaration, before return):
```typescript
// BUG-01/BUG-02: scroll to newly added row after rows prop grows
const prevRowsLength = useRef(rows.length);
useEffect(() => {
  if (rows.length > prevRowsLength.current) {
    // BUG-01: new section row is just before the add-section-trigger (last row)
    const addSectionTriggerIdx = rows.findIndex(r => r.type === 'add-section-trigger');
    if (addSectionTriggerIdx > 0 && rows.length - prevRowsLength.current === 1) {
      // Check whether growth was a section (trigger is near end) or a topic
      const newSectionRow = rows[addSectionTriggerIdx - 1];
      const prevAddSectionTriggerWasAlsoLast = prevRowsLength.current === addSectionTriggerIdx;
      if (prevAddSectionTriggerWasAlsoLast && newSectionRow?.type === 'section') {
        rowVirtualizer.scrollToIndex(addSectionTriggerIdx - 1, { align: 'start', behavior: 'auto' });
      } else {
        // BUG-02: new topic — find the add-topic-trigger and scroll to row before it
        // The newly added topic row is at triggerIdx - 1 for its section
        // Use a simpler heuristic: scroll to rows.length - 2 covers most cases;
        // planner should verify exact index via findIndex on add-topic-trigger for the open sectionId
        rowVirtualizer.scrollToIndex(rows.length - 2, { align: 'start', behavior: 'auto' });
      }
    }
  }
  prevRowsLength.current = rows.length;
}, [rows.length, rowVirtualizer, rows]);
```

**Current add-section-trigger render** (lines 89–101) — no change needed here; scroll is driven by `useEffect`:
```typescript
{row.type === 'add-section-trigger' && (
  addSectionOpen ? (
    <AddSectionForm onDismiss={() => setAddSectionOpen(false)} />
  ) : (
    <button
      type="button"
      onClick={() => setAddSectionOpen(true)}
      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-4 py-2 print:hidden"
    >
      + Add section
    </button>
  )
)}
```

**Current add-topic-trigger render** (lines 102–117) — no change needed here either:
```typescript
{row.type === 'add-topic-trigger' && (
  addTopicOpenFor === row.sectionId ? (
    <AddTopicForm
      sectionId={row.sectionId}
      onDismiss={() => setAddTopicOpenFor(null)}
    />
  ) : (
    <button
      type="button"
      onClick={() => setAddTopicOpenFor(row.sectionId)}
      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none px-8 py-2 print:hidden"
    >
      + Add topic
    </button>
  )
)}
```

**Anti-pattern:** Do NOT call `scrollToIndex` synchronously inside `AddSectionForm.handleSubmit` or `AddTopicForm.handleSubmit`. The `rows` prop has not updated yet at that point — the Zustand mutation is synchronous but React's re-render is batched. The `useEffect` watching `rows.length` is the correct timing boundary.

---

### `src/components/AddSectionForm.tsx` (BUG-01)

**Change:** No changes required if using the `useEffect`-in-ContentTree approach (recommended). The form's `handleSubmit` already calls `addSection(...)` then `onDismiss()` — ContentTree's `useEffect` catches the rows growth.

**Current submit pattern** (lines 13–25) — reference only, no edits:
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (name.trim() === '') return;
  addSection({
    id: `custom-section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: name.trim(),
    icon: icon.trim() || '🔧',
    isDefault: false,
    topics: [],
  });
  onDismiss();
}
```

**Current Props interface** (lines 4–6) — shown for reference if planner opts for `onAdded` callback approach instead:
```typescript
interface Props {
  onDismiss: () => void;
}
```

If `onAdded` callback approach is chosen (alternative to `useEffect`), extend Props:
```typescript
interface Props {
  onDismiss: () => void;
  onAdded?: () => void;   // ContentTree calls after re-render; form does NOT compute the index
}
```

---

### `src/components/AddTopicForm.tsx` (BUG-02)

**Change:** No changes required if using the `useEffect`-in-ContentTree approach. Same pattern as `AddSectionForm`.

**Current submit pattern** (lines 14–27) — reference only:
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (name.trim() === '') return;
  addTopic(sectionId, {
    id: `custom-topic-${sectionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    desc: desc.trim(),
    tag: '',
    isDefault: false,
    questions: [],
  });
  onDismiss();
}
```

**BUG-02 extra concern — section auto-expand before scroll:** The parent section must be expanded for `buildFlatRows` to emit topic rows. If the section is collapsed when the user opens the Add Topic form, `ContentTree` must call `toggleSectionOpen(sectionId)` before the topic is added so the `add-topic-trigger` row exists in `rows`. Planner should verify whether `addTopicOpenFor` state being set already implies the section is expanded, or whether an explicit expand is needed in the `onClick` handler for the add-topic button.

---

### `src/components/QuestionCard.tsx` (BUG-03 + POL-01)

**BUG-03 — className toggle for textarea hide/show:**

Current broken implementation (line 136):
```typescript
hidden={!notesOpen && !printMode}
```

Replace with className-based toggle. Current className (lines 138–139):
```typescript
className="w-full resize-y min-h-[64px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mx-3 mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0"
```

After fix — remove `hidden={...}` attribute, merge visibility into className:
```typescript
<textarea
  id={`notes-${questionId}`}
  aria-label={`Notes for ${question.q}`}
  value={localNote}
  onChange={(e) => handleNoteChange(e.target.value)}
  placeholder="Question notes…"
  className={`w-full resize-y min-h-[64px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mx-3 mb-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 print:h-auto print:overflow-visible print:resize-none print:border-0 print:p-0${!notesOpen && !printMode ? ' hidden' : ''}`}
  style={{ width: 'calc(100% - 1.5rem)' }}
/>
```

Note: `localNote` content is NOT cleared on close — only `notesOpen` toggles. The store write path via `handleNoteChange` is unchanged.

**POL-01 — score select dark mode:**

Current score select className (line 68) — missing `dark:[color-scheme:dark]`:
```typescript
className="text-xs font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 min-w-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

After fix — append `dark:[color-scheme:dark]`:
```typescript
className="text-xs font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 min-w-[52px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
```

**Current note icon toggle for reference** (lines 91–100) — no change needed here:
```typescript
<button
  type="button"
  aria-label={`Toggle note for ${question.q}`}
  aria-expanded={notesOpen}
  aria-controls={`notes-${questionId}`}
  onClick={() => setNotesOpen((prev) => !prev)}
  className={`p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${notesOpen || localNote ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
>
  📝
</button>
```

---

### `src/components/CustomQuestionForm.tsx` (POL-01)

**Change:** Update the difficulty `<select>` className to match the standard dark-select pattern and add `dark:[color-scheme:dark]`.

Current difficulty select (lines 41–51):
```typescript
<select
  aria-label="Question difficulty"
  value={level}
  onChange={(e) => setLevel(e.target.value as Difficulty)}
  className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
```

After fix — align bg/border to standard gray-100/gray-700/gray-300/gray-600 pattern and add `dark:[color-scheme:dark]`:
```typescript
<select
  aria-label="Question difficulty"
  value={level}
  onChange={(e) => setLevel(e.target.value as Difficulty)}
  className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:[color-scheme:dark]"
>
```

Changes summary: `bg-white` → `bg-gray-100`, `dark:bg-gray-800` → `dark:bg-gray-700`, `border-gray-200` → `border-gray-300`, `dark:border-gray-700` → `dark:border-gray-600`, add `dark:[color-scheme:dark]`.

---

### `src/components/QuestionCard.test.tsx` (BUG-03 + POL-01 test updates)

**Existing test setup pattern** (lines 1–44) — copy this structure for any new assertions:
```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionCard } from './QuestionCard.js';

vi.mock('../store/app.js', () => ({ useAppStore: vi.fn() }));
import { useAppStore } from '../store/app.js';
const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    scores: {},
    notes: {},
    setScore: vi.fn(),
    setNote: vi.fn(),
    deleteCustomQuestion: vi.fn(),
    removeDefaultQuestion: vi.fn(),
    printMode: false,
    hideNotes: false,
    ...overrides,
  };
}
```

**BUG-03 — existing test to UPDATE** (line 163–171):

Current assertion to replace:
```typescript
it('clicking note icon button shows the textarea', () => {
  render(<QuestionCard row={mockRow} />);
  const btn = screen.getByRole('button', { name: /Toggle note for What is JSX\?/ });
  fireEvent.click(btn);
  const textarea = screen.getByLabelText('Notes for What is JSX?');
  expect(textarea).not.toHaveAttribute('hidden');  // <-- REMOVE THIS
});
```

Replace with class-based assertion + add closed-state assertion:
```typescript
it('clicking note icon button shows the textarea (className toggle, not hidden attribute)', () => {
  render(<QuestionCard row={mockRow} />);
  const textarea = screen.getByLabelText('Notes for What is JSX?');
  // Initially closed — textarea should have 'hidden' class
  expect(textarea.className).toContain('hidden');

  const btn = screen.getByRole('button', { name: /Toggle note for What is JSX\?/ });
  fireEvent.click(btn);
  // After click — textarea should NOT have 'hidden' class
  expect(textarea.className).not.toContain('hidden');
  // HTML hidden attribute must NOT be present (className toggle, not attribute)
  expect(textarea).not.toHaveAttribute('hidden');
});
```

**POL-01 — new assertion for score select dark class:**
```typescript
it('score select has dark:[color-scheme:dark] class for dark mode option legibility', () => {
  render(<QuestionCard row={mockRow} />);
  const select = screen.getByRole('combobox', { name: /What is JSX\? score/ });
  expect(select.className).toContain('[color-scheme:dark]');
});
```

---

### `src/components/CustomQuestionForm.test.tsx` (POL-01 test update)

**Existing test setup pattern** (lines 1–24) — follow exactly for new assertions:
```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomQuestionForm } from './CustomQuestionForm.js';

vi.mock('../store/app.js', () => ({ useAppStore: vi.fn() }));
import { useAppStore } from '../store/app.js';
const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

describe('CustomQuestionForm', () => {
  const addCustomQuestion = vi.fn();
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ addCustomQuestion }),
    );
  });
```

**POL-01 — new assertions for difficulty select dark mode:**
```typescript
it('difficulty select has dark:[color-scheme:dark] class', () => {
  render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
  const select = screen.getByLabelText('Question difficulty');
  expect(select.className).toContain('[color-scheme:dark]');
});

it('difficulty select uses standard dark bg/border pattern (dark:bg-gray-700, dark:border-gray-600)', () => {
  render(<CustomQuestionForm topicId="react" onDismiss={onDismiss} />);
  const select = screen.getByLabelText('Question difficulty');
  expect(select.className).toContain('dark:bg-gray-700');
  expect(select.className).toContain('dark:border-gray-600');
});
```

---

## Shared Patterns

### Zustand Granular Selector Pattern
**Source:** `src/components/QuestionCard.tsx` lines 16–30
**Apply to:** All components — never pass the whole store, always use per-field selectors.
```typescript
const score = useAppStore((s) => s.scores[questionId] ?? null);
const storedNote = useAppStore((s) => s.notes[questionId] ?? '');
const setScore = useAppStore((s) => s.setScore);
const setNote = useAppStore((s) => s.setNote);
```

### Tailwind Dark Mode Prefix Pattern
**Source:** Throughout all component files
**Apply to:** All class strings — `dark:` prefix for all dark-mode overrides, never inline style or CSS variables.
```typescript
// Standard input/select dark classes:
// bg-gray-100 dark:bg-gray-700
// border-gray-300 dark:border-gray-600
// text-gray-900 dark:text-gray-100
// Standard form container dark:
// bg-gray-50 dark:bg-gray-800/50
// border-gray-200 dark:border-gray-700
```

### Standard Select Element Dark Mode (POL-01 Standard)
**Source:** `src/components/QuestionCard.tsx` line 68 (after fix)
**Apply to:** All `<select>` elements — `QuestionCard.tsx` and `CustomQuestionForm.tsx`
```typescript
// Standard dark select class combination:
"... bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ... dark:[color-scheme:dark]"
// The dark:[color-scheme:dark] is REQUIRED for <option> list legibility in dark mode.
// Without it, the OS renders the native dropdown with light-theme styling
// regardless of bg/text classes applied to the <select> element itself.
```

### Inline Form Submit + onDismiss Pattern
**Source:** `src/components/AddSectionForm.tsx` lines 13–25 and `src/components/AddTopicForm.tsx` lines 14–27
**Apply to:** Any inline form component rendered inside a virtualizer row.
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (name.trim() === '') return;
  storeMutation(...);
  onDismiss();  // Parent handles all side effects (scroll, state close) via useEffect
}
```

### Test Mock Pattern (Vitest + Testing Library)
**Source:** `src/components/QuestionCard.test.tsx` lines 1–44 and `src/components/CustomQuestionForm.test.tsx` lines 1–24
**Apply to:** All component test files in this phase.
```typescript
vi.mock('../store/app.js', () => ({ useAppStore: vi.fn() }));
import { useAppStore } from '../store/app.js';
const mockUseAppStore = useAppStore as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ /* relevant store slice */ }),
  );
});
```

---

## No Analog Found

None. All files are existing files being modified. All patterns are sourced from the codebase directly.

---

## Implementation Order Recommendation

Per RESEARCH.md primary recommendation:
1. **BUG-03** first (`QuestionCard.tsx` textarea className toggle — self-contained)
2. **POL-01** second (`QuestionCard.tsx` + `CustomQuestionForm.tsx` class additions — pure class edits)
3. **BUG-01/BUG-02** last (`ContentTree.tsx` `useEffect` scroll wiring — requires careful row-index reasoning)
4. **Test updates** after each fix

---

## Metadata

**Analog search scope:** `src/components/`
**Files read:** `ContentTree.tsx`, `QuestionCard.tsx`, `AddSectionForm.tsx`, `AddTopicForm.tsx`, `CustomQuestionForm.tsx`, `QuestionCard.test.tsx` (lines 1–60, 155–184), `CustomQuestionForm.test.tsx` (lines 1–50)
**Pattern extraction date:** 2026-06-18
