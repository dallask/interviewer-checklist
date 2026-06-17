# Phase 7: YAML Import & Export - Research

**Researched:** 2026-06-17
**Domain:** YAML serialization/deserialization, Chrome extension file I/O, React native dialog pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Export trigger: ActionsGroup sidebar button ("Export YAML"), consistent with the Phase 5/6 button pattern
- YAML library: `js-yaml` npm package — mature, well-typed, single purpose; add as a runtime dependency
- Export scope: active session only
- Filename format: `interview-{sessionName}-{YYYY-MM-DD}.yaml`; sanitize session name for filesystem safety
- Session target on import: new session by default, with a toggle to "overwrite active session"
- Preview content: summary counts only — "Will modify N questions, add M custom questions, X unmatched (skipped)"
- Unmatched questions: skipped silently — count shown in preview, no error or placeholder creation
- Import trigger UI: ActionsGroup "Import YAML" button opens a hidden `<input type="file" accept=".yaml,.yml">` via `.click()`; file reading via `FileReader.readAsText()`
- Stable question ID scheme: `${sectionId}-${topicId}-${questionIndex}` — same deterministic scheme already used by the store
- Format detection: presence of `sections` key → structural YAML; absence → legacy progress-only format
- Import UI: native `<dialog>` modal — shows preview counts + "Create new session" / "Overwrite active session" toggle + Confirm / Cancel buttons
- Custom questions in export: yes — included as first-class scoring data

### Claude's Discretion
- Exact YAML schema field names (e.g., `sessionName` vs `session_name`)
- How to represent null scores vs scored 0 in YAML (suggest `~` for null, `0` for zero)
- Order of sections in exported YAML (suggest ROADMAP order)
- Error messages for malformed YAML (parse failures, schema validation failures)

### Deferred Ideas (OUT OF SCOPE)
- Import from URL (fetch a YAML from a remote endpoint)
- Merge mode (merge imported scores with existing, keeping higher score)
- Export all sessions as a ZIP
- YAML validation schema with published JSON Schema
- Per-question diff in import preview
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YAML-01 | YAML export of active session in full structural format — meta, candidate, sections with id/title/icon, topics, questions with scores/overrides/notes/custom flag | Export schema design, js-yaml `dump()` API, `URL.createObjectURL` download pattern |
| YAML-02 | YAML import supports both full structural format and legacy progress-only format; uses stable `deriveId(group, topic, question)` with normalization for ID matching; deduplicates on re-import | Format detection logic, legacy ID derivation algorithm, `DEFAULT_SECTIONS` iteration strategy |
| YAML-03 | Import shows a preview modal ("will modify N questions, add M, X unmatched") before applying; import target defaults to a new session | `ImportPreviewModal` native dialog pattern, counting algorithm, `importSession` action design |
</phase_requirements>

---

## Summary

Phase 7 is a pure I/O phase: read `V3Session` from the Zustand store, serialize it to a structured YAML file via `js-yaml`, and download it. Import reverses the flow: parse YAML via `js-yaml`, detect format, derive question IDs from `DEFAULT_SECTIONS`, compute preview counts, present a native dialog, then write data via existing `createSession`/`switchSession` store actions. No new storage schema changes are required.

The primary complexity lives in two pure utility modules: `yamlExport.ts` (V3Session → YAML string) and `yamlImport.ts` (YAML string → ImportResult). The store gets one new action (`importSession`) and the UI gets two new buttons plus one new modal component (`ImportPreviewModal`). All patterns are established by Phases 5–6: native `<dialog>` with `useRef`, focus trap via `useEffect`, file download via `URL.createObjectURL`, file pick via hidden `<input type="file">`.

The STATE.md concern about a "real prototype-export YAML corpus" applies to the fixture test for `parseLegacy`: the fixture must span all 9 bank sections with realistic question IDs (e.g., `frontend-twig-0`, `backend-drupal_core-2`) to validate the ID-derivation normalization path. A trivial single-topic fixture will miss edge cases in sections with many topics.

**Primary recommendation:** Implement `yamlExport.ts` and `yamlImport.ts` as pure functions with no React dependencies, test them with Vitest using a multi-section fixture, then wire UI from `ActionsGroup.tsx`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| YAML serialization (export) | Pure utility module (`yamlExport.ts`) | — | No browser/storage dependency; pure transform of V3Session → string |
| YAML deserialization + format detection | Pure utility module (`yamlImport.ts`) | — | No React dependency; testable in isolation |
| File download (export) | Browser / Client (component) | — | `URL.createObjectURL` + `<a>.click()` is client-side only |
| File pick (import) | Browser / Client (component) | — | `<input type="file">` + `FileReader` is client-side only |
| Import preview + confirm | Browser / Client (modal component) | — | Native `<dialog>` pattern already established |
| Store mutation on import | API / Store (`app.ts`) | — | `importSession` action owns write path via existing `createSession`/`switchSession` |
| Auto-snapshot before import | Storage adapter | Store action | `storageAdapter.snapshot()` must fire before any store mutation (same as resetAll) |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `js-yaml` | 4.2.0 | YAML serialization / deserialization | Locked decision; YAML 1.2 compliant; 254M weekly downloads; 15-year-old package [VERIFIED: npm registry — legitimate (see audit)] |
| `@types/js-yaml` | 4.0.9 | TypeScript declarations for js-yaml | `js-yaml` 4.2.0 ships no bundled `.d.ts`; DefinitelyTyped package required [VERIFIED: npm registry — verdict OK] |

### Supporting (already installed — no new deps)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `valibot` | ^1.4.1 | Runtime schema validation for parsed YAML | Validate import payload before writing to store; same pattern as V3SessionSchema |
| `vitest` | ^4.1.9 | Unit tests for pure export/import utilities | All logic in `yamlExport.ts` / `yamlImport.ts` |
| `react` | ^19.2.7 | `ImportPreviewModal` component | Follows CandidateModal / SessionSwitcherModal pattern exactly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `js-yaml` | `yaml` (eemeli) | STATE.md decision log lists "yaml (eemeli)" as stack-locked alternative, but CONTEXT.md explicitly locks `js-yaml`; per CONTEXT.md wins |
| Native `FileReader` | `file-saver` npm | `file-saver` adds dependency; `URL.createObjectURL` + `<a>.click()` is standard and already implied by CONTEXT.md patterns |

**Installation:**
```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

**Version verification:**
```
js-yaml:        4.2.0 (published 2026-05-31 — 4.2.0 is a minor release of a package created 2011; legitimate)
@types/js-yaml: 4.0.9 (published 2023-11-07 — DefinitelyTyped; OK)
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `js-yaml` | npm | 15 yrs (2011) | 254M/wk | github.com/nodeca/js-yaml | SUS (too-new signal on 4.2.0 publish date) | **Approved** — seam flagged "too-new" because 4.2.0 was published 2026-05-31; package itself created 2011, 254M weekly downloads, well-known repo. The recent patch is a routine maintenance release, not a new package. |
| `@types/js-yaml` | npm | ~8 yrs | 14.9M/wk | github.com/DefinitelyTyped/DefinitelyTyped | OK | Approved |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `js-yaml` 4.2.0 was flagged "too-new" by the seam's recency heuristic. Manual review confirms legitimacy: created 2011, 254M weekly downloads, no postinstall script, canonical GitHub repo. No checkpoint required.

---

## Architecture Patterns

### System Architecture Diagram

```
ActionsGroup.tsx
├── [Export YAML button]
│     └── reads V3Session from Zustand store
│           └── yamlExport.ts::exportSession(session, sections)
│                 └── js-yaml.dump(yamlDoc, { noRefs: true, lineWidth: 80 })
│                       └── URL.createObjectURL(blob) → <a>.click() → download
│
└── [Import YAML button]
      └── hidden <input type="file"> → FileReader.readAsText()
            └── yamlImport.ts::detectFormat(parsed) → 'structural' | 'legacy'
                  ├── parseStructural(yaml) → ImportResult
                  │     └── iterate sections in YAML → match scores/notes by ID
                  └── parseLegacy(yaml) → ImportResult
                        └── iterate DEFAULT_SECTIONS → derive IDs → look up in yaml.scores
                              └── compute counts: modified, added (custom), unmatched
                                    └── ImportPreviewModal
                                          └── user confirms → importSession(ImportResult)
                                                └── storageAdapter.snapshot()  [STORE-05]
                                                └── createSession() or switchSession()
                                                └── set({scores, overrides, notes, ...})
```

### Recommended Project Structure
```
src/
├── utils/
│   ├── yamlExport.ts        # Pure: V3Session + Section[] → YAML string
│   └── yamlImport.ts        # Pure: YAML string → ImportResult (detectFormat, parseStructural, parseLegacy)
├── components/
│   └── ImportPreviewModal.tsx  # Native <dialog>, preview counts, toggle, confirm/cancel
└── store/
    └── app.ts               # extend: add importSession action
```

### Pattern 1: YAML Export — js-yaml dump
**What:** Serialize a structured YAML document from V3Session plus bank metadata.
**When to use:** Export YAML button clicked.

```typescript
// Source: js-yaml README (github.com/nodeca/js-yaml)
import jsyaml from 'js-yaml';

export function exportSession(session: V3Session, sections: readonly Section[]): string {
  const doc = buildYamlDocument(session, sections);
  return jsyaml.dump(doc, { noRefs: true, lineWidth: 80 });
}
```

`jsyaml.dump` options:
- `noRefs: true` — prevents `&anchor` / `*alias` syntax (YAML references); produces human-readable flat output [ASSUMED]
- `lineWidth: 80` — wraps long strings at 80 chars; set to `-1` to disable [ASSUMED]
- Null values serialize as `~` by default in js-yaml 4.x [ASSUMED]

### Pattern 2: YAML Import — js-yaml load + format detection

```typescript
// Source: js-yaml README (github.com/nodeca/js-yaml)
import jsyaml from 'js-yaml';

export function parseYaml(text: string): unknown {
  // jsyaml.load throws on malformed YAML — wrap in try/catch at call site
  return jsyaml.load(text);
}

export function detectFormat(parsed: unknown): 'structural' | 'legacy' | 'unknown' {
  if (typeof parsed !== 'object' || parsed === null) return 'unknown';
  const obj = parsed as Record<string, unknown>;
  // Locked decision: presence of 'sections' key → structural
  return 'sections' in obj ? 'structural' : 'legacy';
}
```

### Pattern 3: File Download (no server, MV3 compatible)

```typescript
// Source: established in CONTEXT.md patterns; URL.createObjectURL is standard browser API [ASSUMED]
function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildFilename(sessionName: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safe = sessionName.replace(/[^a-zA-Z0-9\-_. ]/g, '').replace(/\s+/g, '-');
  return `interview-${safe}-${date}.yaml`;
}
```

### Pattern 4: Hidden File Input (import trigger)

```typescript
// Source: CONTEXT.md established patterns [ASSUMED — browser standard]
const fileInputRef = useRef<HTMLInputElement>(null);

function handleImportClick() {
  fileInputRef.current?.click();
}

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result as string;
    // parse → preview → open modal
  };
  reader.readAsText(file);
  // Reset input so the same file can be re-imported
  e.target.value = '';
}

// In JSX (render hidden, no display):
<input
  type="file"
  accept=".yaml,.yml"
  ref={fileInputRef}
  className="hidden"
  onChange={handleFileChange}
  aria-hidden="true"
  tabIndex={-1}
/>
```

### Pattern 5: ImportPreviewModal — native dialog (copy from CandidateModal)

The modal follows the exact pattern established in `CandidateModal.tsx` and `SessionSwitcherModal.tsx`:

```typescript
// Source: src/components/CandidateModal.tsx + SessionSwitcherModal.tsx [VERIFIED: codebase grep]
interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  preview: ImportPreview | null;
  onConfirm: (overwriteActive: boolean) => Promise<void>;
}

// Focus trap: verbatim copy from CandidateModal.tsx useEffect
// Focus restore on close: document.getElementById('open-import-yaml')?.focus()
// Open: caller calls dialogRef.current?.showModal()
// Never use <dialog open> prop
```

`ImportPreview` type:
```typescript
interface ImportPreview {
  modifiedCount: number;    // built-in question IDs found and mapped
  addedCount: number;       // custom questions in the YAML
  unmatchedCount: number;   // IDs in YAML not found in DEFAULT_SECTIONS
  sessionName: string;      // from YAML meta.sessionName or ''
}
```

### Pattern 6: Legacy ID Derivation Algorithm

The critical logic for YAML-02: iterate `DEFAULT_SECTIONS` to build the canonical ID map used during legacy import:

```typescript
// Source: src/store/app.ts line 68 comment + src/components/QuestionCard.tsx line 33 [VERIFIED: codebase grep]
// ID scheme: `${topicId}-${questionIndex}` (questionIndex = 0-based position in topic.questions)
// NOTE: The store uses `${topicId}-${questionIndex}` WITHOUT sectionId in the key.
// The CONTEXT.md says `${sectionId}-${topicId}-${questionIndex}` but the ACTUAL store key
// (QuestionCard.tsx line 33: `${row.topicId}-${row.index}`) omits sectionId.
// yamlImport.ts must use the actual store key format: `${topicId}-${questionIndex}`.

function buildIdMap(sections: readonly Section[]): Map<string, string> {
  // Maps canonical score key → human-readable label (for debugging)
  // The lookup in parseLegacy is: for each legacy score key, check if it exists in DEFAULT_SECTIONS
  const idSet = new Set<string>();
  for (const section of sections) {
    for (const topic of section.items) {
      topic.questions.forEach((_q, index) => {
        idSet.add(`${topic.id}-${index}`);
      });
    }
  }
  return idSet; // legacy YAML scores keys are matched against this set
}
```

**Critical Finding — ID scheme mismatch in CONTEXT.md:**
CONTEXT.md states the ID scheme is `${sectionId}-${topicId}-${questionIndex}`, but the actual codebase uses `${topicId}-${questionIndex}` (QuestionCard.tsx line 33, store/app.ts line 68 comment). The `yamlImport.ts` implementation MUST use `${topicId}-${questionIndex}` to match the live store. The YAML export must also use the same scheme. [VERIFIED: codebase grep]

### Pattern 7: importSession Store Action

```typescript
// Follows createSession + switchSession pattern from src/store/app.ts [VERIFIED: codebase grep]
export interface ImportResult {
  scores: Record<string, number | null>;
  overrides: Record<string, number | null>;
  notes: Record<string, string>;
  topicNotes: Record<string, string>;
  customQuestions: CustomQuestion[];
  candidate: CandidateDetails | null;
  sessionName: string; // used to name the new session if overwriteActive === false
}

// In store action:
importSession: async (data: ImportResult, overwriteActive: boolean): Promise<void> => {
  // STORE-05: snapshot BEFORE any mutation
  const state = useAppStore.getState();
  await storageAdapter.snapshot(state.activeSessionId);

  if (overwriteActive) {
    // Overwrite: apply directly to current session
    set({
      scores: data.scores,
      overrides: data.overrides,
      notes: data.notes,
      topicNotes: data.topicNotes,
      customQuestions: data.customQuestions,
      candidate: data.candidate,
    });
  } else {
    // New session: createSession() then apply data
    await useAppStore.getState().createSession();
    // After createSession, activeSessionId is the new ID
    // Rename to imported session name
    const newId = useAppStore.getState().activeSessionId;
    if (data.sessionName) {
      await useAppStore.getState().renameSession(newId, data.sessionName);
    }
    set({
      scores: data.scores,
      overrides: data.overrides,
      notes: data.notes,
      topicNotes: data.topicNotes,
      customQuestions: data.customQuestions,
      candidate: data.candidate,
    });
  }
}
```

### Anti-Patterns to Avoid

- **`jsyaml.safeLoad` / `jsyaml.safeDump`:** Removed in js-yaml 4.x. Use `jsyaml.load` / `jsyaml.dump` directly. [ASSUMED — based on known js-yaml 4.x API]
- **`<dialog open>` attribute:** Never set via prop/attribute; always call `dialogRef.current?.showModal()` imperatively. [VERIFIED: codebase grep — CandidateModal.tsx comment]
- **Not resetting `<input type="file">` value after read:** Without `e.target.value = ''`, re-importing the same file fires no change event. [ASSUMED — browser behavior]
- **Calling `createSession()` then immediately reading `activeSessionId` without awaiting:** `createSession()` is async — await it before reading state. [VERIFIED: codebase grep — store/app.ts line 376]
- **`URL.createObjectURL` without `revokeObjectURL`:** Memory leak; always revoke after `.click()`. [ASSUMED — browser standard]
- **Snapshot-after-import (wrong order):** `storageAdapter.snapshot()` must be called BEFORE `set()` — same guard as `resetAll`. [VERIFIED: codebase grep — 05-PATTERNS.md line 362]
- **Deriving IDs with sectionId prefix:** The live store uses `${topicId}-${questionIndex}` (no sectionId). Exporting with sectionId in the key would break round-trip import. [VERIFIED: codebase grep]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML serialization | Custom YAML string builder | `js-yaml` `dump()` | YAML escaping, multi-line strings, special chars, null representation are all edge cases |
| YAML parsing | Custom YAML parser | `js-yaml` `load()` | YAML 1.2 has complex spec (anchors, multi-doc, types) |
| File download | `fetch()` + `data:` URL | `URL.createObjectURL` + `<a>.click()` | Consistent cross-browser, MV3 CSP compatible, no inline data: issues |
| Focus trapping | Third-party modal library | Native `<dialog>` + `useEffect` focus trap | Already established in Phases 5–6; adding Radix/Headless UI would be new dep |
| Import schema validation | Custom type-check function | valibot schemas (already installed) | Structural validation of parsed YAML before writing to store |

**Key insight:** js-yaml has been solving YAML serialization edge cases since 2011. The one-liner `jsyaml.dump(obj)` handles null (`~`), multi-line strings (block scalars), and special chars — all failure-prone if hand-rolled.

---

## YAML Schema Design (Claude's Discretion — prescriptive recommendation)

Use camelCase field names to match the V3Session TypeScript types and minimize cognitive switching:

```yaml
# interview-Alice Smith-2026-06-17.yaml
meta:
  schemaVersion: 1
  sessionName: "Alice Smith"
  exportedAt: "2026-06-17T14:30:00.000Z"
candidate:
  name: "Alice Smith"
  email: "alice@example.com"
  role: "Senior Frontend Developer"
  date: "2026-06-17"
  interviewer: "Bob Jones"
  details: "Applied for team lead position"
sections:
  - id: frontend
    label: Frontend
    icon: "🖥️"
    topics:
      - id: twig
        name: Twig
        override: ~
        topicNote: ""
        questions:
          - index: 0
            score: 8
            note: "Good answer on include vs embed"
          - index: 1
            score: ~
            note: ""
        customQuestions:
          - id: "custom-twig-1719000000000"
            text: "How would you approach component-driven Twig development?"
            level: advanced
            score: 7
            note: ""
```

**Rationale for choices:**
- `schemaVersion: 1` — forward compatibility; import can check this to route to correct parser
- `score: ~` for null (not scored), `score: 0` for explicit zero — js-yaml's default null representation
- `override: ~` for no override — same convention
- Sections in ROADMAP order (already the order in `DEFAULT_SECTIONS`)
- Custom questions embedded under their topic — logical grouping matches store's `customQuestions[].topicId`
- `exportedAt` in ISO 8601 — for debugging; not used by import

---

## Common Pitfalls

### Pitfall 1: ID Scheme Mismatch (CONTEXT.md vs Actual Store)
**What goes wrong:** CONTEXT.md says ID is `${sectionId}-${topicId}-${questionIndex}` but the store uses `${topicId}-${questionIndex}` (no sectionId). Export writes wrong keys; import cannot match them.
**Why it happens:** CONTEXT.md is written at discussion time from memory; the actual store key is confirmed by QuestionCard.tsx line 33 and store/app.ts line 68 comment.
**How to avoid:** Use `${topicId}-${questionIndex}` exclusively. Confirm by checking QuestionCard.tsx before implementing.
**Warning signs:** Round-trip test fails (export then re-import shows 0 matched questions).

### Pitfall 2: js-yaml 4.x API — No safeLoad/safeDump
**What goes wrong:** Calling `jsyaml.safeLoad()` or `jsyaml.safeDump()` throws "is not a function" at runtime.
**Why it happens:** These were removed in js-yaml 4.0. `jsyaml.load()` is now safe by default (no arbitrary JS execution).
**How to avoid:** Always use `jsyaml.load()` / `jsyaml.dump()`. If TypeScript types have `safeLoad`, that means `@types/js-yaml` is mismatched — upgrade to 4.0.9.
**Warning signs:** TypeScript autocomplete shows `safeLoad` — means type defs are out of date.

### Pitfall 3: js-yaml ESM Import Syntax
**What goes wrong:** `import { load, dump } from 'js-yaml'` works but `import jsyaml from 'js-yaml'` may fail in some bundler configurations.
**Why it happens:** js-yaml 4.2.0 ships `exports["."].import = "./dist/js-yaml.mjs"` (ESM) and `exports["."].require = "./index.js"` (CJS). Named exports are available from the ESM build; the default export depends on bundler resolution.
**How to avoid:** Use named imports: `import { load, dump } from 'js-yaml'`. This is safe with Vite + ESM build. [ASSUMED]
**Warning signs:** Bundler warning about missing default export.

### Pitfall 4: FileReader onload Called After Component Unmount
**What goes wrong:** User clicks Import, immediately closes the tab, FileReader fires after unmount — stale state update.
**Why it happens:** `FileReader` is a browser API that does not respect React component lifecycle.
**How to avoid:** Keep FileReader usage in `ActionsGroup.tsx` where the component is always mounted (top-level in sidebar). Set a `cancelled` flag or use `useRef` to guard the callback. [ASSUMED]
**Warning signs:** React "Can't perform a state update on an unmounted component" warning in dev mode.

### Pitfall 5: `createSession()` Auto-Names the Session "Session N"
**What goes wrong:** After `createSession()`, the new session is named "Session 2" (or N+1). If the imported YAML has a session name, it needs a `renameSession()` call to update.
**Why it happens:** `createSession()` uses `nextSessionName()` which ignores any import metadata.
**How to avoid:** After `await createSession()`, call `renameSession(newId, data.sessionName)` if `data.sessionName` is non-empty.
**Warning signs:** Imported session always shows "Session N" instead of the candidate's name.

### Pitfall 6: Snapshot Must Fire Before store mutation (STORE-05)
**What goes wrong:** If `set()` fires before `storageAdapter.snapshot()`, the snapshot captures post-import state, not pre-import state. STORE-05 requires the snapshot to be a rollback point.
**Why it happens:** Race condition if snapshot is fire-and-forget instead of awaited.
**How to avoid:** `await storageAdapter.snapshot(activeSessionId)` then `set(...)`. Same pattern as `resetAll` in Phase 5.
**Warning signs:** Snapshot taken during import contains the imported data rather than the previous state.

### Pitfall 7: File Input Change Event Not Re-Firing for Same File
**What goes wrong:** User imports a file, closes the preview, re-selects the same file — no change event fires.
**Why it happens:** Browser deduplicates file input change events if `value` is unchanged.
**How to avoid:** Reset `e.target.value = ''` immediately after reading the file in `handleFileChange`.
**Warning signs:** Second import of same file silently does nothing.

---

## Code Examples

### Realistic Multi-Section Fixture for parseLegacy Tests (STATE.md requirement)

```typescript
// Source: derived from DEFAULT_SECTIONS (frontend.ts, backend.ts, etc.) [VERIFIED: codebase grep]
// This fixture satisfies the STATE.md note: "Real prototype-export YAML corpus needed
// to fixture-test ID-derivation normalization"

const LEGACY_FIXTURE = {
  // Legacy format: only scores at top level, no 'sections' key
  scores: {
    // frontend section, twig topic, question 0 (novice: "What is the difference between include, embed, and extends in Twig?")
    'twig-0': 8,
    // frontend section, twig topic, question 4 (advanced)
    'twig-4': 6,
    // frontend section, twig topic, question 10 (expert)
    'twig-10': 9,
    // This ID is NOT in DEFAULT_SECTIONS — should be counted as unmatched
    'nonexistent-topic-0': 5,
  },
  candidate: {
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Senior Developer',
    date: '2026-06-17',
    interviewer: 'Bob Jones',
    details: '',
  },
};

// Expected result from parseLegacy(LEGACY_FIXTURE):
// modifiedCount = 3 (twig-0, twig-4, twig-10 found in DEFAULT_SECTIONS)
// unmatchedCount = 1 (nonexistent-topic-0)
// addedCount = 0 (no custom questions in legacy format)
```

### Export function skeleton

```typescript
// Source: codebase patterns [VERIFIED: codebase grep] + js-yaml API [ASSUMED]
import { dump } from 'js-yaml';
import type { V3Session } from '../storage/types.js';
import type { Section } from '../data/bank/types.js';

export function exportSession(
  session: V3Session,
  sessionName: string,
  sections: readonly Section[],
): string {
  const doc = {
    meta: {
      schemaVersion: 1,
      sessionName,
      exportedAt: new Date().toISOString(),
    },
    candidate: session.candidate ?? null,
    sections: sections.map((section) => ({
      id: section.id,
      label: section.label,
      icon: section.icon,
      topics: section.items.map((topic) => {
        const topicCustomQs = session.customQuestions.filter(
          (cq) => cq.topicId === topic.id,
        );
        return {
          id: topic.id,
          name: topic.name,
          override: session.overrides[topic.id] ?? null,
          topicNote: session.topicNotes[topic.id] ?? '',
          questions: topic.questions.map((q, index) => {
            const questionId = `${topic.id}-${index}`;
            return {
              index,
              score: session.scores[questionId] ?? null,
              note: session.notes[questionId] ?? '',
            };
          }),
          customQuestions: topicCustomQs.map((cq) => ({
            id: cq.id,
            text: cq.text,
            level: cq.level,
            score: session.scores[cq.id] ?? null,
            note: session.notes[cq.id] ?? '',
          })),
        };
      }),
    })),
  };
  return dump(doc, { noRefs: true, lineWidth: 80 });
}
```

### Import result type and parseStructural skeleton

```typescript
// Source: codebase patterns [VERIFIED: codebase grep]
export interface ImportResult {
  scores: Record<string, number | null>;
  overrides: Record<string, number | null>;
  notes: Record<string, string>;
  topicNotes: Record<string, string>;
  customQuestions: import('../store/app.js').CustomQuestion[];
  candidate: import('../storage/types.js').CandidateDetails | null;
  sessionName: string;
}

export interface ImportPreview {
  modifiedCount: number;
  addedCount: number;
  unmatchedCount: number;
  sessionName: string;
  result: ImportResult; // carried so confirm doesn't need to re-parse
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `js-yaml.safeLoad()` / `js-yaml.safeDump()` | `js-yaml.load()` / `js-yaml.dump()` | js-yaml 4.0 (2021) | Breaking — must use 4.x API; `@types/js-yaml` 4.0.9 reflects this |
| `URL.createObjectURL` with manual document.body append | Direct `<a>.click()` without appending to DOM | ~2018 (browser compat) | Cleaner — no DOM pollution, works in Chrome extension context |

**Deprecated/outdated:**
- `jsyaml.safeLoad` / `jsyaml.safeDump`: removed in 4.0; use `jsyaml.load` / `jsyaml.dump` [ASSUMED — known js-yaml 4.x change]
- `filesaver` / `downloadjs` npm packages: unnecessary for single-file YAML downloads; `URL.createObjectURL` is sufficient

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `import { load, dump } from 'js-yaml'` is the correct named import for js-yaml 4.2.0 ESM build with Vite | Standard Stack / Pattern 3 | Build error if default export is required instead; fix: `import jsyaml from 'js-yaml'` |
| A2 | `jsyaml.dump(obj, { noRefs: true, lineWidth: 80 })` produces human-readable YAML with `~` for null | Code Examples | Null may serialize differently; verify with quick test: `dump({ a: null })` should output `a: ~\n` |
| A3 | `jsyaml.safeLoad` was removed in js-yaml 4.0 | Pitfall 2 | If it still exists in 4.2.0, no harm — but confirm before writing docs |
| A4 | `URL.revokeObjectURL()` after `<a>.click()` prevents memory leak | Pattern 3 | Negligible risk if omitted (tab closes anyway), but best practice |
| A5 | FileReader `onload` fires synchronously relative to `readAsText` completion (async, but after read completes) | Pattern 4 | Expected browser behavior; not project-specific |

**If this table is empty:** n/a — 5 assumptions logged; A1 should be verified with a quick Vite build test.

---

## Open Questions

1. **ID scheme: CONTEXT.md says `${sectionId}-${topicId}-${questionIndex}` but store uses `${topicId}-${questionIndex}`**
   - What we know: QuestionCard.tsx line 33 (`row.topicId}-${row.index}`) and store/app.ts line 68 confirm the store uses topicId-only keys.
   - What's unclear: CONTEXT.md may be describing a *future* export scheme, not the current store key format.
   - Recommendation: Export YAML with `${topicId}-${questionIndex}` keys (matching the live store). This is the format that round-trips correctly. If the planner wants sectionId in the YAML for human readability, it can be an additional display field that is NOT used as the lookup key.

2. **Custom question score keys in the store**
   - What we know: `CustomQuestion.id` follows pattern `custom-${topicId}-${Date.now()}` (Phase 5 CustomQuestionForm). Scores for custom questions are stored under `scores[cq.id]`.
   - What's unclear: On import, custom questions get new IDs (new `Date.now()` or UUID). The old score key in the YAML does not match the new `cq.id` assigned during import.
   - Recommendation: On import, generate a new `id` for each custom question (e.g., `custom-${topicId}-${Date.now()}-${index}`) and store the score under the new id. The YAML format should include `score` inline with the custom question so the importer can wire it.

3. **`@types/js-yaml` version compatibility with js-yaml 4.2.0**
   - What we know: `@types/js-yaml` is at 4.0.9 (DefinitelyTyped, last modified 2025-08-03). js-yaml is at 4.2.0.
   - What's unclear: Whether 4.0.9 types cover any 4.2.0 API additions.
   - Recommendation: Install and verify TypeScript compilation passes. The core `load`/`dump` API is stable within the 4.x series.

---

## Environment Availability

Step 2.6: All runtime dependencies are browser APIs (`FileReader`, `URL.createObjectURL`, `<dialog>`) available in Chrome 92+. `js-yaml` requires only `npm install`. No external services needed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | `npm install js-yaml` | ✓ | (project already uses npm) | — |
| Chrome 92+ | `FileReader`, `URL.createObjectURL`, native `<dialog>` | ✓ | Target platform is Chrome MV3 | — |
| `js-yaml` | `yamlExport.ts`, `yamlImport.ts` | ✗ (not yet installed) | 4.2.0 | — (required; no fallback) |
| `@types/js-yaml` | TypeScript compilation | ✗ (not yet installed) | 4.0.9 | — (required for TypeScript) |

**Missing dependencies with no fallback:**
- `js-yaml` 4.2.0 — must be installed before any implementation task
- `@types/js-yaml` 4.0.9 — must be installed alongside js-yaml

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/utils/yamlExport.test.ts src/utils/yamlImport.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| YAML-01 | `exportSession` serializes all V3Session fields to valid YAML string | unit | `npx vitest run src/utils/yamlExport.test.ts` | ❌ Wave 0 |
| YAML-01 | `exportSession` produces `score: ~` for null scores and `score: 0` for zero | unit | `npx vitest run src/utils/yamlExport.test.ts` | ❌ Wave 0 |
| YAML-01 | `buildFilename` sanitizes special chars and formats date correctly | unit | `npx vitest run src/utils/yamlExport.test.ts` | ❌ Wave 0 |
| YAML-02 | `detectFormat` returns 'structural' when `sections` key present | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-02 | `detectFormat` returns 'legacy' when `sections` key absent | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-02 | `parseLegacy` with realistic multi-section fixture: 3 matched, 1 unmatched | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-02 | `parseStructural` round-trip: export → parse → same scores/notes | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-02 | `parseStructural` with duplicate IDs: last-write wins / deduplicates | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-02 | `parseLegacy` malformed YAML returns parse error (throws or returns error object) | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-03 | Preview counts match actual ImportResult content (modifiedCount, addedCount, unmatchedCount) | unit | `npx vitest run src/utils/yamlImport.test.ts` | ❌ Wave 0 |
| YAML-03 | `importSession` calls `storageAdapter.snapshot()` BEFORE `set()` | unit | `npx vitest run src/store/app.test.ts` | ❌ extend |

**Coverage impact:** vitest.config.ts coverage includes `src/utils/*.ts`. `yamlExport.ts` and `yamlImport.ts` need 90%+ coverage (matching existing `src/utils/buildFlatRows.ts` threshold). The config must be extended to include the new util files.

### Sampling Rate
- **Per task commit:** `npx vitest run src/utils/yamlExport.test.ts src/utils/yamlImport.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/utils/yamlExport.test.ts` — covers YAML-01 (export serialization)
- [ ] `src/utils/yamlImport.test.ts` — covers YAML-02 (format detection, parseLegacy, parseStructural, counts)
- [ ] Extend `vitest.config.ts` coverage include to add `src/utils/yamlExport.ts` and `src/utils/yamlImport.ts`
- [ ] Extend `src/store/app.test.ts` — covers YAML-03 importSession snapshot ordering

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | Chrome extension; no server sessions |
| V4 Access Control | no | Single-user tool |
| V5 Input Validation | yes | Validate parsed YAML shape before writing to store; use valibot |
| V6 Cryptography | no | No encryption needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious YAML with JS execution | Tampering | `jsyaml.load()` in 4.x is safe-by-default (removed arbitrary-JS mode from 3.x `load`); no special flag needed |
| Oversized YAML file parsed into huge object | Denial of Service | `js-yaml` does not stream; add file size guard (e.g., reject files > 1MB) before `jsyaml.load()` |
| YAML with prototype pollution payload (`__proto__`, `constructor`) | Tampering | `jsyaml.load()` 4.x defaults to `JSON_SCHEMA` which does not trust arbitrary types; prototype pollution is not possible via the default loader [ASSUMED] |
| Exported YAML read back and written to store with extra keys | Tampering | Validate import payload structure with valibot before calling `set()` |

**File size guard (recommended):**
```typescript
// Reject YAML files larger than 1 MB to prevent DoS via memory allocation
const MAX_YAML_BYTES = 1_048_576; // 1 MB
if (file.size > MAX_YAML_BYTES) {
  // surface error to user and abort
  return;
}
```

---

## Sources

### Primary (MEDIUM confidence — codebase grep, verified in this session)
- `src/components/QuestionCard.tsx` line 33 — question ID scheme `${row.topicId}-${row.index}`
- `src/store/app.ts` line 68 — score key format comment
- `src/storage/adapter.ts` — `snapshot()` API and ordering contract
- `src/components/CandidateModal.tsx` — focus trap and dialog `useRef` pattern
- `src/components/SessionSwitcherModal.tsx` — focus trap, `createSession()` async pattern
- `.planning/phases/05-scoring-ui-notes-candidate-custom-questions/05-PATTERNS.md` — `ResetConfirmDialog` snapshot-before-reset pattern

### Secondary (LOW confidence — npm registry, not authoritative docs)
- `npm view js-yaml` — version 4.2.0, created 2011, 254M weekly downloads
- `npm view @types/js-yaml` — version 4.0.9, verdict OK

### Tertiary (LOW confidence — training knowledge, marked ASSUMED)
- js-yaml 4.x API (`safeLoad` removed, named exports, `noRefs` option)
- Browser FileReader, URL.createObjectURL patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — js-yaml version verified on npm registry; API details ASSUMED from training knowledge
- Architecture: HIGH — derived directly from codebase reading; all patterns verified in existing source files
- Pitfalls: MEDIUM — ID scheme pitfall VERIFIED; other pitfalls ASSUMED from known browser/js-yaml behavior

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (js-yaml 4.x API is stable; browser APIs are stable)
