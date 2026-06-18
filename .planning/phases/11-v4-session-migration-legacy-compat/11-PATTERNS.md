# Phase 11: V4 Session Migration & Legacy Compat - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/storage/migrations/v3-to-v4.ts` | migration | transform | `src/storage/migrations/v2-to-v3.ts` | exact |
| `src/storage/migrations/fixtures/v3-session-fixture.ts` | fixture | — | `src/storage/migrations/fixtures/v2-session-fixture.ts` | exact |
| `src/storage/migrations/v3-to-v4.test.ts` | test | — | `src/storage/migrations/v2-to-v3.test.ts` | exact |
| `src/storage/migrations/index.ts` | migration dispatcher | transform | self (extend) | exact |
| `src/storage/types.ts` | model/schema | — | self (extend) | exact |
| `src/storage/bootstrap.ts` | service | batch | self (extend) | exact |
| `src/store/app.ts` | store | CRUD | self (extend) | exact |
| `src/app/main.tsx` | entrypoint | request-response | self (extend) | exact |
| `src/components/MigrationErrorBanner.tsx` | component | event-driven | `src/components/UpdateBanner.tsx` | role-match |
| `src/utils/yamlImport.ts` | utility | transform | self (extend) | exact |

---

## Pattern Assignments

### `src/storage/migrations/v3-to-v4.ts` (NEW — migration, transform)

**Analog:** `src/storage/migrations/v2-to-v3.ts`

**Imports pattern** (lines 1-2 of v2-to-v3.ts):
```typescript
import type { V3Session, V4Session } from '../types.js';
```

**Core migration pattern** (lines 22-33 of v2-to-v3.ts — mirror this shape exactly):
```typescript
// Readonly<> parameter enforces the no-mutation contract.
// No try/catch — errors surface to the bootstrap() catch block.
export function migrateV3ToV4(session: Readonly<V3Session>): V4Session {
  return {
    version: 4,
    id: session.id,
    sections: materializeSections(DEFAULT_SECTIONS),
    scores: remapScoreKeys(session.scores),
    overrides: session.overrides,          // topicId-keyed — no re-key needed
    notes: remapScoreKeys(session.notes),  // question-keyed — MUST re-key
    topicNotes: session.topicNotes,        // topicId-keyed — no re-key needed
    customQuestions: session.customQuestions,
    candidate: session.candidate,
  };
}
```

**Sub-function: materializeSections** (mirror the per-topic flatMap style of migrateCustomQuestions in v2-to-v3.ts lines 35-46):
```typescript
// Deep-copy DEFAULT_SECTIONS — explicit map/spread (NOT JSON.parse/stringify; loses types)
function materializeSections(bank: readonly Section[]): V4Section[] {
  return bank.map((sec) => ({
    id: sec.id,
    label: sec.label,
    icon: sec.icon,
    isDefault: true,
    topics: sec.items.map((topic) => ({
      id: topic.id,
      name: topic.name,
      desc: topic.desc,
      tag: topic.tag,
      isDefault: true,
      questions: topic.questions.map((q, idx) => ({
        id: `${topic.id}-q${idx}`,   // D-04: stable ID format
        text: q.q,
        level: q.level,
        isDefault: true,
      })),
    })),
  }));
}
```

**Sub-function: remapScoreKeys** (shared helper; called for both scores AND notes):
```typescript
// Re-keys "${topicId}-${n}" → "${topicId}-q${n}" (integer suffix only).
// custom-* keys do NOT match /-(\d+)$/ alone — they pass through unchanged.
function remapScoreKeys<T>(record: Record<string, T>): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const match = /^(.+)-(\d+)$/.exec(key);
    result[match ? `${match[1]}-q${match[2]}` : key] = value;
  }
  return result;
}
```

---

### `src/storage/migrations/fixtures/v3-session-fixture.ts` (NEW — fixture)

**Analog:** `src/storage/migrations/fixtures/v2-session-fixture.ts`

**Fixture pattern** (lines 1-76 of v2-session-fixture.ts — mirror the 3-fixture pattern exactly):
```typescript
import type { V3Session } from '../../types.js';

/**
 * Minimal V3Session — all Record fields empty; candidate null.
 * Verifies sections array is produced even with no scores.
 */
export const V3_SESSION_EMPTY: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'test-v3-session',
  scores: {},
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
});

/**
 * V3Session with real topic IDs so remapScoreKeys assertions use real key patterns.
 * 'twig-0' → 'twig-q0'; 'custom-twig-...' → passes through unchanged.
 */
export const V3_SESSION_POPULATED: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'populated-v3-session',
  scores: { 'twig-0': 8, 'twig-1': 6 },
  overrides: { twig: 7 },
  notes: { 'twig-0': 'Good answer', 'twig-1': '' },
  topicNotes: { twig: 'Overall solid' },
  customQuestions: [
    { id: 'custom-twig-1714000000000-0', topicId: 'twig', text: 'Custom Q', level: 'novice' },
  ],
  candidate: {
    name: 'Test Candidate',
    email: 'test@example.com',
    role: 'Engineer',
    date: '2026-06-18',
    interviewer: 'Interviewer',
    details: '',
  },
});

/**
 * V3Session with empty candidate — verifies candidate: null preserved.
 */
export const V3_SESSION_NULL_CANDIDATE: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'null-candidate-session',
  scores: { 'js-0': 5 },
  overrides: {},
  notes: {},
  topicNotes: {},
  customQuestions: [],
  candidate: null,
});
```

---

### `src/storage/migrations/v3-to-v4.test.ts` (NEW — test)

**Analog:** `src/storage/migrations/v2-to-v3.test.ts`

**Imports pattern** (lines 1-9 of v2-to-v3.test.ts):
```typescript
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { V4SessionSchema } from '../types.js';
import {
  V3_SESSION_EMPTY,
  V3_SESSION_NULL_CANDIDATE,
  V3_SESSION_POPULATED,
} from './fixtures/v3-session-fixture.js';
import { migrateV3ToV4 } from './v3-to-v4.js';
```

**Test structure pattern** — mirror the describe-block groupings from v2-to-v3.test.ts (lines 11-168). Required groups:
1. `migrateV3ToV4 — score key re-keying` — assert `twig-0` → `twig-q0`, `twig-1` → `twig-q1`
2. `migrateV3ToV4 — notes key re-keying` — same logic; notes map must also be re-keyed
3. `migrateV3ToV4 — overrides and topicNotes NOT re-keyed` — assert keys unchanged
4. `migrateV3ToV4 — sections materialization` — assert `sections.length > 0`, `isDefault: true`, stable ID format
5. `migrateV3ToV4 — customQuestions pass-through` — IDs, topicId, text, level unchanged
6. `migrateV3ToV4 — version and id` — version: 4, id preserved
7. `migrateV3ToV4 — candidate handling` — null preserved, populated preserved
8. `migrateV3ToV4 — immutability` — mirror lines 137-143 of v2-to-v3.test.ts (`JSON.stringify` before/after freeze check)
9. `V4SessionSchema — valibot validation` — mirror lines 145-168 of v2-to-v3.test.ts (safeParse succeeds; version:3 object rejected)

**Immutability test pattern** (lines 137-143 of v2-to-v3.test.ts — copy verbatim, change fixture name):
```typescript
describe('migrateV3ToV4 — immutability', () => {
  it('does not mutate the frozen input', () => {
    const before = JSON.stringify(V3_SESSION_POPULATED);
    migrateV3ToV4(V3_SESSION_POPULATED);
    expect(JSON.stringify(V3_SESSION_POPULATED)).toBe(before);
  });
});
```

**Schema validation test pattern** (lines 145-168 of v2-to-v3.test.ts):
```typescript
describe('V4SessionSchema — valibot validation', () => {
  it('validates a correct V4 object — parse succeeds', () => {
    const result = migrateV3ToV4(V3_SESSION_POPULATED);
    const parsed = v.safeParse(V4SessionSchema, result);
    expect(parsed.success).toBe(true);
  });

  it('rejects a version: 3 object — safeParse returns success: false', () => {
    const parsed = v.safeParse(V4SessionSchema, V3_SESSION_EMPTY);
    expect(parsed.success).toBe(false);
  });
});
```

---

### `src/storage/migrations/index.ts` (MODIFY — migration dispatcher)

**Current file:** `src/storage/migrations/index.ts` (lines 1-57 — read in full above)

**Change 1 — import** (after line 3):
```typescript
import { migrateV3ToV4 } from './v3-to-v4.js';
```

**Change 2 — MIGRATIONS array** (lines 10-16, extend the array):
```typescript
// Add as third entry:
{ fromVersion: 3, fn: (r) => migrateV3ToV4(r as V3Session) },
```

**Change 3 — runMigrations dispatch** (lines 37-47 — replace the version===3 early-return):
```typescript
// REMOVE this block (lines 44-47):
// if (version === 3) {
//   // Already at latest version — caller handles hydration.
//   return null;
// }

// ADD in its place:
if (version === 3) {
  const entry = MIGRATIONS.find((m) => m.fromVersion === 3);
  if (entry) return entry.fn(raw) as V4Session;
  return null;
}

if (version === 4) {
  // Already at latest version — caller handles hydration.
  return null;
}
```

**Return type signature** (line 28 — update union):
```typescript
export function runMigrations(
  raw: unknown,
): { manifest: V2Manifest; session: V2Session } | V3Session | V4Session | null {
```

---

### `src/storage/types.ts` (MODIFY — model/schema)

**Analog sections to mirror:** `V3SessionSchema` at lines 132-141; `createDefaultV3Session` at lines 195-206.

**V4 schema additions** (insert after line 141, the end of V3SessionSchema):
```typescript
// ---------------------------------------------------------------------------
// valibot schemas for V4 types
// ---------------------------------------------------------------------------

export const V4QuestionSchema = v.object({
  id: v.string(),
  text: v.string(),
  level: v.union([
    v.literal('novice'),
    v.literal('intermediate'),
    v.literal('advanced'),
    v.literal('expert'),
  ]),
  isDefault: v.boolean(),
});

export const V4TopicSchema = v.object({
  id: v.string(),
  name: v.string(),
  desc: v.string(),
  tag: v.string(),
  isDefault: v.boolean(),
  questions: v.array(V4QuestionSchema),
});

export const V4SectionSchema = v.object({
  id: v.string(),
  label: v.string(),
  icon: v.string(),
  isDefault: v.boolean(),
  topics: v.array(V4TopicSchema),
});

export const V4SessionSchema = v.object({
  version: v.literal(4),
  id: v.string(),
  sections: v.array(V4SectionSchema),
  scores: v.record(v.string(), v.nullable(v.number())),
  overrides: v.record(v.string(), v.nullable(v.number())),
  notes: v.record(v.string(), v.string()),
  topicNotes: v.record(v.string(), v.string()),
  customQuestions: v.array(CustomQuestionSchema),  // reuse existing
  candidate: v.nullable(CandidateDetailsSchema),   // reuse existing
});
```

**TypeScript type exports** (insert after line 153 `export type V3Session = ...`):
```typescript
export type V4Question = v.InferOutput<typeof V4QuestionSchema>;
export type V4Topic = v.InferOutput<typeof V4TopicSchema>;
export type V4Section = v.InferOutput<typeof V4SectionSchema>;
export type V4Session = v.InferOutput<typeof V4SessionSchema>;
```

**Factory function** (mirror createDefaultV3Session at lines 195-206):
```typescript
export function createDefaultV4Session(id: string): V4Session {
  return {
    version: 4,
    id,
    sections: [],   // populated at migration time; empty for brand-new sessions
    scores: {},
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  };
}
```

---

### `src/storage/bootstrap.ts` (MODIFY — service, batch)

**Current session-loop pattern** (lines 126-141 of bootstrap.ts — the V3/V2 fallback block to replace):
```typescript
// EXISTING (lines 126-141) — replace the inner session loop body:
const sessions: Record<string, V2Session> = {};
for (const s of manifest.sessions) {
  const key = `session:${s.id}`;
  const rawSession = sessionData[key];
  const v3Result = v.safeParse(V3SessionSchema, rawSession);
  if (v3Result.success) {
    sessions[s.id] = v3Result.output as unknown as V2Session;
  } else {
    const v2Result = v.safeParse(V2SessionSchema, rawSession);
    sessions[s.id] = v2Result.success
      ? v2Result.output
      : createDefaultSession(s.id);
  }
}
```

**New V4 migration loop pattern** (replaces lines 126-141; mirrors the skip-and-continue shape):
```typescript
// NEW — type changes: sessions is Record<string, V4Session>, failedSessionIds is string[]
const sessions: Record<string, V4Session> = {};
const failedSessionIds: string[] = [];

for (const s of manifest.sessions) {
  const key = `session:${s.id}`;
  const rawSession = sessionData[key];

  // Already V4 — pass through without re-migration (Pitfall 3 guard)
  const v4Result = v.safeParse(V4SessionSchema, rawSession);
  if (v4Result.success) {
    sessions[s.id] = v4Result.output;
    continue;
  }

  // V3 found — write pre-v4 snapshot (direct set, NOT adapter.snapshot — Pitfall 5)
  const v3Result = v.safeParse(V3SessionSchema, rawSession);
  if (v3Result.success) {
    await chrome.storage.local.set({
      [`snapshot:${s.id}:pre-v4-${Date.now()}`]: rawSession,
    });
    try {
      const v4 = migrateV3ToV4(v3Result.output);
      const validV4 = v.safeParse(V4SessionSchema, v4);
      if (validV4.success) {
        await chrome.storage.local.set({ [key]: v4 });
        sessions[s.id] = validV4.output;
      } else {
        console.error('[bootstrap] V4 validation failed for session:', s.id, validV4.issues);
        failedSessionIds.push(s.id);
      }
    } catch (err) {
      console.error('[bootstrap] migrateV3ToV4 threw for session:', s.id, err);
      failedSessionIds.push(s.id);
    }
    continue;
  }

  // V2 fallback (should not occur post-v1.1 but keep for defense-in-depth)
  const v2Result = v.safeParse(V2SessionSchema, rawSession);
  if (v2Result.success) {
    // Migrate v2 → v3 → v4 via runMigrations
    sessions[s.id] = createDefaultV4Session(s.id);
    continue;
  }

  // Corrupt/unknown — use default; do NOT push to failedSessionIds (no V3 to preserve)
  sessions[s.id] = createDefaultV4Session(s.id);
}

return { manifest, sessions, failedSessionIds };
```

**Return type update** (line 45-48 of bootstrap.ts):
```typescript
export async function bootstrap(): Promise<{
  manifest: V2Manifest;
  sessions: Record<string, V4Session>;
  failedSessionIds: string[];
}> {
```

---

### `src/store/app.ts` (MODIFY — store, CRUD)

**Subscribe block — session persistence** (lines 617-632 of app.ts — change version:3 to version:4 and add sections):
```typescript
// EXISTING (lines 619-632):
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

// NEW:
storageAdapter.write({
  [`session:${state.activeSessionId}`]: {
    version: 4,
    id: state.activeSessionId,
    sections: state.sections,   // new V4 field
    scores: state.scores,
    overrides: state.overrides,
    notes: state.notes,
    topicNotes: state.topicNotes,
    customQuestions: state.customQuestions,
    candidate: state.candidate,
  },
});
```

**AppState interface additions** — add `sections: V4Section[]` alongside the existing scoring fields in the AppState type definition. Also add `migrationFailedCount: number` and `migrationFailedIds: string[]` for the banner.

**switchSession hydration** (line 338+ of app.ts — add sections alongside existing score fields):
```typescript
// After existing score fields in switchSession setState call:
sections: session?.sections ?? [],
```

---

### `src/app/main.tsx` (MODIFY — entrypoint, request-response)

**Bootstrap hydration pattern** (lines 17-61 of main.tsx — the session hydration block to extend):
```typescript
// EXISTING (line 18):
const initialState = await bootstrap();

// ADD after line 43 (manifest hydration):
// Store failed migration info for banner rendering
useAppStore.setState({
  migrationFailedCount: initialState.failedSessionIds.length,
  migrationFailedIds: initialState.failedSessionIds,
});
```

**Session hydration update** (lines 48-60 — cast to V4Session and add sections):
```typescript
// EXISTING type cast (line 48-50):
const session = sessionRaw[`session:${activeSessionId}`] as
  | V3Session
  | undefined;

// NEW (change type cast and add sections to setState):
const session = sessionRaw[`session:${activeSessionId}`] as
  | V4Session
  | undefined;
if (session) {
  useAppStore.setState({
    sections: session.sections ?? [],   // new V4 field
    scores: session.scores ?? {},
    overrides: session.overrides ?? {},
    notes: session.notes ?? {},
    topicNotes: session.topicNotes ?? {},
    customQuestions: session.customQuestions ?? [],
    candidate: session.candidate ?? null,
  });
}
```

---

### `src/components/MigrationErrorBanner.tsx` (NEW — component, event-driven)

**Analog:** `src/components/UpdateBanner.tsx`

**Structural pattern** (mirror UpdateBanner.tsx lines 99-127 — same sticky amber div, same dismiss button shape):
```typescript
interface Props {
  failedCount: number;
  sessionIds: string[];
  onDismiss: () => void;
}

export function MigrationErrorBanner({ failedCount, sessionIds, onDismiss }: Props) {
  if (failedCount === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      // Exact same Tailwind classes as UpdateBanner lines 104-106:
      className="sticky top-0 z-30 flex items-center justify-between bg-amber-50 dark:bg-yellow-900/30 border-b border-amber-300 dark:border-yellow-700 text-amber-800 dark:text-yellow-200 px-4 py-2 text-base font-normal print:hidden"
    >
      <span>
        {failedCount} session{failedCount > 1 ? 's' : ''} couldn't be upgraded —
        your other sessions are loaded. A backup is stored at{' '}
        <code>snapshot:&lt;id&gt;:pre-v4</code>.
      </span>
      <button
        type="button"
        aria-label="Dismiss migration error"
        onClick={onDismiss}
        // Exact same Tailwind classes as UpdateBanner dismiss button lines 117-120:
        className="text-amber-700 dark:text-yellow-300 hover:text-amber-900 dark:hover:text-yellow-100 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0 ml-3"
      >
        ×
      </button>
    </div>
  );
}
```

**Mount location in App.tsx** — mirror UpdateBanner placement (App.tsx uses UpdateBanner as the first sticky element in the right-column div). MigrationErrorBanner should appear immediately above or below UpdateBanner, reading `migrationFailedCount` and `migrationFailedIds` from AppState.

---

### `src/utils/yamlImport.ts` (MODIFY — utility, transform)

**Call site that needs the V4 feed:** The YAML import path does NOT change the parsers themselves. The re-keying of score/note keys (V3 format `${topicId}-N` → V4 format `${topicId}-qN`) must happen at `ActionsGroup.tsx` after `parseLegacy()` or `parseStructural()` returns.

**Pattern for the re-key helper** (add to yamlImport.ts as an exported utility, reusing the same regex from migrateV3ToV4):
```typescript
/**
 * Re-keys an ImportResult's scores and notes from V3 format (${topicId}-N)
 * to V4 format (${topicId}-qN). Called by ActionsGroup after parseLegacy /
 * parseStructural. Does NOT modify the parsers — they remain V3-key-based.
 * custom-* keys pass through unchanged (regex only matches /-(\d+)$/).
 */
export function reKeyImportResultToV4(result: ImportResult): ImportResult {
  function remap<T>(record: Record<string, T>): Record<string, T> {
    const out: Record<string, T> = {};
    for (const [key, value] of Object.entries(record)) {
      const match = /^(.+)-(\d+)$/.exec(key);
      out[match ? `${match[1]}-q${match[2]}` : key] = value;
    }
    return out;
  }
  return {
    ...result,
    scores: remap(result.scores),
    notes: remap(result.notes),
    // overrides: topicId-keyed — no re-key
    // topicNotes: topicId-keyed — no re-key
    // customQuestions: custom-* IDs — pass through (already unaffected by remap)
  };
}
```

**ActionsGroup.tsx call-site change** — after building `preview` from `parseLegacy` / `parseStructural`, apply the re-key before setting import preview state:
```typescript
// After existing (RESEARCH.md Pattern 4 lines 305-312):
const v4Result = reKeyImportResultToV4(preview.result);
setImportPreview({ ...preview, result: v4Result });
```

---

## Shared Patterns

### Valibot Schema Validation
**Source:** `src/storage/types.ts` lines 57-76, 132-141
**Apply to:** `src/storage/migrations/index.ts`, `src/storage/bootstrap.ts`
```typescript
// Pattern: always use safeParse (never parse) — returns typed output on success
const result = v.safeParse(V4SessionSchema, rawSession);
if (result.success) {
  // result.output is typed V4Session
} else {
  // result.issues contains valibot errors
}
```

### Pure-Function Migration Contract
**Source:** `src/storage/migrations/v2-to-v3.ts` lines 22-33
**Apply to:** `src/storage/migrations/v3-to-v4.ts`
- Parameter is `Readonly<PrevVersion>` — TypeScript prevents mutations
- No try/catch — errors bubble to bootstrap's catch block
- No I/O, no side-effects — pure data transform
- Immutability verified by `Object.freeze` fixtures in tests

### chrome.storage.local Direct Write (bypass adapter rotation)
**Source:** `src/storage/bootstrap.ts` line 25 — `chrome.storage.local.set({...})`
**Apply to:** Pre-v4 snapshot in `bootstrap.ts` migration loop
```typescript
// Write directly — NOT storageAdapter.write() and NOT adapter.snapshot()
// adapter.snapshot() calls #trimSnapshots() which deletes older entries
await chrome.storage.local.set({
  [`snapshot:${sessionId}:pre-v4-${Date.now()}`]: rawV3Session,
});
```

### Sticky Amber Banner (non-blocking dismiss)
**Source:** `src/components/UpdateBanner.tsx` lines 99-127
**Apply to:** `src/components/MigrationErrorBanner.tsx`
- `role="status"` + `aria-live="polite"` + `aria-atomic="true"`
- `sticky top-0 z-30` — same stacking as UpdateBanner
- `print:hidden` — suppress in print
- Dismiss button uses `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`
- `if (!show) return null` guard at top

### Error Logging in bootstrap
**Source:** `src/storage/bootstrap.ts` lines 90-98
**Apply to:** Migration failure paths in the per-session loop
```typescript
console.error('[bootstrap] descriptive message:', err);
await chrome.storage.local.set({
  [`recovery:${Date.now()}`]: rawManifest,
});
```

---

## No Analog Found

All files have clear codebase analogs. No entries needed here.

---

## Metadata

**Analog search scope:** `src/storage/`, `src/components/`, `src/store/`, `src/app/`, `src/utils/`
**Files scanned:** 12 source files read directly; bootstrap.test.ts and v2-to-v3.test.ts as test templates
**Pattern extraction date:** 2026-06-18
