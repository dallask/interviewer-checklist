# Phase 5: Scoring UI, Notes, Candidate & Custom Questions - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 12 (8 new, 4 extended, 1 fixed)
**Analogs found:** 12 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/QuestionCard.tsx` | component | CRUD (extend) | `src/components/QuestionCard.tsx` itself (Phase 4) | self-extend |
| `src/components/TopicRow.tsx` | component | CRUD (extend) | `src/components/TopicRow.tsx` itself (Phase 4) | self-extend |
| `src/components/ActionsGroup.tsx` | component | event-driven (extend) | `src/components/TopicRow.tsx` | role-match |
| `src/components/SectionFilter.tsx` | component | transform (extend) | `src/components/TopicRow.tsx` | role-match |
| `src/components/TopicMarkDisplay.tsx` | component | transform (new) | `src/components/TopicRow.tsx` | role-match |
| `src/components/CandidateModal.tsx` | component | CRUD (new) | `src/components/SearchGroup.tsx` | partial-match (ref+state pattern) |
| `src/components/ResetConfirmDialog.tsx` | component | event-driven (new) | `src/components/SearchGroup.tsx` | partial-match |
| `src/components/CustomQuestionForm.tsx` | component | CRUD (new) | `src/components/SearchGroup.tsx` | partial-match |
| `src/store/app.ts` | store | CRUD (extend) | `src/store/app.ts` itself | self-extend |
| `src/storage/types.ts` | model | CRUD (extend) | `src/storage/types.ts` itself (V2SessionSchema) | self-extend |
| `src/storage/migrations/v2-to-v3.ts` | utility | transform (new) | `src/storage/migrations/v1-to-v2.ts` | exact |
| `src/storage/migrations/index.ts` | utility | transform (extend) | `src/storage/migrations/index.ts` itself | self-extend |
| `src/utils/buildFlatRows.ts` | utility | transform (fix) | `src/utils/buildFlatRows.ts` itself | self-fix |

---

## Pattern Assignments

### `src/components/QuestionCard.tsx` (component, extend)

**Analog:** `src/components/QuestionCard.tsx` (Phase 4 — lines 1–47)

**Imports pattern** (lines 1–1, extend with store import):
```typescript
import type { QuestionRow } from '../utils/buildFlatRows.js';
// ADD:
import { useState, useRef } from 'react';
import { useAppStore } from '../store/app.js';
```

**Core card pattern** (lines 27–47 — wrapper and difficulty pill to preserve):
```typescript
export function QuestionCard({ row }: Props) {
  const { question } = row;
  const difficultyClass =
    DIFFICULTY_CLASSES[question.level] ?? DIFFICULTY_CLASSES.novice;
  const difficultyLabel = DIFFICULTY_LABELS[question.level] ?? question.level;

  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 pl-12 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex-1">
          {question.q}
        </span>
        <span
          className={`text-xs font-normal px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyClass}`}
        >
          {difficultyLabel}
        </span>
      </div>
      {/* Phase 5: score slider row inserted here */}
      {/* Phase 5: notes toggle + textarea inserted here */}
    </div>
  );
}
```

**Score slider addition** (insert after difficulty row — no debounce):
```typescript
// Score key: `${topicId}-${row.index}` — matches scoring.ts line 52 exactly
const questionId = `${row.topicId}-${row.index}`;
const score = useAppStore((s) => s.scores[questionId] ?? null);
const setScore = useAppStore((s) => s.setScore);

<div className="mt-2 flex items-center gap-3 min-h-[44px]">
  <input
    type="range"
    min={0}
    max={10}
    step={1}
    value={score ?? 0}
    aria-label={question.q}
    aria-valuemin={0}
    aria-valuemax={10}
    aria-valuenow={score ?? 0}
    onChange={(e) => setScore(questionId, Number(e.target.value))}
    className="flex-1 h-2 accent-blue-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  />
  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">
    {score !== null ? `${score} / 10` : '— / 10'}
  </span>
</div>
```

**Notes debounce addition** (copy debounce pattern from `SearchGroup.tsx` lines 19–26):
```typescript
// Local state for controlled textarea; debounced Zustand write
const [notesOpen, setNotesOpen] = useState(false);
const [localNote, setLocalNote] = useState(
  () => useAppStore.getState().notes[questionId] ?? ''
);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleNoteChange = (value: string) => {
  setLocalNote(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setNote(questionId, value);
  }, 300);
};
```

**"custom" badge** (render next to difficulty pill when `row.isCustom === true`):
```typescript
<span className="text-xs font-normal px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
  custom
</span>
```

**Delete button for custom questions** (render when `row.isCustom === true`):
```typescript
<button
  type="button"
  aria-label="Delete custom question"
  onClick={() => deleteCustomQuestion(row.customId!)}
  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ml-2"
>
  ×
</button>
```

---

### `src/components/TopicRow.tsx` (component, extend)

**Analog:** `src/components/TopicRow.tsx` (lines 1–27)

**Current mark placeholder to replace** (line 23):
```typescript
// BEFORE (Phase 4):
<span className="text-gray-400 text-xs">—</span>

// AFTER (Phase 5):
<TopicMarkDisplay topicId={row.topic.id} topic={row.topic} />
```

**Import additions**:
```typescript
import { useAppStore } from '../store/app.js';
import { TopicMarkDisplay } from './TopicMarkDisplay.js';
// useState for topicNotesOpen
import { useState } from 'react';
```

**Topic notes addition** (render below topic's last question row — outside the button, in the content tree layer):
```typescript
// Collapsible topic notes — same textarea class as per-question notes
<div className="px-8 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
  <button
    type="button"
    aria-expanded={topicNotesOpen}
    aria-controls={`topic-notes-${topicId}`}
    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
  >
    {topicNotesOpen ? 'Hide topic notes' : 'Add topic notes'}
  </button>
  <textarea
    id={`topic-notes-${topicId}`}
    aria-label={`Notes for ${row.topic.name}`}
    className="mt-2 w-full resize-y min-h-[80px] text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
    placeholder="Topic notes…"
    hidden={!topicNotesOpen}
  />
</div>
```

---

### `src/components/TopicMarkDisplay.tsx` (component, new)

**Analog:** `src/components/TopicRow.tsx` (Zustand selector pattern) + `src/scoring/scoring.ts` (computeTopicMark)

**Full component pattern:**
```typescript
import { useAppStore } from '../store/app.js';
import { computeTopicMark, getMarkBand } from '../scoring/index.js';
import type { Topic } from '../data/bank/types.js';
import type { MarkBand } from '../scoring/scoring.js';

// All band class strings declared as complete literals — never dynamic construction
// Pattern copied from QuestionCard.tsx DIFFICULTY_CLASSES (lines 10–18)
const BAND_COLORS: Record<MarkBand, string> = {
  none: 'text-gray-400 dark:text-gray-500',
  low:  'text-red-500 dark:text-red-400',
  mid:  'text-yellow-500 dark:text-yellow-400',
  good: 'text-green-600 dark:text-green-400',
  high: 'text-emerald-600 dark:text-emerald-400',
} as const;

interface Props {
  topicId: string;
  topic: Topic;
}

export function TopicMarkDisplay({ topicId, topic }: Props) {
  const scores = useAppStore((s) => s.scores);
  const override = useAppStore((s) => s.overrides[topicId] ?? null);
  const setOverride = useAppStore((s) => s.setOverride);
  const customQuestions = useAppStore((s) => s.customQuestions);

  // Merge custom questions into topic before scoring — do NOT use filteredQuestions
  const customQsForTopic = customQuestions
    .filter((cq) => cq.topicId === topicId)
    .map((cq) => ({ q: cq.text, level: cq.level }));
  const topicWithCustom = { ...topic, questions: [...topic.questions, ...customQsForTopic] };

  const { mark, band } = computeTopicMark(topicWithCustom, scores, override);
  const colorClass = BAND_COLORS[band];

  const handleOverrideBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') { setOverride(topicId, null); return; }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setOverride(topicId, Math.min(10, Math.max(0, n)));
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Mark for ${topic.name}`}>
      <span className={`text-xs tabular-nums ${colorClass}`}>
        {override !== null ? override.toFixed(1) : mark !== null ? mark.toFixed(1) : '—'}
      </span>
      <input
        type="number"
        min={0}
        max={10}
        step={0.1}
        aria-label={`Override mark for ${topic.name}`}
        defaultValue={override ?? ''}
        placeholder="override"
        onBlur={handleOverrideBlur}
        className="w-16 text-xs text-gray-700 dark:text-gray-300 bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700"
      />
      {override !== null && (
        <button
          type="button"
          aria-label={`Clear override mark for ${topic.name}`}
          onClick={() => setOverride(topicId, null)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

---

### `src/components/CandidateModal.tsx` (component, new)

**Analog:** `src/components/SearchGroup.tsx` (useRef + useState pattern, lines 1–97)

**Imports pattern:**
```typescript
import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/app.js';
import type { CandidateDetails } from '../store/app.js';
```

**Dialog ref + showModal pattern** (copy from RESEARCH.md Pattern 4 — no third-party):
```typescript
const dialogRef = useRef<HTMLDialogElement>(null);

// Open: call imperatively — never use <dialog open> prop
const open = () => dialogRef.current?.showModal();

// Focus trap (query inside handler — not at setup — for dynamic content safety)
useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const focusable = dialog!.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  dialog.addEventListener('keydown', handleKeyDown);
  // Focus restore on close
  dialog.addEventListener('close', () => {
    document.getElementById('open-candidate-modal')?.focus();
  });
  return () => dialog.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Dialog JSX** (native `<dialog>` — no portal, no overlay div):
```typescript
<dialog
  ref={dialogRef}
  aria-labelledby="candidate-modal-title"
  className="fixed inset-0 m-auto w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
  <h2
    id="candidate-modal-title"
    className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4"
  >
    Candidate Details
  </h2>
  <form method="dialog" className="flex flex-col gap-4" onSubmit={handleSave}>
    {/* 6 fields — all use same field pattern */}
    <div className="flex flex-col gap-1">
      <label className="text-sm font-normal text-gray-700 dark:text-gray-300">Name</label>
      <input
        type="text"
        name="name"
        autoComplete="off"
        className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      />
    </div>
    {/* footer */}
    <div className="flex items-center justify-between pt-2">
      <button type="button" className="text-sm font-normal text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
        Reset details
      </button>
      <div className="flex gap-3">
        <button type="button" onClick={() => dialogRef.current?.close()}
          className="text-sm font-normal px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
          Discard changes
        </button>
        <button type="submit"
          className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
          Save details
        </button>
      </div>
    </div>
  </form>
</dialog>
```

---

### `src/components/ResetConfirmDialog.tsx` (component, new)

**Analog:** `src/components/CandidateModal.tsx` (same `<dialog>` + focus-trap pattern)

**Key difference — async reset handler** (RESEARCH.md Pattern 3 + Pitfall 5):
```typescript
// MUST await snapshot before resetAll — race condition otherwise
const handleReset = async () => {
  const activeSessionId = useAppStore.getState().activeSessionId;
  await storageAdapter.snapshot(activeSessionId);  // storageAdapter.snapshot(sessionId: string)
  resetAll();       // Zustand action
  dialogRef.current?.close();
  // focus restore handled by 'close' event listener
};
```

**Dialog JSX** (same pattern as CandidateModal but narrower — `max-w-sm`):
```typescript
<dialog
  ref={dialogRef}
  aria-labelledby="reset-dialog-title"
  className="fixed inset-0 m-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
>
  {/* ... title, body, Keep scores + Reset buttons ... */}
  {/* Reset button: bg-red-600 not bg-blue-600 */}
  <button type="button" onClick={handleReset}
    className="text-sm font-normal px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
    Reset
  </button>
</dialog>
```

**Focus initial position:** first focus goes to "Keep scores" button (safe default), not "Reset".

---

### `src/components/CustomQuestionForm.tsx` (component, new)

**Analog:** `src/components/SearchGroup.tsx` (controlled input + clear pattern, lines 18–30)

**Controlled form with local state** (collapse after submit — no debounce needed):
```typescript
import { useState } from 'react';
import { useAppStore } from '../store/app.js';
import type { Difficulty } from '../data/bank/types.js';

interface Props {
  topicId: string;
  onDismiss: () => void;
}

export function CustomQuestionForm({ topicId, onDismiss }: Props) {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<Difficulty>('intermediate');
  const addCustomQuestion = useAppStore((s) => s.addCustomQuestion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCustomQuestion({
      id: `custom-${topicId}-${Date.now()}`,
      topicId,
      text: text.trim(),
      level,
    });
    onDismiss();
  };
```

**Submit button class** (matches Phase 4/5 primary action button — same as CandidateModal save):
```typescript
className="text-sm font-normal px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

**Select difficulty options** (all 4 — coefficient labels per CONTEXT.md):
```typescript
<select aria-label="Question difficulty" value={level} onChange={(e) => setLevel(e.target.value as Difficulty)}
  className="text-sm font-normal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
  <option value="novice">Beginner (1.00×)</option>
  <option value="intermediate">Intermediate (1.25×)</option>
  <option value="advanced">Advanced (1.50×)</option>
  <option value="expert">Expert (1.75×)</option>
</select>
```

---

### `src/store/app.ts` (store, extend)

**Analog:** `src/store/app.ts` (lines 1–151 — self-extension)

**Interface extension pattern** (add after existing `AppActions` interface, lines 27–39):
```typescript
// Types used by ScoringState
export interface CandidateDetails {
  name: string;
  email: string;
  role: string;
  date: string;
  interviewer: string;
  details: string;
}

export interface CustomQuestion {
  id: string;
  topicId: string;
  text: string;
  level: Difficulty;  // Difficulty already imported from '../data/bank/types.js'
}

export interface ScoringState {
  scores: Record<string, number | null>;
  overrides: Record<string, number | null>;
  notes: Record<string, string>;
  topicNotes: Record<string, string>;
  customQuestions: CustomQuestion[];
  candidate: CandidateDetails | null;
  activeSessionId: string;  // needed by snapshot + session subscribe
}

export interface ScoringActions {
  setScore: (questionId: string, score: number | null) => void;
  setOverride: (topicId: string, override: number | null) => void;
  setNote: (questionId: string, note: string) => void;
  setTopicNote: (topicId: string, note: string) => void;
  addCustomQuestion: (q: CustomQuestion) => void;
  deleteCustomQuestion: (id: string) => void;
  setCandidate: (candidate: CandidateDetails | null) => void;
  resetAll: () => void;
}
```

**DEFAULT_STATE extension** (add to existing `DEFAULT_STATE` object at lines 41–51):
```typescript
// Add to DEFAULT_STATE:
scores: {},
overrides: {},
notes: {},
topicNotes: {},
customQuestions: [],
candidate: null,
activeSessionId: '',  // hydrated from bootstrap().manifest.activeSessionId in main.tsx
```

**Action implementations** (follow existing Set pattern from toggleDifficulty lines 102–112):
```typescript
setScore: (questionId, score) =>
  set((s) => ({ scores: { ...s.scores, [questionId]: score } })),

setOverride: (topicId, override) =>
  set((s) => ({ overrides: { ...s.overrides, [topicId]: override } })),

setNote: (questionId, note) =>
  set((s) => ({ notes: { ...s.notes, [questionId]: note } })),

setTopicNote: (topicId, note) =>
  set((s) => ({ topicNotes: { ...s.topicNotes, [topicId]: note } })),

addCustomQuestion: (q) =>
  set((s) => ({ customQuestions: [...s.customQuestions, q] })),

deleteCustomQuestion: (id) =>
  set((s) => ({ customQuestions: s.customQuestions.filter((q) => q.id !== id) })),

setCandidate: (candidate) => set({ candidate }),

resetAll: () =>
  set({
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  }),
```

**Subscribe extension** (extend existing subscribe at lines 136–150 — add session write):
```typescript
// EXTEND the existing subscribe (do not replace):
useAppStore.subscribe((state) => {
  // Existing uiState write (unchanged — lines 137–149)
  storageAdapter.write({
    uiState: {
      sidebarOpen: state.sidebarOpen,
      // ... all existing fields ...
    },
  });
  // NEW: write scoring state to active session key
  if (state.activeSessionId) {
    storageAdapter.write({
      [`session:${state.activeSessionId}`]: {
        version: 3,
        id: state.activeSessionId,
        scores: state.scores,
        overrides: state.overrides,
        notes: state.notes,
        topicNotes: state.topicNotes,
        customQuestions: state.customQuestions,
        candidate: state.candidate,
      },
    });
  }
});
```

---

### `src/storage/types.ts` (model, extend)

**Analog:** `src/storage/types.ts` (self-extension — V2SessionSchema pattern lines 57–76)

**V3 schema additions** (append after V2SessionSchema + V2ManifestSchema):
```typescript
export const CustomQuestionSchema = v.object({
  id: v.string(),
  topicId: v.string(),
  text: v.string(),
  level: v.union([
    v.literal('novice'),
    v.literal('intermediate'),
    v.literal('advanced'),
    v.literal('expert'),
  ]),
});

export const V3SessionSchema = v.object({
  version: v.literal(3),
  id: v.string(),
  scores: v.record(v.string(), v.nullable(v.number())),
  overrides: v.record(v.string(), v.nullable(v.number())),
  notes: v.record(v.string(), v.string()),
  topicNotes: v.record(v.string(), v.string()),
  customQuestions: v.array(CustomQuestionSchema),
  candidate: v.nullable(CandidateSchema),  // CandidateSchema already exists at line 48
});

export type V3Session = v.InferOutput<typeof V3SessionSchema>;
```

**Factory function** (copy shape from `createDefaultSession` lines 120–132):
```typescript
export function createDefaultV3Session(id: string): V3Session {
  return {
    version: 3,
    id,
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  };
}
```

---

### `src/storage/migrations/v2-to-v3.ts` (utility, new)

**Analog:** `src/storage/migrations/v1-to-v2.ts` (lines 1–48 — exact pattern)

**Pure migration function** (same structure: Readonly input, no try/catch, no class):
```typescript
import type { V2Session, V3Session } from '../types.js';
import type { CustomQuestion } from '../../store/app.js';
import type { Difficulty } from '../../data/bank/types.js';

/**
 * Pure migration function: maps V2Session to V3Session.
 * V2 field renames:
 *   questionScore  → scores
 *   topicOverride  → overrides
 *   questionComment → notes
 *   cardComment    → topicNotes
 *   customQuestions (Record<string, Array<{id:number,text,level}>>) → CustomQuestion[] (flattened)
 *   customSeq      → removed
 *
 * No try/catch — errors surface to runMigrations() caller.
 */
export function migrateV2ToV3(session: Readonly<V2Session>): V3Session {
  return {
    version: 3,
    id: session.id,
    scores: session.questionScore ?? {},
    overrides: session.topicOverride ?? {},
    notes: session.questionComment ?? {},
    topicNotes: session.cardComment ?? {},
    customQuestions: migrateCustomQuestions(session.customQuestions ?? {}),
    candidate: Object.keys(session.candidate ?? {}).length > 0
      ? (session.candidate as V3Session['candidate'])
      : null,
  };
}

function migrateCustomQuestions(
  v2CQs: Record<string, Array<{ id: number; text: string; level: string }>>,
): CustomQuestion[] {
  return Object.entries(v2CQs).flatMap(([topicId, qs]) =>
    qs.map((q) => ({
      id: `custom-${topicId}-${q.id}`,
      topicId,
      text: q.text,
      level: q.level as Difficulty,
    })),
  );
}
```

---

### `src/storage/migrations/index.ts` (utility, extend)

**Analog:** `src/storage/migrations/index.ts` (lines 1–43 — self-extension)

**MIGRATIONS array extension** (add entry after existing fromVersion: 1 entry at line 12):
```typescript
// ADD import at top:
import type { V3Session } from '../types.js';
import { migrateV2ToV3 } from './v2-to-v3.js';

// ADD to MIGRATIONS array:
{ fromVersion: 2, fn: (r) => migrateV2ToV3(r as V2Session) }
```

**runMigrations return type** must be updated to accommodate V3:
```typescript
// Update return type — the function returns either {manifest, session} (v1→v2)
// or {session: V3Session} (v2→v3 — manifest unchanged), or null.
// Planner: decide exact return type shape; see RESEARCH.md Finding for v2→v3 path.
```

---

### `src/utils/buildFlatRows.ts` (utility, fix)

**Analog:** `src/utils/buildFlatRows.ts` (lines 137–145 — self-fix)

**The bug** (line 137 — emits filtered-subset index, not original index):
```typescript
// BEFORE — wrong when difficulty filter is active:
topic.filteredQuestions.forEach((question, index) => {
  rows.push({
    type: 'question',
    sectionId: section.id,
    topicId: topic.id,
    question,
    index,   // BUG: filtered-array index, not topic.questions position
  });
});

// AFTER — preserves original topic.questions index:
for (const question of topic.filteredQuestions) {
  const index = topic.questions.indexOf(question);  // indexOf works: .filter() preserves refs
  rows.push({
    type: 'question',
    sectionId: section.id,
    topicId: topic.id,
    question,
    index,   // FIXED: original position in topic.questions
  });
}
```

**hideMarked extension** (add `hideMarked` + `markedTopicIds` parameters to signature):
```typescript
// EXTEND function signature:
export function buildFlatRows(
  sections: readonly Section[],
  topicOpen: Record<string, boolean>,
  sectionOpen: Record<string, boolean>,
  filters: {
    searchQuery: string;
    selectedDifficulties: Set<Difficulty>;
    selectedSections: Set<string>;
    hideMarked?: boolean;          // Phase 5 addition
    markedTopicIds?: Set<string>;  // Phase 5 addition
  },
): VirtualRow[]

// Inside visibleTopics loop, add hideMarked check after filteredQuestions:
if (
  filters.hideMarked &&
  filters.markedTopicIds?.has(topic.id) &&
  filteredQuestions.length > 0
) {
  continue;  // skip topic entirely when marked+hideMarked active
}
```

---

## Shared Patterns

### Tailwind Button/Input Focus Ring
**Source:** Every existing interactive element (e.g., `TopicRow.tsx` line 16, `SearchGroup.tsx` line 73)
**Apply to:** All new buttons, inputs, textareas, selects in Phase 5
```typescript
// Always this exact triplet — never omit outline-none with ring:
className="... focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
```

### Dark Mode Variant
**Source:** `QuestionCard.tsx` lines 34, 36, 39, 43 — every color class has a `dark:` pair
**Apply to:** All Phase 5 component classes
```typescript
// Pattern: bg-white dark:bg-gray-900 | text-gray-900 dark:text-gray-100
// | border-gray-200 dark:border-gray-700 | text-gray-500 dark:text-gray-400
```

### Zustand Selector Pattern (granular — avoid full-state subscription)
**Source:** `TopicRow.tsx` line 9, `SearchGroup.tsx` lines 13–18
**Apply to:** All Phase 5 components reading from store
```typescript
// Select only the slice needed — prevents re-render on unrelated mutations
const setScore = useAppStore((s) => s.setScore);
const score = useAppStore((s) => s.scores[questionId] ?? null);
```

### Debounce Pattern (300ms, useRef+setTimeout)
**Source:** `SearchGroup.tsx` lines 19–30 (150ms search — Phase 5 uses 300ms for notes)
**Apply to:** Per-question notes textarea, per-topic notes textarea
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// In handler:
if (debounceRef.current) clearTimeout(debounceRef.current);
debounceRef.current = setTimeout(() => { dispatch(value); }, 300);
// In cleanup useEffect: () => { if (debounceRef.current) clearTimeout(debounceRef.current); }
```

### Named Export + `.js` Extension on Relative Imports
**Source:** All existing files (e.g., `QuestionCard.tsx` line 1, `store/app.ts` line 4)
**Apply to:** All Phase 5 files
```typescript
// Named exports only — no default exports
export function TopicMarkDisplay(...) {}
// .js extension on all relative imports even from .tsx source files
import { useAppStore } from '../store/app.js';
```

### Valibot Schema + InferOutput Type Pattern
**Source:** `src/storage/types.ts` lines 1, 57–76, 95
**Apply to:** `V3SessionSchema`, `CustomQuestionSchema`
```typescript
import * as v from 'valibot';
export const SomeSchema = v.object({ ... });
export type SomeType = v.InferOutput<typeof SomeSchema>;
```

### Static Class Map (no dynamic string construction)
**Source:** `QuestionCard.tsx` lines 10–18 — comment "Never use dynamic class construction"
**Apply to:** `BAND_COLORS` in `TopicMarkDisplay.tsx`, all Phase 5 conditional class maps
```typescript
// CORRECT — full string literals visible to Tailwind scanner:
const BAND_COLORS: Record<MarkBand, string> = {
  none: 'text-gray-400 dark:text-gray-500',
  low:  'text-red-500 dark:text-red-400',
  // ...
};
// WRONG — Tailwind cannot scan dynamic construction:
// const cls = `text-${color}-500`  ← never do this
```

### Dialog Backdrop CSS
**Source:** `05-UI-SPEC.md` CandidateModal section
**Apply to:** `src/styles.css` — add once for all `<dialog>` elements:
```css
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
```

---

## No Analog Found

All files have analogs in the codebase. No files require fallback to external patterns only.

---

## Critical Anti-Patterns (from RESEARCH.md — enforce in all Phase 5 files)

| Anti-Pattern | Correct Pattern | Source |
|-------------|-----------------|--------|
| `if (!score)` falsy check | `score !== null` and `typeof score === 'number'` | RESEARCH.md Pitfall 1 |
| `score === 0` means unscored | `score === null` means unscored; 0 is valid | RESEARCH.md Pitfall 1 |
| `<dialog open>` prop | `dialogRef.current?.showModal()` imperatively | RESEARCH.md Anti-Pattern |
| Debounced score slider | Immediate `onChange` → setScore (no debounce) | RESEARCH.md Anti-Pattern |
| Store computed marks in Zustand | Call `computeTopicMark(...)` at render time | RESEARCH.md Anti-Pattern |
| Score key with sectionId | `${topicId}-${questionIndex}` — no sectionId | RESEARCH.md Finding 1 |
| Pass `filteredQuestions` to computeTopicMark | Pass full `topic` object (has `.questions`) | RESEARCH.md Anti-Pattern |
| `resetAll()` before `await snapshot()` | `await storageAdapter.snapshot(id)` THEN `resetAll()` | RESEARCH.md Pitfall 5 |

---

## Metadata

**Analog search scope:** `src/components/`, `src/store/`, `src/storage/`, `src/utils/`, `src/scoring/`
**Files scanned:** 9 source files read directly
**Pattern extraction date:** 2026-06-17
