---
phase: 20-bug-fixes
verified: 2026-06-22T12:25:00Z
status: passed
score: 9/9
overrides_applied: 0
---

# Phase 20: Bug Fixes — Verification Report

**Phase Goal:** Fix two specific regressions from v1.2 — BUG-01 (empty topics not appearing in content tree) and BUG-02 (QuestionCard left border renders gray instead of difficulty color).
**Verified:** 2026-06-22T12:25:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A newly added topic with zero questions is visible as a TopicRow in the flat row output | VERIFIED | `buildFlatRows.ts` line 154: `filteredQuestions.length > 0 \|\| topic.questions.length === 0` |
| 2 | A section containing only empty topics is NOT skipped by the section-skip guard | VERIFIED | Section-skip guard at line 168 (`visibleTopics.length === 0 && section.topics.length > 0`) self-corrects because empty topics are now in `visibleTopics` |
| 3 | Topics with visible filtered questions continue to appear as before (no regression) | VERIFIED | Full vitest run: 4051 tests pass, 0 failing |
| 4 | BUG-01 regression tests exist and pass | VERIFIED | Describe block `"buildFlatRows — BUG-01: empty topic visibility"` at line 714 of `buildFlatRows.test.ts`; both `it()` cases pass |
| 5 | QuestionCard with difficulty 'novice' renders `border-l-green-700` (not `border-green-500`) | VERIFIED | `QuestionCard.tsx` line 9: `novice: 'border-l-4 border-l-green-700'`; VIS-01 test asserts `border-l-green-700` and passes |
| 6 | QuestionCard with difficulty 'intermediate' renders `border-l-blue-700` | VERIFIED | `QuestionCard.tsx` line 10: `intermediate: 'border-l-4 border-l-blue-700'`; VIS-01 test passes |
| 7 | QuestionCard with difficulty 'advanced' renders `border-l-orange-700` | VERIFIED | `QuestionCard.tsx` line 11: `advanced: 'border-l-4 border-l-orange-700'`; VIS-01 test passes |
| 8 | QuestionCard with difficulty 'expert' renders `border-l-pink-700` | VERIFIED | `QuestionCard.tsx` line 12: `expert: 'border-l-4 border-l-pink-700'`; VIS-01 test passes |
| 9 | BADGE_CLASSES is unchanged; all four entries use the -700 shade (no regression) | VERIFIED | `QuestionCard.tsx` lines 16–24: `bg-green-100 text-green-700`, `bg-blue-100 text-blue-700`, `bg-orange-100 text-orange-700`, `bg-pink-100 text-pink-700` — unchanged |

**Score:** 9/9 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/buildFlatRows.ts` | OR-condition fix at line 154 including `topic.questions.length === 0` | VERIFIED | Line 154 reads: `if (filteredQuestions.length > 0 \|\| topic.questions.length === 0)` |
| `src/utils/buildFlatRows.test.ts` | Describe block `"buildFlatRows — BUG-01: empty topic visibility"` with 2 cases | VERIFIED | Block at line 714; case 1 at line 732 (topic-row find), case 2 at line 754 (section-row find) |
| `src/components/QuestionCard.tsx` | `BORDER_CLASSES` map using `border-l-{color}-700` for all four difficulties | VERIFIED | Lines 8–13; all four entries are full static literals; old `border-{color}-500` strings absent |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/utils/buildFlatRows.ts` | `src/app/App.tsx` | `buildFlatRows` called at line 63 of App.tsx | VERIFIED | `import { buildFlatRows } from '../utils/buildFlatRows.js'` at App.tsx line 13; called at line 63 |
| `src/utils/buildFlatRows.ts` | `src/components/SearchGroup.tsx` | `buildFlatRows` called at line 76 | VERIFIED | Second consumer; `import { buildFlatRows }` at SearchGroup.tsx line 4 |
| `src/utils/buildFlatRows.test.ts` | `src/utils/buildFlatRows.ts` | vitest import at test file line 5 | VERIFIED | `import { buildFlatRows, ... } from './buildFlatRows.js'` |
| `src/components/QuestionCard.tsx` `BORDER_CLASSES` | QuestionCard `className` | `BORDER_CLASSES[question.level]` in JSX | VERIFIED | Line 79: `${BORDER_CLASSES[question.level]}` in the template literal className |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| BUG-01 regression tests pass | `npx vitest run src/utils/buildFlatRows.test.ts` (BUG-01 describe block) | Both `it()` cases: PASS | PASS |
| BUG-02 VIS-01 tests pass | `npx vitest run src/components/QuestionCard.test.tsx` (VIS-01 block) | All four difficulty assertions pass with `border-l-{color}-700` | PASS |
| Full test suite — no regressions | `npx vitest run` | 252 test files, 4051 tests passed, 0 failed | PASS |
| Old broken classes absent from QuestionCard.tsx | `grep "border-green-500\|border-blue-500\|border-orange-500\|border-pink-500" QuestionCard.tsx` | No output — absent | PASS |
| Old broken classes absent from QuestionCard.test.tsx | Same grep on test file | No output — absent | PASS |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/QuestionCard.tsx` | 181–182 | `placeholder=` HTML attribute on `<textarea>` | Info | HTML input placeholder — not a stub indicator; legitimate UX text |

No debt markers (TBD, FIXME, XXX) found in either modified file. The `placeholder` hit is a standard HTML attribute on a `<textarea>`, not a code stub.

---

## Human Verification Required

None. Both bugs have determinate, code-level fixes whose correctness is fully verifiable by static source inspection and automated tests. Visual appearance of the border color is the one item that strictly requires a browser, but the fix from shorthand `border-{color}-*` to directional `border-l-{color}-*` is a well-understood Tailwind cascade resolution and the test assertions for `border-l-{color}-700` class presence on the rendered element provide sufficient programmatic confidence.

---

## Gaps Summary

None. Both bugs are resolved:

- **BUG-01**: The single OR-condition change at `buildFlatRows.ts` line 154 is present in the source, the section-skip guard self-corrects as designed, two regression tests lock the behavior, and the full test suite passes with zero failures.
- **BUG-02**: All four `BORDER_CLASSES` entries use `border-l-{color}-700` (directional, no cascade conflict), old `border-{color}-500` shorthand strings are entirely absent from both `QuestionCard.tsx` and `QuestionCard.test.tsx`, `BADGE_CLASSES` is unchanged, all VIS-01 tests pass against the corrected classes, and the full test suite passes.

---

_Verified: 2026-06-22T12:25:00Z_
_Verifier: Claude (gsd-verifier)_
