# Phase 5: Scoring UI, Notes, Candidate & Custom Questions — Research

**Researched:** 2026-06-17
**Domain:** React 19 interactive forms, Zustand store extension, Chrome storage schema migration, native `<dialog>` focus management
**Confidence:** HIGH (codebase verified directly; all critical decisions verified against actual source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Score slider:** Native `<input type="range" min="0" max="10" step="1">` with `aria-label` set to the question text — SCORE-01; no custom slider component
- **Mark band colors:** Reuse `getMarkBand()` from Phase 2 scorer; map to Tailwind: `none`→`text-gray-400`, `low`→`text-red-500`, `mid`→`text-yellow-500`, `good`→`text-green-600`, `high`→`text-emerald-600`
- **Manual topic override UX:** Number input (0–10) next to computed mark; on blur updates override in Zustand store; clear (×) button resets override to null (back to computed mark)
- **Snapshot before Reset all:** `storageAdapter.snapshot()` called BEFORE dispatching the reset action — implements STORE-05
- **Notes textarea resize:** `resize-y` on both per-question and per-topic textareas; no auto-grow
- **Candidate details modal:** Native `<dialog>` element with manual focus-trap (Tab/Shift+Tab within dialog, Escape closes) — SCORE-04; no third-party modal library
- **Custom question difficulty:** Native `<select>` with all 4 options (novice/intermediate/advanced/expert) — SCORE-05
- **Custom question deletion:** Delete button (×) on each custom question card; no confirmation dialog; immediate
- **Scoring state location:** Extend existing V2 session schema with new fields; persisted via existing StorageAdapter
- **Question ID scheme:** `${topicId}-${questionIndex}` (see Critical Finding below — CONTEXT.md stated sectionId but scoring.ts does NOT use sectionId)
- **Reset all confirmation:** Single `<dialog>` confirm with Cancel/Reset buttons; snapshot before reset; no undo in Phase 5
- **hideMarked behavior:** A topic is "marked" (hidden when toggle active) if it has at least one scored question (score !== null)

### Claude's Discretion

- (none declared — all major decisions locked)

### Deferred Ideas (OUT OF SCOPE)

- Undo for reset (Phase 6 adds session-level undo)
- Per-session snapshots beyond Reset/Import triggers (Phase 7)
- Export scoring data to YAML (Phase 7)
- Keyboard shortcut to close modals with Esc (Phase 9 — already works natively on `<dialog>`)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCORE-01 | Per-question 0–10 score slider with `aria-label` set to the question text | Native range input; `QuestionCard` extension pattern; `QuestionRow.index` already populated by `buildFlatRows` |
| SCORE-02 | Live topic mark displayed as difficulty-weighted average of question scores; manual override input replaces computed mark when set | `computeTopicMark()` from `src/scoring/index.ts` already exists; new `TopicMarkDisplay` component reads from extended store |
| SCORE-03 | Per-question notes (textarea) and per-topic notes (textarea) saved and restored with session state | Extend `AppState` with `notes: Record<string, string>` and `topicNotes: Record<string, string>`; 300ms debounce pattern established |
| SCORE-04 | Candidate details modal with Save / Cancel / Reset actions | Native `<dialog>` element; manual focus trap pattern (no third-party library); verified in happy-dom 20.10.4 |
| SCORE-05 | Custom questions per topic — difficulty selection, "custom" badge, deletable, fully participate in scoring | Extend `Topic` concept with mutable `customQuestions: CustomQuestion[]` in session state; `computeTopicMark` accepts arbitrary `Topic` |
| SCORE-06 | Reset all (with confirmation dialog) clears all session scoring state; snapshot first | `storageAdapter.snapshot(sessionId)` takes `sessionId: string`; must call before `resetAll()` dispatch |
</phase_requirements>

---

## Summary

Phase 5 extends the read-only Phase 4 shell with all interactive scoring capabilities. The codebase is well-prepared: `computeTopicMark`, `computeSectionMark`, `computeOverallMark`, and `getMarkBand` are fully implemented and tested in `src/scoring/index.ts`. The Zustand store in `src/store/app.ts` uses a module-level subscribe pattern that already persists to `storageAdapter.write()`. The `QuestionRow` type already carries an `index` field populated for Phase 5. The storage schema is V2; Phase 5 bumps it to V3 by adding scoring fields with safe defaults.

Three issues discovered by codebase inspection require attention during planning:

1. **Question key scheme discrepancy:** CONTEXT.md states `${sectionId}-${topicId}-${questionIndex}` but `src/scoring/scoring.ts` (locked in Phase 2) uses `${topic.id}-${questionIndex}` (no sectionId). The scoring.ts key scheme is authoritative — the planner must use `${topicId}-${questionIndex}` everywhere.

2. **`buildFlatRows` index mismatch under filtering:** `filteredQuestions.forEach((question, index) => ...)` gives the filtered-subset index, not the original `topic.questions[i]` index. When a difficulty filter is active and hides some questions, `QuestionRow.index` will be wrong for score key construction. Phase 5 must fix `buildFlatRows` to emit the original `topic.questions` index, not the filtered-array index.

3. **`uiState` hydration is currently a stub:** `main.tsx` reads `(initialState as Record<string, unknown>).uiState` but `bootstrap()` returns `{manifest, sessions}` — no `uiState` field. The uiState is written to `chrome.storage.local` as a top-level key by `storageAdapter.write({uiState: {...}})` but is never read back. Phase 5 should fix this as part of the main.tsx wiring task (add a `storageAdapter.read(['uiState'])` call, or extend `bootstrap()` to return it).

**Primary recommendation:** Build in three layers: (1) V2→V3 schema + migration, (2) store extension + persistence wiring, (3) UI components in dependency order (ScoreSlider → TopicMarkDisplay → Notes → CustomQuestion → CandidateModal → ResetConfirmDialog → SectionFilter live marks).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Score slider interaction | Browser/Client | — | Pure DOM input; immediate `onChange` → Zustand dispatch |
| Live mark computation | Browser/Client | — | Pure function (`computeTopicMark`) called on every render; no server |
| Topic override input | Browser/Client | — | `onBlur` validates, clamps, dispatches to Zustand |
| Notes textarea save | Browser/Client | Storage | `onChange` → 300ms debounced → Zustand → storageAdapter.write |
| Candidate details modal | Browser/Client | Storage | Native `<dialog>`; form save → Zustand → storageAdapter.write |
| Custom questions | Browser/Client | Storage | Managed in Zustand `customQuestions` array; included in `computeTopicMark` |
| Reset all flow | Browser/Client | Storage | `storageAdapter.snapshot(sessionId)` then Zustand `resetAll()` |
| hideMarked activation | Browser/Client | — | `buildFlatRows` filter: topic hidden if `scores[key] !== null` for any question |
| Schema migration (V2→V3) | Storage | — | Pure migration function; executed once in `runMigrations` pipeline |
| Session persistence | Storage | — | Existing `storageAdapter.write()` debounce + `flushPending()` lifecycle |

---

## Standard Stack

### Core (no new packages — extends existing stack)

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| React | 19.2.7 | Component rendering | Locked stack |
| Zustand | 5.0.14 | Scoring state management | Established; subscribe pattern proven |
| valibot | 1.4.1 | V3 schema validation | Established; used for V2SessionSchema |
| Tailwind v4 | 4.3.1 | Styling | Locked stack; `accent-blue-600` for slider |
| Vitest + @testing-library/react | 4.1.9 + 16.3.2 | Tests | Established; component test patterns in Phase 4 |

**No new npm packages are introduced in Phase 5.** [VERIFIED: package.json] All required capabilities (range inputs, dialogs, focus management, debouncing) are covered by the existing stack. The UI-SPEC.md Registry Safety section explicitly confirms: "No new npm packages introduced for UI components."

### Supporting (internal — already in codebase)

| Module | Location | Purpose | Used By |
|--------|----------|---------|---------|
| `computeTopicMark` | `src/scoring/index.ts` | Difficulty-weighted mark per topic | TopicMarkDisplay, SectionFilter |
| `computeSectionMark` | `src/scoring/index.ts` | Section mean from topic results | SectionFilter |
| `computeOverallMark` | `src/scoring/index.ts` | Overall mean from all topic results | Header/summary display |
| `getMarkBand` | `src/scoring/index.ts` | Maps mark → color band | All mark displays |
| `storageAdapter` | `src/storage/index.ts` | Storage writes + snapshot | Store subscribe, ResetConfirmDialog |
| `buildFlatRows` | `src/utils/buildFlatRows.ts` | Flat row list including custom questions | ContentTree |

**Installation:** No `npm install` required for Phase 5.

---

## Package Legitimacy Audit

> No new packages are installed in Phase 5. This section is not applicable.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User interaction (slider/textarea/form)
        │
        ▼
  React component (onChange/onBlur/onSubmit)
        │
        ▼
  Zustand action (setScore / setNote / setCandidate / addCustomQuestion / resetAll)
        │
        ├──► immediate: re-render TopicMarkDisplay (computeTopicMark called inline)
        │
        ├──► 300ms debounce: storageAdapter.write({session:<id>: sessionState})
        │                                │
        │                                ▼
        │                      chrome.storage.local (V3SessionSchema)
        │
        └──► hideMarked filter: buildFlatRows checks scores[key] !== null per topic

ResetConfirmDialog special flow:
  user confirms → storageAdapter.snapshot(sessionId) [async, awaited]
               → Zustand resetAll() dispatch
               → storageAdapter.write({session:<id>: emptyState})
```

### Recommended Project Structure

```
src/
├── components/
│   ├── QuestionCard.tsx          # EXTEND: add ScoreSlider row + notes toggle + custom badge/delete
│   ├── TopicRow.tsx              # EXTEND: replace "—" mark stub with <TopicMarkDisplay>
│   ├── ActionsGroup.tsx          # EXTEND: add "Candidate details" + "Reset all" buttons
│   ├── SectionFilter.tsx         # EXTEND: replace "—" with live computeSectionMark display
│   ├── TopicMarkDisplay.tsx      # NEW: computed mark + override input + clear button
│   ├── CandidateModal.tsx        # NEW: native <dialog> with 6-field form + focus trap
│   ├── ResetConfirmDialog.tsx    # NEW: native <dialog> confirm with snapshot-before-reset
│   └── CustomQuestionForm.tsx    # NEW: inline form for adding custom questions per topic
├── store/
│   └── app.ts                    # EXTEND: add ScoringState + ScoringActions interfaces
├── storage/
│   ├── types.ts                  # EXTEND: V3SessionSchema (version: 3) + factory update
│   └── migrations/
│       ├── index.ts              # EXTEND: add v2-to-v3 migration entry
│       └── v2-to-v3.ts          # NEW: pure migration adding scoring fields with safe defaults
└── utils/
    └── buildFlatRows.ts          # FIX: emit original topic.questions index, not filtered index
```

### Pattern 1: Extending the Zustand Store

**What:** Add scoring state fields and actions to the existing `useAppStore` by extending `AppState` and `AppActions` interfaces.

**When to use:** This is the only store in Phase 5; all scoring state lives here.

```typescript
// src/store/app.ts — add these interfaces (do not replace existing ones)
// Source: existing app.ts pattern [VERIFIED: src/store/app.ts]

export interface ScoringState {
  /** Per-question scores: key = `${topicId}-${questionIndex}`, value = 0–10 or null (unscored) */
  scores: Record<string, number | null>;
  /** Per-topic manual overrides: key = topicId, value = 0–10 or null (use computed) */
  overrides: Record<string, number | null>;
  /** Per-question notes: key = `${topicId}-${questionIndex}` */
  notes: Record<string, string>;
  /** Per-topic notes: key = topicId */
  topicNotes: Record<string, string>;
  /** Custom questions added by user, keyed by topicId then array */
  customQuestions: CustomQuestion[];
  /** Candidate details, null = not filled */
  candidate: CandidateDetails | null;
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

// Default scoring state (add to DEFAULT_STATE)
export const DEFAULT_SCORING_STATE: ScoringState = {
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
};
```

The subscribe handler in `app.ts` must be extended to write scoring state to the session key:

```typescript
// EXTEND the existing subscribe call — write session data separately from uiState
useAppStore.subscribe((state) => {
  // Existing uiState write (unchanged)
  storageAdapter.write({
    uiState: { /* existing fields */ },
  });
  // NEW: write scoring state to active session key
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
});
```

**Important:** `activeSessionId` must be added to `AppState` and hydrated from `bootstrap()` manifest in `main.tsx`.

### Pattern 2: V2→V3 Schema Migration

**What:** Add new scoring fields to V2SessionSchema, producing V3SessionSchema. Existing sessions get empty defaults.

**When to use:** Bootstrap picks up V3 on next load; V2 sessions migrate transparently.

```typescript
// src/storage/migrations/v2-to-v3.ts
// Source: existing v1-to-v2.ts migration pattern [VERIFIED: src/storage/migrations/v1-to-v2.ts]

import type { V2Session, V3Session } from '../types.js';

export function migrateV2ToV3(session: Readonly<V2Session>): V3Session {
  return {
    ...session,
    version: 3,
    // V2 field renames: questionScore → scores, topicOverride → overrides
    // cardComment → topicNotes, questionComment → notes
    scores: session.questionScore,        // same data, rename
    overrides: session.topicOverride,     // same data, rename
    notes: session.questionComment ?? {}, // was questionComment in V2
    topicNotes: session.cardComment ?? {},// was cardComment in V2
    customQuestions: migrateCustomQuestions(session.customQuestions),
    candidate: session.candidate ?? null,
  };
}
```

**V2 field mapping to V3:**
- `questionScore` → `scores` (same record shape: `Record<string, number | null>`)
- `topicOverride` → `overrides`
- `questionComment` → `notes` (per-question text notes)
- `cardComment` → `topicNotes` (per-topic card comments)
- `customQuestions: Record<string, Array<{id:number, text, level}>>` → `customQuestions: CustomQuestion[]` (flattened, id becomes string)
- `customSeq` → removed (replaced by `custom-${topicId}-${Date.now()}` ID scheme)

**Note:** V2 schema already has `scores`, `overrides`, `candidate`, and notes fields — just under different names. No data is lost.

### Pattern 3: `storageAdapter.snapshot(sessionId)` Takes a Required sessionId Argument

**What:** The `snapshot()` method on `StorageAdapter` requires a `sessionId: string` argument.

**When to use:** Before `resetAll()` dispatch.

```typescript
// Verified signature: [VERIFIED: src/storage/adapter.ts line 105]
async snapshot(sessionId: string): Promise<void>

// Usage in ResetConfirmDialog:
const handleReset = async () => {
  await storageAdapter.snapshot(activeSessionId);
  resetAll(); // Zustand action
  dialog.close();
  triggerElement.focus();
};
```

The CONTEXT.md note "snapshot() called before dispatching the reset action" is correct but omits that it takes `sessionId`. The store must expose `activeSessionId` for this to work.

### Pattern 4: Native `<dialog>` Focus Trap in React 19

**What:** Manual focus trap using `keydown` event on the dialog element; no third-party library.

**When to use:** CandidateModal and ResetConfirmDialog both use this pattern.

```typescript
// Source: 05-UI-SPEC.md Accessibility Contract + MDN [ASSUMED: MDN pattern]
function useFocusTrap(dialogRef: RefObject<HTMLDialogElement>) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [dialogRef]);
}
```

**Focus restore on close:**
```typescript
dialog.addEventListener('close', () => {
  triggerButtonRef.current?.focus();
}, { once: false });
```

**`dialog.showModal()` in React:** Call imperatively via `useRef` — `dialogRef.current?.showModal()`. Do NOT pass `open` as a prop to `<dialog>` — that bypasses the modal layer and backdrop.

**happy-dom `<dialog>` support:** happy-dom 20.10.4 implements `showModal()` and `close()` methods on `HTMLDialogElement`. [VERIFIED: confirmed via direct inspection — methods present as typeof 'function'] Tests can call `dialog.showModal()` and assert `dialog.open === true`.

### Pattern 5: Controlled Range Input in React 19

**What:** `<input type="range">` in React 19 using `onChange` for immediate dispatch.

**When to use:** Score slider — no debounce needed; live recompute on every change.

```typescript
// Source: React 19 controlled inputs pattern [ASSUMED]
// No debounce — scoring must be live (topology: slider → computeTopicMark → TopicMarkDisplay)
<input
  type="range"
  min={0}
  max={10}
  step={1}
  value={score ?? 0}
  aria-label={question.q}
  aria-valuenow={score ?? 0}
  aria-valuemin={0}
  aria-valuemax={10}
  onChange={(e) => setScore(questionId, Number(e.target.value))}
  className="flex-1 h-2 accent-blue-600 cursor-pointer ..."
/>
```

**Null vs 0 display:** `score === null` → render "— / 10" (unscored), value prop = 0. `score === 0` → render "0 / 10" (valid zero). The slider always has a numeric `value` prop — use `score ?? 0` to avoid uncontrolled input warning.

**Uncontrolled pitfall:** If `value` prop is omitted, React treats it as uncontrolled and will warn. Always supply `value={score ?? 0}`.

### Pattern 6: Notes Debounce — 300ms Consistent with Phase 4

**What:** Notes textarea uses 300ms debounced dispatch to Zustand (same as search debounce, same as storageAdapter.write debounce).

**When to use:** Both per-question notes and per-topic notes textareas.

```typescript
// Source: existing search debounce pattern in Phase 4 store [VERIFIED: src/store/app.ts]
// Use useRef+setTimeout — no external library
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleNoteChange(value: string) {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setNote(questionId, value);
  }, 300);
}
```

**Note:** The controlled textarea value is local component state (useState), not Zustand. The Zustand dispatch is debounced; the local `value` state updates immediately for smooth typing.

### Pattern 7: hideMarked Activation

**What:** The `hideMarked` toggle in `ActionsGroup` currently has `aria-pressed={false}` hardcoded (Phase 4 stub). Phase 5 activates it.

**When to use:** Phase 5 wires `hideMarked` to `buildFlatRows` by passing a set of "marked topic IDs" computed from `scores`.

```typescript
// In App.tsx (or a selector), compute marked topic IDs:
// A topic is marked if at least one score for its questions is not null
function computeMarkedTopicIds(
  sections: readonly Section[],
  scores: Record<string, number | null>
): Set<string> {
  const marked = new Set<string>();
  for (const section of sections) {
    for (const topic of section.items) {
      const hasScore = topic.questions.some((_, i) => {
        const key = `${topic.id}-${i}`;
        return scores[key] !== null && scores[key] !== undefined;
      });
      if (hasScore) marked.add(topic.id);
    }
  }
  return marked;
}
```

`buildFlatRows` must be extended to accept `hideMarked: boolean` and `markedTopicIds: Set<string>` — when both are true and a topic is in the marked set, skip it entirely.

### Pattern 8: buildFlatRows Index Fix

**What:** Fix the `filteredQuestions.forEach` index bug where the filtered-array index is emitted instead of the original `topic.questions` index.

**Why:** `scoring.ts` constructs keys as `` `${topic.id}-${i}` `` where `i` is the index in `topic.questions`. If difficulty filtering hides question 0, the next visible question should still get key `topicId-1`, not `topicId-0`.

```typescript
// BEFORE (Phase 4 — wrong when filtering):
topic.filteredQuestions.forEach((question, index) => {
  rows.push({ ..., index });
});

// AFTER (Phase 5 — find original index):
for (const question of topic.filteredQuestions) {
  const originalIndex = topic.questions.indexOf(question);
  rows.push({ ..., index: originalIndex });
}
```

**Note:** `topic.questions` is `readonly Question[]` with object identity preserved through `.filter()`. `indexOf` works correctly here because filter preserves object references.

### Anti-Patterns to Avoid

- **Do NOT use `dialog.open = true`** (prop attribute). Always call `dialog.showModal()` imperatively via ref — the prop bypasses the modal stack and does not create a backdrop.
- **Do NOT debounce score slider dispatch.** Score changes must be immediate for live mark recompute. Only notes textareas need debounce.
- **Do NOT store computed marks in state.** `computeTopicMark(topic, scores, override)` is a pure function — call it at render time, never cache in Zustand.
- **Do NOT use `score === 0` as "unscored".** Score 0 is a valid score. The unscored state is `score === null` (absent from the `scores` record or explicitly null).
- **Do NOT construct score keys with sectionId.** `scoring.ts` uses `${topic.id}-${questionIndex}`. Keys with sectionId prepended will never match and questions will never score.
- **Do NOT call `computeTopicMark` with filtered questions.** Pass the full `topic` (which includes `topic.questions` — all questions), not a filtered subset. Only `scores` keys for visible questions will exist; missing keys are treated as unscored by the `typeof score !== 'number'` guard.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal with focus trap | Custom overlay div + JS tabindex management | Native `<dialog>` + `keydown` handler | `<dialog>` handles Escape natively, backdrop via `::backdrop`, accessibility semantics built in |
| Slider styling | Custom track + thumb with divs | `accent-blue-600` Tailwind class on native `<input type="range">` | `accent-color` CSS property handles cross-browser thumb/track color with one line |
| Score persistence debounce | Custom debounce from scratch | `useRef + setTimeout` (same pattern as search) | Already established in codebase; matches storageAdapter 300ms timing |
| Schema validation | Custom if/else type guards | valibot V3SessionSchema | Already used for V2; migration fixture-test pattern established |
| Custom question IDs | Sequential numeric counter (`customSeq`) | `` `custom-${topicId}-${Date.now()}` `` | Eliminates `customSeq` state; timestamp IDs are unique enough within a session |

**Key insight:** This phase deliberately uses zero new npm packages. All required primitives (dialogs, sliders, textareas, selects) are native HTML elements; all required logic (scoring, persistence, validation) exists in the codebase.

---

## Critical Findings

### Finding 1: Question Key Scheme Discrepancy (BLOCKING)

**CONTEXT.md says:** `${sectionId}-${topicId}-${questionIndex}`
**`src/scoring/scoring.ts` (locked in Phase 2) actually uses:** `${topic.id}-${questionIndex}`

```
// Source: src/scoring/scoring.ts line 52 [VERIFIED: src/scoring/scoring.ts]
const key = `${topic.id}-${i}`;
```

The scoring.ts key scheme is authoritative — Phase 2 locked it and tests pin it. The planner must use `${topicId}-${questionIndex}` everywhere in Phase 5. V2Session already uses this scheme (`questionScore` keys). The CONTEXT.md description is wrong.

### Finding 2: buildFlatRows Index Bug (BLOCKING for correctness under filters)

`buildFlatRows` (line 137): `topic.filteredQuestions.forEach((question, index) => ...)` emits the filtered-subset index as `QuestionRow.index`. When difficulty filtering hides some questions, a question at original position 3 gets `index=1` (if 2 questions before it were filtered). Score key constructed in `QuestionCard` as `` `${topicId}-${row.index}` `` would then be `topicId-1` instead of `topicId-3`, silently scoring the wrong question.

**Fix required in `buildFlatRows`:** Replace `forEach((question, index))` with a loop that computes `topic.questions.indexOf(question)` as the index.

**Impact on tests:** `buildFlatRows.test.ts` must add a test case that applies difficulty filtering and verifies `QuestionRow.index` matches the original `topic.questions` position.

### Finding 3: `uiState` Hydration is Currently a Stub (NON-BLOCKING but must fix in Phase 5)

`main.tsx` reads `(initialState as Record<string, unknown>).uiState` but `bootstrap()` returns `{manifest, sessions}`. The `uiState` key is written to chrome.storage.local by `storageAdapter.write({uiState: {...}})` but is never read back. Phase 5 wiring task must add:

```typescript
// After bootstrap() call in main.tsx:
const uiStateData = await storageAdapter.read(['uiState']);
const uiState = uiStateData.uiState as Partial<AppState> | undefined;
```

### Finding 4: `activeSessionId` Must Be Added to AppState

The `resetAll()` action and the session subscribe handler both need `activeSessionId`. Currently it is NOT in `AppState`. Phase 5 must add `activeSessionId: string` to `AppState` and hydrate it from `bootstrap().manifest.activeSessionId` in `main.tsx`.

### Finding 5: Custom Questions V2→V3 Shape Change

V2 stores custom questions as `Record<string, Array<{id: number, text, level}>>` (keyed by topicId, with numeric `id`). V3 stores them as `CustomQuestion[]` (flat array with string `id`). The V2→V3 migration must flatten and convert IDs:

```typescript
// V2 shape: customQuestions: Record<string, Array<{id: number, text, level}>>
// V3 shape: customQuestions: CustomQuestion[]  where CustomQuestion = {id: string, topicId: string, text: string, level: Difficulty}

function migrateCustomQuestions(
  v2CQs: Record<string, Array<{id: number; text: string; level: string}>>
): CustomQuestion[] {
  return Object.entries(v2CQs).flatMap(([topicId, qs]) =>
    qs.map((q) => ({
      id: `custom-${topicId}-${q.id}`,
      topicId,
      text: q.text,
      level: q.level as Difficulty,
    }))
  );
}
```

---

## Common Pitfalls

### Pitfall 1: Score = 0 Treated as Unscored

**What goes wrong:** Code uses `if (!score)` or `score || defaultValue` — falsy check fails for 0.
**Why it happens:** 0 is falsy in JavaScript.
**How to avoid:** Always `score !== null` and `typeof score === 'number'`. The scoring engine already uses `typeof score !== 'number'` guard. Components must match.
**Warning signs:** Questions scored 0 show "— / 10" instead of "0 / 10".

### Pitfall 2: Calling `computeTopicMark` with Filtered Questions

**What goes wrong:** Passing `topic.filteredQuestions` (from `buildFlatRows`) to `computeTopicMark` instead of the full `topic`.
**Why it happens:** `buildFlatRows` attaches `filteredQuestions` to topic objects for rendering. `computeTopicMark` iterates `topic.questions` — passing the wrong object produces wrong weighted averages.
**How to avoid:** Always call `computeTopicMark(topic, scores, override)` where `topic` is from `DEFAULT_SECTIONS` or `customQuestions`, not from a `TopicRow`.
**Warning signs:** Topic mark changes when difficulty filter is applied (scores should not change when only the view filter changes).

### Pitfall 3: `dialog.open` vs `dialog.showModal()`

**What goes wrong:** Setting `<dialog open>` as a prop renders an open dialog but without the modal backdrop, without `::backdrop` styling, and without `inert` on the rest of the page.
**Why it happens:** `<dialog open>` is a non-modal dialog. `showModal()` is the modal API.
**How to avoid:** Call `dialogRef.current.showModal()` in a React `useEffect` or event handler. Use `useRef<HTMLDialogElement>`.
**Warning signs:** Dialog shows without darkened backdrop; Tab key exits dialog without cycling within.

### Pitfall 4: Focus Trap Not Updating for Dynamic Content

**What goes wrong:** Focus trap queries focusable elements once at mount, but "Reset details" in CandidateModal changes visible fields dynamically.
**Why it happens:** `querySelectorAll` result is static.
**How to avoid:** Query focusable elements inside the `handleKeyDown` handler (not at setup time) so the list is always current.

### Pitfall 5: `storageAdapter.write` Race on resetAll

**What goes wrong:** `resetAll()` dispatches to Zustand, triggering the subscribe handler's `storageAdapter.write()` with empty state — but the snapshot hasn't been written yet (it's async).
**Why it happens:** `storageAdapter.snapshot(sessionId)` is `async`; if `resetAll()` fires immediately after calling it (without `await`), the snapshot write races with the empty-state write.
**How to avoid:** `await storageAdapter.snapshot(activeSessionId)` before calling `resetAll()`. The reset handler in `ResetConfirmDialog` must be `async`.

### Pitfall 6: `buildFlatRows` Receives Topic with filteredQuestions for computeTopicMark

**What goes wrong:** `TopicRow` receives a `TopicRow` which has a `topic` field containing `filteredQuestions` (added by `buildFlatRows`). If `TopicMarkDisplay` passes `row.topic` directly to `computeTopicMark`, it will use the spread-extended object that has `filteredQuestions` but still has `questions` intact. This is safe — but worth documenting to avoid accidental use of `filteredQuestions` for scoring.
**How to avoid:** `computeTopicMark(row.topic, scores, override)` — `Topic.questions` is the correct field; `filteredQuestions` is an extra field added by `buildFlatRows` that does not affect the Topic interface.

---

## Code Examples

### Example 1: Question Score Key Construction

```typescript
// Source: src/scoring/scoring.ts line 52 [VERIFIED: src/scoring/scoring.ts]
// QuestionRow.index is the original topic.questions index (after Phase 5 buildFlatRows fix)
const questionId = `${row.topicId}-${row.index}`;
// e.g. "twig-0", "twig-4", "js-2"
```

### Example 2: computeTopicMark with Custom Questions

```typescript
// Source: src/scoring/scoring.ts signature [VERIFIED: src/scoring/scoring.ts]
// computeTopicMark accepts any Topic — including one with custom questions appended
// CustomQuestion must satisfy the Question interface: {q: string, level: Difficulty}

const customQsForTopic = customQuestions
  .filter((cq) => cq.topicId === topic.id)
  .map((cq) => ({ q: cq.text, level: cq.level }));

const topicWithCustom: Topic = {
  ...topic,
  questions: [...topic.questions, ...customQsForTopic],
};

const result = computeTopicMark(topicWithCustom, scores, overrides[topic.id] ?? null);
```

Custom question score keys use the appended index, e.g. if topic has 12 built-in questions, first custom question gets index 12 → key `topicId-12`. Custom question IDs (`custom-${topicId}-${Date.now()}`) are UI IDs; score map keys are always `${topicId}-${index}`.

### Example 3: Mark Band Color Class Map

```typescript
// Source: 05-CONTEXT.md decisions + 05-UI-SPEC.md Color section
// [VERIFIED: 05-UI-SPEC.md]
const BAND_COLORS: Record<MarkBand, string> = {
  none: 'text-gray-400 dark:text-gray-500',
  low:  'text-red-500 dark:text-red-400',
  mid:  'text-yellow-500 dark:text-yellow-400',
  good: 'text-green-600 dark:text-green-400',
  high: 'text-emerald-600 dark:text-emerald-400',
} as const;

// Usage:
const { band } = computeTopicMark(topic, scores, override);
const colorClass = BAND_COLORS[band];
```

### Example 4: V3 Session Schema (valibot)

```typescript
// Extend src/storage/types.ts
// Source: existing V2SessionSchema pattern [VERIFIED: src/storage/types.ts]
import * as v from 'valibot';

export const CustomQuestionSchema = v.object({
  id: v.string(),
  topicId: v.string(),
  text: v.string(),
  level: v.union([
    v.literal('novice'), v.literal('intermediate'),
    v.literal('advanced'), v.literal('expert'),
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
  candidate: v.nullable(CandidateSchema),  // CandidateSchema already in types.ts
});

export type V3Session = v.InferOutput<typeof V3SessionSchema>;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radix UI Dialog / Headless UI | Native `<dialog>` element | Chrome 122+ (2024) | No npm dependency; `::backdrop` built-in; accessibility semantics native |
| Custom slider with divs | `<input type="range">` + `accent-color` | CSS accent-color — Chrome 93+ (2021) | One CSS class for branded slider color |
| Zustand `persist` middleware | Custom subscribe + storageAdapter | Phase 3 decision | Direct `chrome.storage.local` control; no JSON parse limitations |

**Deprecated/outdated:**
- `ReactDOM.createPortal` for modals: still works but native `<dialog>` is preferred for new code in Chrome-only contexts
- `event.key === 'Escape'` manual handler for dialogs: native `<dialog>` fires `cancel` event + `close` event on Escape; no manual handler needed

---

## Runtime State Inventory

> Not a rename/refactor/migration phase — this section is not applicable.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + tests | ✓ | 20.20.2 | — |
| npm | Package management | ✓ | 10.8.2 | — |
| React 19 | All components | ✓ | 19.2.7 | — |
| Zustand 5 | State management | ✓ | 5.0.14 | — |
| valibot | Schema validation | ✓ | 1.4.1 | — |
| @testing-library/react | Component tests | ✓ | 16.3.2 | — |
| happy-dom | Test environment | ✓ | 20.10.4 | — |
| happy-dom `<dialog>` support | Dialog tests | ✓ | `showModal()`/`close()` present | — |
| Vitest | Test runner | ✓ | 4.1.9 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

All runtime dependencies are present and at required versions.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run` |
| Coverage command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCORE-01 | Range input renders with correct aria-label, aria-valuenow | unit/component | `npx vitest run src/components/QuestionCard.test.tsx` | ❌ Wave 0 |
| SCORE-01 | setScore dispatches correct key `${topicId}-${index}` | unit/component | `npx vitest run src/components/QuestionCard.test.tsx` | ❌ Wave 0 |
| SCORE-02 | TopicMarkDisplay shows computed mark with correct band color | unit/component | `npx vitest run src/components/TopicMarkDisplay.test.tsx` | ❌ Wave 0 |
| SCORE-02 | Override input on blur dispatches setOverride; clear button sets null | unit/component | `npx vitest run src/components/TopicMarkDisplay.test.tsx` | ❌ Wave 0 |
| SCORE-03 | Notes textarea dispatches setNote after 300ms debounce | unit/component | `npx vitest run src/components/QuestionCard.test.tsx` | ❌ Wave 0 |
| SCORE-03 | Topic notes textarea dispatches setTopicNote | unit/component | `npx vitest run src/components/TopicRow.test.tsx` | ❌ existing file — new tests |
| SCORE-04 | CandidateModal dialog.showModal() called on trigger click | unit/component | `npx vitest run src/components/CandidateModal.test.tsx` | ❌ Wave 0 |
| SCORE-04 | Focus trap: Tab cycles within dialog | unit/component | `npx vitest run src/components/CandidateModal.test.tsx` | ❌ Wave 0 |
| SCORE-05 | addCustomQuestion dispatches with correct shape | unit | `npx vitest run src/store/app.test.ts` | ❌ new tests in existing file |
| SCORE-05 | deleteCustomQuestion removes by id | unit | `npx vitest run src/store/app.test.ts` | ❌ new tests in existing file |
| SCORE-06 | ResetConfirmDialog snapshot called before resetAll | unit/component | `npx vitest run src/components/ResetConfirmDialog.test.tsx` | ❌ Wave 0 |
| SCORE-06 | resetAll clears all scoring fields | unit | `npx vitest run src/store/app.test.ts` | ❌ new tests in existing file |
| (V3 migration) | migrateV2ToV3 maps all V2 fields to V3 correctly | unit | `npx vitest run src/storage/migrations/v2-to-v3.test.ts` | ❌ Wave 0 |
| (buildFlatRows fix) | QuestionRow.index = original topic.questions index under filtering | unit | `npx vitest run src/utils/buildFlatRows.test.ts` | ❌ new test in existing file |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=dot`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `npm run ci` (biome + tsc --noEmit) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/QuestionCard.test.tsx` — covers SCORE-01 (slider), SCORE-03 (notes)
- [ ] `src/components/TopicMarkDisplay.test.tsx` — covers SCORE-02 (mark display, override)
- [ ] `src/components/CandidateModal.test.tsx` — covers SCORE-04 (dialog, focus trap)
- [ ] `src/components/ResetConfirmDialog.test.tsx` — covers SCORE-06 (confirm, snapshot)
- [ ] `src/components/CustomQuestionForm.test.tsx` — covers SCORE-05 (add, delete)
- [ ] `src/storage/migrations/v2-to-v3.test.ts` — covers V3 schema migration
- New tests in `src/store/app.test.ts` — SCORE-05 store actions, SCORE-06 resetAll
- New test in `src/utils/buildFlatRows.test.ts` — filtered index correctness

---

## Security Domain

### Applicable ASVS Categories (security_asvs_level: 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Extension has no auth |
| V3 Session Management | no | Single-session; Phase 6 adds multi-session |
| V4 Access Control | no | Single-user local tool |
| V5 Input Validation | yes | valibot V3SessionSchema on read; `clamp(0, 10)` on override input |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Corrupt/tampered session data in chrome.storage.local | Tampering | valibot `safeParse(V3SessionSchema)` on every session read; invalid data → use `createDefaultSession()` |
| XSS via question text or notes in aria-label | Tampering | React JSX string values are HTML-entity-escaped automatically; aria-label is an attribute, not innerHTML |
| Extremely long notes/candidate text causing storage overflow | Denial of Service | `storageAdapter.#checkQuota()` fires at 80% threshold; toast displayed; no hard limit on input length (by design — user content) |
| Score values outside 0–10 range | Tampering | Override input: clamp on blur; slider min/max enforced by browser for mouse; keyboard can exceed — add `Math.min(10, Math.max(0, value))` in `setScore` action |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dialog.showModal()` and `dialog.close()` are available in happy-dom 20.10.4 | Pattern 4 | Dialog tests would need workaround (mock showModal); confirm via actual test run in Wave 0 |
| A2 | `topic.questions.indexOf(question)` correctly identifies original index after filter (object reference identity preserved) | Pattern 8 | Would need alternative index-tracking approach in buildFlatRows; low risk since `.filter()` preserves references |
| A3 | V2 `cardComment` maps to V3 `topicNotes` and V2 `questionComment` maps to V3 `notes` (semantic equivalence) | Pattern 2 / Finding 5 | Data migration would use wrong mapping; verify against V1Schema field names and V2 migration intent |
| A4 | `computeTopicMark` correctly handles a `Topic` object with custom questions appended to `questions` array (since it only uses `topic.questions` and `q.level`) | Example 2 | Custom questions would not contribute to scoring; medium risk — verify with targeted test |
| A5 | Native `<input type="range">` `onChange` fires on every increment with keyboard arrow keys in React 19 + happy-dom | Pattern 5 | Score may not update on keyboard navigation; can test in Wave 0 |

**5 assumptions recorded above.** Claims tagged [ASSUMED] signal planner to add verification steps.

---

## Open Questions

1. **Should `uiState` read be added to `bootstrap()` or to `main.tsx` directly?**
   - What we know: `storageAdapter.write({uiState: {...}})` stores it as a root key; `bootstrap()` reads only `manifest` and `session:<id>` keys
   - What's unclear: Cleanest architectural location for the fix
   - Recommendation: Add to `main.tsx` as a separate `storageAdapter.read(['uiState'])` call after `bootstrap()`. Keep `bootstrap()` focused on migration + session hydration only. Document the fix as part of the main.tsx wiring task.

2. **Should `activeSessionId` be persisted in `uiState` or read from `manifest.activeSessionId`?**
   - What we know: `V2Manifest.activeSessionId` already exists in storage; `manifest` is returned from `bootstrap()`
   - Recommendation: Read from `bootstrap().manifest.activeSessionId` — this is already in storage, no duplication needed.

3. **Does `computeTopicMark` need a `totalCount` update when custom questions are added?**
   - What we know: `TopicResult.totalCount = topic.questions.length` — if we pass `topicWithCustom`, totalCount would include custom questions
   - Recommendation: Yes, pass the merged topic — `totalCount` should reflect all questions including custom ones for the "X of N scored" display.

---

## Sources

### Primary (MEDIUM confidence — VERIFIED from codebase)

- `src/scoring/scoring.ts` — computeTopicMark, ScoreMap, key scheme `${topic.id}-${i}`, MarkBand thresholds
- `src/storage/adapter.ts` — `snapshot(sessionId: string): Promise<void>` signature confirmed
- `src/storage/types.ts` — V2SessionSchema fields, CandidateSchema, custom questions shape
- `src/store/app.ts` — AppState, AppActions, subscribe pattern, DEFAULT_STATE
- `src/utils/buildFlatRows.ts` — QuestionRow.index bug confirmed (filteredQuestions.forEach index)
- `src/components/QuestionCard.tsx`, `TopicRow.tsx`, `ActionsGroup.tsx`, `SectionFilter.tsx` — Phase 4 stub state
- `src/app/main.tsx` — uiState hydration stub (bootstrap() cast is always undefined)
- `05-CONTEXT.md` — locked decisions, types, deferred items
- `05-UI-SPEC.md` — component markup, color tokens, interaction contracts, copywriting

### Secondary (LOW confidence — not externally verified this session)

- [ASSUMED] React 19 `<input type="range">` `onChange` behavior with keyboard events
- [ASSUMED] MDN focus-trap pattern for native `<dialog>`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against installed node_modules
- Architecture: HIGH — all patterns derived from existing codebase files, not external docs
- Schema migration: HIGH — V2 fields verified, V3 design follows established valibot pattern
- Dialog/focus trap: MEDIUM — happy-dom showModal confirmed via inspection; focus trap pattern is standard
- Pitfalls: HIGH — derived from direct code inspection, not external sources

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable stack; no fast-moving dependencies)
