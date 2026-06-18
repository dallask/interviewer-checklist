---
phase: 14-editable-bank-yaml-schema-expansion
verified: 2026-06-18T17:15:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open the app with a default session. Click '+ Add section', fill in a name, click 'Add section'. Verify the new section appears in the sidebar."
    expected: "Section appears immediately in the virtualised list below the default sections, with the default icon if none was provided."
    why_human: "Virtualiser rendering, React state update, and DOM mutation after form submit cannot be confirmed by static code analysis."
  - test: "Add a custom section, then click its × delete button. Verify it disappears from the sidebar."
    expected: "Section is gone from the list; default sections have no × button visible."
    why_human: "Conditional visibility of delete affordance based on isDefault flag requires visual confirmation."
  - test: "Add a custom topic inside a default section. Click its × delete button. Verify it disappears; default topics show no × button."
    expected: "Custom topic is removed; default topics lack a delete button."
    why_human: "Topic-level delete button conditionality (row.topic.isDefault) requires live UI inspection."
  - test: "Open any topic. Click the × button on a default question. Verify the question disappears from the list."
    expected: "Question is removed from the UI immediately. Toggling other topics/sections does not restore it in the same session."
    why_human: "BANK-05 depends on removedDefaultQuestionIds Set state flowing through buildFlatRows filter into the virtualiser — requires browser runtime to confirm end-to-end."
  - test: "Export a session after removing a default question and adding a custom section. Re-import the YAML. Verify the removed question is still absent and the custom section is still present."
    expected: "Round-trip preserves bank delta: removed question stays removed, added section stays present."
    why_human: "YAML-06 full round-trip requires actual file export, file re-import, and UI state inspection — not testable by static analysis alone."
  - test: "In a topic with a custom question that has a note, export the session and re-import it. Verify the custom question note is preserved."
    expected: "Custom question note is present in the imported session."
    why_human: "YAML-05 end-to-end note preservation requires UI interaction and file I/O."
---

# Phase 14: Editable Bank & YAML Schema Expansion — Verification Report

**Phase Goal:** Users can fully shape the question bank — adding and removing sections, topics, and default questions — and that state survives a full YAML export/import round-trip
**Verified:** 2026-06-18T17:15:00Z
**Status:** HUMAN_NEEDED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | BANK-01: User can add a new section — `AddSectionForm` submits via `addSection` store action | VERIFIED | `AddSectionForm.tsx` line 11: `addSection = useAppStore((s) => s.addSection)`; line 15: `name.trim() === ''` guard; line 18: `custom-section-${Date.now()}-<rand>` ID; ContentTree line 89-91: renders `<AddSectionForm>` when `addSectionOpen=true` |
| 2 | BANK-02: User can remove a non-default section — `SectionRow` shows × only when `row.isDefault === false`, wired to `removeSection` | VERIFIED | `SectionRow.tsx` line 11: `removeSection` selector; line 32: `{row.isDefault === false && ...}` guard; line 36: `onClick={() => removeSection(row.id)}`; `print:hidden` class present |
| 3 | BANK-03: User can add a new topic — `AddTopicForm` submits via `addTopic` store action | VERIFIED | `AddTopicForm.tsx` line 12: `addTopic` selector; line 16: empty-name guard; line 19: `custom-topic-${sectionId}-${Date.now()}-<rand>` ID; ContentTree line 102-107: renders `<AddTopicForm>` when `addTopicOpenFor === row.sectionId` |
| 4 | BANK-04: User can remove a non-default topic — `TopicRow` shows × only when `row.topic.isDefault === false`, wired to `removeTopic` | VERIFIED | `TopicRow.tsx` line 13: `removeTopic` selector; line 79: `{row.topic.isDefault === false && ...}` guard; line 83: `onClick={() => removeTopic(row.topic.id)}`; `print:hidden` class present |
| 5 | BANK-05: User can remove default questions — `QuestionCard` shows × for `isDefaultQuestion === true`, wired to `removeDefaultQuestion(row.questionBankId)` | VERIFIED | `QuestionCard.tsx` line 21: `removeDefaultQuestion` selector; line 103: `{(row.isCustom === true || row.isDefaultQuestion === true) && ...}`; line 110-111: `removeDefaultQuestion(row.questionBankId)` on click; `print:hidden` on delete button |
| 6 | YAML-04: Default question entries in export include `text` and `level` fields | VERIFIED | `yamlExport.ts` lines 42-43: `text: question.text, level: question.level` in question mapping; `schemaVersion: 2` at line 75; yamlExport.test.ts confirms both `text:` and `level:` in output |
| 7 | YAML-05: Custom question notes survive export → import | VERIFIED | `yamlExport.ts` lines 51-58: CR-03 fix uses `positionalKey = \`${topic.id}-q${topic.questions.length + cqIndex}\`` for score and note; `yamlImport.ts` lines 510-512: `result.notes[positionalKey] = cq.note` with YAML-05 comment; yamlImport.test.ts line 419 confirms round-trip |
| 8 | YAML-06: Export/import round-trip preserves bank delta (removed questions + added sections) | VERIFIED | `yamlExport.ts` lines 66-81: `bank` block with `removedQuestionIds` and `addedSections` emitted when non-empty; `yamlImport.ts` lines 519-594: `parseStructural` reads `bank` block for `schemaVersion >= 2`, populates `result.removedDefaultQuestionIds` and `result.sections`; both `importSession` branches (lines 660-661, 685-686) hydrate store state; collision check at lines 539-544 |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/storage/types.ts` | `removedDefaultQuestionIds: optional array<string>` in V4SessionSchema | VERIFIED | Line 180: `removedDefaultQuestionIds: v.optional(v.array(v.string()), [])` in schema; line 270: `removedDefaultQuestionIds: []` in `createDefaultV4Session` |
| `src/store/app.ts` | 5 new bank actions + AppState field + hydration wiring | VERIFIED | Lines 140-148: 5 action signatures in AppActions; lines 350-379: `addSection`, `removeSection`, `addTopic`, `removeTopic`, `removeDefaultQuestion` implemented; line 430: `switchSession` hydrates as `new Set(...)`; lines 661, 686: both `importSession` branches hydrate; line 751: subscribe block persists as `[...state.removedDefaultQuestionIds]`; line 397: `resetAll` comment confirms intentional exclusion |
| `src/utils/buildFlatRows.ts` | V4Section[] input, trigger rows, removedDefaultQuestionIds filter | VERIFIED | Line 92: `sections: readonly V4Section[]` signature; line 127: `section.topics` loop (not `.items`); line 134: `removedDefaultQuestionIds?.has(question.id)` filter; lines 236, 240: trigger rows emitted; lines 51-69: `AddTopicTriggerRow`, `AddSectionTriggerRow` types exported |
| `src/components/AddSectionForm.tsx` | Inline form for adding sections (BANK-01) | VERIFIED | File exists; exports `AddSectionForm`; line 18: `custom-section-${Date.now()}-<rand>` ID with Math.random suffix (WR-04 fix); line 15: empty-name guard; `print:hidden` on form container |
| `src/components/AddTopicForm.tsx` | Inline form for adding topics (BANK-03) | VERIFIED | File exists; exports `AddTopicForm`; line 19: `custom-topic-${sectionId}-${Date.now()}-<rand>` ID with Math.random suffix; line 16: empty-name guard; `print:hidden` on form container |
| `src/components/ContentTree.tsx` | ESTIMATE_SIZE for all row types + dispatch to forms | VERIFIED | Lines 5-6: imports `AddSectionForm`, `AddTopicForm`; lines 15-20: `ESTIMATE_SIZE` record covers `section`, `topic`, `question`, `add-topic-trigger` (120), `add-section-trigger` (120); lines 29-32: `addSectionOpen` and `addTopicOpenFor` state; lines 89-112: dispatches all new row types |
| `src/components/SectionRow.tsx` | × delete button for non-default sections (BANK-02) | VERIFIED | Lines 11, 32-38: `removeSection` wired with `isDefault` guard; WR-01 fix applied (div container, not nested button) |
| `src/components/TopicRow.tsx` | × delete button for non-default topics (BANK-04) | VERIFIED | Lines 13, 79-88: `removeTopic` wired with `topic.isDefault` guard; WR-01 fix applied |
| `src/components/QuestionCard.tsx` | Delete button for default questions (BANK-05) | VERIFIED | Lines 21, 103-115: `removeDefaultQuestion` wired; condition covers both custom and default questions |
| `src/utils/yamlExport.ts` | Schema v2 + text/level fields + bank block | VERIFIED | Line 20: `session: V4Session` arg; line 75: `schemaVersion: 2`; lines 42-43: `text` and `level`; lines 66-81: `bank` block conditional |
| `src/utils/yamlImport.ts` | `parseStructural` reads bank delta (YAML-06) | VERIFIED | Lines 30-33: `ImportResult` has `sections?` and `removedDefaultQuestionIds?`; lines 519-594: full bank delta extraction with validation and collision check |
| `src/app/App.tsx` | `sections` from store passed to `buildFlatRows`; `removedDefaultQuestionIds` in filter | VERIFIED | Line 33: `const sections = useAppStore((s) => s.sections)`; line 36: `removedDefaultQuestionIds` selector; line 60: `buildFlatRows(sections, ...)` — no cast; line 67: `removedDefaultQuestionIds` in filters object; line 41: `markedTopicIds` iterates `sections` from store |
| `src/app/main.tsx` | Bootstrap hydrates `removedDefaultQuestionIds` (CR-02) | VERIFIED | Line 60-62: `removedDefaultQuestionIds: new Set(session.removedDefaultQuestionIds ?? [])` in bootstrap setState |
| `src/components/SearchGroup.tsx` | `removedDefaultQuestionIds` in `buildFlatRows` for resultCount (WR-02) | VERIFIED | Line 14: selector; line 45: filter with `removedDefaultQuestionIds`; line 50: in useMemo dependency array |
| `src/store/app.test.ts` | 18+ tests for 5 new bank actions | VERIFIED | 88 total tests; 17+ for Phase 14 actions (addSection×3, removeSection×3, addTopic×3, removeTopic×3, removeDefaultQuestion×5 confirmed by grep) |
| `src/utils/buildFlatRows.test.ts` | Tests for trigger rows + filter + isDefaultQuestion | VERIFIED | 36 tests; describe blocks confirmed at lines 78, 164, 231 |
| `src/utils/yamlExport.test.ts` | YAML-04 text/level + YAML-06 bank block tests | VERIFIED | 15 tests; lines 37-46: schemaVersion 2 and text/level; lines 127-165: bank block |
| `src/utils/yamlImport.test.ts` | YAML-05 note round-trip + YAML-06 bank delta import tests | VERIFIED | 27 tests; lines 326-432: full bank delta describe block with 6 cases |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/store/app.ts (subscribe)` | `chrome.storage.local` | `removedDefaultQuestionIds: [...state.removedDefaultQuestionIds]` | WIRED | Line 751: spread into session write |
| `src/store/app.ts (switchSession)` | `AppState.removedDefaultQuestionIds` | `new Set(session?.removedDefaultQuestionIds ?? [])` | WIRED | Line 430: hydration confirmed |
| `src/store/app.ts (importSession)` | `AppState.sections + removedDefaultQuestionIds` | Both `overwriteActive` branches | WIRED | Lines 660-661 and 685-686: both branches set both fields |
| `src/app/App.tsx` | `buildFlatRows` | `sections` from store + `removedDefaultQuestionIds` in filters | WIRED | Lines 60, 67: both wired; CR-01 fix confirmed |
| `src/app/main.tsx` | `AppState.removedDefaultQuestionIds` | `new Set(session.removedDefaultQuestionIds ?? [])` | WIRED | Line 62: CR-02 fix confirmed |
| `src/utils/yamlExport.ts` | `V4Session.removedDefaultQuestionIds` | `exportSession(session: V4Session, ...)` | WIRED | Lines 19-22: signature; lines 66-81: bank block uses field |
| `src/utils/yamlImport.ts (ImportResult)` | `src/store/app.ts (importSession)` | `sections` and `removedDefaultQuestionIds` fields | WIRED | ImportResult lines 30-33; importSession lines 660-661, 685-686 |
| `ContentTree.tsx` | `AddSectionForm.tsx / AddTopicForm.tsx` | `addSectionOpen` / `addTopicOpenFor` state toggle | WIRED | Lines 5-6: imports; lines 89-112: conditional render |
| `SectionRow.tsx` | `removeSection` action | `useAppStore((s) => s.removeSection)` | WIRED | Line 11 selector, line 36 call |
| `TopicRow.tsx` | `removeTopic` action | `useAppStore((s) => s.removeTopic)` | WIRED | Line 13 selector, line 83 call |
| `QuestionCard.tsx` | `removeDefaultQuestion` action | `useAppStore((s) => s.removeDefaultQuestion)` | WIRED | Line 21 selector, line 111 call |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `ContentTree.tsx` | `rows` (via `buildFlatRows`) | `App.tsx` → `buildFlatRows(sections, ...)` → virtualiser | `sections` from `useAppStore((s) => s.sections)` which is populated from V4Session storage | FLOWING |
| `SectionRow.tsx` | `row.isDefault` | `buildFlatRows` emits `isDefault: section.isDefault` (line 179) | Real V4Section field set at creation (AddSectionForm: `isDefault: false`) or materialization (`isDefault: true`) | FLOWING |
| `QuestionCard.tsx` | `row.isDefaultQuestion`, `row.questionBankId` | `buildFlatRows` line 212: `isDefaultQuestion: question.isDefault`, `questionBankId: question.id` | Real V4Question fields from bank data | FLOWING |
| `yamlExport.ts` | `session.removedDefaultQuestionIds` | V4Session from `useAppStore((s) => s)` in ActionsGroup → `exportSession(session, name)` | Store state, persisted via subscribe block | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npm test` | "Test Files 42 passed (42); Tests 675 passed (675)" | PASS |
| `addSection` test describes exist | `grep "addSection" src/store/app.test.ts | grep "it("` | 3 matching tests found | PASS |
| `removeDefaultQuestion` Set model tests | `grep "removeDefaultQuestion" src/store/app.test.ts | grep "it("` | 5 tests found | PASS |
| `add-section-trigger` row emitted by buildFlatRows | `grep "add-section-trigger" src/utils/buildFlatRows.ts` | Line 240: `rows.push({ type: 'add-section-trigger' })` | PASS |
| `section.items` legacy field absent from buildFlatRows | `grep "section\.items" src/utils/buildFlatRows.ts` | No output | PASS |
| `schemaVersion: 2` in yamlExport.ts | `grep "schemaVersion: 2" src/utils/yamlExport.ts` | Line 75 confirmed | PASS |
| YAML-06 bank delta tests exist in yamlImport.test.ts | `grep "bank delta (YAML-06)" src/utils/yamlImport.test.ts` | Line 329 confirmed | PASS |
| WR-01 nested-button fix applied | `grep "WR-01" src/components/SectionRow.tsx src/components/TopicRow.tsx` | Fix comment confirmed in both files | PASS |
| CR-02 bootstrap hydration fix | `grep "removedDefaultQuestionIds" src/app/main.tsx` | Line 62: `new Set(session.removedDefaultQuestionIds ?? [])` | PASS |
| CR-03 custom question score export uses positional key | `grep "positionalKey" src/utils/yamlExport.ts` | Line 52 confirmed | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BANK-01 | 14-01, 14-04, 14-05 | User can add a new section | SATISFIED | `AddSectionForm` → `addSection` action → store; ContentTree `add-section-trigger` dispatch; 3+ tests in app.test.ts |
| BANK-02 | 14-01, 14-04, 14-05 | User can remove a non-default section | SATISFIED | `SectionRow` × button with `isDefault === false` guard → `removeSection` action; 3+ tests in app.test.ts |
| BANK-03 | 14-01, 14-04, 14-05 | User can add a new topic | SATISFIED | `AddTopicForm` → `addTopic` action → store; ContentTree `add-topic-trigger` dispatch; 3+ tests in app.test.ts |
| BANK-04 | 14-01, 14-04, 14-05 | User can remove a non-default topic | SATISFIED | `TopicRow` × button with `topic.isDefault === false` guard → `removeTopic` action; 3+ tests in app.test.ts |
| BANK-05 | 14-01, 14-02, 14-04, 14-05 | User can remove default questions | SATISFIED | `QuestionCard` × button with `isDefaultQuestion === true` condition → `removeDefaultQuestion(row.questionBankId)`; `removedDefaultQuestionIds` filters through `buildFlatRows`; 5 tests in app.test.ts + filter tests in buildFlatRows.test.ts |
| YAML-04 | 14-03, 14-05 | YAML export includes `text` and `level` per question | SATISFIED | `yamlExport.ts` lines 42-43; `schemaVersion: 2`; yamlExport.test.ts lines 37-46 |
| YAML-05 | 14-03, 14-05 | YAML export preserves custom question notes | SATISFIED | CR-03 fix: positional key export; yamlImport.ts line 512: `result.notes[positionalKey] = cq.note`; yamlImport.test.ts line 419 |
| YAML-06 | 14-03, 14-05 | Export/import round-trips bank delta | SATISFIED | `exportSession` emits `bank` block; `parseStructural` extracts it for schemaVersion >= 2; `importSession` sets both fields; yamlImport.test.ts lines 329-432 |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/utils/yamlImport.ts` | 444 | Comment uses word "placeholder" | Info | Comment explains intentional design (sparse scores map); same pattern noted in Phase 11 verification; not a code stub |
| `src/components/AddSectionForm.tsx` | 35, 43 | HTML `placeholder` attributes | Info | HTML form input hints — not code stubs; expected and correct |
| `src/components/AddTopicForm.tsx` | 37, 45 | HTML `placeholder` attributes | Info | HTML form input hints — not code stubs; expected and correct |

No TBD, FIXME, or XXX markers found in any file modified by this phase. No unreferenced debt markers.

---

### Review Findings — All Resolved (from 14-REVIEW-FIX.md)

| Finding | Issue | Resolution |
|---------|-------|------------|
| CR-01 | `removedDefaultQuestionIds` never passed to `buildFlatRows` — removed questions stayed visible | FIXED: App.tsx selector + forwarded in filters object |
| CR-02 | `main.tsx` bootstrap omitted `removedDefaultQuestionIds` — filter state lost on reload | FIXED: `new Set(session.removedDefaultQuestionIds ?? [])` in bootstrap setState |
| CR-03 | Custom question scores/notes always exported as `null`/`''` | FIXED: positional key `${topic.id}-q${topic.questions.length + cqIndex}` used in export |
| CR-04 | User-added section topics' scores dropped on v2 re-import | FIXED: `schemaVersion` extracted early; `addedSections` topics registered in `topicIdSet` before main loop |
| WR-01 | Invalid HTML — `<button>` nested inside `<button>` in SectionRow and TopicRow | FIXED: div container with sibling buttons; `stopPropagation` workaround removed |
| WR-02 | `SearchGroup.tsx` `resultCount` ignored `removedDefaultQuestionIds` | FIXED: selector + filter + dependency array |
| WR-03 | `bank.addedSections` unsafe cast — no shape validation | FIXED: `reduce` with type guards for topic id/name and question id/text |
| WR-04 | `Date.now()`-only collision risk in form IDs | FIXED: `Math.random().toString(36).slice(2, 7)` suffix added to both forms |
| WR-05 | `markedTopicIds` ignored `removedDefaultQuestionIds` — stale "marked" state | FIXED: question filter skips removed IDs; added to useMemo deps |

---

### Human Verification Required

#### 1. Add Section (BANK-01)

**Test:** Open the app with a default session. Click the '+ Add section' affordance at the bottom of the section list. Fill in a name, click 'Add section'.
**Expected:** The new section appears immediately in the sidebar below the default sections, with the supplied or default icon.
**Why human:** Virtualiser DOM rendering, React state flush, and layout correctness after form submit cannot be confirmed by static analysis.

#### 2. Delete Non-Default Section (BANK-02)

**Test:** After adding a custom section (step 1), confirm the × button is visible on it. Click ×. Confirm the section disappears. Confirm that no × button is visible on any default section.
**Expected:** Custom section removed; default sections have no × button.
**Why human:** Conditional visibility of delete affordance (`row.isDefault === false`) requires live browser rendering to confirm.

#### 3. Delete Non-Default Topic (BANK-04)

**Test:** Add a custom topic inside any section. Click its × button. Confirm the topic disappears. Confirm default topics have no × button.
**Expected:** Custom topic removed; default topics have no × button.
**Why human:** Topic-level delete button conditionality requires live UI inspection.

#### 4. Remove Default Question and Verify Persistence (BANK-05)

**Test:** In any topic, click the × button on a default question. Verify it disappears from the list. Reload the page. Verify the question is still absent.
**Expected:** Question removed from view immediately and remains absent after reload (persisted to storage via subscribe block).
**Why human:** End-to-end persistence through the subscribe block → chrome.storage.local → bootstrap hydration cannot be confirmed without browser runtime.

#### 5. YAML Export/Import Round-trip for Bank Delta (YAML-06)

**Test:** Remove a default question and add a custom section. Export the session as YAML. Inspect the YAML — confirm `bank:` block is present with `removedQuestionIds` and `addedSections`. Re-import the YAML. Verify the removed question is still absent and the custom section is still present.
**Expected:** Full round-trip preserves bank delta state.
**Why human:** File I/O, YAML parsing, and store hydration after import require browser execution.

#### 6. Custom Question Note Round-trip (YAML-05)

**Test:** Add a custom question to a topic and enter a note for it. Export the session. Re-import the YAML. Verify the custom question note is intact.
**Expected:** Custom question note is preserved through export → import.
**Why human:** YAML-05 positional-key note round-trip requires actual file export, parsing, and UI state inspection.

---

### Gaps Summary

No gaps. All 8 must-have truths are VERIFIED by static code analysis:

- All 5 store actions (`addSection`, `removeSection`, `addTopic`, `removeTopic`, `removeDefaultQuestion`) are implemented, wired, and tested (88 tests in app.test.ts, 17+ Phase 14 specific).
- `buildFlatRows` accepts `V4Section[]`, filters `removedDefaultQuestionIds`, emits `add-topic-trigger` per section and `add-section-trigger` at end (36 tests in buildFlatRows.test.ts).
- `AddSectionForm` and `AddTopicForm` exist, use empty-name guards, and generate collision-safe IDs with Math.random suffix.
- `SectionRow`, `TopicRow`, and `QuestionCard` show delete buttons with correct `isDefault` guards, all `print:hidden`.
- `yamlExport.ts` emits `schemaVersion: 2`, `text`/`level` per default question, and the `bank` block when non-empty.
- `yamlImport.ts` parses the `bank` delta for `schemaVersion >= 2`, populates `ImportResult.sections` and `removedDefaultQuestionIds`, with shape validation and collision check.
- All 9 code-review findings (4 Critical, 5 Warning) from `14-REVIEW.md` are fixed and confirmed by `14-REVIEW-FIX.md`.
- Full test suite: **675 tests passing across 42 test files**.

Status is `human_needed` because 6 behavioral checks require browser execution (live virtualiser rendering, storage persistence, YAML file I/O, round-trip state inspection). All automated checks passed.

---

_Verified: 2026-06-18T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
