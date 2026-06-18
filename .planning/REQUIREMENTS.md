# Requirements: Interviewer Checklist — Chrome Extension

**Defined:** 2026-06-18
**Milestone:** v1.2 UAT Closure & Visual Polish
**Core Value:** A single interviewer/candidate can run an end-to-end weighted scoring session entirely inside a browser tab with no backend.

## v1.2 Requirements

All requirements derived from open UAT gaps in Phases 12–15.

### Bug Fixes

- [ ] **BUG-01**: User can submit the Add Section form and the new section appears immediately in the content tree
- [ ] **BUG-02**: User can submit the Add Topic form and the new topic appears immediately under the target section
- [ ] **BUG-03**: User can click the note icon to close the textarea even when the textarea contains text

### Visual Polish

- [ ] **POL-01**: Score dropdown is clearly readable in dark mode (explicit bg/text/border dark-mode colors, sufficient contrast)
- [ ] **POL-02**: Base font size is 13px and key spacing is tightened for a more compact layout throughout the sidebar and content tree
- [ ] **POL-03**: Key interactions (sidebar open/close, topic/section expand/collapse, modal open/close, note toggle) have CSS transitions or animations for a smooth feel

### Visual Enhancements

- [ ] **VIS-01**: Each QuestionCard row has a thick left border whose color corresponds to its difficulty (green = novice, blue = intermediate, orange = advanced, pink = expert)
- [ ] **VIS-02**: Each QuestionCard shows a difficulty badge chip (NOVICE / INTERMEDIATE / ADVANCED / EXPERT) on the right side of the row
- [ ] **VIS-03**: All UI chrome icons (sidebar actions, toggle buttons, section icons, badges) are replaced with glyphs from a consistent material-like icon library (e.g. Lucide React) instead of ad-hoc emoji

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync / backend | Explicit architectural constraint — chrome.storage.local only |
| New question bank sections | Bank content additions are independent of this milestone |
| CWS re-submission | Manual action; artifacts from v1.0 still valid |
| New AI/prompt features | Out of UAT scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 16 | Pending |
| BUG-02 | Phase 16 | Pending |
| BUG-03 | Phase 16 | Pending |
| POL-01 | Phase 16 | Pending |
| VIS-01 | Phase 17 | Pending |
| VIS-02 | Phase 17 | Pending |
| POL-02 | Phase 19 | Pending |
| POL-03 | Phase 19 | Pending |
| VIS-03 | Phase 18 | Pending |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-18*
*Last updated: 2026-06-18 after initial definition*
