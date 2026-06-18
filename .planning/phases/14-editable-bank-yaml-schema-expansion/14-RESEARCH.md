# Phase 14: Editable Bank & YAML Schema Expansion - Research

**Researched:** 2026-06-18
**Domain:** Zustand store mutations, TanStack Virtual row pipeline, YAML v2 schema, React inline forms
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Removed-entity tracking model**
- Default questions: Set-based filter model — `removedDefaultQuestionIds: Set<string>` (default: `new Set()`). `sections[]` stays canonical; removal applied at render and export time.
- User-added sections (BANK-02) and topics (BANK-04): mutate `sections[]` directly — splice out the entry.

**D-02: Store field additions**
- Add `removedDefaultQuestionIds: Set<string>` to `AppState` / `V4Session`.
- New actions: `addSection`, `removeSection`, `addTopic`, `removeTopic`, `removeDefaultQuestion`.

**D-03: Add affordance placement**
- "Add topic": inline form at bottom of a section's topic list (mirrors `addQOpen` pattern in TopicRow).
- "Add section": inline form below all sections at the bottom of ContentTree.
- Both inline, no modal, name-only for sections, name + optional description for topics.

**D-04: Remove affordances**
- User-added topic: `×` button on topic header row, only when `!topic.isDefault`, with `stopPropagation`.
- User-added section: `×` button on section header row, only when `!section.isDefault`.
- Default question (BANK-05): same delete button as custom questions, wired to `removeDefaultQuestion(question.id)`.

**D-05: YAML schema version bump to v2**
- `schemaVersion: 1 → 2`.
- Default questions: add `text: string` and `level: Difficulty` fields.
- New optional top-level `bank` key: `removedQuestionIds[]` + `addedSections[]`.
- Legacy compat: `schemaVersion < 2` or missing `bank` key → no removals, no bank reconstruction.

**D-06: Custom question note import fix (YAML-05)**
- In `yamlImport.ts`, when processing `customQuestions`, also write `notes[newId]` from the `note` field. The scoring loop at line ~462–468 handles score but currently misses the note.

**D-07: ID format for user-added entities**
- User-added section: `custom-section-${Date.now()}`
- User-added topic: `custom-topic-${sectionId}-${Date.now()}`
- User-added topic questions: `custom-${topicId}-${Date.now()}` (same as existing custom questions)

**D-08: ContentTree rendering of removed default questions**
- `buildFlatRows.ts` must filter out questions whose `id` is in `removedDefaultQuestionIds`.

### Claude's Discretion

No discretion areas defined in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- Removing default sections or default topics
- Undo/redo for bank mutations
- Re-ordering sections/topics
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BANK-01 | User can add a new section to the active session | D-02 `addSection` action + D-03 `AddSectionForm` component at ContentTree bottom |
| BANK-02 | User can remove a non-default/user-added section | D-01 splice + D-04 `×` on section header + D-02 `removeSection` action |
| BANK-03 | User can add a new topic to any section | D-02 `addTopic` action + D-03 `AddTopicForm` per-section inline form |
| BANK-04 | User can remove a non-default/user-added topic | D-01 splice + D-04 `×` on topic header + D-02 `removeTopic` action |
| BANK-05 | User can remove default questions using same affordance as custom questions | D-01 Set model + D-04 QuestionCard extension + D-02 `removeDefaultQuestion` action |
| YAML-04 | Default question YAML export entries include `text` and `level` fields | D-05 schema v2 + exportSession change in yamlExport.ts |
| YAML-05 | Custom question notes survive export → import | D-06 import-side bug fix in yamlImport.ts line ~466 |
| YAML-06 | Full editable-bank state round-trips through YAML | D-05 `bank` key: `removedQuestionIds` + `addedSections` |
</phase_requirements>

---

## Summary

Phase 14 extends an existing, fully-shipped v4 session data model with two capabilities: (1) in-session bank editing (add/remove sections, topics, and default questions), and (2) YAML schema v2 that round-trips the new editable state. Both capabilities build on well-established patterns already in the codebase — the inline `CustomQuestionForm`, the `addCustomQuestion`/`deleteCustomQuestion` store pattern, and the existing `yamlExport`/`yamlImport` module pair.

The primary complexity is the virtualizer constraint: `ContentTree.tsx` uses `@tanstack/react-virtual` and all rows (including new `add-section-trigger`, `add-section-form`, `add-topic-trigger`, and `add-topic-form` types) must be registered as proper virtual row entries in `buildFlatRows.ts`. Row types cannot be rendered outside the virtualizer container. The `ESTIMATE_SIZE` map in `ContentTree.tsx` must also be extended for the new row types.

A secondary complexity is the TopicRow HTML semantics issue: the topic-expand area is currently a `<button>`, and a delete `<button>` inside it is invalid HTML. The recommended fix is to refactor the topic header from `<button>` to `<div role="button" tabIndex={0}>` with a sibling delete button in a wrapping flex div.

The store subscribe block at the bottom of `app.ts` writes `V4Session` to storage on every mutation. It does not currently persist `removedDefaultQuestionIds`. That field must be added to both `AppState`, the `V4SessionSchema` valibot schema, and the subscribe write block — otherwise removed questions reappear after page reload.

**Primary recommendation:** Follow the implementation order — (1) types/schema, (2) store actions + persistence, (3) buildFlatRows filter + new row types, (4) UI components, (5) YAML changes, (6) tests — because each layer depends on the previous.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bank mutation (add/remove section/topic) | Store (Zustand) | — | Mutations must be immediately reflected in all subscribers including ContentTree rows and SectionFilter counts |
| Default question removal tracking | Store (Zustand) | Storage (persistence) | Set must survive page reload — needs to be in V4Session and written by subscribe block |
| Row pipeline for new affordances | buildFlatRows util | ContentTree virtualizer | New trigger/form row types enter the same flat-rows pipe that feeds the virtualizer |
| Inline add forms | UI Components (React) | Store | Local `addXOpen` toggle state lives in the component; confirmed data dispatches to store |
| Delete controls on rows | UI Components (React) | Store | Visual placement per UI-SPEC; actual mutation via store action |
| YAML v2 schema | yamlExport.ts + yamlImport.ts | — | Pure utility layer; no React, no DOM, no store — fully unit-testable |
| YAML `bank` delta persistence | yamlExport.ts | — | Export reads `removedDefaultQuestionIds` + user-added sections from store state |
| YAML `bank` delta restoration | yamlImport.ts + importSession | Store | Import reconstructs sections array + removedDefaultQuestionIds and patches store via importSession |

---

## Standard Stack

No new packages are introduced in Phase 14. All implementation uses existing dependencies. [VERIFIED: codebase scan]

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.x (project) | Store state + actions | All session mutations go through Zustand; established project pattern |
| @tanstack/react-virtual | 3.x (project) | ContentTree row virtualization | Already in use; all rows must go through it |
| js-yaml | 4.x (project) | YAML serialization/deserialization | Already used in yamlExport.ts + yamlImport.ts |
| valibot | 1.x (project) | Runtime schema validation for V4Session | V4SessionSchema must be updated to include `removedDefaultQuestionIds` |
| vitest | 4.x (project) | Test runner | Project standard; `npm test` = `vitest run` |

**Installation:** No new packages. Zero `npm install` calls in this phase.

---

## Package Legitimacy Audit

No new external packages are introduced in Phase 14. All dependencies are already in the project's `package.json`. This section is not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
User action (click "Add section" / "+ Add topic" / "×" delete)
        │
        ▼
React component (AddSectionForm / AddTopicForm / SectionRow / TopicRow / QuestionCard)
        │   local state toggle (addSectionOpen / addTopicOpen)
        │   on submit/click ──► store action
        ▼
Zustand store action
  addSection()        →  sections.push(newSection)
  removeSection()     →  sections.filter(s => s.id !== id)
  addTopic()          →  find section, topic array push
  removeTopic()       →  find section, topic array filter
  removeDefaultQuestion() → removedDefaultQuestionIds.add(id)
        │
        ▼  (subscribe fires on every mutation)
storageAdapter.write({ `session:${id}`: { ...V4Session, removedDefaultQuestionIds: [...set] } })
        │
        ▼
chrome.storage.local (persisted)

                              ▼  (render path)
App.tsx ──► buildFlatRows(state.sections, ..., { removedDefaultQuestionIds })
                │
                │  new row types: add-section-trigger, add-section-form,
                │                 add-topic-trigger, add-topic-form
                ▼
ContentTree → @tanstack/react-virtual → SectionRow / TopicRow / QuestionCard
                                        + new AddSectionForm / AddTopicForm components

                              ▼  (YAML path)
exportSession(V4Session, sections, removedDefaultQuestionIds)
  → schemaVersion: 2
  → default questions: { index, score, note, text, level }
  → bank: { removedQuestionIds: [...], addedSections: [...] }
        │
        ▼
downloadYaml() → user saves file

        file ──► ActionsGroup → parseYaml → detectFormat → parseStructural
                              → (schemaVersion check) → bank delta extraction
                              → reKeyImportResultToV4
                              → importSession()
                              → store.sections patched + removedDefaultQuestionIds restored
```

### Recommended Project Structure

```
src/
├── store/
│   └── app.ts                     # ADD: removedDefaultQuestionIds, 5 new actions
├── storage/
│   └── types.ts                   # ADD: removedDefaultQuestionIds to V4SessionSchema + V4Session type
├── utils/
│   ├── buildFlatRows.ts           # ADD: removedDefaultQuestionIds filter param + new row types
│   ├── yamlExport.ts              # MODIFY: accept V4Session, add text/level, add bank block, bump schemaVersion
│   └── yamlImport.ts             # MODIFY: bank delta extraction, YAML-05 note fix
├── components/
│   ├── ContentTree.tsx            # ADD: ESTIMATE_SIZE entries + render new row types
│   ├── SectionRow.tsx             # ADD: × delete button for user-added sections
│   ├── TopicRow.tsx               # ADD: × delete button for user-added topics + AddTopicForm trigger
│   ├── QuestionCard.tsx           # MODIFY: delete button visibility extended to default questions
│   ├── AddSectionForm.tsx         # NEW: inline form for adding a section
│   └── AddTopicForm.tsx           # NEW: inline form for adding a topic
```

### Pattern 1: Store mutation — sections array (addSection / removeSection / addTopic / removeTopic)

**What:** Directly mutate `sections[]` in the Zustand store using `set((s) => ...)`.
**When to use:** For user-added entities only — splice out on remove, push on add.

```typescript
// Source: codebase — app.ts addCustomQuestion / deleteCustomQuestion pattern (lines 326-333)
addSection: (section) =>
  set((s) => ({ sections: [...s.sections, section] })),

removeSection: (sectionId) =>
  set((s) => ({
    sections: s.sections.filter((sec) => sec.id !== sectionId),
  })),

addTopic: (sectionId, topic) =>
  set((s) => ({
    sections: s.sections.map((sec) =>
      sec.id === sectionId
        ? { ...sec, topics: [...sec.topics, topic] }
        : sec
    ),
  })),

removeTopic: (topicId) =>
  set((s) => ({
    sections: s.sections.map((sec) => ({
      ...sec,
      topics: sec.topics.filter((t) => t.id !== topicId),
    })),
  })),
```

[VERIFIED: codebase — analogous pattern at app.ts lines 326–333]

### Pattern 2: Store mutation — removedDefaultQuestionIds Set

**What:** Maintain a `Set<string>` for removed default question IDs.
**When to use:** For default questions only (BANK-05). Never splice the bank — the Set is the filter.

```typescript
// Source: codebase — analogous to selectedDifficulties Set pattern (app.ts lines 265-277)
removeDefaultQuestion: (questionId) =>
  set((s) => {
    const next = new Set(s.removedDefaultQuestionIds);
    next.add(questionId);
    return { removedDefaultQuestionIds: next };
  }),
```

[VERIFIED: codebase — Set mutation pattern from toggleDifficulty at app.ts lines 265-274]

### Pattern 3: buildFlatRows — filtering removed default questions

**What:** Pass `removedDefaultQuestionIds` into `buildFlatRows` and filter at question iteration.
**When to use:** Before pushing a QuestionRow, check `removedDefaultQuestionIds.has(question.id)`.

```typescript
// Source: codebase — buildFlatRows.ts, analogous to difficulty filter at lines 93-108
// In the question iteration loop:
for (const question of topic.filteredQuestions) {
  if (filters.removedDefaultQuestionIds?.has(question.id)) continue;
  const index = topic.questions.indexOf(question);
  rows.push({ type: 'question', ... });
}
```

Note: `question.id` is the V4Question `id` field (e.g., `twig-q0`). The score key is the same string in V4 format. This alignment is intentional from Phase 11 materialization (`id: \`${topic.id}-q${idx}\`` in v3-to-v4.ts line 52). [VERIFIED: codebase — v3-to-v4.ts line 52]

### Pattern 4: buildFlatRows — new virtual row types

**What:** Add new row types to the `VirtualRow` union for add affordances.
**When to use:** All new UI elements rendered in the virtualizer scroll area must be rows.

```typescript
// Source: codebase — buildFlatRows.ts VirtualRow union (lines 42-43), CONTEXT.md D-03
export type AddTopicTriggerRow = {
  type: 'add-topic-trigger';
  sectionId: string;
};
export type AddTopicFormRow = {
  type: 'add-topic-form';
  sectionId: string;
};
export type AddSectionTriggerRow = { type: 'add-section-trigger' };
export type AddSectionFormRow   = { type: 'add-section-form' };

export type VirtualRow =
  | SectionRow | TopicRow | QuestionRow
  | AddTopicTriggerRow | AddTopicFormRow
  | AddSectionTriggerRow | AddSectionFormRow;
```

ContentTree `ESTIMATE_SIZE` map must include entries for all four new types:
```typescript
const ESTIMATE_SIZE: Record<VirtualRow['type'], number> = {
  section: 52,
  topic: 44,
  question: 72,
  'add-topic-trigger': 32,
  'add-topic-form': 120,
  'add-section-trigger': 32,
  'add-section-form': 120,
};
```

[VERIFIED: codebase — ContentTree.tsx lines 10-15 + CONTEXT.md phase-specific constraint 1]

### Pattern 5: Inline add form (mirrors CustomQuestionForm)

**What:** Local `boolean` state toggle in the parent row component; form dismissed via `onDismiss` callback.
**When to use:** `AddSectionForm` and `AddTopicForm` follow the exact same structure as `CustomQuestionForm`.

```typescript
// Source: codebase — TopicRow.tsx lines 47, 101-114
const [addTopicOpen, setAddTopicOpen] = useState(false);

// In render:
{addTopicOpen ? (
  <AddTopicForm sectionId={sectionId} onDismiss={() => setAddTopicOpen(false)} />
) : (
  <button onClick={() => setAddTopicOpen(true)} className="text-xs text-gray-500 ... px-8 py-2 print:hidden">
    + Add topic
  </button>
)}
```

[VERIFIED: codebase — TopicRow.tsx lines 47, 101-114]

### Pattern 6: YAML v2 export structure

**What:** `exportSession` must accept V4Session instead of V3Session and emit schemaVersion 2 with added fields.
**When to use:** The function signature changes from `(session: V3Session, name: string, sections: Section[])` to `(session: V4Session, name: string)` — V4Session already carries `sections[]`.

```typescript
// Source: codebase — yamlExport.ts + CONTEXT.md D-05
{
  meta: { schemaVersion: 2, sessionName, exportedAt },
  candidate: ...,
  sections: session.sections.map((section) => ({
    id, label, icon,
    topics: section.topics.map((topic) => ({
      id, name, override, topicNote,
      questions: topic.questions
        .filter(q => !session.removedDefaultQuestionIds.has(q.id))
        .map((q, index) => ({
          index,
          text: q.text,         // NEW in v2
          level: q.level,       // NEW in v2
          score: session.scores[`${topic.id}-q${index}`] ?? null,
          note: session.notes[`${topic.id}-q${index}`] ?? '',
        })),
      customQuestions: topicCustomQs.map(cq => ({
        id: cq.id, text: cq.text, level: cq.level,
        score: session.scores[cq.id] ?? null,
        note: session.notes[cq.id] ?? '',
      })),
    })),
  })),
  bank: {
    removedQuestionIds: [...session.removedDefaultQuestionIds],
    addedSections: session.sections.filter(s => !s.isDefault),
  },
}
```

[VERIFIED: codebase — yamlExport.ts + CONTEXT.md D-05]

### Pattern 7: YAML-05 custom question note fix

**What:** In `yamlImport.ts` `parseStructural`, the custom question loop already writes `result.scores[newId]` but does not write `result.notes[newId]`. The fix is a one-line addition.
**Where:** Lines ~462–469 of yamlImport.ts. The `if (typeof cq.note === 'string' && cq.note !== '')` check already exists at line 466 — it should write to `result.notes[newId]`, not be absent.

Looking at the current code (lines 462–468):
```typescript
if (typeof cq.score === 'number') {
  result.scores[newId] = cq.score;
  modifiedCount++;
}
if (typeof cq.note === 'string' && cq.note !== '') {
  result.notes[newId] = cq.note;   // line 467 — already present!
}
```

Wait — re-reading the actual code at lines 462–469: the note is actually already written to `result.notes[newId]` at line 467. The CONTEXT.md D-06 says "the import currently writes `notes[questionKey]` only for scored questions." However the actual codebase has the note write at line 466-468. **This means YAML-05 may already be partially fixed at the code level** — the planner should verify by running the existing yamlImport.test.ts and checking whether a custom question note round-trips. The test at line ~431 covers scoring but does not appear to assert on notes. A new test is still needed to verify the round-trip.

[VERIFIED: codebase — yamlImport.ts lines 462-469]

### Pattern 8: subscribe block persistence for removedDefaultQuestionIds

**What:** The Zustand subscribe block in `app.ts` (lines 665-706) writes `V4Session` to storage. It must include `removedDefaultQuestionIds`.
**Critical:** Sets are not JSON-serializable. The same pattern as `selectedDifficulties` (line 673: `[...state.selectedDifficulties]`) must be applied. The Set must be spread to an array on write and re-hydrated to a `Set` on read.

```typescript
// Source: codebase — app.ts lines 691-704 (subscribe block session write)
// Must add: removedDefaultQuestionIds: [...state.removedDefaultQuestionIds]
[`session:${state.activeSessionId}`]: {
  version: 4,
  id: state.activeSessionId,
  sections: state.sections,
  removedDefaultQuestionIds: [...state.removedDefaultQuestionIds],  // NEW
  scores: state.scores,
  ...
} satisfies V4Session,
```

And `V4SessionSchema` in types.ts must add the optional array field:
```typescript
removedDefaultQuestionIds: v.optional(v.array(v.string()), []),
```

[VERIFIED: codebase — app.ts lines 671-704, types.ts V4SessionSchema]

### Pattern 9: importSession store action extension

**What:** `importSession` in `app.ts` currently sets scores/notes/candidate/customQuestions but does not set `sections` or `removedDefaultQuestionIds`. When YAML-06 round-trips bank state, `importSession` must also apply imported sections and removedDefaultQuestionIds.
**Where:** Both the `overwriteActive` and `!overwriteActive` branches of `importSession` must include `sections` and `removedDefaultQuestionIds` in the `set()` call.

[VERIFIED: codebase — app.ts lines 599-638]

### Anti-Patterns to Avoid

- **Rendering add-section / add-topic forms outside the virtualizer**: ContentTree uses absolute positioning via transform translate. Elements rendered outside the virtualizer container will appear at position 0 instead of their correct scroll position.
- **Nesting `<button>` inside `<button>`**: The topic header is currently a `<button>`. Adding a delete `<button>` inside it is invalid HTML. Refactor to `<div role="button" tabIndex={0}>` + sibling `<button>`, or accept the nesting violation with a documented comment if the refactor is too large (CONTEXT.md phase-specific constraint 2).
- **Using question.id instead of score key for `removeDefaultQuestion`**: `question.id` (e.g., `twig-q0`) IS the same as the V4 score key — the migration in v3-to-v4.ts intentionally makes them equal. However, the `index`-based score key in `QuestionCard` (`${row.topicId}-q${row.index}`) is derived at render time. The store action must receive `question.id` (from the V4Question object in `sections[]`), not the runtime score key. These happen to be equal for default questions but the distinction matters for future-proofing.
- **Forgetting `removedDefaultQuestionIds` in `switchSession`**: The `switchSession` action (app.ts line 376-395) loads session data from storage and sets all per-session fields. It must also hydrate `removedDefaultQuestionIds` from the loaded V4Session.
- **Forgetting `removedDefaultQuestionIds` in `resetAll`**: `resetAll` clears scoring data. It should NOT clear `removedDefaultQuestionIds` (bank shape is separate from scoring state) unless that is an explicit design choice. The CONTEXT.md does not address this — the planner should decide.
- **Score index drift for removed default questions**: When a default question is removed from the Set but NOT from the `sections[]` array, questions after it in the topic retain their original `q${index}` score keys. This is correct — the Set-based model is explicitly non-destructive (D-01). However, the export must still use the original index position within `topic.questions` (not the filtered position) for score key derivation, same as the existing pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML serialization | Custom serializer | `js-yaml dump()` (already in use) | Handles multiline strings, null, escaping edge cases |
| Schema validation for V4Session | Manual type guards | Valibot `V4SessionSchema` (already in use) | Provides parse errors + TypeScript inference |
| Virtualized list row management | Custom scroll/offset math | `@tanstack/react-virtual` row types (extend existing) | Already managing all row heights via measureElement |
| ID generation for new entities | UUID library | `custom-section-${Date.now()}` (project convention, D-07) | Consistent with existing `custom-${topicId}-${Date.now()}` pattern |

---

## Runtime State Inventory

This phase is not a rename/refactor/migration phase. However, the schema change (adding `removedDefaultQuestionIds` to V4Session) requires noting that existing persisted V4 sessions will NOT have this field — the Valibot schema must use `v.optional(v.array(v.string()), [])` so existing sessions hydrate with an empty array and the store converts to `new Set()`.

No external runtime state (services, OS registrations, databases) is affected.

---

## Common Pitfalls

### Pitfall 1: `removedDefaultQuestionIds` not persisted across reload

**What goes wrong:** User removes a default question, page reloads, question reappears.
**Why it happens:** The subscribe block writes V4Session to storage but the field is absent.
**How to avoid:** Add `removedDefaultQuestionIds: [...state.removedDefaultQuestionIds]` to the subscribe block session write. Add the field to `V4SessionSchema` with a default of `[]`. Hydrate as `new Set(session.removedDefaultQuestionIds ?? [])` in `switchSession` and `bootstrap`.
**Warning signs:** Test: export session with removed question, reload page, check question is still absent.

### Pitfall 2: Add-section form not visible in virtualizer scroll

**What goes wrong:** The `AddSectionForm` renders at the wrong position or is invisible.
**Why it happens:** Rendered outside the virtualizer container, so it is not positioned by `translateY`.
**How to avoid:** Add `add-section-trigger` and `add-section-form` as proper row types in `buildFlatRows` output. Add height estimates to `ContentTree.tsx` `ESTIMATE_SIZE`. The form must be a virtual row, not a DOM sibling.
**Warning signs:** Form appears at the top of the content area (transform: 0) or is entirely invisible.

### Pitfall 3: QuestionCard delete button wiring confusion

**What goes wrong:** `removeDefaultQuestion` receives the score key string instead of `question.id`, or vice versa.
**Why it happens:** `QuestionCard` derives `questionId` as `` `${row.topicId}-q${row.index}` `` for the score lookup. But the action should receive `row.question.id` (the V4Question id field from `sections[]`). These are equal for default questions in Phase 11's materialization, but the code should explicitly use `row.question.id` for the store action and `questionId` for score lookup.
**How to avoid:** In `QuestionCard`, call `removeDefaultQuestion(row.question.id)` — not `removeDefaultQuestion(questionId)`.
**Warning signs:** TypeScript will allow either (both are strings) — only caught by test: verify `removedDefaultQuestionIds.has(question.id)` after action.

### Pitfall 4: TopicRow nested `<button>` HTML validity

**What goes wrong:** Browser may flatten nested buttons, breaking click propagation.
**Why it happens:** The topic expand/collapse is a `<button>`, and placing a delete `<button>` inside is invalid HTML5.
**How to avoid:** Refactor topic header to `<div role="button" tabIndex={0} onKeyDown={...}>` with a sibling `<button>` for delete, both inside a `<div className="flex">` wrapper. If this refactor is too large, use `stopPropagation` and add a `{/* HTML nesting violation: delete button inside expand button — acceptable trade-off */}` comment.
**Warning signs:** Chrome DevTools shows "interactive content is not allowed inside buttons" warning.

### Pitfall 5: YAML import schema version check for bank delta

**What goes wrong:** v1 YAML imports crash or silently corrupt bank state.
**Why it happens:** `payload.bank` is absent in v1 exports; accessing its properties without a guard throws.
**How to avoid:** Check `schemaVersion >= 2` AND `payload.bank != null` before applying bank delta. Use `payload.bank?.removedQuestionIds ?? []` and `payload.bank?.addedSections ?? []`.
**Warning signs:** v1 YAML import test fails with TypeError on `payload.bank.removedQuestionIds`.

### Pitfall 6: `buildFlatRows` called with `DEFAULT_SECTIONS` in App.tsx

**What goes wrong:** Even after bank mutations, the content tree renders the original DEFAULT_SECTIONS, not the user-modified `state.sections`.
**Why it happens:** `App.tsx` currently calls `buildFlatRows(DEFAULT_SECTIONS, ...)` — hardcoded, not reading from store. This must be changed to `buildFlatRows(state.sections, ...)` for Phase 14 mutations to be visible.
**How to avoid:** Change `App.tsx` to read `sections` from the store: `const sections = useAppStore((s) => s.sections)` and pass that to `buildFlatRows`.
**Warning signs:** Adding a section via the store has no visible effect on the content tree. `expandAll` / `collapseAll` actions also iterate `DEFAULT_SECTIONS` (app.ts lines 242-260) and will need updating.

### Pitfall 7: `expandAll` / `collapseAll` hardcoded to DEFAULT_SECTIONS

**What goes wrong:** After user adds a topic, `expandAll` misses the new topic.
**Why it happens:** `expandAll` iterates `DEFAULT_SECTIONS` at app.ts lines 242-244, not `state.sections`.
**How to avoid:** Refactor to read current `sections` from store state in the action.
**Warning signs:** Custom-added topic does not expand/collapse when expandAll/collapseAll fires.

### Pitfall 8: markedTopicIds in App.tsx uses DEFAULT_SECTIONS

**What goes wrong:** Newly added topics are never in `markedTopicIds` (trivially fine), but the computation still references `DEFAULT_SECTIONS` instead of `state.sections`.
**Why it happens:** `App.tsx` line 40: `for (const section of DEFAULT_SECTIONS)`.
**How to avoid:** Refactor to use `state.sections` from the store (same fix as Pitfall 6 — they're in the same component).

---

## Code Examples

### 1. AddSectionForm — inline form pattern
```typescript
// Source: codebase — CustomQuestionForm.tsx (mirrored for AddSectionForm)
export function AddSectionForm({ onDismiss }: { onDismiss: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const addSection = useAppStore((s) => s.addSection);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === '') return;
    addSection({
      id: `custom-section-${Date.now()}`,
      label: name.trim(),
      icon: icon.trim() || '🔧',
      isDefault: false,
      topics: [],
    });
    onDismiss();
  }
  // ... form JSX as per UI-SPEC
}
```

### 2. QuestionCard delete button extension
```typescript
// Source: codebase — QuestionCard.tsx lines 99-111 (current custom-only pattern)
// BANK-05: show delete for default questions too
const removeDefaultQuestion = useAppStore((s) => s.removeDefaultQuestion);

{(row.isCustom === true || row.question.isDefault === true) && (
  <button
    type="button"
    aria-label={row.isCustom ? 'Delete custom question' : 'Remove question'}
    onClick={() => {
      if (row.isCustom && row.customId != null) {
        deleteCustomQuestion(row.customId);
      } else {
        removeDefaultQuestion(row.question.id);
      }
    }}
    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ml-2 print:hidden"
  >
    ×
  </button>
)}
```

Note: `row.question` is typed as `Question` (from `data/bank/types.ts`) which has no `id` or `isDefault` field. `buildFlatRows` must be updated so that `QuestionRow.question` exposes `id` and `isDefault` for default questions (from `V4Question`). The current `question: Question` type in `QuestionRow` must be widened or the row must carry `questionId` and `isDefaultQuestion` fields separately.

### 3. V4SessionSchema extension
```typescript
// Source: codebase — storage/types.ts V4SessionSchema (lines 176-186)
export const V4SessionSchema = v.object({
  version: v.literal(4),
  id: v.string(),
  sections: v.array(V4SectionSchema),
  removedDefaultQuestionIds: v.optional(v.array(v.string()), []),  // NEW
  scores: v.record(v.string(), v.nullable(v.number())),
  overrides: v.record(v.string(), v.nullable(v.number())),
  notes: v.record(v.string(), v.string()),
  topicNotes: v.record(v.string(), v.string()),
  customQuestions: v.array(CustomQuestionSchema),
  candidate: v.nullable(CandidateDetailsSchema),
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed DEFAULT_SECTIONS bank | User-editable V4Section[] in session | Phase 11 (materialization) | App.tsx still reads DEFAULT_SECTIONS — must switch to state.sections |
| V3Session export (schemaVersion: 1) | V4Session export (schemaVersion: 2) | Phase 14 | Import must handle both versions for legacy compat |
| Custom questions only deletable | All questions deletable (BANK-05) | Phase 14 | QuestionCard delete condition must be extended |

---

## Critical Implementation Dependencies

These three prerequisites are required before writing any Phase 14 component:

1. **`QuestionRow` type update** — `QuestionRow.question` is currently typed as `Question` (from `data/bank/types.ts`) which has no `id` or `isDefault`. Either widen `QuestionRow.question` to `Question | V4Question` or add separate `questionBankId?: string` and `isDefaultQuestion?: boolean` fields to `QuestionRow`. This affects `QuestionCard.tsx` (needs `question.id` for `removeDefaultQuestion`) and `buildFlatRows.ts` (needs to emit the field).

2. **`exportSession` signature change** — Current signature: `(session: V3Session, name: string, sections: readonly Section[])`. Phase 14 requires: `(session: V4Session, name: string)` (sections come from `session.sections`). This is a breaking change to the function signature — callers (`ActionsGroup.tsx` and tests) must be updated.

3. **`App.tsx` sections source change** — `buildFlatRows(DEFAULT_SECTIONS, ...)` must become `buildFlatRows(state.sections, ...)`. This is the key wiring that makes bank mutations visible in the UI. Do this in Wave 1 alongside the store changes.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | YAML-05 custom question note write is already present at yamlImport.ts line 466-468 (`result.notes[newId] = cq.note`) | Pattern 7 | If absent, simple one-line fix needed; low risk |
| A2 | `v.optional(v.array(v.string()), [])` syntax is valid for valibot v1 optional-with-default | Pattern 8 | May need `v.fallback(v.array(v.string()), [])` — check valibot v1 API |

---

## Open Questions (RESOLVED)

1. **Should `resetAll` clear `removedDefaultQuestionIds`?**
   - What we know: `resetAll` clears scoring data but not session identity. The bank shape (which questions exist) is arguably separate from scoring state.
   - What's unclear: Whether users expect a "Reset session" to also restore deleted questions.
   - Recommendation: Do NOT clear `removedDefaultQuestionIds` in `resetAll`. Bank shape and scoring are separate concerns. Document in code comment.
   - RESOLVED: Do NOT clear `removedDefaultQuestionIds` in `resetAll`. Bank shape ≠ scoring state.

2. **`importSession` + bank delta: should it apply to new or overwrite-active sessions?**
   - What we know: Both `overwriteActive=true` and `overwriteActive=false` branches exist. YAML-06 requires the bank delta to apply in both cases.
   - What's unclear: When importing into a new session (`overwriteActive=false`), should the new session start from DEFAULT_SECTIONS and apply the delta, or use the full `addedSections` list directly?
   - Recommendation: For `overwriteActive=false`: set `sections = materializeSections(DEFAULT_SECTIONS)`, then apply bank delta (remove IDs from set, append addedSections). For `overwriteActive=true`: same. This preserves the materialization-first approach from Phase 11.
   - RESOLVED: Apply bank delta in BOTH branches. For both overwrite-active and new-session: use addedSections from YAML directly + set removedDefaultQuestionIds from YAML.

3. **`V4Section.topics` vs. `V4TopicSchema.items` naming**
   - What we know: In `types.ts`, `V4TopicSchema` uses `questions: v.array(V4QuestionSchema)` and `V4SectionSchema` uses `topics: v.array(V4TopicSchema)`. But the legacy `Section` type (data/bank/types.ts) uses `items` for topics and `questions` for questions.
   - What's unclear: Some parts of `buildFlatRows.ts` use `section.items` (legacy Section type) while V4Section has `section.topics`.
   - Recommendation: `buildFlatRows` must be updated to handle `V4Section.topics` (not `Section.items`) once it switches to consuming `state.sections` (V4Section[]).
   - RESOLVED: Use `section.topics` everywhere in `buildFlatRows.ts` — the V4 type uses `topics`, not `items`.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all changes are code/config within the existing project).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `/Users/dallask/Projects/dallask/interviewer-checklist/vitest.config.ts` |
| Quick run command | `npm test` (= `vitest run`) |
| Full suite command | `npm test` |
| Environment | happy-dom |
| Coverage | v8; 100% for `src/utils/buildFlatRows.ts` (90% threshold), `src/store/**` (90%), `src/storage/**` and `src/scoring/**` (100%) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BANK-01 | `addSection` action appends to `sections[]` | unit | `npm test -- app.test.ts` | ✅ (extend) |
| BANK-02 | `removeSection` removes user-added section, ignores default | unit | `npm test -- app.test.ts` | ✅ (extend) |
| BANK-03 | `addTopic` appends to section's topic list | unit | `npm test -- app.test.ts` | ✅ (extend) |
| BANK-04 | `removeTopic` removes user-added topic | unit | `npm test -- app.test.ts` | ✅ (extend) |
| BANK-05 | `removeDefaultQuestion` adds to Set; `buildFlatRows` skips those questions | unit | `npm test -- buildFlatRows.test.ts app.test.ts` | ✅ (extend) |
| YAML-04 | Export output includes `text` and `level` for default questions | unit | `npm test -- yamlExport.test.ts` | ✅ (extend) |
| YAML-05 | Custom question note survives export → import round-trip | unit | `npm test -- yamlImport.test.ts` | ✅ (extend) |
| YAML-06 | Full bank delta (removedIds + addedSections) round-trips | unit | `npm test -- yamlExport.test.ts yamlImport.test.ts` | ✅ (extend) |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. All required test files exist and need extension, not creation.

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a (no auth in this extension) |
| V3 Session Management | no | n/a (chrome.storage.local, no server sessions) |
| V4 Access Control | no | n/a (single-user local extension) |
| V5 Input Validation | yes | Empty-string guard on section/topic names; `text.trim() === '' return` pattern |
| V6 Cryptography | no | n/a |

### Known Threat Patterns for YAML input processing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized YAML import | DoS | `MAX_YAML_BYTES = 1_048_576` already enforced in yamlImport.ts; no change needed |
| YAML bomb / `!!js/undefined` | DoS/Tampering | `js-yaml load()` uses JSON_SCHEMA by default — no arbitrary JS; no change needed |
| Out-of-bounds question indices | Tampering | `maxIndex` guard already in `parseStructural` (lines 391-394); extend to cover v2 `bank.removedQuestionIds` (validate IDs against known `section[].topics[].questions[].id` set) |
| Injected section IDs via `bank.addedSections` | Tampering | Validate `addedSections[].id` does not collide with existing default section IDs on import; log and skip duplicates |

**No new security surface introduced.** All new YAML fields are string/array — no eval, no exec, no network calls.

---

## Sources

### Primary (HIGH confidence)
- `src/store/app.ts` — full store state + actions; all patterns verified directly [VERIFIED: codebase]
- `src/storage/types.ts` — V4Session/V4Section/V4Topic/V4Question schema [VERIFIED: codebase]
- `src/utils/buildFlatRows.ts` — row pipeline + VirtualRow types [VERIFIED: codebase]
- `src/utils/yamlExport.ts` — export function signature, schemaVersion, field structure [VERIFIED: codebase]
- `src/utils/yamlImport.ts` — import pipeline, custom question note handling [VERIFIED: codebase]
- `src/components/ContentTree.tsx` — virtualizer ESTIMATE_SIZE map, row dispatch [VERIFIED: codebase]
- `src/components/TopicRow.tsx` — addQOpen pattern, inline form placement [VERIFIED: codebase]
- `src/components/CustomQuestionForm.tsx` — inline form template [VERIFIED: codebase]
- `src/components/QuestionCard.tsx` — delete button pattern + condition [VERIFIED: codebase]
- `src/components/SectionRow.tsx` — section header structure [VERIFIED: codebase]
- `src/app/App.tsx` — DEFAULT_SECTIONS hardcoded, buildFlatRows call site [VERIFIED: codebase]
- `src/storage/migrations/v3-to-v4.ts` — materializeSections, question ID format [VERIFIED: codebase]
- `.planning/phases/14-editable-bank-yaml-schema-expansion/14-CONTEXT.md` — locked decisions D-01..D-08 [VERIFIED: codebase]
- `.planning/phases/14-editable-bank-yaml-schema-expansion/14-UI-SPEC.md` — component inventory, spacing, colors [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- None — all findings are from direct codebase inspection.

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new packages
- Architecture: HIGH — all patterns verified directly from source files
- Pitfalls: HIGH — identified from direct code reading; pitfalls are concrete (exact line numbers cited)
- YAML schema design: HIGH — based on locked CONTEXT.md decisions D-05/D-06

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable project, no external API dependencies)
