# Requirements: Interviewer Checklist — Chrome Extension

**Defined:** 2026-06-22
**Milestone:** v1.3 UX Refinement & Layout
**Core Value:** A single interviewer/candidate can run an end-to-end weighted scoring session — pick topics, score questions on 0–10 with difficulty weighting, capture notes, see live overall + per-group marks, and export a structured YAML / AI-feedback prompt — entirely inside a browser tab with no backend.

## v1.3 Requirements

### Layout

- [ ] **LAYOUT-01**: Content container has max-width 1200px and is horizontally centered (margin: 0 auto)

### Bug Fixes

- [ ] **BUG-01**: User submits a new section name and it appears in the tree immediately without requiring a refresh
- [ ] **BUG-02**: QuestionCard left border color matches the difficulty label color for that question (Novice/Beginner/Intermediate/Expert)

### Content Ordering

- [ ] **CONT-01**: Questions within each section are sorted by difficulty level (Novice → Beginner → Intermediate → Expert) in the rendered list

### Extension

- [ ] **EXT-01**: Extension icon (from BACKLOG/icon.png or equivalent) is visible in the Chrome toolbar and extension manager

### UI Polish

- [ ] **POL-01**: AI feedback prompt dialog is enlarged so more content is visible without scrolling
- [ ] **POL-02**: All modal action buttons include a Lucide icon alongside their text label
- [ ] **POL-03**: Action buttons panel uses a two-column grid layout; buttons show text labels; icons inside buttons are smaller than current
- [ ] **POL-04**: Accordion sections, sidebar, and all remaining interactive elements animate smoothly (any gaps left after v1.2 Phase 19 CSS transitions)

## Future Requirements

*(None identified for this milestone — all BACKLOG items are in scope)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud backend / cross-device sync | Explicit architectural choice — chrome.storage.local only |
| chrome.storage.sync | 100KB cap incompatible with question bank |
| Mobile / non-Chromium support | Chrome MV3 extension is the product surface |
| Role-switch screen (interviewer vs candidate) | Same UI serves both by design |
| New question bank content | Bank is the interview tech-stack content; users extend via YAML |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 20 | Pending |
| BUG-02 | Phase 20 | Pending |
| LAYOUT-01 | Phase 21 | Pending |
| CONT-01 | Phase 21 | Pending |
| EXT-01 | Phase 22 | Pending |
| POL-01 | Phase 23 | Pending |
| POL-02 | Phase 23 | Pending |
| POL-03 | Phase 23 | Pending |
| POL-04 | Phase 23 | Pending |

**Coverage:**
- v1.3 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-22*
*Last updated: 2026-06-22 after roadmap creation*
