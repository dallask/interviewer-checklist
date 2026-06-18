# Roadmap: Interviewer Checklist — Chrome Extension

## Milestones

- ✅ **v1.0 Chrome Extension Launch** — Phases 1–10 + 7.1 (shipped 2026-06-18) → [archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Post-UAT Fix + Polish** — Phases 11–15 (active, started 2026-06-18)

## Phases

<details>
<summary>✅ v1.0 Chrome Extension Launch (Phases 1–10 + 7.1) — SHIPPED 2026-06-18</summary>

- [x] Phase 1: Foundation & Scaffolding (3/3 plans) — completed 2026-06-16
- [x] Phase 2: Question Bank & Scoring Engine (2/2 plans) — completed 2026-06-17
- [x] Phase 3: Storage Layer, Migration & Bootstrap (3/3 plans) — completed 2026-06-17
- [x] Phase 4: Shell, Sidebar & Read-Only Content Tree (3/3 plans) — completed 2026-06-17
- [x] Phase 5: Scoring UI, Notes, Candidate & Custom Questions (5/5 plans) — completed 2026-06-17
- [x] Phase 6: Multiple Named Sessions & Switcher (3/3 plans) — completed 2026-06-17
- [x] Phase 7: YAML Import & Export (2/2 plans) — completed 2026-06-17
- [x] Phase 7.1: Close gap — YAML wiring + demo seed fix (1/1 plan, INSERTED audit closure) — completed 2026-06-18
- [x] Phase 8: AI Prompt Modal (2/2 plans) — completed 2026-06-17
- [x] Phase 9: Polish — Print, Keyboard, A11y, Welcome & Updates (3/3 plans) — completed 2026-06-18
- [x] Phase 10: Chrome Web Store Submission (3/3 plans — Plan 10-01 + 10-02 Task 1 autonomous; Plans 10-02 Tasks 2-3 + 10-03 are manual CWS submission actions) — completed 2026-06-18

Full archive: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v1.1 Post-UAT Fix + Polish (Phases 11–15) — ACTIVE

- [x] **Phase 11: V4 Session Migration & Legacy Compat** — Forward-only V3→V4 migration materializes default sections/topics into editable bank shape; legacy progress-only YAML imports keep working (completed 2026-06-18)
- [x] **Phase 12: UAT Defect Cleanup** — Six small-touch fixes: topic-override propagation, session modal close paths, hide-notes wiring, sidebar icon buttons + section icons, desktop sidebar toggle (completed 2026-06-18)
- [x] **Phase 13: Filter Overhaul** — Difficulty and Section filters get "All" rows, colored/emoji indicators, and live per-row counts (completed 2026-06-18)
- [x] **Phase 14: Editable Bank & YAML Schema Expansion** — Users can add/remove sections and topics, delete default questions; YAML round-trips the new editable-bank state with full per-question text/level/note fidelity (completed 2026-06-18)
- [ ] **Phase 15: Sidebar Shell Refactor & Compact QuestionCard** — Sticky sidebar header (toggle + candidate button + final-mark progress line), credit footer + AboutModal, and the compact QuestionCard redesign (dropdown left, note icon right, single-line default)

## Phase Details

### Phase 11: V4 Session Migration & Legacy Compat

**Goal**: V3 sessions hydrate into the V4 editable-bank shape without data loss, and legacy progress-only YAML imports continue to work unchanged
**Depends on**: Nothing (foundation phase for v1.1)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):

  1. A user loading the extension after upgrading from v1.0 sees their existing sessions with all scores, notes, candidate details, overrides, and custom questions intact — no resets, no empty defaults
  2. The migrated session exposes default sections and topics as user-editable entities (the schema/store layer accepts add/remove calls against them, even if no UI surfaces them yet)
  3. Importing a v1.0-era full-structural YAML export produces an equivalent V4 session with no loss of scores, notes, candidate details, or custom questions
  4. Importing a legacy progress-only YAML (v1.0 regression boundary) still matches by stable IDs and applies scores without losing the bank

**Plans**: 3 plans
**Wave 1**

- [x] 11-01-PLAN.md — V4 schema types, migrateV3ToV4() module, fixtures, unit tests, runMigrations() extension

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 11-02-PLAN.md — Bootstrap V3→V4 migration loop, store V4 wiring, MigrationErrorBanner, main.tsx hydration
- [x] 11-03-PLAN.md — YAML import V4 key re-keying, ActionsGroup wiring, integration test extensions

### Phase 12: UAT Defect Cleanup

**Goal**: Close the six small-touch defects from the v1.0 CWS smoke test so the existing surface stops misbehaving for real interviewer use
**Depends on**: Phase 11
**Requirements**: SCORE-07, SESS-05, UI-09, UI-10, UI-11, UI-12
**Success Criteria** (what must be TRUE):

  1. Clicking or changing a topic's manual-override dropdown updates the topic mark without collapsing or re-expanding the parent topic section
  2. The session switcher modal renders as a true overlay above the sidebar and closes via Esc, backdrop click, and a visible Close button
  3. Toggling "Hide notes" actually hides all currently rendered per-question and per-topic note areas, and toggling it off restores them
  4. The sidebar "Open sidebar" / toggle control changes sidebar visibility on every viewport — including ≥768px desktop — not only on mobile overlay
  5. Sidebar Actions buttons render as icon-only controls with hover/focus tooltips, and every sidebar section title (Search, Difficulty, Sections, Actions) shows a leading icon before its text

**Plans**: 4 plans

**Wave 1** *(all independent — run in parallel)*

- [x] 12-01-PLAN.md — SCORE-07: TopicMarkDisplay fieldset stopPropagation; SESS-05: SessionSwitcherModal backdrop click close
- [x] 12-02-PLAN.md — UI-09: hideNotes store field + QuestionCard + TopicRow note suppression
- [x] 12-03-PLAN.md — UI-11: SidebarGroup icon prop + Sidebar icon pass-through; UI-12: remove md: breakpoint sidebar overrides

**Wave 2** *(blocked on 12-02)*

- [x] 12-04-PLAN.md — UI-09: ActionsGroup Hide notes button; UI-10: all ActionsGroup buttons icon-only with title tooltips

**UI hint**: yes

### Phase 13: Filter Overhaul

**Goal**: Users can see at a glance how many questions live in each difficulty and each section, and can select "all" of either with a single click
**Depends on**: Phase 11
**Requirements**: UI-16, UI-17
**Success Criteria** (what must be TRUE):

  1. The Difficulty filter shows "All levels" as the first row with an infinity icon, and each difficulty row shows its color dot (Novice green, Intermediate blue, Advanced orange, Expert pink) plus a live question count on the right
  2. The Section filter shows "All sections" as the first row with a clipboard icon, and each section row shows its emoji icon (Frontend 🖥, Design 🎨, Backend ⚙, Dev Environment 🐳, Testing 🧪, CI/CD 🚀, Tooling 🔧, Integrations 🔗, AI & Tooling 🤖) plus a live question count on the right
  3. Selecting "All levels" or "All sections" clears the respective multi-select state and shows every question; deselecting individual rows narrows results live
  4. Per-row counts update reactively when the user adds or removes questions, sections, or topics in the editable bank

**Plans**: 1 plan

**Wave 1**

- [x] 13-01-PLAN.md — Store clear actions + DifficultyFilter (All row, dots, counts, labels) + SectionFilter (All row, icon, count badge)

**UI hint**: yes

### Phase 14: Editable Bank & YAML Schema Expansion

**Goal**: Users can fully shape the question bank — adding and removing sections, topics, and default questions — and that state survives a full YAML export/import round-trip
**Depends on**: Phase 11
**Requirements**: BANK-01, BANK-02, BANK-03, BANK-04, BANK-05, YAML-04, YAML-05, YAML-06
**Success Criteria** (what must be TRUE):

  1. A user can add a new section to the active session and add new topics into any section (default or user-added) using affordances that mirror today's "add custom question" pattern
  2. A user can remove user-added sections and topics, and can delete default questions using the same control as for custom-question deletion
  3. Exporting a session produces YAML whose default-question entries include `text` and `level` alongside `index`, `score`, and `note`, and whose custom-question entries preserve the user-entered notes
  4. Exporting and re-importing a session that has added/removed sections, added/removed topics, and deleted default questions reconstructs the same editable-bank shape with no loss

**Plans**: 5 plans

**Wave 1**

- [x] 14-01-PLAN.md — V4SessionSchema + removedDefaultQuestionIds + 5 store actions + subscribe/hydration wiring + App.tsx sections-from-store

**Wave 2** *(blocked on 14-01, plans run in parallel)*

- [x] 14-02-PLAN.md — buildFlatRows: V4Section input, new VirtualRow types, removedDefaultQuestionIds filter, add-topic-trigger / add-section-trigger row emission
- [x] 14-03-PLAN.md — YAML v2: exportSession signature change (V4Session), text+level fields, bank block; importSession bank delta extraction; YAML-05 note fix

**Wave 3** *(blocked on 14-02 + 14-03)*

- [x] 14-04-PLAN.md — UI: AddSectionForm, AddTopicForm, SectionRow/TopicRow delete buttons, QuestionCard BANK-05 extension, ContentTree ESTIMATE_SIZE + dispatch

**Wave 4** *(blocked on all prior waves)*

- [x] 14-05-PLAN.md — Tests: store actions (BANK-01..05), buildFlatRows filter + new rows, yamlExport v2 (YAML-04/06), yamlImport note round-trip + bank delta (YAML-05/06)

**UI hint**: yes

### Phase 15: Sidebar Shell Refactor & Compact QuestionCard

**Goal**: The sidebar surfaces session-level progress at all times, exposes app credits/about, and individual questions read as a compact one-line row that expands only when the user opts in
**Depends on**: Phases 11, 12, 13, 14
**Requirements**: SCORE-08, UI-13, UI-14, UI-15
**Success Criteria** (what must be TRUE):

  1. The sidebar shows a sticky top header — not scrolling with content — containing the sidebar toggle, the candidate-detail button, and a "Final mark · N/86 topics" progress line with a thin progress bar and a numeric mark badge on the right
  2. The sidebar shows a footer with the credit lockup ("Developed by Ievgen Kyvgyla, https://kivgila.pro") and an About button that opens an AboutModal containing application name, version, links, and credits
  3. Each question card renders as a single line by default with the score control as a dropdown (0–10 + skip) on the left of the question text and a note icon button on the right
  4. Clicking the note icon toggles a note textarea below the question; the card stays compact until the user explicitly expands the note
  5. The compact card layout is locked to the screenshot spec (Images #1–#3 from the UAT brief) for spacing, icon placement, and dropdown affordance

**Plans**: 4 plans

**Wave 1** *(all independent — run in parallel)*

- [ ] 15-01-PLAN.md — SidebarHeader (sticky header: close toggle + candidate button + progress line + bar) + Sidebar.tsx layout refactor (overflow-y-auto moved to inner div, CandidateModal ownership moved here)
- [ ] 15-02-PLAN.md — SidebarFooter credit lockup + About button; AboutModal (native dialog: version, credits, close, backdrop/Esc close)
- [ ] 15-03-PLAN.md — QuestionCard compact redesign: score dropdown (Skip + 0–10) left, question text center, note icon right, textarea below on demand

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 15-04-PLAN.md — Tests: SidebarHeader.test.tsx (new), AboutModal.test.tsx (new), SidebarFooter.test.tsx (updated), Sidebar.test.tsx (updated), QuestionCard.test.tsx (updated)

**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Scaffolding | v1.0 | 3/3 | Complete | 2026-06-16 |
| 2. Question Bank & Scoring Engine | v1.0 | 2/2 | Complete | 2026-06-17 |
| 3. Storage Layer, Migration & Bootstrap | v1.0 | 3/3 | Complete | 2026-06-17 |
| 4. Shell, Sidebar & Content Tree | v1.0 | 3/3 | Complete | 2026-06-17 |
| 5. Scoring UI, Notes, Candidate & Custom Questions | v1.0 | 5/5 | Complete | 2026-06-17 |
| 6. Multiple Named Sessions & Switcher | v1.0 | 3/3 | Complete | 2026-06-17 |
| 7. YAML Import & Export | v1.0 | 2/2 | Complete | 2026-06-17 |
| 7.1. Close gap — YAML wiring + demo seed fix | v1.0 | 1/1 | Complete | 2026-06-18 |
| 8. AI Prompt Modal | v1.0 | 2/2 | Complete | 2026-06-17 |
| 9. Polish | v1.0 | 3/3 | Complete | 2026-06-18 |
| 10. Chrome Web Store Submission | v1.0 | 3/3 (manual submission tasks pending user action) | Complete | 2026-06-18 |
| 11. V4 Session Migration & Legacy Compat | v1.1 | 3/3 | Complete    | 2026-06-18 |
| 12. UAT Defect Cleanup | v1.1 | 4/4 | Complete   | 2026-06-18 |
| 13. Filter Overhaul | v1.1 | 1/1 | Complete   | 2026-06-18 |
| 14. Editable Bank & YAML Schema Expansion | v1.1 | 5/5 | Complete | 2026-06-18 |
| 15. Sidebar Shell Refactor & Compact QuestionCard | v1.1 | 0/4 | In planning | — |
