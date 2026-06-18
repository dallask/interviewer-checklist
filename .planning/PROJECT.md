# Interviewer Checklist — Chrome Extension

## Current State

**Shipped:** v1.0 Chrome Extension Launch — 2026-06-18
**Active:** v1.1 Post-UAT Fix + Polish — closing the 14 gaps surfaced by the v1.0 CWS smoke-test UAT.

---

## Current Milestone: v1.1 Post-UAT Fix + Polish

**Goal:** Close the 14 gaps from v1.0 CWS smoke-test UAT — ship defect fixes and UX enhancements that turn v1.0 from "works" into "feels right" for real interviewer use.

**Target features:**

*Defects (8) — from `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` Gaps section*
- Manual topic override dropdown collapses parent section (test 5)
- Session switcher modal cannot be closed via Esc / backdrop / close button (test 6)
- "Hide notes" toggle is a no-op (test 6)
- YAML default-question schema needs `text` + `level`; user can delete default questions like custom ones (test 7)
- Custom-question notes dropped on YAML export (test 7)
- Sidebar Actions buttons should be icons with hover tooltips (test 7)
- Sidebar section titles need leading icons (Search/Difficulty/Sections/Actions) (test 7)
- Desktop sidebar locked open at ≥768px; toggle is no-op above breakpoint (test 9)

*Enhancements (6) — from same file, "Additional Enhancement Requests" section*
- Compact QuestionCard: score dropdown on left, note icon on right, collapsed single-line default (locked to screenshot spec)
- DifficultyFilter: "All levels" + color dot per difficulty + per-difficulty count
- SectionFilter: "All sections" + per-section icon + per-section count
- User-editable sections AND topics (add/remove, like custom questions today) — schema + store + UI
- Sidebar footer with credit lockup + About button → AboutModal
- Sticky sidebar header: toggle + candidate-detail button + final-mark progress line with mark badge

**Key milestone constraints:**
- v1.0 is live on the Chrome Web Store; v1.1 ships as a CWS update. Legacy v1.0 YAML exports must still import cleanly.
- The YAML schema bump (D4) and user-editable sections/topics (E4) likely require a V3 → V4 session migration with a forward-only path.
- Source of truth for every item is the gap list in `.planning/milestones/v1.0-phases/10-chrome-web-store-submission/10-UAT.md` (including the attached screenshots referenced as Image #1–#8).

---

## Previous Milestone: v1.0 Chrome Extension Launch

**Goal:** Build and ship the complete Interviewer Checklist Chrome MV3 extension — full feature parity with the stack-checklist.html prototype — to the public Chrome Web Store.

**Target features:**
- Foundation & CI scaffold (CRXJS + Vite + React + TS + Biome)
- Question bank (9 groups / ~86 topics / 1000+ questions) + scoring engine
- Storage layer with schema migration, auto-snapshot, debounced flush
- Shell, sidebar, dark mode, accessibility, search/filter UI
- Scoring UI, notes, candidate details modal, custom questions
- Multiple named sessions with switcher
- YAML export/import (structural + legacy formats)
- AI candidate-feedback prompt builder
- Polish: print, keyboard shortcuts, welcome/onboarding, update banner
- Chrome Web Store submission (privacy policy, screenshots, listing)

## What This Is

A Chrome Manifest V3 extension that opens a full-page "Tech Stack — Interview Checklist" tab when the user clicks the toolbar icon. It is a React + TypeScript rebuild of the existing single-file prototype `stack-checklist.html` (3,053 lines), distributed via the Chrome Web Store and used by two audiences with the same UI: interviewers scoring SWE candidates against a weighted tech-stack rubric, and candidates self-assessing while prepping for interviews.

## Core Value

A single interviewer/candidate can run an end-to-end weighted scoring session — pick topics, score questions on 0–10 with difficulty weighting, capture notes, see live overall + per-group marks, and export a structured YAML / AI-feedback prompt — entirely inside a browser tab with no backend.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Chrome MV3 extension with toolbar action that opens the checklist in a new full-page tab — v1.0
- ✓ React + Vite + TypeScript build that bundles into the extension — v1.0
- ✓ Full feature parity with `stack-checklist.html` (built-in bank, 4 difficulty levels) — v1.0
- ✓ 0–10 per-question scoring with difficulty-weighted topic marks, manual topic overrides, plain-mean overall and group marks, live recompute, colored mark bands — v1.0
- ✓ Per-question and per-topic notes, persisted with state — v1.0
- ✓ Candidate details modal with Save/Cancel/Reset — v1.0
- ✓ Custom questions per topic with difficulty selection, "custom" badge, deletion, full participation in scoring/sorting/filtering/export — v1.0
- ✓ Sidebar with collapsible groups; debounced search; multi-select difficulty/section filters with live counts — v1.0
- ✓ AI candidate-feedback prompt modal — generates tool-agnostic editable prompt with copy-to-clipboard + manual-select fallback — v1.0
- ✓ YAML export (full structural) and YAML import supporting both structural and legacy progress-only formats — v1.0
- ✓ Multiple named sessions stored in `chrome.storage.local` with in-app session switcher — v1.0
- ✓ Dark mode toggle (respects OS preference with manual override) — v1.0
- ✓ All state persisted to `chrome.storage.local` with schema-migration on load — v1.0
- ✓ Reset all (with confirmation) — v1.0
- ✓ Keyboard shortcuts: `/`, `\`, `Esc`, `_execute_action` toolbar — v1.0
- ✓ Foldable sidebar, collapsible sub-groups with remembered state — v1.0
- ✓ Accessibility: focus traps in all 6 modals, ARIA labels, focus-visible rings — v1.0
- ✓ Print stylesheet (expands all topics via JS hook due to virtualizer; hides controls) — v1.0
- ◆ Published listing on the Chrome Web Store — v1.0 artifacts ready (PRIVACY.md, docs/cws-submission.md, dist.zip 120K); manual submission pending

### Active

<!-- Current scope. Building toward these. -->

- [ ] Chrome MV3 extension with toolbar action that opens the checklist in a new full-page tab
- [ ] React + Vite + TypeScript build that bundles into the extension
- [ ] Full feature parity with `stack-checklist.html` (three-level group/topic/question hierarchy, 9 groups / ~86 topics / ~1000+ questions built-in bank, 4 difficulty levels with coefficients 1.00 / 1.25 / 1.50 / 1.75)
- [ ] 0–10 per-question scoring with difficulty-weighted topic marks, manual topic overrides, plain-mean overall and group marks, live recompute, colored mark bands
- [ ] Per-question and per-topic notes, persisted with state
- [ ] Candidate details modal (name, email, role, date, interviewer, free-text details) with Save/Cancel/Reset
- [ ] Custom questions per topic with difficulty selection, "custom" badge, deletion, full participation in scoring/sorting/filtering/export
- [ ] Sidebar with collapsible Search / Difficulty / Sections / Actions groups; debounced search across names/desc/tags/question text; multi-select difficulty filter with live counts; multi-select section filter showing per-group marks; view toolbar (Expand all, Collapse all, Hide already-marked topics)
- [ ] AI candidate-feedback prompt modal — generates tool-agnostic editable prompt embedding candidate details, marks, per-topic detail, weighting explanation, and structured task spec; copy-to-clipboard with manual-select fallback
- [ ] YAML export (full structural — meta, candidate, sections with id/title/icon/topics/questions/scores/overrides/notes/custom flag) and YAML import supporting both structural and legacy progress-only formats; ID derivation and de-duplication
- [ ] Multiple named sessions stored as slots in `chrome.storage.local` with an in-app session switcher; YAML export/import operates on the active session
- [ ] Dark mode toggle (respects OS preference with manual override)
- [ ] All state persisted to `chrome.storage.local` with schema-migration on load
- [ ] Reset all (with confirmation) clears scores, overrides, notes, custom questions, candidate details, filters, imported structure
- [ ] Keyboard shortcuts: `/` focus search, `\` toggle sidebar, `Esc` clear search / close modal
- [ ] Foldable sidebar, collapsible sub-groups with remembered state, responsive overlay on narrow screens
- [ ] Accessibility: real `<button>` / `<select>`, ARIA roles/labels, aria-expanded/pressed/checked, visible focus rings, labelled inputs
- [ ] Print stylesheet (expands all topics/questions, hides controls)
- [ ] Published listing on the Chrome Web Store (public)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Cloud backend / auth / cross-device sync — explicit choice of `chrome.storage.local`; YAML export covers portability
- `chrome.storage.sync` (cross-Chrome-instance sync) — deferred; would also constrain to 100KB which the question bank exceeds
- Real-time multi-user collaboration on a session — single-user tool by design
- Mobile / non-Chromium browser support — Chrome MV3 extension is the entire product surface
- Non-checklist subjects in the built-in bank — bank ships as the interview tech-stack content; users can pin to other subjects via YAML structural import
- Wrapping the existing HTML as-is — explicitly rejected in favor of a React rewrite using the HTML as behavioral spec
- Side Panel, New Tab override, popup-window surfaces — only action-click → full tab in v1

## Context

- **Shipped state:** 17,862 LOC TypeScript across 38 test files with 515/515 passing tests. 30 plans executed across 11 phases (including audit closure Phase 7.1). Stack: React 19 + Vite 8 + CRXJS 2.6 + TypeScript 6 + Biome 2.5 + Vitest 4 + Tailwind 4 + Zustand + js-yaml 4.2 + @tanstack/react-virtual. Zero new dependencies after Phase 7 (js-yaml installation).
- **Known deferred:** 5 phases (5, 6, 7, 8, 9) have `human_needed` verifications deferred during execution — manual browser-level UAT not performed. 3 UAT scenarios pending (phases 3, 5, 6). All are documented in STATE.md Deferred Items.
- **Final manual actions for CWS launch:** publish PRIVACY.md to stable HTTPS URL (GitHub Pages), capture 3 screenshots at 1280×800 per `cws-assets/CWS-SCREENSHOTS.md`, run smoke test per `cws-assets/CWS-SMOKE-TEST.md`, upload `dist.zip` to CWS dashboard with copy from `docs/cws-submission.md`.
- **Source artifact:** `stack-checklist.html` at the repo root is the behavioral source of truth for parity features. The 3,053-line file ships the built-in bank, the scoring engine, the AI prompt builder, the YAML import/export, and the sidebar UX. Requirements phase will derive REQ-IDs by reading it.
- **Current persistence:** the prototype uses `localStorage` under a single key. The extension will migrate that semantically to `chrome.storage.local` plus session slots, and continue to honor legacy progress-only YAML imports.
- **Distribution intent:** Chrome Web Store, public listing. Implies CWS review checklist (manifest, permissions justification, privacy policy, screenshots) as a v1 release blocker.
- **Permissions posture:** likely only `storage` is needed; aim to ship with the smallest possible permission set to ease store review.
- **Two-audience UX:** interviewers and candidates use the same UI. Multiple named sessions support an interviewer running one per candidate while a candidate has their own prep slot.

## Constraints

- **Tech stack:** React + Vite + TypeScript — chosen for ecosystem and existing Chrome-MV3 boilerplates; lock the choice for v1.
- **Manifest:** Chrome Manifest V3 — Google no longer accepts MV2 submissions to the store.
- **Storage:** `chrome.storage.local` only — no `chrome.storage.sync` (100KB cap incompatible with the question bank), no backend.
- **Distribution:** Chrome Web Store public listing — implies review-process compliance (privacy policy, minimal permissions, content guidelines).
- **Behavior parity:** v1 must preserve everything in `stack-checklist.html`'s feature spec including legacy YAML import compatibility — users with old exports must be able to load them.
- **Surface:** toolbar action → full-page tab only. No popup, side panel, or new-tab override in v1.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild in React + Vite + TS rather than wrap the existing HTML | The HTML is 3k lines of inlined JS; multiple named sessions + dark mode + ongoing maintenance need real component architecture and a build pipeline | — Pending |
| Surface = toolbar action opens full-page tab (not popup / side panel / new tab override) | Full screen real estate for the dense checklist UX; no need to interact with arbitrary pages; less intrusive than new-tab override | — Pending |
| Persistence = `chrome.storage.local` (not `chrome.storage.sync`, not cloud) | Question bank exceeds the 100KB sync quota; no backend means no infra, no auth, no privacy-policy complications beyond local data | — Pending |
| Multiple named sessions as in-storage slots with in-app switcher (YAML export/import is per-active-session) | Interviewers run one session per candidate; candidates have their own prep slot; YAML stays a portability/backup mechanism | — Pending |
| Both interviewers and candidates share the same UI (no role-switch screen) | Same data model and controls serve both flows; reduces UX surface | — Pending |
| Ship v1 to the public Chrome Web Store | Distribution path of record; review compliance is part of "done" | — Pending |
| Strict feature parity with `stack-checklist.html` is the parity baseline for v1, plus dark mode and named sessions as the only added scope | Keeps v1 small enough to ship; the existing HTML is already a thorough product spec | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-18 after milestone v1.1 started*
