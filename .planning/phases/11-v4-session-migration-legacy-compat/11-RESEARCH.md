# Phase 11: V4 Session Migration & Legacy Compat - Research

**Researched:** 2026-06-18
**Domain:** Chrome Extension storage migration — schema versioning, data transformation, legacy YAML import compat
**Confidence:** HIGH (all claims grounded in direct codebase inspection)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Full materialization.** On migration, each session deep-copies `DEFAULT_SECTIONS` (sections, topics, AND questions) into `session.sections[]`. Sessions become self-contained — the bundled bank is read only at materialization time.
- **D-02: `isDefault: boolean` flag on every entity** (Section, Topic, Question). Set `true` at migration; user-added entities get `false`. Phase 14 will gate the "remove section/topic" affordance on `!isDefault`.
- **D-03: Scores / overrides / notes stay as sparse `Record<string, ...>` maps at session root**, preserving the V3 update pattern. Re-keyed to the new stable IDs during migration.
- **D-04: Default-question stable ID format = `${topicId}-q${originalBankIndex}`.** Score keys migrate `${topicId}-${idx}` → `${topicId}-q${idx}` 1:1. The `q` prefix cleanly separates from `custom-${topicId}-${seq}`. Existing custom-question IDs are NOT rewritten.
- **D-05: Per-session pre-migration snapshot.** Before each V3→V4 migration, write `snapshot:<sessionId>:pre-v4-<ts>`. Bypasses the 3-snapshot rotation. Keep indefinitely in v1.1.
- **D-06: Skip-and-continue on per-session failure.** Leave V3 payload untouched, exclude from active manifest list, show non-blocking banner: *"N sessions couldn't be upgraded — your other sessions are loaded. A backup is stored at snapshot:<id>:pre-v4."*
- **D-07: Eager migration at bootstrap.** `runMigrations()` walks every session in the manifest on first v1.1 load. After bootstrap, no V3 sessions in active storage.
- **D-08: YAML imports build a V3 intermediate, then run V3→V4 migration.** Both `parseLegacy()` and `parseStructural()` continue to produce a V3-shaped object; feed it through `migrateV3ToV4()` before returning to caller.
- **D-09: Imported YAML does NOT get a pre-v4 snapshot.** Source file is on disk — no snapshot needed.

### Claude's Discretion

- Snapshot purge policy beyond v1.1 (D-05). Leave indefinite for now.
- Exact wording / placement of the failure banner (D-06).
- Whether to use a nested or flat representation for materialized sections internally (mirror current `DEFAULT_SECTIONS` nested shape: `Section { topics: Topic[] { questions: Question[] } }`).
- Whether to bump the `manifest` schema (currently `version: 2`). If no manifest-shape change is needed, leave it.
- Exact valibot schema layout — field-level structure is mechanical.

### Deferred Ideas (OUT OF SCOPE)

- Snapshot purge policy — keep `snapshot:*:pre-v4-*` indefinitely in v1.1.
- YAML export schema changes — Phase 14 (YAML-04, YAML-05, YAML-06).
- Manifest schema bump — only if Phase 14 needs new manifest-level fields.
- Reset-to-bank affordance — v1.2+.
- Cross-session bank sharing — v2 design conversation.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | V3 → V4 session migration applies on load to materialize default sections/topics into the user-editable bank shape; V3 sessions hydrate without data loss; legacy progress-only YAML imports still work | migrateV3ToV4() module + runMigrations() extension + bootstrap.ts refactor + parseLegacy pass-through |
| DATA-02 | Importing a v1.0-era full-structural YAML export (V3 schema) into v1.1 produces an equivalent V4 session with no loss of scores, notes, candidate details, or custom questions | parseStructural() V3-intermediate feed through migrateV3ToV4() + ID re-keying logic |
</phase_requirements>

---

## Summary

Phase 11 introduces V4 as the new canonical session format. The V3 format stores scores under integer-indexed keys (`${topicId}-${idx}`) and has no materialized section/topic tree. V4 adds a `sections` array that deep-copies `DEFAULT_SECTIONS` into the session at migration time, giving each section, topic, and default question a stable string ID (`${topicId}-q${idx}`) and an `isDefault: true` flag. Score keys are re-keyed 1:1 from the old integer-suffix format to the new `q`-prefixed format.

The migration architecture is already well-established: a `MIGRATIONS` array in `src/storage/migrations/index.ts` dispatches by `fromVersion`. Adding `{ fromVersion: 3, fn: migrateV3ToV4 }` is the only routing change needed. The new `migrateV3ToV4()` function follows the same pure-function, no-side-effects contract as `migrateV2ToV3()`. The bootstrap loop must be refactored from the current "return early if V3" path to instead run each session through the migration pipeline and write the V4 result back.

YAML import compat requires a small change to the `ActionsGroup` YAML import flow: after `parseLegacy()` or `parseStructural()` returns an `ImportResult` (which is structurally equivalent to a V3 session payload), the caller feeds that through `migrateV3ToV4()` to produce V4-shaped data before passing to `importSession()`. No changes to the parsers themselves are needed — they already produce correct V3-shape output.

**Primary recommendation:** Build `migrateV3ToV4()` as a pure function in `src/storage/migrations/v3-to-v4.ts`, extend `runMigrations()` with a `fromVersion: 3` entry, refactor `bootstrap.ts` to run per-session migrations eagerly with the pre-v4 snapshot gate and skip-and-continue failure path, update the store's subscribe-block writer and `createSession`/`switchSession`/`importSession` to use V4 types, and add the V3→V4 feed in `ActionsGroup` YAML import.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| V3→V4 schema transformation | Storage / Migration | — | Pure data transform; no UI/React involved |
| Pre-migration snapshot | Storage / Adapter | — | Adapter already owns snapshot writing; extend key pattern |
| Eager migration at bootstrap | Storage / Bootstrap | — | Bootstrap is the only place that reads all sessions before app mounts |
| Skip-and-continue failure banner | Frontend / React component | Storage / Bootstrap | Bootstrap produces the failed-session list; React renders the non-blocking banner |
| YAML import → V4 feed | Frontend / ActionsGroup | Storage / Migration | ActionsGroup is the call site; migrateV3ToV4 is the transform |
| V4 schema validation (valibot) | Storage / Types | — | Existing pattern: valibot schema in types.ts, safeParse in bootstrap |
| Store type updates (V3→V4) | Frontend / Store | — | store/app.ts imports V3Session; must import V4Session instead |

---

## Standard Stack

### Core (no new dependencies — all work is within the existing stack)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| valibot | 1.4.1 [VERIFIED: npm registry] | Runtime schema validation for V4SessionSchema | Already used for V2SessionSchema and V3SessionSchema; `v.object()`, `v.array()`, `v.literal()` cover all V4 fields |
| TypeScript | ~6.0 [VERIFIED: package.json] | Type definitions for V4Session, V4Section, V4Topic, V4Question | Existing project constraint |
| vitest | 4.1.9 [VERIFIED: package.json] | Unit and integration tests for migrateV3ToV4 | Existing test framework |
| vitest-chrome | 0.1.0 [VERIFIED: package.json] | Mock chrome.storage.local in bootstrap.test.ts extensions | Existing pattern in bootstrap.test.ts |

**No new packages required.** This phase is entirely internal schema work. All libraries are already installed.

---

## Package Legitimacy Audit

> No new packages are installed in this phase. All work uses the existing project stack.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
                  ┌─────────────────────────────────────┐
                  │  chrome.storage.local                │
                  │  session:id  →  {version: 3, ...}   │
                  └───────────────┬─────────────────────┘
                                  │ read (bootstrap)
                                  ▼
                  ┌─────────────────────────────────────┐
                  │  bootstrap.ts                        │
                  │  for each session in manifest:       │
                  │    1. read raw session blob          │
                  │    2. write snapshot:id:pre-v4-ts   │◄── adapter.snapshot (custom key)
                  │    3. runMigrations(raw) → V4        │
                  │    4. v.safeParse(V4SessionSchema)   │
                  │    5a. success → write V4 back       │
                  │    5b. failure → skip + collect err  │
                  └───────────────┬─────────────────────┘
                                  │ V4 sessions
                                  ▼
                  ┌─────────────────────────────────────┐
                  │  main.tsx hydration                  │
                  │  useAppStore.setState(V4 fields)     │
                  │  [+ failed-session banner prop]      │
                  └───────────────┬─────────────────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                         │
          ▼                       ▼                         ▼
  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
  │  Normal flow │     │  YAML import     │     │  MigrationErrBanner  │
  │  store reads │     │  ActionsGroup:   │     │  (non-blocking)      │
  │  session.    │     │  parseLegacy /   │     │  rendered from       │
  │  sections[]  │     │  parseStructural │     │  bootstrap result    │
  └──────────────┘     │  → migrateV3ToV4│     └──────────────────────┘
                       │  → importSession │
                       └──────────────────┘
```

### Recommended Project Structure (additions only)

```
src/storage/
├── types.ts                    # ADD: V4SessionSchema, V4Session type,
│                               #      V4Section/V4Topic/V4Question schemas,
│                               #      createDefaultV4Session()
├── bootstrap.ts                # MODIFY: eager per-session V3→V4 migration loop
├── migrations/
│   ├── index.ts                # MODIFY: add { fromVersion: 3, fn: migrateV3ToV4 }
│   ├── v3-to-v4.ts             # NEW: migrateV3ToV4() pure function
│   ├── v3-to-v4.test.ts        # NEW: unit tests mirroring v2-to-v3.test.ts
│   └── fixtures/
│       └── v3-session-fixture.ts  # NEW: frozen V3Session fixtures
src/store/
├── app.ts                      # MODIFY: V3Session → V4Session types throughout,
│                               #         subscribe block writes version:4 + sections
src/app/
├── main.tsx                    # MODIFY: pass failed-session count to banner
src/components/
├── MigrationErrorBanner.tsx    # NEW: non-blocking banner for failed sessions
src/utils/
├── yamlImport.ts               # MODIFY: feed ImportResult through migrateV3ToV4
```

### Pattern 1: migrateV3ToV4() — Pure Function

**What:** Takes a readonly V3Session, returns a V4Session with materialized sections.
**When to use:** Called by `runMigrations()` for stored sessions; called directly after `parseLegacy()`/`parseStructural()` for YAML imports.

```typescript
// Mirrors migrateV2ToV3 contract: pure, no I/O, no try/catch, Readonly<> parameter
// Source: src/storage/migrations/v2-to-v3.ts (direct template)
export function migrateV3ToV4(session: Readonly<V3Session>): V4Session {
  const sections = materializeSections(DEFAULT_SECTIONS);
  const remappedScores = remapScoreKeys(session.scores);
  const remappedNotes = remapScoreKeys(session.notes);

  return {
    version: 4,
    id: session.id,
    sections,
    scores: remappedScores,
    overrides: session.overrides,
    notes: remappedNotes,
    topicNotes: session.topicNotes,
    customQuestions: session.customQuestions,
    candidate: session.candidate,
  };
}
```

**Key sub-functions:**

```typescript
// materializeSections: deep-copy DEFAULT_SECTIONS, add isDefault:true + stable IDs
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
        id: `${topic.id}-q${idx}`,     // D-04 stable ID format
        text: q.q,
        level: q.level,
        isDefault: true,
      })),
    })),
  }));
}

// remapScoreKeys: ${topicId}-${n} → ${topicId}-q${n}
// Only re-keys integer-indexed default-question keys; custom-* keys pass through unchanged
function remapScoreKeys(
  record: Record<string, number | null> | Record<string, string>,
): Record<string, typeof record[string]> {
  // Pattern: "someId-3" → "someId-q3" (matches /-(\d+)$/ at end of key)
  // "custom-topicId-ts-idx" does NOT match → passes through unchanged
  const result: typeof record = {};
  for (const [key, value] of Object.entries(record)) {
    const match = /^(.+)-(\d+)$/.exec(key);
    result[match ? `${match[1]}-q${match[2]}` : key] = value;
  }
  return result;
}
```

### Pattern 2: Per-Session Snapshot with Custom Key (bypass rotation)

**What:** Write `snapshot:<sessionId>:pre-v4-<ts>` directly via `chrome.storage.local.set`, bypassing `adapter.snapshot()` which trims to 3. This preserves the original V3 even after subsequent auto-snapshots rotate.

```typescript
// In bootstrap.ts, before calling runMigrations():
// adapter.snapshot() reads session:id and writes under snapshot:id:timestamp (with trimming).
// For the pre-v4 snapshot we write directly to avoid the 3-snapshot trim.
const snapshotKey = `snapshot:${sessionId}:pre-v4-${Date.now()}`;
await chrome.storage.local.set({ [snapshotKey]: rawV3Session });
// Then proceed with migration
```

**Why bypass the adapter:** `adapter.snapshot()` calls `#trimSnapshots()` which removes older snapshots, so the pre-v4 backup would be lost after 3 subsequent auto-snapshots. The direct write skips rotation entirely per D-05.

### Pattern 3: Bootstrap Loop — Eager Per-Session Migration

**What:** `bootstrap.ts` currently returns early for V3 sessions (line 44-47 in `migrations/index.ts`: `if (version === 3) return null`). V4 requires bootstrap to instead detect V3 sessions and migrate them all before handing state to main.tsx.

**Current flow (V3 passthrough, lines 129-141 in bootstrap.ts):**
```typescript
// Existing: V3 session found → no migration, just return it
const v3Result = v.safeParse(V3SessionSchema, rawSession);
if (v3Result.success) {
  sessions[s.id] = v3Result.output as unknown as V2Session; // returned as-is
}
```

**New V4 flow (per-session migration):**
```typescript
// After adding V4SessionSchema to types.ts:
const v4Result = v.safeParse(V4SessionSchema, rawSession);
if (v4Result.success) {
  // Already V4 (post-migration re-load) — use directly
  sessions[s.id] = v4Result.output;
  continue;
}

const v3Result = v.safeParse(V3SessionSchema, rawSession);
if (v3Result.success) {
  // V3 found → write pre-v4 snapshot, then migrate
  await chrome.storage.local.set({
    [`snapshot:${s.id}:pre-v4-${Date.now()}`]: rawSession,
  });
  try {
    const v4 = migrateV3ToV4(v3Result.output);
    const validV4 = v.safeParse(V4SessionSchema, v4);
    if (validV4.success) {
      await chrome.storage.local.set({ [`session:${s.id}`]: v4 });
      sessions[s.id] = validV4.output;
    } else {
      failedSessionIds.push(s.id);
    }
  } catch {
    failedSessionIds.push(s.id);
  }
  continue;
}
// Unknown/corrupt session → default
sessions[s.id] = createDefaultV4Session(s.id);
```

**Bootstrap return type change:** `bootstrap()` must return `failedSessionIds: string[]` alongside `manifest` and `sessions` so `main.tsx` can conditionally render `<MigrationErrorBanner>`.

### Pattern 4: YAML Import → V4 Feed

**What:** `ActionsGroup.tsx` currently calls `parseLegacy()` / `parseStructural()` which return `ImportPreview` (containing `result: ImportResult`). The `ImportResult` shape is a flat V3-equivalent payload. After this phase, feed the `result` through `migrateV3ToV4()` before passing to `importSession()`.

**Current call site (ActionsGroup.tsx lines 115-121):**
```typescript
const format = detectFormat(parsed.value);
const preview =
  format === 'structural'
    ? parseStructural(parsed.value, DEFAULT_SECTIONS)
    : format === 'legacy'
      ? parseLegacy(parsed.value, DEFAULT_SECTIONS)
      : null;
```

**After Phase 11 — two options (planner chooses):**

Option A: Convert in `ActionsGroup` — call `migrateV3ToV4()` on the `ImportResult` before `setImportPreview`:
```typescript
// After building preview, convert ImportResult to V4 shape:
const v4Result = applyV4MigrationToImport(preview.result); // new helper
setImportPreview({ ...preview, result: v4Result });
```

Option B: Convert in `parseLegacy`/`parseStructural` return path — both functions call `migrateV3ToV4()` internally and return a V4-shaped `ImportResult`.

**Recommendation:** Option A (convert in ActionsGroup). Keeps the parsers as dumb V3-intermediate builders and isolates the V4 concern to the call site. The planner should add a small `applyV4MigrationToImport(r: ImportResult): ImportResult` utility that re-keys score/note maps using the same `remapScoreKeys()` logic from `migrateV3ToV4()`.

Note: `ImportResult` does NOT contain a `sections` array — it is a flat score/note/customQuestion delta, not a full session. The V4 `sections` array is always produced from `DEFAULT_SECTIONS` at migration time, so there is nothing to carry through from the YAML. The "V4 feed" for imports is exclusively the score key re-mapping (`${topicId}-N` → `${topicId}-qN`) and nothing else structurally.

### Pattern 5: V4Session valibot Schema

**What:** Mirrors the V3SessionSchema shape with three additions: `version: v.literal(4)`, `sections: v.array(V4SectionSchema)`, and `isDefault` flags on section/topic/question.

```typescript
// In src/storage/types.ts — following existing schema layout
export const V4QuestionSchema = v.object({
  id: v.string(),       // "${topicId}-q${idx}" for defaults; custom-* for user-added
  text: v.string(),
  level: v.union([v.literal('novice'), v.literal('intermediate'), v.literal('advanced'), v.literal('expert')]),
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

### Pattern 6: Store Subscribe Block — Write V4 Shape

**What:** The Zustand subscribe block at the bottom of `store/app.ts` currently hardcodes `version: 3`. After this phase it must write `version: 4` plus the `sections` array.

**Critical:** After V4 migration, the store reads `sections` from the active session (not from `DEFAULT_SECTIONS`). The subscribe block must serialize the store's `sections` field into `session:id`.

**New session persistence shape in subscribe block:**
```typescript
storageAdapter.write({
  [`session:${state.activeSessionId}`]: {
    version: 4,
    id: state.activeSessionId,
    sections: state.sections,   // new V4 field in AppState
    scores: state.scores,
    overrides: state.overrides,
    notes: state.notes,
    topicNotes: state.topicNotes,
    customQuestions: state.customQuestions,
    candidate: state.candidate,
  },
});
```

**Corresponding AppState additions:**
```typescript
// In AppState interface:
sections: V4Section[];           // replaces DEFAULT_SECTIONS for rendering

// In DEFAULT_STATE:
sections: [],                    // populated at bootstrap hydration

// In switchSession:
sections: session?.sections ?? [],
```

### Anti-Patterns to Avoid

- **Mutating the input in migrateV3ToV4:** The function receives `Readonly<V3Session>`. Never write to `session.scores`, spread and rebuild instead. Mirrors `migrateV2ToV3` immutability contract.
- **Calling adapter.snapshot() for the pre-v4 snapshot:** `adapter.snapshot()` trims to 3 — this would overwrite the pre-v4 backup after 3 subsequent auto-snapshots. Use `chrome.storage.local.set()` directly.
- **Using index-based score keys post-V4:** After migration all default-question score keys use the `q` prefix. Any new code that builds score keys must use `${topicId}-q${idx}`, not `${topicId}-${idx}`. The old format only lives in pre-migration V3 storage.
- **Re-running migrateV3ToV4 on already-V4 sessions:** Bootstrap must check `version === 4` first and skip migration. The `MIGRATIONS` array already returns `null` when `version === 4` (after adding the check), so bootstrap must guard on the returned null before attempting writes.
- **Forgetting the `notes` key re-map:** The `notes` record uses the same `${topicId}-${idx}` key format as `scores`. Both must be re-keyed. (Per D-03: scores, notes — both are sparse maps keyed by question ID.)
- **Dropping `customQuestions` from the V4 session in the store subscribe block:** The subscribe block builds the session payload manually; forgetting `sections` or any field produces a corrupt write. Verify all V4SessionSchema fields appear in the write object.
- **Passing DEFAULT_SECTIONS to parseLegacy/parseStructural inside the YAML import after Phase 11:** The ID-matching logic in those parsers uses `${topicId}-${idx}` keys to populate `result.scores`. These are V3-format keys. After migrateV3ToV4 re-keys them, downstream code must not also try to look them up by old keys. The re-keying happens AFTER parsing, so the parsers themselves remain V3-key-based — this is intentional and correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation of V4 sessions | Manual field-by-field checks | `v.safeParse(V4SessionSchema, raw)` | valibot already handles all edge cases; safeParse returns typed output |
| Deep copy of DEFAULT_SECTIONS | `JSON.parse(JSON.stringify(...))` | Explicit map/spread | `DEFAULT_SECTIONS` is `readonly`; JSON round-trip loses the type; explicit construction is type-safe and ~10x faster |
| Score key re-mapping | Complex regex library | Simple inline regex `/^(.+)-(\d+)$/` | One pattern; already well-understood in this codebase |
| Migration dispatch | Custom version routing | Extend existing `MIGRATIONS` array in `migrations/index.ts` | The array already routes V1→V2 and V2→V3; appending one entry is zero boilerplate |

**Key insight:** Every pattern needed for this phase already exists in the codebase. The migration framework, valibot schemas, snapshot API, and test structure are all proven. This phase is a composition of existing patterns, not new architecture.

---

## Common Pitfalls

### Pitfall 1: Score Key Re-keying Leaves Notes Behind

**What goes wrong:** `migrateV3ToV4()` re-keys `session.scores` correctly but forgets to re-key `session.notes`. Post-migration, question notes are unreachable because the store reads notes by the new `q`-prefixed key but notes are still stored under the old `${topicId}-${idx}` key.

**Why it happens:** D-03 says "scores/overrides/notes stay as sparse maps." The decision mentions scores and overrides prominently; notes are the third map using the same key format and are easy to overlook.

**How to avoid:** `remapScoreKeys()` should be a shared sub-function called for both `session.scores` and `session.notes`. `session.overrides` uses topicId keys (not question-index keys) and does NOT need re-keying. `session.topicNotes` also uses topicId keys — no re-keying needed.

**Warning signs:** Unit test with a populated V3 fixture that has both scores and notes for the same question should verify the post-migration note is accessible by `${topicId}-q0`, not `${topicId}-0`.

### Pitfall 2: Bootstrap Returns Failed Sessions in the Active Manifest

**What goes wrong:** If a session fails V3→V4 migration and the bootstrap code still includes that session ID in the returned `sessions` map (as a default fallback), the UI loads a blank session instead of omitting it. The user's data appears to be gone.

**Why it happens:** The existing `createDefaultSession(s.id)` fallback in the session-load loop is a safe catch-all in V1/V2. In V4 migration context, providing a default for a failed migration silently overwrites the V3 data if the subscribe block subsequently writes a V4 session under the same key.

**How to avoid:** Failed sessions must be EXCLUDED from the returned `sessions` map entirely. Return only successfully migrated sessions. Record failed IDs in `failedSessionIds[]` and strip them from the active manifest sessions list before returning (or mark them inactive without removing from manifest metadata). Do NOT write a default V4 session for a session that failed migration — the V3 blob must remain in storage as the only source of truth until the user acts.

**Warning signs:** Bootstrap test with a session that fails valibot V4 validation after migration should verify: (a) the session key in storage is still the original V3 blob, and (b) `failedSessionIds` contains that session ID.

### Pitfall 3: Double Migration on Second Load

**What goes wrong:** `runMigrations()` currently returns `null` for version 3, signaling "already current." After Phase 11, version 3 should trigger migration. But after migration, the session is version 4. On second bootstrap, version 4 must return null (skip). If the version-4 guard is missing, bootstrap attempts to call the V3→V4 migration on a V4 session, which fails validation.

**Why it happens:** The `MIGRATIONS` array dispatch in `index.ts` currently has a `version === 3 → return null` branch. When adding `fromVersion: 3`, the `version === 3` early-return must be removed and replaced with routing through the migration entry.

**How to avoid:** After adding `fromVersion: 3` to MIGRATIONS, the `if (version === 3) { return null; }` block in `runMigrations()` must be deleted. A new `if (version === 4) { return null; }` guard replaces it. The bootstrap outer loop validates V4 first (passes V4SessionSchema → skip migration) before checking V3.

**Warning signs:** Integration test loading a V4 session on second bootstrap should confirm no writes occur and `failedSessionIds` is empty.

### Pitfall 4: parseLegacy Produces V3 Keys That Break After YAML Import

**What goes wrong:** `parseLegacy()` builds `result.scores` using the V3-format key `${topicId}-${idx}`. After Phase 11, the active session is V4 and expects `${topicId}-q${idx}` keys. If the YAML import path does not re-key scores, the imported scores are silently orphaned — never rendered, never included in score calculations.

**Why it happens:** `parseLegacy()` and `parseStructural()` are intentionally V3-shape producers (D-08). The re-keying step must happen at the import call site, after the parser returns but before `importSession()` is called.

**How to avoid:** In `ActionsGroup`, after building `preview`, apply score and note re-keying to `preview.result.scores` and `preview.result.notes` using the same `remapScoreKeys()` helper from `migrateV3ToV4`. Verify with a test that imports a legacy YAML with known score keys and confirms the stored scores use `q`-prefixed keys.

**Warning signs:** yamlImport.test.ts extension for the legacy path should assert that `result.scores` contains `twig-q0`, not `twig-0`.

### Pitfall 5: Pre-V4 Snapshot Gets Trimmed by Subsequent Auto-Snapshots

**What goes wrong:** The `adapter.snapshot()` method calls `#trimSnapshots()` which keeps only the last 3 snapshots. If bootstrap calls `adapter.snapshot()` for the pre-v4 key and then the user triggers 3 auto-snapshots (e.g., 3 YAML imports), the pre-v4 backup is deleted.

**Why it happens:** D-05 specifies "bypasses the 3-snapshot rotation" but if the implementation uses `adapter.snapshot()`, trimming happens automatically.

**How to avoid:** Write the pre-v4 snapshot via `chrome.storage.local.set()` directly, not via `adapter.snapshot()`. The key format `snapshot:<id>:pre-v4-<ts>` uses "pre-v4" as the timestamp suffix portion, which means `#trimSnapshots()` (which filters by `snapshot:${sessionId}:` prefix) would include it in the rotation if it ever ran for that session. Since we write directly, trimSnapshots is never called for this write and the key survives indefinitely.

---

## Code Examples

### V3 Fixture for migrateV3ToV4 Tests

```typescript
// src/storage/migrations/fixtures/v3-session-fixture.ts
// Pattern: mirrors v2-session-fixture.ts structure
// [VERIFIED: direct inspection of src/storage/migrations/fixtures/v2-session-fixture.ts]

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

// Populated fixture: uses real topic IDs from DEFAULT_SECTIONS so
// remapScoreKeys assertions can use real key patterns
// Use 'twig-0', 'twig-1' etc. — these map to 'twig-q0', 'twig-q1' after migration
export const V3_SESSION_POPULATED: Readonly<V3Session> = Object.freeze({
  version: 3,
  id: 'populated-v3-session',
  scores: { 'twig-0': 8, 'twig-1': 6 },
  overrides: { 'twig': 7 },
  notes: { 'twig-0': 'Good answer', 'twig-1': '' },
  topicNotes: { 'twig': 'Overall solid' },
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
```

### runMigrations Extension

```typescript
// src/storage/migrations/index.ts — add V3→V4 entry, update return type
// [VERIFIED: direct inspection of src/storage/migrations/index.ts]

import { migrateV3ToV4 } from './v3-to-v4.js';

const MIGRATIONS: Array<{
  fromVersion: number;
  fn: (r: unknown) => { manifest: V2Manifest; session: V2Session } | V3Session | V4Session;
}> = [
  { fromVersion: 1, fn: (r) => migrateV1ToV2(r as V1Schema) },
  { fromVersion: 2, fn: (r) => migrateV2ToV3(r as V2Session) },
  { fromVersion: 3, fn: (r) => migrateV3ToV4(r as V3Session) },
];

export function runMigrations(raw: unknown): ... | V4Session | null {
  // ...
  if (version === 3) {
    const entry = MIGRATIONS.find((m) => m.fromVersion === 3);
    if (entry) return entry.fn(raw) as V4Session;
    return null;
  }

  if (version === 4) {
    // Already at latest version — caller handles hydration.
    return null;
  }
  // ... rest unchanged
}
```

### MigrationErrorBanner Component (sketch)

```typescript
// src/components/MigrationErrorBanner.tsx
// Pattern: mirrors UpdateBanner.tsx — same sticky amber style, same dismiss behavior
// [VERIFIED: direct inspection of src/components/UpdateBanner.tsx]

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
        className="text-amber-700 dark:text-yellow-300 hover:text-amber-900 dark:hover:text-yellow-100 font-semibold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex-shrink-0 ml-3"
      >
        ×
      </button>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| V3 sessions read DEFAULT_SECTIONS at render time | V4 sessions carry their own materialized section tree | Phase 11 | Sections/topics become user-editable per session; bank changes don't retroactively alter stored sessions |
| Score keys: `${topicId}-${idx}` (integer suffix) | Score keys: `${topicId}-q${idx}` (q prefix + integer) | Phase 11 | IDs are self-describing; custom question IDs (`custom-*`) are unambiguously separate |

**Deprecated/outdated after Phase 11:**
- `createDefaultV3Session()` in `src/storage/types.ts`: Replace with `createDefaultV4Session()` for all new session creation paths. Keep `createDefaultV3Session()` for migration tests only (it is a valid input to `migrateV3ToV4()`).
- `version: 3` hardcode in `store/app.ts` subscribe block: Must become `version: 4` with a `sections` field.
- All score-key construction patterns using `${topicId}-${idx}` in the store and scoring utilities: Must use `${topicId}-q${idx}` post-Phase 11.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `parseLegacy()` and `parseStructural()` do not need internal changes — re-keying happens in ActionsGroup | Architecture Patterns §Pattern 4 | Low: both parsers are confirmed to output V3-format keys by direct code inspection; the question is only WHERE the conversion happens |
| A2 | `session.overrides` uses topicId keys (not question-index keys) and does NOT need re-keying | Common Pitfalls §Pitfall 1 | Low: `overrides` is keyed by topicId (`{ 'twig': 7.5 }`) not question index — confirmed by V3SessionSchema and v2-to-v3.ts |
| A3 | `session.topicNotes` uses topicId keys and does NOT need re-keying | Common Pitfalls §Pitfall 1 | Low: same reasoning as A2 |
| A4 | `bootstrap()` return type extension to include `failedSessionIds: string[]` is backward compatible with `main.tsx` hydration | Architecture Patterns §Pattern 3 | Low: main.tsx calls bootstrap() and destructures; adding a new field is non-breaking in TypeScript |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

All four assumptions are low-risk and grounded in direct code inspection. No user confirmation needed before planning.

---

## Open Questions

1. **Should `sections` live in AppState or be derived from session storage on each load?**
   - What we know: V4 session has `sections[]` in storage. Store currently reads flat scoring fields from session on `switchSession`. Adding `sections` to AppState and the subscribe block is consistent with the existing pattern.
   - What's unclear: `sections` can be large (9 sections × N topics × M questions). Whether Zustand rerenders on sections change could affect performance for Phase 14 BANK-01..05.
   - Recommendation: Put `sections` in AppState for Phase 11 (Phase 14 will need it there anyway). Measure if rerenders are a problem in Phase 14.

2. **Where exactly should the banner mount in App.tsx?**
   - What we know: `UpdateBanner` mounts as the first element inside the right-column div (App.tsx line 76-77), above `<main>`. A `MigrationErrorBanner` should use the same position.
   - What's unclear: Whether to co-locate with UpdateBanner or render separately. The failed-session count comes from bootstrap, so it must be stored in app state or passed via a ref.
   - Recommendation: Add `migrationFailedCount: number` and `migrationFailedIds: string[]` to AppState (or a bootstrap-only ref). Set them in main.tsx from the bootstrap result. MigrationErrorBanner reads from store.

---

## Environment Availability

> Step 2.6: SKIPPED. Phase 11 is entirely in-process JavaScript/TypeScript. No external services, CLIs, or runtimes beyond Node.js (build only) are needed. The extension runs in Chrome's built-in JS engine.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose src/storage/migrations/v3-to-v4.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | V3→V4 migration produces correct sections array | unit | `npm test -- src/storage/migrations/v3-to-v4.test.ts` | ❌ Wave 0 |
| DATA-01 | Score keys re-keyed from `twig-0` to `twig-q0` | unit | same | ❌ Wave 0 |
| DATA-01 | Notes keys re-keyed (same pattern as scores) | unit | same | ❌ Wave 0 |
| DATA-01 | overrides and topicNotes NOT re-keyed | unit | same | ❌ Wave 0 |
| DATA-01 | isDefault: true on all materialized entities | unit | same | ❌ Wave 0 |
| DATA-01 | customQuestions pass through unchanged (IDs, topicId, text, level) | unit | same | ❌ Wave 0 |
| DATA-01 | candidate preserved after migration | unit | same | ❌ Wave 0 |
| DATA-01 | Output passes V4SessionSchema valibot validation | unit | same | ❌ Wave 0 |
| DATA-01 | bootstrap: mixed V3+V4 manifest → V3 sessions migrated, V4 sessions passed through | integration | `npm test -- src/storage/bootstrap.test.ts` | ✅ (extend) |
| DATA-01 | bootstrap: failing session excluded from result, failedSessionIds populated | integration | same | ✅ (extend) |
| DATA-01 | bootstrap: pre-v4 snapshot written before migration, not trimmed | integration | same | ✅ (extend) |
| DATA-01 | legacy YAML import → parseLegacy → re-key → V4 scores stored as `q`-prefixed keys | integration | `npm test -- src/utils/yamlImport.test.ts` | ✅ (extend) |
| DATA-02 | structural YAML import → parseStructural → re-key → V4 session with all fields | integration | same | ✅ (extend) |
| DATA-02 | structural YAML round-trip: export V3 session → import → V4 has same score/note/candidate values | integration | `npm test -- src/utils/yamlExport.test.ts + yamlImport.test.ts` | ✅ (extend) |

### Sampling Rate

- **Per task commit:** `npm test -- src/storage/migrations/v3-to-v4.test.ts`
- **Per wave merge:** `npm test` (full 515+ suite must stay green)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/storage/migrations/v3-to-v4.test.ts` — covers DATA-01 unit behaviors (12 tests)
- [ ] `src/storage/migrations/fixtures/v3-session-fixture.ts` — frozen V3 fixture constants

*(bootstrap.test.ts, yamlImport.test.ts, and yamlExport.test.ts already exist and need extension, not creation.)*

---

## Security Domain

> `security_enforcement: true` in config.json; `security_asvs_level: 1`

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | n/a — no auth; Chrome extension, `chrome.storage.local` only |
| V3 Session Management | no | n/a — sessions are local data objects, not HTTP sessions |
| V4 Access Control | no | n/a — single-user local extension |
| V5 Input Validation | yes | valibot `v.safeParse(V4SessionSchema, raw)` validates every session before V4 write |
| V6 Cryptography | no | n/a — no encryption; existing snapshot backup serves as recovery, not security |

### Known Threat Patterns for this Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Corrupt/crafted V3 blob triggers exception in migrateV3ToV4 | Tampering | try/catch in bootstrap per-session loop; failed sessions are skipped, not crashed |
| Oversized `sections` array from a crafted V3 blob (9 DEFAULT_SECTIONS × topics × questions is bounded; user cannot inject sections in V3) | Denial of Service | Not applicable — V4 sections come from DEFAULT_SECTIONS deep-copy only; V3 has no `sections` field to inject |
| Score key injection via crafted V3 blob (e.g., keys that look like `${topicId}-q${idx}` already present) | Tampering | valibot V4SessionSchema validates the record types; values are `number | null`; key format is not validated by valibot (same as V3 pattern) |

**Assessment:** This phase has a low security surface. All migrations happen in the local extension context with data the user themselves wrote. The primary safety concern is data preservation (not security), addressed by the pre-migration snapshot and skip-and-continue patterns.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/storage/types.ts` — V3SessionSchema, CustomQuestionSchema, CandidateDetailsSchema, factory functions
- `src/storage/migrations/index.ts` — MIGRATIONS array, runMigrations() dispatch logic
- `src/storage/migrations/v2-to-v3.ts` — Direct template for migrateV3ToV4()
- `src/storage/migrations/v2-to-v3.test.ts` — Test structure template
- `src/storage/migrations/fixtures/v2-session-fixture.ts` — Fixture pattern
- `src/storage/bootstrap.ts` — Full bootstrap flow, session-per-loop pattern
- `src/storage/bootstrap.test.ts` — Four-scenario test structure
- `src/storage/adapter.ts` — snapshot() method, #trimSnapshots() trim logic
- `src/data/bank/index.ts` — DEFAULT_SECTIONS shape and export
- `src/data/bank/types.ts` — Section/Topic/Question interfaces
- `src/utils/yamlImport.ts` — parseLegacy(), parseStructural(), ImportResult shape
- `src/utils/yamlExport.ts` — exportSession() V3 key format confirmation
- `src/components/ActionsGroup.tsx` — YAML import call site (lines 115-137)
- `src/store/app.ts` — AppState, subscribe block, switchSession, importSession, createSession
- `src/app/main.tsx` — Bootstrap hydration sequence
- `src/components/UpdateBanner.tsx` — Non-blocking banner pattern for D-06

### Secondary (MEDIUM confidence)

- `.planning/phases/11-v4-session-migration-legacy-compat/11-CONTEXT.md` — All locked decisions (D-01 through D-09)
- `.planning/milestones/v1.0-phases/03-storage-layer-migration-bootstrap/03-PATTERNS.md` — Prior migration phase patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing stack confirmed in package.json
- Migration architecture: HIGH — direct codebase inspection of all referenced files
- Score key re-keying logic: HIGH — key format confirmed in v2-to-v3.ts comments and yamlImport.ts
- Test structure: HIGH — v2-to-v3.test.ts and bootstrap.test.ts are direct templates
- Banner placement: MEDIUM — UpdateBanner.tsx confirmed as analog; exact wording/position is Claude's discretion per CONTEXT.md

**Research date:** 2026-06-18
**Valid until:** 2026-09-18 (stable tech; no external dependencies that could drift)
