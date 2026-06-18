---
phase: 15-sidebar-shell-refactor-compact-questioncard
verified: 2026-06-18T17:40:00Z
status: human_needed
score: 8/8 must-haves verified (automated); 5 behaviors require browser confirmation
overrides_applied: 0
human_verification:
  - test: "Score dropdown renders at left of the compact row"
    expected: "A <select> with Skip + 0–10 options is visible at the left side of each question row; selecting a value updates the displayed score"
    why_human: "CSS layout (flex order, visual position) and option list rendering cannot be confirmed by grep or jsdom"
  - test: "Note icon (pencil) toggles textarea below the question card"
    expected: "Clicking the note button reveals a textarea below the card; clicking again hides it. When hideNotes is toggled on via the global store, the textarea wrapper is hidden regardless of notesOpen state"
    why_human: "Toggle interaction and hideNotes global-override interaction require live browser state"
  - test: "Delete button hover-reveal via CSS group-hover"
    expected: "The delete/remove button (x) is invisible by default (opacity-0) and becomes visible only when the card row is hovered (group-hover:opacity-100); keyboard focus also reveals it (focus-visible:opacity-100)"
    why_human: "CSS hover state cannot be tested by jsdom; group-hover class behaviour requires a real rendering engine"
  - test: "Sticky SidebarHeader stays fixed at top while sidebar content scrolls"
    expected: "The SidebarHeader remains visible at the top of the sidebar as the user scrolls through the question list below it; the scrollable region is the inner flex-1 overflow-y-auto div only"
    why_human: "Sticky positioning (sticky top-0 z-10) requires a real scroll context in a browser viewport to verify"
  - test: "SidebarFooter credit lockup and About button open AboutModal"
    expected: "'Developed by Ievgen Kyvgyla' text is visible in the footer with a working link to https://kivgila.pro; clicking 'About' opens the AboutModal native dialog via showModal(); Esc and backdrop click close it; focus returns to the About button after close"
    why_human: "Native <dialog> showModal() behaviour, backdrop click, Esc close, and focus restoration require a real browser environment"
---

# Phase 15: Sidebar Shell Refactor + Compact QuestionCard Verification Report

**Phase Goal:** The sidebar surfaces session-level progress at all times, exposes app credits/about, and individual questions read as a compact one-line row that expands only when the user opts in.
**Verified:** 2026-06-18T17:40:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                  | Status      | Evidence                                                                                  |
|----|--------------------------------------------------------------------------------------------------------|-------------|-------------------------------------------------------------------------------------------|
| 1  | SCORE-08: Question card renders as a compact single-line row with score dropdown on left, note icon button on right, and collapses by default | VERIFIED | `QuestionCard.tsx:59-119` — flex row with `<select>` at left, `📝` button at right, textarea hidden by default (`hidden={!notesOpen && !localNote && !printMode}`) |
| 2  | SCORE-08: Score control is a dropdown with Skip + 0–10 options                                         | VERIFIED    | `QuestionCard.tsx:61-76` — `<select>` with `<option value="skip">Skip</option>` then `{[0..10].map(n => <option>)}`   |
| 3  | SCORE-08: Note icon button toggles a textarea below the question                                       | VERIFIED    | `QuestionCard.tsx:91-100,130-141` — button `onClick` toggles `notesOpen`; textarea's `hidden` attribute reads `!notesOpen && !localNote && !printMode` |
| 4  | UI-13: Sidebar has a sticky top header not scrolling with sidebar content                              | VERIFIED    | `SidebarHeader.tsx:69` — `className="sticky top-0 z-10 ..."`; `Sidebar.tsx:32` — scrollable region is `<div className="flex-1 overflow-y-auto ...">` inside aside, after SidebarHeader |
| 5  | UI-13: Sticky header contains toggle, candidate-detail button, "Final mark · N/M topics" line, thin progress bar, and numeric mark badge | VERIFIED | `SidebarHeader.tsx:71-113` — toggle button (line 72), candidate button (line 81), progress text `Final mark · {scoredTopics}/{totalTopics} topics` (line 98), mark badge (line 101), `h-1 bg-blue-500` progress bar (line 108) |
| 6  | UI-14: SidebarFooter renders "Developed by Ievgen Kyvgyla, https://kivgila.pro" credit lockup and an About button | VERIFIED | `SidebarFooter.tsx:29-46` — `<span>Developed by </span>` + `<a href="https://kivgila.pro">Ievgen Kyvgyla</a>` + `<button ... onClick={() => aboutDialogRef.current?.showModal()}>About</button>` |
| 7  | UI-15: About button opens an AboutModal using native `<dialog>` with showModal()                       | VERIFIED    | `SidebarFooter.tsx:19,42,60` — `useRef<HTMLDialogElement>`, `showModal()` call, `<AboutModal dialogRef={aboutDialogRef} />`; `AboutModal.tsx:53` — `<dialog ref={dialogRef} ...>` (no `open` prop) |
| 8  | UI-15: AboutModal contains application name, version, link to kivgila.pro, and credits                 | VERIFIED    | `AboutModal.tsx:59-86` — `<h2>Interviewer Checklist</h2>`, `Version {version}` (from `chrome.runtime.getManifest()`), `<a href="https://kivgila.pro">Ievgen Kyvgyla</a>`, description paragraph |

**Score:** 8/8 truths verified (automated code evidence)

---

### Required Artifacts

| Artifact                                     | Expected                                                  | Status   | Details                                                                                 |
|----------------------------------------------|-----------------------------------------------------------|----------|-----------------------------------------------------------------------------------------|
| `src/components/SidebarHeader.tsx`           | Sticky header with toggle, candidate btn, progress, badge | VERIFIED | 115 lines; `sticky top-0 z-10`; `computeOverallMark`/`computeTopicMark` wired at lines 32-61 |
| `src/components/SidebarFooter.tsx`           | Credit lockup + About button + AboutModal ref             | VERIFIED | 63 lines; `Developed by`, `https://kivgila.pro`, `showModal()`, `<AboutModal>` at line 60 |
| `src/components/AboutModal.tsx`              | Native dialog, focus trap, Esc close, backdrop close      | VERIFIED | 100 lines; `<dialog>` (not `<div>`), focus trap `handleKeyDown` (lines 17-33), `close` event handler for focus return (lines 35-37), backdrop click closes (lines 47-49) |
| `src/components/Sidebar.tsx`                 | Inner scrollable div + SidebarHeader + SidebarFooter outside scroll | VERIFIED | 78 lines; `SidebarHeader` at line 29 (before scroll div), `<div className="flex-1 overflow-y-auto">` at line 32, `SidebarFooter` at line 73 (after scroll div); no `md:relative` or `md:translate-x-0` (Phase 12 UI-12 preserved) |
| `src/components/QuestionCard.tsx`            | Compact row: score select, note icon, hover-reveal delete | VERIFIED | 144 lines; `<select>` left (line 61), `📝` button right (line 91), delete `opacity-0 group-hover:opacity-100` (line 114), `group` class on row (line 59) |
| `src/components/SidebarHeader.test.tsx`      | 9 tests                                                   | VERIFIED | 116 lines; 9 `it(...)` cases covering render, aria-labels, aria-expanded, click handlers, progress text, mark badge, progress bar element |
| `src/components/AboutModal.test.tsx`         | 8 tests                                                   | VERIFIED | 81 lines; 8 `it(...)` cases covering render, aria-labelledby, heading, version, credits, link href, rel, close button |
| `src/components/SidebarFooter.test.tsx`      | Updated — About button and credit lockup covered          | VERIFIED | 94 lines; substantive file with About button and credit lockup test coverage |
| `src/components/Sidebar.test.tsx`            | Updated — SidebarHeader + SidebarFooter integration       | VERIFIED | 144 lines; substantive file with SidebarHeader/SidebarFooter integration coverage |
| `src/components/QuestionCard.test.tsx`       | Updated — compact row, score dropdown, note toggle        | VERIFIED | 282 lines; substantive file with compact row, dropdown, and note toggle coverage |

---

### Key Link Verification

| From                    | To                              | Via                                          | Status   | Details                                                                            |
|-------------------------|---------------------------------|----------------------------------------------|----------|------------------------------------------------------------------------------------|
| `Sidebar.tsx`           | `SidebarHeader.tsx`             | import + JSX render before scroll div        | VERIFIED | Line 10 import; line 29 `<SidebarHeader onCandidateClick={...} />`               |
| `Sidebar.tsx`           | `SidebarFooter.tsx`             | import + JSX render after scroll div         | VERIFIED | Line 8 import; line 73 `<SidebarFooter />`                                        |
| `SidebarFooter.tsx`     | `AboutModal.tsx`                | import + `useRef` + `showModal()` + JSX      | VERIFIED | Line 2 import; line 19 `useRef`; line 42 `showModal()`; line 60 `<AboutModal>`    |
| `SidebarHeader.tsx`     | `computeTopicMark` / `computeOverallMark` | import from `../scoring/index.js`  | VERIFIED | Lines 2-5 import; lines 52-61 both functions called with real store data           |
| `SidebarHeader.tsx`     | `useAppStore` (V4Session data)  | `sections`, `scores`, `overrides`, `customQuestions` selectors | VERIFIED | Lines 24-29; `topic.questions.map(q => ({ q: q.text, level: q.level }))` at line 39 maps V4Topic to `{q,level}` shape expected by `computeTopicMark` |
| `QuestionCard.tsx`      | `removeDefaultQuestion`         | `useAppStore` selector + `row.questionBankId` | VERIFIED | Line 21 selector; lines 110-111 `removeDefaultQuestion(row.questionBankId)` called for default questions (Phase 14 BANK-05 preserved) |
| `QuestionCard.tsx`      | `deleteCustomQuestion`          | `useAppStore` selector + `row.customId`      | VERIFIED | Line 20 selector; lines 108-109 `deleteCustomQuestion(row.customId)` for custom rows |
| `Sidebar.tsx` (Phase 12 regression) | No `md:relative` / `md:translate-x-0` | absence check           | VERIFIED | Grep returned no matches — Phase 12 UI-12 fix preserved                            |

---

### Data-Flow Trace (Level 4)

| Artifact            | Data Variable                        | Source                                        | Produces Real Data | Status   |
|---------------------|--------------------------------------|-----------------------------------------------|--------------------|----------|
| `SidebarHeader.tsx` | `mark`, `band`, `scoredTopics`, `totalTopics` | `computeOverallMark(allTopicResults)` where `allTopicResults` maps `sections` from `useAppStore` through `computeTopicMark` | Yes — reads live store sections/scores/overrides/customQuestions | FLOWING  |
| `QuestionCard.tsx`  | `score`, `storedNote`                | `useAppStore(s => s.scores[questionId])`, `useAppStore(s => s.notes[questionId])` | Yes — reads persisted store keyed by `topicId-qIndex` | FLOWING  |
| `AboutModal.tsx`    | `version`                            | `chrome.runtime.getManifest().version`        | Yes — reads real extension manifest at runtime | FLOWING  |
| `SidebarFooter.tsx` | `version`                            | `chrome.runtime.getManifest().version`        | Yes — reads real extension manifest at runtime | FLOWING  |

---

### Behavioral Spot-Checks

| Behavior                          | Command                                                                                                                              | Result                                       | Status |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|--------|
| Phase 15 component tests pass     | `npx vitest run SidebarHeader.test.tsx AboutModal.test.tsx SidebarFooter.test.tsx Sidebar.test.tsx QuestionCard.test.tsx`            | 5 test files, 59 tests, 0 failures (527 ms)  | PASS   |
| SidebarHeader has sticky class    | `grep -n "sticky top-0" src/components/SidebarHeader.tsx`                                                                            | Line 69: `className="sticky top-0 z-10 ..."` | PASS   |
| Sidebar inner div is overflow-y-auto | `grep -n "flex-1 overflow-y-auto" src/components/Sidebar.tsx`                                                                     | Line 32: `<div className="flex-1 overflow-y-auto flex flex-col">` | PASS   |
| Phase 12 regression: no md:relative / md:translate-x-0 | `grep -n "md:relative\|md:translate-x-0" src/components/Sidebar.tsx`                                        | No output (0 matches)                        | PASS   |
| Phase 14 removeDefaultQuestion wired | `grep -n "removeDefaultQuestion\|questionBankId" src/components/QuestionCard.tsx`                                                 | Lines 21, 110, 111 — imported and called with `row.questionBankId` | PASS   |
| V4Topic mapping in SidebarHeader  | `grep -n "topic.questions.map\|topicQuestions" src/components/SidebarHeader.tsx`                                                     | Lines 39-49 — maps `q.text`/`q.level` before `computeTopicMark` | PASS   |
| AboutModal uses native dialog (no open prop) | `grep -n "<dialog\|open" src/components/AboutModal.tsx`                                                                 | Line 53: `<dialog ref={dialogRef} aria-labelledby=...>` — no `open` prop | PASS   |
| Delete hover-reveal classes       | `grep -n "opacity-0 group-hover:opacity-100" src/components/QuestionCard.tsx`                                                        | Line 114 — `opacity-0 group-hover:opacity-100 focus-visible:opacity-100` | PASS   |

---

### Requirements Coverage

| Requirement | Description                                                                                                       | Status    | Evidence                                                    |
|-------------|-------------------------------------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------|
| SCORE-08    | Question card: score dropdown left, note icon right, collapses to single line by default                          | SATISFIED | `QuestionCard.tsx:59-119` — all three behaviors implemented and tested (59/59 tests pass) |
| UI-13       | Sticky top header: toggle, candidate button, "Final mark · N/M topics", thin progress bar, numeric mark badge     | SATISFIED | `SidebarHeader.tsx:68-113`; `Sidebar.tsx:29,32` — header outside scroll div |
| UI-14       | SidebarFooter credit lockup: "Developed by Ievgen Kyvgyla, https://kivgila.pro" + About button                   | SATISFIED | `SidebarFooter.tsx:29-46`; credit text and link confirmed at lines 30-36 |
| UI-15       | About button opens AboutModal (native `<dialog>`) with app name, version, links, credits                         | SATISFIED | `AboutModal.tsx:52-98`; `SidebarFooter.tsx:42,60`; 8 AboutModal tests pass |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `QuestionCard.tsx` | 137 | `placeholder="Question notes…"` | None | Legitimate HTML textarea `placeholder` attribute — not a debt marker or stub pattern |

No TBD, FIXME, XXX, or unresolved TODO markers found in any Phase 15 source or test file.

---

### Human Verification Required

#### 1. Score Dropdown Visual Position and Options

**Test:** Open the extension in Chrome; navigate to a question row in the sidebar and inspect the compact QuestionCard layout.
**Expected:** A `<select>` control appears at the left of each question row. The dropdown lists "Skip" as the first option, followed by 0 through 10.
**Why human:** CSS flex layout (visual order) and native `<select>` option list rendering cannot be confirmed by jsdom or grep.

#### 2. Note Icon Toggles Textarea; hideNotes Suppresses It

**Test:** Click the pencil (📝) button on a question card. Then toggle "Hide notes" from the store (if a UI control exists) or verify the `hideNotes` path.
**Expected:** Clicking the note button reveals a textarea below the card. Clicking again hides it. When `hideNotes` is active globally, the textarea wrapper is hidden regardless of whether `notesOpen` is true.
**Why human:** Toggle interaction state and the `hideNotes && !printMode` conditional hiding require live browser state; jsdom tests cover the logic but not the visual outcome.

#### 3. Delete Button Hover-Reveal

**Test:** Hover the mouse over a default or custom question card row in the sidebar.
**Expected:** The × delete button is invisible before hover (`opacity-0`) and becomes visible when the row is hovered (`group-hover:opacity-100`). It also becomes visible on keyboard focus (`focus-visible:opacity-100`). Standard (non-custom, non-default) questions do not show the button at all.
**Why human:** CSS `group-hover` behaviour requires a real rendering engine with pointer events; jsdom does not process CSS.

#### 4. Sticky SidebarHeader During Sidebar Scroll

**Test:** Open the extension with enough questions to make the sidebar scroll. Scroll down within the sidebar.
**Expected:** The SidebarHeader (toggle, candidate button, "Final mark · N/M topics", progress bar) remains fixed at the top of the sidebar while the question list scrolls beneath it.
**Why human:** `sticky top-0` layout requires a real scroll context in a browser viewport.

#### 5. SidebarFooter Credit Lockup + AboutModal Open/Close

**Test:** Look at the bottom of the sidebar for the footer. Click "About".
**Expected:** The footer shows "Developed by Ievgen Kyvgyla" with `https://kivgila.pro` as a working link. Clicking "About" opens the AboutModal as a native `<dialog>` (modal overlay). Pressing Esc closes it; clicking the backdrop closes it; clicking "Close" inside closes it. After close, focus returns to the "About" button (`data-about-trigger`).
**Why human:** Native `<dialog>` `showModal()` modal behaviour, backdrop click detection, Esc key handling, and focus restoration require a real browser environment.

---

### Cross-Phase Integration Summary

| Integration Point | Verification | Status |
|-------------------|-------------|--------|
| Phase 12 UI-12: no `md:relative` / `md:translate-x-0` in Sidebar.tsx | Grep returned 0 matches | PRESERVED |
| Phase 14 BANK-05: `removeDefaultQuestion(row.questionBankId)` called in QuestionCard | Found at lines 21, 110-111 | PRESERVED |
| Phase 11 V4Session types: `topic.questions.map(q => ({ q: q.text, level: q.level }))` before `computeTopicMark` | Found at SidebarHeader.tsx:39-49 with explicit comment | PRESERVED |

---

### Gaps Summary

No automated gaps. All 8 observable truths are verified by code inspection and test execution (59/59 tests pass). The 5 human verification items above are behavioural/visual confirmations that require browser rendering and cannot be resolved by static analysis.

---

_Verified: 2026-06-18T17:40:00Z_
_Verifier: Claude (gsd-verifier)_
