---
phase: 5
slug: scoring-ui-notes-candidate-custom-questions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 5 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 + @testing-library/react |
| **Quick run command** | `npx vitest run src/store/ src/components/ src/utils/buildFlatRows.ts src/storage/` |
| **Full suite command** | `npm test && npm run ci` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** `npm test`
- **After every plan wave:** `npm test && npm run ci && npm run build`
- **Max feedback latency:** 30 seconds automated; human check for UI interactions

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-T1 | 05-01 | 1 | STORE-02 (V3 migration) | unit | `npx vitest run src/storage/` | ❌ Wave 0 | ⬜ pending |
| 05-01-T2 | 05-01 | 1 | SCORE-01, SCORE-02, SCORE-03 | unit | `npx vitest run src/store/` | ❌ Wave 0 | ⬜ pending |
| 05-02-T1 | 05-02 | 2 | SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05 | unit+visual | `npx vitest run src/components/` | ❌ Wave 0 | ⬜ pending |
| 05-02-T2 | 05-02 | 2 | SCORE-05, SCORE-06 | unit+visual | `npx vitest run src/components/` | ❌ Wave 0 | ⬜ pending |
| 05-03-T1 | 05-03 | 3 | SCORE-01–SCORE-06 | visual+smoke | human + `npm run build` | ❌ Wave 0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] V2→V3 migration function + fixture-pinned test
- [ ] Scoring state fields in useAppStore (scores, overrides, notes, topicNotes, customQuestions, candidate, activeSessionId)
- [ ] Fix buildFlatRows index bug (filtered-subset index vs original index)
- [ ] Fix uiState hydration in main.tsx
- [ ] QuestionCard extended with slider + notes textarea

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score slider updates topic mark live | SCORE-01, SCORE-02 | Requires real Chrome + visual inspection | Score 3 questions, verify weighted topic mark updates in real time |
| Notes persist across reload | SCORE-03 | Chrome storage + reload cycle | Type note, reload extension, verify note restored |
| Candidate modal Save/Cancel behavior | SCORE-04 | Requires visual modal interaction | Open modal, fill fields, save; verify persistence; cancel; verify no change |
| Custom question badges and deletion | SCORE-05 | Visual badge + deletion UX | Add custom question, verify "custom" badge; delete; verify removal |
| Reset all clears everything | SCORE-06 | Destructive op + visual confirmation | Score questions, click Reset, confirm; verify all cleared |

---

## Security Threat Model

| Threat | Mitigation | Status |
|--------|------------|--------|
| Score data loss on tab close | storageAdapter.snapshot() before Reset; flushPending() on visibilitychange | ⬜ pending |
| V2→V3 migration corrupts session | Recovery key written on failure; fixture-pinned unit test | ⬜ pending |
| XSS via custom question text | React renders text as text nodes; no dangerouslySetInnerHTML | ⬜ pending |
| Infinite scoring loop | computeTopicMark is pure function; no circular updates | ⬜ pending |
