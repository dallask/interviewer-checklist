# Requirements: Interviewer Checklist — v1.1

**Defined:** 2026-06-18
**Milestone:** v1.1 Post-UAT Fix + Polish
**Core Value:** A single interviewer/candidate can run an end-to-end weighted scoring session — pick topics, score questions on 0–10 with difficulty weighting, capture notes, see live overall + per-group marks, and export a structured YAML / AI-feedback prompt — entirely inside a browser tab with no backend.

**Source of truth:** `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` (Gaps + Additional Enhancement Requests). REQ-IDs continue numbering from v1.0.

## v1 Requirements

> All v1.1 requirements are committed scope. Each maps to a roadmap phase below.

### Scoring UI

- [x] **SCORE-07**: Manual topic-override control does not toggle the parent topic's expanded/collapsed state when opened or changed (fix for D1, test 5)
- [x] **SCORE-08**: Question card renders compactly — score control is a dropdown on the left (0–10 + skip), a note icon button on the right toggles a note textarea below the question, and the card collapses to a single line by default (E1; locked to screenshot spec Images #1–#3)

### Sessions

- [x] **SESS-05**: Session switcher modal can be closed by the user via Esc, backdrop click, and a visible Close button; modal renders as an overlay above (not inside) the sidebar (fix for D2, test 6)

### Sidebar Shell

- [x] **UI-09**: "Hide notes" action actually hides currently-rendered notes when toggled on and restores them when toggled off (fix for D3, test 6)
- [x] **UI-10**: Sidebar Actions buttons render as icon-only controls; each shows its short purpose label as a tooltip on hover/focus (fix for D6, test 7)
- [x] **UI-11**: Sidebar section titles (Search, Difficulty, Sections, Actions) each render a relevant leading icon before the text (fix for D7, test 7)
- [x] **UI-12**: Sidebar collapse/expand works on all viewports including ≥768px — the "Open sidebar" / toggle control changes sidebar visibility regardless of viewport width (fix for D8, test 9)
- [ ] **UI-13**: Sidebar has a sticky top header (not scrolling with sidebar content) containing the sidebar toggle, the candidate-detail button, and a "Final mark · N/86 topics" progress line with a thin progress bar and a numeric mark badge on the right (E6; Images #7–#8)
- [ ] **UI-14**: Sidebar footer renders a credit/copyright lockup ("Developed by Ievgen Kyvgyla, https://kivgila.pro") and an About button (E5; Image #6)
- [ ] **UI-15**: About button opens an AboutModal (native `<dialog>` per existing modal pattern) containing application name, version, links, and credits (E5)

### Filters

- [x] **UI-16**: DifficultyFilter shows "All levels" as the first option with an infinity icon, a color dot next to each difficulty label (Novice green, Intermediate blue, Advanced orange, Expert pink), and the question count for each difficulty on the right (E2; Image #4)
- [x] **UI-17**: SectionFilter shows "All sections" as the first option with a clipboard icon, an emoji icon next to each section name (Frontend 🖥, Design 🎨, Backend ⚙, Dev Environment 🐳, Testing 🧪, CI/CD 🚀, Tooling 🔧, Integrations 🔗, AI & Tooling 🤖), and per-section question count on the right (E3; Image #5)

### Editable Bank

- [ ] **BANK-01**: User can add a new section to the active session (sidebar affordance mirrors the existing "add custom question" pattern)
- [ ] **BANK-02**: User can remove a non-default or user-added section from the active session
- [ ] **BANK-03**: User can add a new topic to any section (default or user-added) in the active session
- [ ] **BANK-04**: User can remove a non-default or user-added topic from any section in the active session
- [ ] **BANK-05**: User can remove default questions from any topic using the same affordance as for custom questions (extends D4 / E4 user-edit scope to default questions)

### Data & YAML

- [ ] **YAML-04**: YAML export schema for default questions includes per-question `text` and `level` fields in addition to `index`, `score`, and `note` (D4, test 7)
- [ ] **YAML-05**: YAML export preserves per-custom-question notes that the user added (fix for D5, test 7)
- [ ] **YAML-06**: YAML export/import schema represents user-added and user-removed sections/topics so that the editable-bank state round-trips through export → import (covers BANK-01..05 in YAML)
- [x] **DATA-01**: V3 → V4 session migration applies on load to materialize default sections/topics into the user-editable bank shape; V3 sessions hydrate without data loss; legacy progress-only YAML imports still work
- [x] **DATA-02**: Importing a v1.0-era full-structural YAML export (V3 schema) into v1.1 produces an equivalent V4 session with no loss of scores, notes, candidate details, or custom questions

## v2 Requirements

Deferred. Not in v1.1 roadmap.

### Deferred from v1.0

- **UAT-DEF-01**: Manual browser UAT for the deferred v1.0 `human_needed` verifications (Phases 5, 6, 7, 8, 9) — rolled into v1.1 sign-off only if reopened by the user
- **UAT-DEF-02**: 3 pending UAT scenarios from v1.0 Phases 3 / 5 / 6

## Out of Scope

| Feature | Reason |
|---------|--------|
| New domain bank content beyond user-editable sections/topics | v1.1 enables the editable affordance; bank curation itself is user-driven via YAML, not a milestone deliverable |
| Cloud sync, accounts, or backend | Same boundary as v1.0 — `chrome.storage.local` only |
| `chrome.storage.sync` support | Same 100KB quota incompatibility as v1.0 |
| New surfaces (popup, side panel, new-tab override) | Toolbar action → full-page tab remains the only surface |
| Mobile or non-Chromium browser support | Chrome MV3 only |
| Breaking the legacy progress-only YAML import path | v1.0 exports MUST still import successfully into v1.1 (regression boundary) |
| Multi-language / i18n | Out of scope for v1.1 |
| Score-band threshold changes | Scoring engine stays as shipped in v1.0 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCORE-07 | Phase 12 | Complete |
| SCORE-08 | Phase 15 | Complete |
| SESS-05 | Phase 12 | Complete |
| UI-09 | Phase 12 | Complete |
| UI-10 | Phase 12 | Complete |
| UI-11 | Phase 12 | Complete |
| UI-12 | Phase 12 | Complete |
| UI-13 | Phase 15 | Pending |
| UI-14 | Phase 15 | Pending |
| UI-15 | Phase 15 | Pending |
| UI-16 | Phase 13 | Complete |
| UI-17 | Phase 13 | Complete |
| BANK-01 | Phase 14 | Pending |
| BANK-02 | Phase 14 | Pending |
| BANK-03 | Phase 14 | Pending |
| BANK-04 | Phase 14 | Pending |
| BANK-05 | Phase 14 | Pending |
| YAML-04 | Phase 14 | Pending |
| YAML-05 | Phase 14 | Pending |
| YAML-06 | Phase 14 | Pending |
| DATA-01 | Phase 11 | Complete |
| DATA-02 | Phase 11 | Complete |

**Coverage:**

- v1.1 requirements: 22 total
- Mapped to phases: 22 ✓
- Unmapped: 0 ✓

**Phase distribution:**

- Phase 11 (V4 Migration & Legacy Compat): 2 requirements — DATA-01, DATA-02
- Phase 12 (UAT Defect Cleanup): 6 requirements — SCORE-07, SESS-05, UI-09, UI-10, UI-11, UI-12
- Phase 13 (Filter Overhaul): 2 requirements — UI-16, UI-17
- Phase 14 (Editable Bank & YAML Schema Expansion): 8 requirements — BANK-01, BANK-02, BANK-03, BANK-04, BANK-05, YAML-04, YAML-05, YAML-06
- Phase 15 (Sidebar Shell Refactor & Compact QuestionCard): 4 requirements — SCORE-08, UI-13, UI-14, UI-15

---
*Requirements defined: 2026-06-18*
*Last updated: 2026-06-18 after v1.1 roadmap traceability filled in*
