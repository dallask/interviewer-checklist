---
phase: 06
slug: multiple-named-sessions-switcher
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x with vitest-chrome mock |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npx vitest run src/store/app.test.ts src/components/ActionsGroup.test.tsx --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/store/app.test.ts src/components/ActionsGroup.test.tsx --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SESS-01 | unit | `npx vitest run src/store/app.test.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | SESS-04 | unit | `npx vitest run src/store/app.test.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | SESS-02 | unit | `npx vitest run src/store/app.test.ts --reporter=dot` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | SESS-01 | unit | `npx vitest run src/components/SessionSwitcherModal.test.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | SESS-02 | unit | `npx vitest run src/components/DeleteSessionConfirmDialog.test.tsx --reporter=dot` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | SESS-03 | unit | `npx vitest run src/components/UndoToast.test.tsx --reporter=dot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/app.test.ts` — extend with session action stubs (createSession, switchSession, deleteSession, renameSession, duplicateSession, undoDelete)
- [ ] `src/components/SessionSwitcherModal.test.tsx` — stubs for SESS-01 UI behaviors
- [ ] `src/components/SessionRow.test.tsx` — stubs for inline rename and icon buttons
- [ ] `src/components/DeleteSessionConfirmDialog.test.tsx` — stubs for SESS-02
- [ ] `src/components/UndoToast.test.tsx` — stubs for undo toast timer

*All new test files required; existing test infrastructure (vitest-chrome, jsdom) covers all needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session data survives popup close and reopen | SESS-04 | Requires real chrome.storage.local across popup lifecycle | Load as unpacked, score Q1 in Session 1, close popup, reopen, verify score still showing |
| Undo toast auto-expires after ~10 seconds | SESS-02 | Timer-based behavior in real extension environment | Delete a session, wait 10 seconds without clicking Undo, verify session is gone from list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
