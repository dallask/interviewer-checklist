# Phase 3: Storage Layer, Migration & Bootstrap - Research

**Researched:** 2026-06-17
**Domain:** Chrome Extension Storage — chrome.storage.local adapter, schema migration pipeline, Zustand integration, lifecycle flush
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Storage Adapter & Zustand Integration**
- chrome.storage.local mocking: use `vitest-chrome` npm package — typed mock, drops into Vitest with full storage API
- Zustand wiring: custom `StorageAdapter` class wrapping `chrome.storage.local` — not Zustand persist middleware; more control over debounce and flush behavior
- Debounce ownership: 300ms trailing debounce + synchronous `flushPending()` live inside `StorageAdapter` — single owner for all write timing
- Quota check: async `getBytesInUse()` before each write; if usage exceeds configurable threshold, dispatch a `storage-quota-warning` custom event (UI toast in Phase 4)

**Migration Pipeline Architecture**
- Schema versions: v1 (legacy localStorage flat format from prototype) → v2 (chrome.storage sharded format with `manifest` + `session:<id>` keys) initially; additional versions added as later phases introduce new fields
- Migration failure: preserve original payload under `recovery:<timestamp>` key in chrome.storage.local, log error to console, bootstrap with empty/default state — never block the app
- Migration functions: pure functions — `(prev: V1Schema) => V2Schema` — each tested with a frozen input fixture; no mutations
- bootstrap() location: `src/storage/bootstrap.ts` — exported async function called in `src/app/main.tsx` before `createRoot`; awaited to completion before mounting

**Auto-Snapshot & Flush**
- Snapshot trigger: before any Reset-all operation or YAML import (destructive ops) — synchronous call to `snapshot()` before applying the operation
- Snapshot key scheme: `snapshot:<sessionId>:<timestamp>` with rolling FIFO trim to last 3 snapshots; trim runs after each snapshot write
- Flush events: `visibilitychange === 'hidden'` + `pagehide` — both registered in `src/storage/lifecycle.ts` which calls `StorageAdapter.flushPending()`
- Dirty flag: `StorageAdapter` tracks dirty state internally; `flushPending()` is a no-op when clean — prevents double-flush on rapid tab hide/restore

### Claude's Discretion

None declared in CONTEXT.md — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Additional schema versions beyond v2 deferred to the phases that introduce new fields (Phase 5 adds custom questions field, Phase 6 adds session slots v3, etc.)
- `chrome.storage.sync` cross-instance sync — explicitly out of scope per PROJECT.md
- Cloud backup / export-on-snapshot — deferred; YAML export in Phase 7 covers portability
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STORE-01 | `chrome.storage.local` adapter wraps all reads/writes, checks `chrome.runtime.lastError`, uses sharded keys (`manifest` + `session:<id>`) | chrome.storage.local API — Promise pattern, error handling, key design |
| STORE-02 | Schema migration pipeline (v1→v2) — each migration is a pure function with anonymized input fixture, fixture-pinned unit test, valibot-validated input and output; failure preserves payload under `recovery:<timestamp>`; migrations never deleted | valibot safeParse patterns, v1 schema extracted from prototype, pure function migration architecture |
| STORE-03 | `bootstrap()` runs the full migration pipeline and resolves before `createRoot` is called | bootstrap() placement in main.tsx, async/await pattern |
| STORE-04 | Zustand store persisted via custom adapter: 300ms trailing debounce for normal writes + synchronous `flushPending()` on `visibilitychange==="hidden"` and `pagehide` events; `dirty` flag guards double-flush | StorageAdapter class design, lifecycle event caveats |
| STORE-05 | Auto-snapshot (rolling last 3, FIFO trim) saved before any Reset all or YAML import operation | snapshot key scheme, FIFO trim implementation |
| STORE-06 | Storage-write helper calls `chrome.storage.local.getBytesInUse()` before each write and surfaces a dismissible toast when usage exceeds a configurable threshold | getBytesInUse API, quota constants |
</phase_requirements>

---

## Summary

Phase 3 delivers the complete persistence layer for the Interviewer Checklist extension. The core challenge is bridging two architectural worlds: the browser's async `chrome.storage.local` API (Promise-based, partitioned, rate-limited) and React's synchronous render cycle that expects state to be available immediately on mount. The solution has three interlocking parts: (1) a `bootstrap()` function that runs the migration pipeline before React mounts, ensuring v2 schema state is always in memory before the first render; (2) a `StorageAdapter` class that owns all write scheduling with a dirty flag + 300ms debounce + synchronous flush on page hide; and (3) a valibot-validated migration pipeline that can safely recover from corrupted payloads without blocking the app.

The prototype uses `localStorage` with a flat JSON blob under key `tech-stack-checklist-v2` at schema version 4. The v1 schema that Phase 3 must migrate FROM is that flat object (version field, questionScore, topicOverride, candidate, customQuestions, etc.). The v2 schema shards this into a `manifest` key (session IDs + metadata) and one `session:<id>` key per session, enabling Phase 6's multi-session feature without further migration work on the storage adapter itself.

Key operational risks: (1) `pagehide` async completions are not guaranteed — `flushPending()` must initiate `chrome.storage.local.set()` synchronously, accepting that the Promise may not resolve before the page is discarded; (2) the 120-writes-per-minute rate limit on `chrome.storage.local` silently drops excess writes — the 300ms debounce ensures the extension stays well under this limit even during rapid scoring.

**Primary recommendation:** Implement `StorageAdapter` as a class with `write(data)`, `read()`, `flushPending()`, `snapshot(sessionId)`, `trimSnapshots(sessionId)`, and `getBytesInUse()` methods. Wire Zustand stores to call `StorageAdapter.write(state)` on every state change; the adapter owns debounce internally. Register lifecycle listeners in `src/storage/lifecycle.ts` as a side-effectful module imported once in `main.tsx`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| chrome.storage.local reads/writes | Storage Layer (src/storage/) | — | Storage API is the sole owner of I/O; Zustand stores are in-memory only |
| Schema migration (v1→v2) | Storage Layer (src/storage/migrations/) | — | Migration runs once at bootstrap before React mounts; pure functions with no UI dependency |
| bootstrap() orchestration | Storage Layer (src/storage/bootstrap.ts) | App entry (src/app/main.tsx) | bootstrap() lives in storage/, but is called from main.tsx before createRoot |
| Zustand store subscription for writes | Frontend (src/stores/) | Storage Layer | Zustand store calls adapter.write(); adapter owns timing |
| Debounce + flush scheduling | Storage Layer (StorageAdapter class) | — | Single owner for all write timing; never duplicated in store logic |
| Lifecycle event registration | Storage Layer (src/storage/lifecycle.ts) | — | Side-effectful module with no UI dependency; keeps storage concerns co-located |
| Quota warning dispatch | Storage Layer (StorageAdapter) | UI Toast (Phase 4) | Adapter dispatches CustomEvent; Phase 4 UI listens — clean decoupling across phases |
| Snapshot before destructive ops | Storage Layer (StorageAdapter.snapshot()) | Caller (Phase 5/7) | API is in storage/; callers invoke it synchronously before mutation |

---

## Standard Stack

### Core (new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest-chrome` | 0.1.0 | Mock `chrome.*` APIs in Vitest tests | Only typed Chrome API mock that integrates with Vitest natively; maintained by probil; 50k weekly downloads [VERIFIED: npm registry] |
| `zustand` | 5.0.14 | In-memory state container that Phase 3 wires to storage | Stack locked in STATE.md; pmndrs/zustand repo; 41M+ weekly downloads [VERIFIED: npm registry] |
| `valibot` | 1.4.1 | Schema validation for migration input/output types | Stack locked in STATE.md; tree-shakeable, < 1 kB minzipped per validator; open-circle/valibot repo; 12M+ weekly downloads [VERIFIED: npm registry] |

### Already installed (no new install)

| Library | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^4.1.9 | Test runner — already in package.json |
| `@types/chrome` | ^0.1.43 | TypeScript types for chrome.* APIs — already in package.json |
| `typescript` | ~6.0 | Already in package.json |

### Installation

```bash
npm install --save-dev vitest-chrome
npm install zustand valibot
```

**Version verification (run before writing tasks):**

```bash
npm view vitest-chrome version   # → 0.1.0
npm view zustand version         # → 5.0.14
npm view valibot version         # → 1.4.1
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| vitest-chrome | npm | ~2.8 yrs (2023-08-25) | 50k/wk | github.com/probil/vitest-chrome | OK | Approved |
| zustand | npm | Ongoing (5.0.14: 2026-05-28) | 41.6M/wk | github.com/pmndrs/zustand | SUS (too-new latest tag) | Approved — flagged only because latest patch is from 2026-05-28; pmndrs/zustand is the canonical long-standing Zustand repo at 41M+ downloads/week; no postinstall script |
| valibot | npm | Ongoing (1.4.1: 2026-05-24) | 12.4M/wk | github.com/open-circle/valibot | SUS (too-new latest tag) | Approved — flagged only because latest patch is from 2026-05-24; open-circle/valibot is the canonical Valibot repo at 12M+ downloads/week; no postinstall script |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** zustand, valibot — flagged by the legitimacy seam's "too-new" signal because their latest patch tags are from May 2026. Both have multi-year histories, canonical GitHub repos under their known organizations (pmndrs, open-circle), no postinstall scripts, and download volumes (41M and 12M/week respectively) that confirm legitimacy. The "SUS" rating is a false positive from the seam's recency heuristic. No human checkpoint needed; these packages are part of the locked project stack (STATE.md Decisions section).

---

## V1 Schema — Exact Format (from prototype)

The prototype stores a single JSON blob in `localStorage` under key `tech-stack-checklist-v2`. The `SCHEMA_VERSION` constant in the prototype is `4`, but Phase 3 treats any blob found in `localStorage` under that key as "v1" (legacy), because the extension does not inherit the prototype's localStorage at all — v1 is a conceptual schema for any user who might export/import from the prototype. [VERIFIED: grep of stack-checklist.html line 1949–2012]

```typescript
// V1Schema — prototype defaultState() shape (stack-checklist.html lines 1952–1973)
interface V1Schema {
  version: number;              // prototype's SCHEMA_VERSION (currently 4)
  sections: unknown[] | null;   // null = built-in; array = imported structure
  sectionOpen: Record<string, boolean>;
  cardOpen: Record<string, boolean>;
  topicOverride: Record<string, number>;    // { itemId: 0..10 }
  questionScore: Record<string, number>;    // { questionKey: 0..10 }
  cardComment: Record<string, string>;
  questionComment: Record<string, string>;
  questionNoteOpen: Record<string, boolean>;
  candidate: {
    name?: string;
    email?: string;
    role?: string;
    date?: string;
    interviewer?: string;
    details?: string;
  };
  customQuestions: Record<string, Array<{ id: number; text: string; level: string }>>;
  customSeq: number;
  filters: string[];            // selected section ids
  levels: string[];             // selected difficulty levels
  search: string;
  hideReviewed: boolean;
  sidebarCollapsed: boolean;
  sidebarGroups: {
    search: boolean;
    difficulty: boolean;
    sections: boolean;
    actions: boolean;
  };
}
```

**Question key scheme** (prototype line 2042): `${item.id}-${questionIndex}` for built-in questions; `${item.id}-c${customQuestion.id}` for custom questions. Phase 2 locked the same scheme: `${topic.id}-${questionIndex}`. [VERIFIED: grep of stack-checklist.html]

**Prototype STORE_KEY:** `'tech-stack-checklist-v2'` — Phase 3 does NOT read from this key; the extension uses `chrome.storage.local` exclusively. The v1 migration is for hypothetical data portability, not automatic localStorage migration. [VERIFIED: grep of stack-checklist.html line 1949]

---

## V2 Schema — Target Format

```typescript
// V2Schema — chrome.storage.local sharded format
// Key "manifest" — session index
interface V2Manifest {
  version: 2;
  activeSessionId: string;
  sessions: Array<{
    id: string;           // uuid or timestamp-based
    name: string;
    createdAt: string;    // ISO 8601
    updatedAt: string;    // ISO 8601
  }>;
}

// Key "session:<id>" — per-session state
interface V2Session {
  version: 2;
  id: string;
  questionScore: Record<string, number | null>;   // Phase 2 ScoreMap shape
  topicOverride: Record<string, number | null>;
  cardComment: Record<string, string>;
  questionComment: Record<string, string>;
  candidate: {
    name?: string;
    email?: string;
    role?: string;
    date?: string;
    interviewer?: string;
    details?: string;
  };
  customQuestions: Record<string, Array<{ id: number; text: string; level: string }>>;
  customSeq: number;
  // UI state — NOT persisted in session (stored separately or kept in-memory)
  // sectionOpen, cardOpen, filters, levels, search, hideReviewed, sidebarCollapsed,
  // sidebarGroups are Phase 4 UI concerns; Phase 3 only stores scoring data
}

// Key "snapshot:<sessionId>:<timestamp>" — auto-snapshot before destructive ops
// Value: V2Session serialized to JSON string (or full V2Session object)

// Key "recovery:<timestamp>" — failed migration payload preservation
// Value: original raw string that failed migration
```

**Design rationale:** Sharding by `session:<id>` enables Phase 6 multi-session switching without reading the entire state blob. The `manifest` key is the index. UI state (filters, search, collapse state) is ephemeral per-tab and not persisted in Phase 3 — Phase 4 will decide per-key persistence requirements. [ASSUMED — UI state scope decision not locked in CONTEXT.md]

---

## Architecture Patterns

### System Architecture Diagram

```
main.tsx
  │
  ▼
bootstrap() [src/storage/bootstrap.ts]
  │
  ├─── chrome.storage.local.get(['manifest', 'session:*'])
  │         │
  │         ├─── No data found ──────────────────► createDefaultState() → V2 manifest + session
  │         │
  │         └─── Data found
  │                   │
  │                   ├─── version === 2 ──────────► validateV2(valibot.safeParse) → use as-is
  │                   │                                        │
  │                   │                               validation fails ► recovery:<ts> + defaultState
  │                   │
  │                   └─── version < 2 (legacy v1) ─► migrateV1ToV2(frozen input) → V2Schema
  │                                                           │
  │                                                   migration fails ► recovery:<ts> + defaultState
  │
  ▼
createRoot(rootEl) [src/app/main.tsx]
  │
  ▼
Zustand store initialized with hydrated V2 state
  │
  ├─── state.subscribe(snapshot => StorageAdapter.write(snapshot))
  │         │
  │         └─── StorageAdapter.write(data)
  │                   │
  │                   ├─── dirty = true
  │                   ├─── clearTimeout(debounceTimer)
  │                   ├─── debounceTimer = setTimeout(flush, 300)
  │                   └─── [quota check] getBytesInUse → dispatch 'storage-quota-warning' if over threshold
  │
  └─── lifecycle.ts registers:
            ├─── window.addEventListener('visibilitychange', onVisibilityChange)
            └─── window.addEventListener('pagehide', onPageHide)
                      │
                      └─── StorageAdapter.flushPending()  [synchronous initiation]
                                │
                                └─── if dirty: chrome.storage.local.set(pending) → dirty = false
                                     (Promise may not resolve before page teardown — accepted risk)
```

### Recommended Project Structure

```
src/
├── storage/
│   ├── index.ts            # public barrel: StorageAdapter, bootstrap, snapshot, types
│   ├── adapter.ts          # StorageAdapter class (read, write, flushPending, snapshot, trimSnapshots)
│   ├── adapter.test.ts     # unit tests with vitest-chrome mock
│   ├── bootstrap.ts        # bootstrap() async function
│   ├── bootstrap.test.ts   # unit tests: empty storage, v2 valid, v1 migration, recovery
│   ├── lifecycle.ts        # visibilitychange + pagehide registration (side-effectful module)
│   ├── lifecycle.test.ts   # unit tests: event registration, flushPending called on hide
│   ├── types.ts            # V1Schema, V2Manifest, V2Session, StorageKeys type
│   └── migrations/
│       ├── index.ts        # runMigrations(raw) pipeline orchestrator
│       ├── v1-to-v2.ts     # migrateV1ToV2 pure function
│       ├── v1-to-v2.test.ts # fixture-pinned unit test (frozen V1 fixture → assert V2 shape)
│       └── fixtures/
│           └── v1-snapshot.json  # anonymized V1 fixture (frozen, never mutated in tests)
```

### Pattern 1: StorageAdapter class

**What:** A class that owns all chrome.storage.local I/O, debounce scheduling, dirty state, and quota checking.

**When to use:** Any code that needs to read or write extension storage. Single instantiation at bootstrap, exported as singleton from `src/storage/index.ts`.

```typescript
// src/storage/adapter.ts
// Source: architecture from CONTEXT.md decisions + chrome.storage.local Promise API [ASSUMED pattern]
import type { V2Manifest, V2Session } from './types.js';

const QUOTA_WARNING_THRESHOLD = 0.8; // 80% of QUOTA_BYTES
const QUOTA_BYTES = 10_485_760;      // chrome.storage.local.QUOTA_BYTES (10 MB)
const DEBOUNCE_MS = 300;

export class StorageAdapter {
  #dirty = false;
  #pendingData: Record<string, unknown> | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async read(keys: string[]): Promise<Record<string, unknown>> {
    try {
      return await chrome.storage.local.get(keys);
    } catch (err) {
      console.error('[StorageAdapter] read error:', err);
      return {};
    }
  }

  write(data: Record<string, unknown>): void {
    this.#pendingData = { ...this.#pendingData, ...data };
    this.#dirty = true;
    if (this.#debounceTimer !== null) clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(() => { void this.#flush(); }, DEBOUNCE_MS);
  }

  flushPending(): void {
    // Synchronous initiation — called from pagehide/visibilitychange handlers.
    // The Promise is fire-and-forget; no guarantee of resolution on teardown.
    if (!this.#dirty || this.#pendingData === null) return;
    if (this.#debounceTimer !== null) { clearTimeout(this.#debounceTimer); this.#debounceTimer = null; }
    void this.#flush();
  }

  async #flush(): Promise<void> {
    if (this.#pendingData === null) return;
    const data = this.#pendingData;
    this.#pendingData = null;
    this.#dirty = false;
    await this.#checkQuota();
    try {
      await chrome.storage.local.set(data);
    } catch (err) {
      console.error('[StorageAdapter] write error:', err);
      // Re-dirty: attempt will retry on next write or flush
      this.#dirty = true;
      this.#pendingData = { ...data, ...this.#pendingData };
    }
  }

  async #checkQuota(): Promise<void> {
    try {
      const used = await chrome.storage.local.getBytesInUse();
      if (used > QUOTA_BYTES * QUOTA_WARNING_THRESHOLD) {
        window.dispatchEvent(new CustomEvent('storage-quota-warning', {
          detail: { usedBytes: used, quotaBytes: QUOTA_BYTES }
        }));
      }
    } catch {
      // getBytesInUse failure is non-blocking
    }
  }

  async snapshot(sessionId: string): Promise<void> {
    // Read current session state and write to snapshot:<sessionId>:<timestamp>
    const key = `session:${sessionId}`;
    const data = await this.read([key]);
    if (!data[key]) return;
    const snapshotKey = `snapshot:${sessionId}:${Date.now()}`;
    await chrome.storage.local.set({ [snapshotKey]: data[key] });
    await this.#trimSnapshots(sessionId);
  }

  async #trimSnapshots(sessionId: string): Promise<void> {
    // FIFO trim: keep only last 3 snapshots for this session
    const prefix = `snapshot:${sessionId}:`;
    const allKeys = await chrome.storage.local.getKeys?.() ?? [];
    const snapKeys = (allKeys as string[])
      .filter(k => k.startsWith(prefix))
      .sort(); // ISO timestamp suffix sorts lexicographically
    if (snapKeys.length > 3) {
      const toRemove = snapKeys.slice(0, snapKeys.length - 3);
      await chrome.storage.local.remove(toRemove);
    }
  }
}

export const storageAdapter = new StorageAdapter();
```

### Pattern 2: bootstrap() — async migration before createRoot

**What:** Async function that reads chrome.storage.local, runs the migration pipeline, validates with valibot, and returns hydrated V2 state. Called and awaited in `main.tsx` before `createRoot`.

**When to use:** Once, at app startup.

```typescript
// src/storage/bootstrap.ts  [ASSUMED pattern based on CONTEXT.md decisions]
import * as v from 'valibot';
import { storageAdapter } from './adapter.js';
import { V2ManifestSchema, V2SessionSchema, createDefaultManifest, createDefaultSession } from './types.js';
import { migrateV1ToV2 } from './migrations/index.js';

export async function bootstrap(): Promise<{ manifest: V2Manifest; sessions: Record<string, V2Session> }> {
  const raw = await storageAdapter.read(['manifest']);
  const rawManifest = raw['manifest'];

  if (!rawManifest) {
    // First run — create default state
    const manifest = createDefaultManifest();
    const defaultSession = createDefaultSession(manifest.sessions[0].id);
    await chrome.storage.local.set({
      manifest,
      [`session:${manifest.sessions[0].id}`]: defaultSession,
    });
    return { manifest, sessions: { [manifest.sessions[0].id]: defaultSession } };
  }

  // Detect version and migrate if needed
  if (typeof rawManifest === 'object' && rawManifest !== null && (rawManifest as Record<string, unknown>)['version'] !== 2) {
    // Legacy v1 blob — migrate
    try {
      const v2 = migrateV1ToV2(rawManifest as V1Schema);
      await chrome.storage.local.set({ manifest: v2.manifest, [`session:${v2.session.id}`]: v2.session });
      return { manifest: v2.manifest, sessions: { [v2.session.id]: v2.session } };
    } catch (err) {
      console.error('[bootstrap] migration failed, preserving under recovery key:', err);
      await chrome.storage.local.set({ [`recovery:${Date.now()}`]: rawManifest });
      const manifest = createDefaultManifest();
      const defaultSession = createDefaultSession(manifest.sessions[0].id);
      await chrome.storage.local.set({ manifest, [`session:${manifest.sessions[0].id}`]: defaultSession });
      return { manifest, sessions: { [manifest.sessions[0].id]: defaultSession } };
    }
  }

  // v2 — validate with valibot
  const result = v.safeParse(V2ManifestSchema, rawManifest);
  if (!result.success) {
    console.error('[bootstrap] v2 manifest validation failed:', result.issues);
    await chrome.storage.local.set({ [`recovery:${Date.now()}`]: rawManifest });
    const manifest = createDefaultManifest();
    const defaultSession = createDefaultSession(manifest.sessions[0].id);
    await chrome.storage.local.set({ manifest, [`session:${manifest.sessions[0].id}`]: defaultSession });
    return { manifest, sessions: { [manifest.sessions[0].id]: defaultSession } };
  }

  // Load all sessions
  const manifest = result.output;
  const sessionKeys = manifest.sessions.map(s => `session:${s.id}`);
  const sessionData = await storageAdapter.read(sessionKeys);
  const sessions: Record<string, V2Session> = {};
  for (const s of manifest.sessions) {
    const key = `session:${s.id}`;
    const sessionResult = v.safeParse(V2SessionSchema, sessionData[key]);
    sessions[s.id] = sessionResult.success ? sessionResult.output : createDefaultSession(s.id);
  }
  return { manifest, sessions };
}
```

### Pattern 3: v1→v2 pure migration function

**What:** A pure function that takes a frozen V1 snapshot and returns a V2 {manifest, session} pair. No side effects. Unit-tested with a frozen fixture.

**When to use:** Called by bootstrap() when the stored data has version !== 2.

```typescript
// src/storage/migrations/v1-to-v2.ts  [ASSUMED — pure function pattern from CONTEXT.md]
import type { V1Schema, V2Manifest, V2Session } from '../types.js';

export function migrateV1ToV2(raw: V1Schema): { manifest: V2Manifest; session: V2Session } {
  const sessionId = `session-${Date.now()}`;
  const now = new Date().toISOString();

  const session: V2Session = {
    version: 2,
    id: sessionId,
    questionScore: raw.questionScore ?? {},
    topicOverride: raw.topicOverride ?? {},
    cardComment: raw.cardComment ?? {},
    questionComment: raw.questionComment ?? {},
    candidate: raw.candidate ?? {},
    customQuestions: raw.customQuestions ?? {},
    customSeq: raw.customSeq ?? 0,
  };

  const manifest: V2Manifest = {
    version: 2,
    activeSessionId: sessionId,
    sessions: [{ id: sessionId, name: 'Imported Session', createdAt: now, updatedAt: now }],
  };

  return { manifest, session };
}
```

### Pattern 4: vitest-chrome setup

**What:** Extend the existing `src/test/setup.ts` to make `chrome.*` APIs available globally in all Vitest tests.

**When to use:** Add once to the existing setup file — vitest.config.ts already declares `setupFiles: ['./src/test/setup.ts']`.

```typescript
// src/test/setup.ts — add these lines  [CITED: github.com/probil/vitest-chrome]
import '@testing-library/jest-dom/vitest';
import * as chrome from 'vitest-chrome';
Object.assign(globalThis, { chrome });
```

**Mocking chrome.storage.local in tests:**

```typescript
// In a test file — apply mockImplementation per test  [ASSUMED — vitest-chrome pattern]
import { chrome } from 'vitest-chrome';
import { vi } from 'vitest';

// Mock chrome.storage.local.get to return test data
chrome.storage.local.get.mockImplementation(
  (_keys, callback) => callback?.({ manifest: testManifest }) ?? Promise.resolve({ manifest: testManifest })
);

// Mock chrome.storage.local.set to resolve immediately
chrome.storage.local.set.mockImplementation(
  (_items, callback) => { callback?.(); return Promise.resolve(); }
);

// Mock getBytesInUse
chrome.storage.local.getBytesInUse.mockImplementation(
  (_keys, callback) => { callback?.(1024); return Promise.resolve(1024); }
);
```

### Pattern 5: valibot schema validation

**What:** Use `v.safeParse()` for migration input/output validation — returns `{success, output, issues}` without throwing.

**When to use:** At bootstrap for validating stored data; at migration boundaries for validating output shape.

```typescript
// src/storage/types.ts  [CITED: valibot.dev/guides/schemas/]
import * as v from 'valibot';

export const CandidateSchema = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  role: v.optional(v.string()),
  date: v.optional(v.string()),
  interviewer: v.optional(v.string()),
  details: v.optional(v.string()),
});

export const V2SessionSchema = v.object({
  version: v.literal(2),
  id: v.string(),
  questionScore: v.record(v.string(), v.nullable(v.number())),
  topicOverride: v.record(v.string(), v.nullable(v.number())),
  cardComment: v.record(v.string(), v.string()),
  questionComment: v.record(v.string(), v.string()),
  candidate: CandidateSchema,
  customQuestions: v.record(v.string(), v.array(v.object({
    id: v.number(),
    text: v.string(),
    level: v.string(),
  }))),
  customSeq: v.number(),
});

export const V2ManifestSchema = v.object({
  version: v.literal(2),
  activeSessionId: v.string(),
  sessions: v.array(v.object({
    id: v.string(),
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })),
});

export type V2Session = v.InferOutput<typeof V2SessionSchema>;
export type V2Manifest = v.InferOutput<typeof V2ManifestSchema>;
```

### Pattern 6: lifecycle event registration

**What:** Side-effectful module that registers `visibilitychange` and `pagehide` handlers pointing at `storageAdapter.flushPending()`.

**When to use:** Imported once as a side-effect in `main.tsx` (or in `bootstrap.ts`).

```typescript
// src/storage/lifecycle.ts  [ASSUMED pattern from CONTEXT.md]
import { storageAdapter } from './adapter.js';

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    storageAdapter.flushPending();
  }
}

function onPageHide(): void {
  storageAdapter.flushPending();
}

export function registerLifecycleListeners(): void {
  window.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);
}

export function unregisterLifecycleListeners(): void {
  window.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', onPageHide);
}
```

### Pattern 7: main.tsx integration

**What:** Await bootstrap() before createRoot to ensure v2 state is in memory before React mounts.

```typescript
// src/app/main.tsx — updated version  [ASSUMED pattern]
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

**Note on top-level await:** Vite + TypeScript with `"module": "ESNext"` and CRXJS supports top-level await in the app entry point. If there are TypeScript errors, set `"target": "ES2022"` or later in tsconfig. [ASSUMED — depends on tsconfig.json moduleResolution]

### Anti-Patterns to Avoid

- **Calling chrome.storage.local directly in Zustand actions:** All storage I/O must go through `StorageAdapter`. Zustand stores are in-memory; they call `adapter.write(state)` on subscribe.
- **Using Zustand persist middleware:** The locked decision is a custom StorageAdapter, not persist middleware. The middleware does not support synchronous `flushPending()` or dirty-flag semantics.
- **Awaiting flushPending() in pagehide handler:** `flushPending()` must be synchronous to initiate the write. Awaiting in a pagehide handler is futile because the event loop may not process the microtask before teardown.
- **Using `getKeys()` without a null check:** `chrome.storage.local.getKeys()` was added in Chrome 117 — it may not exist in the `@types/chrome` version installed. Use optional chaining (`?.`) or a fallback to `get(null)` which returns all keys.
- **Storing UI state (filters, search, collapse state) in the session key:** Phase 3 only persists scoring data. UI state is Phase 4's responsibility.
- **Mutating migration input fixtures in tests:** Use `Object.freeze()` on the V1 fixture to guarantee pure-function behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation at migration boundaries | Custom type guards with `if` chains | `valibot.safeParse()` | safeParse returns structured issues; hand-rolled type guards miss optional field edge cases and don't generate TypeScript types |
| Chrome API mocks in Vitest | Manual `global.chrome = { storage: { local: { get: vi.fn(), ... } } }` | `vitest-chrome` | Manual mocks miss event emitter behavior, lastError semantics, and require per-test maintenance; vitest-chrome is drop-in typed |
| Debounce implementation | Custom closure with setTimeout + cancel | Built-in pattern (3 lines in StorageAdapter) | Debounce here is simple enough to be inline — do NOT import a debounce utility library (adds dependency, no benefit at this complexity level) |
| Session ID generation | uuid library | `crypto.randomUUID()` | Built into Chrome 92+ and Web Crypto API; no dependency needed; returns RFC 4122-compliant UUID |

**Key insight:** The chrome.storage.local API is simple enough that its async patterns are straightforward — the complexity in this phase is in the orchestration (bootstrap order, lifecycle events, migration recovery) rather than in the I/O calls themselves.

---

## Common Pitfalls

### Pitfall 1: chrome.storage.local.getKeys() availability

**What goes wrong:** `getKeys()` method used in `#trimSnapshots` throws `TypeError: chrome.storage.local.getKeys is not a function` in older Chrome versions or in the `@types/chrome` mock.

**Why it happens:** `getKeys()` was added in Chrome 117 (October 2023). The `@types/chrome` version `^0.1.43` may not include it in the type definition even if it exists at runtime.

**How to avoid:** Use optional chaining with a fallback: `chrome.storage.local.getKeys?.() ?? (await chrome.storage.local.get(null)).then ? ...`. Alternatively, iterate known key prefixes from the manifest rather than reading all keys.

**Warning signs:** TypeScript error `Property 'getKeys' does not exist on type 'LocalStorageArea'`, or runtime error in vitest-chrome mock.

**Recommended approach for Phase 3:** To trim snapshots, read the manifest to get `sessionId`, then construct snapshot keys directly (`snapshot:${sessionId}:${ts}`) from a stored list of snapshot timestamps rather than scanning all keys. This is simpler and avoids the getKeys compatibility issue.

### Pitfall 2: Top-level await in main.tsx requires correct tsconfig target

**What goes wrong:** `SyntaxError: Top-level await is not available in the configured target environment` or TypeScript error: `Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', 'node18', 'nodenext', or 'bundler'`.

**Why it happens:** `tsconfig.json` uses `"module": "ESNext"` and `"target": "ES2022"` which supports top-level await, but if the config was set to an earlier target this breaks.

**How to avoid:** Verify `tsconfig.json` has `"module": "ESNext"` or `"module": "Bundler"` (CRXJS typically requires Bundler). Alternative: wrap bootstrap() in an IIFE `(async () => { const state = await bootstrap(); ... createRoot(...); })()` — this avoids the top-level await requirement entirely.

**Warning signs:** Build fails with `SyntaxError` or TypeScript error on the `await bootstrap()` line.

### Pitfall 3: 120 writes/minute silent rate limit

**What goes wrong:** If a Zustand store is subscribed with `store.subscribe(adapter.write)` and the UI generates rapid state changes (e.g., slider drag), the extension hits the ~120-writes/minute-per-item cap. Chrome silently drops writes without error — data is lost silently.

**Why it happens:** `chrome.storage.local` enforces a per-item write rate limit. Exceeding it does not throw; it silently no-ops. [CITED: bulkmd.app/blog/chrome-storage-patterns-manifest-v3]

**How to avoid:** The 300ms debounce in StorageAdapter coalesces rapid writes. At 300ms debounce, maximum sustained write rate is ~200 writes/minute — still over the limit for pathological cases. However, with sharded keys (`manifest` and `session:<id>` are separate items), the per-item limit resets per key. At normal usage (user clicks, slider moves with 300ms debounce), this limit is not a practical concern.

**Warning signs:** Data not persisting after rapid UI interactions. No error is thrown — only detectable by observing state after page reload.

### Pitfall 4: flushPending() in pagehide — async completion not guaranteed

**What goes wrong:** State is lost when a tab is closed because `chrome.storage.local.set()` is async and the page may be torn down before the Promise resolves.

**Why it happens:** The Page Lifecycle API specifies that async operations initiated in `pagehide` handlers cannot be guaranteed to complete. [CITED: developer.chrome.com/docs/web-platform/page-lifecycle-api] The Chrome runtime may freeze or terminate the page before the microtask queue is drained.

**How to avoid:** `flushPending()` synchronously initiates the write (fire-and-forget). This is the best achievable behavior — the write is initiated before the page terminates, and in practice Chrome allows most `chrome.storage.local.set()` calls to complete from pagehide handlers. The dirty-flag guard ensures no double-flush. The 300ms debounce means that for most normal interactions, the write has already completed long before the user closes the tab.

**Warning signs:** Data occasionally missing after abrupt tab close. This is a known Chrome extension limitation, not a code bug.

### Pitfall 5: vitest-chrome mock not in global scope for all test files

**What goes wrong:** Tests that import `chrome.*` APIs fail with `ReferenceError: chrome is not defined`.

**Why it happens:** `Object.assign(globalThis, { chrome })` in `setup.ts` only runs if Vitest's `setupFiles` is correctly configured and the setup file is evaluated before tests. If the setup.ts is not added to `setupFiles` in `vitest.config.ts`, the mock is never installed.

**How to avoid:** The existing `vitest.config.ts` already has `setupFiles: ['./src/test/setup.ts']`. Adding the vitest-chrome lines to `src/test/setup.ts` is sufficient. No per-test import of vitest-chrome is needed for the `chrome` global.

**Warning signs:** `ReferenceError: chrome is not defined` in any storage test. Fix: verify setup.ts runs (add a `console.log` temporarily), then remove it.

### Pitfall 6: valibot v1 API breaking changes from v0

**What goes wrong:** Using v0 valibot API (e.g., `object({})` instead of `v.object({})`, or `Input`/`Output` instead of `InferInput`/`InferOutput`) causes TypeScript errors or incorrect validation behavior.

**Why it happens:** Valibot v1.0 (released 2024) introduced breaking API changes from v0.x. The project installs v1.4.1 — all documentation and examples should target v1.x API.

**How to avoid:** Always use `import * as v from 'valibot'` namespace import. Use `v.InferOutput<typeof Schema>` for type inference. Use `v.safeParse()` not `safeParseAsync()` for synchronous schemas.

**Warning signs:** TypeScript error `Module '"valibot"' has no exported member 'Output'` or similar.

---

## Code Examples

### Example 1: valibot safeParse for migration output validation

```typescript
// Source: valibot.dev/guides/parse-data/ [CITED]
import * as v from 'valibot';
import { V2SessionSchema } from './types.js';

function validateSession(raw: unknown): V2Session | null {
  const result = v.safeParse(V2SessionSchema, raw);
  if (!result.success) {
    console.error('Session validation failed:', result.issues);
    return null;
  }
  return result.output; // TypeScript knows this is V2Session
}
```

### Example 2: Frozen fixture in migration test

```typescript
// src/storage/migrations/v1-to-v2.test.ts  [ASSUMED pattern from CONTEXT.md]
import { describe, it, expect } from 'vitest';
import { migrateV1ToV2 } from './v1-to-v2.js';
import v1Fixture from './fixtures/v1-snapshot.json' assert { type: 'json' };

const FROZEN_FIXTURE = Object.freeze(v1Fixture) as V1Schema;

describe('migrateV1ToV2', () => {
  it('produces valid v2 manifest and session', () => {
    const result = migrateV1ToV2(FROZEN_FIXTURE);
    expect(result.manifest.version).toBe(2);
    expect(result.session.version).toBe(2);
    expect(result.session.questionScore).toEqual(FROZEN_FIXTURE.questionScore ?? {});
    // Fixture pinning — if this fails, the migration function changed behavior
    expect(Object.keys(result.session.questionScore)).toHaveLength(
      Object.keys(FROZEN_FIXTURE.questionScore ?? {}).length
    );
  });

  it('does not mutate the input fixture', () => {
    const before = JSON.stringify(FROZEN_FIXTURE);
    migrateV1ToV2(FROZEN_FIXTURE);
    expect(JSON.stringify(FROZEN_FIXTURE)).toBe(before);
  });
});
```

### Example 3: chrome.storage.local.getBytesInUse usage

```typescript
// Source: developer.chrome.com/docs/extensions/reference/api/storage [CITED]
// getBytesInUse returns total bytes for all keys if called with null
const totalBytes = await chrome.storage.local.getBytesInUse(null);
// or for specific keys:
const sessionBytes = await chrome.storage.local.getBytesInUse(['manifest', 'session:abc123']);
```

### Example 4: crypto.randomUUID for session IDs (no dependency needed)

```typescript
// Built into Chrome 92+ and Web Crypto API [VERIFIED: MDN Web Crypto API]
const sessionId = crypto.randomUUID(); // Returns RFC 4122 UUID string
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `chrome.storage.local` callback API | Promise API (async/await) | Chrome 88 (2021) | No callback wrappers needed; use try/catch |
| Valibot v0 `Output<typeof Schema>` | Valibot v1 `InferOutput<typeof Schema>` | v1.0 (2024) | Breaking rename; all examples must use v1 API |
| Manual `global.chrome = {}` mocks | `vitest-chrome` package | 2023 | Typed, event-aware mocks replace hand-rolled approach |
| Zustand `localStorage` via persist middleware | Custom StorageAdapter (CONTEXT.md decision) | Phase 3 | More control over flush timing and async API compatibility |
| `beforeunload` event for save-on-exit | `visibilitychange` + `pagehide` | Chrome deprecating `beforeunload` intent, ~2024 | `beforeunload` prevents BFCache; `pagehide` is the correct signal |

**Deprecated/outdated:**
- `chrome.runtime.lastError` in callback path: in the Promise API path, use `try/catch` — `lastError` is for callback-style calls only
- `beforeunload` for extension lifecycle: Chrome is deprecating `unload` and the intent is to move extensions to `pagehide`/`visibilitychange`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Top-level `await` works in `src/app/main.tsx` with current tsconfig | Pattern 7 (main.tsx) | Build fails — fallback is IIFE wrapper `(async () => {...})()` |
| A2 | `chrome.storage.local.getKeys()` may not exist in @types/chrome 0.1.43 | Pitfall 1 | TypeScript error; use optional chaining or manifest-based key list |
| A3 | UI state (filters, search, collapse state) is NOT persisted in Phase 3 | V2 Schema section | Phase 4 may need to retrofit persistence for these fields; V2Session may need extension |
| A4 | `snapshot:<sessionId>:<timestamp>` FIFO trim reads from a stored list, not `getKeys()` | Pattern 1 (StorageAdapter) | Implementation complexity increases if getKeys() is available and preferred |
| A5 | `vitest-chrome` mock installed via `Object.assign(globalThis, { chrome })` covers all `chrome.storage.local` methods needed in tests | Pattern 4 (vitest-chrome setup) | If any method is not mocked by vitest-chrome, tests fail with unexpected mock behavior |
| A6 | Zustand stores will subscribe with `store.subscribe(snapshot => adapter.write(snapshot))` | Architecture diagram | Phase 4 must actually implement this wiring; Phase 3 only provides the adapter API |
| A7 | `crypto.randomUUID()` is available in the extension context (MV3 full page tab) | Pattern 7 | If not available, use timestamp + Math.random() fallback |

**If this table is empty:** Not applicable — several assumptions are noted above.

---

## Open Questions

1. **Where does Zustand get imported and wired in Phase 3 vs Phase 4?**
   - What we know: CONTEXT.md says `StorageAdapter` is ready for Phase 4+ to import. The Zustand install happens in Phase 3 (it's in the package install). Phase 3 does not create Zustand stores — those are Phase 4+.
   - What's unclear: Should Phase 3 create a minimal Zustand store stub for testing the adapter integration, or just export the adapter API for Phase 4 to wire?
   - Recommendation: Phase 3 creates only `StorageAdapter` + `bootstrap()` + `lifecycle.ts`. No Zustand stores in Phase 3 — Phase 4 creates the store and wires it to the adapter. Zustand is installed in Phase 3 as a dependency for future phases.

2. **Snapshot key FIFO trim — using getKeys() vs stored timestamp list**
   - What we know: `getKeys()` was added in Chrome 117; `@types/chrome 0.1.43` may not include it.
   - What's unclear: Whether the type definitions include `getKeys()` or if it needs to be typed manually.
   - Recommendation: Store snapshot timestamps in the manifest's session metadata (e.g., `sessions[].snapshots: string[]`). This eliminates the need for `getKeys()` entirely and makes FIFO trim a pure data operation on the manifest.

3. **V1 migration — is it truly needed or just defensive?**
   - What we know: The prototype uses `localStorage` not `chrome.storage.local`. Users of the prototype would never have data in `chrome.storage.local`. The v1→v2 migration path is defensive.
   - What's unclear: STORE-02 says "v1→v5" migration pipeline. v1→v2 is Phase 3; v2→v3, etc. will be added later. But the 5-version mention may be aspirational.
   - Recommendation: Implement v1→v2 only. Design the pipeline as an array of migration functions that can be appended in future phases. The migration runner loops through versions sequentially.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, npm install | Yes | v20.20.2 | — |
| npm | Package install | Yes | 10.8.2 | — |
| vitest | Test runner | Yes (installed) | ^4.1.9 | — |
| @types/chrome | TypeScript types for chrome.* | Yes (installed) | ^0.1.43 | — |
| vitest-chrome | Chrome mock in tests | NOT INSTALLED | 0.1.0 available | Manual vi.fn() mocks (not recommended) |
| zustand | State management | NOT INSTALLED | 5.0.14 available | — (required dependency) |
| valibot | Schema validation | NOT INSTALLED | 1.4.1 available | Zod (heavier bundle) |
| crypto.randomUUID | Session ID generation | Yes (Chrome 92+, MV3) | Built-in | `Date.now().toString(36) + Math.random().toString(36)` |

**Missing dependencies with no fallback:**
- `zustand` — must be installed; no alternative per locked stack decision

**Missing dependencies with fallback:**
- `vitest-chrome` — manual `vi.fn()` mocks are a fallback but increase test maintenance burden
- `valibot` — Zod is a viable alternative but heavier; stack is locked to valibot

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run src/storage/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STORE-01 | adapter.read() calls chrome.storage.local.get with correct keys | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-01 | adapter.write() initiates chrome.storage.local.set after debounce | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-01 | adapter handles chrome.storage.local.get rejection gracefully | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-02 | migrateV1ToV2 maps all V1 fields to V2 shape | unit | `npx vitest run src/storage/migrations/v1-to-v2.test.ts` | No — Wave 0 |
| STORE-02 | migrateV1ToV2 does not mutate frozen input fixture | unit | `npx vitest run src/storage/migrations/v1-to-v2.test.ts` | No — Wave 0 |
| STORE-02 | v2 output passes valibot V2SessionSchema.safeParse | unit | `npx vitest run src/storage/migrations/v1-to-v2.test.ts` | No — Wave 0 |
| STORE-03 | bootstrap() with empty storage creates default manifest + session | unit | `npx vitest run src/storage/bootstrap.test.ts` | No — Wave 0 |
| STORE-03 | bootstrap() with valid v2 manifest returns hydrated state | unit | `npx vitest run src/storage/bootstrap.test.ts` | No — Wave 0 |
| STORE-03 | bootstrap() with invalid v2 data writes recovery key + returns default | unit | `npx vitest run src/storage/bootstrap.test.ts` | No — Wave 0 |
| STORE-04 | StorageAdapter.write() coalesces rapid writes into single set() call | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-04 | StorageAdapter.flushPending() is no-op when dirty=false | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-04 | lifecycle.ts registers visibilitychange + pagehide handlers | unit | `npx vitest run src/storage/lifecycle.test.ts` | No — Wave 0 |
| STORE-05 | snapshot() writes session data under snapshot:sessionId:ts key | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-05 | FIFO trim removes oldest snapshots beyond 3 | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-06 | write() calls getBytesInUse before flush | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |
| STORE-06 | write() dispatches storage-quota-warning when over threshold | unit | `npx vitest run src/storage/adapter.test.ts` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/storage/`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + `npm run ci` (Biome + tsc) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/storage/adapter.ts` — StorageAdapter class (source file)
- [ ] `src/storage/adapter.test.ts` — covers STORE-01, STORE-04, STORE-05, STORE-06
- [ ] `src/storage/bootstrap.ts` — bootstrap() function
- [ ] `src/storage/bootstrap.test.ts` — covers STORE-03
- [ ] `src/storage/lifecycle.ts` — event registration
- [ ] `src/storage/lifecycle.test.ts` — covers STORE-04 (event wiring)
- [ ] `src/storage/types.ts` — V1Schema, V2Manifest, V2Session, valibot schemas
- [ ] `src/storage/migrations/index.ts` — migration pipeline runner
- [ ] `src/storage/migrations/v1-to-v2.ts` — pure migration function
- [ ] `src/storage/migrations/v1-to-v2.test.ts` — covers STORE-02
- [ ] `src/storage/migrations/fixtures/v1-snapshot.json` — anonymized V1 fixture
- [ ] `src/storage/index.ts` — public barrel

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this phase |
| V3 Session Management | Partial | Session IDs are generated with `crypto.randomUUID()` — not guessable; sessions are local-only, no session tokens |
| V4 Access Control | No | Single-user, no access control needed |
| V5 Input Validation | Yes | valibot safeParse on all data read from chrome.storage.local before use |
| V6 Cryptography | No | No encryption; chrome.storage.local is extension-partitioned at the OS level |

### Known Threat Patterns for chrome.storage.local

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/corrupted storage data causes app crash | Tampering | valibot.safeParse() validates all reads; recovery fallback in bootstrap() |
| Quota exhaustion denies writes | Denial of Service | getBytesInUse() before each write; storage-quota-warning event dispatched to UI |
| Snapshot accumulation fills quota | Denial of Service | FIFO trim to 3 snapshots; each snapshot is bounded by one session's data |
| Race condition between debounce flush and synchronous snapshot | Information Disclosure (data loss) | flushPending() called synchronously before snapshot(); dirty flag tracks pending writes |
| Content script reading extension storage | Elevation of Privilege | Not applicable — no content scripts in this extension; default TRUSTED_CONTEXTS access level |

---

## Sources

### Primary (MEDIUM confidence — from official sources)

- [developer.chrome.com/docs/extensions/reference/api/storage](https://developer.chrome.com/docs/extensions/reference/api/storage) — chrome.storage.local API: quota (10MB/QUOTA_BYTES=10485760), Promise API, getBytesInUse, onChanged event
- [valibot.dev/guides/parse-data/](https://valibot.dev/guides/parse-data/) — safeParse(), parse(), is() function signatures and usage
- [developer.chrome.com/docs/web-platform/page-lifecycle-api](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) — visibilitychange vs pagehide guidance; async operations not guaranteed in frozen/terminated state

### Secondary (LOW confidence — from web, codebase grep)

- [github.com/probil/vitest-chrome](https://github.com/probil/vitest-chrome) — setup pattern: `import * as chrome from 'vitest-chrome'; Object.assign(globalThis, { chrome })` in setup file
- [bulkmd.app/blog/chrome-storage-patterns-manifest-v3](https://bulkmd.app/blog/chrome-storage-patterns-manifest-v3) — 120 writes/minute rate limit; silent drop behavior; coalesce pattern
- stack-checklist.html (grep lines 1949–2012) — V1 schema: STORE_KEY, defaultState() shape, migrate() function, saveStateDebounced pattern — VERIFIED in codebase

### Tertiary (LOW confidence — training knowledge, not verified this session)

- Zustand StateStorage interface pattern — cross-referenced with deepwiki.com/pmndrs/zustand/3.1-persist-middleware; confirmed getItem/setItem/removeItem signatures
- valibot v1 `InferOutput` type inference — confirmed at valibot.dev/guides/schemas/
- `crypto.randomUUID()` availability in MV3 extension contexts

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — vitest-chrome, zustand, valibot all confirmed on npm registry with correct repos and expected download volumes; versions verified via `npm view`
- V1 Schema: HIGH — extracted directly from `stack-checklist.html` source code via grep
- Architecture: MEDIUM — based on CONTEXT.md locked decisions + chrome.storage.local official docs
- Pitfalls: MEDIUM — rate limits and lifecycle semantics from official Chrome docs; vitest-chrome setup from README
- Code examples: LOW — patterns are plausible given API docs but not end-to-end tested yet; treat as starting points subject to TDD RED phase corrections

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (30 days — chrome.storage.local API is stable; vitest-chrome at 0.1.0 has been static since 2023)
