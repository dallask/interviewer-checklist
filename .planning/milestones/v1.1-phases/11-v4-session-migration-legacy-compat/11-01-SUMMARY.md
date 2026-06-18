---
phase: 11-v4-session-migration-legacy-compat
plan: "01"
subsystem: storage
tags: [valibot, migration, typescript, vitest, schema]

# Dependency graph
requires:
  - phase: storage-types
    provides: V3SessionSchema, V3Session, CustomQuestionSchema, CandidateDetailsSchema
  - phase: data-bank
    provides: DEFAULT_SECTIONS, Section, Topic, Question types
provides:
  - V4QuestionSchema, V4TopicSchema, V4SectionSchema, V4SessionSchema (valibot schemas)
  - V4Question, V4Topic, V4Section, V4Session TypeScript types
  - createDefaultV4Session() factory function
  - migrateV3ToV4() pure migration function
  - V3 session test fixtures (EMPTY, POPULATED, NULL_CANDIDATE)
  - v3-to-v4.test.ts with 38 tests covering all migration behaviors
  - runMigrations() updated to route version:3 to V4, version:4 returns null
affects:
  - 11-02 (MigrationErrorBanner — reads migrationFailedCount from AppState)
  - 11-02 (bootstrap.ts — consumes migrateV3ToV4 and V4Session types)
  - 11-03 (yamlImport.ts — needs remapScoreKeys pattern via reKeyImportResultToV4)
  - any plan referencing V4Session or V4SectionSchema

# Tech tracking
tech-stack:
  added: []
  patterns:
    - V4 valibot schema pattern (nested V4Question/V4Topic/V4Section/V4Session schemas with isDefault boolean)
    - materializeSections() explicit map/spread deep-copy from DEFAULT_SECTIONS with isDefault:true
    - remapScoreKeys() regex re-keying from ${topicId}-N to ${topicId}-qN (D-04 stable ID format)
    - Pure migration function contract: Readonly<V3Session> parameter, no try/catch, no side-effects

key-files:
  created:
    - src/storage/migrations/fixtures/v3-session-fixture.ts
    - src/storage/migrations/v3-to-v4.ts
    - src/storage/migrations/v3-to-v4.test.ts
  modified:
    - src/storage/types.ts
    - src/storage/migrations/index.ts
    - src/storage/migrations/v1-to-v2.test.ts

key-decisions:
  - "V4 schema uses sections:[] (empty array) for new sessions — sections are populated only during migration from V3, not on creation"
  - "remapScoreKeys is not applied to overrides or topicNotes — these use topicId keys (e.g., 'twig') without integer suffixes"
  - "materializeSections uses explicit map/spread instead of JSON.parse/JSON.stringify to preserve readonly types"
  - "version:4 is now the latest — runMigrations({version:4}) returns null; version:3 routes through migrateV3ToV4"

patterns-established:
  - "Stable question ID format: ${topicId}-q${idx} (D-04) — encoded in migration, schema accepts any string"
  - "isDefault:true materialized on all entities (section, topic, question) from DEFAULT_SECTIONS"
  - "Test fixture pattern: Object.freeze on Readonly<V3Session> — 3 fixtures (empty, populated, null-candidate)"
  - "TDD test structure: 9 describe blocks mirroring v2-to-v3.test.ts layout"

requirements-completed: [DATA-01]

# Metrics
duration: 4min
completed: 2026-06-18
---

# Phase 11 Plan 01: V4 Schema Contract & migrateV3ToV4 Summary

**V4SessionSchema (valibot) with materialized sections, isDefault flags (D-02), and stable question IDs (D-04) — migrateV3ToV4() remaps score/note keys from ${topicId}-N to ${topicId}-qN**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-18T08:16:18Z
- **Completed:** 2026-06-18T08:20:00Z
- **Tasks:** 2 of 2
- **Files modified:** 6

## Accomplishments

- V4SessionSchema exported from src/storage/types.ts; v.safeParse(V4SessionSchema, {version:3}) returns {success:false}
- migrateV3ToV4() pure function: remaps 'twig-0' → 'twig-q0' in scores and notes; preserves overrides/topicNotes unchanged; materializes all 9 DEFAULT_SECTIONS with isDefault:true on every entity
- Full test suite: 38 tests across 9 describe blocks — all green; full suite 553/553 passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add V4 valibot schemas, TypeScript types, and factory function to types.ts** - `3362173` (feat)
2. **Task 2: Create v3-session-fixture.ts, migrateV3ToV4() module, and full unit test suite** - `6a347bd` (feat)

## Files Created/Modified

- `src/storage/types.ts` — Added V4QuestionSchema, V4TopicSchema, V4SectionSchema, V4SessionSchema, V4Question, V4Topic, V4Section, V4Session, createDefaultV4Session()
- `src/storage/migrations/fixtures/v3-session-fixture.ts` — V3_SESSION_EMPTY, V3_SESSION_POPULATED, V3_SESSION_NULL_CANDIDATE (Object.freeze fixtures)
- `src/storage/migrations/v3-to-v4.ts` — migrateV3ToV4(), materializeSections(), remapScoreKeys()
- `src/storage/migrations/v3-to-v4.test.ts` — 38 tests across 9 describe blocks
- `src/storage/migrations/index.ts` — Extended MIGRATIONS array with version:3 entry; runMigrations returns V4Session for version:3, null for version:4
- `src/storage/migrations/v1-to-v2.test.ts` — Updated 'already at latest' test from version:3 to version:4 (Rule 1 auto-fix)

## Decisions Made

- V4Session.sections is `[]` for brand-new sessions; sections are only materialized by migrateV3ToV4() at migration time, not by createDefaultV4Session()
- overrides and topicNotes keys are NOT re-keyed by remapScoreKeys — they use topicId keys like 'twig' which have no integer suffix
- materializeSections() uses explicit map/spread (not JSON.parse/stringify) to preserve readonly type correctness
- version:4 is now the latest schema version; runMigrations({version:4,...}) returns null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated v1-to-v2.test.ts 'already at latest' assertion for new version boundary**
- **Found during:** Task 2 (full test suite run)
- **Issue:** `v1-to-v2.test.ts` had a test asserting `runMigrations({version:3})` returns null. After adding the v3→v4 migration entry, version:3 now routes through migrateV3ToV4 (not returning null). The bare `{version:3}` test object had no V3Session fields causing a TypeError in remapScoreKeys.
- **Fix:** Updated the test to check `runMigrations({version:4})` returns null — version:4 is now the latest. The existing test comment "already at latest" is preserved, correctly applying to version:4.
- **Files modified:** `src/storage/migrations/v1-to-v2.test.ts`
- **Verification:** All 553 tests pass after fix
- **Committed in:** `6a347bd` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Auto-fix necessary for correctness — version:4 is now the latest schema version, so the "already at latest" test must use version:4. No scope creep.

## Issues Encountered

None beyond the Rule 1 auto-fix above.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all exported functions are fully implemented. createDefaultV4Session() returns sections:[] which is intentional (populated only by migration, not on new session creation).

## Next Phase Readiness

- V4SessionSchema, V4Session type, and migrateV3ToV4() are ready for consumption by Phase 11 Plans 02-03
- Plan 02 (MigrationErrorBanner + bootstrap.ts update) can proceed — it depends on V4Session and migrateV3ToV4
- Plan 03 (yamlImport reKeyImportResultToV4) can proceed — it depends on the remapScoreKeys pattern (now documented in PATTERNS.md)
- 553/553 tests passing; no regressions introduced

---
*Phase: 11-v4-session-migration-legacy-compat*
*Completed: 2026-06-18*
