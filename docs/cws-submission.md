# Chrome Web Store Submission Copy — Interviewer Checklist

**Extension version:** 1.0.0
**Last updated:** 2026-06-18

## How to use this document

Each section below corresponds to a specific field in the Chrome Web Store Developer Dashboard — either the **Store listing** tab or the **Privacy practices** tab. Copy each block as-is into the matching field at submission time. Where a placeholder appears (e.g. `<owner>/<repo>` or the privacy-policy URL), substitute the live value before pasting.

## Short description (single line, max 132 characters)

Fully-local weighted scoring for tech interviews — score on 0-10, take notes, YAML import/export, AI feedback prompt.

_117 / 132 characters_

## Detailed description (max 16384 characters)

Interviewer Checklist is a fully-local, weighted-scoring tool for technical interviews. It opens as a full-page tab when you click the toolbar icon and runs entirely inside your own Chrome profile — there is no backend, no account, and no network traffic. It is built for two audiences who share the same UI: interviewers scoring software-engineering candidates against a weighted tech-stack rubric, and candidates self-assessing while prepping for interviews.

### Features

- Built-in question bank: 9 groups, ~86 topics, 1000+ questions across 4 difficulty levels (with coefficients 1.00 / 1.25 / 1.50 / 1.75)
- Difficulty-weighted scoring engine with per-question 0–10 sliders, computed per-topic and per-group marks, manual topic overrides, and live recompute with colored mark bands
- Per-question and per-topic notes, all persisted with state
- Candidate details: name, email, role, interview date, interviewer, free-text details — saved per session
- Custom questions per topic with difficulty selection, "custom" badge, and full participation in scoring, filtering, and export
- Multiple named sessions with an in-app session switcher (run one session per candidate; keep a separate prep slot)
- YAML export (full structural format) and YAML import supporting both structural and legacy progress-only files, with stable-ID matching
- AI candidate-feedback prompt builder: generates an editable, tool-agnostic prompt that embeds candidate details, marks, per-topic detail, and weighting explanation; copy-to-clipboard with manual-select fallback
- Print stylesheet that expands all topics and questions and hides controls for a clean printable summary
- Keyboard shortcuts: `/` focus search, `\` toggle sidebar, `Esc` clear search / close modal
- First-run welcome page with a one-click demo session and a pin-to-toolbar reminder
- Update banner that surfaces version changes in-app (no remote update mechanism)
- Dark mode toggle that respects your OS preference with manual override
- Responsive sidebar with debounced search across question text, names, descriptions, and tags; multi-select difficulty and section filters with live counts and per-group marks
- Accessibility: real semantic controls, ARIA roles and states, visible focus rings, full keyboard navigation
- Reduced-motion support (`prefers-reduced-motion`)

### Privacy

This extension stores all data locally in `chrome.storage.local`. No data is transmitted to any external service. No analytics, tracking, or telemetry are used. All data is removed when the extension is uninstalled. See the published privacy policy for the full statement.

### Permissions

The extension requests a single Chrome permission, `storage`, used solely to persist your sessions, notes, custom questions, and preferences locally. It declares no `host_permissions`, requests no `scripting`, and makes no network requests at runtime.

### Open source

Source code: <https://github.com/<owner>/<repo>>

## Single-purpose description (CWS data-handling field)

The single purpose of this extension is to run difficulty-weighted technical interview scoring sessions entirely inside the user's browser, with YAML export and an AI-feedback prompt builder, all without any backend. The extension does only this — it has no other purpose and exposes no other functionality.

## Permissions justification — `storage`

The `storage` permission is required to save interview scoring sessions, candidate details, custom questions, and user preferences (dark mode, sidebar state). All data remains local to the user's browser via `chrome.storage.local`.

No other Chrome permissions are requested by this extension.

## Host permissions justification

Not requested. This extension declares no `host_permissions` and makes no network requests.

## Remote code justification

No remote code is used. The extension bundles all code at build time; the production `dist/` contains no `eval`, no inline scripts, and no references to remote scripts. The build is verified by `scripts/check-dist.js`.

## Data usage declarations

| Category | Answer | Notes |
| -------- | ------ | ----- |
| Personally identifiable information (name, email) | **YES — stored locally only** | Candidate name and email are stored locally by the user in the Candidate Details modal. NOT collected by the extension, NOT transmitted, NOT shared, NOT sold, NOT used for advertising, NOT used for tracking, NOT used outside the extension's stated purpose. |
| Health information | NO | — |
| Financial and payment information | NO | — |
| Authentication information | NO | — |
| Personal communications | NO | — |
| Location | NO | — |
| Web history | NO | — |
| User activity | NO | — |
| Website content | NO | — |

**Certifications (all required):**

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL

`https://<user-publishes-this-in-plan-10-03>`

Plan 10-03 task 1 records the live URL here before dashboard upload.

## Category and language

- **Category:** Developer Tools _(alternative: Productivity — confirm with user during Plan 10-03 dashboard step)_
- **Language:** English

## Submission checklist

Each item below names a CWS Developer Dashboard field and points to the section above that supplies the copy.

- [ ] **Store listing → Short description** — copy from "Short description"
- [ ] **Store listing → Detailed description** — copy from "Detailed description"
- [ ] **Store listing → Category** — see "Category and language"
- [ ] **Store listing → Language** — English
- [ ] **Store listing → Screenshots (3 required)** — upload PNGs produced via `cws-assets/CWS-SCREENSHOTS.md`
- [ ] **Privacy practices → Single purpose** — copy from "Single-purpose description"
- [ ] **Privacy practices → Permission justifications → storage** — copy from "Permissions justification — `storage`"
- [ ] **Privacy practices → Host permissions justification** — copy from "Host permissions justification"
- [ ] **Privacy practices → Remote code** — copy from "Remote code justification"
- [ ] **Privacy practices → Data usage** — set per "Data usage declarations" table
- [ ] **Privacy practices → Data usage certifications** — check all three per "Certifications"
- [ ] **Privacy practices → Privacy policy URL** — paste the live URL recorded in Plan 10-03
