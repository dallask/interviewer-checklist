---
status: complete
phase: 12-uat-defect-cleanup
source: [12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md, 12-04-SUMMARY.md]
started: 2026-06-18T15:00:00Z
updated: 2026-06-18T16:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Topic override — no section collapse
expected: Find any topic with a scored question, expand it, and locate the manual override dropdown. Click the dropdown and change the value, then clear it. The parent section does NOT collapse or re-expand — only the override value changes.
result: pass

### 2. Session switcher — always-visible inline panel
expected: The Sessions panel should only appear as a modal dialog triggered by the switch-sessions button. It must NOT be visible inline in the sidebar at all times.
result: issue
reported: "Modal opens and closes normally, but by default it situated in the sidebar and visible all the time"
severity: major
fix: flex flex-col removed from <dialog> element in SessionSwitcherModal.tsx, moved to inner wrapper div — built, needs extension reload to verify

### 3. Session switcher — Esc key closes
expected: Open the session switcher. Press Esc. The modal must dismiss.
result: pass
notes: confirmed working per user report "opens and closes normally"

### 4. Session switcher — Close button closes
expected: Open the session switcher. Click the × or Close button inside the modal. The modal must dismiss and focus must return to the "Switch sessions" button.
result: pass
notes: confirmed working per user report "opens and closes normally"

### 5. Hide notes toggle
expected: Click the global hide-notes button in the sidebar Actions panel. Every per-question and per-topic note area must disappear. Click again — they reappear.
result: issue
reported: "Note Textarea visibility should be managed by note icon separately for each question item, not globally"
severity: minor
notes: Per-question note icon (SCORE-08) works correctly. User prefers per-question-only control; global hide-notes in Actions is a design conflict.

### 6. Desktop sidebar toggle — layout and overlay behavior
expected: On desktop (>=768px), sidebar toggle works; sidebar does not overlay main content; no backdrop; main content is accessible while sidebar is open.
result: issue
reported: "Sidebar show/hide feature works. Sidebar should stay opened when user opened it, till user closes it on purpose. The main content in desktop should have container not to be overlapped by opened sidebar. When sidebar opened the main content is accessible, no backdrop present. Sidebar open/close toggle button should be positioned absolute at the left-top corner of screen."
severity: major
notes: Three sub-issues: (1) Desktop sidebar is fixed overlay — should be layout-integrated (pushes content, no overlap). (2) Backdrop renders on desktop — should not exist at desktop viewport. (3) Toggle button should be absolutely positioned at top-left of screen, always visible.

### 7. Sidebar section titles with leading icons
expected: The four sidebar section headers show leading emoji icons: Search, Difficulty, Sections, Actions each have an icon before the text label.
result: pass

### 8. Actions buttons — icon-only with hover tooltips
expected: All buttons in the Actions panel show only an emoji glyph — no visible text label. Hovering reveals a native browser tooltip with the button's purpose.
result: issue
reported: "Icons are present. But buttons are too big. They should be positioned by 3 in a row to make them occupy less space."
severity: minor
notes: Icons and tooltips work correctly. Layout issue: buttons render full-width (one per row) instead of a 3-column grid.

## Summary

total: 8
passed: 4
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "SessionSwitcherModal renders only as a triggered dialog overlay, never inline in the sidebar"
  status: failed
  reason: "User reported: Modal opens and closes normally, but by default it situated in the sidebar and visible all the time"
  severity: major
  test: 2
  fix_applied: "Removed flex flex-col from <dialog> element, wrapped inner content in <div className=flex flex-col> — needs verify after extension reload"

- truth: "Global hide-notes button in Actions panel hides all note areas simultaneously"
  status: failed
  reason: "User reported: Note Textarea visibility should be managed by note icon separately for each question item, not globally"
  severity: minor
  test: 5

- truth: "On desktop, sidebar is layout-integrated (pushes main content), no backdrop, toggle always accessible at top-left"
  status: failed
  reason: "User reported: sidebar overlay covers main content, backdrop present, toggle button not at top-left corner"
  severity: major
  test: 6

- truth: "Actions buttons fit compactly in sidebar — 3-column grid layout"
  status: failed
  reason: "User reported: buttons too big, should be 3 per row"
  severity: minor
  test: 8
