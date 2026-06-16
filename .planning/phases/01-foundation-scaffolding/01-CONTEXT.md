# Phase 1: Foundation & Scaffolding - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

A clean, store-review-safe build scaffold exists with CI guards that prevent MV3 violations before any feature code is written. This phase delivers the project structure, tooling, and CI pipeline — no user-facing UI or features. Downstream phases depend on this scaffold.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Refer to ROADMAP success criteria and project constraints:

- **Stack:** CRXJS + Vite + React + TypeScript + Biome (from PROJECT.md target features)
- **Permissions posture:** only `"storage"` in manifest.json — no `default_popup`, no `host_permissions`, no `scripting`
- **Entry point:** toolbar action → opens full-page tab (`chrome.action.onClicked`)
- **CI:** GitHub Actions with a lint step that rejects any dist containing `eval`, `unsafe-eval`, inline scripts, or `localhost`/`vite-hmr` references
- **Release pipeline:** GH Actions workflow using `chrome-webstore-upload-cli` to publish the extension zip

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stack-checklist.html` — behavioral spec / source of truth for parity; not reused as code
- No existing React/TS source directories — greenfield scaffold

### Established Patterns
- No prior codebase patterns — this phase establishes them

### Integration Points
- All subsequent phases build on the scaffold produced here
- Phase 2+ will add source files under `src/`

</code_context>

<specifics>
## Specific Ideas

No specific implementation requirements — infrastructure phase. Follow CRXJS + Vite + React + TS + Biome conventions and Chrome MV3 best practices.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase; all UI and feature work is in later phases.

</deferred>
