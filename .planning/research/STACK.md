# Stack Research

**Domain:** Chrome Manifest V3 browser extension (React + Vite + TypeScript, full-page tab surface, `chrome.storage.local` persistence, zero backend, public Chrome Web Store listing)
**Researched:** 2026-06-16
**Overall confidence:** HIGH on the headline picks (Vite, React, TS, CRXJS, Vitest, Biome, chrome-webstore-upload-cli, valibot for storage, yaml for YAML); MEDIUM on Tailwind v4 vs CSS Modules (choice depends on team preference and CSP comfort); MEDIUM-LOW on exact patch versions (verify with `npm view` at install time — patch numbers below were current within days of 2026-06-16 and will drift).

---

## TL;DR — One-Line Recommendations

- **Build pipeline:** Vite 8 + `@crxjs/vite-plugin` 2.6.x + `@vitejs/plugin-react` (SWC variant), TypeScript 6.0, Node 24 LTS.
- **UI:** React 19.2 + Zustand 5 + Tailwind v4 (or CSS Modules — see decision tree).
- **Data layer:** `chrome.storage.local` accessed through a thin wrapper with **valibot** schemas + a hand-written `migrations` table keyed by `schemaVersion`. **`yaml` (eemeli/yaml)** for YAML import/export.
- **Quality:** Vitest 3 + `@testing-library/react` 16 + `jsdom`. **Biome 2** for lint+format (single tool, 10–25× faster than ESLint+Prettier on this size of project).
- **Release:** `chrome-webstore-upload-cli` driven from a GitHub Actions workflow.
- **Don't ship a service worker.** This product never needs background context — the toolbar action opens a tab and everything runs in that tab's page context. Adding a service worker only to host `chrome.action.onClicked` is unnecessary; configure the manifest so the click opens a packaged HTML page directly (`default_popup` is wrong here; use a background SW *only* if you must, see "Surface wiring" below).

---

## Recommended Stack

### Core Technologies

| Technology | Version (current 2026-06) | Purpose | Why Recommended |
|------------|---------------------------|---------|-----------------|
| **Node.js** | **24.x (Active LTS)** | Build/dev runtime | 24 is the active LTS for Vite 8 and CRXJS 2.6. Node 26 is "Current" but not yet LTS (LTS October 2026). 22 is now Maintenance LTS. Confidence: HIGH ([Node Release WG](https://github.com/nodejs/Release), [endoflife.date](https://endoflife.date/nodejs)). |
| **TypeScript** | **6.0.3** (stable) | Type system | TS 6.0 is the last release on the legacy JS compiler; 7.0 (Go-based, 10× faster) is in Beta as of 2026-04 — too fresh to adopt for a Chrome Web Store v1. Stay on 6.0.x for v1, plan a TS 7 upgrade after v1 ships. Confidence: HIGH ([TS 6.0 announce](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [TS 7 Beta blog](https://devblogs.microsoft.com/visualstudio/typescript-7-beta-now-enabled-by-default-in-visual-studio-2026-18-6-insiders-3/)). |
| **Vite** | **8.0.x** (8.0.9 latest patch as of 2026-04-20) | Dev server + bundler | Vite 8 ships Rolldown + Oxc by default (Rust-based, much faster than esbuild/Rollup in 7). CRXJS 2.6 officially supports Vite 3–8. Confidence: HIGH ([Vite 8 blog](https://vite.dev/blog/announcing-vite8), [Vite releases](https://vite.dev/releases)). |
| **React** | **19.2.7** | UI library | React 19.2 is the current stable line; the React Compiler is opt-in via `babel-plugin-react-compiler` and works under Vite. No reason to stay on 18 for a greenfield project. Confidence: HIGH ([React 19.2 blog](https://react.dev/blog/2025/10/01/react-19-2), [npm](https://www.npmjs.com/package/react?activeTab=versions)). |
| **@vitejs/plugin-react-swc** | latest | JSX/TSX transform | SWC variant is faster than the Babel one and is the default in modern Vite React starters. Skip Babel unless you intentionally turn on the React Compiler (which currently still requires Babel). Confidence: HIGH. |
| **@crxjs/vite-plugin** | **2.6.1** (published days before 2026-06-16) | MV3 bundling for Vite | Handles `manifest.json` as Vite input, rewrites HTML entry points, supplies HMR, generates web-accessible resources, splits content/background bundles. Project went through a maintenance gap in 2023–early 2025 but shipped 2.0 in June 2025 with a new maintainer team and has shipped point releases steadily since. Confidence: HIGH for the use case; MEDIUM on long-term project health (see decision tree). ([npm](https://www.npmjs.com/package/@crxjs/vite-plugin), [GitHub releases](https://github.com/crxjs/chrome-extension-tools/releases), [maintenance discussion](https://github.com/crxjs/chrome-extension-tools/discussions/872)). |

### Supporting Libraries

| Library | Version | Purpose | When to Use / Why |
|---------|---------|---------|-------------------|
| **zustand** | 5.x | UI/app state store | Tiny (~3 KB), no Provider, vanilla `create` returns a hook + a plain store. Crucially for this extension: the plain store half is callable from non-React code (e.g. a `chrome.storage.onChanged` listener), which Jotai's Provider-bound atoms make awkward. Confidence: HIGH for this domain. |
| **valibot** | latest 1.x | Runtime schemas + migration validation for `chrome.storage.local` payloads | ~90 % smaller than Zod standard, fully tree-shakeable. Since the persisted blob is large (the question bank exceeds 100 KB by intent), and the extension ships to end users, bundle size matters. Use it to (a) validate decoded `chrome.storage.local` reads, (b) validate YAML imports (structural and legacy progress-only), (c) gate schema migrations. Confidence: HIGH. ([Zod v4 vs Valibot benchmark](https://dev.to/whoffagents/zod-v4-vs-valibot-runtime-validation-in-2026-i-benchmarked-both-3jnc)). |
| **yaml** (eemeli/yaml) | 2.x | YAML parse + stringify | Pick `yaml` over `js-yaml`. `yaml` ships its own TypeScript types (no extra `@types` lag), exposes a Document API for round-tripping comments and key order (useful for the structural export), runs in the browser without polyfills, and is on YAML 1.2. `js-yaml` types live in `@types/js-yaml` which lagged the runtime by years. Confidence: HIGH. ([yaml on npm](https://www.npmjs.com/package/yaml), [eemeli/yaml on GitHub](https://github.com/eemeli/yaml)). |
| **Tailwind CSS** | **4.1.x** | Styling system | v4 is GA and battle-tested as of 2026. The Vite plugin (`@tailwindcss/vite`) is the recommended integration; no `postcss.config.*`, no `tailwind.config.js` — theme tokens live in CSS via `@theme`. ~70 % smaller production output vs v3. **Caveat for extensions:** the new Oxide CSS layer relies on cascade layers (`@layer`), which work fine in modern Chrome but interact with MV3 CSP — see "Pitfalls" below. Confidence: MEDIUM (it works; the open question is whether you'd rather port the existing bespoke CSS as CSS Modules — see decision tree). ([Tailwind v4 announce](https://tailwindcss.com/blog/tailwindcss-v4)). |
| **clsx** (or `cva`) | latest | Conditional className helper | Tiny. Use `clsx` if you stick with raw Tailwind; use `cva` (`class-variance-authority`) if you have ≥3 variant axes per component (mark band colors are an obvious candidate). |
| **@testing-library/react** | 16.x | DOM tests | Required peer for Vitest + React 19. Confidence: HIGH. |
| **@testing-library/user-event** | 14.x | User-action simulation | Needed for keyboard shortcut tests (`/`, `\`, `Esc`) and search debouncing. |
| **happy-dom** *or* **jsdom** | latest | Test DOM env | `happy-dom` is ~3× faster than `jsdom` for component tests; `jsdom` has wider API coverage. Default to `happy-dom`; fall back to `jsdom` if a test hits an unimplemented API. |
| **@types/chrome** | latest | TS types for `chrome.*` APIs | Required for typing `chrome.action`, `chrome.tabs`, `chrome.storage`, `chrome.runtime.onInstalled`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Biome 2.3+** | Lint + format (single tool) | Replaces ESLint+Prettier+typescript-eslint+eslint-plugin-react+eslint-plugin-jsx-a11y for ~80 % of rules typical projects need. 10–25× faster on CI. v2.3 (Jan 2026) added type-aware linting, closing the last big gap vs typescript-eslint. ([Biome migrate guide](https://biomejs.dev/guides/migrate-eslint-prettier/)). |
| **Vitest 3.x** | Test runner | Reuses your Vite config, no Babel/Jest config to maintain. Jest-compatible API. The clear default for Vite projects in 2026. |
| **chrome-webstore-upload-cli** (fregante) | CWS upload + publish | Drive from CI with `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN` as GH Actions secrets. **Important 2026 update:** classic OAuth tokens have been revoked; granular tokens expire every 90 days and require 2FA — bake a quarterly token-rotation reminder into the release runbook. ([fregante/chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli), [Package Rank notes](https://package-rank.com/wp/npm/chrome-webstore-upload-cli)). |
| **release-please** (optional) | Conventional-commits-driven release PRs | Pairs cleanly with `chrome-webstore-upload-cli`. Use it if you want changelog automation; skip if release cadence is low. |
| **pnpm** (recommended) | Package manager | Fast, content-addressable store, strict by default — catches accidental peer-dep mismatches that Vite plugins are prone to. npm/Yarn also work. |

---

## Installation

```bash
# Use Node 24 LTS — pin in .nvmrc
echo "24" > .nvmrc

# Core
pnpm add react@19 react-dom@19
pnpm add zustand valibot yaml clsx

# Dev — build pipeline
pnpm add -D typescript@~6.0 vite@^8 @vitejs/plugin-react-swc @crxjs/vite-plugin@^2.6
pnpm add -D @types/chrome @types/react @types/react-dom

# Dev — styling (pick one path)
pnpm add -D tailwindcss@^4 @tailwindcss/vite
# ...or skip Tailwind entirely and use CSS Modules (built into Vite)

# Dev — testing
pnpm add -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom

# Dev — quality
pnpm add -D --save-exact @biomejs/biome@^2.3

# Dev — release
pnpm add -D chrome-webstore-upload-cli
```

---

## The Vite-Extension Plugin Decision (the one you actually have to make)

This is the single most consequential pick in the stack. Here is the honest comparison.

### Candidates

| Plugin | Status (2026-06) | Posture |
|--------|------------------|---------|
| **@crxjs/vite-plugin** | 2.6.1, actively maintained again by a new team after a long beta. Supports Vite 3–8, MV3, HMR for popup/options/full-page HTML/background SW. | Vite-plugin-shaped. Stays "out of the way" of your Vite config. |
| **@samrum/vite-plugin-web-extension** | Quiet for ~12 months in 2025; sporadic patches. Smaller user base. | Vite-plugin-shaped. Simpler than CRXJS. |
| **vite-plugin-web-extension** (aklinker1) | The plugin that eventually became **WXT**. The standalone plugin still exists but the author redirects new users to WXT. | Vite-plugin-shaped. |
| **WXT (wxt.dev)** | Market leader for 2026 — most active, cross-browser, file-based routing, auto-imports, fastest HMR, smallest bundles. Built on Vite under the hood (not exposed as a Vite plugin — WXT *owns* the config). | Framework-shaped. You give up direct `vite.config.ts` ownership for `wxt.config.ts`. |
| **Plasmo** | Still around; less momentum than WXT. Heavier "framework" feel, Next.js-style conventions. | Framework-shaped. |

### Decision tree

```
Is keeping a vanilla Vite config a hard constraint?
├── Yes (the project context says "React + Vite + TypeScript")
│    └─► @crxjs/vite-plugin 2.6.x   ✅ RECOMMENDED
│
└── No — open to a higher-level framework
     ├── Multi-browser (Firefox/Safari) ever likely?
     │    ├── Yes ─► WXT
     │    └── No  ─► CRXJS or WXT (toss-up; WXT has better DX, CRXJS has thinner abstractions)
     └── Need file-based routing / auto-imports?
          ├── Yes ─► WXT
          └── No  ─► CRXJS
```

### Recommendation: **CRXJS 2.6.x**, with WXT as the Plan B.

**Why CRXJS for *this* project specifically:**
1. The PROJECT.md constraints lock in "React + Vite + TypeScript" — CRXJS is a Vite plugin (you keep `vite.config.ts`). WXT would force `wxt.config.ts` and a small framework on top.
2. The product is Chrome-only by design (the Out of Scope list excludes other browsers and the Web Store is the only distribution surface). WXT's cross-browser story is wasted here.
3. The extension has exactly one surface (toolbar → full-page tab). WXT's file-based routing for popup/options/sidepanel/content-scripts is also wasted.
4. The hard cost of CRXJS's history is reputational, not technical — 2.6.1 builds today on Vite 8 / React 19 / TS 6 and HMR works for the full-page HTML you'll ship.

**Plan B (escape hatch):** If CRXJS goes quiet again or hits a blocker, the migration to WXT is "delete `vite.config.ts`, write `wxt.config.ts`, move entry points to WXT's filesystem layout" — measured in hours, not days, because the React app proper does not depend on the build plugin.

**Plugins to NOT use:** vanilla Rollup + a hand-written manifest copy step (loses HMR, you'll fight it), Webpack-based boilerplates (slower, off the modern path).

---

## Surface Wiring — Toolbar Action Opens a Full-Page Tab (No Popup, No Required SW)

This is small but easy to get wrong, so it's worth pinning down explicitly.

**Two valid patterns:**

### Pattern A — `default_popup` pointing at a 1-line redirect (NO service worker)

```jsonc
// manifest.json (excerpt)
{
  "manifest_version": 3,
  "action": {
    "default_title": "Interview Checklist",
    "default_popup": "popup.html"   // never actually rendered to the user
  },
  "permissions": ["storage"]
}
```

`popup.html` is a stub that calls `chrome.tabs.create({ url: chrome.runtime.getURL("checklist.html") })` and `window.close()` on load. **Drawback:** there's a perceptible popup flash on slow machines.

### Pattern B — `chrome.action.onClicked` from a service worker (RECOMMENDED here)

```jsonc
// manifest.json (excerpt)
{
  "manifest_version": 3,
  "action": { "default_title": "Interview Checklist" },   // no default_popup
  "background": { "service_worker": "background.ts", "type": "module" },
  "permissions": ["storage"]
}
```

```ts
// background.ts — tiny, single responsibility, zero in-memory state
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("checklist.html") });
});
```

Yes, this means you ship a service worker — but a 5-line one with no state. The SW lifecycle hazards (suspension, lost in-memory state) don't apply because there is no state. **This is cleaner than Pattern A** and avoids the popup flash. CRXJS 2.6 wires the SW entry into the manifest automatically.

**What you do NOT need:** message passing, alarms, offscreen documents, content scripts, host permissions, `activeTab`. The entire React app lives in `checklist.html` and reads/writes `chrome.storage.local` directly. The SW is just a click forwarder.

---

## State Management — Why Zustand and Why Not the Others

| Option | Verdict | Reason |
|--------|---------|--------|
| **Zustand** | ✅ Pick | ~3 KB, hook + plain store. The plain `store.setState` is callable from `chrome.storage.onChanged` and from the YAML import code path without needing React context. Fits the "one tab, one app, persist on every change" pattern this product needs. |
| Jotai | ❌ | Atomic model is overkill for a single-page form-heavy UI. Provider boundaries make cross-context reads (e.g. from a vanilla migration utility) awkward. |
| Redux Toolkit | ❌ | Redux's win is structured time-travel, devtools, and middleware in large team codebases. None of those pay off here, and RTK adds bundle weight that ends up shipped to every user. |
| Context + `useReducer` | ❌ for app state, ✅ for UI-local state | Re-render storm risk on a state shape this dense (~1000 questions, scores, notes). Use Context only for theme + sidebar-collapsed flags. |
| TanStack Query | ❌ | There is no network. |

**State shape sketch (informs ARCHITECTURE.md too):** one Zustand store with slices for `bank` (built-in + custom questions), `session` (active session id + slot map), `scores`, `notes`, `overrides`, `filters`, `ui` (sidebar open, dark mode override). Persist the whole store to `chrome.storage.local` on every commit via a `subscribe` middleware that debounces writes (~150 ms).

---

## Styling — Tailwind v4 vs CSS Modules vs Vanilla CSS

The existing 3,053-line HTML uses bespoke CSS with custom-property design tokens. Three honest paths:

| Path | Pros | Cons | Recommendation |
|------|------|------|----------------|
| **Tailwind v4 + `@tailwindcss/vite`** | Fastest to author new components; built-in dark mode (`dark:` variant); ~70 % smaller CSS output than v3; container queries; no `tailwind.config.js`. | You discard the existing CSS. Tailwind utility classes in DOM bloat the HTML and complicate the print stylesheet (Pillar requirement: clean print). MV3 CSP plays nicely with v4 (no `<style>` injection at runtime once built). | ✅ For a greenfield rewrite where the HTML is treated as a spec, not as a starting CSS. |
| **CSS Modules** (built into Vite) | Lifts the existing CSS almost verbatim; one module per component; dark mode via `prefers-color-scheme` + a `data-theme` attribute, exactly like the prototype. Zero new dependencies. | Slower per-component authoring than Tailwind for tiny tweaks. | ✅ If the existing CSS aesthetic is sacred and dev velocity is secondary. |
| Vanilla `<style>` per HTML file | Mirrors the prototype | Loses scoping; collides with React | ❌ |
| Styled-components / Emotion | Mature | Runtime CSS injection conflicts with MV3 CSP unless carefully configured; bundle weight; emotion's babel plugin fights SWC | ❌ |

**Pick:** Tailwind v4 unless the team has a strong reason to preserve the prototype's exact CSS. The print stylesheet requirement is satisfiable in either path; in Tailwind use `print:` variants + a global `@media print { ... }` block. Confidence: MEDIUM (defensible either way).

---

## Persistence — `chrome.storage.local` Pattern

This is too important to leave implicit. The recommended layering:

```
React component
   ⇕ (useStore hook)
Zustand store (in-memory truth)
   ⇕ (persist middleware, custom storage)
chrome.storage.local  ←  hydrate on boot, validate with valibot
```

- **One key** per session slot: `session:<slotId>` → `{ schemaVersion: number, payload: ... }`. Plus `meta` → `{ activeSlotId, slotOrder, schemaVersion }`.
- **Reads**: `chrome.storage.local.get([...])` → for each blob, `valibot.parse(SessionV3Schema, blob.payload)`. If parse fails: try `SessionV2Schema`, then `SessionV1Schema`. The first match runs its `migrate()` to the latest schema. Persist the upgraded value back.
- **Writes**: debounced (~150 ms) coalescing of Zustand updates; serialize with `JSON.stringify`. **Do not** call `chrome.storage.local.set` on every keystroke (MV3 storage write quota is generous but not infinite, and the question bank blob is large).
- **YAML import path**: parse YAML → detect "structural" vs "legacy progress-only" by presence of `meta.exportVersion` → run through the same valibot schema chain → write into the active slot.
- **Watch other contexts** (defensive — there are no other contexts in v1, but a future side-panel surface would need this): `chrome.storage.onChanged.addListener` updates the Zustand store via `store.setState` (the vanilla half — *not* a React hook).

**Why valibot here specifically over Zod:** every byte you spend on a schema lib ships to every Chrome user on every update. The total schema surface is large (one schema per major data shape × 3 historical versions for migration). Valibot's per-schema cost is ~600 B vs Zod standard's ~13 KB. ([benchmark](https://dev.to/whoffagents/zod-v4-vs-valibot-runtime-validation-in-2026-i-benchmarked-both-3jnc)).

---

## Alternatives Considered (the full table)

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @crxjs/vite-plugin | WXT | Multi-browser target, file-based routing, or willingness to give up direct Vite config ownership. |
| @crxjs/vite-plugin | @samrum/vite-plugin-web-extension | If CRXJS hits a specific blocker and you prefer a smaller plugin surface. |
| @crxjs/vite-plugin | Plasmo | If you specifically want Plasmo's content-script messaging primitives — irrelevant here. |
| Vite 8 + Rolldown | Vite 7 (esbuild + Rollup) | If you hit a Rolldown-specific regression in your plugin chain. Plan to revisit at next Vite minor. |
| TypeScript 6.0 | TypeScript 7.0 Beta | After v1 ships and 7.0 stabilizes. Compile-speed gains are real but Beta is not safe for a store-blocking release. |
| React 19.2 | React 18.3 | Only if a Tailwind/CRXJS combination surfaces a React 19 incompatibility. (None known as of research date.) |
| Zustand 5 | Jotai 2 | Heavy atomic composition needs. Not the case here. |
| Zustand 5 | Redux Toolkit | Multi-team app, devtools/time-travel mandatory, complex middleware. Not the case here. |
| valibot | Zod v4 (zod/v4-mini) | Team already deep on Zod; bundle size less critical. Mini is still ~5× larger than valibot. |
| valibot | ArkType | If you want runtime + static *types from one TS expression*. Heavier and less mature than valibot for this use case. |
| `yaml` | `js-yaml` | Existing codebase already standardized on js-yaml. Not the case (greenfield). |
| Tailwind v4 | CSS Modules | If preserving the prototype's CSS aesthetic verbatim matters more than dev velocity. |
| Vitest 3 | Jest 30 | Existing Jest config to preserve. Not the case (greenfield). |
| Biome 2 | ESLint 9 + Prettier 3 + typescript-eslint 8 | If you need an ESLint plugin that Biome doesn't cover (rare for this domain — Biome already covers react, jsx-a11y, typescript, unicorn). |
| Biome 2 | `oxc-lint` (Oxlint) | Even faster than Biome but rules less complete in mid-2026. Revisit at v1 maintenance time. |
| chrome-webstore-upload-cli | Manual upload via the CWS dashboard | Solo dev, very low release cadence. Still recommend automating early — token rotation is the dominant cost either way. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`chrome.storage.sync`** | Hard 100 KB per-extension quota; the question bank exceeds it. PROJECT.md already calls this out as out of scope. | `chrome.storage.local` (no practical limit for this payload). |
| **`localStorage` inside the extension page** | The HTML page runs at `chrome-extension://…` and `localStorage` is *technically* available, but it doesn't survive uninstall/reinstall via the normal extension data path and can't be read from a SW. | `chrome.storage.local`, even though the data never leaves the page context. |
| **Webpack-based MV3 boilerplates** (CRA-style, react-chrome-extension-boilerplate, etc.) | Slow startup, no native HMR for MV3, falling behind on MV3 conventions. | CRXJS + Vite. |
| **In-page CSS-in-JS with runtime injection (styled-components default mode, Emotion default mode)** | MV3 CSP forbids inline `<style>` injection unless you loosen the policy or use SSR-extracted CSS. Loosening CSP delays Web Store review. | Tailwind v4 or CSS Modules — both produce static CSS at build time. |
| **`eval`, `new Function`, dynamic `import()` from data URLs** | MV3 default CSP forbids these. YAML import must not use `eval`-based parsers — `yaml` and `js-yaml` are both safe; the gotcha is real for other libraries. | Use `yaml` (eemeli). |
| **`@types/js-yaml`** | Lags the runtime by years — see [npm page noting "last published 3 years ago"](https://www.npmjs.com/package/@types/js-yaml). | Use the `yaml` package, which ships its own types. |
| **Heavy state libraries (Redux Toolkit, MobX)** | Bundle weight shipped to every user with no offsetting benefit at this size. | Zustand. |
| **A real backend / Firebase / Supabase for any data** | Out of scope per PROJECT.md. Also triggers a privacy-policy review delay on the Web Store. | `chrome.storage.local` + YAML export. |
| **`chrome.scripting`, `host_permissions`, `activeTab`** | Not needed — the extension never touches a page outside its own tab. Requesting them lengthens CWS review. | Ship with `"permissions": ["storage"]` only. |
| **`tabs` permission** | Not required to call `chrome.tabs.create({ url: chrome.runtime.getURL(...) })` for an extension's own page — that call works without the `tabs` permission. Don't request it. | (nothing — drop the permission). |

---

## MV3 + React + Vite — Specific Gotchas

These directly answer the question's "gotchas" section.

### HMR
- **HMR works** for popup, options, and full-page HTML entries under CRXJS 2.6 + Vite 8 — confirmed in the CRXJS docs and recent releases.
- **HMR does NOT survive a production build.** The dev server is `http://localhost:5173` (or your configured port). Production-built extensions have no dev-server connection. ([CRXJS issue #860](https://github.com/crxjs/chrome-extension-tools/issues/860)).
- Service-worker HMR in MV3 is *full reload* of the SW, not module-level swap. For a 5-line click forwarder this is fine.
- **Loading the unpacked extension while running `vite dev`** is the supported dev loop. Re-load the extension from `chrome://extensions` after touching `manifest.json` (CRXJS rewrites it, but the runtime needs a reload to re-read it).

### Content Security Policy
- MV3's default `extension_pages` CSP is `script-src 'self'; object-src 'self';` — strict, no inline scripts, no `eval`.
- React itself is fine. Vite's production output is fine. Tailwind v4's *built* output is plain CSS — fine.
- **What breaks under this CSP:**
  - Any library that calls `eval` / `new Function` (older Lodash templates, some date pickers).
  - Runtime CSS-in-JS injection (some styled-components configs) — pre-extract at build time instead.
  - Source maps with `eval` mode in dev — CRXJS forces the correct sourcemap mode automatically.
- **Do NOT loosen the CSP** unless absolutely necessary; Web Store review flags broader CSPs as risk and adds days to review.

### Service Worker Constraints (and why this product mostly dodges them)
- **The big MV3 hazard is the SW shutting down after ~30 s of inactivity and losing in-memory state.** This product has zero SW state — the 5-line click forwarder is `addEventListener` only. The SW can be killed and re-spawned freely; the next click re-registers the listener.
- **Top-level imports run on every SW wake.** Keep the SW file small and import only `chrome.action` / `chrome.tabs` adjacent code.
- **`type: "module"` SW** is required for ES module syntax. CRXJS sets this in the generated manifest.
- **Persistent state still goes in `chrome.storage.local`.** The React app reads/writes it directly — the SW doesn't proxy it.
- If you later need to do *anything* on a schedule (e.g. nudge the user weekly), use `chrome.alarms`, never `setTimeout` — `setTimeout` evaporates with the SW.

### Tree-Shaking
- Vite 8's Rolldown does aggressive tree-shaking, but it relies on **`"sideEffects": false`** in the package.json of dependencies. Most modern libs (Zustand 5, Valibot, Tailwind v4) declare this correctly.
- **Watch list for incorrect side-effects markers:** older utility libs (Moment, full Lodash). Stick to the stack here and you avoid the issue.
- **Tree-shaking does NOT cross dynamic `import()` boundaries** with variable expressions. Don't dynamically import question-bank files by computed path — import them statically and let Rolldown split.
- **The question-bank blob (~1000 questions) is a single static JSON.** Either ship it embedded in the bundle (faster first load, larger initial blob), or `fetch(chrome.runtime.getURL('bank.json'))` at runtime (smaller bundle, brief loading state). For ~1000 questions of mostly-text I'd embed unless the gzipped size exceeds ~200 KB.

### React 19 + StrictMode
- React 19's StrictMode double-invokes effect/render functions in development. If your `chrome.storage.local` write effect isn't idempotent, you'll see double writes in dev. The debounced-persist middleware coalesces this, but write your effect handlers to be idempotent.

### `manifest.json` content
Minimum viable manifest (CRXJS will augment it):
```jsonc
{
  "manifest_version": 3,
  "name": "Interview Checklist",
  "version": "1.0.0",
  "description": "Weighted tech-stack interview scoring checklist.",
  "permissions": ["storage"],
  "action": { "default_title": "Open checklist" },
  "background": { "service_worker": "src/background.ts", "type": "module" },
  "icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }
}
```
No `host_permissions`. No `content_scripts`. No `web_accessible_resources` (CRXJS adds entries automatically for HMR in dev only).

---

## Stack Patterns by Variant

**If you decide to support Firefox later:** switch from CRXJS to WXT *before* writing too much code. Migration is mechanical but tedious.

**If you decide to add a side-panel surface later:** stay on CRXJS (it supports `side_panel` entries natively) — but factor the React app so the side panel and the full-page tab can share a store via `chrome.storage.onChanged` events.

**If you decide to skip Tailwind:** delete the Tailwind deps, lean on CSS Modules (built into Vite, zero config). Keep dark mode via a `data-theme` attribute on `<html>` toggled from the Zustand `ui` slice.

**If the Chrome Web Store reviewer pushes back on permissions:** you should already be at `["storage"]` — there's nothing left to cut.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@crxjs/vite-plugin@2.6.x` | `vite@^3 \|\| ^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8` | Project docs claim Vite 3–8 support. Verified via release notes; 2.6.1 lists Vite 8 in compatibility. |
| `vite@8.0.x` | `@vitejs/plugin-react-swc@^4` (verify at install) | Vite 8 ships Rolldown by default; plugin-react-swc latest is compatible. |
| `react@19.2.x` | `react-dom@19.2.x` (must match minor) | Always install as a pair. |
| `tailwindcss@^4` | `@tailwindcss/vite@^4` | v4 requires the matching Vite plugin; do NOT use the v3 PostCSS path. |
| `vitest@^3` | `vite@^7 \|\| ^8` | Vitest 3 supports Vite 8. |
| `@biomejs/biome@^2.3` | Node ≥ 18 | Pin exact version (`--save-exact`) — Biome treats config schema as semver-major-tied. |
| `valibot@^1` | TypeScript ≥ 5.0 | v1 is stable since 2024; TS 6.0 compatible. |
| `yaml@^2` | Browser + Node | TS 5.9+ required as of latest; works in extension page context. |

---

## Confidence Summary

| Pick | Confidence | Why this level |
|------|------------|----------------|
| Vite 8, React 19.2, TS 6.0, Node 24 LTS | HIGH | All verified against official sources within last 60 days; current stable lines. |
| CRXJS 2.6.x | HIGH for the use case, MEDIUM for long-term | Active in 2026 but has a maintenance gap history. Migration path to WXT exists if needed. |
| Zustand 5 for state | HIGH | Strongly fits the "one tab, one app, plain store accessible from non-React code" shape. |
| Valibot for schemas | HIGH | Bundle-size advantage is large and verified; works in browser. |
| `yaml` package for YAML | HIGH | Better TS story than `js-yaml`; safe under MV3 CSP. |
| Vitest 3 + RTL | HIGH | Default in 2026 for Vite projects. |
| Biome 2.3 | HIGH | Production-ready in 2026, single tool replaces ESLint+Prettier, big CI speed-up. Fall back to ESLint+Prettier if you hit a rule-coverage wall (unlikely). |
| `chrome-webstore-upload-cli` | HIGH for the tool, MEDIUM for the auth flow | Granular tokens + 90-day rotation are new and need a runbook. |
| Tailwind v4 vs CSS Modules | MEDIUM | Either works; team taste call. |
| Pattern B (SW + `chrome.action.onClicked`) over Pattern A (popup stub) | MEDIUM-HIGH | Verified by Chrome MV3 docs; the "no popup flash" win is real. |
| TS 7.0 NOT recommended for v1 | HIGH | Beta as of 2026-04; Web Store v1 should not ride a beta toolchain. |
| Exact patch numbers | MEDIUM-LOW | Verify with `npm view <pkg> version` at install time. |

---

## Sources

- [@crxjs/vite-plugin on npm](https://www.npmjs.com/package/@crxjs/vite-plugin) — version 2.6.1, last published days before 2026-06-16
- [CRXJS GitHub releases](https://github.com/crxjs/chrome-extension-tools/releases) — Vite 3–8 support, 2.0 ship in June 2025
- [CRXJS "Unmaintained?" discussion #872](https://github.com/crxjs/chrome-extension-tools/discussions/872) — maintenance history context
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) — Rolldown integration
- [Vite releases page](https://vite.dev/releases) — 8.0.9 as of 2026-04-20
- [React v19 announcement](https://react.dev/blog/2024/12/05/react-19) and [React 19.2 announcement](https://react.dev/blog/2025/10/01/react-19-2)
- [react on npm](https://www.npmjs.com/package/react?activeTab=versions) — 19.2.7 line current
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) and [TS 7 Beta blog](https://devblogs.microsoft.com/visualstudio/typescript-7-beta-now-enabled-by-default-in-visual-studio-2026-18-6-insiders-3/)
- [Node.js Release working group](https://github.com/nodejs/Release) and [endoflife.date for Node.js](https://endoflife.date/nodejs) — Node 24 = Active LTS, 22 = Maintenance, 26 = Current
- [Tailwind v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, Oxide engine
- [Tailwind v4 review 2026](https://trybuildpilot.com/488-tailwind-css-v4-review-2026) — production-readiness state
- [yaml (eemeli) on GitHub](https://github.com/eemeli/yaml) and [yaml on npm](https://www.npmjs.com/package/yaml) — TS-native, browser-safe
- [js-yaml on npm](https://www.npmjs.com/package/js-yaml) and [@types/js-yaml on npm](https://www.npmjs.com/package/@types/js-yaml) — types lag context
- [Zod v4 vs Valibot benchmark](https://dev.to/whoffagents/zod-v4-vs-valibot-runtime-validation-in-2026-i-benchmarked-both-3jnc) — 20× bundle size difference for typical schemas
- [Pockit: Zod vs Valibot vs ArkType 2026](https://pockit.tools/blog/zod-valibot-arktype-comparison-2026/) — ecosystem comparison
- [State of Browser Extension Frameworks 2025 (Plasmo / WXT / CRXJS)](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [WXT vs Plasmo vs CRXJS 2026 (BuildPilot)](https://trybuildpilot.com/649-wxt-vs-plasmo-vs-crxjs-2026) — market-share context
- [WXT docs](https://wxt.dev/guide/resources/compare)
- [Biome 2026 review (BuildPilot)](https://trybuildpilot.com/433-biome-review-2026) and [Biome migration guide](https://biomejs.dev/guides/migrate-eslint-prettier/)
- [Biome vs ESLint perf case study](https://fireup.pro/news/pre-commit-hooks-15x-faster-biome-vs-eslint-case-study)
- [fregante/chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli)
- [chrome-webstore-upload-cli on npm](https://www.npmjs.com/package/chrome-webstore-upload-cli)
- [Automating Chrome Extension Releases (release-please + GH Actions)](https://zenn.dev/atani/articles/chrome-extension-auto-publish-guide?locale=en)
- [Chrome Migrate to a service worker](https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/)
- [CRXJS issue #860 — production "Vite Dev Mode" error](https://github.com/crxjs/chrome-extension-tools/issues/860) — flagged as HMR not surviving prod
- [Zustand + Chrome Storage practical writeup](https://www.drewalth.com/lab/zustand-chrome-storage/) — `chrome.storage.onChanged` pattern

---

*Stack research for: Chrome MV3 + React + Vite + TypeScript browser extension (full-page-tab surface, `chrome.storage.local`, Chrome Web Store public listing)*
*Researched: 2026-06-16*
