---
phase: 07-yaml-import-export
plan: "01"
subsystem: utils
tags:
  - yaml
  - export
  - import
  - tdd
  - pure-functions
dependency_graph:
  requires:
    - src/storage/types.ts
    - src/data/bank/index.ts
    - src/data/bank/types.ts
  provides:
    - src/utils/yamlExport.ts
    - src/utils/yamlImport.ts
  affects:
    - ActionsGroup.tsx (plan 07-02 wires these exports)
    - src/store/app.ts (plan 07-02 adds importSession action consuming ImportResult)
tech_stack:
  added:
    - js-yaml 4.2.0 (runtime dep — YAML serialization/deserialization)
    - "@types/js-yaml 4.0.9 (devDep — TypeScript declarations)"
  patterns:
    - TDD RED-GREEN-REFACTOR per-task cycle
    - Pure utility functions (no React/DOM/storage dependencies)
    - Discriminated union return type for parseYaml error handling
    - Last-write-wins for duplicate structural YAML topic IDs
key_files:
  created:
    - src/utils/yamlExport.ts
    - src/utils/yamlExport.test.ts
    - src/utils/yamlImport.ts
    - src/utils/yamlImport.test.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Score key format confirmed as topicId-questionIndex (no sectionId prefix), matching live store"
  - "js-yaml 4.2.0 serializes null as 'null' not '~' — tests updated to assert 'null'"
  - "MAX_YAML_BYTES = 1_048_576 exported from yamlImport.ts for file-picker size guard (T-07-02)"
  - "parseStructural custom question IDs regenerated on import (new Date.now()) to prevent stale ID collisions on re-import"
metrics:
  duration_minutes: 4
  completed_date: "2026-06-17T14:08:07Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 2
---

# Phase 7 Plan 01: YAML Export/Import Pure Utilities Summary

**One-liner:** Pure YAML I/O utilities using js-yaml 4.2.0 — exportSession (V3Session→YAML string with topicId-questionIndex keys) and importSession parsers (parseYaml/detectFormat/parseLegacy/parseStructural) with TDD coverage.

## What Was Built

Two pure utility modules with zero React/DOM/storage dependencies, tested with Vitest TDD:

### `src/utils/yamlExport.ts`
- `exportSession(session, sessionName, sections): string` — serializes V3Session to structural YAML via js-yaml `dump()`
- `buildFilename(sessionName): string` — sanitizes name (strips specials, replaces spaces with dashes), appends YYYY-MM-DD date
- `downloadYaml(content, filename): void` — Blob + URL.createObjectURL download helper (DOM side-effect, not unit-tested)
- Score key format: `${topicId}-${questionIndex}` matching the live store (confirmed via src/store/app.ts line 68)

### `src/utils/yamlImport.ts`
- `parseYaml(text): { ok: true; value } | { ok: false; error }` — safe js-yaml load() wrapper; no throws
- `detectFormat(parsed)` — returns 'structural' (sections key present), 'legacy', or 'unknown'
- `parseLegacy(yamlObj, sections): ImportPreview` — builds canonical ID set from DEFAULT_SECTIONS; counts matched/unmatched
- `parseStructural(yamlObj, sections): ImportPreview` — round-trips scores/notes/overrides/customQuestions; last-write-wins on duplicate topic IDs
- `MAX_YAML_BYTES = 1_048_576` — exported constant for file-picker size guard (T-07-02 mitigation)
- `ImportResult` and `ImportPreview` types exported for store and modal consumption

## Tests

| File | Tests | Result |
|------|-------|--------|
| yamlExport.test.ts | 9 | All pass |
| yamlImport.test.ts | 14 | All pass |
| Full suite (30 files) | 423 | All pass — no regressions |

Key test assertions:
- `parseLegacy` with LEGACY_FIXTURE (twig-0, twig-4, twig-10, nonexistent-topic-0): modifiedCount=3, unmatchedCount=1
- `parseStructural` round-trip: export → load() → parseStructural → scores match original
- `parseStructural` duplicate topic IDs: last-write-wins (score 9 overwrites score 5)
- `parseYaml` malformed YAML returns `{ ok: false, error }` — no throw

## Commits

| Hash | Message |
|------|---------|
| 65c0868 | feat(07-01): install js-yaml and implement yamlExport.ts with TDD |
| 2018694 | feat(07-01): implement yamlImport.ts with TDD — parseYaml, detectFormat, parseLegacy, parseStructural |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] js-yaml 4.2.0 serializes null as "null" not "~"**
- **Found during:** Task 1 (GREEN phase verification)
- **Issue:** RESEARCH.md states "Null values serialize as ~ automatically in js-yaml 4.x" but js-yaml 4.2.0 actually outputs `null` as the string `null`, not `~`.
- **Fix:** Updated yamlExport.test.ts assertion from `expect(result).toContain('score: ~')` to `expect(result).toContain('score: null')`. The implementation code is correct (passes null values through); only the test assertion needed updating.
- **Files modified:** src/utils/yamlExport.test.ts
- **Commit:** 65c0868

**2. [Rule 3 - Blocking] `await import()` in non-async test function**
- **Found during:** Task 1 and Task 2 RED phase
- **Issue:** Tests using `const { load } = await import('js-yaml')` inside a synchronous `it()` block triggered a build error ("Either remove this `await` or add the `async` keyword to the enclosing function") from the oxc transformer.
- **Fix:** Moved js-yaml `load` import to a top-level static import in yamlImport.test.ts. In yamlExport.test.ts the round-trip test was simplified to avoid needing the import.
- **Files modified:** src/utils/yamlImport.test.ts, src/utils/yamlExport.test.ts
- **Commit:** 65c0868, 2018694

## Known Stubs

None. All exported functions are fully implemented — no placeholder values, no TODOs, no hardcoded returns.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes beyond what the plan's threat model already covers. The `MAX_YAML_BYTES` guard is exported as required by T-07-02. The `parseYaml` wrapper uses js-yaml `load()` in JSON_SCHEMA mode (T-07-01 mitigated). Prototype pollution not possible via js-yaml 4.x JSON_SCHEMA (T-07-04 accepted risk).

## Self-Check: PASSED
