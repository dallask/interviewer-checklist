# Pitfalls Research

**Domain:** Chrome MV3 extension (React 19 + Vite 8 + CRXJS 2.6 + TypeScript 6 + Zustand 5 + valibot + yaml + Tailwind v4), full-page tab surface, `chrome.storage.local` persistence, Chrome Web Store public listing.
**Researched:** 2026-06-16
**Confidence:** HIGH on store-review and MV3 mechanics (Chrome docs are stable, rejection patterns are well-documented in 2026); HIGH on CRXJS-specific issues (verified against open GitHub issues #860, #897); MEDIUM on the exact behavior of edge cases like valibot migration failures under partial schemas and Zustand persist write-during-unload guarantees (theoretical reasoning from primary docs, not all empirically tested in this exact combination).

This file enumerates every concrete failure mode that this stack and surface tend to hit, with severity, reversibility, warning signs, prevention, and phase-mapping. Every pitfall is specific to *this* stack and *this* product — no generic "test more" advice.

---

## Critical Pitfalls

### Pitfall 1: Chrome Web Store reviewer cannot tell what the extension does → `Blue Argon` / Spam policy rejection

**Severity:** HIGH · **Reversibility:** CHEAP (revise listing, resubmit; adds 2–7 days)

**What goes wrong:**
The reviewer opens the unpacked extension, sees a generic "Hello" or a screen that requires data input before it does anything visible, and rejects with a "Blue Argon" / Spam-and-Placement / Quality code. With our product the trap is the empty-state: a brand-new install shows a checklist but no candidate, no marks, no obvious value. Reviewers spend ~60 seconds per extension; if they cannot validate the stated functionality in that window the listing is rejected.

**Why it happens:**
We are building a tool whose value is unlocked only after a user enters a candidate and scores questions. On a fresh install the screen looks like an unfilled form. Add to this that the store listing description, screenshots, and the extension's first-paint must all corroborate the same single purpose — any mismatch reads as spam.

**How to avoid:**
- Ship a small seeded demo session on first install (`chrome.runtime.onInstalled` with `reason === "install"` writes a `session:demo` with a few sample scores so the empty-state isn't empty). Mark it clearly as a sample.
- Listing description sentence 1 must literally match what the screenshots show. "Weighted tech-stack interview scoring checklist for SWE candidates — score questions 0–10, get live overall and per-section marks, export YAML."
- At least 3 screenshots (1280×800 or 640×400) showing: (a) the populated checklist mid-scoring with marks visible, (b) the AI prompt modal, (c) the YAML export. NOT the empty state.
- Single-purpose: phrase it as "Interview scoring" — not "Interview scoring AND notes AND export AND dark mode". The features are all in service of the one purpose; describe them as features of that purpose, not as separate purposes.

**Warning signs:**
- First-paint of a fresh `chrome.runtime.id` install shows nothing actionable.
- Reviewer's submission feedback uses phrases like "we could not verify functionality" or "purpose unclear."
- Internal team-tests of fresh install end with someone asking "what do I do here?"

**Phase to address:** Requirements (define "first-install demo session"); Store-submission prep phase (screenshots + listing copy). Verify in a clean Chrome profile before submitting.

---

### Pitfall 2: Permissions declared in `manifest.json` that the code does not actually call → rejection with "Use of Permissions"

**Severity:** HIGH · **Reversibility:** CHEAP (remove permission, rebuild, resubmit)

**What goes wrong:**
A boilerplate or copy-pasted manifest carries `"tabs"`, `"activeTab"`, `"scripting"`, or `host_permissions: ["<all_urls>"]` that the actual app never uses. CWS review fails with a permission-justification violation; the install warning shown to users is also worse than necessary ("Read your browsing history" for `tabs`).

**Why it happens:**
CRXJS, WXT, and other MV3 starter kits ship a manifest with several permissions enabled "in case you need them." A `chrome.tabs.create({url})` for the extension's own URL works without the `tabs` permission, but a developer who saw `chrome.tabs.*` in their code adds it defensively. Devs also leave `host_permissions` in during dev to make HMR work, then forget to strip it for production.

**How to avoid:**
- Lock `manifest.json` to **`"permissions": ["storage"]`** and nothing else. No `host_permissions`, no `activeTab`, no `tabs`, no `scripting`, no `notifications`, no `clipboardWrite`. (The clipboard write in the AI prompt modal uses `navigator.clipboard.writeText` from a focused extension page — no permission needed.)
- Add a CI test that parses `dist/manifest.json` after build and fails if any unexpected key appears in `permissions` or `host_permissions`.
- In code review, treat every `manifest.json` diff as load-bearing — every line must be justified in the PR description.

**Warning signs:**
- Install dialog says anything beyond the bare extension name + icon (any "Read your..." or "Change your..." line is bad).
- CRXJS dev logs include warnings about web-accessible-resources being injected for HMR — fine in dev, must not survive to prod.
- `chrome://extensions` "details" page shows site access set to anything but "On click."

**Phase to address:** Foundation phase (manifest hand-authored and reviewed at the same level as schema migrations); Store-submission prep phase (final permission audit).

---

### Pitfall 3: Missing or generic privacy policy → "Privacy Policy" rejection

**Severity:** HIGH · **Reversibility:** CHEAP (publish policy, link in dashboard, resubmit)

**What goes wrong:**
Even though the extension processes no personal data and ships no analytics, the Chrome Web Store Developer Dashboard requires (a) certifying data usage, and (b) linking a hosted privacy policy URL. Missing or broken URL → rejection. A policy that contradicts the manifest ("we collect emails" with no networking code) → also rejection.

**Why it happens:**
The product is "fully local, no backend" — devs assume this means "no privacy policy needed." It doesn't: candidate name/email enter the `chrome.storage.local` blob (the candidate-details modal), which counts as "personally identifiable information" for store purposes, even though it never leaves the device.

**How to avoid:**
- Publish a one-page privacy policy at a stable HTTPS URL (GitHub Pages on the project repo is fine and free).
- Policy states explicitly: "All data is stored locally in `chrome.storage.local`. Nothing is transmitted off-device. Candidate details (name, email, role) are entered by the user and live only in the user's browser profile. YAML export is initiated by the user and writes a file to their disk; the extension does not upload it. There are no analytics, no telemetry, no third-party services."
- In the Developer Dashboard "Data usage" form, mark **only** "Personally identifiable information" (because of the candidate name/email field) and certify "I do not sell or transfer user data to third parties." Do not check anything else.
- Re-read the policy URL before each release; broken link = automatic rejection.

**Warning signs:**
- Anyone on the team says "we don't need a privacy policy, we don't have a server."
- The store-listing pre-flight check shows red on "Privacy practices" or "Privacy policy URL."

**Phase to address:** Store-submission prep phase. Add the URL to a release checklist.

---

### Pitfall 4: Service worker is given any in-memory state → silent state loss after ~30 s idle

**Severity:** HIGH · **Reversibility:** CHEAP-MEDIUM (refactor SW to be stateless; symptoms can be subtle so finding them is the cost)

**What goes wrong:**
A future change adds a feature like "remember the last opened session" or "show a badge with unsaved score count" and the developer puts a `let lastOpenedSessionId = ...` at the top of `background.ts`. The SW is killed by Chrome after ~30 s of inactivity; the next click re-spawns it, the global is `undefined`, and the badge/feature breaks intermittently and non-reproducibly.

**Why it happens:**
MV3 service workers are NOT background pages. Top-level globals do not persist across suspension. This is the single most common MV3 architecture bug because the SW *looks* like a JS file with module-level state — the developer expects it to act like one.

**How to avoid:**
- Architectural rule (and ESLint custom rule if cheap): nothing in `src/background/` may declare module-level mutable variables. Only `addEventListener` calls at top level, plus pure imports.
- Any state the SW *needs* between events comes from `chrome.storage.local` (or `chrome.storage.session` for ephemeral). Read inside the handler, write inside the handler.
- Keep `src/background/index.ts` ≤ 30 LOC — anything bigger is a red flag.
- ARCHITECTURE.md already specifies this; enforce it in code review.

**Warning signs:**
- A bug report says "the icon badge shows wrong number sometimes but is fine after I click the icon."
- A SW global appears in a PR. Reject in code review.
- `chrome://serviceworker-internals` shows the SW restarting frequently and a feature breaking when it does.

**Phase to address:** Foundation / scaffolding phase — the rule is established when the SW file is created and never relaxed.

---

### Pitfall 5: `chrome.storage.local` debounced write loses the last edit on tab close → silent data loss

**Severity:** HIGH · **Reversibility:** EXPENSIVE (data is already gone; users lose work and trust)

**What goes wrong:**
The debounced persist middleware (300 ms in ARCHITECTURE.md) holds the most recent write in memory. The user changes a score, immediately closes the tab, and the debounce timer never fires. Next open, the score is the old value. Same hazard for: closing the window, navigating away, the OS putting Chrome to sleep, an extension reload from `chrome://extensions`, a Chrome auto-update.

**Why it happens:**
Debouncing trades durability for throughput. `beforeunload` is the conventional flush point but in MV3 extension pages it can fire too late (after `chrome.storage` IPC has been torn down). `visibilitychange` to `hidden` is more reliable but still not synchronous-write semantics.

**How to avoid:**
- **Two-stage write:** keep the 300 ms debounce for the steady-state path, but additionally flush synchronously on `visibilitychange === "hidden"` and on `pagehide`. Do not rely on `beforeunload` alone.
- The flush must call `chrome.storage.local.set(...)` *without awaiting* — the browser will complete the IPC even though the JS event loop is being torn down. (This is the documented MV3 pattern.)
- The debounce window itself should be tunable. 300 ms is fine for typing in a notes textarea; for slider drags consider a `trailing-only` 150 ms with a hard cap at one write per second.
- Add a `dirty: boolean` flag on the store; `pagehide`/`hidden` only fires `set` if `dirty`.
- Unit-test the persist middleware by simulating: rapid changes followed by an `unmount` — assert that the most recent state hits the mock storage.

**Warning signs:**
- Any bug report containing "I scored a question then closed the tab and lost it" — even one report means many silent occurrences.
- Internal QA: open the tab, drag a slider, immediately close — reopen and check.
- Tests pass but only because they `await` the debounce in test setup; production has no such await.

**Phase to address:** Persistence-and-migrations phase. Tests are a release gate.

---

### Pitfall 6: Schema migration chain breaks on an old-format payload that no longer parses → user data loss on update

**Severity:** HIGH · **Reversibility:** EXPENSIVE (user's data is in storage but unreadable; recovery requires custom code per affected user)

**What goes wrong:**
We add v5→v6 migration. A user on v3 (haven't opened the extension in 6 months) updates. The v3→v4 migration assumes a field that v3 actually had; we tested v3→v4 once in dev a year ago and haven't run it against a real v3 fixture since. The migration silently throws, caught by a generic try/catch, and the user sees a default state — all their previous work is wiped from view (still in storage but unreachable).

**Why it happens:**
- Migrations are written once and never re-tested against real fixtures of the prior version.
- The migration chain assumes "each step is well-formed because the previous step produced it" — but a real v3 payload from a real user may have nulls, extra keys, or missing optional fields that the dev forgot existed.
- Valibot schema validation is added *after* the migration runs (correct order), but the migration doesn't itself validate its input before transforming.

**How to avoid:**
- **Pinned fixtures:** every migration `vN_to_vN1` ships with a `vN.fixture.json` captured from a real production payload (anonymized) and a unit test that runs the migration on the fixture and asserts the shape.
- **Validate at each step:** each migration validates its input with the `vN` valibot schema and its output with the `vN+1` schema. A schema mismatch is a loud failure in tests, not a silent fallback in prod.
- **Never delete a migration.** Once `v3` exists in the wild, the `v3→v4` migration must exist forever in the codebase. ARCHITECTURE.md asserts this; enforce in code review.
- **Migrations are pure and total.** Total means: defined for any input that satisfies the `vN` schema. Use exhaustiveness with a discriminated union for any sum types.
- **Fallback on failure: preserve, don't overwrite.** If migration throws, write the raw blob to `chrome.storage.local` under `recovery:<timestamp>` before swapping in default state. This gives a hand-recovery path. Tell the user via a banner.

**Warning signs:**
- A migration PR doesn't include a fixture.
- A migration uses `as any` or `// @ts-expect-error` to massage types — that's the migration silently lying about its preconditions.
- The codebase doesn't have a single test that runs the *full chain* end-to-end on the oldest supported fixture.

**Phase to address:** Persistence-and-migrations phase. The fixture pattern is established when migration #1 is written.

---

### Pitfall 7: CSP rejection — bundle ships `eval` / inline scripts → extension fails to load OR fails store review

**Severity:** HIGH · **Reversibility:** CHEAP if caught pre-submission (swap library, rebuild); EXPENSIVE if discovered post-submission (multi-day review delay)

**What goes wrong:**
A dependency (or worse, the React Compiler if enabled with default config, or Vite's source-map mode in dev sneaking into prod) emits an `eval("...")` or inline `<script>` block. MV3's default `content_security_policy.extension_pages = "script-src 'self'; object-src 'self'"` blocks both. The page loads white, the browser console shows CSP violations, and `chrome://extensions` flags the extension. If a developer "fixes" this by loosening the CSP to `"script-src 'self' 'unsafe-eval'"`, store review will flag it and reject or downgrade discoverability.

**Why it happens:**
- Production builds with `sourcemap: 'inline'` or `'eval'` accidentally enabled.
- A library that uses `new Function(...)` for templating (some older charting libs, some date pickers, some PDF/printing libs).
- React Compiler experimental flag — currently low risk but a future-enabled flag could regress.
- Tailwind v4's CSS output is fine (it's static), but a CSS-in-JS library swapped in later breaks this.

**How to avoid:**
- **Build-time check:** add a script that greps the production `dist/` for `eval(`, `new Function(`, `unsafe-eval`, and inline `<script>` content. Fail CI on any hit. Run this same script in a pre-submission release check.
- **Manual CSP in manifest** (no need to override the default — but if you do for any reason, hold the line at `"script-src 'self'; object-src 'self'"`):
  ```jsonc
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```
- **Library audit before adding any new dep:** grep its bundled source for `eval` and `new Function`. Particularly relevant for: chart libraries, template engines, expression evaluators.
- **Source-map mode in vite.config.ts:** `sourcemap: 'hidden'` for prod, *never* `'inline'` or `'eval'`. CRXJS forces this but verify after every Vite upgrade.

**Warning signs:**
- DevTools console in the extension tab shows `Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source` — anywhere, ever.
- The chrome://extensions "errors" badge appears.
- A PR adds `'unsafe-eval'` to the CSP — reject.

**Phase to address:** Foundation phase (the CI check is set up at scaffolding); ongoing in dependency-review.

---

### Pitfall 8: CRXJS issue #860 — production build still references the Vite dev server → user opens a broken tab

**Severity:** HIGH · **Reversibility:** CHEAP (rebuild correctly) once detected; EXPENSIVE if shipped to the store (1-version-rollback or a fast follow-up)

**What goes wrong:**
A developer runs `vite build` against a config that was modified for dev (e.g. `mode: 'development'` left in, or `define: { 'process.env.NODE_ENV': '"development"' }`) and ships a `.zip` to the store. The packaged extension tries to connect to `http://localhost:5173` on load, fails, and shows the user a stub error page. ([CRXJS issue #860](https://github.com/crxjs/chrome-extension-tools/issues/860).)

**Why it happens:**
- CRXJS's dev pipeline injects HMR client code and dev-server pings; if the build is not a clean `vite build` (production mode), they survive.
- Building from a workspace where `vite dev` had been running and partially overwrote the `dist/` directory.
- A `pnpm build` script that accidentally calls `vite` (default = dev) instead of `vite build`.

**How to avoid:**
- **CI builds the artifact**, not a developer machine. The release `.zip` comes from a GitHub Actions job that runs in a fresh checkout: `pnpm install --frozen-lockfile && pnpm exec vite build`.
- **Post-build smoke check:** grep `dist/` for `localhost`, `5173`, `vite-hmr`, `@vite/client`. Any hit fails CI.
- **Manual load check before submission:** unpack the built `.zip` in a fresh Chrome profile (`chrome://extensions` → "Load unpacked" → pick the unzipped `dist/`), click the action icon, verify the tab opens and renders without any DevTools console errors.
- **Lock the build script:** `"build": "vite build --mode production"` and never use `vite` (no subcommand) in `package.json`.

**Warning signs:**
- The smoke-load check shows a network request to `localhost` in DevTools Network panel.
- Any DevTools error like `GET http://localhost:5173/... net::ERR_CONNECTION_REFUSED`.
- The release `.zip` is bigger than expected (HMR client bundle adds ~30 KB).

**Phase to address:** Foundation phase (CI build) + Store-submission prep phase (smoke check is a release gate).

---

### Pitfall 9: Web Store OAuth refresh token rotation breaks automated release

**Severity:** MEDIUM · **Reversibility:** CHEAP (re-mint token, update secret) — but blocks releases until done

**What goes wrong:**
GitHub Actions release runs `chrome-webstore-upload-cli`, gets a 401, and fails. The team scrambles for hours figuring out it's the OAuth refresh token that expired. Worst case: a release is needed urgently (security fix) and the person with the GCP project ownership is on PTO.

**Why it happens:**
The 2026 OAuth posture for Google APIs treats long-lived OAuth tokens as unrotated == stale. Google's CIAM stack revokes refresh tokens that go unused for an extended window, and granular OAuth scopes (rolled out in 2024–2025) tightened the rules. Inactive tokens, tokens for accounts that lost 2FA, and tokens issued to a re-org'd GCP project will all stop working without warning.

**How to avoid:**
- **Bake token rotation into the release runbook:** quarterly calendar reminder to re-mint and update the GH Actions secret. ~5 minute task if done in time.
- **Use a dedicated GCP project** for store uploads, not someone's personal project. Project owner stays with the org.
- **Two owners on the GCP project** with the API enabled — bus-factor mitigation.
- **Monitor the release job:** the release pipeline emits a status notification on failure; do not let "the cron is fine" turn into "no one looked at it in 90 days."
- **Manual upload via the dashboard is the always-available fallback.** Document the steps; do not let knowledge live in one person's head.

**Warning signs:**
- The release log shows `401 unauthorized`, `invalid_grant`, or `Token has been expired or revoked`.
- A teammate says "we haven't released in a while" — that is the same as "we may have a dead token."

**Phase to address:** Release-automation phase (set up the rotation reminder when the pipeline is first wired); ongoing operational hygiene.

Sources: [chrome-webstore-upload issue #47 "Refresh token expires?"](https://github.com/fregante/chrome-webstore-upload/issues/47); [Google OAuth token lifetime best practices 2026](https://guptadeepak.com/ciam-compass/guides/token-lifetime-best-practices/).

---

### Pitfall 10: chrome.storage.local write rate-limit (~120/min) saturated by slider drag → silent failed writes

**Severity:** MEDIUM-HIGH · **Reversibility:** CHEAP (raise the debounce, batch writes) once identified

**What goes wrong:**
A user drags a 0–10 score slider fast across all 11 positions. Without debounce, that's 11 writes in ~500 ms. Multiply by a few sliders adjusted in a row, then by a "Reset" button that mutates every slice. The MV3 quota is **2 set/remove/clear per second** sustained (i.e. 120 per minute). Hitting this returns an error and `runtime.lastError` is set; if the storage adapter doesn't check it, the write *silently fails* and the in-memory store has data the disk doesn't.

**Why it happens:**
- The persist middleware uses a leading debounce, which fires immediately on each slider step.
- The "Reset" or "Switch session" path bypasses the debounce because the dev wanted "immediate" persistence.
- The adapter wraps `chrome.storage.local.set` in a Promise but does not check `chrome.runtime.lastError` on the callback path.

**How to avoid:**
- **Trailing debounce only**, with a minimum gap of ~300 ms; cap at one write per shard per ~500 ms.
- **Coalesce by shard:** if the user changes scores AND notes within the debounce window, write the session shard once with both changes, not twice.
- **Adapter always checks `chrome.runtime.lastError`** and rejects the promise. Surface failures to a toast/log rather than swallowing.
- **Test the quota:** a regression test simulates 200 slider changes in 30 s, asserts that storage is consistent with the final in-memory state. If it isn't, the debounce is wrong.
- The bank stays out of storage (architecture decision). Per-session shards keep writes tiny so even at the cap the throughput is enough.

**Warning signs:**
- DevTools console shows `Unchecked runtime.lastError: MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded`.
- User reports "I scored these and they didn't save."
- A regression test that simulates rapid input passes only when the debounce is removed (means the debounce is the only thing keeping it under the quota — investigate; it should not be the only safeguard).

**Phase to address:** Persistence-and-migrations phase. Quota tests are a release gate.

Sources: [chrome.storage docs — MAX_WRITE_OPERATIONS_PER_MINUTE](https://developer.chrome.com/docs/extensions/reference/api/storage); [GoogleChrome/developer.chrome.com issue #135 — missing quota docs](https://github.com/GoogleChrome/developer.chrome.com/issues/135).

---

### Pitfall 11: Session-switch races with pending debounced writes → cross-session data corruption

**Severity:** HIGH · **Reversibility:** EXPENSIVE (one user's session has another user's scores)

**What goes wrong:**
User is on session A. Edits a question score (queued in 300 ms debounce). Clicks the session switcher → switches to session B. The debounce timer fires *after* the active session changed, but the persist closure captured `activeSessionId === A` — or worse, captured the new state but the wrong session id. The result: session B has session A's last change, or session A is missing its last change.

**Why it happens:**
Debounced functions close over state at call time. Session switching changes `activeSessionId` synchronously, but the queued write doesn't see the change.

**How to avoid:**
- **The session-switch action calls `flushPending()` on the persister synchronously before changing `activeSessionId`.** ARCHITECTURE.md already specifies this — enforce it in code.
- **Persist shard key derived at write-time, not at debounce-schedule-time.** The debounce captures the *change* (`patch`), then resolves the *target key* at flush time from current state. This is the safer model even if `flushPending` is called.
- **Session ID stamped into the queued write.** When debouncing, store `{ sessionId, patch }`; at flush, only write if `sessionId === currentActiveSessionId`. Otherwise drop (or write to the *original* shard — depends on UX).
- **Unit test the race:** simulate `setScore → switchSession → wait > debounce` and assert correct shard contents.

**Warning signs:**
- A bug report says "I switched to candidate Jane's session and saw John's score."
- The persister closure references `state.activeSessionId` rather than capturing at write time.

**Phase to address:** Sessions feature phase.

---

### Pitfall 12: Legacy YAML import format ambiguity → ID collision overwrites user's current scores

**Severity:** HIGH · **Reversibility:** EXPENSIVE (overwrite is destructive; user lost their work)

**What goes wrong:**
A user imports a legacy progress-only YAML. ID derivation is `slugify(group) + slugify(topic) + hash(question)`. The question text has been slightly edited in the new bank (typo fix). The hash differs. The import silently skips the score (orphan) — user thinks the import worked but has lost values. Or worse: the import drops a structural-format YAML into the active session, replacing the current bank reference, and the user's *current* in-progress scores get reinterpreted against the imported structure → mass orphaning.

**Why it happens:**
- ID derivation is fragile — any whitespace, capitalization, or punctuation change in question text breaks the hash.
- Format detection (structural vs legacy progress-only) is a duck-typing check on `meta.exportVersion` presence; a malformed YAML can satisfy neither and still be parsed.
- Import is destructive by default (overwrites active session) when it should be confirm-on-conflict.

**How to avoid:**
- **Two-step import:**
  1. Parse + validate against both schemas → tagged union with explicit `kind`.
  2. Show a preview modal: "Import will modify N sessions, add M custom questions, restore X scores. Y questions could not be matched to current bank (will be discarded)." User confirms.
- **Slugify with normalization:** lowercase, trim, collapse whitespace, strip diacritics, drop punctuation. Test it on a corpus from the prototype.
- **Stable IDs preferred over derived IDs:** when exporting, emit a stable `id` per question; on import, prefer the stable id; only fall back to derivation if missing. This forward-compat path makes hash drift survivable.
- **Import target is a NEW session by default.** "Import into current session" is a deliberate non-default action with its own confirm.
- **Schema-validated parse errors are user-visible.** "Could not parse YAML at line N" with the valibot issues path.

**Warning signs:**
- Anyone writes `if (yaml.meta) { /* structural */ } else { /* legacy */ }` without an explicit `kind` discriminator.
- Import doesn't show a preview.
- "Orphaned scores" appear in a bug report.

**Phase to address:** YAML import/export phase.

---

### Pitfall 13: localStorage from the original HTML cannot be read by the extension (different origin)

**Severity:** MEDIUM (only impacts users of the prototype migrating to the extension; once migrated, never again) · **Reversibility:** EXPENSIVE if shipped wrong (user's prototype data is unrecoverable from the extension)

**What goes wrong:**
The prototype `stack-checklist.html` runs from `file://` or wherever the user opened it (a local web server, etc.). Its `localStorage` is scoped to that origin. The extension page runs at `chrome-extension://<id>/...` — a *completely different origin*. The extension can NEVER read the prototype's localStorage directly. Devs assume "localStorage is localStorage" and write a one-shot import that always returns null in production.

**Why it happens:**
Confusion between same-extension localStorage (which the extension CAN read but shouldn't use) and origin-scoped localStorage from arbitrary pages (which it cannot).

**How to avoid:**
- **Treat the prototype data as YAML-only import.** Ship a one-time prompt or onboarding card: "Already using the HTML version? Export your data from there as YAML, then import here."
- The "legacy localStorage import" in ARCHITECTURE.md (v4→v5 migration) is ONLY for data written by the extension's own page in an earlier schema version — NOT prototype data. Rename it in code to `legacyExtensionLocalStorage` to avoid confusion.
- Test the legacy-import code path against an actual prototype HTML export, not against a contrived `localStorage` fixture.

**Warning signs:**
- A user reports "I had data in the HTML version and the extension is empty."
- The codebase has a `legacyImport` function but no test that runs it on real prototype-exported YAML.

**Phase to address:** Requirements phase (decide migration UX); Storage phase (label the legacy path correctly).

---

## Moderate Pitfalls

### Pitfall 14: Tailwind v4 cascade-layer ordering breaks the print stylesheet

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
Tailwind v4 uses CSS cascade layers (`@layer base, components, utilities`). The print stylesheet (`@media print { ... }`) sits *outside* these layers and loses specificity wars against utility classes — `display: none` from `.hidden` outranks the print rule. Result: the sidebar that should be hidden in print stays visible; collapsed topics don't expand.

**How to avoid:**
- Print rules live inside a *higher* layer or use `!important`. The pattern ARCHITECTURE.md already has (`display: none !important` in `print.css`) is the right call — keep it.
- Use stable BEM-ish selectors (`.group-card`, `.topic-card`, `.no-print`) in addition to Tailwind utilities. Print stylesheet targets these stable hooks.
- Test print preview in Chrome *with the extension loaded*, not in a normal browser tab. CSP, font availability, and cascade behavior all match prod only when loaded as an extension.

**Warning signs:**
- `Ctrl+P` preview shows the sidebar.
- Collapsed groups remain collapsed in print.

**Phase to address:** Polish phase (print stylesheet implementation).

---

### Pitfall 15: Dark-mode FOUC + system-preference race

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
Extension page loads with default light theme (a flash of white), React mounts, store hydrates from `chrome.storage.local`, theme switches to dark. Worse: user has system-dark, no manual preference saved; the hydration sees `darkMode: undefined`, applies light, then a separate `useEffect` reads `matchMedia('(prefers-color-scheme: dark)')` and flips → double-flash.

**How to avoid:**
- **Theme is decided before React mounts.** In `app.html`'s `<head>`, a small inline-blocked script reads `chrome.storage.local` (or a synchronous-cached value) and sets `<html data-theme="dark">` before the first paint. BUT: extension CSP forbids inline `<script>`. So:
  - Alternative A: bootstrap the theme synchronously from `chrome.storage.session` (synchronous in MV3? No, still async). Use a tiny external `theme-boot.js` that runs synchronously at the top of `<head>`.
  - Alternative B: ship `app.html` with `data-theme="auto"` and CSS rules that pick the theme from `prefers-color-scheme` BY DEFAULT. The manual override applies after React hydrates. This avoids FOUC for users who haven't set an override.
- The user override, once set, is persisted; on next load the `theme-boot.js` reads it from a tiny `chrome.storage.local` key (or a `<meta>` written into the static HTML at build time… no, that's per-user).
- **Pick alternative B** as the primary; FOUC only on the post-override case which is one-time.

**Warning signs:**
- A noticeable white flash on page load when dark mode is the user's preference.
- Two distinct visual states during boot.

**Phase to address:** Polish phase.

---

### Pitfall 16: React 19 StrictMode double-fires the bootstrap/migration

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
`bootstrap()` runs on app mount. In dev with StrictMode, the mount→unmount→mount cycle runs bootstrap twice. If bootstrap is not idempotent — e.g. it deletes the legacy localStorage key after import — the second run sees the legacy key already gone and treats this as "no legacy data," potentially overwriting something. Or the migration writes a "post-migration version" twice, hitting the rate limit unnecessarily.

**How to avoid:**
- **Bootstrap before `createRoot`**, not inside a component. The ARCHITECTURE.md already does this — keep the pattern. `bootstrap().then(() => createRoot().render(...))` runs once regardless of StrictMode.
- All migration steps are idempotent by construction: reading the legacy key is `read-once-then-delete-only-if-present`; the post-migration write is "write if version differs."
- Effects that touch storage are wrapped in an "already-done?" guard or use the `useEffectEvent` pattern.

**Warning signs:**
- DevTools console shows two "Hydrated from storage" logs.
- Migration log says it ran twice for the same version transition.

**Phase to address:** Storage / bootstrap phase.

---

### Pitfall 17: React Compiler enabled later → silent semantic changes

**Severity:** MEDIUM · **Reversibility:** CHEAP (turn it off) but caught only by careful regression testing

**What goes wrong:**
A future PR enables `babel-plugin-react-compiler`. Components that mutate refs during render, or read mutable globals during render, or have effects whose dependencies were silently wrong, now memoize incorrectly. Behavior changes are subtle: a score that should re-derive doesn't, or vice versa.

**How to avoid:**
- **Keep the React Compiler off in v1** (STACK.md already defers it).
- When enabling later, do it behind a feature-flag build that runs the full test suite *and* a manual smoke test session.
- Audit the codebase first for: refs mutated in render, `useState` used as a poor man's cache, Zustand selectors that return new object identities on every call.

**Warning signs:**
- A PR adds `babel-plugin-react-compiler`. Run a full smoke suite, not just unit tests.
- Score doesn't update when expected, or updates when not expected, after the compiler turns on.

**Phase to address:** Future phase (post-v1); document as a deferred decision.

---

### Pitfall 18: Clipboard write fails because the document isn't focused

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
User opens the AI prompt modal, clicks "Copy." The click triggers `navigator.clipboard.writeText(...)`. If the modal flow opens a confirm/alert first, OR if DevTools is the active window, the document loses focus, and the API throws `DOMException: Document is not focused`. The user sees nothing copied and no error.

**How to avoid:**
- The "Copy" button invokes the write *directly inside the click handler*, with no intermediate `await` (await-then-call loses the user-activation signal in some browsers).
- Catch the exception and fall back to the manual-select strategy: select the textarea content programmatically, show a tooltip "press Ctrl+C." ARCHITECTURE.md already specifies the textarea is pre-selected on modal open — keep it.
- No `alert()` / `confirm()` in the copy path. Use in-DOM toasts.
- Test in Chrome with DevTools open and DevTools as the active window.

**Warning signs:**
- A DevTools error `Document is not focused`.
- Users say "the copy button doesn't work."

**Phase to address:** AI prompt feature phase.

Source: [MDN clipboard API + focus requirement](https://developer.mozilla.org/Add-ons/WebExtensions/Interact_with_the_clipboard).

---

### Pitfall 19: HMR works in popup/options but not for full-page tabs that are also `web_accessible_resources`

**Severity:** MEDIUM · **Reversibility:** CHEAP (dev-only)

**What goes wrong:**
CRXJS HMR is documented to work for HTML entries. Our `app.html` is opened by `chrome.tabs.create`. If at some point we link to `app.html` as a `web_accessible_resource` (we shouldn't — see ARCHITECTURE.md — but a future feature might), HMR breaks for that resource (CRXJS issue #897).

**How to avoid:**
- **`web_accessible_resources` stays empty** in our manifest. ARCHITECTURE.md asserts this; enforce.
- If HMR breaks anyway, the dev-loop fallback is "save → reload extension from chrome://extensions → re-open tab." Painful but unblocking.

**Warning signs:**
- HMR worked yesterday, doesn't today. Check if a PR added `web_accessible_resources`.
- DevTools console in dev says "HMR connected" but updates don't apply.

**Phase to address:** Foundation phase (lock manifest); dev-experience issue only.

Source: [CRXJS issue #897](https://github.com/crxjs/chrome-extension-tools/issues/897).

---

### Pitfall 20: Hashed asset filenames in Vite output → manifest references break

**Severity:** MEDIUM · **Reversibility:** CHEAP (CRXJS handles this, but verify)

**What goes wrong:**
Vite's prod build emits assets with content-hashed names (`assets/main-DAB12.js`). If our `manifest.json` is hand-authored and references `src/background/index.ts`, the bundle reference must be rewritten to the hashed output. CRXJS does this automatically — but a hand-edit of the manifest can bypass it.

**How to avoid:**
- **Source manifest references the source paths** (`src/background/index.ts`); CRXJS rewrites at build time.
- After build, verify `dist/manifest.json` references real files inside `dist/`. CI greps for each path string.
- Do not hand-edit `dist/manifest.json`.

**Warning signs:**
- Extension load fails with "Could not load JavaScript 'background.js'."
- `dist/manifest.json` references files that aren't in `dist/`.

**Phase to address:** Foundation phase (CI check).

---

### Pitfall 21: Bundle bloats past 1 MB → store warnings and slow first paint

**Severity:** MEDIUM · **Reversibility:** CHEAP-MEDIUM (tree-shake, code-split)

**What goes wrong:**
The question bank (~1000 questions × ~500 bytes each ≈ 500 KB) plus React + Zustand + valibot + yaml + Tailwind builds to ~700 KB initial bundle. A heavy lib (e.g. Lodash full instead of `lodash-es`, or `moment` instead of `date-fns`) puts it past 1 MB. Store doesn't reject but the listing shows a "large extension" hint, and first-paint on cold-load slows perceptibly.

**How to avoid:**
- **Bank loaded lazily via `fetch(chrome.runtime.getURL('bank.json'))`** if it exceeds ~200 KB gzipped. STACK.md flags this — make the call empirically after the bank is finalized.
- `pnpm dlx vite-bundle-visualizer` after each significant dep change.
- Forbid: moment, full lodash, axios (fetch is enough), heavy date pickers. Use: date-fns, `lodash-es` with named imports.
- Tree-shaking requires `"sideEffects": false` on deps. Check this for any new dep.

**Warning signs:**
- `dist/` is bigger than 1.5 MB unzipped.
- Bundle visualizer shows a single dep taking >100 KB.

**Phase to address:** Polish phase or whenever a dep is added.

---

### Pitfall 22: Accessibility regression — focus management in modals

**Severity:** MEDIUM-HIGH (legal/UX exposure) · **Reversibility:** CHEAP

**What goes wrong:**
The prototype's modals are hand-rolled, with somewhat working focus traps. The React rebuild uses a custom modal component (per ARCHITECTURE.md `ModalRoot`). The rebuild forgets: (1) focus the first focusable element on open, (2) trap focus inside the modal (Tab cycles within), (3) return focus to the trigger on close, (4) `Esc` closes the modal (ARCHITECTURE.md spec), (5) ARIA: `role="dialog"`, `aria-modal="true"`, labelled-by referencing the modal title.

**How to avoid:**
- **Use `<dialog>` element** (HTMLDialogElement) — modern, gives focus trap + Esc-to-close + backdrop for free. Chrome supports it.
- OR use a vetted library — `react-aria-components` Dialog, or Radix UI Dialog.
- Write a single test per modal: open → tab cycles → Esc closes → focus returns to trigger.

**Warning signs:**
- Keyboard-only test: opening a modal, pressing Tab repeatedly, focus leaves the modal.
- `axe-core` / `@axe-core/react` reports modal-role violations.

**Phase to address:** Modal-component phase; verified in polish phase.

---

### Pitfall 23: Keyboard shortcuts collide with form-input typing

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
The spec requires `/` to focus search, `\` to toggle sidebar, `Esc` to clear search / close modal. A naive global keydown listener fires `/` while the user is typing a slash in a notes textarea — focus jumps away mid-word.

**How to avoid:**
- Global shortcut handler ignores events whose `event.target` is `<input>`, `<textarea>`, `<select>`, or `contenteditable`.
- `Esc` is the only shortcut that fires inside form elements (and only for "close modal," not "clear search").
- Test: type `/` in the notes textarea, assert focus stays.

**Warning signs:**
- User reports "I can't type a slash in my notes."

**Phase to address:** Polish phase (keyboard shortcuts).

---

### Pitfall 24: Dark-mode color contrast fails WCAG on mark bands

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
The prototype's mark-band gradient (red→yellow→green) was tuned for light mode. Naive dark-mode palette flips: pale-yellow on dark-gray = 2.5:1 contrast (WCAG AA needs 4.5:1 for text, 3:1 for UI).

**How to avoid:**
- Define dark-mode mark-band colors *separately* in `tokens.css`, not by transforming light-mode values.
- Verify with a contrast checker (`@axe-core/react` flags this; or manually with the Chrome DevTools color picker → contrast ratio).
- Specifically test text-on-band (mark value displayed on the colored chip) and band-on-background.

**Warning signs:**
- Dark mode "looks weird" but no one can articulate why.
- axe-core a11y test fails on contrast.

**Phase to address:** Polish phase (dark mode).

---

### Pitfall 25: Custom-question deletion races with note-write debounce

**Severity:** MEDIUM · **Reversibility:** CHEAP

**What goes wrong:**
User types a note on a custom question, then deletes the custom question. The debounced note write fires after deletion, writing a note for a question that doesn't exist (`questionComment[id] = "..."` orphan). Storage bloats, future reads see orphans.

**How to avoid:**
- Delete action flushes pending writes, then runs.
- OR: persist middleware filters orphans on serialize.
- Add a periodic "garbage collect orphan note ids" pass.

**Warning signs:**
- `questionComment` map has more keys than the active sections have question ids.
- Storage size grows monotonically.

**Phase to address:** Notes / custom-questions feature phase.

---

## Minor Pitfalls

### Pitfall 26: Manifest version not bumped before upload → store API rejects upload

**Severity:** LOW · **Reversibility:** CHEAP

`chrome-webstore-upload-cli` requires the `version` in `manifest.json` to be strictly greater than the version currently in the store. Forgetting to bump → API returns "version must be incremented." Fix: bump version; the release script should do this automatically via `release-please` or `npm version`.

### Pitfall 27: Icons missing or wrong size → install fails or store rejects

**Severity:** LOW · **Reversibility:** CHEAP

MV3 wants 16, 32, 48, 128 px PNG icons. The 128 px is the store-listing icon — it appears at large sizes on the listing page. A blurry or stretched 128 px tanks listing quality. Use a 128 px master and downscale; do not upscale.

### Pitfall 28: `key.pem` lost → published extension cannot be updated

**Severity:** HIGH · **Reversibility:** EXPENSIVE (must publish as a NEW extension with a new ID)

Chrome derives the extension ID from the public-key fingerprint. The `key.pem` is implicit in the published store version. If we sign a local dev unpacked build with a different key and then later try to package the published version with that key, the IDs mismatch. Worse: if the original `key.pem` from the *first* upload is lost, we can never publish an update under the same listing.

**Prevention:** the store retains its own key once we upload via the dashboard; for `chrome-webstore-upload-cli` releases we don't need a local key. Document explicitly: "We do not maintain a local `key.pem`. The store owns the key. Do not generate one." If we ever need one for testing, keep it in a password manager, never in the repo.

### Pitfall 29: `chrome.runtime.onInstalled` fires on every update, not just install

**Severity:** LOW · **Reversibility:** CHEAP

If onboarding/demo-session seeding fires on every update (not just first install), the user's data gets clobbered on every release. Always gate on `details.reason === 'install'`.

### Pitfall 30: Print stylesheet expands all topics but textareas show only one row

**Severity:** LOW · **Reversibility:** CHEAP

`<textarea>` print height defaults to its `rows` attribute, not its content. ARCHITECTURE.md's print.css sets `height: auto !important` — keep it. Test by writing a long note then `Ctrl+P`.

### Pitfall 31: Search input shows N results but pressing Enter does nothing

**Severity:** LOW · **Reversibility:** CHEAP

Users expect Enter to jump to the first result. Either implement it or visibly remove the affordance (no "press Enter" hint). Avoid the half-state.

### Pitfall 32: Session-id collision on YAML import

**Severity:** LOW · **Reversibility:** CHEAP

YAML import with the same session id as an existing slot silently overwrites. Detect collision; either suffix the new one (`-imported-2026-06-16`) or prompt.

### Pitfall 33: Reset-all confirm dismissed by Esc → ambiguous

**Severity:** LOW · **Reversibility:** CHEAP

Esc closes the modal — but does it mean "cancel" or "default action"? Convention: Esc = cancel. Test it.

### Pitfall 34: A11y — score slider has no accessible label

**Severity:** MEDIUM · **Reversibility:** CHEAP

`<input type="range">` needs `aria-label` or a `<label for>`. Hundreds of sliders, each needs the question text as label. Set `aria-label={question.text}`.

### Pitfall 35: Tooltips/popovers fall outside the print viewport on print

**Severity:** LOW · **Reversibility:** CHEAP

Mark stays on a card but the tooltip hangs off the side. `.no-print` on tooltips.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Stuff app state into the SW for "free caching" | "Faster" perceived response (it isn't really) | Non-deterministic bugs when SW suspends; very expensive to refactor out later | **Never** — architectural rule |
| Inline `<script>` in `app.html` to set theme before paint | Eliminates FOUC trivially | CSP violation; store rejection | **Never** — use external `theme-boot.js` |
| Loosen CSP to `'unsafe-eval'` to make a library work | Library works | Store review penalty; security exposure | Only if the library is irreplaceable AND you accept a slower review |
| `chrome.storage.local.set` directly from a component instead of via store | Easy debug | Test seams break; race conditions; quota exhaustion | **Never** outside of `src/storage/` |
| Skip the migration fixture for "trivial" migrations | -10 minutes today | Silent data loss for one user out of N hundreds, much later | **Never** — fixture is the migration's contract |
| Hand-author `dist/manifest.json` for "a quick fix" | Bypass the build | Next build wipes the fix; CI lies | **Never** — fix the source manifest or the build script |
| `// @ts-expect-error` in a migration | Compiles today | The migration is silently lying about its input shape | **Never** in migrations; rare elsewhere with a comment |
| Ship without screenshots that show the populated app | "We'll add them later" | First store review fails on Blue Argon | **Never** for the initial submission |
| Skip the privacy policy "because we don't collect data" | -1 hour | Rejection; -3 days | **Never** — write it once, takes 20 minutes |
| Use `localStorage` inside the extension page instead of `chrome.storage.local` | Slightly simpler API | No SW visibility (irrelevant here); migration on uninstall/reinstall is unreliable | **Never** — `chrome.storage.local` is the canonical store |
| Single `chrome.storage.local.set({state})` for the entire state on every change | Trivial | Hits quota; rewrites the bank repeatedly; slow | **Never** — sharded keys from day one |
| Skip the post-build smoke load before submission | -5 minutes | Ship a broken artifact (issue #860) | **Never** — release gate |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `chrome.action` | Set `default_popup` AND expect `chrome.action.onClicked` to fire | Omit `default_popup`; handle click in the SW. `onClicked` only fires when there's no popup. |
| `chrome.tabs.create` | Add `"tabs"` to permissions "to be safe" | Not needed for own-extension URLs. Drop it. |
| `chrome.storage.local` | Trust `set()` succeeded because it returned a Promise | Always check `chrome.runtime.lastError`; the Promise resolves even on quota errors in some Chrome versions. |
| `chrome.storage.local` | Use the callback form and forget to handle `lastError` | Use the Promise form (MV3) and catch rejections explicitly. |
| `chrome.storage.onChanged` | Use it as the source of truth | Use it only for cross-context sync (which v1 doesn't have). Within one tab, the store IS the truth; the listener would create echoes. |
| `chrome.runtime.onInstalled` | Fire onboarding every time | Gate on `details.reason === 'install'` (not `'update'` or `'chrome_update'`). |
| `chrome.runtime.getURL` | Build relative paths and concatenate | Use `chrome.runtime.getURL('app.html')` — works without any permission, returns the canonical absolute URL. |
| Chrome Web Store API (upload-cli) | Hard-code credentials | GitHub Actions secrets; rotate every quarter. |
| `navigator.clipboard.writeText` | Call after an `await` chain | Call synchronously in the user-gesture handler. Fallback to manual-select. |
| `URL.createObjectURL` (YAML export) | Forget `URL.revokeObjectURL` after download | Revoke in a `setTimeout(..., 60_000)` to avoid memory leak on repeated exports. |
| `<a download>` for export | Use an HTML `href` to `data:` URL | Use a Blob URL (`createObjectURL`) — `data:` URLs are CSP-restricted. |
| File input for YAML import | Accept any file → crash on binary | `accept=".yaml,.yml,application/yaml,text/yaml,text/x-yaml"` + size cap + parse-as-text wrapping. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Whole-tree re-render on each score change | Slider lags; CPU spikes; battery drain on laptops | `React.memo` on `QuestionRow`, `TopicCard`, `GroupCard`; subscribe to scope-narrow Zustand selectors via `useShallow` | ~200 question rows visible at once |
| Whole-tree re-render on each search keystroke | Same as above but on typing | Debounce `uiSlice.search` writes by 150 ms; memoize the `visibleTree` selector | Any non-trivial bank |
| Persist middleware writes everything on every change | Storage quota errors; slow reads on next boot | Sharded keys (`session:<id>`); per-shard dirty tracking; trailing debounce | ~50 changes/min sustained |
| Bank stored in Zustand and persisted | Every write rewrites ~500 KB; slow | Bank is build-time constant; state has only `bankOverride: Section[] \| null` | At first session save |
| `yaml.parse` on UI thread for huge imports | Tab freezes for seconds | Import runs in `requestIdleCallback` or a Web Worker; show a progress UI | Imports > 1 MB |
| Re-deriving `useTopicMark` on every store change | Excess CPU; OK but adds heat | `useStore(useShallow(selector))` and ensure selector returns same reference when unchanged | Score grid > ~500 questions visible |
| `chrome.storage.local.get(null)` to "fetch everything" | Slow boot if storage has accumulated orphans | Fetch only the keys you need (`manifest`, then `session:<active>`) | Long-time users with many sessions |
| Inline arrow handlers in `QuestionRow` | Re-mounts memoed children | `useCallback` per handler, or pass dispatch action ids and resolve at the leaf | Score grid > ~200 |
| Synchronously running `buildPrompt` on a large session | Modal-open delay | Already addressed — pure function, only runs on modal open; if it gets slow, defer to `useDeferredValue` | Sessions > ~2000 questions |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trust YAML input as plain text and `eval` it | Code execution in the extension origin | Use the `yaml` package only (no `eval`); validate with valibot before use |
| Render imported YAML strings as HTML | XSS in the extension origin (privileged context!) | React's default escaping handles this; never use `dangerouslySetInnerHTML` |
| Loosen CSP for any reason | Expanded attack surface; store penalty | Hold the default CSP. PR review treats CSP changes as load-bearing. |
| Add a content script "just to read the page title" | New attack surface; store review penalty | We never need content scripts for this product. Don't add them. |
| Treat candidate name/email as non-PII | Privacy policy mismatch; potential GDPR exposure if a user is in EU | Privacy policy explicitly enumerates these fields and confirms they never leave the device |
| Persist API keys or tokens | If we ever add an "AI service" feature, naive storage exposes the key | We have no AI service feature in v1; the AI prompt is text-only. If we ever add one, never store secrets in `chrome.storage.local` (it's plain disk). |
| Allow YAML import to specify `__proto__` or constructor | Prototype pollution | The `yaml` package handles this safely by default; never `Object.assign(target, parsed)` without filtering. Use a structured deserializer (valibot). |
| Open arbitrary URLs from imported YAML | Open redirect, phishing | The imported data has no "URL to open" field. If a feature adds one, scheme-allowlist (`https:` only) and confirm-on-click. |
| Trust `chrome.runtime.id` for branding | Spoofable if used wrongly | We don't use it for trust; only for self-URL construction. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty first-paint on fresh install | Reviewer rejects; users bounce | Seed a demo session on install |
| Destructive "Reset all" without typed confirm | User loses everything from a misclick | Confirm dialog with the candidate name typed to confirm (like GitHub repo deletion). Or at minimum a 2-step confirm. |
| Switching sessions silently abandons unsaved scoring | User confused which scores went where | `flushPending()` before switch; visible "Saving..." spinner if save in progress |
| Session switcher buried inside a Settings modal | Power-users (interviewers running back-to-back interviews) can't switch fast | Prominent session-name display in the toolbar; click to open switcher |
| YAML export downloads with cryptic filename | User has 30 `interview.yaml` files | Default filename: `interview-{candidate.name}-{date}.yaml`, sanitized. |
| Print preview includes the sidebar | Wasted ink; ugly output | `print.css` hides sidebar; verified on real Chrome print preview |
| Topic-override input accepts negative or > 10 values | User enters 100 thinking percentage | Input `min=0 max=10 step=0.1`; clamp at the store layer too |
| Dark-mode toggle doesn't show what mode is currently active | User toggles repeatedly | Toggle uses `aria-pressed`; icon shows current state (sun = light active, moon = dark active) |
| AI prompt textarea is small | User can't see the prompt to verify | At least 60% of viewport height; resizable |
| Custom-question deletion has no undo | Accidental click destroys work | Soft-delete with 5-second toast "Undo" |
| Score sliders all look the same when many are at 0 | "Have I scored this yet?" | Visual distinction: unset (gray) vs. set to 0 (red) |

---

## "Looks Done But Isn't" Checklist

- [ ] **First-install experience:** Fresh Chrome profile install shows a populated demo session within 1 second of clicking the action icon — not an empty form.
- [ ] **Privacy policy URL is reachable** at submission time (not 404, not redirect, not stale).
- [ ] **Manifest permissions are exactly `["storage"]`** — verify in the built `dist/manifest.json`, not just the source.
- [ ] **Production build smoke-tested in a fresh Chrome profile** — load unpacked, click icon, no DevTools console errors, no requests to `localhost`.
- [ ] **Migration chain end-to-end tested** against the oldest in-the-wild fixture (legacy prototype YAML import + each storage schema version).
- [ ] **Quota-test the persist middleware** — simulate 200 rapid score changes; final storage state matches final in-memory state.
- [ ] **`pagehide`/`hidden` flush** — open extension, edit, close immediately, reopen → edit is present.
- [ ] **Session switch flushes pending writes** — edit session A, switch to B without pause, switch back → A's edit is there, B is unaffected.
- [ ] **YAML round-trip:** prototype export → extension import → extension export → diff → only known intentional differences.
- [ ] **Legacy YAML formats parse** — at least one fixture per historical format.
- [ ] **Modals: focus trap, return-focus on close, Esc closes, ARIA roles** — keyboard-only test on each modal.
- [ ] **Keyboard shortcuts ignored inside form inputs** — type `/` in a note textarea, focus stays.
- [ ] **`/`, `\`, `Esc` shortcuts** — each tested per spec.
- [ ] **Dark mode contrast** — mark bands pass WCAG AA contrast in both themes; axe-core clean.
- [ ] **Print preview** — sidebar/toolbar/modal-close hidden; topics expanded; textareas show full content; mark bands legible in grayscale.
- [ ] **Clipboard copy in AI prompt modal** — works with no preceding modal/alert, falls back to manual select if blocked.
- [ ] **Custom-question deletion** — note for the deleted question is also cleaned up.
- [ ] **Reset all** — confirm dialog required; defaults are restored; storage is consistent with in-memory state after.
- [ ] **Session-id collision on import** — handled, not silent overwrite.
- [ ] **Bundle size** — measure unzipped `dist/`; under 1.5 MB target.
- [ ] **Listing screenshots** — show populated app, not empty state.
- [ ] **Listing description** — matches screenshots and matches what the user sees on first open.
- [ ] **Icon at 128 px** — sharp, not upscaled, matches the toolbar 16/32/48 icons in visual identity.
- [ ] **Release script bumps `version` and tags git** — manual `version` bump is a footgun.
- [ ] **GH Actions release dry-run** — fresh OAuth token validated end-to-end before the first real release.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Permission justification rejection (Pitfall 2) | LOW | Drop the permission, rebuild, resubmit. Add notes on changes in the resubmission. |
| Privacy policy rejection (Pitfall 3) | LOW | Publish policy, paste URL into Developer Dashboard, resubmit. |
| Blue Argon / single-purpose rejection (Pitfall 1) | LOW-MEDIUM | New screenshots showing populated state; tighten listing description to one sentence; add a 30-second demo video; resubmit. |
| Schema migration data loss (Pitfall 6) | HIGH | If we shipped the bug: rollback the extension version via the dashboard ASAP. For users whose data was wiped: the migration ideally wrote `recovery:<ts>` (Pitfall 6 prevention). If not, recovery is one-off per user. Communicate via store listing "known issue" note. |
| Service-worker state-loss bug (Pitfall 4) | LOW | Refactor SW to be stateless; ship fast patch. State was never durable, so users haven't lost durable data. |
| Debounced write loss (Pitfall 5) | HIGH (for affected users) | Already-lost data is gone. Add `pagehide`/`hidden` flush. Issue a "we've improved save reliability" release note. |
| CSP/CRXJS dev artifacts in prod (Pitfall 7, 8) | MEDIUM | Rollback the extension version; rebuild correctly from CI; resubmit. If users installed the broken version, the next auto-update fixes them. |
| OAuth token expired blocking release (Pitfall 9) | LOW | Re-mint token via [PlasmoHQ/gcp-refresh-token](https://github.com/PlasmoHQ/gcp-refresh-token); update GH secret; re-run release job. ~30 minutes. |
| Quota saturated → silent failed writes (Pitfall 10) | LOW-MEDIUM | Raise debounce window; in-memory store has the correct state on the affected tab — closing/reopening loses unsynced data for those users only. |
| Session-switch race corruption (Pitfall 11) | HIGH (data is in the wrong slot) | Stop-the-line; if a user can describe the corrupt slot, manual recovery via DevTools `chrome.storage.local.get/set`. Fix the race; release patch. |
| YAML import overwrote scores (Pitfall 12) | HIGH | If the import-to-new-session default is in place, no overwrite. If not, the only recovery is "user has a prior YAML export" — which is why YAML export is a feature. |
| Lost `key.pem` (Pitfall 28) | EXPENSIVE — VERY HIGH | If the store has the key (uploaded once via dashboard), we're fine forever. If we're somehow signing locally, lose the key, and the store doesn't have it, we cannot update — must publish a new listing under a new ID and migrate users manually. Prevention is the whole game. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address each pitfall. Phase names are illustrative; pick from the roadmap.

| # | Pitfall | Prevention Phase | Verification |
|---|---------|------------------|--------------|
| 1 | Blue Argon / empty first-paint | Requirements + Store-prep | Manual test in fresh Chrome profile; screenshot review |
| 2 | Excess permissions | Foundation | CI check on `dist/manifest.json` |
| 3 | Missing privacy policy | Store-prep | Pre-submission checklist; URL reachability test |
| 4 | SW in-memory state | Foundation | ESLint custom rule + code review |
| 5 | Debounced write loss | Persistence | Unit test simulates close-during-debounce |
| 6 | Migration chain breaks | Persistence | Fixture per migration; full-chain test on oldest fixture |
| 7 | CSP violation | Foundation | CI greps for `eval`/`unsafe-eval`; load smoke test |
| 8 | CRXJS dev artifacts in prod | Foundation + Store-prep | CI greps `dist/` for `localhost`; manual smoke load |
| 9 | OAuth token expiry | Release-automation | Quarterly rotation reminder; documented runbook |
| 10 | Storage quota saturation | Persistence | Quota stress test |
| 11 | Session-switch race | Sessions feature | Unit test simulates switch-during-debounce |
| 12 | YAML import overwrites | YAML feature | Import preview UI; round-trip test |
| 13 | Prototype-localStorage assumption | Requirements + Storage | Test legacy import on real prototype YAML, not contrived fixture |
| 14 | Print CSS specificity | Polish | Print preview manual test on built extension |
| 15 | Dark-mode FOUC | Polish | Load time visual diff |
| 16 | StrictMode double-bootstrap | Storage | Bootstrap is idempotent; assert single run via log |
| 17 | React Compiler regressions | Future / deferred | Off by default in v1; full smoke when enabled |
| 18 | Clipboard focus error | AI prompt feature | Test with DevTools open as active window |
| 19 | HMR vs web_accessible_resources | Foundation | Manifest lock; dev-only issue |
| 20 | Hashed asset filenames | Foundation | Post-build verification |
| 21 | Bundle bloat | Polish | Bundle visualizer in CI; size budget |
| 22 | Modal focus/ARIA | Modal phase | Per-modal a11y test |
| 23 | Shortcut collisions | Polish | Type-into-input test |
| 24 | Dark-mode contrast | Polish | axe-core test + manual check |
| 25 | Custom-question deletion orphans | Custom questions phase | Orphan-scan test |
| 26 | Manifest version bump | Release-automation | Release script enforces |
| 27 | Icon sizes/quality | Store-prep | Design review |
| 28 | Lost `key.pem` | Release-automation | Explicit "we don't maintain local key" docs |
| 29 | onInstalled fires on update | Foundation | Reason-check test |
| 30 | Textarea print height | Polish | Print preview manual test |
| 31 | Search Enter has no behavior | Polish | UX review |
| 32 | Session-id collision | Sessions feature | Import-collision test |
| 33 | Esc on reset confirm | Polish | UX review |
| 34 | Slider missing aria-label | A11y phase | axe-core scan |
| 35 | Tooltip clipping in print | Polish | Print preview manual test |

---

## Sources

- [Chrome Web Store rejection codes (Medium summary)](https://medium.com/@bajajdilip48/chrome-web-store-rejection-codes-b71f817ceaea)
- [Chrome Web Store program policies (developer.chrome.com)](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Troubleshooting Chrome Web Store violations](https://developer.chrome.com/docs/webstore/troubleshooting)
- [Chrome extensions single-purpose policy](https://developer.chrome.com/docs/extensions/mv3/single_purpose/)
- [Why Chrome extensions get rejected (Extension Radar)](https://www.extensionradar.com/blog/chrome-extension-rejected)
- [Pass the Chrome Web Store review first try (ExtensionFast)](https://www.extensionfast.com/blog/how-to-pass-the-chrome-web-store-review-on-your-first-try)
- [CRXJS issue #860 — production "Vite Dev Mode" error](https://github.com/crxjs/chrome-extension-tools/issues/860)
- [CRXJS issue #897 — Can not HMR web-accessible-resources](https://github.com/crxjs/chrome-extension-tools/issues/897)
- [CRXJS issue #515 — HMR triggers but doesn't work](https://github.com/crxjs/chrome-extension-tools/issues/515)
- [Advanced Config for CRXJS Vite Plugin](https://dev.to/jacksteamdev/advanced-config-for-rpce-3966)
- [chrome.storage API reference](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [chrome.storage quota docs issue #135](https://github.com/GoogleChrome/developer.chrome.com/issues/135)
- [Chrome extension storage quota best practices](https://bestchromeextensions.com/docs/guides/storage-quota-management/)
- [chrome-webstore-upload issue #47 — refresh token expires](https://github.com/fregante/chrome-webstore-upload/issues/47)
- [fregante/chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli)
- [PlasmoHQ/gcp-refresh-token](https://github.com/PlasmoHQ/gcp-refresh-token)
- [Token lifetime best practices 2026 (CIAM Compass)](https://guptadeepak.com/ciam-compass/guides/token-lifetime-best-practices/)
- [React 19 StrictMode and useEffect double-fire](https://dev.to/pockit_tools/why-is-useeffect-running-twice-the-complete-guide-to-react-19-strict-mode-and-effect-cleanup-1n60)
- [MDN — WebExtensions clipboard interaction](https://developer.mozilla.org/Add-ons/WebExtensions/Interact_with_the_clipboard)
- [Clipboard API DOMException — document not focused](https://techozu.com/clipboard-api-domexception-javascript-fix/)
- [Valibot methods guide](https://valibot.dev/guides/methods/)
- [Schema evolution backward/forward compatibility (DataExpert)](https://www.dataexpert.io/blog/backward-compatibility-schema-evolution-guide)
- Prototype `stack-checklist.html` lines 1949–2017 — informs migration semantics and 300 ms debounce baseline
- `.planning/research/STACK.md` — pinned picks (CRXJS 2.6.1, Vite 8, React 19, Zustand, valibot, yaml, Tailwind v4) and known caveats (HMR limits, OAuth rotation)
- `.planning/research/ARCHITECTURE.md` — pattern decisions (event-driven SW, bootstrap-before-render migration, sharded session keys, debounced persist)

---

*Pitfalls research for: Chrome MV3 + React/Vite/TS extension (interviewer-checklist), Chrome Web Store public listing*
*Researched: 2026-06-16*
