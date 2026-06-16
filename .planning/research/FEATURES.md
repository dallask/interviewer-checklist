# Feature Research

**Domain:** Chrome MV3 full-tab interview-scoring / interview-prep checklist extension (single-user, no backend, dual audience: interviewers scoring SWE candidates + candidates self-assessing)
**Researched:** 2026-06-16
**Confidence:** MEDIUM-HIGH (Chrome platform APIs and CWS policy are HIGH confidence from official Chrome for Developers docs; "what users expect in 2026" is MEDIUM — synthesized from 2026 best-practice guides and competitor analysis rather than primary user research)

## Scope of This Research

The user already has a thorough behavioral spec for the checklist itself (the `stack-checklist.html` parity list in `PROJECT.md` Active). This document deliberately **does not re-derive** scoring-engine, sidebar, YAML, AI-prompt, candidate-details, custom-questions, search/filter, or print features — those are already locked. Instead it answers: **what does a 2026 Chrome Web Store extension need beyond a packaged webapp?**

Every row below is annotated with **`(in Active)`** if it already appears in `PROJECT.md` → Requirements → Active, or **`(GAP)`** if it does not. Only `(GAP)` rows are candidates for new requirements.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes the product feel like "a webapp someone zipped into a CRX."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| First-run welcome tab on install (`chrome.runtime.onInstalled` reason==='install') **(GAP)** | After clicking Install in the Web Store the user is dumped back to the store page with no orientation. 2026 onboarding guidance says "get users to value in <60 seconds." Cold-launching a full-tab with a 1000-question rubric is hostile without orientation. | LOW | Service-worker listener opens an in-extension `welcome.html` route that explains the two audiences, points at the toolbar pin, and offers "start interviewer session / start prep session." Roughly one extra route + a one-time `chrome.storage.local` flag so it never re-fires. |
| Pin-to-toolbar nudge during onboarding **(GAP)** | Chrome hides newly-installed extensions behind the puzzle-piece menu by default. Users who can't find the toolbar icon churn within the first session. Visual pin prompts measurably increase daily usage. | LOW | A small illustration on the welcome page pointing at the puzzle-piece → pin. No API; pure UX. |
| Schema version + silent migration on storage load **(in Active — "schema-migration on load")** | Users who installed v1.0 must not lose work when v1.1 changes the slot shape. Greenfield can still get this wrong by not stamping a version number on day one. | LOW | `{ schemaVersion: 1, sessions: {...} }` envelope from the very first write. Migration runs are pure functions keyed off `schemaVersion`. |
| Auto-snapshot before any destructive action (Reset all / Import YAML / migration) **(GAP — extends "Reset all (with confirmation)")** | "Reset all" with a confirm dialog is necessary but not sufficient. Users misclick. Industry pattern: keep N rolling snapshots in `chrome.storage.local` (e.g. last 3) and surface "Undo last reset" / "Restore previous version" for ~24 hours. | LOW-MEDIUM | One snapshot key per slot, FIFO trim. Storage budget is generous (5MB) for a tool whose serialized state is tens of KB per session. |
| Dark mode honoring `prefers-color-scheme` with manual override **(in Active)** | Confirming this is genuinely table stakes in 2026 — a tool used during evening prep or in dark IDE-adjacent workflows that flashes white is a complaint magnet. The Active item already calls out the OS-respect + override pattern, which is correct. | LOW | CSS variables driven by `[data-theme]`; system default tracked via `matchMedia('(prefers-color-scheme: dark)')`. |
| Privacy policy URL + minimal-permissions justification text **(GAP — required by CWS, not in Active)** | Chrome Web Store review cross-checks manifest permissions, the dashboard's data-categories declaration, and the linked privacy policy. The single most common rejection is mismatch between these three. Even a "we don't collect anything" extension needs a public privacy-policy URL on the listing. | LOW | A static `PRIVACY.md` rendered to GitHub Pages (or similar) saying "all data is stored locally via `chrome.storage.local`; nothing is transmitted; no analytics." Permissions justification text in the dashboard explaining why `storage` is needed. |
| Keyboard shortcut via `chrome.commands` to open the tab **(GAP — extends in-page `/`, `\`, `Esc`)** | The Active list covers *in-app* shortcuts. But power users expect `Ctrl+Shift+I`-style global shortcuts that *open* the extension, customizable from `chrome://extensions/shortcuts`. Manifest can suggest up to 4 (only `_execute_action` is needed here). | LOW | `"commands": { "_execute_action": { "suggested_key": { ... } } }` in manifest. Stays out of the way; users discover it via the shortcuts page. |
| Visible app version + link to changelog **(GAP)** | After silent auto-updates users want to know "what changed?" Without it, behavior changes feel like bugs. The standard is: a small "v1.3.2 — what's new" link in a footer/about area, opening a markdown changelog page (in-extension route or GitHub `CHANGELOG.md`). | LOW | Hardcode the version from `chrome.runtime.getManifest().version`. Render the section by tag inside `CHANGELOG.md`. |
| Update-detected indicator (subtle, dismissible) **(GAP)** | When the service worker fires `onInstalled` with reason==='update' and the version diff crosses a threshold (minor+, not patch), surface a one-time non-modal toast: "Updated to v1.3 — see what's new." Do **not** auto-open a new tab on update (intrusive, ranked as a top complaint in Chrome-extension UX literature). | LOW | Compare `previousVersion` (provided by the event) to current; set a one-time `pendingChangelog` flag in storage; render a dismissible banner on next open. |
| Reliable focus management for modals (focus trap, Esc to close, focus restore) **(partially in Active — "Esc clear search / close modal")** | A11y on a full-tab SPA hosting modals (candidate details, AI prompt, confirm dialogs) requires real focus trapping and restoration, not just Esc. WCAG AA bare-minimum but easy to get wrong with hand-rolled modals. | LOW-MEDIUM | Use a vetted primitive (Radix UI Dialog or Headless UI Dialog) rather than home-grown. Aligns with the "real `<button>` / `<select>`" Active item. |
| Skip-to-content link + landmark roles **(GAP — extends accessibility item)** | The Active accessibility line covers controls and labels, but the SPA needs `<main>`, `<nav>`, `<aside>` landmarks and a "Skip to questions" link for keyboard users navigating a 1000-question scroll list. | LOW | Pure markup. |
| Reduced-motion respect (`prefers-reduced-motion`) **(GAP)** | If dark-mode transitions or sidebar slide animations are introduced, they must honor reduced-motion. Table stakes for WCAG 2.2 and AODA. | LOW | One media query gate around animation rules. |
| Storage quota awareness / graceful failure **(GAP)** | `chrome.storage.local` is generous (~5–10MB default) but multiple named sessions × 1000-question banks × notes can creep up. Silent write failures (quota exceeded) lose user work. Need to catch `chrome.runtime.lastError` and surface a "storage near full — export and clear old sessions" UI. | LOW-MEDIUM | Wrap storage writes in a helper that checks `chrome.storage.local.getBytesInUse()` against a threshold and surfaces a toast. |
| Confirmation on session deletion **(GAP — implied by sessions in Active but not called out)** | Multiple named sessions implies a delete affordance. Without a confirm + soft-delete window, an interviewer running back-to-back interviews will delete the wrong row. | LOW | Modal confirm + 10-second "undo" toast, or send to a "trash" partition that purges after N days. |
| Functional in the Web Store screenshots **(GAP — listing asset, not code)** | Web Store listing pages without quality screenshots convert poorly. 1280×800 hero shots showing the scoring view, the sidebar with filters, and the AI prompt modal are listing-page table stakes. | LOW | Asset work, done at the launch milestone. Not a code feature but blocks Active item "Published listing on Chrome Web Store." |

### Differentiators (Competitive Advantage)

Features that distinguish this from the dozens of generic checklist/rubric tools. Pick a few; don't try to ship them all in v1.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Session templates — duplicate an existing session as a starting point, or save a configured filter+structure as "interviewer template" **(GAP)** | An interviewer who runs 20 candidates a quarter shouldn't redo the same difficulty filter / section-disable setup each time. A candidate prepping for a specific role shouldn't start from scratch on attempt #2. Templates turn the tool into a workflow, not a one-shot. | MEDIUM | A "save current as template" action on the session switcher; template = serialized filter + structure + empty scores. Free-rides on the existing YAML schema. |
| Side-by-side session comparison (read-only diff of two completed sessions) **(GAP)** | Interviewers who run multiple candidates for the same role want to compare per-topic marks at-a-glance to inform a hiring decision. Today that's done by tabbing between YAML exports. | MEDIUM-HIGH | Read-only view that loads two slots side-by-side, color-codes per-topic deltas, doesn't touch scoring engine. |
| PDF export of session results (printable summary, not the full rubric) **(GAP — extends print stylesheet)** | The Active item ships a print stylesheet that expands everything — useful for archiving the *whole* rubric. A separate "results PDF" (candidate name, overall mark, per-group breakdown, key notes) is what an interviewer actually shares with a hiring panel. | MEDIUM | `window.print()` against a dedicated print route, or `html2pdf.js` if a downloaded file is required. No new permissions. |
| In-extension changelog viewer keyed to install/update events **(GAP)** | Bundling a `CHANGELOG.md` and rendering it in an in-app modal on first launch after a minor+ version bump is a polish move that builds trust ("they actually told me what changed"). Pairs with the update-detected indicator in Table Stakes. | LOW | Static markdown rendered by a markdown lib already on the dependency budget (or hand-rolled, the format is simple). |
| Quick-switcher for sessions (Cmd/Ctrl+K palette) **(GAP)** | A power-user fuzzy-finder palette to switch between sessions, jump to a topic, or trigger Reset/Import/Export. Aligns with the existing keyboard-shortcut posture. Differentiator because no comparable open-source checklist extension ships one. | MEDIUM | One overlay component, fuzzy-search lib (Fuse.js, ~6KB), routes to existing actions. |
| Auto-save indicator + last-saved timestamp **(GAP)** | Users coming from Google-Docs/Notion expect a "Saved 2s ago" cue. The current spec persists silently. A small status string in the header builds trust that work isn't being lost. | LOW | Update a timestamp in storage on every write; render `formatRelativeTime` in the header. |
| Per-question / per-topic tagging & filter **(GAP)** | The bank already has tags (used by the search field in the Active spec). Surfacing "filter by tag" as a first-class control (alongside difficulty + section) lets candidates focus prep on e.g. "react-hooks" without typing into search. | LOW-MEDIUM | Add tag-set extraction over the loaded bank, render as multi-select in the sidebar Filters group. |
| Empty-state guidance per surface **(GAP)** | Empty session switcher → "Create your first session." Empty notes field → faint placeholder with a hint. Empty filter results → "No questions match — clear filters." This is the difference between a tool that feels considered and one that feels like a prototype. | LOW | UI work scattered across components; no central system needed. |
| Inline help popovers (?) on dense controls — weighting, override, "custom" badge **(GAP)** | A rubric with difficulty coefficients (1.00/1.25/1.50/1.75) and manual topic overrides is *not* self-explanatory to a first-time interviewer. Tiny `?` icons opening short popovers reduce the need for external docs. | LOW | Reuse a tooltip primitive (Radix Popover / Headless UI). |
| Toolbar action badge showing active session name initial or unread-changelog dot **(GAP)** | The extension icon is the only persistent surface. A 1-letter badge ("A" for "Alice candidate") or a single "•" dot on update is a free UX win using `chrome.action.setBadgeText`. | LOW | One service-worker helper. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that look attractive but conflict with stated constraints (`chrome.storage.local` only, no backend, single-user, MV3 minimum-permissions posture) or with the product's actual job-to-be-done.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cloud sync across devices | Users coming from Notion/Asana assume cross-device by default. Candidates may prep on a laptop and continue on a desktop. | Explicitly Out of Scope in `PROJECT.md` — would require a backend, auth, a privacy policy that covers transmission, and would invalidate the "minimal permissions / `storage` only" posture that eases CWS review. Adds a recurring cost to a free tool. | YAML export/import already covers the "I need this on another machine" workflow. Document the export-restore loop in the welcome page. |
| `chrome.storage.sync` instead of `chrome.storage.local` | "Just use the built-in sync, it's free!" | The 100KB-per-extension and 8KB-per-item quota cannot hold the 1000+ question bank, let alone multiple named sessions. Silent write failures would lose user work. Explicit Out of Scope in `PROJECT.md`. | Stay on `local`. If cross-device ever becomes a goal, treat it as a separate milestone with a deliberate sync strategy. |
| Built-in analytics / telemetry (even "anonymous usage stats") | Product instinct: "we need to know which features get used." | Triggers the entire CWS data-handling cliff — every collected category must be disclosed in the dashboard, justified in the privacy policy, declared in permissions, and disclosed to the user with consent. For a tool with no business model, the overhead vastly outweighs the insight. Many users actively avoid extensions that "phone home." | Ship without telemetry. Solicit qualitative feedback via a "Send feedback" mailto link or a GitHub issues URL. Revisit only if the product graduates to having a maintainer team needing usage data. |
| Real-time collaborative scoring (multiple interviewers same session live) | "We have panel interviews — wouldn't it be cool if all three interviewers scored the same session simultaneously?" | Explicit Out of Scope. Requires a backend, presence, conflict resolution (CRDTs or OT), auth — a different product. | Each interviewer scores their own session; export YAMLs; aggregate offline. A "compare sessions" differentiator (above) covers the post-hoc combination. |
| New-tab override (replace `chrome://newtab`) | Maximum visibility, "users see it every time they open a tab." | Hostile to users who installed the extension for occasional use; widely complained about; bumps the CWS review bar; conflicts with the Active "toolbar action → full tab in v1" decision. | Toolbar action + `chrome.commands` keyboard shortcut to open the tab is the right surface. |
| Side Panel / popup-window surfaces | "Why not also offer a side panel?" | Explicit Out of Scope. The UI is dense (sidebar + main + modals) and would degrade in the ~360px side panel. Three surfaces = three maintenance burdens for a parity-first v1. | Single full-tab surface in v1. Revisit only after CWS metrics show user demand. |
| Auto-open a new tab on every extension update | "Tell the user what changed!" | Universally rated as obnoxious in extension UX reviews — it interrupts whatever the user is doing in another tab. Reason CWS reviewers cite for poor UX. | Surface a dismissible in-extension toast/banner on next open (see Table Stakes "update-detected indicator"). |
| Per-component theme palette / theme builder | Users may say they want "more customization." | Multiplies CSS state, breaks contrast guarantees needed for WCAG AA, adds settings-page complexity, doesn't move the core scoring job-to-be-done. | Ship light + dark + system. If real demand emerges, add a `compact` density toggle (single CSS variable swap) before any "build your own theme." |
| Full i18n at v1 | "It's a Web Store extension, shouldn't it support all languages?" | The bank itself is ~1000 English technical questions about a specific tech stack — translating the chrome but not the content is dishonest, and translating the content is an enormous, ongoing content-engineering project. CWS does not require i18n; English-only listings are common. | Ship English-only v1. Wire up `chrome.i18n` infrastructure for the chrome (manifest name/description, UI strings) if it's cheap — that lowers the cost of adding locales later — but do not block v1 on translations. Localize the Web Store *listing* metadata if user-research justifies a specific region. |
| Dedicated `options_ui` page in addition to the main UI | "Every extension has an options page, right?" | For a full-tab extension where the main UI *is* the settings surface (theme toggle, session switcher, reset), a separate `chrome://extensions/?options=...` page is redundant — two places to change the same setting confuses users and doubles the maintenance burden. | In-app Settings drawer/route inside the main tab. Skip `options_ui` until there's a genuine reason (e.g. an admin-policy setting that only makes sense outside the main flow). |
| Encrypted-at-rest local storage | "Candidate names are PII — encrypt them." | `chrome.storage.local` is already partitioned per-extension and inaccessible to web pages. End-to-end encryption inside the extension adds key-management UX (passphrase prompts, lost-password = lost-data) that hurts more users than it protects. CWS only requires encryption for *transmitted* PII, not local storage. | Document in the privacy policy that data lives in `chrome.storage.local`, never leaves the device, and is removed on extension uninstall. Recommend YAML export for archival. |
| Voice-note attachments to questions/topics | "Interviewers want to dictate quick notes." | Adds `microphone` permission (heavy CWS review signal), blob storage that quickly exceeds quota, accessibility complexity for the playback UI, and no obvious export story for YAML. | Stick to text notes. If dictation is the real need, point users at OS-level dictation (macOS Voice Control, Windows Speech), which fills any text field. |
| Candidate avatar upload | "It'd be nice to see who I'm interviewing." | More PII to handle, larger storage footprint, no scoring value, photographs of candidates raise bias / EEOC concerns in hiring contexts. | Initials avatar derived from the candidate name in the details modal — zero permissions, zero PII increase, same visual hook. |

## Feature Dependencies

```
[First-run welcome tab on install]
    └──requires──> [chrome.runtime.onInstalled handler in service worker]
                       └──requires──> [persisted "hasSeenWelcome" flag in chrome.storage.local]
                                          └──requires──> [schema version envelope on storage]

[Update-detected indicator + In-extension changelog viewer]
    └──requires──> [chrome.runtime.onInstalled handler with reason==='update']
                       └──requires──> [bundled CHANGELOG.md + version-tag parser]

[Auto-snapshot before destructive actions]
    └──requires──> [schema version envelope on storage]
    └──enhances──> [Reset all confirmation flow already in Active]
    └──enhances──> [YAML import flow already in Active]

[Side-by-side session comparison]
    └──requires──> [Multiple named sessions in Active]
    └──requires──> [Read-only render mode for the scoring engine]

[Session templates]
    └──requires──> [Multiple named sessions in Active]
    └──requires──> [Serializable session shape — already satisfied by the YAML schema in Active]

[PDF export of results]
    └──enhances──> [Print stylesheet already in Active]
    └──optional──> [html2pdf.js or jsPDF if downloaded file is required vs window.print()]

[Storage quota awareness]
    └──requires──> [Centralized storage helper wrapping chrome.storage.local writes]
    └──enhances──> [Auto-snapshot, multiple named sessions, custom questions — all writers]

[Cmd/Ctrl+K quick-switcher]
    └──requires──> [Multiple named sessions in Active]
    └──enhances──> [Keyboard shortcuts /, \, Esc already in Active]

[Privacy policy URL on Web Store listing]
    └──blocks────> [Published listing on Chrome Web Store in Active]

[chrome.commands global shortcut]
    └──requires──> ["commands" key in manifest.json]
    └──independent of──> in-app /, \, Esc shortcuts (different layer)
```

### Dependency Notes

- **Schema version envelope is upstream of almost everything in this list.** The Active item already says "schema-migration on load" — make sure the very first write of v1 includes `schemaVersion: 1` so all downstream migration, snapshot, and changelog logic has a stable foundation.
- **Multiple named sessions (already in Active) unlocks three differentiators** — templates, side-by-side comparison, quick-switcher. Order roadmap phases so sessions land before any of those.
- **Privacy policy URL is a hard blocker on the Active "Published listing" item.** It's not code, but it must be authored and hosted before submission.
- **In-extension changelog viewer + update-detected indicator are a pair.** Ship them together or neither — a banner with no destination is worse than no banner.
- **PDF export and the print stylesheet do not conflict** but should share a common print route to avoid two divergent layouts.
- **Storage quota awareness enhances every writer.** Implement the wrapper helper early so subsequent features inherit graceful-failure behavior for free.

## MVP Definition

### Launch With (v1) — additions beyond the `PROJECT.md` Active list

The Active list already defines v1 parity. These are the **non-Active table-stakes gaps** that should be added to v1 to clear the "polished CWS extension" bar.

- [ ] First-run welcome tab on `onInstalled` reason==='install' — without it the cold-launch UX is hostile.
- [ ] Pin-to-toolbar nudge on the welcome page — recoups the "where did the icon go?" churn.
- [ ] `chrome.commands` `_execute_action` shortcut to open the tab — one-line manifest change, power-user win.
- [ ] Auto-snapshot before Reset all / YAML import — safety net for destructive ops that the existing confirm dialog can't catch (misclicks).
- [ ] Storage-write helper with quota check + `lastError` handling — prevents silent data loss as sessions accumulate.
- [ ] Session-delete confirm + soft-delete window — multiple named sessions need it.
- [ ] Privacy policy URL + permissions-justification text — blocks the Active "Published listing" item.
- [ ] Skip-to-content link + landmark roles + `prefers-reduced-motion` respect — completes the WCAG AA story implicit in the Active accessibility item.
- [ ] Focus trap + focus restore on modals via a vetted primitive — completes the Esc-to-close item already in Active.
- [ ] Visible app version + link to bundled `CHANGELOG.md` — minimal, builds trust.
- [ ] Update-detected dismissible banner on next open after minor+ version bumps — paired with the changelog link.

### Add After Validation (v1.x)

Trigger: extension shipped, has > ~100 installs, real qualitative feedback in hand.

- [ ] Session templates — add once we see users re-creating the same filter/section setup repeatedly.
- [ ] Auto-save indicator with last-saved timestamp — low-cost trust signal; add when first "did it save?" support request lands.
- [ ] Per-question tagging filter — add when search query analysis shows users typing the same tag-like terms frequently.
- [ ] Empty-state copy across all surfaces — incremental polish pass once we know which surfaces users actually land on.
- [ ] Inline help popovers on weighting/override controls — add when feedback shows interviewers misunderstanding difficulty coefficients.
- [ ] Toolbar action badge for active session initial — small delight; bundle with other badge polish.

### Future Consideration (v2+)

Trigger: clear product-market fit signal (e.g. > 1000 weekly active users, repeat usage, requests for these specifically).

- [ ] Side-by-side session comparison — defer because it doubles the rendering complexity of the scoring engine. Worth it only when we know multiple-session workflows are common.
- [ ] PDF export of results — defer behind `window.print()` against a dedicated print route. Add downloadable PDF only if real users complain that print isn't enough.
- [ ] Cmd/Ctrl+K quick-switcher — defer until session count per user is high enough to warrant a palette. With 2 sessions, a dropdown wins.
- [ ] `chrome.i18n` wiring for chrome strings (no locale data yet) — defer; only do it if we ever plan to localize, otherwise it's dead code.
- [ ] Density toggle (compact mode) — defer until users actually complain about whitespace.

## Feature Prioritization Matrix

Only the **gap** items (not already in Active) are listed. Sorted within each priority band.

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Privacy policy URL + permissions justification | HIGH (blocks publish) | LOW | P1 |
| First-run welcome tab on install | HIGH | LOW | P1 |
| Auto-snapshot before destructive actions | HIGH (data-loss prevention) | LOW-MEDIUM | P1 |
| Storage-write helper with quota check | HIGH (data-loss prevention) | LOW-MEDIUM | P1 |
| Session-delete confirm + soft-delete | HIGH (data-loss prevention) | LOW | P1 |
| Skip-to-content + landmark roles + reduced-motion | HIGH (WCAG completeness) | LOW | P1 |
| Focus trap on modals via vetted primitive | HIGH (a11y) | LOW-MEDIUM | P1 |
| `chrome.commands` `_execute_action` shortcut | MEDIUM | LOW | P1 |
| Visible app version + changelog link | MEDIUM | LOW | P1 |
| Pin-to-toolbar nudge on welcome page | MEDIUM | LOW | P1 |
| Update-detected dismissible banner | MEDIUM | LOW | P1 |
| Session templates | HIGH | MEDIUM | P2 |
| Auto-save indicator | MEDIUM | LOW | P2 |
| Per-question tagging filter | MEDIUM | LOW-MEDIUM | P2 |
| Empty-state copy across surfaces | MEDIUM | LOW | P2 |
| Inline help popovers on weighting controls | MEDIUM | LOW | P2 |
| Toolbar action badge for active session | LOW-MEDIUM | LOW | P2 |
| In-extension changelog viewer (rich) | LOW-MEDIUM | LOW | P2 |
| Side-by-side session comparison | HIGH | MEDIUM-HIGH | P3 |
| PDF export (downloadable, not just print) | MEDIUM | MEDIUM | P3 |
| Cmd/Ctrl+K quick-switcher | MEDIUM | MEDIUM | P3 |
| `chrome.i18n` wiring (infrastructure only) | LOW (v1) | LOW-MEDIUM | P3 |
| Density toggle (compact mode) | LOW-MEDIUM | LOW | P3 |

**Priority key:**
- P1: Add to v1 alongside the Active list. Skipping these makes v1 feel unfinished or blocks Web Store publication.
- P2: Add immediately after v1 ships, once real usage validates direction.
- P3: Defer until a clear signal demands them.

## Competitor / Reference Feature Analysis

The reference set is a mix of (a) other Chrome extensions in adjacent productivity niches and (b) the commercial interview-tooling space the user's listing will be compared against in search results.

| Feature | Commercial interview tools (Metaview, VidCruiter, Sapia, TestGorilla) | Generic Chrome productivity extensions (Notion Web Clipper, Todoist, Toby, Raindrop) | Our approach |
|---------|------------------------------------------------------------------------|--------------------------------------------------------------------------------------|--------------|
| First-run onboarding | Account creation + workspace setup (multi-step). | Welcome tab + pin nudge + ~3 onboarding screens; auth optional. | Single welcome tab, no account, points at the two audience flows. |
| Persistence model | Cloud database, multi-user. | Cloud sync + offline cache. | `chrome.storage.local` only; YAML for portability. Deliberately divergent. |
| Scoring rubric | Configurable per-role, AI-assisted, evidence-linked. | N/A. | Built-in tech-stack bank + custom questions per topic; manual scoring; no AI scoring (only AI-prompt export). Deliberately divergent — keeps the tool offline and trust-neutral. |
| Theming | Light/dark, often workspace-branded. | Light/dark/system. | Light/dark/system. Match the bar. |
| Telemetry | Heavy product analytics (Mixpanel/Amplitude/Segment). | Most ship some telemetry; privacy-focused extensions ship none and advertise it. | None. Advertise it on the listing as a trust differentiator vs commercial tools. |
| Export formats | CSV, PDF, ATS integrations. | JSON, Markdown, vendor formats. | YAML (structural + legacy progress-only). PDF deferred to P3. |
| Collaboration | Real-time multi-interviewer. | Multi-user shared workspaces. | Single-user. Deliberately divergent — the differentiator is "no account needed, runs entirely local." |
| Keyboard shortcuts | Variable, often vendor-specific. | Universal `Cmd+K` palettes, configurable. | `/`, `\`, `Esc` in-app + `_execute_action` to open. Cmd+K palette deferred. |
| i18n | Multi-language standard. | Often i18n via `chrome.i18n`. | English-only v1; infrastructure wired in v2+. |
| Onboarding to value | 5–15 minutes (account, workspace, rubric setup). | < 60 seconds. | Target < 60 seconds — welcome tab → click "start session" → score. |

**Key positioning takeaway:** Our v1 differentiates against commercial tools on *zero-friction* (no account, no cloud, no analytics) and against generic Chrome extensions on *domain specificity* (a real scoring engine + 1000-question bank). The table-stakes gap list above is what makes those differentiators feel intentional rather than minimal.

## Sources

- [Chrome for Developers — chrome.runtime.onInstalled / Extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle) — HIGH (official platform docs)
- [Chrome for Developers — Options page (`chrome.runtime.openOptionsPage`, `options_ui`)](https://developer.chrome.com/docs/extensions/develop/ui/options-page) — HIGH (official)
- [Chrome for Developers — chrome.commands API](https://developer.chrome.com/docs/extensions/reference/api/commands) — HIGH (official)
- [Chrome for Developers — chrome.i18n](https://developer.chrome.com/docs/extensions/reference/api/i18n) — HIGH (official)
- [Chrome for Developers — Updated Privacy Policy & Secure Handling Requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) — HIGH (official CWS policy)
- [Chrome for Developers — Auto Dark Theme blog](https://developer.chrome.com/blog/auto-dark-theme) — HIGH
- [MDN — `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) — HIGH
- [ExtensionBooster — 15 Best Practices to Build a Browser Extension Users Love (2026 Guide)](https://extensionbooster.com/blog/best-practices-build-browser-extension/) — MEDIUM (industry guide, 2026-dated, opinionated)
- [GroovyWeb — How to Build a Chrome Extension in 2026: AI-First Guide (Manifest V3)](https://www.groovyweb.co/blog/chrome-extension-development-guide-2026) — MEDIUM
- [DEV Community — Building Chrome Extensions in 2026: A Practical Guide with Manifest V3](https://dev.to/ryu0705/building-chrome-extensions-in-2026-a-practical-guide-with-manifest-v3-12h2) — MEDIUM
- [Best Chrome Extensions — Extension Update Strategies](https://bestchromeextensions.com/docs/tutorials/extension-update-strategies/) — MEDIUM
- [ExtensionFast — Chrome Extension Privacy Policy: Requirements, Template, and Examples for 2026](https://www.extensionfast.com/blog/chrome-extension-privacy-policy-requirements-template-and-examples-for-2026) — MEDIUM
- [PrivacyPolicies.com — Chrome Extensions Requirements for Privacy Policy and Secure Handling](https://www.privacypolicies.com/blog/chrome-extensions-requirements-privacy-policy-secure-handling/) — MEDIUM
- [LegalForge — Privacy Policy for Chrome Extensions: What Google Requires (2026)](https://www.legalforge.app/blog/privacy-policy-for-chrome-extension) — MEDIUM
- [Reintech — Internationalizing Your Chrome Extension for a Global Audience](https://reintech.io/blog/internationalizing-chrome-extension-global-audience) — MEDIUM
- [w3tutorials — How to Export Chrome Extension Local Storage Data to a File](https://www.w3tutorials.net/blog/chrome-extension-local-storage-how-to-export/) — LOW-MEDIUM (tutorial)
- [BrowserStack — Must-Have Chrome Extensions for Accessibility Testing](https://www.browserstack.com/guide/accessibility-extension-chrome) — MEDIUM
- [BrowserStack — Must-have Chrome Extensions for WCAG Testing](https://www.browserstack.com/guide/wcag-chrome-extension) — MEDIUM
- [Insight7 — Top 8 Candidate Evaluation Tools for Smarter Hiring (2026)](https://insight7.io/candidate-evaluation-tools/) — MEDIUM (competitor landscape)
- [Sapia.ai — AI candidate assessment software: 10 best platforms (2026)](https://sapia.ai/resources/blog/ai-candidate-assessment-software/) — MEDIUM (competitor landscape, vendor blog)
- [iMocha — 8 Best Interview Assessment Tools for 2026](https://www.imocha.io/blog/interview-assessment-tools) — MEDIUM (competitor landscape)
- [Mokka AI — 10 Best AI Interview Tools for Hiring Teams in 2026](https://www.gomokka.com/resources/10-best-ai-interview-tools-for-hiring-teams-in-2026.html) — MEDIUM (competitor landscape)
- [BrowserNative — Chrome Extensions Update Notifier](https://browsernative.com/chrome-extensions-update-notifier/) — LOW-MEDIUM
- [Chrome for Developers — chrome.notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications) — HIGH

---
*Feature research for: Chrome MV3 full-tab interview-scoring & interview-prep extension (greenfield rebuild of `stack-checklist.html`)*
*Researched: 2026-06-16*
