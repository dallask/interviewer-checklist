# Phase 2: Question Bank & Scoring Engine - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The complete built-in question bank and scoring engine exist as pure, tested modules that define the behavioral contract for all downstream UI. No UI code is written in this phase — only the data layer and computation layer. Both are consumed as imports by Phase 4+ UI phases.

</domain>

<decisions>
## Implementation Decisions

### TypeScript Types & Bank Structure
- Difficulty type: string literal union `'novice' | 'intermediate' | 'advanced' | 'expert'` — matches prototype exactly, no enum overhead
- Bank file layout: split per section group under `src/data/bank/` — easier to navigate 1000+ questions, one file per group
- Data source: extract DEFAULT_SECTIONS verbatim from `stack-checklist.html` with TypeScript types added — preserves exact content parity with prototype
- Coefficients: `DIFFICULTY_COEFFICIENTS` record exported from `src/data/bank/types.ts` — single source of truth for scorer and future UI; values: `{ novice: 1.00, intermediate: 1.25, advanced: 1.50, expert: 1.75 }`

### Scoring Engine Contract
- Function style: pure functions — `computeTopicMark(questions, scores, override?)`, `computeSectionMark(topics)`, `computeOverallMark(sections)` — no class, fully testable
- Unscored semantics: `null` score = unscored and excluded from weighted average — matches prototype behavior; `0` is a valid scored value
- Mark bands: scorer returns `'none' | 'low' | 'mid' | 'good' | 'high'` based on computed mark — scorer owns the band contract (thresholds: <5=low, 5-6.4=mid, 6.5-7.9=good, ≥8=high, null=none)
- Exported types: `ScoreMap`, `TopicResult`, `SectionResult`, `OverallResult` all exported from `src/scoring/index.ts`

### Test Strategy
- Bank structure assertions: assert exact counts — 9 groups, ≥86 topics, ≥1000 questions, all difficulty levels valid — in `src/data/bank/bank.test.ts`
- Scoring fixtures: derive from 2-3 prototype topic samples (hand-verify coefficients) — "prototype-derived" per BANK-03
- Coverage target: 100% branch/line coverage on scoring engine functions; structural-only on bank data files
- Test file location: co-located — `src/data/bank/bank.test.ts`, `src/scoring/scoring.test.ts`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stack-checklist.html` — behavioral source of truth; `DEFAULT_SECTIONS` at line 649 is the exact bank data to extract
- `src/test/setup.ts` — existing Vitest setup with @testing-library/jest-dom/vitest
- `vitest.config.ts` — configured with coverage support

### Established Patterns
- TypeScript strict mode (`"strict": true`, `moduleResolution: "Bundler"`)
- Biome 2.5.0 for linting/formatting (no ESLint)
- Tests co-located or under `src/test/`; Vitest v4

### Integration Points
- Phase 3 (Storage) imports types from `src/data/bank/types.ts` and `src/scoring/index.ts`
- Phase 4+ UI phases import `DEFAULT_SECTIONS` and all scoring functions directly
- `src/data/bank/index.ts` should re-export everything for clean imports

</code_context>

<specifics>
## Specific Ideas

- Extract `DEFAULT_SECTIONS` from `stack-checklist.html` (line 649) as the exact content — do not re-derive or abbreviate
- The prototype uses `level: 'novice'|'intermediate'|'advanced'|'expert'` — use these exact strings (not `difficulty`)
- Mark band thresholds from prototype: look for `m-low`, `m-mid`, `m-good`, `m-high` CSS classes for reference
- Scoring formula for weighted topic mark: `sum(score * coefficient) / sum(coefficient)` across scored questions
- Plain-mean for group mark: average of all topic marks in the group
- Plain-mean for overall mark: average of all group marks

</specifics>

<deferred>
## Deferred Ideas

- Custom question support (Phase 5) — custom questions extend the bank at runtime; data layer here must be extensible but custom questions are not in scope for Phase 2
- YAML export of bank data (Phase 7) — scorer types will be reused there
- Live recompute wiring to React state (Phase 4+) — scorer is pure, UI wires it

</deferred>
