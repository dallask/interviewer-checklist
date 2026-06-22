---
phase: 21-layout-content-ordering
verified: 2026-06-22T12:40:00Z
status: human_needed
score: 9/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Wide viewport centering (>1232px)"
    expected: "Content rows are visually centered with equal whitespace on both sides — does not span edge to edge"
    why_human: "CSS max-width centering cannot be verified without rendering in a browser"
  - test: "Narrow viewport no horizontal scrollbar (~600px)"
    expected: "Content fills full width with ~16px padding on each side; no horizontal scrollbar appears"
    why_human: "Overflow / scrollbar presence requires live browser viewport"
  - test: "Print layout candidate header"
    expected: "Candidate name/role/date block is constrained and does not span full print width"
    why_human: "Print layout requires browser print preview"
---

# Phase 21: Layout & Content Ordering — Verification Report

**Phase Goal:** Horizontally center the content area at 1200px max-width on wide viewports (LAYOUT-01) and sort questions within each topic by difficulty novice → intermediate → advanced → expert with custom questions merged at their difficulty position (CONT-01).
**Verified:** 2026-06-22T12:40:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Within any open topic, questions are displayed novice → intermediate → advanced → expert | VERIFIED | `buildFlatRows.ts` line 164: `filteredQuestions.sort((a, b) => DIFF_ORDER[a.level] - DIFF_ORDER[b.level])`. Test at line 788 confirms emission order equals `['novice', 'intermediate', 'advanced', 'expert']`. All 222 tests pass. |
| 2 | Custom questions appear at their difficulty position alongside default questions, not appended after all defaults | VERIFIED | `buildFlatRows.ts` lines 219–263: MergedQuestion discriminated union built from filteredQuestions + customForTopic, then `merged.sort(...)` by difficulty before emit. Old two-loop pattern (`for (const cq of customForTopic)`) is absent. Test at line 810 asserts custom novice is NOT last; passes. |
| 3 | Default question score key (originalIndex) is unchanged by sort order | VERIFIED | `buildFlatRows.ts` line 158: `filteredQuestions.push({ ...question, originalIndex: idx })` before sort. Line 247: `index: entry.originalIndex` — original array position, not sort position. Test at line 796 asserts `noviceRow.index === 1` (was at index 1 in questions array before sort). |
| 4 | Custom question rows carry isCustom=true and customId after the merged sort | VERIFIED | `buildFlatRows.ts` lines 259–260: `isCustom: true, customId: entry.cq.id`. Test at line 830 asserts both fields on the emitted custom row. |
| 5 | All existing buildFlatRows tests pass without modification | VERIFIED | `npx vitest run src/utils/buildFlatRows.test.ts` — 222 tests passed, 6 test files passed, 0 failures. |
| 6 | Centering wrapper (mx-auto w-full max-w-[1200px] px-4) is inside every virtual row item div | VERIFIED | `ContentTree.tsx` line 115: `<div className="mx-auto w-full max-w-[1200px] px-4">` wraps all five row-type conditionals (SectionRow, TopicRow, QuestionCard, add-section-trigger, add-topic-trigger) inside the virtual item outer div. |
| 7 | The scroll container ref={parentRef} remains full viewport width — no max-w applied | VERIFIED | `ContentTree.tsx` line 79: `<div ref={parentRef} className="flex-1 overflow-y-auto">` — confirmed: `grep 'flex-1 overflow-y-auto' ContentTree.tsx | grep -c 'max-w'` returns 0. |
| 8 | The print-only candidate header is constrained to max-w-[1200px] mx-auto | VERIFIED | `ContentTree.tsx` line 83: className `"hidden print:block print:mb-4 max-w-[1200px] mx-auto px-4"`. `grep -n 'max-w-\[1200px\]' ContentTree.tsx` shows exactly two occurrences: line 83 (print header) and line 115 (virtual item wrapper). |
| 9 | All five row types are wrapped identically inside the centering div | VERIFIED | `ContentTree.tsx` lines 116–147: SectionRow, TopicRow, QuestionCard, add-section-trigger button/form, add-topic-trigger button/form — all inside the single `<div className="mx-auto w-full max-w-[1200px] px-4">` at line 115. |
| 10 | On viewports wider than 1232px, content rows are visually centered with equal whitespace on both sides | UNCERTAIN — needs human | CSS class is correctly applied. Visual confirmation requires browser rendering at wide viewport. |

**Score:** 9/10 truths verified (1 requires human)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/buildFlatRows.ts` | Difficulty sort and custom question merge; contains DIFF_ORDER | VERIFIED | DIFF_ORDER at lines 5–10 (3 occurrences). MergedQuestion discriminated union at lines 219–221. Merged sort at lines 233–237. Unified emit loop lines 239–263. |
| `src/utils/buildFlatRows.test.ts` | Sort and merge regression tests; contains "CONT-01 difficulty sort" | VERIFIED | 4 CONT-01 references. Two describe blocks: "buildFlatRows — CONT-01 difficulty sort" (lines 787–807) and "buildFlatRows — CONT-01 custom question merge" (lines 809–843). 4 tests total. All pass. |
| `src/components/ContentTree.tsx` | Centering wrapper inside each virtual row item div; contains max-w-[1200px] | VERIFIED | 2 occurrences of `max-w-[1200px]` (line 83 print header, line 115 virtual item wrapper). Single centering div wraps all row types. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `buildFlatRows.ts` | `QuestionRow.index` | `index: entry.originalIndex` — not remapped by sort | VERIFIED | Line 247: `index: entry.originalIndex`. originalIndex set at line 158 before sort (= idx in topic.questions[]). |
| `buildFlatRows.ts` | `QuestionRow.customId` | `entry.cq.id` for custom rows in merged emit loop | VERIFIED | Line 260: `customId: entry.cq.id`. |
| `ContentTree.tsx virtualItem div` | centering wrapper div | inner div with className `mx-auto w-full max-w-[1200px] px-4` | VERIFIED | Line 115: exact class string `"mx-auto w-full max-w-[1200px] px-4"` as the single child of the outer absolute-positioned div. |
| `ContentTree.tsx print header` | centering class | `max-w-[1200px] mx-auto` on the print-only div | VERIFIED | Line 83: className includes `max-w-[1200px] mx-auto px-4`. Pattern `hidden print:block.*max-w-\[1200px\]` matches. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `buildFlatRows.ts` merged emit loop | `merged` array | `topic.filteredQuestions` (real questions from bank) + `filters.customQuestions` (from store) | Yes — populated from actual question bank data and user store | FLOWING |
| `ContentTree.tsx` virtual rows | `rows` prop | `buildFlatRows(...)` call in parent component | Yes — rows come from the sorted buildFlatRows output | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CONT-01 difficulty sort emits correct order | `npx vitest run src/utils/buildFlatRows.test.ts` | 222 tests passed, 0 failures | PASS |
| DIFF_ORDER constant present | `grep -c 'DIFF_ORDER' src/utils/buildFlatRows.ts` | 3 | PASS |
| Old two-loop pattern absent | `grep -c 'for (const cq of customForTopic)' src/utils/buildFlatRows.ts` | 0 | PASS |
| max-w-[1200px] appears exactly twice in ContentTree.tsx | `grep -c 'max-w-\[1200px\]' src/components/ContentTree.tsx` | 2 | PASS |
| parentRef div has no max-w | `grep 'flex-1 overflow-y-auto' ContentTree.tsx \| grep -c 'max-w'` | 0 | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| CONT-01 | 21-01-PLAN.md | Questions within each topic displayed in difficulty order; custom questions merged at difficulty position | SATISFIED | buildFlatRows.ts: DIFF_ORDER constant, in-place sort on filteredQuestions, unified MergedQuestion sort replacing two-loop pattern. 4 regression tests pass. |
| LAYOUT-01 | 21-02-PLAN.md | Content area horizontally centered at 1200px max-width on wide viewports, full-width with 16px padding on narrow viewports | SATISFIED (code) / UNCERTAIN (visual) | ContentTree.tsx: centering wrapper at line 115, print header at line 83. Visual confirmation deferred to human check. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No TBD/FIXME/XXX debt markers found in either modified file. No stub return patterns. No hardcoded empty arrays in rendering paths. |

---

### Human Verification Required

#### 1. Wide-viewport centering (>1232px)

**Test:** Open the extension in a browser at a wide viewport (1440px or full-screen). Observe the question/section/topic rows.
**Expected:** Content rows are centered horizontally with equal whitespace on both sides — content does not span edge to edge.
**Why human:** CSS `max-w-[1200px] mx-auto` centering requires browser rendering to confirm the visual result; grep cannot confirm this.

#### 2. Narrow-viewport no horizontal scrollbar (~600px)

**Test:** Resize the browser window to a narrow viewport (~600px wide). Look for a horizontal scrollbar.
**Expected:** Content fills the full available width with ~16px padding on each side. No horizontal scrollbar appears.
**Why human:** Horizontal scrollbar presence/absence can only be confirmed in a live browser with the actual viewport geometry.

#### 3. Print layout candidate header

**Test:** Open browser print preview (Cmd+P / Ctrl+P).
**Expected:** The candidate name/role/date header block is constrained and does not span the full print width.
**Why human:** Print layout requires browser print preview; cannot be confirmed from static code inspection alone.

---

### Gaps Summary

No blocking gaps. All code-verifiable must-haves are satisfied:

- CONT-01 is fully implemented: `buildFlatRows.ts` has `DIFF_ORDER`, in-place difficulty sort on `filteredQuestions`, and a unified `MergedQuestion` discriminated-union emit loop replacing the former separate default/custom loops. Score key stability is preserved via `entry.originalIndex`. Custom rows carry `isCustom: true` and `customId`. Four regression tests pass.
- LAYOUT-01 is fully implemented: `ContentTree.tsx` has a `<div className="mx-auto w-full max-w-[1200px] px-4">` wrapper inside every virtual row item div (all five row types), and the print-only header carries the same constraint. The `parentRef` scroll container remains full-width.

The three human verification items above are visual/layout checks that require a live browser. They do not indicate code deficiencies — the implementation matches the plan exactly. Awaiting human sign-off to close the phase.

---

_Verified: 2026-06-22T12:40:00Z_
_Verifier: Claude (gsd-verifier)_
