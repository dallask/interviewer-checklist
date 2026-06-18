# Phase 3: Storage Layer, Migration & Bootstrap - Pattern Map

**Mapped:** 2026-06-17
**Files analyzed:** 12 new files + 2 modified files
**Analogs found:** 12 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/storage/types.ts` | model | transform | `src/data/bank/types.ts` | role-match |
| `src/storage/adapter.ts` | service | file-I/O | `src/scoring/scoring.ts` (pure-function structure) | partial |
| `src/storage/adapter.test.ts` | test | — | `src/scoring/scoring.test.ts` | role-match |
| `src/storage/bootstrap.ts` | service | request-response | `src/scoring/scoring.ts` (async orchestrator shape) | partial |
| `src/storage/bootstrap.test.ts` | test | — | `src/scoring/scoring.test.ts` | role-match |
| `src/storage/lifecycle.ts` | utility | event-driven | no analog (first event-driven module) | none |
| `src/storage/lifecycle.test.ts` | test | — | `src/scoring/scoring.test.ts` | role-match |
| `src/storage/index.ts` | config | — | `src/scoring/index.ts` | exact |
| `src/storage/migrations/index.ts` | service | transform | `src/scoring/scoring.ts` (pipeline orchestrator) | partial |
| `src/storage/migrations/v1-to-v2.ts` | utility | transform | `src/scoring/scoring.ts` (pure function) | role-match |
| `src/storage/migrations/v1-to-v2.test.ts` | test | — | `src/scoring/scoring.test.ts` | role-match |
| `src/storage/migrations/fixtures/v1-snapshot.json` | config | — | no analog | none |
| `src/test/setup.ts` | config | — | `src/test/setup.ts` (extend in place) | exact |
| `src/app/main.tsx` | config | request-response | `src/app/main.tsx` (modify in place) | exact |

---

## Pattern Assignments

### `src/storage/types.ts` (model, transform)

**Analog:** `src/data/bank/types.ts`

**Imports pattern** (lines 1–28, bank/types.ts is the whole file):
```typescript
// No external imports — pure TypeScript interfaces + a const map
export type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert';

export interface Question {
  readonly q: string;
  readonly level: Difficulty;
}
// ...
export const DIFFICULTY_COEFFICIENTS: Record<Difficulty, number> = {
  novice: 1.0,
  // ...
} as const;
```

**Pattern to follow for storage/types.ts:**
- All interfaces use `readonly` on primitive fields
- Named exports only — no default exports
- A single file owns both the TypeScript interfaces AND the valibot schemas (schemas derive the types via `v.InferOutput<>`)
- `.js` extension on all relative imports
- No external dependency in `types.ts` itself (bank/types.ts has zero imports) — but `storage/types.ts` will import `valibot` as the only exception

**Core type pattern:**
```typescript
// src/data/bank/types.ts lines 1-28 — interface-only, named exports, readonly fields
export type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert';
export interface Question { readonly q: string; readonly level: Difficulty; }
export const DIFFICULTY_COEFFICIENTS: Record<Difficulty, number> = { novice: 1.0, ... } as const;
```

---

### `src/storage/adapter.ts` (service, file-I/O)

**Analog:** `src/scoring/scoring.ts` (closest for TypeScript style; no class analog exists yet)

**Imports pattern** (scoring.ts lines 1-2):
```typescript
import type { Topic } from '../data/bank/types.js';
import { DIFFICULTY_COEFFICIENTS } from '../data/bank/types.js';
```
Apply to adapter.ts:
```typescript
import type { V2Manifest, V2Session } from './types.js';
```

**Pattern observations from scoring.ts:**
- `import type` for type-only imports; value imports on the same line only when needed
- `.js` extension on all relative imports (TypeScript strict mode)
- Named exports only — no `export default`
- JSDoc comment blocks on every exported function/class
- Guard conditions (`typeof score !== 'number' || !Number.isFinite(score)`) rather than loose equality

**Class structure — no existing class analog; follow RESEARCH.md Pattern 1 exactly:**
- Private fields use `#` prefix (native private, not `_`)
- `DEBOUNCE_MS = 300`, `QUOTA_BYTES`, `QUOTA_WARNING_THRESHOLD` as module-level constants above the class
- `flushPending()` is synchronous — it initiates `void this.#flush()` fire-and-forget
- `write()` is synchronous — it merges into `#pendingData`, sets `#dirty`, restarts debounce timer
- Singleton export: `export const storageAdapter = new StorageAdapter();`

**Error handling pattern** (scoring.ts has no try/catch — use adapter's own pattern from RESEARCH.md):
```typescript
// Wrap every chrome.storage.local call in try/catch
try {
  return await chrome.storage.local.get(keys);
} catch (err) {
  console.error('[StorageAdapter] read error:', err);
  return {};
}
```

---

### `src/storage/adapter.test.ts` (test, file-I/O)

**Analog:** `src/scoring/scoring.test.ts`

**Test file structure** (scoring.test.ts lines 1-9):
```typescript
import { describe, expect, it } from 'vitest';
import type { TopicResult } from './index.js';
import {
  computeOverallMark,
  // ...
} from './index.js';
```

**Fixture pattern** (scoring.test.ts lines 14-33):
```typescript
// Inline fixture object at top of file — module-level const, not in beforeEach
const TWIG_TOPIC = {
  id: 'twig',
  // ...
};
```

**Pattern to follow for adapter.test.ts:**
- Import `{ describe, expect, it, vi, beforeEach, afterEach }` from `'vitest'`
- Import `StorageAdapter` and `storageAdapter` from `'./adapter.js'`
- Import `{ chrome }` from `'vitest-chrome'` for mock control (per-test `mockImplementation`)
- Inline fixtures at top of file (no JSON imports for adapter tests)
- `describe` blocks per method: `describe('StorageAdapter.write', ...)`, etc.
- `beforeEach` to reset mock call counts: `vi.clearAllMocks()`
- Use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(300)` to test debounce without real setTimeout

---

### `src/storage/bootstrap.ts` (service, request-response)

**Analog:** `src/scoring/scoring.ts` — async orchestrator, pure-function style at each branch, no side effects other than chrome.storage writes

**Imports pattern:**
```typescript
import * as v from 'valibot';
import { storageAdapter } from './adapter.js';
import type { V2Manifest, V2Session } from './types.js';
import { V2ManifestSchema, V2SessionSchema, createDefaultManifest, createDefaultSession } from './types.js';
import { migrateV1ToV2 } from './migrations/index.js';
```

**Core async pattern** — each branch of bootstrap() mirrors scoring.ts's guard-early-return style:
```typescript
// scoring.ts lines 53-58 — guard + early return pattern
if (typeof score !== 'number' || !Number.isFinite(score)) return;
// ...
if (typeof override === 'number' && override >= 0 && override <= 10) {
  return { mark: override, ... };
}
```
Apply to bootstrap.ts: `if (!rawManifest) { ... return defaultState; }`, then version check, then valibot parse — each with a `return` before the next branch.

**Error handling pattern** (RESEARCH.md Pattern 2):
```typescript
// Migration failure path — never throw out of bootstrap()
try {
  const v2 = migrateV1ToV2(rawManifest as V1Schema);
  // ...
} catch (err) {
  console.error('[bootstrap] migration failed, preserving under recovery key:', err);
  await chrome.storage.local.set({ [`recovery:${Date.now()}`]: rawManifest });
  // fall through to default state
}
```

**Export pattern** (named export, no default):
```typescript
export async function bootstrap(): Promise<{ manifest: V2Manifest; sessions: Record<string, V2Session> }>
```

---

### `src/storage/bootstrap.test.ts` (test, request-response)

**Analog:** `src/scoring/scoring.test.ts`

**Test structure pattern** (scoring.test.ts lines 47-60):
```typescript
describe('computeTopicMark', () => {
  it('returns null mark when no scores provided', () => {
    const result = computeTopicMark(TWIG_TOPIC, {});
    expect(result.mark).toBeNull();
    expect(result.band).toBe('none');
  });
```

**Pattern to follow for bootstrap.test.ts:**
- Four `describe` blocks matching the four bootstrap scenarios: empty storage, valid v2, legacy v1, invalid v2 (recovery path)
- `beforeEach(() => { vi.clearAllMocks(); })` to reset chrome.storage.local mocks between tests
- Mock `chrome.storage.local.get` via `chrome.storage.local.get.mockImplementation(...)` from vitest-chrome
- Fixture objects inline at top of file — one `VALID_V2_MANIFEST`, one `V1_LEGACY_BLOB`

---

### `src/storage/lifecycle.ts` (utility, event-driven)

**Analog:** None — first event-driven module. Follow RESEARCH.md Pattern 6 exactly.

**Pattern observations from CONTEXT.md + RESEARCH.md:**
- Two named exports: `registerLifecycleListeners()` and `unregisterLifecycleListeners()`
- Module-level function references (not inline lambdas) so `removeEventListener` can identify the same handler
- Single import: `storageAdapter` from `'./adapter.js'`
- No default export

**Imports pattern:**
```typescript
import { storageAdapter } from './adapter.js';
```

---

### `src/storage/lifecycle.test.ts` (test, event-driven)

**Analog:** `src/scoring/scoring.test.ts` for structure; content tests event registration

**Pattern to follow:**
- `import { describe, expect, it, vi, beforeEach } from 'vitest'`
- Use `vi.spyOn(storageAdapter, 'flushPending')` to assert it is called on hide events
- Dispatch synthetic events: `window.dispatchEvent(new Event('pagehide'))` and `document.dispatchEvent(new Event('visibilitychange'))` with `Object.defineProperty(document, 'visibilityState', { value: 'hidden' })`
- `beforeEach` calls `unregisterLifecycleListeners()` then `registerLifecycleListeners()` for clean state

---

### `src/storage/index.ts` (barrel, —)

**Analog:** `src/scoring/index.ts` — exact match

**Barrel pattern** (scoring/index.ts lines 1-13):
```typescript
export type {
  MarkBand,
  OverallResult,
  ScoreMap,
  SectionResult,
  TopicResult,
} from './scoring.js';
export {
  computeOverallMark,
  computeSectionMark,
  computeTopicMark,
  getMarkBand,
} from './scoring.js';
```

**Pattern to follow for storage/index.ts:**
- `export type { ... }` block for all TypeScript types (V1Schema, V2Manifest, V2Session, StorageKeys)
- `export { ... }` block for runtime values (storageAdapter, bootstrap, registerLifecycleListeners, unregisterLifecycleListeners)
- `.js` extensions on all from-paths
- No re-export of internal implementation details (migrations/* stays internal)

---

### `src/storage/migrations/index.ts` (service, transform)

**Analog:** `src/scoring/scoring.ts` (pipeline orchestrator structure)

**Pattern to follow:**
- Named export: `export function runMigrations(raw: unknown): { manifest: V2Manifest; session: V2Session }`
- Migration chain implemented as an array of `{ fromVersion, fn }` objects iterated in sequence — allows future phases to push entries
- Each migration function called only when the raw data's version matches `fromVersion`
- Re-exports nothing from the individual migration files (callers import from `migrations/index.ts` only)

**Imports pattern:**
```typescript
import type { V1Schema, V2Manifest, V2Session } from '../types.js';
import { migrateV1ToV2 } from './v1-to-v2.js';
```

---

### `src/storage/migrations/v1-to-v2.ts` (utility, transform)

**Analog:** `src/scoring/scoring.ts` — pure function, no side effects, named export

**Pure function pattern** (scoring.ts lines 42-81):
```typescript
export function computeTopicMark(
  topic: Topic,
  scores: ScoreMap,
  override?: number | null,
): TopicResult {
  // pure computation — no mutations, no I/O
  // ...
  return { mark, band, scoredCount, totalCount };
}
```

**Pattern to follow for v1-to-v2.ts:**
- Signature: `export function migrateV1ToV2(raw: Readonly<V1Schema>): { manifest: V2Manifest; session: V2Session }`
- `Readonly<V1Schema>` on parameter enforces no-mutation at the type level (mirrors scoring.ts's immutable `topic` param)
- Use `raw.questionScore ?? {}` nullish coalescing for every optional V1 field — mirrors scoring.ts's `scores[key]` undefined guard
- `crypto.randomUUID()` for session ID generation (no import needed)
- No try/catch — let errors surface to bootstrap()'s catch block

---

### `src/storage/migrations/v1-to-v2.test.ts` (test, transform)

**Analog:** `src/scoring/scoring.test.ts` — fixture-pinned unit tests

**Frozen fixture pattern** (scoring.test.ts lines 14-33 — inline const, module-level):
```typescript
const TWIG_TOPIC = {
  id: 'twig',
  name: 'Twig',
  // ...
};
```

**Pattern to follow for v1-to-v2.test.ts:**
```typescript
import v1FixtureRaw from './fixtures/v1-snapshot.json' with { type: 'json' };
// Note: use 'with' not 'assert' — 'assert' is deprecated in ES2025
const FROZEN_V1 = Object.freeze(v1FixtureRaw) as V1Schema;
```
- `it('does not mutate frozen input')`: call `migrateV1ToV2(FROZEN_V1)`, then `expect(JSON.stringify(FROZEN_V1)).toBe(before)`
- `it('output passes V2SessionSchema validation')`: call `v.safeParse(V2SessionSchema, result.session)`, assert `result.success === true`
- Import `{ describe, expect, it }` from `'vitest'` — matches scoring.test.ts line 1 exactly

---

### `src/storage/migrations/fixtures/v1-snapshot.json` (config, —)

**Analog:** No existing JSON fixture in the codebase. First fixture file.

**Pattern to follow:**
- Anonymized data — no real names, emails, or candidate details
- All `questionScore` and `topicOverride` values use integers 0–10
- `candidate` fields use placeholder strings: `"name": "Test Candidate"`, `"email": "test@example.com"`
- File is committed and never modified after creation (tests freeze it at runtime with `Object.freeze`)
- Shape must exactly match the `V1Schema` interface from `src/storage/types.ts`

---

### `src/test/setup.ts` (modify in place)

**Analog:** `src/test/setup.ts` (the file itself)

**Existing content** (lines 1):
```typescript
import '@testing-library/jest-dom/vitest';
```

**Pattern to follow — append two lines:**
```typescript
import '@testing-library/jest-dom/vitest';
import * as chrome from 'vitest-chrome';
Object.assign(globalThis, { chrome });
```

- Append below the existing `@testing-library/jest-dom/vitest` import
- `vitest.config.ts` already points to this file via `setupFiles: ['./src/test/setup.ts']` — no config change needed

---

### `src/app/main.tsx` (modify in place)

**Analog:** `src/app/main.tsx` (the file itself)

**Existing content** (lines 1-13):
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('Root element not found');
}
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Pattern to follow — insert bootstrap await before createRoot:**
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { bootstrap } from '../storage/bootstrap.js';
import { registerLifecycleListeners } from '../storage/lifecycle.js';

const rootEl = document.getElementById('root');
if (rootEl === null) {
  throw new Error('Root element not found');
}

// Await migration pipeline before mounting — STORE-03
const initialState = await bootstrap();
registerLifecycleListeners();

// TODO Phase 4: pass initialState to Zustand store hydration
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- `.js` extensions on storage imports (matches existing project convention)
- `.tsx` extension preserved on `App` import (matches existing line 3)
- Top-level `await` requires `tsconfig.json` `"module": "ESNext"` or `"Bundler"` — verify before committing; IIFE fallback if build fails

---

## Shared Patterns

### Named exports only
**Source:** `src/scoring/scoring.ts` and `src/data/bank/types.ts`
**Apply to:** All `src/storage/**` files
```typescript
// CORRECT — named export
export function migrateV1ToV2(...) { ... }
export const storageAdapter = new StorageAdapter();
export type { V2Manifest, V2Session };

// WRONG — never use default exports
export default class StorageAdapter { ... }
```

### `.js` extension on all relative imports
**Source:** `src/scoring/scoring.ts` line 1, `src/scoring/index.ts` lines 7, 14
**Apply to:** All `src/storage/**` files
```typescript
import type { V2Manifest } from './types.js';   // CORRECT
import type { V2Manifest } from './types';       // WRONG — TypeScript strict mode rejects this
```

### `import type` for type-only imports
**Source:** `src/scoring/scoring.ts` line 1: `import type { Topic } from '../data/bank/types.js'`
**Apply to:** All storage files that import interfaces without instantiating them
```typescript
import type { V1Schema, V2Manifest, V2Session } from './types.js';
import { storageAdapter } from './adapter.js';  // value import — no 'type' modifier
```

### Test file import line 1
**Source:** `src/scoring/scoring.test.ts` line 1
**Apply to:** All `*.test.ts` files in `src/storage/`
```typescript
import { describe, expect, it } from 'vitest';
// Add vi, beforeEach, afterEach as needed per file
```

### JSDoc block comments on exported functions/classes
**Source:** `src/scoring/scoring.ts` lines 39-41, 85-88, 107-114, 127-134
**Apply to:** All exported functions and the `StorageAdapter` class
```typescript
/**
 * One-line summary of what the function does.
 *
 * Longer explanation if needed.
 */
export function migrateV1ToV2(raw: Readonly<V1Schema>): { manifest: V2Manifest; session: V2Session } {
```

### Guard-then-return error handling (no deep nesting)
**Source:** `src/scoring/scoring.ts` lines 53-58, 65-71
**Apply to:** `bootstrap.ts` branches, `adapter.ts` public methods
```typescript
// Guard early, return early — avoid else chains
if (typeof score !== 'number' || !Number.isFinite(score)) return;
```

### console.error for non-throwing errors
**Source:** Pattern established in RESEARCH.md Pattern 1; no throw in storage catch blocks
**Apply to:** All `catch` blocks in `adapter.ts` and `bootstrap.ts`
```typescript
} catch (err) {
  console.error('[StorageAdapter] read error:', err);
  return {};
}
```

### vitest.config.ts coverage block extension
**Source:** `vitest.config.ts` lines 8-19
**Apply to:** Add `src/storage/**` to the `include` array in the coverage block
```typescript
coverage: {
  provider: 'v8',
  include: ['src/scoring/**', 'src/storage/**'],
  // ...
}
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/storage/lifecycle.ts` | utility | event-driven | No event-driven module exists in the codebase yet |
| `src/storage/migrations/fixtures/v1-snapshot.json` | config | — | No JSON test fixtures exist in the codebase yet |

Both files have complete pattern specifications in RESEARCH.md (Pattern 6 for lifecycle.ts; V1 Schema section for the fixture JSON shape).

---

## Metadata

**Analog search scope:** `src/scoring/`, `src/data/bank/`, `src/test/`, `src/app/`, `src/background/`
**Files scanned:** 9 existing source files read in full
**Pattern extraction date:** 2026-06-17
