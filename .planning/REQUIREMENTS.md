# Requirements: Interviewer Checklist — Chrome Extension

**Defined:** 2026-06-16
**Core Value:** A single interviewer/candidate can run an end-to-end weighted scoring session — pick topics, score questions on 0–10 with difficulty weighting, capture notes, see live overall + per-group marks, and export a structured YAML / AI-feedback prompt — entirely inside a browser tab with no backend.

## v1 Requirements

### Foundation (FOUND)

- [x] **FOUND-01**: Chrome MV3 extension scaffold (CRXJS 2.6 + Vite 8 + React 19 + TypeScript + Biome 2.3) builds cleanly for production
- [x] **FOUND-02**: `manifest.json` declares only `"permissions": ["storage"]`, no `default_popup`, no `host_permissions`, no `scripting`
- [x] **FOUND-03**: Service worker (≤30 LOC, event-driven, stateless) opens a full-page tab (`chrome.tabs.create`) on toolbar action click
- [x] **FOUND-04**: CI guards reject builds containing `eval`, `unsafe-eval`, inline scripts, or `localhost`/`vite-hmr` references in `dist/`
- [x] **FOUND-05**: GH Actions release workflow publishes the extension zip via `chrome-webstore-upload-cli`

### Question Bank & Scoring (BANK)

- [x] **BANK-01**: Built-in question bank compiled as a build-time constant — 9 groups / ~86 topics / 1000+ questions / 4 difficulty levels (coefficients 1.00 / 1.25 / 1.50 / 1.75); never persisted in storage
- [x] **BANK-02**: Weighted scoring engine: difficulty-weighted topic marks, manual topic overrides, plain-mean group and overall marks, live recompute on every score change, colored mark bands
- [x] **BANK-03**: Vitest unit coverage on bank structure and scoring engine with prototype-derived fixtures

### Storage & Persistence (STORE)

- [x] **STORE-01**: `chrome.storage.local` adapter wraps all reads/writes, checks `chrome.runtime.lastError`, uses sharded keys (`manifest` + `session:<id>`)
- [x] **STORE-02**: Schema migration pipeline (v1→v5) — each migration is a pure function with anonymized input fixture, fixture-pinned unit test, valibot-validated input and output; failure preserves payload under `recovery:<timestamp>`; migrations never deleted
- [x] **STORE-03**: `bootstrap()` runs the full migration pipeline and resolves before `createRoot` is called
- [x] **STORE-04**: Zustand store persisted via custom adapter: 300ms trailing debounce for normal writes + synchronous `flushPending()` called on `visibilitychange === "hidden"` and `pagehide` events; `dirty` flag guards double-flush
- [x] **STORE-05**: Auto-snapshot (rolling last 3, FIFO trim) saved before any Reset all or YAML import operation
- [x] **STORE-06**: Storage-write helper calls `chrome.storage.local.getBytesInUse()` before each write and surfaces a dismissible toast when usage exceeds a configurable threshold

### Shell & Navigation (UI)

- [x] **UI-01**: Shell layout — collapsible sidebar + scrollable content area; sidebar becomes a responsive overlay on narrow viewports
- [x] **UI-02**: Sidebar contains four collapsible groups: Search / Difficulty / Sections / Actions; collapsed state remembered per group
- [x] **UI-03**: Search input debounced ~150ms, searches across question names, descriptions, tags, and full question text; live result count shown
- [x] **UI-04**: Multi-select difficulty filter with live counts per level; multi-select section filter showing per-group marks alongside each section label
- [x] **UI-05**: View toolbar: Expand all, Collapse all, Hide already-marked topics (toggle)
- [x] **UI-06**: Dark mode — respects OS `prefers-color-scheme` by default; user can toggle and override persists across sessions
- [x] **UI-07**: Accessibility: `<main>`, `<nav>`, `<aside>` landmark elements; skip-to-content link at top of page; all interactive elements use real `<button>` / `<select>` / `<input>`; ARIA roles, labels, `aria-expanded`, `aria-pressed`, `aria-checked` on relevant controls; visible focus rings
- [x] **UI-08**: `prefers-reduced-motion` media query gates sidebar slide and any other CSS transitions/animations

### Scoring UI (SCORE)

- [ ] **SCORE-01**: Per-question 0–10 score slider with `aria-label` set to the question text
- [ ] **SCORE-02**: Live topic mark displayed as difficulty-weighted average of question scores; manual override input replaces computed mark when set
- [ ] **SCORE-03**: Per-question notes (textarea) and per-topic notes (textarea) saved and restored with session state
- [ ] **SCORE-04**: Candidate details modal (name, email, role, date, interviewer, free-text details) with Save / Cancel / Reset actions
- [ ] **SCORE-05**: Custom questions per topic — user can add with difficulty selection, questions show "custom" badge, can be deleted; custom questions fully participate in scoring, sorting, filtering, and export
- [ ] **SCORE-06**: Reset all (with confirmation dialog) clears scores, overrides, notes, custom questions, candidate details, filters, and any imported structural overrides

### Sessions (SESS)

- [ ] **SESS-01**: Multiple named sessions stored as individual `session:<id>` keys in `chrome.storage.local` plus a `manifest` key listing session IDs and metadata
- [ ] **SESS-02**: In-app session switcher modal — create new session, rename, duplicate, and delete existing sessions
- [ ] **SESS-03**: Session delete requires explicit modal confirmation; after delete a soft-delete undo toast appears for ~10 seconds
- [ ] **SESS-04**: Session switch calls `flushPending()` synchronously before updating `activeSessionId` to prevent cross-session write corruption

### Data Portability (YAML)

- [x] **YAML-01**: YAML export of active session in full structural format — meta, candidate, sections with id/title/icon, topics, questions with scores/overrides/notes/custom flag
- [x] **YAML-02**: YAML import supports both full structural format and legacy progress-only format; uses stable `deriveId(group, topic, question)` with normalization for ID matching; deduplicates on re-import
- [x] **YAML-03**: Import shows a preview modal ("will modify N questions, add M, X unmatched") before applying; import target defaults to a new session

### AI Prompt Builder (AI)

- [x] **AI-01**: AI candidate-feedback prompt modal — generates a tool-agnostic, editable prompt embedding candidate details, all scored marks, per-topic detail, difficulty weighting explanation, and a structured task spec
- [x] **AI-02**: Copy-to-clipboard via `navigator.clipboard.writeText` called synchronously in click handler; falls back to pre-selecting the textarea for manual copy

### Polish & Onboarding (POLISH)

- [ ] **POLISH-01**: First-run welcome tab opens on `chrome.runtime.onInstalled` reason==='install'; welcome page includes a seeded demo session start action, pin-to-toolbar visual nudge, and explanation of the two audience flows (interviewer / candidate); fires once via a `chrome.storage.local` "hasSeenWelcome" flag
- [ ] **POLISH-02**: `chrome.commands` with `_execute_action` global keyboard shortcut declared in manifest
- [ ] **POLISH-03**: In-app keyboard shortcuts: `/` focuses search, `\` toggles sidebar, `Esc` clears search / closes active modal; shortcuts ignore when focus is inside an input/textarea
- [ ] **POLISH-04**: All modals (candidate details, AI prompt, confirm dialogs, session switcher) use a focus-trap primitive (Radix Dialog or Headless UI Dialog) that traps Tab/Shift+Tab within the modal and restores focus to the trigger element on close
- [ ] **POLISH-05**: Print stylesheet — expands all collapsed topic/question cards, hides sidebar and controls, uses stable selectors (`.no-print`, `data-collapsed`, `data-hidden`); textarea heights auto-expand
- [ ] **POLISH-06**: App version (from `chrome.runtime.getManifest().version`) displayed in a footer or about area with a link to the bundled `CHANGELOG.md` viewer
- [ ] **POLISH-07**: Update-detected dismissible banner shown on first open after a minor+ version bump (detected via `chrome.runtime.onInstalled` reason==='update' + `previousVersion` comparison); does NOT auto-open a new tab

### Chrome Web Store (CWS)

- [ ] **CWS-01**: Privacy policy hosted at a stable HTTPS URL documenting: all data stored locally in `chrome.storage.local`, nothing transmitted, no analytics, data removed on uninstall
- [ ] **CWS-02**: Permissions-justification text for `storage` permission written and added to the CWS developer dashboard data-handling section
- [ ] **CWS-03**: 3+ screenshots at 1280×800 showing the populated scoring view, sidebar with filters, and AI prompt modal (not empty state)
- [ ] **CWS-04**: Extension smoke-loaded in a fresh Chrome profile (not the dev profile) passes all manual checks before submission
- [ ] **CWS-05**: Public listing published on the Chrome Web Store with accurate description, screenshots, and linked privacy policy

## v2 Requirements

Features deferred until v1 ships and real usage validates direction.

### Session Management

- **SESS-v2-01**: Session templates — save current filter/structure config as a reusable starting point
- **SESS-v2-02**: Side-by-side read-only session comparison view

### UI Enhancements

- **UI-v2-01**: Auto-save indicator with last-saved timestamp in header
- **UI-v2-02**: Per-question tag filter as a first-class sidebar control
- **UI-v2-03**: Empty-state copy sweep across all surfaces (session switcher, notes, filter results)
- **UI-v2-04**: Inline help popovers on weighting coefficients and override controls
- **UI-v2-05**: Toolbar action badge showing active session initial or unread-changelog dot

### Advanced Export

- **EXP-v2-01**: Downloadable PDF export of session results summary (not full rubric)
- **EXP-v2-02**: Cmd/Ctrl+K quick-switcher palette for sessions, topics, and actions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud backend / auth / cross-device sync | Explicit Out of Scope — `chrome.storage.local` only; YAML covers portability |
| `chrome.storage.sync` | 100KB cap incompatible with the question bank |
| Real-time multi-user collaboration | Single-user tool by design; requires backend |
| Mobile / non-Chromium browsers | Chrome MV3 extension is the entire product surface |
| Side Panel / popup-window surfaces | Full-page tab only in v1; separate surfaces are maintenance burden |
| `options_ui` page | In-app settings surface replaces it; two surfaces cause confusion |
| Telemetry / analytics | Triggers CWS data-handling requirements; no business model; advertise absence as trust signal |
| Auto-open tab on update | Rated universally obnoxious in extension UX reviews; use in-app banner instead |
| Encrypted-at-rest local storage | `chrome.storage.local` is already extension-partitioned; key management hurts more than it helps |
| `chrome.storage.sync` (cross-instance sync) | 100KB quota exceeded by question bank |
| Voice-note attachments | Requires `microphone` permission, blob storage; text notes sufficient |
| Candidate avatar uploads | PII increase, no scoring value, EEOC concerns in hiring contexts |
| Full i18n at v1 | Bank content is ~1000 English technical questions; translating chrome without content is misleading |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01–05 | Phase 1 | Pending |
| BANK-01–03 | Phase 2 | Pending |
| STORE-01–06 | Phase 3 | Pending |
| UI-01–08 | Phase 4 | Pending |
| SCORE-01–06 | Phase 5 | Pending |
| SESS-01–04 | Phase 6 | Pending |
| YAML-01–03 | Phase 7 | Pending |
| AI-01–02 | Phase 8 | Pending |
| POLISH-01–07 | Phase 9 | Pending |
| CWS-01–05 | Phase 10 | Pending |

**Coverage:**

- v1 requirements: 49 total
- Mapped to phases: 49
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-16*
*Last updated: 2026-06-16 — traceability confirmed, coverage corrected to 49*
