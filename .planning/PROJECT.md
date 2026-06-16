# Interviewer Checklist — Chrome Extension

## What This Is

A Chrome Manifest V3 extension that opens a full-page "Tech Stack — Interview Checklist" tab when the user clicks the toolbar icon. It is a React + TypeScript rebuild of the existing single-file prototype `stack-checklist.html` (3,053 lines), distributed via the Chrome Web Store and used by two audiences with the same UI: interviewers scoring SWE candidates against a weighted tech-stack rubric, and candidates self-assessing while prepping for interviews.

## Core Value

A single interviewer/candidate can run an end-to-end weighted scoring session — pick topics, score questions on 0–10 with difficulty weighting, capture notes, see live overall + per-group marks, and export a structured YAML / AI-feedback prompt — entirely inside a browser tab with no backend.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

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
*Last updated: 2026-06-16 after initialization*
