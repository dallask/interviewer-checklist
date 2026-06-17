---
phase: 05-scoring-ui-notes-candidate-custom-questions
verified: 2026-06-17T13:58:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/10
  gaps_closed:
    - "resetAll() now clears selectedDifficulties, selectedSections, searchQuery, and hideMarked (SCORE-06 / ROADMAP SC-5)"
    - "npm run ci exits 0 — biome formatting violation in src/app/main.tsx resolved"
    - "bootstrap.ts Scenario B now validates V3 sessions with V3SessionSchema first (CR-03 data-loss fix)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run the full 12-check smoke test in Chrome (from 05-03-PLAN.md checkpoint:human-verify)"
    expected: "All 12 interaction checks pass: score slider updates live mark, score 0 shows '0 / 10', override replaces computed mark, notes persist across reload, topic notes persist, custom question adds with badge, delete custom question, candidate modal open/save/pre-populate, focus trap in modal, reset all confirmation dialog (Keep scores no-op; Reset clears everything including filters), hideMarked hides scored topics, section filter shows numeric marks"
    why_human: "Requires real Chrome extension load with chrome.storage.local, visual UI inspection, and storage persistence verification across tab reloads — not testable with Vitest or grep"
---

# Phase 5: Scoring UI, Notes, Candidate & Custom Questions — Verification Report

**Phase Goal:** A user can run a complete scoring session — score all questions, add notes, fill in candidate details, add custom questions, and reset — within a single session slot
**Verified:** 2026-06-17T13:58:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous status: gaps_found, 8/10)

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | V3SessionSchema validates: version 3, id, scores, overrides, notes, topicNotes, customQuestions, candidate | VERIFIED | `src/storage/types.ts` lines 132–141: V3SessionSchema fully declared with all 7 fields; createDefaultV3Session factory at line 195 |
| 2  | migrateV2ToV3 maps all V2 field renames and flattens customQuestions | VERIFIED | `src/storage/migrations/v2-to-v3.ts`: complete pure function with all 4 field renames and migrateCustomQuestions helper; 22 fixture-pinned tests pass |
| 3  | runMigrations pipeline includes the v2→v3 step; bootstrap() returns V3 sessions on next load | VERIFIED | `src/storage/migrations/index.ts` line 15: `{ fromVersion: 2, fn: (r) => migrateV2ToV3(r as V2Session) }` entry present |
| 4  | useAppStore AppState includes all ScoringState fields and all 8 ScoringActions are implemented | VERIFIED | `src/store/app.ts` lines 51–66 (state fields), 81–97 (actions), 200–244 (implementations); setScore/setOverride clamp to [0,10] |
| 5  | buildFlatRows emits original topic.questions index (not filtered-subset index) when difficulty filter is active | VERIFIED | `src/utils/buildFlatRows.ts` line 159: `const index = topic.questions.indexOf(question)` replaces forEach position |
| 6  | main.tsx reads uiState back from storage after bootstrap(); activeSessionId hydrated from manifest | VERIFIED | `src/app/main.tsx` lines 24–55: storageAdapter.read(['uiState']), manifest.activeSessionId, and scoring state hydration from session key |
| 7  | QuestionCard renders score slider, notes toggle, custom badge/delete; TopicMarkDisplay + TopicRow wired; CustomQuestionForm functional; SectionFilter shows live marks | VERIFIED | All 5 component files exist and are substantive; 334 tests pass including 23 QuestionCard, 16 TopicMarkDisplay, 14 TopicRow, 14 CustomQuestionForm, and SectionFilter tests |
| 8  | CandidateModal (native dialog, focus trap, 6 fields); ResetConfirmDialog (snapshot-before-reset, focus trap); ActionsGroup trigger buttons with correct IDs | VERIFIED | All 3 component files exist and are substantive; 17 tests pass for modal behaviors |
| 9  | App.tsx passes markedTopicIds Set to buildFlatRows via the hideMarked params | VERIFIED | `src/app/App.tsx` lines 24–36: useMemo computes markedTopicIds from scores; passes hideMarked + markedTopicIds to buildFlatRows line 43 |
| 10 | Reset all clears scores, notes, custom questions, candidate details, AND filters (ROADMAP SC-5, SCORE-06) | VERIFIED | `resetAll()` in `src/store/app.ts` lines 235–248: clears scores/overrides/notes/topicNotes/customQuestions/candidate AND selectedDifficulties/selectedSections/searchQuery/hideMarked; test at app.test.ts line 312 asserts all four filter fields cleared |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/storage/types.ts` | V3SessionSchema, CustomQuestionSchema, V3Session type, createDefaultV3Session | VERIFIED | All 4 exports present; correct valibot schema shapes |
| `src/storage/migrations/v2-to-v3.ts` | Pure migrateV2ToV3 function | VERIFIED | Named export, Readonly input, no try/catch, .js extensions |
| `src/storage/migrations/v2-to-v3.test.ts` | Fixture-pinned unit tests | VERIFIED | 22 tests covering all field renames, customQuestions flattening, candidate null-coalesce |
| `src/storage/bootstrap.ts` | Scenario B validates sessions with V3SessionSchema first | VERIFIED | Lines 130–132: v3Result = v.safeParse(V3SessionSchema, rawSession); falls back to V2SessionSchema only if V3 fails |
| `src/store/app.ts` | ScoringState, ScoringActions, activeSessionId, subscribe dual-write, resetAll clears filters | VERIFIED | All fields, 8 actions with clamp, subscribe writes uiState + session:<id> key; resetAll clears 4 filter fields |
| `src/store/app.test.ts` | resetAll filter-clearing test | VERIFIED | Lines 312–325: test "resetAll clears selectedDifficulties, selectedSections, searchQuery, and hideMarked" — all four assertions present |
| `src/components/TopicMarkDisplay.tsx` | Computed mark + BAND_COLORS + override input + clear button | VERIFIED | fieldset, 5 static color class pairs, computeTopicMark wired, override blur/clear |
| `src/components/QuestionCard.tsx` | Score slider + notes toggle + custom badge/delete | VERIFIED | range input, aria attrs, score display null/0/N, notes debounce, purple badge |
| `src/components/CustomQuestionForm.tsx` | Controlled form + 4-option difficulty select + submit validation | VERIFIED | Empty-text guard, addCustomQuestion dispatch, onDismiss call |
| `src/components/CandidateModal.tsx` | Native dialog, focus trap, 6 fields, Save/Discard/Reset | VERIFIED | showModal() imperative, focus trap via keydown, close restores trigger focus |
| `src/components/ResetConfirmDialog.tsx` | Async snapshot-before-reset, Keep/Reset buttons, focus trap | VERIFIED | await storageAdapter.snapshot() before resetAll(), handleKeep no-op |
| `src/components/ActionsGroup.tsx` | id=open-candidate-modal + id=open-reset-dialog trigger buttons | VERIFIED | Both buttons with correct IDs and showModal() calls; modals rendered as siblings |
| `src/app/App.tsx` | useMemo markedTopicIds + buildFlatRows with hideMarked | VERIFIED | Correct dependency on scores; passes to buildFlatRows filters object |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/store/app.ts` | `src/storage/adapter.ts` | subscribe handler `storageAdapter.write` | VERIFIED | Lines 254–284: guarded by `if (state.activeSessionId)`, writes session:<id> key |
| `src/storage/migrations/index.ts` | `src/storage/migrations/v2-to-v3.ts` | MIGRATIONS array `fromVersion: 2` | VERIFIED | Line 15: explicit entry; migrateV2ToV3 import at line 3 |
| `src/storage/bootstrap.ts` | `src/storage/types.ts` | V3SessionSchema import + safeParse in Scenario B | VERIFIED | Line 15: V3SessionSchema imported; lines 130–132: v.safeParse(V3SessionSchema, rawSession) before V2 fallback |
| `src/components/QuestionCard.tsx` | `src/store/app.ts` | `useAppStore((s) => s.scores[questionId])` and `setScore` action | VERIFIED | Granular selectors; score key `${row.topicId}-${row.index}` |
| `src/components/TopicMarkDisplay.tsx` | `src/scoring/index.ts` | `computeTopicMark(topicWithCustom, scores, override)` | VERIFIED | Correct call with merged topic including custom questions |
| `src/components/SectionFilter.tsx` | `src/scoring/index.ts` | `computeSectionMark` + per-topic `computeTopicMark` | VERIFIED | Reads scores/overrides/customQuestions; computes topicResults inline per render |
| `src/components/ResetConfirmDialog.tsx` | `src/storage/adapter.ts` | `await storageAdapter.snapshot(activeSessionId)` before `resetAll()` | VERIFIED | Async handler, await before resetAll |
| `src/app/App.tsx` | `src/utils/buildFlatRows.ts` | `buildFlatRows(..., {hideMarked, markedTopicIds: computedSet})` | VERIFIED | buildFlatRows call with all 6 filter params |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `QuestionCard.tsx` | `score` | `useAppStore((s) => s.scores[questionId])` | Yes — Zustand store backed by chrome.storage.local via subscribe | FLOWING |
| `TopicMarkDisplay.tsx` | `mark` | `computeTopicMark(topicWithCustom, scores, override)` | Yes — pure computation over real store state | FLOWING |
| `SectionFilter.tsx` | `mark` | `computeSectionMark(topicResults)` | Yes — inline computation per render from store | FLOWING |
| `CandidateModal.tsx` | form fields | `useAppStore((s) => s.candidate)` + local useState | Yes — pre-populates from store candidate on mount | FLOWING |
| `ResetConfirmDialog.tsx` | `activeSessionId` | `useAppStore((s) => s.activeSessionId)` | Yes — hydrated in main.tsx from manifest | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 22 v2-to-v3 migration tests pass | `npx vitest run src/storage/migrations/v2-to-v3.test.ts --reporter=dot` | 22 passed, exit 0 | PASS |
| Full test suite (334 tests) | `npx vitest run --reporter=dot` | 24 test files, 334 tests passed, exit 0 | PASS |
| npm run build produces bundle | `npm run build` | dist/ produced, exit 0 (verified in previous run — committed state) | PASS |
| npm run ci (biome + tsc) | `npm run ci` | "Checked 71 files in 37ms. No fixes applied." — exit 0 | PASS |
| resetAll filter clearing test | `npx vitest run src/store/app.test.ts -t "resetAll clears selectedDifficulties" --reporter=dot` | 1 test passes | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| SCORE-01 | 05-01, 05-02 | Per-question 0–10 score slider with aria-label | SATISFIED | QuestionCard: `<input type="range">` with `aria-label={question.q}`, aria-valuenow, controlled value; 23 tests |
| SCORE-02 | 05-01, 05-02 | Live topic mark with difficulty-weighted average + manual override | SATISFIED | TopicMarkDisplay: computeTopicMark + BAND_COLORS + override input + clear button; 16 tests; TopicRow wired |
| SCORE-03 | 05-01, 05-02 | Per-question and per-topic notes saved and restored | SATISFIED | QuestionCard: notes textarea with debounced setNote; TopicRow: topic notes textarea with debounced setTopicNote; hydrated from session in main.tsx |
| SCORE-04 | 05-03 | Candidate details modal with Save/Cancel/Reset | SATISFIED | CandidateModal: 6 fields, native dialog, focus trap, Save dispatches setCandidate, Discard no-op, Reset clears; 10 tests |
| SCORE-05 | 05-01, 05-02 | Custom questions with badge, scoring participation, deletion | SATISFIED | CustomQuestionForm, QuestionCard badge/delete, buildFlatRows custom rows, TopicMarkDisplay includes custom in computeTopicMark |
| SCORE-06 | 05-01, 05-03 | Reset all clears scores, overrides, notes, custom questions, candidate details, filters | SATISFIED | resetAll() in src/store/app.ts lines 235–248 clears all 10 fields including 4 filter fields; test at app.test.ts line 312 asserts filter clearing explicitly |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/store/app.test.ts` | 224, 229, 239 | `useLiteralKeys` lint/complexity infos (3 instances of `overrides['topic1']`) | INFO | Not errors; biome ci exits clean regardless; does not block CI |

No `TBD`, `FIXME`, or `XXX` markers found in any phase-5-modified files.
No formatting violations. `npm run ci` exits 0 with "No fixes applied."

### Human Verification Required

#### 1. Full Interactive Scoring Loop Smoke Test (12 checks)

**Test:** Load extension in Chrome as unpacked (`npm run build` then chrome://extensions → Load unpacked → select dist/). Execute all 12 checks from 05-03-PLAN.md task checkpoint:human-verify:

1. Move score slider — verify topic mark updates immediately with colored value
2. Set slider to 0 — verify display shows "0 / 10" (not "— / 10")
3. Type override value and tab out — verify it appears; click × — verify reverts
4. Add question notes; hide; re-open; reload extension tab — verify text persists
5. Add topic notes — verify persists after reload
6. Add custom question — verify "custom" badge and Expert difficulty pill; move slider — verify mark updates
7. Delete custom question — verify disappears and mark recalculates
8. Open Candidate details modal — verify dialog opens with backdrop; fill name/email; Save; re-open — verify pre-populated
9. Tab through modal fields — verify focus wraps at last field; Escape closes modal
10. Reset all → Keep scores — verify no change; Reset all → Reset — verify all cleared (scores, notes, candidate details, AND active filters)
11. Score a topic's question; toggle Hide marked — verify that topic disappears
12. Score a question — verify section filter shows numeric mark (not "—")

**Expected:** All 12 checks pass with no visual glitches or broken interactions.
**Why human:** Requires real Chrome extension load with chrome.storage.local, visual UI inspection, and storage persistence verification across tab reloads. Not testable with Vitest.

### Gaps Summary

All automated gaps from the previous verification are closed:

**Gap 1 (SCORE-06 filter reset) — CLOSED:** `resetAll()` in `src/store/app.ts` (lines 235–248) now clears `selectedDifficulties`, `selectedSections`, `searchQuery`, and `hideMarked` in addition to scoring data. A dedicated test at `src/store/app.test.ts` line 312 asserts all four filter fields are reset. The implementation fully satisfies REQUIREMENTS.md SCORE-06 and ROADMAP SC-5.

**Gap 2 (npm run ci formatting failure) — CLOSED:** `src/app/main.tsx` formatting violation resolved. `npm run ci` exits 0 with "Checked 71 files in 37ms. No fixes applied." Biome passes cleanly. The type cast on lines 43–46 is now split across multiple lines as required by the column-limit rule.

**CR-03 data-loss fix — VERIFIED:** `src/storage/bootstrap.ts` Scenario B (lines 130–135) now tries `V3SessionSchema` first for each session key before falling back to `V2SessionSchema`. This prevents V3 sessions from being silently downgraded to V2 on re-validation after first-load migration.

No automated blockers remain. Phase goal is achievable pending human smoke test.

---

_Verified: 2026-06-17T13:58:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — previous status gaps_found (8/10); new status human_needed (10/10)_
