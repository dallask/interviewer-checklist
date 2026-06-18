# Phase 11: V4 Session Migration & Legacy Compat - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 delivers a forward-only V3 → V4 session migration plus the legacy YAML import compatibility surface needed to honor v1.0 users.

**In scope:**
- New V4 `Session` schema with materialized sections / topics / questions (the editable bank shape)
- `migrateV3ToV4()` module plus its hook-up in `runMigrations()`
- Pre-migration per-session snapshot (`snapshot:<id>:pre-v4-<ts>`) and a non-blocking error banner for sessions that fail to migrate
- Update of `parseLegacy()` / `parseStructural()` so YAML imports produce V3 intermediates that pass through the V3→V4 migration on the way to storage
- Tests covering: V3→V4 migration unit tests; bootstrap end-to-end with mixed-version manifests; legacy YAML import → V4; v1.0-structural YAML import → V4; failure path leaves session unchanged and surfaces banner

**Out of scope (belongs to later phases):**
- UI affordances to add / remove sections / topics / default questions (Phase 14 — BANK-01..05)
- YAML EXPORT schema changes (Phase 14 — YAML-04..06). Phase 11 only changes the IMPORT side.
- Filter UI consuming V4 counts (Phase 13 — UI-16, UI-17)
- Sidebar shell / compact card / about modal (Phase 15)

</domain>

<decisions>
## Implementation Decisions

### V4 Schema Shape

- **D-01: Full materialization.** On migration, each session deep-copies `DEFAULT_SECTIONS` (sections, topics, AND questions) into `session.sections[]`. Sessions become self-contained — the bundled bank is read only at materialization time. Future bank-text changes do not retroactively rewrite stored sessions.
- **D-02: `isDefault: boolean` flag on every entity** (Section, Topic, Question). Set `true` at migration; user-added entities get `false`. Phase 14 will gate the "remove section/topic" affordance on `!isDefault`. (Default questions remain removable per BANK-05 — that's a separate UI gate, not a schema gate.)
- **D-03: Scores / overrides / notes stay as sparse `Record<string, ...>` maps at session root**, preserving the V3 update pattern. Re-keyed to the new stable IDs during migration. Single source of truth for hot updates; no entity-tree rewrite on every score change.
- **D-04: Default-question stable ID format = `${topicId}-q${originalBankIndex}`.** At migration, each materialized default question is assigned `id` based on its current position in `DEFAULT_SECTIONS`. Score keys migrate `${topicId}-${idx}` → `${topicId}-q${idx}` 1:1. The `q` prefix cleanly separates from `custom-${topicId}-${seq}`. Existing custom-question IDs are NOT rewritten.

### Migration Safety

- **D-05: Per-session pre-migration snapshot.** Before each V3→V4 migration, write `snapshot:<sessionId>:pre-v4-<ts>` containing the raw V3 payload. This bypasses the 3-snapshot rotation so the original is recoverable even after subsequent edits. Cleanup policy: keep indefinitely for v1.1; revisit purge in v1.2.
- **D-06: Skip-and-continue on per-session failure.** If a session fails validation or migration, leave its V3 payload untouched in storage, exclude it from the active manifest list for this load, log to console, and show a non-blocking banner: *"N sessions couldn't be upgraded — your other sessions are loaded. A backup is stored at snapshot:<id>:pre-v4."* Other sessions continue loading normally.
- **D-07: Eager migration at bootstrap.** `runMigrations()` walks every session in the manifest on first v1.1 load. After bootstrap, no V3 sessions exist in active storage (only in `snapshot:*:pre-v4-*`). Downstream code can assume V4 everywhere. Migration is pure JS work; expected to be sub-second for typical 1–5 session counts.

### Legacy YAML Compatibility

- **D-08: YAML imports build a V3 intermediate, then run V3→V4 migration.** Both `parseLegacy()` and `parseStructural()` continue to produce a V3-shaped object; we then feed it through `runMigrations()` like any stored V3 session. Single materialization code path; one place to maintain. The future Vn→Vn+1 migrations will compose for free.
- **D-09: Imported YAML does NOT get a pre-v4 snapshot.** Snapshots exist to protect data that's already in user storage from being lost. Imports are user-initiated and the source file is still on disk — no snapshot needed.

### Claude's Discretion

- Snapshot purge policy beyond v1.1 (D-05). Leave indefinite for now; revisit when v1.2 schema work begins.
- The exact wording / placement of the failure banner (D-06). Banner copy and styling left to the planner.
- Whether to use a nested or flat representation for materialized sections internally (current `DEFAULT_SECTIONS` is nested `Section { topics: Topic[] { questions: Question[] } }` — mirror it).
- Whether to bump the `manifest` schema (currently `version: 2`). If no manifest-shape change is needed, leave it; otherwise the planner bumps it.
- Exact valibot schema layout — the `runMigrations()` pattern is the constraint; field-level structure is mechanical.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements & scope

- `.planning/REQUIREMENTS.md` §Data & YAML — DATA-01 and DATA-02 are this phase's locked requirements
- `.planning/ROADMAP.md` §Phase 11 — Goal + 4 success criteria are the verification target
- `.planning/PROJECT.md` §Current Milestone — milestone-level constraints (CWS update, legacy YAML compat as regression boundary)

### Original v1.0 storage / migration design (prior art to reuse)

- `.planning/milestones/v1.0-phases/03-storage-layer-migration-bootstrap/03-CONTEXT.md` — original schema design, why sparse maps, why the manifest split
- `.planning/milestones/v1.0-phases/03-storage-layer-migration-bootstrap/03-RESEARCH.md` — chrome.storage.local patterns + snapshot rationale
- `.planning/milestones/v1.0-phases/03-storage-layer-migration-bootstrap/03-PATTERNS.md` — runMigrations() pattern documentation

### V1.0 UAT source-of-truth (the upstream of v1.1)

- `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` — Gap list + enhancement requests; D4 and E4 are the direct drivers for the editable-bank shape

### Implementation files to extend

- `src/storage/types.ts` — V3SessionSchema (lines ~92–206); add V4SessionSchema here
- `src/storage/migrations/index.ts` — runMigrations() routing; add `{ fromVersion: 3, fn: migrateV3ToV4 }` entry
- `src/storage/migrations/v2-to-v3.ts` — template for the v3-to-v4 module
- `src/storage/bootstrap.ts` — call site that invokes migrations across all sessions
- `src/data/bank/index.ts` — DEFAULT_SECTIONS is the source the materialization deep-copies from
- `src/utils/yamlImport.ts` — `detectFormat()`, `parseLegacy()`, `parseStructural()`; change the trailing return path to feed through runMigrations()

### Tests to extend or add

- `src/storage/migrations/v2-to-v3.test.ts` — pattern reference for the new v3-to-v4 test
- `src/storage/bootstrap.test.ts` — extend with mixed-version manifest scenarios + failed-migration scenarios
- `src/utils/yamlImport.test.ts` — extend with V4 expectations on both legacy and structural fixtures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `runMigrations(raw: unknown)` in `src/storage/migrations/index.ts` — append the v3-to-v4 entry; no new dispatcher needed.
- `migrateV2ToV3()` in `src/storage/migrations/v2-to-v3.ts` — direct template for `migrateV3ToV4()` (same shape: pure function, takes V3 payload, returns V4 payload).
- Snapshot adapter API in `src/storage/adapter.ts` — already writes `snapshot:<id>:<ts>` keys; reuse the writer with a custom timestamp suffix (`pre-v4-<ts>`) and skip the 3-snapshot rotation by writing through a one-off path.
- `CustomQuestionSchema` (`src/storage/types.ts` ~lines 113–123) — the editable-entity pattern V4 sections/topics will mirror (`id`, `topicId`, `text`, `level`).
- `DEFAULT_SECTIONS` (`src/data/bank/index.ts`) — readonly nested structure that the deep-copy walks once per session at migration.

### Established Patterns

- Forward-only migration chain in `MIGRATIONS` array — no downgrade path, no parallel branches. V3→V4 fits cleanly.
- valibot schemas as runtime-validated truth (`V3SessionSchema`); V4SessionSchema must validate every materialized session before write.
- Sparse `Record<string, ...>` maps for hot data (scores, notes); the new V4 keeps this for the same hot-update reason.
- YAML import format detection happens once in `detectFormat()`; the per-format parser is responsible for the shape it returns.

### Integration Points

- `bootstrap.ts` orchestrates: read manifest → for each session id → load → migrate → validate → activate. Pre-migration snapshot insertion fits between "load" and "migrate".
- `yamlImport.ts` import handler in the UI calls into `parseLegacy` / `parseStructural` then hands off to the store. The "feed through runMigrations" step inserts between parser output and store hand-off.
- Zustand session store consumes V3 today. V4 changes its TypeScript types; component reads change minimally because score/note maps stay sparse — only section/topic reads switch from `DEFAULT_SECTIONS` to `session.sections`.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly chose to preserve the sparse-map architecture rather than embedding scores on the question entity. Reason: minimal V3→V4 churn for score-update paths, predictable perf, easier YAML round-trip later.
- The stable-id `q` prefix is intentional — it mirrors the existing `custom-` prefix and makes IDs self-describing in logs / DevTools / YAML.
- Failure UX is a non-blocking banner, not a modal — the user prefers keeping the app usable when only some sessions fail to migrate.

</specifics>

<deferred>
## Deferred Ideas

- **Snapshot purge policy** — keep `snapshot:*:pre-v4-*` indefinitely in v1.1. A purge strategy ("delete after N successful loads" or "delete on user opt-in") is a v1.2+ concern.
- **YAML export schema changes** — Phase 14 (YAML-04, YAML-05, YAML-06). Phase 11 only changes the import side; the v1.1 export schema bumps in Phase 14 once BANK-01..05 are also in.
- **Manifest schema bump** — only if Phase 14 needs new manifest-level fields. Currently manifest stays at `version: 2`.
- **Reset-to-bank affordance** — distinct from migration; future v1.2+ if users request "restore default questions I deleted".
- **Cross-session bank sharing** — sessions today are independent. If users later want a shared editable bank across all their sessions, that's a v2 design conversation.

</deferred>

---

*Phase: 11-v4-session-migration-legacy-compat*
*Context gathered: 2026-06-18*
