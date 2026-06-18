---
phase: 16
slug: bug-fixes-dark-mode-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=verbose 2>&1 \| tail -5` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose 2>&1 | tail -5`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | BUG-01 | — | N/A | unit | `npm test -- ContentTree` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | BUG-02 | — | N/A | unit | `npm test -- ContentTree` | ✅ | ⬜ pending |
| 16-02-01 | 02 | 1 | BUG-03 | — | N/A | unit | `npm test -- QuestionCard` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 1 | POL-01 | — | N/A | unit | `npm test -- QuestionCard` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (Vitest already installed; `QuestionCard.test.tsx` and `ContentTree`-related tests already exist).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score dropdown visible in dark mode | POL-01 | Browser CSS rendering required | Toggle dark mode via extension UI; verify select option text is readable |
| New section appears in virtual list after submit | BUG-01 | Virtualizer scroll requires browser | Submit add-section form; verify new section row is visible |
| New topic appears in virtual list after submit | BUG-02 | Virtualizer scroll requires browser | Submit add-topic form; verify new topic row is visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
