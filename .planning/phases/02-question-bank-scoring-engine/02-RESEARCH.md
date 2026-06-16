# Phase 2: Question Bank & Scoring Engine — Research

**Researched:** 2026-06-16
**Domain:** TypeScript data modeling, pure-function scoring engine, Vitest coverage
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**TypeScript Types & Bank Structure**
- Difficulty type: string literal union `'novice' | 'intermediate' | 'advanced' | 'expert'` — matches prototype exactly, no enum overhead
- Bank file layout: split per section group under `src/data/bank/` — easier to navigate 1000+ questions, one file per group
- Data source: extract DEFAULT_SECTIONS verbatim from `stack-checklist.html` with TypeScript types added — preserves exact content parity with prototype
- Coefficients: `DIFFICULTY_COEFFICIENTS` record exported from `src/data/bank/types.ts` — single source of truth for scorer and future UI; values: `{ novice: 1.00, intermediate: 1.25, advanced: 1.50, expert: 1.75 }`

**Scoring Engine Contract**
- Function style: pure functions — `computeTopicMark(questions, scores, override?)`, `computeSectionMark(topics)`, `computeOverallMark(sections)` — no class, fully testable
- Unscored semantics: `null` score = unscored and excluded from weighted average — matches prototype behavior; `0` is a valid scored value
- Mark bands: scorer returns `'none' | 'low' | 'mid' | 'good' | 'high'` based on computed mark — scorer owns the band contract (thresholds: `<5=low`, `5-6.4=mid`, `6.5-7.9=good`, `≥8=high`, `null=none`)
- Exported types: `ScoreMap`, `TopicResult`, `SectionResult`, `OverallResult` all exported from `src/scoring/index.ts`

**Test Strategy**
- Bank structure assertions: assert exact counts — 9 groups, ≥86 topics, ≥1000 questions, all difficulty levels valid — in `src/data/bank/bank.test.ts`
- Scoring fixtures: derive from 2-3 prototype topic samples (hand-verify coefficients) — "prototype-derived" per BANK-03
- Coverage target: 100% branch/line coverage on scoring engine functions; structural-only on bank data files
- Test file location: co-located — `src/data/bank/bank.test.ts`, `src/scoring/scoring.test.ts`

### Claude's Discretion

None defined explicitly — all scoring and bank decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Custom question support (Phase 5) — custom questions extend the bank at runtime; data layer here must be extensible but custom questions are not in scope for Phase 2
- YAML export of bank data (Phase 7) — scorer types will be reused there
- Live recompute wiring to React state (Phase 4+) — scorer is pure, UI wires it

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BANK-01 | Built-in question bank compiled as build-time constant — 9 groups / ~86 topics / 1000+ questions / 4 difficulty levels (coefficients 1.00 / 1.25 / 1.50 / 1.75); never persisted in storage | Exact counts verified from prototype: 9 groups, 86 topics, 1067 questions. `as const` assertion + typed array pattern documented. |
| BANK-02 | Weighted scoring engine: difficulty-weighted topic marks, manual topic overrides, plain-mean group and overall marks, live recompute on every score change, colored mark bands | Full scoring algorithm extracted from prototype lines 2082–2125. Pure function signatures documented with exact formula. |
| BANK-03 | Vitest unit coverage on bank structure and scoring engine with prototype-derived fixtures | Vitest 4.1.9 + @vitest/coverage-v8 4.1.9 (not yet installed); coverage config documented with 100% branch target. |

</phase_requirements>

---

## Summary

Phase 2 is a pure data-and-logic phase: no UI, no storage, no side effects. The deliverable is two modules — a compiled-in question bank (`src/data/bank/`) and a scoring engine (`src/scoring/`) — that become the behavioral contract all downstream phases import. Both must be fully tested before Phase 3 (Storage) can safely reference their types.

The behavioral source of truth is `stack-checklist.html`. The DEFAULT_SECTIONS array at line 649 contains exactly 9 groups, 86 topics, and 1067 questions with four difficulty levels distributed nearly uniformly (novice: 258, intermediate: 281, advanced: 268, expert: 260). The scoring algorithm is fully documented in the prototype (lines 2082–2125): topic mark is a difficulty-weighted mean of scored questions, group and overall marks are plain arithmetic means of non-null topic marks. Mark bands are a 5-tier enum returned by the scorer.

The mark band thresholds in CONTEXT.md (`<5=low, 5-6.4=mid, 6.5-7.9=good, ≥8=high`) are the **locked decisions** and differ slightly from the prototype (`m<4=low, m<6.5=mid, m<8.5=good`). The planner must use the CONTEXT.md thresholds, not the prototype's.

**Primary recommendation:** Extract DEFAULT_SECTIONS verbatim, type it with a single `Section[]` type using `as const`-friendly literal types, split into one file per group under `src/data/bank/`, write the scorer as three pure functions in `src/scoring/scoring.ts`, and install `@vitest/coverage-v8` to configure 100% branch coverage.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Question bank data constant | Static build-time module | — | Pure TypeScript constant; never at runtime browser tier |
| Difficulty coefficient lookup | Static build-time module | — | Single exported record, referenced by scorer and future UI |
| Topic mark computation (weighted avg) | Pure function module | — | No DOM, no storage; scorer owns the math |
| Group mark computation (plain mean) | Pure function module | — | Delegates to topic results |
| Overall mark computation (plain mean) | Pure function module | — | Aggregates group results |
| Mark band classification (none/low/mid/good/high) | Pure function module | — | Scorer owns band thresholds; UI reads the result |
| Manual topic override | Caller-passed argument to scorer | Frontend (Phase 4+) | Override is passed in as an argument; scorer does not hold state |
| Bank structure assertions (tests) | Test layer (Vitest) | — | Co-located test files; no runtime role |

---

## DEFAULT_SECTIONS — Verified Counts [VERIFIED: stack-checklist.html grep + node eval]

| Group ID | Label | Topics | Notes |
|----------|-------|--------|-------|
| `frontend` | Frontend | 13 | twig, scss, js, bootstrap, webpack, postcss, babel, emulsify, bem, atomic, jquery, lottie, browsersync |
| `design` | Design | 5 | figma, tokens, styledictionary, storybook, normalize |
| `backend` | Backend | 22 | drupal, php, composer, drush, jsonapi, restapi, paragraphs, lightning, layoutbuilder, webform, searchapi, migrate, configsplit, memcache, saml, oauth, ckeditor, pathauto, metatag, tmgmt, encrypt, symfony |
| `environment` | Dev Environment | 8 | ddev, docker, nginx, mariadb, xdebug, acquia, nodejs, multisite |
| `testing` | Testing | 6 | jest, storybooktest, pa11y, storycap, puppeteer, drupalspec |
| `cicd` | CI / CD | 6 | semrel, conventionalcommits, husky, lintstaged, acquiapurge, patches |
| `tooling` | Tooling | 5 | eslint, stylelint, prettier, drupalsniffer, kint |
| `integrations` | Integrations | 9 | aws, googleapi, facebook, mailchimp, gtm, algolia, leaflet, recaptcha, symfonymailer |
| `ai` | AI & Tooling | 12 | claude-code, claude-md, claude-hooks, mcp-protocol, mcp-ds, mcp-context7, mcp-figma, mcp-jira, codemie, codemie-guides, prompt-engineering, ai-workflow |
| **TOTAL** | | **86** | |

**Question counts:** 1067 total
**Level distribution:** novice=258, intermediate=281, advanced=268, expert=260

**Each topic has exactly 12 or 13 questions.** [VERIFIED: stack-checklist.html eval]

---

## Scoring Algorithm — Extracted from Prototype [VERIFIED: stack-checklist.html lines 2072–2125]

### Coefficients (locked from CONTEXT.md)

```typescript
const DIFFICULTY_COEFFICIENTS = {
  novice: 1.00,
  intermediate: 1.25,
  advanced: 1.50,
  expert: 1.75,
} as const;
```

### Topic Mark (difficulty-weighted average of scored questions only)

```
topicMark = Σ(coefficient_i × score_i) / Σ(coefficient_i)
           where i ranges over ALL questions in the topic that have a score (not null)
           result = null if no questions have been scored
```

Prototype reference (lines 2082–2092):
```javascript
function topicAutoMark(item) {
  let wsum = 0, csum = 0, scored = 0;
  getQuestions(item).forEach(q => {
    if (!hasScore(q.key)) return;      // null/undefined = skip
    const c = LEVEL_COEF[q.level] || 1;
    wsum += c * state.questionScore[q.key];
    csum += c;
    scored++;
  });
  return { mark: csum > 0 ? wsum / csum : null, scored };
}
```

**Key semantics:** `0` is a scored value (valid). `null` means unscored — excluded from denominator too, so a single scored question produces a valid mark.

**Override logic** (lines 2094–2098): if a manual override is set (numeric, 0–10), it replaces the computed mark entirely for that topic. Other topics are unaffected.

### Group (Section) Mark (plain arithmetic mean of topic final marks)

```
groupMark = Σ(topicFinalMark_i) / count(topicFinalMark_i where not null)
           result = null if no topics have a final mark
```

Prototype reference (lines 2101–2105):
```javascript
function sectionMark(sec) {
  const marks = sec.items.map(topicFinalMark).filter(m => m != null);
  if (!marks.length) return null;
  return marks.reduce((a, b) => a + b, 0) / marks.length;
}
```

### Overall Mark (plain arithmetic mean of ALL topic final marks across all groups)

```
overallMark = Σ(topicFinalMark_i) / count(topicFinalMark_i where not null)
             result = null if no topics scored
```

Prototype reference (lines 2108–2116): iterates `allItems()` (flattened topics across all groups), filters null, computes mean. Note this is mean-of-topics, not mean-of-groups — a group with more topics has proportionally more influence.

### Mark Band Thresholds (LOCKED from CONTEXT.md — use these, NOT prototype values)

| Band | CONTEXT.md Threshold | Prototype Threshold | Note |
|------|----------------------|---------------------|------|
| `'none'` | mark is null | `m == null` | Same |
| `'low'` | mark < 5 | `m < 4` | **DIVERGES** — CONTEXT.md is authoritative |
| `'mid'` | 5 ≤ mark < 6.5 | `4 ≤ m < 6.5` | |
| `'good'` | 6.5 ≤ mark < 8 | `6.5 ≤ m < 8.5` | **DIVERGES** — CONTEXT.md is authoritative |
| `'high'` | mark ≥ 8 | `m ≥ 8.5` | **DIVERGES** — CONTEXT.md is authoritative |

The CONTEXT.md thresholds (`<5`, `5-6.4`, `6.5-7.9`, `≥8`) are the locked implementation target.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~6.0 (installed) | Type safety for bank types and scorer | Already installed; strict mode active |
| Vitest | ^4.1.9 (installed) | Unit test runner for bank and scorer | Already the project test framework |
| @vitest/coverage-v8 | ^4.1.9 (must install) | V8-native branch/line coverage | Paired to Vitest version; no separate config file needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | Phase 2 is zero-dependency beyond TypeScript | All bank data is statically typed constants; scorer is pure math |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vitest/coverage-v8` | `@vitest/coverage-istanbul` | Istanbul instruments source; V8 uses native engine counters — V8 is faster and has no instrumentation overhead |
| `as const` assertion on full bank array | Separate `readonly` typed interfaces | `as const` prevents widening but produces very deep inferred types; typed interfaces are more readable; use typed interfaces with `satisfies` for bank files |
| Single `bank.ts` file | Split per group | Single file would be ~1500+ lines; split is more navigable per CONTEXT.md decision |

**Installation (only new dependency):**
```bash
npm install --save-dev @vitest/coverage-v8
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @vitest/coverage-v8 | npm | 3+ yrs | ~10M/wk | github.com/vitest-dev/vitest | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

`@vitest/coverage-v8` is the official coverage provider published by the vitest-dev organization, co-versioned with vitest itself (4.1.9). [VERIFIED: npm registry — `npm view @vitest/coverage-v8 version` returns 4.1.9]

---

## Architecture Patterns

### System Architecture Diagram

```
stack-checklist.html (DEFAULT_SECTIONS)
         │  extract verbatim
         ▼
src/data/bank/
  ├── types.ts          ← Difficulty, Question, Topic, Section types + DIFFICULTY_COEFFICIENTS
  ├── frontend.ts       ← Section data (13 topics)
  ├── design.ts         ← Section data (5 topics)
  ├── backend.ts        ← Section data (22 topics)
  ├── environment.ts    ← Section data (8 topics)
  ├── testing.ts        ← Section data (6 topics)
  ├── cicd.ts           ← Section data (6 topics)
  ├── tooling.ts        ← Section data (5 topics)
  ├── integrations.ts   ← Section data (9 topics)
  ├── ai.ts             ← Section data (12 topics)
  ├── index.ts          ← re-export DEFAULT_SECTIONS + all types
  └── bank.test.ts      ← structural assertions (counts, valid levels)
         │
         │  imports types + DIFFICULTY_COEFFICIENTS
         ▼
src/scoring/
  ├── scoring.ts        ← computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand
  ├── index.ts          ← re-exports all scorer functions + result types
  └── scoring.test.ts   ← 100% branch coverage with prototype-derived fixtures
         │
         │  consumed by (Phase 3+)
         ▼
src/storage/ (Phase 3)  →  ScoreMap type, bank IDs for indexing
src/app/ (Phase 4+)     →  DEFAULT_SECTIONS for rendering, scorer for live marks
```

### Recommended Project Structure
```
src/
├── data/
│   └── bank/
│       ├── types.ts          # Difficulty union, Question, Topic, Section interfaces, DIFFICULTY_COEFFICIENTS
│       ├── frontend.ts       # Frontend group (13 topics)
│       ├── design.ts         # Design group (5 topics)
│       ├── backend.ts        # Backend group (22 topics)
│       ├── environment.ts    # Dev Environment group (8 topics)
│       ├── testing.ts        # Testing group (6 topics)
│       ├── cicd.ts           # CI/CD group (6 topics)
│       ├── tooling.ts        # Tooling group (5 topics)
│       ├── integrations.ts   # Integrations group (9 topics)
│       ├── ai.ts             # AI & Tooling group (12 topics)
│       ├── index.ts          # DEFAULT_SECTIONS assembly + re-exports
│       └── bank.test.ts      # BANK-01 structural assertions
├── scoring/
│   ├── scoring.ts            # Pure scoring functions
│   ├── index.ts              # Public API re-exports
│   └── scoring.test.ts       # BANK-02/03 unit tests
└── test/
    └── setup.ts              # Existing — imports @testing-library/jest-dom/vitest
```

### Pattern 1: TypeScript Types for Bank Data

**What:** Define `Difficulty`, `Question`, `Topic`, `Section` interfaces in `types.ts`. Individual group files export a typed const array. The index re-assembles DEFAULT_SECTIONS.

**When to use:** Any time a large read-only data constant needs discoverability and type safety without runtime overhead.

```typescript
// src/data/bank/types.ts
// Source: CONTEXT.md locked decisions

export type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert';

export interface Question {
  readonly q: string;
  readonly level: Difficulty;
}

export interface Topic {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly tag: string;
  readonly questions: readonly Question[];
}

export interface Section {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly items: readonly Topic[];
}

export const DIFFICULTY_COEFFICIENTS: Record<Difficulty, number> = {
  novice: 1.00,
  intermediate: 1.25,
  advanced: 1.50,
  expert: 1.75,
} as const;
```

**Group file pattern:**
```typescript
// src/data/bank/frontend.ts
import type { Section } from './types.js';

export const frontendSection: Section = {
  id: 'frontend',
  label: 'Frontend',
  icon: '🖥️',
  items: [
    {
      id: 'twig',
      name: 'Twig',
      desc: 'PHP templating for Drupal theme components',
      tag: 'Templating',
      questions: [
        { q: 'What is the difference between include, embed, and extends in Twig?', level: 'novice' },
        // ... remaining questions verbatim
      ],
    },
    // ... remaining topics
  ],
};
```

**Index assembly:**
```typescript
// src/data/bank/index.ts
import { frontendSection } from './frontend.js';
// ... import all 9 group sections
import type { Section } from './types.js';

export const DEFAULT_SECTIONS: readonly Section[] = [
  frontendSection,
  designSection,
  backendSection,
  environmentSection,
  testingSection,
  cicdSection,
  toolingSection,
  integrationsSection,
  aiSection,
] as const;

export type { Difficulty, Question, Topic, Section } from './types.js';
export { DIFFICULTY_COEFFICIENTS } from './types.js';
```

### Pattern 2: Pure Scoring Functions

**What:** Three pure functions operating on immutable data. No class, no singleton, no side effects.

**When to use:** Any computation that must be tested in isolation and called from any context (UI, tests, export).

```typescript
// src/scoring/scoring.ts
// Source: extracted from stack-checklist.html lines 2082–2125, adapted per CONTEXT.md

import type { Topic, Section } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';

export type MarkBand = 'none' | 'low' | 'mid' | 'good' | 'high';

/** Map from question key to score (0–10). null/absent = unscored. */
export type ScoreMap = Record<string, number | null>;

export interface TopicResult {
  mark: number | null;   // null if no questions scored
  band: MarkBand;
  scoredCount: number;   // number of questions with a score
  totalCount: number;    // total questions in topic (built-in only)
}

export interface SectionResult {
  mark: number | null;
  band: MarkBand;
  scoredTopics: number;
  totalTopics: number;
}

export interface OverallResult {
  mark: number | null;
  band: MarkBand;
  scoredTopics: number;
  totalTopics: number;
}

/**
 * Difficulty-weighted average of scored questions.
 * questionKey for built-in question at index i in topic t: `${t.id}-${i}`
 * override replaces computed mark if provided (0–10).
 */
export function computeTopicMark(
  topic: Topic,
  scores: ScoreMap,
  override?: number | null,
): TopicResult {
  if (typeof override === 'number' && override >= 0 && override <= 10) {
    return {
      mark: override,
      band: getMarkBand(override),
      scoredCount: 0,   // override doesn't count individual scores
      totalCount: topic.questions.length,
    };
  }

  let weightedSum = 0;
  let coeffSum = 0;
  let scoredCount = 0;

  topic.questions.forEach((q, i) => {
    const key = `${topic.id}-${i}`;
    const score = scores[key];
    if (typeof score !== 'number' || score === null) return;
    const coef = DIFFICULTY_COEFFICIENTS[q.level];
    weightedSum += coef * score;
    coeffSum += coef;
    scoredCount++;
  });

  const mark = coeffSum > 0 ? weightedSum / coeffSum : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredCount,
    totalCount: topic.questions.length,
  };
}

/**
 * Plain arithmetic mean of non-null topic final marks in a section.
 * Callers pass in pre-computed TopicResult[] for the section's topics.
 */
export function computeSectionMark(topicResults: TopicResult[]): SectionResult {
  const marks = topicResults.map(r => r.mark).filter((m): m is number => m !== null);
  const mark = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredTopics: marks.length,
    totalTopics: topicResults.length,
  };
}

/**
 * Plain arithmetic mean across ALL topic final marks in all sections.
 * This is mean-of-topics (not mean-of-groups) — matching prototype behavior.
 */
export function computeOverallMark(sectionResults: SectionResult[]): OverallResult {
  const allScoredTopics = sectionResults.reduce((sum, r) => sum + r.scoredTopics, 0);
  const allTotalTopics = sectionResults.reduce((sum, r) => sum + r.totalTopics, 0);
  // Re-compute from total — need per-topic marks not section aggregates for true mean-of-topics.
  // Callers must pass all TopicResult[] directly; see note in pitfalls section.
  // ... (see Pitfall 2 below for the correct implementation pattern)
  return {
    mark: null,
    band: 'none',
    scoredTopics: allScoredTopics,
    totalTopics: allTotalTopics,
  };
}

/** Classify a numeric mark into a named band per CONTEXT.md thresholds. */
export function getMarkBand(mark: number | null): MarkBand {
  if (mark === null) return 'none';
  if (mark < 5)    return 'low';
  if (mark < 6.5)  return 'mid';
  if (mark < 8)    return 'good';
  return 'high';
}
```

### Pattern 3: Vitest Coverage Configuration

**What:** Add `coverage` config to `vitest.config.ts` to enforce 100% branches/lines on the scorer module.

**When to use:** Any pure-function module where correctness is critical and all branches must be exercised.

```typescript
// vitest.config.ts (updated)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/scoring/**'],      // 100% target is scorer only
      exclude: ['src/data/bank/**'],    // structural data files exempt
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
```

Run coverage: `npx vitest run --coverage`

### Anti-Patterns to Avoid

- **Enum for Difficulty:** TypeScript enums generate runtime JS objects; string literal unions are zero-cost and allow direct comparison with prototype values. Use `type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert'`.
- **Widening the question key scheme:** The prototype keys questions as `${itemId}-${index}`. Changing this in Phase 2 would break Phase 3 storage and Phase 7 YAML import. Use `${topic.id}-${questionIndex}` exactly.
- **Computing overall mark as mean-of-section-marks:** The prototype computes `overallMark` as the arithmetic mean of ALL topic final marks (across all groups), not mean of group marks. Groups with more topics (backend: 22) naturally have more influence. The scorer must flatten all topic results to compute this correctly.
- **Importing DEFAULT_SECTIONS in scoring.ts:** The scorer must not import the bank; it accepts data as arguments. This keeps the scorer reusable with custom questions (Phase 5) and imported YAML structures (Phase 7).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage enforcement | Custom branch-coverage checker | `@vitest/coverage-v8` with thresholds | V8 native; zero-config with Vitest; one package |
| TypeScript strict null checks | Manual null guard patterns | `strict: true` (already set) + explicit `number \| null` in return types | Compiler enforces all null paths |
| Question key generation | Custom ID scheme | `${topic.id}-${questionIndex}` (verbatim from prototype) | Stable IDs needed for storage (Phase 3) and YAML import (Phase 7) |
| Mark band classification | Inlined conditionals in every caller | `getMarkBand(mark)` exported from scorer | Single source of truth; one place to change thresholds |

**Key insight:** The scoring engine's complexity comes from correct null handling (unscored vs scored-zero) and the exact question key scheme. Both are already solved in the prototype — copy them faithfully rather than reinventing.

---

## Common Pitfalls

### Pitfall 1: Treating Unscored Questions as Score=0
**What goes wrong:** If `undefined` or missing keys in ScoreMap are treated as `0`, the weighted average is pulled toward 0 for unscored questions, producing incorrect marks for partially-scored topics.
**Why it happens:** Falsy-value checks (`if (!score)`) catch both `0` and `undefined`.
**How to avoid:** Only include a question in the weighted sum when `typeof score === 'number'`. Both `0` and `10` are valid scores. Only `null` / missing key means unscored.
**Warning signs:** A topic with one scored question at 10 shows a mark below 10 — it means unscored questions are being included as 0.

### Pitfall 2: Overall Mark as Mean of Group Marks (Wrong)
**What goes wrong:** `computeOverallMark` takes the mean of `sectionResults[i].mark` — this weights each group equally regardless of how many topics it has. The prototype iterates all topics directly.
**Why it happens:** Natural to aggregate section-level results rather than going back to topic-level.
**How to avoid:** `computeOverallMark` must receive the flat list of all `TopicResult[]`, not `SectionResult[]`. Alternatively, accept `SectionResult[]` but also require the raw topic marks from each section.

**Correct signature:**
```typescript
export function computeOverallMark(allTopicResults: TopicResult[]): OverallResult {
  const marks = allTopicResults.map(r => r.mark).filter((m): m is number => m !== null);
  const mark = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
  return {
    mark,
    band: getMarkBand(mark),
    scoredTopics: marks.length,
    totalTopics: allTopicResults.length,
  };
}
```

### Pitfall 3: Mark Band Thresholds Differ from Prototype
**What goes wrong:** If the prototype's `markClass` thresholds (`m<4=low`) are copied verbatim instead of the CONTEXT.md thresholds (`m<5=low`), tests written with CONTEXT.md expectations will fail.
**Why it happens:** The prototype and CONTEXT.md deliberately diverge — the user refined the thresholds.
**How to avoid:** Implement `getMarkBand` using CONTEXT.md values (`<5`, `5-6.4`, `6.5-7.9`, `≥8`). Write fixture tests that explicitly assert band assignment at the boundary values (4.99→low, 5.0→mid, 6.49→mid, 6.5→good, 7.99→good, 8.0→high).
**Warning signs:** A fixture score that should be 'mid' returns 'low'.

### Pitfall 4: TypeScript moduleResolution: Bundler Requires .js Extensions in Imports
**What goes wrong:** Under `moduleResolution: "Bundler"` (already set in tsconfig.json), imports within `src/` must use `.js` extension (e.g., `import { ... } from './types.js'`) even though the source is `.ts`. Missing extensions cause "Cannot find module" errors.
**Why it happens:** Bundler resolution requires explicit extensions; TypeScript does not auto-append them.
**How to avoid:** Always use `.js` extensions in relative imports within `src/`. This is already established in Phase 1 patterns.
**Warning signs:** `tsc --noEmit` reports "Module not found" for local imports.

### Pitfall 5: Bank Data Files Trigger Biome Import-Order Warnings
**What goes wrong:** Bank files have many question objects; Biome's `organizeImports` will sort any imports. If group files import from `./types.js`, the import order must be correct from creation.
**Why it happens:** Biome auto-fixes on `npm run ci` and may alter the file in ways that require re-checking.
**How to avoid:** Run `npm run check` after creating each bank file. Place the single `import type { Section } from './types.js'` line at the top; Biome will not reorder a single import.

### Pitfall 6: @vitest/coverage-v8 Not Installed
**What goes wrong:** Running `npx vitest run --coverage` without `@vitest/coverage-v8` installed will fail with "No coverage provider found". The package is NOT installed in the current project (confirmed: `node_modules/@vitest/` contains only internal vitest packages, not `coverage-v8`).
**Why it happens:** Vitest requires explicit installation of the coverage provider as a separate package.
**How to avoid:** Add `npm install --save-dev @vitest/coverage-v8` as the first task in Wave 1.
**Warning signs:** `Error: No coverage provider found. Please install @vitest/coverage-v8`.

---

## Code Examples

### Bank Structure Assertion Test

```typescript
// src/data/bank/bank.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_SECTIONS } from './index.js';

const VALID_LEVELS = new Set(['novice', 'intermediate', 'advanced', 'expert']);

describe('DEFAULT_SECTIONS structure', () => {
  it('has exactly 9 groups', () => {
    expect(DEFAULT_SECTIONS).toHaveLength(9);
  });

  it('has exactly 86 topics across all groups', () => {
    const total = DEFAULT_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    expect(total).toBe(86);
  });

  it('has at least 1000 questions across all topics', () => {
    const total = DEFAULT_SECTIONS.reduce(
      (sum, s) => sum + s.items.reduce((ts, t) => ts + t.questions.length, 0),
      0,
    );
    expect(total).toBeGreaterThanOrEqual(1000);
  });

  it('every question has a valid difficulty level', () => {
    DEFAULT_SECTIONS.forEach(s => {
      s.items.forEach(t => {
        t.questions.forEach(q => {
          expect(VALID_LEVELS.has(q.level)).toBe(true);
        });
      });
    });
  });

  it('every group, topic, and question has a non-empty id/q field', () => {
    DEFAULT_SECTIONS.forEach(s => {
      expect(s.id).toBeTruthy();
      s.items.forEach(t => {
        expect(t.id).toBeTruthy();
        t.questions.forEach(q => {
          expect(q.q.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
```

### Scorer Unit Tests with Prototype-Derived Fixtures

```typescript
// src/scoring/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand } from './index.js';

// Prototype-derived fixture: Twig topic (13 questions)
// topic.id = 'twig', questions indexed 0..11
// levels from prototype: [novice, intermediate, intermediate, intermediate, advanced, advanced, expert, novice, novice, advanced, expert, expert]
// coefficients: novice=1, intermediate=1.25, advanced=1.5, expert=1.75
const TWIG_TOPIC = {
  id: 'twig',
  name: 'Twig',
  desc: '',
  tag: '',
  questions: [
    { q: 'q0', level: 'novice' as const },
    { q: 'q1', level: 'intermediate' as const },
    { q: 'q2', level: 'intermediate' as const },
    { q: 'q3', level: 'intermediate' as const },
    { q: 'q4', level: 'advanced' as const },
    { q: 'q5', level: 'advanced' as const },
    { q: 'q6', level: 'expert' as const },
    { q: 'q7', level: 'novice' as const },
    { q: 'q8', level: 'novice' as const },
    { q: 'q9', level: 'advanced' as const },
    { q: 'q10', level: 'expert' as const },
    { q: 'q11', level: 'expert' as const },
  ],
};

describe('computeTopicMark', () => {
  it('returns null mark when no scores provided', () => {
    const result = computeTopicMark(TWIG_TOPIC, {});
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
    expect(result.scoredCount).toBe(0);
  });

  it('score of 0 is valid and scores the question (not skipped)', () => {
    const scores = { 'twig-0': 0 };          // novice q0 = 0
    const result = computeTopicMark(TWIG_TOPIC, scores);
    expect(result.mark).toBe(0);              // 1.0*0 / 1.0 = 0
    expect(result.scoredCount).toBe(1);
  });

  it('computes weighted average correctly with multiple scores', () => {
    // Score q0 (novice, coef=1.0) = 8, q4 (advanced, coef=1.5) = 6
    // weightedSum = 1.0*8 + 1.5*6 = 8 + 9 = 17
    // coeffSum = 1.0 + 1.5 = 2.5
    // mark = 17/2.5 = 6.8
    const scores = { 'twig-0': 8, 'twig-4': 6 };
    const result = computeTopicMark(TWIG_TOPIC, scores);
    expect(result.mark).toBeCloseTo(6.8, 5);
    expect(result.band).toBe('good');
    expect(result.scoredCount).toBe(2);
  });

  it('override replaces computed mark', () => {
    const scores = { 'twig-0': 3 };
    const result = computeTopicMark(TWIG_TOPIC, scores, 9);
    expect(result.mark).toBe(9);
    expect(result.band).toBe('high');
  });

  it('override of 0 is valid (not treated as null)', () => {
    const scores = { 'twig-0': 10 };
    const result = computeTopicMark(TWIG_TOPIC, scores, 0);
    expect(result.mark).toBe(0);
    expect(result.band).toBe('low');
  });
});

describe('getMarkBand — CONTEXT.md thresholds', () => {
  it('null → none', ()   => expect(getMarkBand(null)).toBe('none'));
  it('0 → low',    ()   => expect(getMarkBand(0)).toBe('low'));
  it('4.99 → low', ()   => expect(getMarkBand(4.99)).toBe('low'));
  it('5.0 → mid',  ()   => expect(getMarkBand(5.0)).toBe('mid'));
  it('6.49 → mid', ()   => expect(getMarkBand(6.49)).toBe('mid'));
  it('6.5 → good', ()   => expect(getMarkBand(6.5)).toBe('good'));
  it('7.99 → good', ()  => expect(getMarkBand(7.99)).toBe('good'));
  it('8.0 → high',  ()  => expect(getMarkBand(8.0)).toBe('high'));
  it('10 → high',   ()  => expect(getMarkBand(10)).toBe('high'));
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Istanbul instrumentation for coverage | V8 native coverage (`@vitest/coverage-v8`) | Vitest v1+ | Faster, no source transform needed |
| TypeScript `enum` for string constants | String literal union types | TypeScript 2.0+ | Zero runtime overhead, direct string comparison |
| `as const` for all data constants | `satisfies` + typed interface for data files | TypeScript 4.9+ | More ergonomic; `satisfies` checks shape without widening |

**Deprecated/outdated:**
- `@vitest/coverage-istanbul`: Still supported but generates more overhead than V8; no benefit for this use case.
- TypeScript `const enum`: Inlines values at compile time but forbidden under `isolatedModules` (Vite's TS mode). Use string literal unions.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@vitest/coverage-v8` at version 4.1.9 is current as of June 2026 | Standard Stack | If a newer breaking version exists, install command may pull incompatible version — run `npm view @vitest/coverage-v8 version` to confirm |
| A2 | The TypeScript `.js` extension import requirement applies to all src/ imports | Common Pitfalls | If Vite/CRXJS handles extensionless imports internally, the pitfall is moot — but adding `.js` is always safe |
| A3 | The prototype's question key scheme (`${topicId}-${index}`) is stable across app versions | Architecture | If Phase 7 (YAML import) uses a different normalization, the key scheme must evolve — but Phase 2 must lock it now |

**If this table is empty:** Not empty — three low-risk assumptions documented above.

---

## Open Questions

1. **Overall mark: mean-of-topics or mean-of-groups?**
   - What we know: The prototype iterates `allItems()` (flat topic list) for `overallMark()` — mean-of-topics. A group with 22 topics (backend) has far more weight than one with 5 (design).
   - What's unclear: Whether the user considers this intentional or an artifact of prototype implementation.
   - Recommendation: Implement mean-of-topics (matching prototype exactly). Document the behavior in the scorer's JSDoc. No user decision needed — the locked decisions don't specify.

2. **Score type: `number | null` vs `number | undefined`**
   - What we know: CONTEXT.md uses `null` explicitly. ScoreMap values from storage will serialize `null` through JSON.
   - What's unclear: Whether the scorer should accept both `null` and `undefined` or only `null`.
   - Recommendation: Accept `number | null` strictly. Callers must normalize `undefined` (missing keys) to `null` before calling scorer. This matches JSON serialization.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | Yes | 22 (.nvmrc) | — |
| npm | package install | Yes | bundled with node | — |
| @vitest/coverage-v8 | Coverage reporting | No (not installed) | — (4.1.9 on registry) | Must install — no fallback |
| TypeScript | Type checking | Yes | ~6.0 (installed) | — |
| Vitest | Test runner | Yes | 4.1.9 (installed) | — |

**Missing dependencies with no fallback:**
- `@vitest/coverage-v8` — must be installed before coverage commands work. One `npm install --save-dev @vitest/coverage-v8` command resolves this.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (exists, needs `coverage` block added) |
| Quick run command | `npm test` |
| Coverage run command | `npx vitest run --coverage` |
| Full suite command | `npm test` (all tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BANK-01 | DEFAULT_SECTIONS has 9 groups, 86 topics, ≥1000 questions, all valid levels | Unit (structural) | `npm test src/data/bank/bank.test.ts` | No — Wave 1 |
| BANK-01 | DIFFICULTY_COEFFICIENTS exported with correct values | Unit | `npm test src/data/bank/bank.test.ts` | No — Wave 1 |
| BANK-02 | computeTopicMark: null when no scores, correct weighted avg, null-score excluded, 0 is valid | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |
| BANK-02 | computeTopicMark: override replaces computed, override=0 valid | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |
| BANK-02 | computeSectionMark: plain mean of non-null topic marks | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |
| BANK-02 | computeOverallMark: mean-of-topics (not mean-of-groups) | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |
| BANK-02 | getMarkBand: all boundary values (null, <5, 5.0, <6.5, 6.5, <8, ≥8) | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |
| BANK-03 | Coverage: 100% branches/lines on src/scoring/ | Coverage | `npx vitest run --coverage` | No — Wave 2 |
| BANK-03 | Prototype-derived fixture: hand-verified weighted average | Unit | `npm test src/scoring/scoring.test.ts` | No — Wave 2 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run ci`
- **Phase gate:** `npm test && npx vitest run --coverage` — coverage must pass before verification

### Wave 0 Gaps
- `src/data/bank/bank.test.ts` — covers BANK-01 structure assertions
- `src/scoring/scoring.test.ts` — covers BANK-02/03 scorer unit tests
- `vitest.config.ts` — needs `coverage` block with `provider: 'v8'` and 100% thresholds for `src/scoring/`
- Install: `npm install --save-dev @vitest/coverage-v8`

---

## Security Domain

> `security_enforcement: true` per config.json. ASVS Level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 2 has no auth — pure data module |
| V3 Session Management | No | No session state in this phase |
| V4 Access Control | No | Bank data is read-only, publicly bundled |
| V5 Input Validation | Yes (limited) | ScoreMap values must be validated 0–10 range before reaching scorer; scorer defends with typeof checks |
| V6 Cryptography | No | No secrets or keys involved |

### Known Threat Patterns for Pure Data + Scoring Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Out-of-range score injection (e.g., score=-1 or score=11) | Tampering | Scorer checks `score >= 0 && score <= 10`; undefined/out-of-range values treated as unscored |
| Prototype pollution via object spread on ScoreMap | Tampering | ScoreMap is a plain `Record<string, number \| null>`; avoid `Object.assign` with untrusted input; Phase 3 validates before storing |
| XSS via question text in DEFAULT_SECTIONS | Information Disclosure | Bank is a build-time constant, not user input; Phase 4+ UI must still escape question text when rendering (React does this by default) |

**Note:** Phase 2 introduces no new attack surface — no network requests, no user input, no storage. The security concerns above are for downstream phases that consume bank data.

---

## Sources

### Primary (HIGH confidence)
- `stack-checklist.html` (local file, lines 649–2125) — behavioral source of truth; DEFAULT_SECTIONS data structure, scoring algorithm, mark class function, coefficients extracted directly [VERIFIED: stack-checklist.html eval]
- `package.json` (local file) — confirmed installed versions: TypeScript ~6.0, Vitest ^4.1.9, Biome 2.5.0 [VERIFIED: package.json read]
- `vitest.config.ts` (local file) — confirmed existing config; `coverage` block absent [VERIFIED: vitest.config.ts read]
- `.planning/phases/02-question-bank-scoring-engine/02-CONTEXT.md` — locked decisions (thresholds, coefficients, file layout, function signatures) [VERIFIED: CONTEXT.md read]

### Secondary (MEDIUM confidence)
- npm registry: `npm view @vitest/coverage-v8 version` → `4.1.9` [VERIFIED: npm registry]
- npm registry: `npm view @vitest/coverage-istanbul version` → `4.1.9` [VERIFIED: npm registry]

### Tertiary (LOW confidence)
- TypeScript `satisfies` operator behavior with readonly types [ASSUMED — training knowledge; stable since TS 4.9]

---

## Metadata

**Confidence breakdown:**
- DEFAULT_SECTIONS structure (counts, levels): HIGH — extracted via node eval directly from source HTML
- Scoring algorithm: HIGH — extracted verbatim from prototype JavaScript
- Mark band thresholds: HIGH — CONTEXT.md locked decisions (noted divergence from prototype)
- TypeScript patterns: HIGH — stable language features
- Vitest coverage config: HIGH — verified installed version; coverage provider absent confirmed
- Pitfalls: HIGH — derived from prototype code analysis and TypeScript strict mode behavior

**Research date:** 2026-06-16
**Valid until:** 2026-09-16 (stable — bank data is static; Vitest 4.x API is stable)
