# Phase 11: V4 Session Migration & Legacy Compat - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 11-v4-session-migration-legacy-compat
**Areas discussed:** Materialization shape, Migration safety & failure handling, Legacy YAML compat behavior

---

## Materialization shape (sections/topics/questions in V4)

### Q1.1 — What shape should V4 sessions use for sections/topics?

| Option | Description | Selected |
|--------|-------------|----------|
| Full materialization | Deep copy of DEFAULT_SECTIONS (sections + topics + questions) into each session; `isDefault` flag distinguishes default from user-added | ✓ |
| Delta-only | Track `addedSections[]`, `removedSectionIds[]`, etc., compose at runtime against DEFAULT_SECTIONS | |
| Hybrid | Section/topic metadata in session, questions still referenced from DEFAULT_SECTIONS + deltas | |
| Other | User-described shape | |

**User's choice:** Full materialization.
**Notes:** Simplifies Phase 14 (BANK-05 delete-default-question = array splice, no tombstoning) and YAML-04 (text/level already in session, no derivation). Storage cost accepted.

### Q1.2 — How should V4 mark which sections/topics/questions came from the default bank?

| Option | Description | Selected |
|--------|-------------|----------|
| `isDefault: boolean` flag | Uniform array; simple gating logic | ✓ |
| Separate `defaultSections[]` + `customSections[]` arrays | Type-level distinction; harder ordering | |
| ID-prefix convention (`default-` vs `custom-`) | No schema overhead; brittle if renamed | |
| Other | | |

**User's choice:** `isDefault: boolean` flag.
**Notes:** Minimal schema overhead; matches Phase 14's per-row UI gating model.

### Q1.3 — Where should V4 store per-question scores/notes and per-topic overrides/notes?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep sparse maps (re-keyed to stable IDs) | `Record<string, ...>` at session root; minimal V3 churn | ✓ |
| Embed score/note inline on entity | Single source of truth; bigger entities; tree-deep updates | |
| Hybrid (score inline, notes sparse) | Hot/cold split; inconsistent rule | |
| Other | | |

**User's choice:** Sparse maps.
**Notes:** Preserves V3 hot-update perf, simplifies score-aggregation paths used by Phase 13 counts.

### Q1.4 — What ID format should default questions get when materialized?

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze current index: `${topicId}-q${originalBankIndex}` | Migrate score keys 1:1; `q` prefix separates from `custom-` | ✓ |
| Random stable ID: `${topicId}-q-${nanoid(8)}` | Fully decoupled from bank order; opaque IDs | |
| Keep `${topicId}-${index}` as-is | Zero score-key rewrite; semantics drift on delete | |
| Other | | |

**User's choice:** Freeze current index with `q` prefix.

---

## Continuation decision

| Option | Description | Selected |
|--------|-------------|----------|
| Continue with migration safety + legacy YAML | Cover the remaining success-criteria-driving areas | ✓ |
| Just migration safety, skip legacy YAML | | |
| Just legacy YAML, skip migration safety | | |
| Stop and write CONTEXT.md now | | |

---

## Migration safety & failure handling

### Q2.1 — Snapshot/backup policy at V3→V4 migration?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-migration snapshot per session (`snapshot:<id>:pre-v4-<ts>`) | Bypasses 3-snapshot rotation; max safety; ~doubles storage briefly | ✓ |
| One global `recovery:pre-v4-<ts>` blob | Atomic backup; harder selective recovery | |
| No pre-migration snapshot | Trust existing rotation + valibot validation | |
| Other | | |

**User's choice:** Per-session pre-v4 snapshot.

### Q2.2 — If migration fails for one session, what should happen?

| Option | Description | Selected |
|--------|-------------|----------|
| Skip broken, continue rest, non-blocking banner | Preserves working sessions; surfaces failure | ✓ |
| Halt app, recovery screen | Forces attention; blocks working sessions | |
| Skip silently, only console.error | Smoothest UX; no user signal | |
| Other | | |

**User's choice:** Skip + non-blocking banner.
**Notes:** Broken session stays in storage as V3, excluded from active manifest; snapshot referenced in banner.

### Q2.3 — Eager or lazy migration?

| Option | Description | Selected |
|--------|-------------|----------|
| Eager at bootstrap | All V3 sessions migrate on first v1.1 load; clean invariant downstream | ✓ |
| Lazy on access | Only active migrates eagerly; others on session switch | |
| Other | | |

**User's choice:** Eager at bootstrap.

---

## Legacy YAML compat behavior

### Q3.1 — How should YAML imports produce V4 sessions for both legacy and v1.0-structural formats?

| Option | Description | Selected |
|--------|-------------|----------|
| Import → V3 intermediate → run V3→V4 migration | Single shared codepath; future-proof | ✓ |
| Import → V4 directly (parsers know about V4) | One fewer step; duplicates materialization logic | |
| Split: legacy via migration, structural V4-native | Optimizes hot path; two patterns | |
| Other | | |

**User's choice:** V3 intermediate → migration.
**Notes:** Maximizes reuse; the V3→V4 migration becomes the single materialization implementation in the codebase.

---

## Claude's Discretion

- Snapshot purge policy beyond v1.1 — left indefinite for now, revisit in v1.2.
- Banner copy / styling — planner's call.
- Internal nested vs flat representation of materialized sections — mirror existing `DEFAULT_SECTIONS` nested shape.
- Manifest version bump — only if shape changes; left alone otherwise.
- Exact valibot schema layout details.

## Deferred Ideas

- Snapshot purge strategy (v1.2+).
- YAML EXPORT schema changes (Phase 14).
- Manifest schema bump (only if Phase 14 needs it).
- Reset-to-bank affordance for deleted defaults (v1.2+).
- Cross-session shared editable bank (v2).
