# Phase 2: Question Bank & Scoring Engine - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 14 new files
**Analogs found:** 4 / 14 (Phase 1 codebase is minimal; RESEARCH.md patterns fill the remainder)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/data/bank/types.ts` | model | — (pure types/constants) | — | no analog |
| `src/data/bank/frontend.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/design.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/backend.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/environment.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/testing.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/cicd.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/tooling.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/integrations.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/ai.ts` | model | — (static data constant) | — | no analog |
| `src/data/bank/index.ts` | utility | — (barrel re-export) | `src/background/index.ts` | partial (module entry point pattern) |
| `src/data/bank/bank.test.ts` | test | — (structural assertions) | `src/background/index.test.ts` | role-match |
| `src/scoring/scoring.ts` | utility | transform | — | no analog |
| `src/scoring/index.ts` | utility | — (barrel re-export) | `src/background/index.ts` | partial (module entry point) |
| `src/scoring/scoring.test.ts` | test | transform | `src/background/index.test.ts` | role-match |
| `vitest.config.ts` *(modify)* | config | — | `vitest.config.ts` | exact (existing file) |

---

## Pattern Assignments

### `src/data/bank/types.ts` (model, pure types)

**Analog:** None in codebase. Use RESEARCH.md Pattern 1.

**Imports pattern:** No imports — this file is the root of the import graph for Phase 2.

**Core pattern** (from RESEARCH.md lines 294–325):
```typescript
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

**Key rules:**
- String literal union, NOT TypeScript `enum` — zero runtime overhead, matches prototype string values directly
- All interface properties `readonly` — this is build-time constant data; mutation must be impossible at the type level
- `DIFFICULTY_COEFFICIENTS` uses `Record<Difficulty, number>` so TypeScript enforces all four keys are present

---

### `src/data/bank/frontend.ts` (and all 8 sibling group files: design, backend, environment, testing, cicd, tooling, integrations, ai)

**Analog:** None in codebase. Use RESEARCH.md Pattern 1.

**Imports pattern** (from RESEARCH.md lines 329–330):
```typescript
import type { Section } from './types.js';
```

Note: `.js` extension is required — `moduleResolution: "Bundler"` in `tsconfig.json` (Pitfall 4 in RESEARCH.md).

**Core data constant pattern** (from RESEARCH.md lines 332–350):
```typescript
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
        // ... remaining questions verbatim from stack-checklist.html
      ],
    },
    // ... remaining topics
  ],
};
```

**Key rules:**
- Each file exports exactly one named constant (e.g., `frontendSection`, `designSection`, etc.)
- Variable is typed `: Section` (explicit annotation, not `as const`) — `Section` interface enforces `readonly` via its definition
- Data extracted verbatim from `stack-checklist.html` `DEFAULT_SECTIONS` at line 649 — do not re-derive
- Run `npm run check` after each file creation to catch Biome import-order issues (Pitfall 5 in RESEARCH.md)

**Group file → export name mapping:**
| File | Export name | Topics |
|------|-------------|--------|
| `frontend.ts` | `frontendSection` | 13 |
| `design.ts` | `designSection` | 5 |
| `backend.ts` | `backendSection` | 22 |
| `environment.ts` | `environmentSection` | 8 |
| `testing.ts` | `testingSection` | 6 |
| `cicd.ts` | `cicdSection` | 6 |
| `tooling.ts` | `toolingSection` | 5 |
| `integrations.ts` | `integrationsSection` | 9 |
| `ai.ts` | `aiSection` | 12 |

---

### `src/data/bank/index.ts` (utility, barrel re-export)

**Analog:** `src/background/index.ts` — partial match (it is also a module entry point, though it is a service worker rather than a barrel). The import/export conventions from RESEARCH.md Pattern 1 are the authoritative source.

**Core barrel pattern** (from RESEARCH.md lines 355–373):
```typescript
import type { Section } from './types.js';
import { frontendSection } from './frontend.js';
import { designSection } from './design.js';
import { backendSection } from './backend.js';
import { environmentSection } from './environment.js';
import { testingSection } from './testing.js';
import { cicdSection } from './cicd.js';
import { toolingSection } from './tooling.js';
import { integrationsSection } from './integrations.js';
import { aiSection } from './ai.js';

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

**Key rules:**
- `DEFAULT_SECTIONS` order must match `stack-checklist.html` group order exactly — group order determines render order in Phase 4+ UI
- Re-export types using `export type { ... }` (type-only re-export) — keeps the barrel clean for consumers that use `isolatedModules`
- All `.js` extensions in relative imports

---

### `src/data/bank/bank.test.ts` (test, structural assertions)

**Analog:** `src/background/index.test.ts` — role-match. Both are co-located Vitest unit tests asserting structural constraints. The `describe`/`it`/`expect` pattern is directly reusable.

**Imports pattern** (from `src/background/index.test.ts` lines 1–4 and RESEARCH.md lines 613–616):
```typescript
import { describe, it, expect } from 'vitest';
import { DEFAULT_SECTIONS } from './index.js';
```

Note: No Node.js `fs` imports needed — this test imports the compiled constant directly, not reading a file from disk.

**Core structural assertion pattern** (from RESEARCH.md lines 618–657):
```typescript
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
});
```

**`describe`/`it` structuring rule:** Mirror the pattern in `src/background/index.test.ts` lines 9–40 — one outer `describe` block per logical concern (structure, field presence, coefficient values).

---

### `src/scoring/scoring.ts` (utility, transform)

**Analog:** None in codebase — no existing pure-function computation modules. Use RESEARCH.md Pattern 2.

**Imports pattern** (from RESEARCH.md lines 386–388):
```typescript
import type { Topic, Section } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';
```

**Key rule:** Do NOT import `DEFAULT_SECTIONS` here. The scorer accepts data as arguments — this keeps it reusable for custom questions (Phase 5) and YAML-imported data (Phase 7). (Anti-pattern documented in RESEARCH.md line 537.)

**Type definitions pattern** (from RESEARCH.md lines 389–413):
```typescript
export type MarkBand = 'none' | 'low' | 'mid' | 'good' | 'high';

export type ScoreMap = Record<string, number | null>;

export interface TopicResult {
  mark: number | null;
  band: MarkBand;
  scoredCount: number;
  totalCount: number;
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
```

**`computeTopicMark` pattern** (from RESEARCH.md lines 420–455):
```typescript
export function computeTopicMark(
  topic: Topic,
  scores: ScoreMap,
  override?: number | null,
): TopicResult {
  if (typeof override === 'number' && override >= 0 && override <= 10) {
    return {
      mark: override,
      band: getMarkBand(override),
      scoredCount: 0,
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
```

**Critical null-guard rule:** Use `typeof score !== 'number'` — NOT `!score` or `score == null`. `0` is a valid score. (Pitfall 1 in RESEARCH.md.)

**Question key scheme:** Always `${topic.id}-${questionIndex}`. This is locked for Phase 3 storage compatibility. (RESEARCH.md Anti-patterns, line 536.)

**`computeSectionMark` pattern** (from RESEARCH.md lines 461–470):
```typescript
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
```

**`computeOverallMark` correct signature** (from RESEARCH.md Pitfall 2, lines 570–579):
```typescript
// CORRECT: accepts flat TopicResult[], NOT SectionResult[]
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

**`getMarkBand` pattern with CONTEXT.md thresholds** (NOT prototype thresholds):
```typescript
export function getMarkBand(mark: number | null): MarkBand {
  if (mark === null) return 'none';
  if (mark < 5)   return 'low';
  if (mark < 6.5) return 'mid';
  if (mark < 8)   return 'good';
  return 'high';
}
```

Boundary values that tests must cover: `null→none`, `0→low`, `4.99→low`, `5.0→mid`, `6.49→mid`, `6.5→good`, `7.99→good`, `8.0→high`, `10→high`. (RESEARCH.md Pitfall 3.)

---

### `src/scoring/index.ts` (utility, barrel re-export)

**Analog:** `src/background/index.ts` — partial match (entry point pattern).

**Core pattern:**
```typescript
export {
  computeTopicMark,
  computeSectionMark,
  computeOverallMark,
  getMarkBand,
} from './scoring.js';

export type {
  MarkBand,
  ScoreMap,
  TopicResult,
  SectionResult,
  OverallResult,
} from './scoring.js';
```

**Key rule:** All four result types (`ScoreMap`, `TopicResult`, `SectionResult`, `OverallResult`) must be exported — they are the public contract for Phase 3 Storage and Phase 4+ UI. (CONTEXT.md Scoring Engine Contract.)

---

### `src/scoring/scoring.test.ts` (test, transform)

**Analog:** `src/background/index.test.ts` — role-match. Both are co-located Vitest tests with `describe`/`it`/`expect`. The scoring test uses prototype-derived fixtures instead of file-content assertions.

**Imports pattern** (from RESEARCH.md lines 664–665):
```typescript
import { describe, it, expect } from 'vitest';
import { computeTopicMark, computeSectionMark, computeOverallMark, getMarkBand } from './index.js';
```

**Fixture definition pattern** (from RESEARCH.md lines 671–690 — Twig topic, 12 questions, prototype-derived levels):
```typescript
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
```

**Key test cases to include** (100% branch coverage requirement):
- `computeTopicMark`: null when no scores; score=0 is valid; weighted average with multiple scores; override replaces computed; override=0 valid
- `computeSectionMark`: null when no topics scored; plain mean of non-null marks
- `computeOverallMark`: null when no topics scored; mean-of-topics (not mean-of-groups)
- `getMarkBand`: all 9 boundary values listed above

**Numeric assertion style:** Use `expect(result.mark).toBeCloseTo(6.8, 5)` for floating-point marks — mirrors the pattern in RESEARCH.md lines 713–714.

---

### `vitest.config.ts` *(modify existing)*

**Analog:** `vitest.config.ts` (lines 1–10) — exact match, this is the file being modified.

**Existing file** (`vitest.config.ts` lines 1–10):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
  },
});
```

**Target state after modification** (from RESEARCH.md lines 510–529):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/scoring/**'],
      exclude: ['src/data/bank/**'],
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

**Key rule:** Only the `coverage` block is added. All existing keys (`environment`, `globals`, `setupFiles`, `passWithNoTests`) are preserved unchanged.

**Prerequisite:** `@vitest/coverage-v8` must be installed before this config takes effect: `npm install --save-dev @vitest/coverage-v8`. Without it, `npx vitest run --coverage` fails with "No coverage provider found". (RESEARCH.md Pitfall 6.)

---

## Shared Patterns

### Import Extension Convention
**Source:** Phase 1 codebase + RESEARCH.md Pitfall 4
**Apply to:** All new `.ts` files with relative imports
```typescript
// CORRECT — required under moduleResolution: "Bundler"
import type { Section } from './types.js';
import { DIFFICULTY_COEFFICIENTS } from './types.js';
import { computeTopicMark } from './scoring.js';

// WRONG — causes "Cannot find module" at tsc time
import type { Section } from './types';
import { DIFFICULTY_COEFFICIENTS } from './types';
```

### Vitest Test File Structure
**Source:** `src/background/index.test.ts` (lines 1–40)
**Apply to:** `src/data/bank/bank.test.ts`, `src/scoring/scoring.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
// ... subject imports

describe('<subject> <concern>', () => {
  it('<specific behavior>', () => {
    // arrange
    // act
    // assert with expect(...)
  });
});
```
Named imports from `vitest` (not relying on `globals: true` auto-injection) — consistent with `src/background/index.test.ts` line 4.

### Readonly Data Shape
**Source:** RESEARCH.md Pattern 1 (types.ts)
**Apply to:** All `src/data/bank/*.ts` group files
```typescript
// All interface properties are readonly — this is build-time constant data.
// The typed interface enforces this at compile time without requiring `as const`
// on every nested object literal.
export interface Section {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly items: readonly Topic[];
}
```

### Null vs. Undefined Discipline
**Source:** RESEARCH.md Pitfall 1, Open Questions #2
**Apply to:** `src/scoring/scoring.ts`, `src/scoring/scoring.test.ts`
```typescript
// CORRECT: typeof check handles both null and undefined as "unscored"
if (typeof score !== 'number' || score === null) return;

// WRONG: catches valid 0 score
if (!score) return;

// WRONG: misses undefined (missing key in ScoreMap)
if (score === null) return;
```

---

## No Analog Found

Files with no close match in the codebase (planner uses RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/data/bank/types.ts` | model | — | No type definition modules exist in Phase 1 |
| `src/data/bank/frontend.ts` (and 8 siblings) | model | static data | No data constant files exist in Phase 1 |
| `src/scoring/scoring.ts` | utility | transform | No pure computation modules exist in Phase 1 |

All three categories have high-confidence patterns in RESEARCH.md (Pattern 1 for types/data files, Pattern 2 for scoring) — these are the authoritative sources for the planner.

---

## Metadata

**Analog search scope:** `src/` (all Phase 1 files enumerated)
**Files scanned:** 7 source files, 1 config file (`vitest.config.ts`)
**Phase 1 files read:** `src/background/index.ts`, `src/background/index.test.ts`, `src/test/manifest.test.ts`, `src/test/setup.ts`, `src/app/App.tsx`, `vitest.config.ts`
**Pattern extraction date:** 2026-06-16
**Notes:** Phase 1 scaffold is intentionally minimal (7 source files). The two closest analogs are `src/background/index.test.ts` (Vitest `describe`/`it` structure) and `vitest.config.ts` (existing config to extend). All bank and scoring patterns are sourced from RESEARCH.md which extracted them directly from `stack-checklist.html`.
