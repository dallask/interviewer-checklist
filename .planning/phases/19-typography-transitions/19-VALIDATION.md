---
phase: 19
slug: typography-transitions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~6 seconds (2693 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | POL-02 | — | N/A | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 19-01-02 | 01 | 1 | POL-02 | — | N/A | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 19-02-01 | 02 | 1 | POL-03 | — | N/A | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 19-02-02 | 02 | 1 | POL-03 | — | N/A | unit | `npm test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

**Pre-breaking tests to fix within the same task as implementation:**
- `src/components/SidebarGroup.test.tsx` line 67 — asserts `hidden` attribute; breaks when D-03 removes it. Fix: assert `style.gridTemplateRows === '0fr'` when `isOpen=false`.
- `src/components/QuestionCard.test.tsx` lines 182/187 — asserts `textarea.className` contains `'hidden'`; breaks when D-04 adds grid wrapper. Fix: assert wrapper div `style.gridTemplateRows === '0fr'` when `notesOpen=false`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Body text reads as 13px in browser | POL-02 | Font size rendering requires visual inspection | Load extension; open DevTools; inspect element font-size on QuestionCard text |
| CSS transitions are visible | POL-03 | Animation requires browser rendering | Open sidebar, click group headers, open modals — transitions must be visible |
| Compact density is readable | POL-02 | Perceived density is a visual judgment | Compare before/after screenshots of content tree |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
