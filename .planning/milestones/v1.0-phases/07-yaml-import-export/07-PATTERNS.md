# Phase 7: YAML Import & Export - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 9 (7 new, 2 modified)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/utils/yamlExport.ts` | utility | transform | `src/utils/buildFlatRows.ts` | role-match (pure transform function) |
| `src/utils/yamlExport.test.ts` | test | — | `src/utils/buildFlatRows.test.ts` | exact |
| `src/utils/yamlImport.ts` | utility | transform | `src/utils/buildFlatRows.ts` | role-match (pure function, multiple exports) |
| `src/utils/yamlImport.test.ts` | test | — | `src/utils/buildFlatRows.test.ts` | exact |
| `src/components/ImportPreviewModal.tsx` | component | request-response | `src/components/ResetConfirmDialog.tsx` | exact (native dialog, confirm/cancel, async action, snapshot-before-write) |
| `src/components/ImportPreviewModal.test.tsx` | test | — | `src/components/ActionsGroup.test.tsx` | role-match |
| `src/components/ActionsGroup.tsx` | component | request-response | `src/components/ActionsGroup.tsx` | exact (self — modify in place) |
| `src/store/app.ts` | store | CRUD | `src/store/app.ts` (createSession / switchSession) | exact (self — extend in place) |
| `package.json` | config | — | `package.json` | exact (self — add dependency) |

---

## Pattern Assignments

### `src/utils/yamlExport.ts` (utility, transform)

**Analog:** `src/utils/buildFlatRows.ts`

**Imports pattern** (`src/utils/buildFlatRows.ts` lines 1–7):
```typescript
import type {
  Difficulty,
  Question,
  Section,
  Topic,
} from '../data/bank/types.js';
import type { CustomQuestion } from '../storage/types.js';
```

Apply the same `.js` extension convention on all relative imports. Named type imports use `import type`.

**Core transform pattern** (`src/utils/buildFlatRows.ts` lines 59–75):
```typescript
export function buildFlatRows(
  sections: readonly Section[],
  topicOpen: Record<string, boolean>,
  sectionOpen: Record<string, boolean>,
  filters: { ... },
): VirtualRow[] {
  const rows: VirtualRow[] = [];
  // pure iteration over sections → topics → questions
  for (const section of sections) { ... }
  return rows;
}
```

`yamlExport.ts` follows the same signature style — pure function, `readonly Section[]`, returns a plain value (string here). No side effects, no React imports.

**Score key pattern** (`src/store/app.ts` line 68 comment):
```typescript
// Per-question scores (questionId → score | null); key: "${topicId}-${questionIndex}"
scores: Record<string, number | null>;
```

The export MUST use `${topicId}-${index}` (not `${sectionId}-${topicId}-${index}`) as the lookup key — confirmed by store type definition. See also buildFlatRows.ts lines 155–163 where `index = topic.questions.indexOf(question)` is the canonical index.

**File download helper** (no existing analog — use RESEARCH.md Pattern 3):
```typescript
function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### `src/utils/yamlExport.test.ts` (test)

**Analog:** `src/utils/buildFlatRows.test.ts`

**Test file imports pattern** (`src/utils/buildFlatRows.test.ts` lines 1–3):
```typescript
import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTIONS } from '../data/bank/index.js';
import { buildFlatRows } from './buildFlatRows.js';
```

Import `DEFAULT_SECTIONS` from `'../data/bank/index.js'` for fixture data. No `beforeEach` needed for pure function tests — just call the function and assert output.

**Test structure pattern** (`src/utils/buildFlatRows.test.ts` lines 13–39):
```typescript
describe('buildFlatRows — no filters, all open', () => {
  it('returns rows for all sections, topics, and questions', () => {
    const rows = buildFlatRows(DEFAULT_SECTIONS, {}, {}, emptyFilters);
    expect(rows.length).toBeGreaterThan(100);
  });
  // ...
});
```

Group tests by function name + scenario in `describe` blocks. Use realistic inputs (`DEFAULT_SECTIONS`) rather than minimal mocks for integration-style unit tests.

---

### `src/utils/yamlImport.ts` (utility, transform)

**Analog:** `src/utils/buildFlatRows.ts`

Same pure-function module pattern. Multiple named exports (`detectFormat`, `parseStructural`, `parseLegacy`) follow the same pattern as `buildFlatRows` exporting multiple types + one function.

**Imports pattern:**
```typescript
import type { Section } from '../data/bank/types.js';
import type { CustomQuestion } from '../storage/types.js';
import type { CandidateDetails } from '../store/app.js';
import { load } from 'js-yaml';
```

Use named import `{ load }` from `'js-yaml'` (not default import) per RESEARCH.md Pitfall 3.

**Error handling pattern for parse failures** — wrap `load()` in try/catch at the parse boundary; propagate a typed error result up to the caller rather than throwing from `parseYaml`:
```typescript
export function parseYaml(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: load(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
```

---

### `src/utils/yamlImport.test.ts` (test)

**Analog:** `src/utils/buildFlatRows.test.ts`

**Multi-section fixture** — use `DEFAULT_SECTIONS` directly (not a stub) for `parseLegacy` tests, per STATE.md requirement for realistic corpus:
```typescript
import { DEFAULT_SECTIONS } from '../data/bank/index.js';

const LEGACY_FIXTURE = {
  scores: {
    'twig-0': 8,
    'twig-4': 6,
    'twig-10': 9,
    'nonexistent-topic-0': 5, // should be unmatched
  },
  candidate: { name: 'Alice Smith', email: '', role: '', date: '', interviewer: '', details: '' },
};
```

For `parseStructural` round-trip test: call `exportSession(session, name, DEFAULT_SECTIONS)` then `load(yaml)` then `parseStructural(parsed)` and assert `result.scores` matches the original `session.scores`.

---

### `src/components/ImportPreviewModal.tsx` (component, request-response)

**Primary analog:** `src/components/ResetConfirmDialog.tsx` (exact — small confirm/cancel dialog with async action)

**Secondary analog:** `src/components/CandidateModal.tsx` (focus trap useEffect — verbatim copy)

**Imports pattern** (`src/components/ResetConfirmDialog.tsx` lines 1–3):
```typescript
import { type RefObject, useEffect } from 'react';
import { storageAdapter } from '../storage/index.js';
import { useAppStore } from '../store/app.js';
```

ImportPreviewModal differs in that it does NOT import `useAppStore` directly — it receives `preview` and `onConfirm` as props (caller owns the store interaction).

**Focus trap + focus restore pattern** (`src/components/ResetConfirmDialog.tsx` lines 14–46 and `src/components/CandidateModal.tsx` lines 31–63 — verbatim):
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
    document.getElementById('open-import-yaml')?.focus();
  }

  dialogEl.addEventListener('keydown', handleKeyDown);
  dialogEl.addEventListener('close', handleClose);
  return () => {
    dialogEl.removeEventListener('keydown', handleKeyDown);
    dialogEl.removeEventListener('close', handleClose);
  };
}, [dialogRef]);
```

Note: focus restore target id is `'open-import-yaml'` — match the `id` attribute on the Import YAML button in `ActionsGroup`.

**Dialog element pattern** (`src/components/ResetConfirmDialog.tsx` lines 59–64):
```typescript
// T-05-03-04: Never pass open prop — always call .showModal() imperatively
<dialog
  ref={dialogRef}
  aria-labelledby="import-preview-title"
  className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
```

**Async confirm + void wrapper pattern** (`src/components/ResetConfirmDialog.tsx` lines 53–57, 86–90):
```typescript
const handleConfirm = async () => {
  await onConfirm(overwriteActive);
  dialogRef.current?.close();
};

// In JSX:
onClick={() => { void handleConfirm(); }}
```

**Toggle (radio/checkbox) for "new session vs overwrite"** — use a `useState<boolean>` for `overwriteActive`:
```typescript
const [overwriteActive, setOverwriteActive] = useState(false);
```

Render as two `<button type="button" aria-pressed={...}>` toggles or a `<select>` — follow the `aria-pressed` pattern already used in ActionsGroup for `hideMarked` and `darkMode`.

---

### `src/components/ImportPreviewModal.test.tsx` (test)

**Analog:** `src/components/ActionsGroup.test.tsx`

**Imports and vi.mock pattern** (`src/components/ActionsGroup.test.tsx` lines 1–7):
```typescript
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionsGroup } from './ActionsGroup.js';

vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));
```

ImportPreviewModal receives props (no store), so no `vi.mock` for store needed. Mock `dialogRef` via `{ current: document.createElement('dialog') }` and spy on `onConfirm`.

---

### `src/components/ActionsGroup.tsx` (modify in place)

**Analog:** Self — add to existing file.

**Existing ref pattern** (`src/components/ActionsGroup.tsx` lines 17–19):
```typescript
const candidateDialogRef = useRef<HTMLDialogElement>(null);
const resetDialogRef = useRef<HTMLDialogElement>(null);
const sessionSwitcherRef = useRef<HTMLDialogElement>(null);
```

Add:
```typescript
const importPreviewRef = useRef<HTMLDialogElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Button pattern** (`src/components/ActionsGroup.tsx` lines 41–53):
```typescript
<button
  type="button"
  id="open-export-yaml"
  onClick={handleExportYaml}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Export YAML
</button>
<button
  type="button"
  id="open-import-yaml"
  onClick={() => fileInputRef.current?.click()}
  className="w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
>
  Import YAML
</button>
```

**Hidden file input** (no existing analog in codebase — use RESEARCH.md Pattern 4):
```typescript
<input
  type="file"
  accept=".yaml,.yml"
  ref={fileInputRef}
  className="hidden"
  onChange={handleFileChange}
  aria-hidden="true"
  tabIndex={-1}
/>
```

**Modal render pattern** (`src/components/ActionsGroup.tsx` lines 87–89):
```typescript
<SessionSwitcherModal dialogRef={sessionSwitcherRef} />
<CandidateModal dialogRef={candidateDialogRef} />
<ResetConfirmDialog dialogRef={resetDialogRef} />
```

Add:
```typescript
<ImportPreviewModal dialogRef={importPreviewRef} preview={importPreview} onConfirm={handleImportConfirm} />
```

---

### `src/store/app.ts` (modify — add importSession action)

**Analog:** `createSession` + `switchSession` in `src/store/app.ts` lines 348–377, 308–345.

**Action signature pattern** (`src/store/app.ts` lines 120–128):
```typescript
createSession: () => Promise<void>;
renameSession: (sessionId: string, newName: string) => Promise<void>;
switchSession: (targetId: string) => Promise<void>;
```

Add to `AppActions` interface:
```typescript
importSession: (data: ImportResult, overwriteActive: boolean) => Promise<void>;
```

**Snapshot-before-write pattern** (`src/components/ResetConfirmDialog.tsx` lines 53–56 — confirmed pattern for STORE-05):
```typescript
// T-05-03-03: snapshot MUST be awaited before mutation to prevent race condition
await storageAdapter.snapshot(activeSessionId);
```

**Atomic set() pattern** (`src/store/app.ts` lines 334–345):
```typescript
set((s) => ({
  manifest: s.manifest
    ? { ...s.manifest, activeSessionId: targetId }
    : s.manifest,
  scores: session?.scores ?? {},
  overrides: session?.overrides ?? {},
  notes: session?.notes ?? {},
  topicNotes: session?.topicNotes ?? {},
  customQuestions: session?.customQuestions ?? [],
  candidate: session?.candidate ?? null,
  activeSessionId: targetId,
}));
```

Apply the same single-`set()` pattern for `importSession` to prevent split-state bugs.

**createSession + renameSession chaining pattern** (`src/store/app.ts` lines 374–377):
```typescript
// Switch to the new session (flushPending() fires inside switchSession — SESS-04)
await useAppStore.getState().switchSession(id);
```

After `await createSession()`, use `useAppStore.getState().renameSession(newId, data.sessionName)` to apply the imported session name. Always read `activeSessionId` from `useAppStore.getState()` AFTER the awaited call (not from closure).

---

## Shared Patterns

### Native `<dialog>` — Never set `open` attribute
**Source:** `src/components/ResetConfirmDialog.tsx` line 60 comment; `src/components/CandidateModal.tsx` line 97 comment
**Apply to:** `ImportPreviewModal.tsx`
```typescript
// T-05-03-04: Never pass open prop — always call .showModal() imperatively
<dialog ref={dialogRef} aria-labelledby="...">
```
Caller always opens via `importPreviewRef.current?.showModal()`. Never `<dialog open>`.

### Focus trap useEffect
**Source:** `src/components/CandidateModal.tsx` lines 31–63 (canonical version with WR-02 guard from `SessionSwitcherModal.tsx` line 37)
**Apply to:** `ImportPreviewModal.tsx`

Copy verbatim. Key points:
- Assign `dialogRef.current` to a typed `const dialogEl: HTMLDialogElement` before closures
- Guard: `if (focusable.length === 0) return;` (WR-02)
- Restore focus on close: `document.getElementById('open-import-yaml')?.focus()`

### Snapshot before mutation (STORE-05)
**Source:** `src/components/ResetConfirmDialog.tsx` lines 53–54
**Apply to:** `importSession` action in `src/store/app.ts`
```typescript
await storageAdapter.snapshot(activeSessionId);
// THEN call set() / createSession() / switchSession()
```

### Async void wrapper for onClick
**Source:** `src/components/ResetConfirmDialog.tsx` lines 86–90
**Apply to:** `ImportPreviewModal.tsx` confirm button
```typescript
onClick={() => { void handleConfirm(); }}
```

### `.js` extension on relative imports
**Source:** All existing source files (`src/utils/buildFlatRows.ts` line 1, `src/store/app.ts` line 2, etc.)
**Apply to:** All new files
```typescript
import { useAppStore } from '../store/app.js';
import type { Section } from '../data/bank/types.js';
```

### Button className (sidebar button style)
**Source:** `src/components/ActionsGroup.tsx` lines 36, 43–44
**Apply to:** Export YAML + Import YAML buttons in `ActionsGroup.tsx`
```
"w-full text-sm px-3 py-2 text-left text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Store mock in component tests
**Source:** `src/components/ActionsGroup.test.tsx` lines 5–7, 33–47
**Apply to:** `ImportPreviewModal.test.tsx`, `ActionsGroup.test.tsx` (extended)
```typescript
vi.mock('../store/app.js', () => ({
  useAppStore: vi.fn(),
}));
// ...
mockUseAppStore.mockImplementation((selector: (s: unknown) => unknown) =>
  selector({ ...fields }),
);
```

### StorageAdapter mock in store tests
**Source:** `src/store/app.test.ts` lines 5–15
**Apply to:** Extended `app.test.ts` tests for `importSession`
```typescript
vi.mock('../storage/index.js', () => ({
  storageAdapter: {
    write: vi.fn(),
    read: vi.fn(),
    flushPending: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
    snapshot: vi.fn().mockResolvedValue(undefined),
  },
}));
const { storageAdapter } = await import('../storage/index.js');
```

Note: existing mock in `app.test.ts` does not include `snapshot` — it must be added when extending the file for YAML-03 importSession tests.

---

## No Analog Found

All files have analogs. The following capabilities have no existing codebase examples but have concrete patterns from RESEARCH.md:

| Capability | Reason | Use RESEARCH.md Pattern |
|------------|--------|------------------------|
| `js-yaml` import/export API | No YAML processing exists in codebase yet | RESEARCH.md Patterns 1–2: `import { load, dump } from 'js-yaml'`; `dump(doc, { noRefs: true, lineWidth: 80 })` |
| File download via `URL.createObjectURL` | No file download in codebase | RESEARCH.md Pattern 3: Blob → URL.createObjectURL → `<a>.click()` → revokeObjectURL |
| Hidden `<input type="file">` + FileReader | No file upload in codebase | RESEARCH.md Pattern 4: `fileInputRef.current?.click()` → `reader.readAsText(file)` → reset `e.target.value = ''` |
| File size guard (1 MB limit) | No file I/O exists in codebase | RESEARCH.md Security section: `if (file.size > 1_048_576) return;` before `load()` |

---

## Metadata

**Analog search scope:** `src/components/`, `src/utils/`, `src/store/`, `src/storage/`
**Files scanned:** 10 (CandidateModal.tsx, ResetConfirmDialog.tsx, SessionSwitcherModal.tsx, ActionsGroup.tsx, ActionsGroup.test.tsx, buildFlatRows.ts, buildFlatRows.test.ts, app.ts, app.test.ts, storage/types.ts)
**Pattern extraction date:** 2026-06-17
