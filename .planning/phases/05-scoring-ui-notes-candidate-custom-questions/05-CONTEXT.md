# Phase 5: Scoring UI, Notes, Candidate & Custom Questions - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A user can run a complete scoring session — score all questions, add notes, fill in candidate details, add custom questions, and reset — within a single session slot. This phase adds all interactive scoring to the Phase 4 read-only shell. Phase 5 is the first phase where data flows from user input back into storage.

</domain>

<decisions>
## Implementation Decisions

### Scoring Input & Mark Display
- **Score slider:** Native `<input type="range" min="0" max="10" step="1">` with `aria-label` set to the question text — SCORE-01; no custom slider component
- **Mark band colors:** Reuse `getMarkBand()` from Phase 2 scorer; map to Tailwind: `none`→`text-gray-400`, `low`→`text-red-500`, `mid`→`text-yellow-500`, `good`→`text-green-600`, `high`→`text-emerald-600`
- **Manual topic override UX:** Number input (0–10) next to computed mark; on blur updates override in Zustand store; clear (×) button resets override to null (back to computed mark)
- **Snapshot before Reset all:** `storageAdapter.snapshot()` called BEFORE dispatching the reset action — implements STORE-05 deferred from Phase 3

### Notes, Candidate Modal & Custom Questions
- **Notes textarea resize:** `resize-y` on both per-question and per-topic textareas; no auto-grow
- **Candidate details modal:** Native `<dialog>` element with manual focus-trap (Tab/Shift+Tab within dialog, Escape closes) — SCORE-04; no third-party modal library
- **Custom question difficulty:** Native `<select>` with all 4 options (novice/intermediate/advanced/expert) — SCORE-05
- **Custom question deletion:** Delete button (×) on each custom question card; no confirmation dialog; question can be re-added (matches "allow deletion" in SCORE-05)

### State Architecture & Reset
- **Scoring state location:** Extend existing V2 session schema with `scores: Record<string, number | null>`, `overrides: Record<string, number | null>`, `notes: Record<string, string>`, `topicNotes: Record<string, string>`, `customQuestions: CustomQuestion[]`, `candidate: CandidateDetails | null` — persisted via existing StorageAdapter
- **Question ID scheme:** `${sectionId}-${topicId}-${questionIndex}` — deterministic, no hashing
- **Reset all confirmation:** Single `<dialog>` confirm — "Reset all scores, notes, and candidate details?" with Cancel/Reset buttons; snapshot before reset; no undo in Phase 5
- **hideMarked behavior:** A topic is "marked" (hidden when toggle active) if it has at least one scored question (score !== null) — matches the toggle's purpose during an interview

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scoring/index.ts` — `computeTopicMark`, `computeSectionMark`, `computeOverallMark`, `getMarkBand` — use directly in components
- `src/store/app.ts` — extend with scoring state + actions; existing subscribe pattern handles persistence
- `src/storage/adapter.ts` — `storageAdapter.snapshot()` now called here (STORE-05 delivery)
- `src/storage/types.ts` — extend V2SessionSchema to include scoring fields
- `src/components/QuestionCard.tsx` — Phase 4 read-only card to extend with slider + notes
- `src/utils/buildFlatRows.ts` — already implements `hideMarked` filter with correct topic-open semantics
- Phase 4 `<dialog>` pattern for modals (reset confirm, candidate details)

### Established Patterns
- Named exports, `.js` extensions on relative imports, Biome lint
- Tailwind v4 with `dark:` variants on every interactive element
- `focus-visible:ring-2 focus-visible:ring-blue-500` on every button/input
- Zustand module-level subscribe → storageAdapter.write (no middleware)
- co-located `*.test.tsx` files

### Integration Points
- Phase 6 adds session switcher — scoring state lives in `session:<id>` key, not global
- Phase 7 YAML export reads session scoring state
- Phase 9 adds keyboard shortcuts (`Esc` closes modals)

</code_context>

<specifics>
## Specific Ideas

- Score `null` = unscored (not 0) — 0 is a valid score per Phase 2 research; this matches the scorer's contract
- `CandidateDetails` type: `{ name: string; email: string; role: string; date: string; interviewer: string; details: string }`
- `CustomQuestion` type: `{ id: string; topicId: string; text: string; level: Difficulty; }`; custom ID scheme: `custom-${topicId}-${Date.now()}`
- Extend V3 schema migration (v2→v3): add all new fields with safe defaults (empty records, empty arrays, null)
- The Phase 4 `buildFlatRows` `hideMarked` filter already passes `hideMarked` boolean — Phase 5 makes it meaningful by checking if any score exists

</specifics>

<deferred>
## Deferred Ideas

- Undo for reset (Phase 6 adds session-level undo)
- Per-session snapshots beyond Reset/Import triggers (Phase 7)
- Export scoring data to YAML (Phase 7)
- Keyboard shortcut to close modals with Esc (Phase 9 — already works natively on `<dialog>`)

</deferred>
