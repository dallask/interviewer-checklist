# Roadmap: Interviewer Checklist — Chrome Extension

## Milestones

- ✅ **v1.0 Chrome Extension Launch** — Phases 1–10 + 7.1 (shipped 2026-06-18) → [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Post-UAT Fix + Polish** — Phases 11–15 (shipped 2026-06-18) → [archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 UAT Closure & Visual Polish** — Phases 16–19 (in progress)

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

<details>
<summary>✅ v1.1 Post-UAT Fix + Polish (Phases 11–15) — SHIPPED 2026-06-18</summary>

- [x] Phase 11: V4 Session Migration & Legacy Compat (3/3 plans) — completed 2026-06-18
- [x] Phase 12: UAT Defect Cleanup (4/4 plans) — completed 2026-06-18
- [x] Phase 13: Filter Overhaul (1/1 plan) — completed 2026-06-18
- [x] Phase 14: Editable Bank & YAML Schema Expansion (5/5 plans) — completed 2026-06-18
- [x] Phase 15: Sidebar Shell Refactor & Compact QuestionCard (4/4 plans) — completed 2026-06-18

Full archive: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

### 🚧 v1.2 UAT Closure & Visual Polish (In Progress)

**Milestone Goal:** Close the remaining UAT gaps from v1.1 — two virtualizer scroll bugs, one note-collapse bug, dark mode contrast — then layer in the visual enhancements (difficulty indicators, icon library, font density, transitions).

- [ ] **Phase 16: Bug Fixes & Dark Mode Polish** — Fix add-section/topic tree refresh, note-icon collapse, and score dropdown dark mode contrast
- [ ] **Phase 17: Difficulty Indicators** — QuestionCard left border + badge chip colored by difficulty
- [ ] **Phase 18: Icon Library** — Replace all ad-hoc emoji in UI chrome with Lucide React glyphs
- [ ] **Phase 19: Typography & Transitions** — 13px base font with compact density + CSS transitions throughout

## Phase Details

### Phase 16: Bug Fixes & Dark Mode Polish
**Goal**: All remaining UAT-flagged defects are resolved — new sections and topics appear in the tree immediately after submission, the note icon toggles closed regardless of content, and the score dropdown is fully legible in dark mode
**Depends on**: Phase 15 (v1.1 complete)
**Requirements**: BUG-01, BUG-02, BUG-03, POL-01
**Success Criteria** (what must be TRUE):
  1. User submits the Add Section form and the new section row is visible in the content tree without a page reload
  2. User submits the Add Topic form and the new topic row is visible under the correct section without a page reload
  3. User clicks the note icon on a QuestionCard whose textarea contains text and the textarea collapses
  4. Score dropdown options are readable in dark mode with sufficient contrast (no invisible text or washed-out border)
  5. All 675+ existing tests continue to pass after the fixes
**Plans**: TBD
**UI hint**: yes

### Phase 17: Difficulty Indicators
**Goal**: Each QuestionCard communicates its difficulty level at a glance via a colored left border and a text badge chip
**Depends on**: Phase 16
**Requirements**: VIS-01, VIS-02
**Success Criteria** (what must be TRUE):
  1. Each QuestionCard has a thick left border whose color matches its difficulty (green = novice, blue = intermediate, orange = advanced, pink = expert)
  2. Each QuestionCard shows a difficulty badge chip (NOVICE / INTERMEDIATE / ADVANCED / EXPERT) visible on the card row
  3. Difficulty colors are consistent between the left border and the badge chip on the same card
  4. All 675+ existing tests continue to pass after the visual changes
**Plans**: TBD
**UI hint**: yes

### Phase 18: Icon Library
**Goal**: All UI chrome icons use a consistent material-like glyph set with no ad-hoc emoji remaining in interactive controls or structural UI elements
**Depends on**: Phase 17
**Requirements**: VIS-03
**Success Criteria** (what must be TRUE):
  1. Sidebar action buttons, toggle buttons, section icons, and badge icons all render Lucide React SVG glyphs instead of emoji characters
  2. No emoji characters remain in rendered UI chrome (buttons, labels, interactive affordances)
  3. Icon sizes, colors, and alignment are visually consistent across all replaced locations
  4. All 675+ existing tests continue to pass after the icon library migration
**Plans**: TBD
**UI hint**: yes

### Phase 19: Typography & Transitions
**Goal**: The interface uses a 13px base font with tightened spacing throughout, and key interactions feel smooth with CSS transitions
**Depends on**: Phase 18
**Requirements**: POL-02, POL-03
**Success Criteria** (what must be TRUE):
  1. The base font size across the sidebar and content tree reads as 13px (Tailwind `text-[13px]`)
  2. The interface feels noticeably more compact — reduced padding, tighter line heights — without content being cramped or unreadable
  3. Sidebar open/close, topic/section expand/collapse, modal open/close, and note-textarea toggle each have a visible CSS transition or animation
  4. All 675+ existing tests continue to pass after typography and transition changes
**Plans**: TBD
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
| 11. V4 Session Migration & Legacy Compat | v1.1 | 3/3 | Complete | 2026-06-18 |
| 12. UAT Defect Cleanup | v1.1 | 4/4 | Complete | 2026-06-18 |
| 13. Filter Overhaul | v1.1 | 1/1 | Complete | 2026-06-18 |
| 14. Editable Bank & YAML Schema Expansion | v1.1 | 5/5 | Complete | 2026-06-18 |
| 15. Sidebar Shell Refactor & Compact QuestionCard | v1.1 | 4/4 | Complete | 2026-06-18 |
| 16. Bug Fixes & Dark Mode Polish | v1.2 | 0/TBD | Not started | - |
| 17. Difficulty Indicators | v1.2 | 0/TBD | Not started | - |
| 18. Icon Library | v1.2 | 0/TBD | Not started | - |
| 19. Typography & Transitions | v1.2 | 0/TBD | Not started | - |
