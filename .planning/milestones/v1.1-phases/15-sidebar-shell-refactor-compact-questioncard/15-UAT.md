---
status: complete
phase: 15-sidebar-shell-refactor-compact-questioncard
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md, 15-04-SUMMARY.md]
started: 2026-06-18T15:00:00Z
updated: 2026-06-18T15:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Compact QuestionCard — score dropdown
expected: Each question row shows a score <select> dropdown on the left with options Skip, 0, 1, … 10. Selecting a value updates the score live. The card stays as a single compact line.
result: issue
reported: "yes, but dropdown background color makes it difficult to read" — in dark mode the dropdown bg blends into the content area, low contrast
severity: minor
fix: score select needs explicit dark-mode bg/text/border colors (e.g. dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600)

### 2. Note icon toggle
expected: Each question row has a 📝 note icon button on the right. Clicking it reveals a textarea below the question. Clicking it again hides the textarea. The card collapses back to a single line when the note area is hidden.
result: issue
reported: "if user set some note text in the textarea, the button does not collapse it again"
severity: major
expected_behavior: |
  - Click 📝 → textarea opens (empty)
  - Type note → note saved
  - Click 📝 again → textarea collapses; icon updates to indicate note is present
  - Click 📝 again → textarea reopens with saved note text inside

### 3. Delete button hover-reveal
expected: When hovering over a question row, a delete/remove × button fades in on the far right. Moving the cursor away causes it to fade back out. Clicking it removes the question.
result: pass

### 4. Sticky sidebar header
expected: The top of the sidebar shows a sticky header with the sidebar toggle button, the candidate-details button, and a "Final mark · N/M topics" line with a progress bar and score badge. Scrolling through a long question list — the header stays pinned at the top while content scrolls beneath it.
result: issue
reported: "yes, but opened sidebar locks main content scrolling"
severity: major
notes: related to Phase 12 desktop sidebar overlay issue — fixed overlay / backdrop likely captures scroll events on main content; will be resolved with layout-integrated sidebar fix

### 5. Sidebar footer credit lockup
expected: At the very bottom of the sidebar (below all questions) there is a footer showing "Developed by Ievgen Kyvgyla" with a clickable link to https://kivgila.pro, and an "About" button.
result: issue
reported: footer present but needs polish
severity: minor
changes_requested: |
  - "About" text button → iconic ℹ️ (info) button
  - Footer font color should be lighter
  - Text center-aligned
  - Remove version number (v1.0.0) and "What's new" link from footer

### 6. About button opens modal
expected: Clicking "About" in the sidebar footer opens a modal dialog containing the application name ("Interviewer Checklist"), the current version number, and credits/links. The modal overlays the page content.
result: issue
reported: "yes, but it should contain more information about application and its features"
severity: minor
notes: modal opens correctly; content needs expansion to describe the app's purpose and key features

### 7. AboutModal closes
expected: With the About modal open: pressing Esc dismisses it; clicking the backdrop (outside the modal box) dismisses it; clicking a Close button inside dismisses it. After closing, focus returns to the About button in the footer.
result: pass

## Summary

total: 7
passed: 2
issues: 5
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Score dropdown is clearly readable in dark mode"
  status: failed
  reason: "dropdown background color blends into dark content area, low contrast"
  severity: minor
  test: 1

- truth: "Note icon button collapses textarea and shows filled-note indicator when note text is present"
  status: failed
  reason: "when textarea has text, clicking the note button does not collapse it; no filled-note icon state"
  severity: major
  test: 2

- truth: "Main content remains scrollable while sidebar is open"
  status: failed
  reason: "opened sidebar locks main content scrolling"
  severity: major
  test: 4
  notes: same root cause as Phase 12 desktop sidebar overlay issue

- truth: "Sidebar footer: iconic ℹ️ About button, lighter text, centered, no version number"
  status: failed
  reason: "About is a text button; font too dark; text not centered; v1.0.0 and What's new visible"
  severity: minor
  test: 5

- truth: "About modal contains description of app purpose and key features"
  status: failed
  reason: "modal opens but lacks feature descriptions"
  severity: minor
  test: 6

- truth: "UI interactions use CSS transitions/animations for smooth feel"
  status: failed
  reason: "interface feels abrupt; user requests transitions and animations throughout"
  severity: minor

- truth: "All UI elements use a consistent material-like icon pack"
  status: failed
  reason: "interface uses ad-hoc emoji glyphs; user requests a proper icon library (material-like look)"
  severity: major

- truth: "'Collapse All' collapses both sections and topics"
  status: failed
  reason: "Collapse All only collapses topics, not parent sections"
  severity: minor

- truth: "Question items have a thick left border colored by difficulty, plus a difficulty badge label on the right"
  status: failed
  reason: "no left border or difficulty badge visible; prototype (Image #10) shows: green=novice, blue=intermediate, orange=advanced, pink=expert borders and NOVICE/INTERMEDIATE/ADVANCED/EXPERT badge chips"
  severity: major

- truth: "Main font is 13px; interface is compact"
  status: failed
  reason: "font appears larger than 13px; user requests more compact density throughout"
  severity: minor
