# Project Research Summary

**Project:** Interviewer Checklist — Chrome Extension
**Domain:** Chrome Manifest V3 browser extension — full-page tab surface, React + Vite + TypeScript, `chrome.storage.local` persistence, zero backend, public Chrome Web Store listing
**Researched:** 2026-06-16
**Confidence:** HIGH

## Executive Summary

A greenfield React + Vite + TypeScript rebuild of the 3,053-line `stack-checklist.html` prototype, packaged as a Chrome MV3 extension whose toolbar action opens a full-page tab. Two audiences (interviewers, candidates) share one UI; persistence is per-session-slot in `chrome.storage.local`; distribution is the public Chrome Web Store. The "how experts build this" answer converges on: CRXJS 2.6 + Vite 8 + React 19 + TS 6, a 5-line event-driven service worker (`chrome.action.onClicked → chrome.tabs.create`), a Zustand store persisted to sharded `session:<id>` keys via a debounced custom adapter, valibot-validated schema migrations, and a pure `yaml`-based codec for structural + legacy progress-only formats.

The recommendation locks the stack (CRXJS over WXT — single-browser/single-surface; valibot over Zod — bundle size; Tailwind v4 via `@tailwindcss/vite`; Biome 2.3 over ESLint+Prettier). v1 scope = the `PROJECT.md` Active list **plus** 11 P1 "polished CWS extension" gaps from Features research (first-run welcome + pin nudge, `chrome.commands` global shortcut, auto-snapshot, storage-quota helper, session-delete confirm, privacy policy URL, focus-trap modal primitive, WCAG completion, version + changelog, update-detected banner). All P2/P3 gaps (templates, comparison, Cmd+K palette, PDF, i18n) defer.

Dominant risks are review-process and silent-data-loss, not technical. The top five: Blue-Argon rejection from empty first-paint; over-broad permissions in a copy-pasted manifest; debounced writes lost on tab close; migration chain breakage on old-format payloads; session-switch racing with pending writes. All have mitigations baked into the recommended 13-step build order. The biggest open questions are dark-mode FOUC strategy (MV3 CSP forbids inline `<script>` boot) and legacy-HTML-prototype migration UX (different origin → unreadable; YAML-only path).

## Key Findings

### Recommended Stack (locked)

- **CRXJS 2.6.1 + Vite 8.0.x** — MV3 bundler, vanilla `vite.config.ts`, HMR for full-page HTML.
- **React 19.2 + TS 6.0** — stable; TS 7 Beta deferred post-v1.
- **Node 24 LTS**.
- **Zustand 5** — ~3 KB; plain-store half callable from non-React contexts.
- **valibot** — ~600 B/schema vs ~13 KB for Zod-standard; the migration surface multiplies schemas.
- **`yaml` (eemeli)** — TS-native, browser-safe under MV3 CSP.
- **Tailwind v4 + `@tailwindcss/vite`** — static CSS, print-stylesheet-compatible.
- **Vitest 3 + @testing-library/react 16 + happy-dom**.
- **Biome 2.3** — single tool replaces ESLint+Prettier; 10–25× faster CI.
- **`chrome-webstore-upload-cli`** from GH Actions; quarterly OAuth token rotation.
- **Plan B:** WXT (hours of migration, not days) if CRXJS regresses.

**Permissions (locked):** `"permissions": ["storage"]` and nothing else. No `host_permissions`, `tabs`, `activeTab`, `scripting`. CSP stays at MV3 default `"script-src 'self'; object-src 'self'"`.

**Surface wiring (locked):** Pattern B — minimal SW with `chrome.action.onClicked → chrome.tabs.create`. Omit `default_popup`.

### v1 Feature Scope (Active + P1 gaps)

**Must-have additions to the PROJECT.md Active list:**

1. First-run welcome tab on `onInstalled` reason==='install' (seeded demo session — defends against Blue-Argon)
2. Pin-to-toolbar nudge on welcome page
3. `chrome.commands` `_execute_action` global shortcut
4. Auto-snapshot (rolling last 3) before Reset all / YAML import
5. Storage-write helper with `getBytesInUse()` quota awareness + `chrome.runtime.lastError`
6. Session-delete confirm + soft-delete window
7. Privacy policy URL + permissions-justification text (CWS publish blocker)
8. Skip-to-content link + landmark roles + `prefers-reduced-motion`
9. Focus-trap modal primitive (`<dialog>` or Radix Dialog)
10. Version footer + bundled `CHANGELOG.md` viewer
11. Update-detected dismissible banner on minor+ bumps

**Defer to v1.x:** session templates, auto-save indicator, per-question tag filter, empty-state copy sweep, inline help popovers on weighting, toolbar action badge.

**Defer to v2+:** side-by-side session comparison, downloadable PDF, Cmd+K palette, `chrome.i18n` wiring, density toggle.

**Anti-features (rejected):** cloud sync, `chrome.storage.sync`, telemetry, real-time collab, new-tab override, side-panel/popup surfaces, encrypted-at-rest, voice notes, candidate avatars, `options_ui`, full i18n.

### Architecture Approach

Five decisions: (1) minimal event-driven SW that never holds state; (2) bootstrap-before-render with synchronous valibot-validated migration; (3) versioned, fixture-pinned, idempotent migration pipeline ending v4→v5 that introduces named sessions; (4) sharded `chrome.storage.local` keys (`manifest` + per-`session:<id>`) with 300 ms trailing debounce + `flushPending()` + synchronous `visibilitychange === "hidden"` / `pagehide` flush; (5) pure scoring / pure AI-prompt-builder / pure YAML-codec modules with tagged-union schemas.

**Component tree:** `src/background/`, `src/storage/`, `src/store/` (slices: `bankOverride`, `scores`, `notes`, `candidate`, `custom`, `ui`, `sessions`, `schemaVersion`), `src/bank/` (build-time constant — NEVER persisted), `src/scoring/`, `src/yaml/`, `src/ai/`, `src/components/{shell,sidebar,tree,modals,primitives}/`, one global `src/styles/print.css`.

### Top 5 Critical Pitfalls (phase-mapped)

1. **Blue-Argon / Spam rejection from empty first-paint** (HIGH, Pitfall 1) — seeded demo session on install; 3+ store screenshots showing populated UI. **Phase 1 + Phase 10.**
2. **Over-broad permissions in copy-pasted manifest** (HIGH, Pitfall 2) — lock manifest to `["storage"]`; CI parses `dist/manifest.json` post-build. **Phase 1.**
3. **Debounced write lost on tab close → silent data loss** (HIGH, Pitfall 5) — two-stage write: 300 ms trailing debounce + synchronous `visibilitychange === "hidden"` / `pagehide` flush (no await); `dirty` flag. **Phase 3.**
4. **Migration chain breakage on old-format payloads → user data loss** (HIGH, Pitfall 6) — every `vN→vN+1` ships with anonymized fixture + unit test; valibot validates input AND output; failure preserves blob under `recovery:<timestamp>`; migrations never deleted. **Phase 3.**
5. **Session-switch races with pending debounced write → cross-session corruption** (HIGH, Pitfall 11) — `sessions.switchTo(id)` calls `flushPending()` synchronously; queued writes stamp `{ sessionId, patch }` and drop on mismatch. **Phase 6.**

Adjacent-severity to keep visible: CSP `'unsafe-eval'` regression (CI grep, Pitfall 7); CRXJS #860 prod build references dev server (CI grep `localhost`/`vite-hmr`, Pitfall 8); chrome.storage 2-set/sec quota saturated by slider drag (trailing-only debounce + `lastError`, Pitfall 10); legacy YAML import ID-collision overwrite (preview modal, default new session, Pitfall 12); prototype `localStorage` at different origin is unreadable (YAML-only migration path, Pitfall 13); OAuth refresh-token rotation (quarterly reminder, Pitfall 9).

## Implications for Roadmap — 10 Phases mapping to ARCHITECTURE.md's 13-step build order

### Phase 1: Foundation & Scaffolding
**Rationale:** Locks manifest, permissions, surface wiring, CI safety nets before any code that could violate them exists.
**Delivers:** Vite + CRXJS + React + TS + Biome + Vitest scaffold; hand-authored `manifest.json` with `["storage"]`; ≤30 LOC SW; empty `app.html`; GH Actions release workflow; CI guards (manifest-permissions, `eval`/`unsafe-eval`/inline-script grep, `localhost`/`vite-hmr` grep).
**Avoids:** Pitfalls 1 (no `default_popup`), 2, 4 (SW stateless rule), 7, 8, 19, 20.

### Phase 2: Question Bank + Scoring Engine
**Rationale:** Pure data + pure functions, no UI dependency; freeze the behavioral contract.
**Delivers:** `src/bank/` typed `DEFAULT_SECTIONS` (9 groups / ~86 topics / ~1000+ questions / 4 difficulty levels); `src/scoring/` weighted topic / group / overall marks + override; full Vitest coverage with prototype-derived fixtures.
**Avoids:** Anti-Pattern 3 (bank-as-state).

### Phase 3: Storage Layer + Migration + Bootstrap
**Rationale:** Highest-risk phase for silent data loss; two top-5 pitfalls live here. Must precede any UI write.
**Delivers:** `src/storage/` adapter with `chrome.runtime.lastError` checks; sharded keys; valibot schemas per version; `migrate()` pipeline v1→v5 each pure + fixture + dual-validated; recovery-on-failure; legacy in-extension `localStorage` v4→v5 read-once-delete; `bootstrap()` before `createRoot`; Zustand store + persist middleware with trailing debounce + `flushPending()` + sync flush on `visibilitychange === "hidden"` / `pagehide`; auto-snapshot wrapper; quota helper.
**Adds (P1):** schema-version envelope from day one; auto-snapshot; storage-write helper.
**Avoids:** Pitfalls 5, 6, 10, 11, 13, 16, 29.

### Phase 4: Shell, Sidebar, Read-Only Content Tree
**Rationale:** Smallest user-visible vertical slice; validates `visibleTree` selector before write storms.
**Delivers:** Shell + Sidebar (collapsible Search/Difficulty/Sections/Actions groups, debounced ~150 ms search, live counts, per-group marks); ContentArea memoized; view toolbar (Expand/Collapse/Hide-marked); responsive overlay; dark mode (CSS `prefers-color-scheme` default + manual override post-hydrate); accessibility landmarks + skip-to-content.
**Adds (P1):** skip-to-content, landmarks, `prefers-reduced-motion`.
**Avoids:** Pitfalls 15 (FOUC), 17 (React Compiler off in v1), 24 (dark-mode contrast).

### Phase 5: Scoring UI + Notes + Candidate + Custom Questions
**Delivers:** `QuestionRow.ScoreSlider` with `aria-label={question.text}`; live topic-mark via `useTopicMark`; topic override input; per-question + per-topic notes; candidate modal; custom-questions CRUD with "custom" badge.
**Avoids:** Pitfalls 22 (use `<dialog>` / Radix), 25 (delete flushes pending writes), 34.

### Phase 6: Multiple Named Sessions + Switcher
**Delivers:** `sessionsSlice` registry + `activeSessionId`; switcher modal; create/rename/duplicate/delete with confirm + soft-delete + undo toast; switch action calls `flushPending()` synchronously; YAML scope = active session.
**Adds (P1):** session-delete confirm + soft-delete.
**Avoids:** Pitfalls 11, 32.

### Phase 7: YAML Import / Export
**Delivers:** Pure `src/yaml/codec.ts` returning tagged union `{ kind: 'structural' | 'legacyProgress' | 'error' }`; per-format valibot schemas; stable `deriveId(group, topic, question)` with normalization; `yamlVersion` field on structural; preview modal on import ("will modify N, add M, X unmatched"); default target = NEW session; file input with `accept`/size-cap; export via `URL.createObjectURL` blob + `URL.revokeObjectURL`.
**Avoids:** Pitfall 12.

### Phase 8: AI Prompt Modal
**Delivers:** `buildPrompt(snapshot)` pure; modal opens with editable `<textarea>`; copy via `navigator.clipboard.writeText` called synchronously in click handler with manual-select fallback (textarea pre-selected).
**Avoids:** Pitfall 18.

### Phase 9: Polish — Print, Keyboard, A11y, Welcome/Onboarding/Updates
**Delivers:** Global `print.css` with `!important` + stable selectors (`.no-print`, `.group-card`, `.topic-card`, `data-collapsed`, `data-hidden`, `textarea { height: auto !important }`); keyboard shortcuts `/`, `\`, `Esc` with input-target ignore; `chrome.commands` `_execute_action` shortcut; first-run welcome tab + seeded demo session + pin nudge; update-detected banner using `details.previousVersion`; version footer + `CHANGELOG.md` viewer; axe-core sweep; dark-mode contrast audit.
**Adds (P1):** welcome + pin nudge (Pitfall 1 in code), `chrome.commands`, version + changelog, update banner, focus-trap on all modals, `prefers-reduced-motion`.
**Avoids:** Pitfalls 14, 23, 24, 30, 33, 35.

### Phase 10: Chrome Web Store Submission
**Delivers:** Privacy policy hosted at stable HTTPS URL (local-only storage, candidate PII handling, no transmission/analytics); permissions-justification in dashboard; 3+ screenshots (1280×800) showing populated UI / AI prompt / YAML export (NOT empty state); listing description sentence 1 matches screenshots; release runbook (quarterly OAuth rotation, two-owner GCP, dashboard fallback); manual smoke-load of `.zip` in fresh Chrome profile; `chrome-webstore-upload-cli` via GH Actions.
**Avoids:** Pitfalls 1, 3, 9, 26, 27, 28.

### Phase Ordering Rationale

Foundation first — cheapest mitigation for highest-severity store-review pitfalls. Pure modules (bank, scoring) before storage so storage is designed against a tested contract. Storage + migration before any UI write because persistence correctness is the hardest thing to retrofit. Read-only UI before write UI to validate `visibleTree` patterns before sliders. Sessions after the scoring loop so race hazards are easier to reason about. YAML + AI as self-contained features. Polish + onboarding late so the welcome page is built against the actually-shipped UX. Submission prep is its own phase — its blockers are not code.

### Research Flags

- **Phase 3 (Storage):** Empirically verify synchronous flush semantics on `pagehide` in MV3; legacy migration UX open.
- **Phase 4 (Dark-mode FOUC):** Lock Pitfall 15 alternative A vs B during planning.
- **Phase 7 (Legacy YAML):** Gather real prototype-export corpus to fixture-test ID-derivation normalization.
- **Phase 10 (CWS submission):** Short pass on 2026 granular-OAuth + 90-day rotation rules + privacy-policy hosting.

Standard / skip dedicated research: Phases 1, 2, 5, 6, 8, 9.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Headline picks verified against current official sources within 60 days. CRXJS long-term MEDIUM but WXT escape hatch documented. Tailwind v4 vs CSS Modules MEDIUM, non-blocking. |
| Features | MEDIUM-HIGH | Chrome platform APIs + CWS policy HIGH; "what users expect 2026" MEDIUM from 2026 best-practice guides + competitor analysis. |
| Architecture | HIGH | MV3 APIs stable; prototype is on-disk behavioral source of truth; 13-step build order maps 1:1 to verified patterns. |
| Pitfalls | HIGH | Store-review + MV3 mechanics HIGH; CRXJS #860/#897 verified. MEDIUM only on valibot partial-schema failure + Zustand persist-during-unload (theoretical, not empirically tested in this exact combination). |

**Overall confidence:** HIGH

## Gaps to Address (carry into requirements / planning)

- Dark-mode boot strategy under MV3 CSP — Phase 4 planning, lock A vs B.
- Legacy-HTML-prototype migration UX — welcome page copy + legacy YAML corpus validation.
- First-install demo-session content — exact contents for Phase 9.
- Question-bank delivery: bundled vs `fetch(chrome.runtime.getURL('bank.json'))` — decide empirically after Phase 2.
- `yamlVersion` field schema design — resolve during Phase 7 planning.
- Storage-quota near-full UX copy — Phase 9.
- Tailwind v4 vs CSS Modules — lock in Phase 1; architecture works either way.
- `chrome.commands` suggested-key choice — Phase 9, check `chrome://extensions/shortcuts` for collisions.

## Sources

### Primary (HIGH)
- `stack-checklist.html` (behavioral source of truth)
- `.planning/PROJECT.md`
- Chrome for Developers — `chrome.action`, `chrome.tabs.create`, `chrome.storage.local` (MAX_WRITE_OPERATIONS_PER_MINUTE), `chrome.runtime.onInstalled`, service-worker lifecycle, MV3 CSP, `chrome.commands`, `chrome.i18n`, `chrome.notifications`, Privacy Policy & Secure Handling
- React 19 / 19.2 announcements (react.dev)
- TypeScript 6.0 announcement / TS 7 Beta blog
- Vite 8 announcement and releases
- Tailwind v4 announcement
- Node.js Release WG / endoflife.date
- @crxjs/vite-plugin on npm + GitHub releases + discussion #872
- CRXJS issues #860 (prod references dev server), #897 (HMR + WAR)
- yaml (eemeli) on GitHub / npm
- MDN — `prefers-color-scheme`, Clipboard API focus requirement
- fregante/chrome-webstore-upload-cli + issue #47 (refresh-token expiry)

### Secondary (MEDIUM)
- Zod v4 vs Valibot benchmark (dev.to/whoffagents, 2026)
- Pockit: Zod vs Valibot vs ArkType 2026
- WXT docs; State of Browser Extension Frameworks 2025
- Tailwind v4 review 2026 (BuildPilot)
- Biome 2026 review + migration guide
- Zustand + Chrome Storage practical writeup (drewalth.com)
- ExtensionBooster 2026 best-practices guide
- GroovyWeb / DEV Community — Building Chrome Extensions in 2026 (MV3)
- ExtensionFast / PrivacyPolicies.com / LegalForge — privacy policy
- Reintech — Chrome extension i18n
- BrowserStack — accessibility + WCAG Chrome extensions
- Insight7 / Sapia.ai / iMocha / Mokka AI — competitor landscape 2026
- Google OAuth token lifetime best practices 2026

### Tertiary (LOW)
- BrowserNative — Extensions Update Notifier
- w3tutorials — Export local storage data
- Best Chrome Extensions — Update strategies

---
*Synthesized: 2026-06-16*
