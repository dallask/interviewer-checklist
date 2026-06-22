# Phase 20: Bug Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 20-Bug-Fixes
**Areas discussed:** BUG-01 (section/topic add regression), BUG-02 (difficulty border color)

---

## BUG-01 — Section/Topic Add Regression

### Initial framing question

| Option | Description | Selected |
|--------|-------------|----------|
| No filter active, section just doesn't appear at all | No section filter selected, yet the new section never shows up | |
| Section filter is active, new section gets excluded | Had section filters — new section stays hidden | |
| Section flashes then disappears | Section briefly appears then vanishes | |
| Different behavior | Something else | ✓ |

**User's choice:** "Section appears normally. But user cannot add topic ('Add topic' button) under any section"
**Notes:** The real bug is in topic add, not section add. Sections appear correctly.

### Follow-up — what happens when clicking Add topic?

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing happens (click has no effect) | Button appears but clicking does nothing | |
| Form opens but submitting doesn't add the topic | Fill in form, hit submit — topic doesn't show | ✓ |
| Form doesn't open for newly-added sections only | Works for default sections, broken for new ones | |
| Form opens but then immediately closes | Form flashes open then dismisses | |

**User's choice:** Form opens, fills correctly, submits — but topic doesn't appear.
**Notes:** This is consistent with the buildFlatRows filtering bug (topics with no questions excluded from visibleTopics).

### Follow-up — reload behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — section + new topic both appear after reload | Data persisted; filtering is the display issue | |
| No — topic is gone entirely on reload too | addTopic() itself may not be persisting | ✓ |
| Not sure — haven't tested reload | | |

**User's choice:** Topic is gone on reload too.
**Notes:** Root cause clarification: data IS saved correctly via subscribe→storageAdapter.write. But on reload, `buildFlatRows` applies the same filter (topic.questions.length === 0 → excluded from visibleTopics) so the topic never renders. It is effectively invisible despite being in storage.

### BUG-01 fix direction

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show the topic row with custom question form | Empty topic renders as TopicRow; user can add questions | ✓ |
| Yes, but show a helpful empty-state hint too | Render topic + "No questions yet" message | |
| Topic is just organizational for now | Show header but no questions section | |

**User's choice:** Show the topic row with the existing custom question form (no special empty-state needed).

---

## BUG-02 — Difficulty Border Color Mismatch

### Which levels are affected?

**User's choice:** All four — Novice (green), Intermediate (blue), Advanced (orange), Expert (pink).
**Notes:** Comprehensive failure across all levels, consistent with a Tailwind v4 cascade issue rather than a data mapping issue.

### Border appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Border appears but is the wrong color | Visible colored edge, but not matching badge | |
| Border appears gray/invisible (not the expected color) | Left edge looks gray or nearly transparent | ✓ |
| Border is correct in light mode, wrong in dark mode only | Light = fine, dark = broken | |

**User's choice:** Border appears gray/invisible.
**Notes:** Confirms root cause — `border-gray-100` (from `border-b border-gray-100` in the className) overrides the `border-{color}-500` via Tailwind v4 cascade. Fix: use `border-l-{color}` (side-specific utility) to avoid touching the global `border-color` property.

### Shade matching

| Option | Description | Selected |
|--------|-------------|----------|
| Same hue is fine — fix the gray/wrong-color issue | Exact shade doesn't matter | |
| Match exactly (badge text is -700, border should also be -700) | Change -500 to -700 | ✓ |
| Keep border as -500, just fix the gray override issue | -500 shade is fine | |

**User's choice:** Match badge text color exactly — use `-700` shade for border colors.
**Notes:** BADGE_CLASSES uses `text-green-700`, `text-blue-700`, `text-orange-700`, `text-pink-700`. BORDER_CLASSES should become `border-l-green-700`, `border-l-blue-700`, `border-l-orange-700`, `border-l-pink-700`.

---

## Claude's Discretion

- Order of fixes (BUG-01 first vs BUG-02 first) — no preference stated
- Whether to add a regression test for the BUG-01 empty-topic scenario

## Deferred Ideas

None — discussion stayed within phase scope.
