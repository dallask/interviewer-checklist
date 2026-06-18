# Phase 7: YAML Import & Export - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 delivers YAML export of the active session and YAML import with a preview step, supporting both the current structural format and a legacy progress-only format. No new storage model changes — this phase reads from/writes to existing `session:<id>` + manifest keys. A single new npm dependency (`js-yaml`) is added. UI surface: two buttons in ActionsGroup (Export YAML, Import YAML) plus a lightweight native `<dialog>` for the import preview.

</domain>

<decisions>
## Implementation Decisions

### Export Mechanism & Trigger
- Export trigger: **ActionsGroup sidebar button** ("Export YAML"), consistent with the Phase 5/6 button pattern
- YAML library: **`js-yaml` npm package** — mature, well-typed, single purpose; add as a runtime dependency
- Export scope: **active session only** (per ROADMAP goal — users export what they're currently working on)
- Filename format: **`interview-{sessionName}-{YYYY-MM-DD}.yaml`** (e.g., `interview-Alice Smith-2026-06-17.yaml`); sanitize session name for filesystem safety (replace spaces, remove special chars)

### Import Preview & Conflict Resolution
- Session target on import: **new session by default**, with a toggle to "overwrite active session" — user can choose; default protects existing data
- Preview content: **summary counts only** — "Will modify N questions, add M custom questions, X unmatched (skipped)" — no per-question diff
- Unmatched questions: **skipped silently** — count shown in preview, no error or placeholder creation
- Import trigger UI: **ActionsGroup "Import YAML" button** opens a hidden `<input type="file" accept=".yaml,.yml">` via `.click()`; file reading via `FileReader.readAsText()`

### Legacy Format & ID Derivation
- Stable question ID scheme: **`${sectionId}-${topicId}-${questionIndex}`** — same deterministic scheme already used by the store (no hashing, no new field)
- Format detection: presence of `sections` key → structural YAML; absence (only `scores`/top-level progress data) → legacy progress-only format
- Import UI: **native `<dialog>` modal** — shows preview counts + "Create new session" / "Overwrite active session" toggle + Confirm / Cancel buttons
- Custom questions in export: **yes** — custom questions are first-class scoring data and belong in the YAML output

### Claude's Discretion
- Exact YAML schema field names (e.g., `sessionName` vs `session_name`)
- How to represent null scores vs scored 0 in YAML (suggest `~` for null, `0` for zero)
- Order of sections in exported YAML (suggest ROADMAP order)
- Error messages for malformed YAML (parse failures, schema validation failures)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActionsGroup.tsx` — existing sidebar; Export/Import buttons go here alongside Phase 5/6 buttons
- `storageAdapter.read(keys)` — reads `session:<activeSessionId>` for export input
- `src/store/app.ts` — `createSession()` and `switchSession()` for import post-processing
- `src/storage/types.ts` — V3Session, CustomQuestion, CandidateDetails — export schema derives from these
- `V2Session.id` scheme: `${sectionId}-${topicId}-${questionIndex}` — reuse for legacy ID matching
- `src/data/bank/index.ts` — `DEFAULT_SECTIONS` — used during import to match incoming YAML to built-in questions
- Native `<dialog>` + focus trap pattern — established in Phase 5 (CandidateModal) and Phase 6 (SessionSwitcherModal); ImportPreviewModal follows the same pattern

### Established Patterns
- `useRef<HTMLDialogElement | null>` + `dialogRef.current?.showModal()` — import preview modal follows this
- `<input type="file" accept=".yaml,.yml" ref={fileInputRef}>` + `.click()` triggered from button — standard headless file picker
- `FileReader.readAsText(file)` for reading file content client-side
- URL.createObjectURL + `<a>.click()` for downloading files from the extension (no server needed)
- js-yaml: `jsyaml.dump(obj, { noRefs: true, lineWidth: 80 })` for export; `jsyaml.load(text)` for import

### Integration Points
- `ActionsGroup.tsx` — add Export + Import buttons + hidden file input + `<ImportPreviewModal dialogRef={...} />`
- `src/utils/yamlExport.ts` (new) — pure function `exportSession(session: V3Session, sections: Section[]): string`
- `src/utils/yamlImport.ts` (new) — pure functions `detectFormat(yaml: unknown)`, `parseStructural(yaml)`, `parseLegacy(yaml)`
- `src/store/app.ts` — new `importSession(data: ImportResult): Promise<void>` action
- `src/components/ImportPreviewModal.tsx` (new) — native dialog with preview + toggle + confirm/cancel

</code_context>

<specifics>
## Specific Ideas

- The import preview must show the toggle before applying — no silent overwrite
- Legacy ID matching: iterate `DEFAULT_SECTIONS`, build `${sectionId}-${topicId}-${questionIndex}` for each built-in question, look up in incoming `scores` map
- The STATE.md note about needing a "real prototype-export YAML corpus" means the fixture test for legacy ID normalization should use a realistic multi-section fixture, not a trivial one
- `js-yaml` v4.x uses ES module friendly exports — check package.json type settings for correct import path (likely `import jsyaml from 'js-yaml'`)

</specifics>

<deferred>
## Deferred Ideas

- Import from URL (fetch a YAML from a remote endpoint) — deferred beyond this milestone
- Merge mode (merge imported scores with existing, keeping higher score) — deferred
- Export all sessions as a ZIP — deferred
- YAML validation schema with published JSON Schema — deferred
- Per-question diff in import preview — deferred

</deferred>
