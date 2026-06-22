# Interviewer Checklist — Chrome Extension

## Current Milestone: v1.3 UX Refinement & Layout

**Goal:** Complete all remaining BACKLOG items — fix lingering section-add and difficulty-border regressions, establish a centered 1200px layout, sort questions by difficulty, enlarge the AI dialog, add icon to the extension, and polish all modal buttons and the action panel.

**Target features:**
- Layout: max-width 1200px centered content container
- Bug: section add — form submit does not persist new section (re-verify/fix)
- Bug: QuestionCard left border color does not match difficulty label (re-verify/fix)
- Sort: questions ordered by difficulty within each section (Novice → Expert)
- Extension icon (from BACKLOG/icon.png)
- AI feedback dialog enlarged to show more content
- Icons added to all modal buttons
- Action buttons panel: two-column grid, text labels visible, icons smaller
- Smooth animations on accordion, sidebar, and all remaining interactive elements

---

## Previous Milestones

### v1.2 UAT Closure & Visual Polish (shipped 2026-06-22)

**Goal:** Closed UAT gaps from v1.1 — two virtualizer scroll bugs, note-collapse bug, dark mode contrast — then layered in visual enhancements: difficulty indicators, Lucide icon library, 13px font + compact density, CSS transitions throughout. Full archive: [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md)

### v1.1 Post-UAT Fix + Polish (shipped 2026-06-18)

**Goal:** Closed 14 gaps from v1.0 CWS smoke-test UAT — 8 defects + 6 UX enhancements across Phases 11–15. V3→V4 session schema migration, fully user-editable bank, compact QuestionCard, sticky sidebar header, AboutModal, filter overhaul. Full archive: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

### v1.0 Chrome Extension Launch (shipped 2026-06-18)

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
- ✓ V3→V4 session schema migration materializes default sections/topics into fully user-editable bank; V3 sessions hydrate without data loss — v1.1
- ✓ Importing a v1.0-era structural YAML export produces an equivalent V4 session with no loss of scores, notes, candidate details, or custom questions — v1.1
- ✓ Manual topic-override dropdown no longer collapses the parent section when opened or changed — v1.1
- ✓ Session switcher modal closes via Esc, backdrop click, and a visible Close button — v1.1
- ✓ Hide notes toggle suppresses all rendered note areas and restores them when toggled off — v1.1
- ✓ Sidebar Actions buttons icon-only with hover/focus tooltips; sidebar section titles each show a leading icon — v1.1
- ✓ Sidebar collapse/expand works on all viewports including ≥768px desktop — v1.1
- ✓ DifficultyFilter: "All levels" row + color dot per difficulty + live per-difficulty question counts — v1.1
- ✓ SectionFilter: "All sections" row + section emoji icons + live per-section counts; wired to live store.sections — v1.1
- ✓ User can add/remove sections and topics; delete default questions using the same affordance as custom questions — v1.1
- ✓ YAML schema v2: text/level on default questions, custom-question notes preserved, bank delta block for round-trip import/export — v1.1
- ✓ Sticky sidebar header (toggle + candidate button + final-mark progress line with mark badge) — v1.1
- ✓ Sidebar footer credit lockup; About button opens native `<dialog>` AboutModal — v1.1
- ✓ Compact QuestionCard: score dropdown left, note icon right, single-line default — v1.1

### Active

<!-- v1.3 scope — UX refinement, layout, and remaining BACKLOG items -->

- [ ] Content container has max-width 1200px and is horizontally centered
- [ ] Section add form persists and new section appears in tree immediately
- [ ] QuestionCard left border color matches difficulty label color
- [ ] Questions are sorted by difficulty within each section (Novice → Expert)
- [ ] Extension has a proper icon (from BACKLOG/icon.png)
- [ ] AI feedback prompt dialog is larger, showing more content without scrolling
- [ ] All modal buttons have Lucide icons
- [ ] Action buttons panel uses a two-column grid with text labels and smaller icons
- [ ] Accordion, sidebar, and all remaining interactive elements animate smoothly

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

- **Shipped state (v1.2):** ~22,000+ LOC TypeScript. 4 phases (16–19), 9 plans executed in v1.2. Stack unchanged: React 19 + Vite 8 + CRXJS 2.6 + TypeScript 6 + Biome 2.5 + Vitest 4 + Tailwind 4 + Zustand 5 + js-yaml 4.2 + valibot + @tanstack/react-virtual + Lucide React (added v1.2). Difficulty indicators, Lucide icon library, 13px font, CSS transitions shipped in v1.2. Section add and difficulty border shipped in v1.2 but reported as still broken by user — v1.3 must re-verify and fix.
- **Known deferred:** Browser-level UAT for Phases 12–15 `human_needed` verifications acknowledged as deferred at v1.1 close — 675/675 unit/integration tests pass. v1.0 deferred items (Phases 5, 6, 7, 8, 9 human_needed; 3 UAT scenarios) remain open. Documented in STATE.md.
- **CWS manual actions outstanding (v1.0):** publish PRIVACY.md to stable HTTPS URL, capture 1280×800 screenshots, run smoke test per `cws-assets/CWS-SMOKE-TEST.md`, upload `dist.zip` to CWS dashboard with copy from `docs/cws-submission.md`.
- **Two-audience UX:** interviewers and candidates share the same UI. Multiple named sessions support an interviewer running one per candidate while a candidate has their own prep slot. Fully user-editable bank (v1.1) lets users customize sections, topics, and questions per session and export/import the full bank state via YAML.

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
| Rebuild in React + Vite + TS rather than wrap the existing HTML | The HTML is 3k lines of inlined JS; multiple named sessions + dark mode + ongoing maintenance need real component architecture and a build pipeline | Done — shipped v1.0 |
| Surface = toolbar action opens full-page tab (not popup / side panel / new tab override) | Full screen real estate for the dense checklist UX; no need to interact with arbitrary pages; less intrusive than new-tab override | Done — locked in v1.0 |
| Persistence = `chrome.storage.local` (not `chrome.storage.sync`, not cloud) | Question bank exceeds the 100KB sync quota; no backend means no infra, no auth, no privacy-policy complications beyond local data | Done — locked in v1.0 |
| Multiple named sessions as in-storage slots with in-app switcher (YAML export/import is per-active-session) | Interviewers run one session per candidate; candidates have their own prep slot; YAML stays a portability/backup mechanism | Done — shipped v1.0 |
| Both interviewers and candidates share the same UI (no role-switch screen) | Same data model and controls serve both flows; reduces UX surface | Done — confirmed v1.0 |
| Ship v1 to the public Chrome Web Store | Distribution path of record; review compliance is part of "done" | Artifacts ready; manual CWS submission pending |
| Strict feature parity with `stack-checklist.html` is the parity baseline for v1, plus dark mode and named sessions as the only added scope | Keeps v1 small enough to ship; the existing HTML is already a thorough product spec | Done — shipped v1.0 |
| V3→V4 forward-only schema migration required for v1.1 editable-bank feature | YAML schema bump (text/level on default questions) and user-editable sections/topics required materializing the bank into session state | Done — shipped v1.1 |
| valibot added for V4SessionSchema validation | Validates session shape at bootstrap and on YAML import; chosen over zod for tree-shaking characteristics | Done — v1.1 |

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
*Last updated: 2026-06-22 after milestone v1.3 started*
