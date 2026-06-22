# Roadmap: Interviewer Checklist — Chrome Extension

## Milestones

- ✅ **v1.0 Chrome Extension Launch** — Phases 1–10 + 7.1 (shipped 2026-06-18) → [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Post-UAT Fix + Polish** — Phases 11–15 (shipped 2026-06-18) → [archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 UAT Closure & Visual Polish** — Phases 16–19 (shipped 2026-06-22) → [archive](milestones/v1.2-ROADMAP.md)
- 🚧 **v1.3 UX Refinement & Layout** — Phases 20–23 (in progress)

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

<details>
<summary>✅ v1.2 UAT Closure & Visual Polish (Phases 16–19) — SHIPPED 2026-06-22</summary>

- [x] **Phase 16: Bug Fixes & Dark Mode Polish** — Fix add-section/topic tree refresh, note-icon collapse, and score dropdown dark mode contrast
- [x] **Phase 17: Difficulty Indicators** — QuestionCard left border + badge chip colored by difficulty
- [x] **Phase 18: Icon Library** — Replace all ad-hoc emoji in UI chrome with Lucide React glyphs (completed 2026-06-19)
- [x] **Phase 19: Typography & Transitions** — 13px base font with compact density + CSS transitions throughout (completed 2026-06-19)

Full archive: [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md)

</details>

### 🚧 v1.3 UX Refinement & Layout (In Progress)

**Milestone Goal:** Complete all remaining BACKLOG items — fix lingering section-add and difficulty-border regressions, establish a centered 1200px layout, sort questions by difficulty, enlarge the AI dialog, add icon to the extension, and polish all modal buttons and the action panel.

- [ ] **Phase 20: Bug Fixes** — Re-verify and fix section add persistence and difficulty border color regression
- [ ] **Phase 21: Layout & Content Ordering** — Max-width 1200px centered container and difficulty sort within sections
- [ ] **Phase 22: Extension Icon** — Add icon asset and wire into manifest
- [ ] **Phase 23: UI Polish** — AI dialog resize, modal button icons, action panel grid, and remaining animations

## Phase Details

### Phase 20: Bug Fixes
**Goal**: All reported regressions are resolved — new sections appear in the tree immediately on submit and QuestionCard left border color matches the difficulty label
**Depends on**: Phase 19 (v1.2 complete)
**Requirements**: BUG-01, BUG-02
**Success Criteria** (what must be TRUE):
  1. User submits the Add Section form and the new section row appears in the content tree without a page reload
  2. Each QuestionCard's left border color visually matches the difficulty label color on that card (Novice = green, Beginner = blue, Intermediate = orange, Expert = pink)
  3. The fix does not regress any of the 2693+ existing tests
**Plans**: TBD
**UI hint**: yes

### Phase 21: Layout & Content Ordering
**Goal**: The content area is horizontally centered at 1200px max-width and questions within every section are displayed in Novice → Expert difficulty order
**Depends on**: Phase 20
**Requirements**: LAYOUT-01, CONT-01
**Success Criteria** (what must be TRUE):
  1. On wide viewports the content tree is visually centered with whitespace on both sides, capping at 1200px
  2. On narrow viewports the container spans full width without a horizontal scrollbar
  3. Within any section, questions are ordered Novice first, then Beginner, then Intermediate, then Expert
  4. Custom questions added by the user appear at their assigned difficulty position within the sort order
**Plans**: TBD
**UI hint**: yes

### Phase 22: Extension Icon
**Goal**: The extension displays a proper icon everywhere Chrome renders extension identity — toolbar button, extensions manager, and chrome://extensions
**Depends on**: Phase 21
**Requirements**: EXT-01
**Success Criteria** (what must be TRUE):
  1. The Interviewer Checklist icon is visible in the Chrome toolbar (not the default puzzle piece)
  2. The icon is visible in the Chrome Extensions Manager page
  3. The manifest references the icon asset correctly at all required sizes
**Plans**: TBD

### Phase 23: UI Polish
**Goal**: The AI feedback dialog shows more content without scrolling, all modal buttons carry Lucide icons, the action buttons panel uses a two-column labeled grid, and all remaining interactive elements animate smoothly
**Depends on**: Phase 22
**Requirements**: POL-01, POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. The AI feedback prompt dialog is noticeably taller — user can read more of the generated prompt before needing to scroll
  2. Every action button inside all modals has a Lucide icon displayed alongside its text label
  3. The action buttons panel renders as a two-column grid with visible text labels and smaller icons than before
  4. Accordion sections, sidebar open/close, and any remaining interactive element without a transition now animate smoothly
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
| 16. Bug Fixes & Dark Mode Polish | v1.2 | 2/2 | Complete | 2026-06-22 |
| 17. Difficulty Indicators | v1.2 | 1/1 | Complete | 2026-06-19 |
| 18. Icon Library | v1.2 | 3/3 | Complete | 2026-06-19 |
| 19. Typography & Transitions | v1.2 | 3/3 | Complete | 2026-06-19 |
| 20. Bug Fixes | v1.3 | 0/TBD | Not started | - |
| 21. Layout & Content Ordering | v1.3 | 0/TBD | Not started | - |
| 22. Extension Icon | v1.3 | 0/TBD | Not started | - |
| 23. UI Polish | v1.3 | 0/TBD | Not started | - |
