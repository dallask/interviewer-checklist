# Roadmap: Interviewer Checklist — Chrome Extension

## Overview

Ten phases take the project from an empty repo to a published Chrome Web Store listing. Foundation and pure-logic modules come first so every subsequent phase builds on a tested, store-review-safe scaffold. The first visible UI ships in Phase 4 as a read-only content tree; each subsequent phase adds a coherent user-facing capability. Phases 9 and 10 finish the product and clear the CWS review checklist.

## Milestone: v1.0 Chrome Extension Launch

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Scaffolding** - Build system, manifest, CI safety nets locked before any feature code
- [ ] **Phase 2: Question Bank & Scoring Engine** - Pure data and pure scoring functions with full unit coverage
- [ ] **Phase 3: Storage Layer, Migration & Bootstrap** - Persistence, schema migration, and debounced flush before any UI write
- [ ] **Phase 4: Shell, Sidebar & Read-Only Content Tree** - First visible UI: shell layout, sidebar, dark mode, accessibility
- [ ] **Phase 5: Scoring UI, Notes, Candidate & Custom Questions** - Full interactive scoring loop for a single session
- [ ] **Phase 6: Multiple Named Sessions & Switcher** - Session management with safe switch, delete, and undo
- [ ] **Phase 7: YAML Import & Export** - Structural and legacy-format portability codec with import preview
- [ ] **Phase 8: AI Prompt Modal** - AI candidate-feedback prompt builder with copy-to-clipboard
- [ ] **Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates** - Onboarding, shortcuts, print stylesheet, update banner
- [ ] **Phase 10: Chrome Web Store Submission** - Privacy policy, screenshots, smoke-test, and public listing

## Phase Details

### Phase 1: Foundation & Scaffolding
**Goal**: A clean, store-review-safe build scaffold exists with CI guards that prevent MV3 violations before any feature code is written
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` produces a `dist/` directory that loads in Chrome as an unpacked extension without errors
  2. Clicking the toolbar icon opens a new full-page tab (even if it renders an empty page)
  3. The built `dist/manifest.json` declares only `"permissions": ["storage"]` with no `default_popup`, `host_permissions`, or `scripting`
  4. CI rejects any build whose `dist/` contains `eval`, `unsafe-eval`, inline scripts, or `localhost`/`vite-hmr` references
  5. The GH Actions release workflow can publish the extension zip via `chrome-webstore-upload-cli`
**Plans**: TBD

### Phase 2: Question Bank & Scoring Engine
**Goal**: The complete built-in question bank and scoring engine exist as pure, tested modules that define the behavioral contract for all downstream UI
**Depends on**: Phase 1
**Requirements**: BANK-01, BANK-02, BANK-03
**Success Criteria** (what must be TRUE):
  1. `DEFAULT_SECTIONS` exports 9 groups, ~86 topics, and 1000+ questions each typed with one of four difficulty levels (coefficients 1.00, 1.25, 1.50, 1.75)
  2. The scoring engine computes a difficulty-weighted topic mark, a plain-mean group mark, and a plain-mean overall mark, and recomputes correctly when any score or override changes
  3. Manual topic overrides replace computed marks without affecting other topics
  4. Vitest tests covering bank structure and scoring functions pass with prototype-derived fixtures
**Plans**: TBD

### Phase 3: Storage Layer, Migration & Bootstrap
**Goal**: All state safely survives tab close, version upgrades, and session switches, with no possibility of silent data loss
**Depends on**: Phase 2
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, STORE-06
**Success Criteria** (what must be TRUE):
  1. The app renders only after `bootstrap()` completes its full migration pipeline, so the UI never sees an unvalidated schema
  2. Closing the tab mid-interaction does not lose the last state change (debounced write flushes synchronously on `visibilitychange === "hidden"` and `pagehide`)
  3. A payload from schema v1 is migrated to the current version with each intermediate step validated by its fixture-pinned unit test; a corrupt payload is preserved under `recovery:<timestamp>` rather than silently dropped
  4. An auto-snapshot of the current session is created before any Reset all or YAML import operation
  5. A dismissible toast appears when `chrome.storage.local` usage exceeds the configured threshold
**Plans**: TBD

### Phase 4: Shell, Sidebar & Read-Only Content Tree
**Goal**: Users can browse the full question bank in a polished, accessible shell with dark mode and sidebar filtering — no scoring yet
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08
**Success Criteria** (what must be TRUE):
  1. The sidebar collapses and expands its four groups (Search, Difficulty, Sections, Actions); on narrow viewports it overlays the content area
  2. Typing in search filters the visible question tree within ~150 ms and shows a live result count
  3. Multi-select difficulty and section filters update the visible tree immediately, with per-group marks shown alongside each section label
  4. Dark mode toggles between light and system-default dark; the preference persists across sessions without a flash of unstyled content
  5. Screen reader users can navigate all controls via landmark elements and ARIA attributes; keyboard focus rings are visible; `prefers-reduced-motion` suppresses sidebar animations
**Plans**: TBD
**UI hint**: yes

### Phase 5: Scoring UI, Notes, Candidate & Custom Questions
**Goal**: A user can run a complete scoring session — score all questions, add notes, fill in candidate details, add custom questions, and reset — within a single session slot
**Depends on**: Phase 4
**Requirements**: SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06
**Success Criteria** (what must be TRUE):
  1. Moving a question's score slider (0–10) immediately updates the topic mark using difficulty-weighted averaging; colored mark bands reflect the new value
  2. Entering a manual override on a topic replaces the computed mark for that topic only
  3. Per-question and per-topic notes are saved and restored when the session is reloaded
  4. Filling and saving the candidate details modal persists name, email, role, date, interviewer, and free-text details with the session
  5. Adding a custom question to a topic assigns it a "custom" badge, includes it in scoring and filtering, and allows deletion; Reset all (confirmed) clears all scores, notes, custom questions, candidate details, and filters
**Plans**: TBD
**UI hint**: yes

### Phase 6: Multiple Named Sessions & Switcher
**Goal**: A user can maintain independent named sessions and switch between them without risk of cross-session data corruption
**Depends on**: Phase 5
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04
**Success Criteria** (what must be TRUE):
  1. The session switcher modal lists all sessions and allows creating, renaming, duplicating, and deleting them
  2. Deleting a session requires explicit modal confirmation; a soft-delete undo toast appears for ~10 seconds after deletion
  3. Switching sessions does not corrupt either session's data (pending writes are flushed synchronously before `activeSessionId` changes)
  4. Each session is stored as an independent `session:<id>` key in `chrome.storage.local` alongside a `manifest` key listing all session metadata
**Plans**: TBD
**UI hint**: yes

### Phase 7: YAML Import & Export
**Goal**: Users can export their active session as a structured YAML file and import YAML files in both the current structural format and the legacy progress-only format
**Depends on**: Phase 6
**Requirements**: YAML-01, YAML-02, YAML-03
**Success Criteria** (what must be TRUE):
  1. Exporting the active session produces a YAML file with meta, candidate, and full section/topic/question detail including scores, overrides, notes, and custom flags
  2. Importing a structural YAML file shows a preview ("will modify N questions, add M, X unmatched") before applying, and defaults to creating a new session
  3. Importing a legacy progress-only YAML file matches questions by stable derived IDs and applies scores without overwriting structure
**Plans**: TBD

### Phase 8: AI Prompt Modal
**Goal**: Users can generate an editable AI feedback prompt for the active session and copy it to the clipboard in one click
**Depends on**: Phase 7
**Requirements**: AI-01, AI-02
**Success Criteria** (what must be TRUE):
  1. Opening the AI prompt modal generates a tool-agnostic editable prompt embedding candidate details, all scored marks, per-topic detail, difficulty weighting explanation, and a structured task spec
  2. Clicking the copy button copies the full prompt text to the clipboard synchronously; if the Clipboard API is unavailable, the textarea is pre-selected for manual copy
**Plans**: TBD
**UI hint**: yes

### Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates
**Goal**: The extension is ready for real users: onboarding guides first-time users, keyboard shortcuts work, modals are focus-trapped, print output is clean, and returning users see an update banner
**Depends on**: Phase 8
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07
**Success Criteria** (what must be TRUE):
  1. A first-run welcome tab opens on install with a seeded demo session start action, a pin-to-toolbar nudge, and explanation of both audience flows; it never re-opens after the first visit
  2. The keyboard shortcuts `/` (focus search), `\` (toggle sidebar), and `Esc` (clear search / close modal) work from any non-input context; the `_execute_action` global shortcut is registered via `chrome.commands`
  3. All modals trap Tab/Shift+Tab focus within themselves and restore focus to the trigger element on close
  4. Printing the page expands all collapsed content, hides the sidebar and controls, and auto-expands textarea heights
  5. After a minor+ version bump, a dismissible in-app banner informs the user of the update without opening a new tab; the app version and a CHANGELOG viewer are accessible in the footer
**Plans**: TBD
**UI hint**: yes

### Phase 10: Chrome Web Store Submission
**Goal**: The extension passes all CWS review requirements and is published as a public listing
**Depends on**: Phase 9
**Requirements**: CWS-01, CWS-02, CWS-03, CWS-04, CWS-05
**Success Criteria** (what must be TRUE):
  1. A privacy policy is hosted at a stable HTTPS URL and documents that all data is stored locally, nothing is transmitted, there are no analytics, and data is removed on uninstall
  2. The CWS developer dashboard contains a written permissions-justification for the `storage` permission
  3. At least 3 screenshots at 1280x800 exist showing the populated scoring view, sidebar with filters, and AI prompt modal (none showing empty state)
  4. The extension loads cleanly in a fresh Chrome profile (not the dev profile) and passes all manual checks
  5. The public Chrome Web Store listing is live with accurate description, all screenshots, and the linked privacy policy
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Scaffolding | 0/? | Not started | - |
| 2. Question Bank & Scoring Engine | 0/? | Not started | - |
| 3. Storage Layer, Migration & Bootstrap | 0/? | Not started | - |
| 4. Shell, Sidebar & Read-Only Content Tree | 0/? | Not started | - |
| 5. Scoring UI, Notes, Candidate & Custom Questions | 0/? | Not started | - |
| 6. Multiple Named Sessions & Switcher | 0/? | Not started | - |
| 7. YAML Import & Export | 0/? | Not started | - |
| 8. AI Prompt Modal | 0/? | Not started | - |
| 9. Polish — Print, Keyboard, A11y, Welcome & Updates | 0/? | Not started | - |
| 10. Chrome Web Store Submission | 0/? | Not started | - |
