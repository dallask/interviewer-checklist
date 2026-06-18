# Phase 14: Editable Bank & YAML Schema Expansion - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 14 enables users to fully shape the question bank per session: add/remove sections and topics, delete default questions. YAML export/import is extended to round-trip the new editable state so nothing is lost on export → import.

**In scope:**
- BANK-01: Add a new section to the active session
- BANK-02: Remove user-added (non-default) sections
- BANK-03: Add a new topic to any section (default or user-added)
- BANK-04: Remove user-added (non-default) topics
- BANK-05: Remove default questions using the same delete control as custom questions
- YAML-04: Default question entries in export include `text` and `level` fields
- YAML-05: Custom question notes survive export → import (fix import-side gap)
- YAML-06: Full editable-bank state (added sections/topics, removed default questions) round-trips through YAML

**Out of scope:**
- Removing default sections or default topics (only user-added entities can be removed via BANK-02/BANK-04)
- Restoring/undoing removed default questions (no undo stack)
- Sidebar Shell Refactor / compact QuestionCard (Phase 15)
- Filter UI changes (Phase 13 closed)

</domain>

<decisions>
## Implementation Decisions

### D-01: Removed-entity tracking model — filter model for default questions

For **default questions** (BANK-05), use a Set-based filter model:
- New store field: `removedDefaultQuestionIds: Set<string>` (default: `new Set()`)
- The `sections[]` array remains the canonical source of truth; removal is applied at render and export time by filtering out IDs present in the set
- This is non-destructive and reversible in future sessions (or via YAML reimport)

For **user-added sections** (BANK-02) and **user-added topics** (BANK-04), **mutate the sections array directly** — splice out the entry. User-added entities are not in DEFAULT_SECTIONS, so there is no canonical source to preserve. Mutation is safe and simpler.

### D-02: Store field additions

Add to `AppState` / `V4Session`:

```ts
// Filter model for default-question removals
removedDefaultQuestionIds: Set<string>  // default: new Set()
```

New store actions:
```ts
addSection(section: V4Section): void         // BANK-01
removeSection(sectionId: string): void       // BANK-02 (user-added only)
addTopic(sectionId: string, topic: V4Topic): void   // BANK-03
removeTopic(topicId: string): void           // BANK-04 (user-added only)
removeDefaultQuestion(questionId: string): void // BANK-05
```

No `removedSectionIds` or `removedTopicIds` needed — user-added sections/topics are deleted directly from `sections[]`.

### D-03: Add affordance placement

Mirror the existing **CustomQuestionForm inline pattern** for all add forms:

- **"Add topic"** — inline form at the bottom of a section's topic list, triggered by a "+ Add topic" button at the end of each section header area. Follows the same `addQOpen` state toggle pattern in TopicRow.
- **"Add section"** — inline form below all sections at the bottom of ContentTree. A single "+ Add section" affordance.
- Both forms use minimal fields: name only for sections; name + optional description for topics.
- No modal — all inline, same visual weight as the existing "+ Add question" button.

### D-04: Remove affordances

- **Remove user-added topic** — small `×` or trash icon button on the topic header row, shown only when `!topic.isDefault`. Follows the same pattern as the QuestionCard delete button for custom questions.
- **Remove user-added section** — same `×` icon on the section header, only when `!section.isDefault`.
- **Remove default question (BANK-05)** — same delete button as custom questions (`deleteCustomQuestion`), but wired to `removeDefaultQuestion(questionId)` for default questions. The button is always visible for default questions (extends the existing D4 scope).

### D-05: YAML schema version bump to v2

Bump `schemaVersion` from `1` to `2` in `yamlExport.ts`. Version 2 adds:

1. **Default question entries** — add `text: string` and `level: Difficulty` fields alongside existing `index`, `score`, `note`
2. **Custom question notes** — already exported (YAML-05 only fixes the import-side gap)
3. **Editable bank delta** — new optional top-level key `bank` containing:
   ```yaml
   bank:
     removedQuestionIds:   # IDs of removed default questions
       - "frontend-q0-q2"
     addedSections:        # user-added sections (full V4Section structure)
       - id: "custom-sec-..."
         label: "..."
         icon: "🔧"
         items: [...]
   ```
   `addedTopics` per section are implicitly present in `addedSections[].items`.

Legacy compat: importer checks `schemaVersion`. If `< 2` or `bank` key absent, treats as v1 — no removals applied, no bank reconstruction. Existing v1 exports keep working unchanged.

### D-06: Custom question note import fix (YAML-05)

In `yamlImport.ts`, the import currently writes `notes[questionKey]` only for scored questions. The fix: when iterating `customQuestions` from the YAML payload, also write `notes[customQuestionId]` from the `note` field. This is a narrow bug-fix in the import loop.

### D-07: ID format for user-added entities

- User-added section: `custom-section-${Date.now()}`
- User-added topic: `custom-topic-${sectionId}-${Date.now()}`
- User-added topic questions: same `custom-${topicId}-${Date.now()}` format as existing custom questions

### D-08: ContentTree rendering of removed default questions

`buildFlatRows.ts` (or wherever rows are built from `sections[]`) must filter out questions whose ID is in `removedDefaultQuestionIds`. This is the single render-time filtering point.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope

- `.planning/REQUIREMENTS.md` §Editable Bank + §Data & YAML — BANK-01..05, YAML-04..05..06 are the locked requirements
- `.planning/ROADMAP.md` §Phase 14 — Goal + 4 success criteria

### Files to read / modify

- `src/store/app.ts` — add `removedDefaultQuestionIds`, new bank actions
- `src/storage/types.ts` — V4Session schema: add `removedDefaultQuestionIds` field
- `src/storage/migrations/v3-to-v4.ts` — understand materialized sections shape
- `src/utils/yamlExport.ts` — add `text`+`level`, add `bank` delta block, bump schemaVersion
- `src/utils/yamlImport.ts` — fix custom question note import; handle `bank` delta on import
- `src/components/ContentTree.tsx` — understand row rendering pipeline
- `src/components/TopicRow.tsx` — existing "+ Add question" inline form pattern (mirror for "+ Add topic")
- `src/components/CustomQuestionForm.tsx` — inline form reference
- `src/components/QuestionCard.tsx` — delete button pattern for default questions

### Test files to extend

- `src/utils/yamlExport.test.ts` (if exists) or create new YAML schema tests
- `src/utils/yamlImport.test.ts` (if exists)
- `src/store/app.test.ts` or integration tests for new store actions

</canonical_refs>

<code_context>
## Existing Code Insights

### V4Session shape (src/storage/types.ts)

```ts
V4Section { id, label, icon, isDefault, items: V4Topic[] }
V4Topic   { id, name, desc, tag, isDefault, questions: V4Question[] }
V4Question { id, text, level, isDefault }
```

All entities carry `isDefault: boolean`. User-added entities have `isDefault: false`.

Score keys: `${topicId}-q${questionIndex}` (important: index-based, not question.id-based for default questions).

### Existing custom question add/delete pattern

- Add: `TopicRow.tsx` → `addQOpen` toggle → `CustomQuestionForm` inline → `addCustomQuestion(q)` store action
- Delete: `QuestionCard.tsx` delete button → `deleteCustomQuestion(id)` store action
- Custom question IDs: `custom-${topicId}-${Date.now()}`

### YAML export current state (src/utils/yamlExport.ts)

- `schemaVersion: 1`
- Default questions: `{ index, score, note }` (no text/level)
- Custom questions: `{ id, text, level, score, note }` — note is already exported
- Custom question notes are in `customQuestions[].note` field in YAML (exported via `notes[cq.id]`)

### YAML import current gap (src/utils/yamlImport.ts)

Custom question notes not restored: the import writes `notes[questionKey]` for scored questions but when processing `customQuestions` entries it doesn't restore `notes[cq.id]` from the `note` field. Line ~462-468 handles custom question scoring but misses note restoration.

### buildFlatRows pattern

ContentTree builds rows from `sections[]` store state. Phase 14 must ensure `buildFlatRows` (or the ContentTree row builder) filters questions by `removedDefaultQuestionIds`.

</code_context>

<specifics>
## Specific Ideas

- Keep `addedTopics` implicit in `addedSections[].items` in the YAML `bank` block — no need for a separate `addedTopics` key per section; the full section structure carries its topics
- For the "+ Add section" affordance: place a sticky "Add section" button at the bottom of the sidebar Sections filter (below all section filter rows) OR inside ContentTree below all sections — ContentTree is the natural place since it's where topics and questions live
- The `bank` YAML key should be truly optional (absent in v1 exports) with the importer defensively checking `payload.bank?.removedQuestionIds ?? []`

</specifics>

<deferred>
## Deferred Ideas

- Removing default sections or topics (only user-added) — out of scope for v1.1
- Undo/redo for bank mutations — no undo stack in v1.1
- Re-ordering sections/topics — out of scope

</deferred>

---

*Phase: 14-editable-bank-yaml-schema-expansion*
*Context gathered: 2026-06-18*
