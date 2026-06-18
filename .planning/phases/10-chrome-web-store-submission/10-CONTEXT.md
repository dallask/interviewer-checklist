# Phase 10: Chrome Web Store Submission - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase produces the artifacts and submission package required for Chrome Web Store publication. The orchestrator generates documents, copy, and the build artifact; the user performs the manual submission steps (uploading to CWS dashboard, hosting the privacy policy, capturing screenshots in real Chrome, running a fresh-profile smoke test, and final CWS dashboard submission).

Covers requirements CWS-01 through CWS-05.

</domain>

<decisions>
## Implementation Decisions

### Privacy Policy & Permissions Justification (CWS-01, CWS-02)
- Privacy policy text written to `PRIVACY.md` at the repo root (user publishes to GitHub Pages or any stable HTTPS URL out of orchestrator scope)
- CWS dashboard copy (description, permissions justification, single-purpose description, data-usage answers) written to `docs/cws-submission.md` as ready-to-paste reference
- Privacy policy content covers all CWS-01 mandates: all data stored locally in `chrome.storage.local`, nothing transmitted, no analytics, data removed on uninstall

### Screenshots & Manual Testing (CWS-03, CWS-04)
- Screenshots are captured manually by the user in real Chrome at 1280×800 — orchestrator generates a `cws-assets/CWS-SCREENSHOTS.md` checklist documenting exactly which views are required (populated scoring view, sidebar with filters, AI prompt modal)
- Screenshots committed to `cws-assets/screenshots/` directory with documented filenames
- Fresh Chrome profile smoke-test checklist written to `cws-assets/CWS-SMOKE-TEST.md` — user runs the manual checks

### Submission & Publishing (CWS-05)
- Orchestrator builds production-ready `dist.zip` via `npm run build` + zip step (user uploads to CWS dashboard)
- Listing description: both short (132 char max) and detailed (16K char max) versions generated in `docs/cws-submission.md`
- Phase marked complete when submission is accepted into CWS review (user confirms submission accepted); CWS-05 final acceptance (listing live) confirmed manually by user

### Claude's Discretion
- Exact wording of privacy policy and listing descriptions (within CWS guidelines)
- Smoke-test checklist content beyond CWS minimums
- ZIP packaging strategy (which files to include/exclude beyond standard MV3 dist output)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `manifest.json` — already complete with `_execute_action` shortcut, `web_accessible_resources`, and `storage` permission
- `npm run build` — Vite + CRXJS produces `dist/` with both `app.html` and `welcome.html` entries (verified in Phase 9 09-03)
- `CHANGELOG.md` — at repo root, contains v1.0 release notes

### Established Patterns
- No new build scripts needed — existing Vite config produces the dist output
- Standard zip command will package dist for CWS upload

### Integration Points
- Repo root: `PRIVACY.md` (new), `dist.zip` (new, gitignored)
- `cws-assets/` directory (new): screenshots, checklists
- `docs/cws-submission.md` (new): ready-to-paste CWS dashboard copy

</code_context>

<specifics>
## Specific Ideas

- Privacy policy must explicitly state: "This extension stores all data locally in `chrome.storage.local`. No data is transmitted to any external service. No analytics, tracking, or telemetry are used. All data is removed when the extension is uninstalled."
- Permissions justification for `storage`: "The `storage` permission is required to save interview scoring sessions, candidate details, custom questions, and user preferences (dark mode, sidebar state). All data remains local to the user's browser via `chrome.storage.local`."
- ZIP must exclude source files — only `dist/` contents

</specifics>

<deferred>
## Deferred Ideas

- Hosting privacy policy on a third-party privacy generator — out of scope
- Multiple CWS listings (regional variants) — out of scope; English-only v1
- CWS promotional images (440×280, 920×680, 1400×560) — optional, not required by CWS-03; defer to post-launch polish

</deferred>
