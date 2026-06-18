---
status: complete
phase: 10-chrome-web-store-submission
source:
  - cws-assets/CWS-SMOKE-TEST.md
started: 2026-06-18T09:30:00Z
updated: 2026-06-18T10:04:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Pre-flight
expected: dist/ exists at repo root. dist.zip exists at repo root. No other copy of Interviewer Checklist in the test profile (check chrome://extensions).
result: pass

### 2. Install
expected: chrome://extensions opens in test profile, Developer mode enabled, Load unpacked → select dist/ succeeds with no error banner, service worker shows as active (or registers on first action click).
result: pass

### 3. First-run welcome flow (POLISH-01)
expected: New tab opens automatically with welcome page. Welcome page shows title, version string (1.0.0), "Pin to your toolbar" section, and two audience cards (Interviewer / Candidate). Clicking "Start demo session" navigates to main app with seeded demo session loaded (scored questions visible).
result: pass

### 4. Toolbar action and shortcut (FOUND-03, POLISH-02)
expected: Clicking the toolbar icon opens the app in a full-page tab. Keyboard shortcut Alt+Shift+I (macOS Cmd+Shift+I) also opens the app.
result: pass

### 5. Core scoring loop (SCORE-01..06)
expected: Slider on a question updates live topic mark. Manual topic override replaces computed mark; clearing restores it. Per-question and per-topic notes persist across reload. Candidate Details (name/email/role/date) persist across reload. Custom question shows "custom" badge and participates in scoring. Reset All (with confirmation) clears scores, overrides, notes, customs.
result: issue
reported: "\"Setting a manual topic override replaces the computed mark; clearing it restores the computed mark\" when I click on the dropdown to manually set the mark, section collapses, and expandes when I click it again."
severity: major
sub_item: "Manual topic override dropdown — click event propagates to parent topic-row, collapsing the section; second click re-expands"

### 6. Sessions (SESS-01..04)
expected: Session switcher shows active session. Create / rename / duplicate / delete all work. Delete shows undo toast. Set scores in session A → switch to B → switch back → scores in A intact.
result: issue
reported: "Issues: 1. \"Hide notes\" does nothing (it should hide current notes) 2. Sessions dialog situated in the sidebar and I cannot close it."
severity: major
sub_items:
  - "Hide notes button does nothing — should hide current notes (surfaced during test 6; defect lives in actions/UI shell)"
  - "Sessions dialog renders inside the sidebar and cannot be closed (no backdrop click, no Esc, no Close button reachable)"

### 7. YAML import / export (YAML-01..03)
expected: Export produces structural YAML with meta / candidate / sections blocks. Importing that file into a new session shows preview modal and applies correctly. Importing a legacy progress-only YAML matches by stable IDs and applies scores without losing the bank.
result: issue
reported: |
  Issues:
  1. Export/import should contain not only index, score, note for default questions but also text and level. User should be able to remove default questions the same way as custom ones.
  2. Custom questions exported without notes that user added
  3. Export YAML, Import YAML, and other buttons in sidebar "Actions" section should be Icons. When user hovers on those iconic buttons, title tooltip should appear to show button purpose short title.
  4. Each section title in sidebar (Search, Difficulty, Sections, Actions) should have relevant icon before text.
severity: major
sub_items:
  - "YAML schema expansion: default questions need text+level + per-question delete flag (currently only index/score/note)"
  - "Custom question notes are dropped on export (yamlExport.ts custom-question serialization missing notes field)"
  - "ActionsGroup buttons should be icon-only with hover tooltips (text → icon refactor)"
  - "Sidebar section titles (Search/Difficulty/Sections/Actions) need leading icons"

### 8. AI prompt (AI-01, AI-02)
expected: AI Prompt modal opens from populated session. Prompt body embeds candidate details + computed marks. Copy button copies full text to clipboard (paste into a notes app to verify).
result: pass

### 9. UI shell (UI-01..08)
expected: Sidebar collapse/expand works (icon-only when collapsed). Viewport < 900px makes sidebar an overlay. Search debounces and shows live result count. Difficulty + section multi-select filters work with live counts. Dark mode toggle persists across reload. Tab order is sensible; focus rings visible. prefers-reduced-motion suppresses non-essential animation.
result: issue
reported: "All works except Sidebar collapsing on the viewport >767px. Sidebar stays persisitent on the viewport >767px, button \"Open sidebar\" does nothing on that viewport."
severity: major
sub_item: "Desktop sidebar (≥md breakpoint, 768px+) is locked open — toggle state only drives the mobile overlay; 'Open sidebar' button is a no-op above 767px"

### 10. Print (POLISH-05)
expected: Cmd/Ctrl+P preview shows all collapsed cards expanded. Sidebar and toolbar controls hidden in print preview.
result: pass

### 11. Keyboard shortcuts (POLISH-03)
expected: `/` focuses sidebar search. `\` toggles sidebar collapsed state. Esc clears search when focused there; closes active modal otherwise. Shortcuts do NOT fire while focus is inside a textarea or input (typing / or \ in a notes field inserts the character).
result: pass

### 12. Storage / no-network (FOUND-02, CWS-01)
expected: DevTools Network tab — exercise app for 60s (score, switch sessions, open AI prompt, import YAML). Zero non-extension network requests appear. Service worker Storage panel — only chrome.storage.local is populated; chrome.storage.sync, localStorage, IndexedDB, cookies empty for extension origin.
result: pass

### 13. Uninstall (CWS-01)
expected: Remove extension from chrome://extensions. Reinstall (Load unpacked → dist/). After reinstall, no prior data visible — welcome page reappears, no prior sessions exist.
result: pass

## Summary

total: 13
passed: 9
issues: 4
pending: 0
skipped: 0
blocked: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Manual topic override dropdown replaces the computed mark without collapsing the topic section"
  status: failed
  reason: "User reported: when I click on the dropdown to manually set the mark, section collapses, and expandes when I click it again."
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Session switcher modal can be closed by the user (Esc, backdrop click, or visible Close button)"
  status: failed
  reason: "User reported: Sessions dialog situated in the sidebar and I cannot close it."
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Hide notes action hides current notes when toggled (surfaced during test 6 — control lives in ActionsGroup / UI shell)"
  status: failed
  reason: "User reported: \"Hide notes\" does nothing (it should hide current notes)"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "YAML export/import schema for default questions includes text and level (not only index/score/note), and the user can remove default questions the same way as custom ones"
  status: failed
  reason: "User reported: Export/import should contain not only index, score, note for default questions but also text and level. User should be able to remove default questions the same way as custom ones."
  severity: major
  test: 7
  scope: "schema-change + UX-change (default-question delete is new behavior)"
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Exporting a session preserves the per-custom-question notes the user added"
  status: failed
  reason: "User reported: Custom questions exported without notes that user added"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sidebar Actions buttons are icons with hover tooltip showing each button's short purpose label"
  status: failed
  reason: "User reported: Export YAML, Import YAML, and other buttons in sidebar 'Actions' section should be Icons. When user hovers on those iconic buttons title tooltip should appear to show button purpose short title."
  severity: minor
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Each sidebar section title (Search, Difficulty, Sections, Actions) has a relevant icon before its text"
  status: failed
  reason: "User reported: Each section title in sidebar (Search, Difficulty, Sections, Actions) should have relevant icon before text."
  severity: cosmetic
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sidebar collapse/expand works on all viewports (including ≥768px desktop) — the 'Open sidebar' button toggles visibility regardless of viewport width"
  status: failed
  reason: "User reported: All works except Sidebar collapsing on the viewport >767px. Sidebar stays persisitent on the viewport >767px, button \"Open sidebar\" does nothing on that viewport."
  severity: major
  test: 9
  notes: "767px boundary suggests Tailwind md: breakpoint (768px+). Desktop sidebar likely always-visible via CSS while sidebarOpen state only drives the mobile overlay."
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
