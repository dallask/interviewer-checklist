---
phase: 10-chrome-web-store-submission
plan: 01
subsystem: docs
tags: [cws, privacy, submission, screenshots, smoke-test]
requires: []
provides:
  - PRIVACY.md
  - docs/cws-submission.md
  - cws-assets/CWS-SCREENSHOTS.md
  - cws-assets/CWS-SMOKE-TEST.md
affects: [.gitignore]
tech_stack_added: []
patterns: []
key_files_created:
  - PRIVACY.md
  - docs/cws-submission.md
  - cws-assets/CWS-SCREENSHOTS.md
  - cws-assets/CWS-SMOKE-TEST.md
  - cws-assets/screenshots/.gitkeep
key_files_modified:
  - .gitignore
decisions:
  - Privacy policy lives at repo root as PRIVACY.md (canonical source); user publishes to HTTPS in Plan 10-03
  - All CWS dashboard copy consolidated in docs/cws-submission.md, one section per dashboard field
  - Screenshots are user-captured at 1280x800 via DevTools device toolbar, gitignored by default with .gitkeep to track the directory
  - Smoke-test checklist uses `- [ ]` items and references existing REQ-IDs (FOUND/SCORE/SESS/YAML/AI/UI/POLISH/CWS)
metrics:
  duration: TBD
  completed: 2026-06-18
---

# Phase 10 Plan 01: CWS Submission Artifacts Summary

Generated every written Chrome Web Store submission artifact (privacy policy, dashboard copy, screenshot checklist, smoke-test checklist) in a single autonomous pass, plus the `.gitignore` exclusion for binary screenshots.

## What was built

- **`PRIVACY.md`** at the repo root — the canonical privacy policy covering CWS-01 mandates. All 12 required sections present (Summary, Data we collect, Where data is stored, Data transmission, Third-party services, Data sharing, Data removal, Permissions, Children's privacy, Changes, Contact). Cites `chrome.storage.local`, explicitly states no transmission / no analytics / no telemetry, documents removal on uninstall, and justifies the single `storage` permission. Contact URL is a placeholder for the user to substitute when publishing.
- **`docs/cws-submission.md`** — ready-to-paste CWS Developer Dashboard copy with all 12 sections: short description (≤132 chars, character count verified), detailed description derived from CHANGELOG.md 1.0.0, single-purpose description, the exact CWS-02 permissions-justification phrasing from 10-CONTEXT.md, host-permissions justification, remote-code justification, data-usage table, privacy-policy URL placeholder, category/language recommendation, and a submission checklist.
- **`cws-assets/CWS-SCREENSHOTS.md`** — capture checklist for the three required 1280×800 screenshots (`01-scoring-view-populated.png`, `02-sidebar-with-filters.png`, `03-ai-prompt-modal.png`) with per-shot state setup, "MUST NOT appear" guidance, and post-capture verification steps.
- **`cws-assets/CWS-SMOKE-TEST.md`** — fresh-profile smoke-test checklist covering install, welcome flow, scoring loop, sessions, YAML, AI modal, UI shell, print, keyboard shortcuts, network/storage verification, and uninstall — using `- [ ]` checkboxes throughout.
- **`.gitignore`** — appended a "Chrome Web Store submission assets" section that excludes `cws-assets/screenshots/*` while allowing `.gitkeep`. Existing `*.zip` line preserved.
- **`cws-assets/screenshots/.gitkeep`** — empty placeholder so the screenshots directory tracks in git even when no PNGs are committed.

## Requirements coverage

| Requirement | Coverage in this plan |
| ----------- | --------------------- |
| **CWS-01** Privacy policy | Source-of-truth text written at `PRIVACY.md`. Final fulfillment (live HTTPS URL) lands in Plan 10-03. |
| **CWS-02** Permissions justification + listing copy | Exact CWS-02 phrasing recorded in `docs/cws-submission.md` along with all dashboard copy. User pastes during submission. |
| **CWS-03** Screenshots | Capture checklist authored at `cws-assets/CWS-SCREENSHOTS.md`. Manual capture by user occurs in Plan 10-02. |
| **CWS-04** Fresh-profile smoke test | Checklist authored at `cws-assets/CWS-SMOKE-TEST.md`. Manual execution by user occurs in Plan 10-02. |
| **CWS-05** Submission | Out of scope for this plan; handled in Plan 10-03. |

## Commits

- `8f12a17` docs(10-01): add privacy policy at repo root (CWS-01) — PRIVACY.md
- `2803fdd` docs(10-01): add CWS dashboard copy + screenshot & smoke-test checklists (CWS-02, CWS-03, CWS-04) — docs/cws-submission.md, cws-assets/CWS-SCREENSHOTS.md, cws-assets/CWS-SMOKE-TEST.md, cws-assets/screenshots/.gitkeep, .gitignore

## Deviations from Plan

None — plan executed exactly as written. No bugs, no missing functionality, no blocking issues, no architectural changes required.

## Tasks completed

| Task | Name | Files | Commit |
| ---- | ---- | ----- | ------ |
| 1 | Write PRIVACY.md at repo root | PRIVACY.md | 8f12a17 |
| 2 | Write docs/cws-submission.md + screenshot & smoke-test checklists + .gitignore update | docs/cws-submission.md, cws-assets/CWS-SCREENSHOTS.md, cws-assets/CWS-SMOKE-TEST.md, cws-assets/screenshots/.gitkeep, .gitignore | 2803fdd |

## Verification

- `PRIVACY.md`: contains `chrome.storage.local`, `No data is transmitted`, `uninstalled`, `no analytics`, and `## Permissions` section; `storage` keyword appears ≥3× in body.
- `docs/cws-submission.md`: contains `Permissions justification` and `storage`; short-description line ≤132 chars.
- `cws-assets/CWS-SCREENSHOTS.md`: contains `1280`; lists the three required PNG filenames.
- `cws-assets/CWS-SMOKE-TEST.md`: contains `fresh`; uses `- [ ]` checkboxes.
- `.gitignore`: contains `cws-assets/screenshots`; existing `*.zip` line preserved.
- No code under `src/` modified.

## Self-Check: PASSED

- Files on disk: PRIVACY.md, docs/cws-submission.md, cws-assets/CWS-SCREENSHOTS.md, cws-assets/CWS-SMOKE-TEST.md, cws-assets/screenshots/.gitkeep, .gitignore — all present.
- Commits in git history: 8f12a17 (Task 1), 2803fdd (Task 2) — both present.
- Plan frontmatter `must_haves` checks: PRIVACY.md ≥30 lines (73), docs/cws-submission.md ≥60 lines (115) and contains "storage", cws-assets/CWS-SCREENSHOTS.md ≥20 lines (39) and contains "1280", cws-assets/CWS-SMOKE-TEST.md ≥20 lines (105) and contains "fresh", .gitignore contains "cws-assets/screenshots".
- Short description verified at 117 / 132 characters.
- No files under `src/` were modified.
