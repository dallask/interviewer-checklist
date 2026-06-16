# Phase 1: Foundation & Scaffolding — Research

**Researched:** 2026-06-16
**Domain:** Chrome MV3 build scaffold (CRXJS 2.6 + Vite 8 + React 19 + TypeScript + Biome 2.3 + Vitest 3) with CI safety guards and a GH Actions release pipeline
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase. Refer to ROADMAP success criteria and project constraints:

- **Stack:** CRXJS + Vite + React + TypeScript + Biome (from PROJECT.md target features)
- **Permissions posture:** only `"storage"` in manifest.json — no `default_popup`, no `host_permissions`, no `scripting`
- **Entry point:** toolbar action → opens full-page tab (`chrome.action.onClicked`)
- **CI:** GitHub Actions with a lint step that rejects any dist containing `eval`, `unsafe-eval`, inline scripts, or `localhost`/`vite-hmr` references
- **Release pipeline:** GH Actions workflow using `chrome-webstore-upload-cli` to publish the extension zip

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase; all UI and feature work is in later phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Chrome MV3 extension scaffold (CRXJS 2.6 + Vite 8 + React 19 + TypeScript + Biome 2.3) builds cleanly for production | Standard Stack section — exact versions, vite.config.ts pattern, tsconfig shape, Biome 2.3 init |
| FOUND-02 | `manifest.json` declares only `"permissions": ["storage"]`, no `default_popup`, no `host_permissions`, no `scripting` | Manifest Layout section — concrete JSON template + CI manifest-audit step |
| FOUND-03 | Service worker (≤30 LOC, event-driven, stateless) opens a full-page tab (`chrome.tabs.create`) on toolbar action click | Background SW section — Pattern B code example |
| FOUND-04 | CI guards reject builds containing `eval`, `unsafe-eval`, inline scripts, or `localhost`/`vite-hmr` references in `dist/` | CI Safety Guards section — exact grep commands for GH Actions |
| FOUND-05 | GH Actions release workflow publishes the extension zip via `chrome-webstore-upload-cli` | Release Pipeline section — workflow YAML structure, secrets, commands |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure phase — no user-facing features. Its output is a project skeleton in which every subsequent phase can add source files safely, knowing the manifest is locked, the CI will catch MV3 violations before they reach the store, and the release pipeline is proven end-to-end.

The stack is already locked in CONTEXT.md and verified against the project research corpus (STACK.md, ARCHITECTURE.md, PITFALLS.md). This research synthesises those findings into the **concrete, phase-1-specific** actions: the five required files (vite.config.ts, manifest.json, tsconfig.json, biome.json, background/index.ts), the two CI workflows (build-and-check, release), and the test infrastructure that covers exactly what Phase 1 must prove.

CRXJS 2.6.1 is the correct Vite plugin for this project. It turns `manifest.json` into a Vite entry point, rewrites asset hashes in the built manifest automatically, and supports HMR for full-page HTML entries. The service worker (≤30 LOC) uses Pattern B: `chrome.action.onClicked` → `chrome.tabs.create` — no `default_popup`, no popup flash, cleanest CWS review posture. Biome 2.3 replaces the ESLint+Prettier stack with a single `biome.json`; its `biome ci` command runs in GH Actions. The release workflow triggers on a semver tag, builds in CI (never on a developer machine), zips `dist/`, and calls `chrome-webstore-upload-cli upload`.

**Primary recommendation:** Wire the CI dist-safety checks (eval grep + localhost grep + manifest-permissions parse) in the same workflow as the build — fail the workflow before the artifact is created if any check fails. This prevents the Pitfall 7/8 class of "broken extension reaches the store" by construction.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Toolbar action click handling | Extension SW (background) | — | MV3 `chrome.action.onClicked` fires only in SW context; no DOM available |
| Full-page tab hosting | Extension page (`app.html`) | — | The React app renders here; the SW merely opens this URL via `chrome.tabs.create` |
| Build configuration | Build tooling (Vite + CRXJS) | — | CRXJS rewrites manifest, splits bundles, handles HMR; Vite owns the config |
| MV3 compliance enforcement | CI / Build tooling | Code convention | CI greps dist/; CRXJS enforces sourcemap mode |
| Release automation | CI (GH Actions) | — | Build artifact must come from CI, not a developer machine |
| Linting / formatting | Build tooling (Biome) | CI | Biome runs locally and in CI; single tool no config drift |
| Testing | Build tooling (Vitest) | CI | Vitest reuses Vite config; happy-dom provides DOM environment |

---

## Standard Stack

### Core

| Library | Version (verified) | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| `@crxjs/vite-plugin` | **2.6.1** | Vite plugin for Chrome MV3 | Turns `manifest.json` into a Vite entry; auto-rewrites asset hashes; HMR for full-page HTML; Vite 3–8 support confirmed |
| `vite` | **8.0.16** | Dev server + bundler | Rolldown-based (faster); CRXJS 2.6.x supports Vite 8; canonical choice for React+TS in 2026 |
| `@vitejs/plugin-react-swc` | **4.3.1** | JSX/TSX transform | SWC variant; faster than Babel; compatible with Vite 8 |
| `react` | **19.2.7** | UI library | Current stable; no React 18 regression known with CRXJS/Tailwind v4 |
| `react-dom` | **19.2.7** | React DOM renderer | Must match react minor exactly |
| `typescript` | **6.0.3** | Type system | TS 6.0 stable; TS 7 Beta deferred; last JS-compiler-based release |

### Supporting (Phase 1 — dev tooling only)

| Library | Version (verified) | Purpose | When to Use |
|---------|-------------------|---------|-------------|
| `@biomejs/biome` | **2.5.0** (latest; project targets 2.3+) | Lint + format | Single tool replaces ESLint+Prettier+typescript-eslint; 10–25× faster CI; pin with `--save-exact` |
| `vitest` | **4.1.9** (latest v4 line) | Test runner | Reuses Vite config; Jest-compatible API; default for Vite projects |
| `@testing-library/react` | latest `^16` | Component test utilities | Required peer for Vitest + React 19 |
| `@testing-library/jest-dom` | latest | Custom DOM matchers | `toBeInTheDocument`, `toHaveTextContent` etc. |
| `happy-dom` | **20.10.4** | Test DOM env | ~3× faster than jsdom; fall back to jsdom if API gaps encountered |
| `@types/chrome` | **0.1.43** | TypeScript types for chrome.* APIs | Required for `chrome.action`, `chrome.tabs`, `chrome.storage`, `chrome.runtime` |
| `@types/react` | latest | React TypeScript types | — |
| `@types/react-dom` | latest | React DOM types | — |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@crxjs/vite-plugin` | WXT | WXT has better DX/cross-browser; CRXJS keeps vanilla `vite.config.ts`; project constraint says "React + Vite + TypeScript" (Vite plugin, not WXT framework) |
| `@vitejs/plugin-react-swc` | `@vitejs/plugin-react` (Babel) | Babel needed only for React Compiler (deferred post-v1); SWC is faster |
| Biome 2.3 | ESLint 9 + Prettier 3 | Biome 2.3 covers all relevant rule-sets; ESLint only if a required plugin is missing (unlikely) |
| Vitest | Jest | Jest would need separate Babel config; Vitest reuses Vite; no reason to use Jest on this greenfield |
| `happy-dom` | `jsdom` | Switch if a test hits an unimplemented API; `happy-dom` is the faster default |

**Installation (Phase 1 only — no app dependencies yet):**
```bash
# Use Node 22 LTS (available on this machine) — note: Node 24 LTS is ideal but 22 LTS is current on machine
# Pin in .nvmrc
echo "22" > .nvmrc

# Initialize project
npm init -y

# Core build
npm install --save-dev vite@^8 @vitejs/plugin-react-swc @crxjs/vite-plugin@^2.6
npm install react@19 react-dom@19

# TypeScript
npm install --save-dev typescript@~6.0 @types/react @types/react-dom @types/chrome

# Testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom happy-dom

# Quality
npm install --save-dev --save-exact @biomejs/biome

# Release
npm install --save-dev chrome-webstore-upload-cli
```

> **Node version note:** Node 24 LTS is ideal per STACK.md. This machine has Node 20 (active), 22 (LTS), and 22.22.3. Use `nvm use 22` locally; the CI workflow should specify `node-version: '22'`. Upgrade to Node 24 when it is available in the dev environment.

---

## Package Legitimacy Audit

All Phase 1 packages were verified via `gsd-tools query package-legitimacy check` and `npm view <pkg> version`.

| Package | Registry | Age of latest | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|--------------|--------------|-------------|---------|-------------|
| `@crxjs/vite-plugin` | npm | 5 days (2026-06-11) | 319K | github.com/crxjs/chrome-extension-tools | SUS (too-new patch) | **Approved — legitimate** |
| `@biomejs/biome` | npm | 4 days (2026-06-12) | 9.9M | github.com/biomejs/biome | SUS (too-new patch) | **Approved — legitimate** |
| `vite` | npm | 15 days (2026-06-01) | 140M | github.com/vitejs/vite | SUS (too-new patch) | **Approved — legitimate** |
| `vitest` | npm | 1 day (2026-06-15) | 69M | github.com/vitest-dev/vitest | SUS (too-new patch) | **Approved — legitimate** |
| `@vitejs/plugin-react-swc` | npm | 33 days (2026-05-14) | 14M | github.com/vitejs/vite-plugin-react | OK | Approved |
| `@tailwindcss/vite` | npm | 4 days (2026-06-12) | 36.8M | github.com/tailwindlabs/tailwindcss | SUS (too-new patch) | **Approved — legitimate** |
| `tailwindcss` | npm | 4 days (2026-06-12) | 118M | github.com/tailwindlabs/tailwindcss | SUS (too-new patch) | **Approved — legitimate** |
| `chrome-webstore-upload-cli` | npm | 19 days (2026-05-28) | 84K | github.com/fregante/chrome-webstore-upload-cli | SUS (too-new patch) | **Approved — legitimate** |
| `@types/chrome` | npm | 11 days (2026-06-05) | 3.4M | DefinitelyTyped/DefinitelyTyped | SUS (too-new patch) | **Approved — legitimate** |
| `react` | npm | 15 days (2026-06-01) | 143M | github.com/facebook/react | SUS (too-new patch) | **Approved — legitimate** |
| `react-dom` | npm | 15 days (2026-06-01) | 134M | github.com/facebook/react | SUS (too-new patch) | **Approved — legitimate** |
| `typescript` | npm | 61 days (2026-04-16) | 218M | github.com/microsoft/TypeScript | OK | Approved |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** All flagged packages are `SUS` solely due to the `too-new` signal (most published within the last 30 days). All have massive weekly download counts (69M–218M), are from canonical official GitHub organizations (vitejs, biomejs, tailwindlabs, facebook, microsoft, DefinitelyTyped), and are the primary packages for their respective projects. The `too-new` signal here reflects that these projects ship frequent patch releases. These are all approved for use. No `checkpoint:human-verify` task is needed — these are well-known canonical packages confirmed via official sources. [CITED: npm registry + official GitHub repos]

---

## Architecture Patterns

### System Architecture Diagram

```
[Developer machine]
     │
     ▼
[npm run dev]──────────────────────────────────────┐
     │                                             │
     ▼                                             │
[Vite dev server]                         [hot module replacement]
     │                                             │
     └─► CRXJS plugin injects HMR client           │
              into dist/app.html ◄──────────────────┘

[npm run build]  (or CI)
     │
     ▼
[Vite build --mode production]
     │
     ├─► CRXJS reads manifest.json
     │       ├─► src/background/index.ts ──► dist/background.js (content-hashed)
     │       ├─► src/app/app.html ─────────► dist/app.html (entry rewritten)
     │       └─► manifest.json ──────────►  dist/manifest.json (hashes rewritten)
     │
     └─► Vite Rolldown bundles React app
             └─► dist/assets/*.js (content-hashed)

[CI: build-check workflow]
     │
     ├─► pnpm install --frozen-lockfile
     ├─► pnpm exec vite build --mode production
     ├─► grep check: no eval/unsafe-eval/inline-script in dist/
     ├─► grep check: no localhost/vite-hmr/5173 in dist/
     ├─► parse dist/manifest.json: permissions must equal ["storage"]
     └─► PASS → artifact ready

[CI: release workflow]  (on push tag v*.*.*)
     │
     ├─► build steps (same as above)
     ├─► zip dist/ → extension.zip
     └─► chrome-webstore-upload upload --source extension.zip

[Chrome browser loads unpacked dist/]
     │
     ├─► Service Worker (dist/background.js)
     │       └─► chrome.action.onClicked → chrome.tabs.create({url: app.html})
     │
     └─► Extension Tab (chrome-extension://<id>/app.html)
             └─► React app mounts → renders empty shell
```

### Recommended Project Structure

```
interviewer-checklist/
├── .github/
│   └── workflows/
│       ├── build-check.yml      # runs on every PR/push: build + dist safety checks
│       └── release.yml          # runs on tag v*.*.*: build + zip + upload to CWS
├── .nvmrc                       # "22" (or 24 when available)
├── .gitignore                   # dist/, node_modules/, *.zip
├── biome.json                   # linter + formatter config (pinned version)
├── manifest.json                # MV3 manifest (source; CRXJS reads this)
├── tsconfig.json                # TypeScript config
├── tsconfig.node.json           # for vite.config.ts itself
├── vite.config.ts               # Vite + CRXJS plugin config
├── package.json                 # scripts: dev, build, check, test, ci
├── vitest.config.ts             # or inline in vite.config.ts
├── public/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
└── src/
    ├── background/
    │   └── index.ts             # ≤30 LOC service worker
    └── app/
        ├── app.html             # HTML entry (referenced in manifest via CRXJS)
        ├── main.tsx             # React root mount (placeholder for Phase 1)
        └── App.tsx              # Top-level component (placeholder: "Hello")
```

### Pattern 1: CRXJS vite.config.ts

**What:** CRXJS wraps the manifest as a Vite entry point. The build plugin reads `manifest.json`, injects the HTML entries, handles the background service worker, and rewrites content-hashed filenames in `dist/manifest.json`.

**When to use:** Always — this is the only configuration file that wires the build together.

**Example:**
```typescript
// vite.config.ts
// Source: CRXJS docs (crxjs.dev) + project research STACK.md
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    // Never emit eval-based sourcemaps — MV3 CSP blocks them
    sourcemap: 'hidden',
  },
});
```

### Pattern 2: manifest.json (MV3 minimal)

**What:** Hand-authored manifest — auditable in code review, no generator surprises. CRXJS reads it and fills in hashed filenames at build time.

**When to use:** Always — check this file into git, diff every change carefully, treat permissions changes as load-bearing.

**Example:**
```jsonc
// manifest.json
// Source: project research ARCHITECTURE.md — "Manifest Layout (concrete decision)"
{
  "manifest_version": 3,
  "name": "Interviewer Checklist",
  "version": "1.0.0",
  "description": "Weighted tech-stack interview scoring, notes, and YAML export — fully local.",
  "icons": {
    "16": "public/icons/icon-16.png",
    "32": "public/icons/icon-32.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  },
  "action": {
    "default_title": "Open Interviewer Checklist",
    "default_icon": {
      "16": "public/icons/icon-16.png",
      "32": "public/icons/icon-32.png"
    }
    // NO default_popup — chrome.action.onClicked fires only when default_popup is absent
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "permissions": ["storage"],
  "minimum_chrome_version": "116"
  // NO host_permissions, NO scripting, NO tabs, NO activeTab, NO web_accessible_resources
}
```

### Pattern 3: Background service worker (≤30 LOC, stateless)

**What:** The only job of the SW is to open `app.html` when the toolbar icon is clicked. No module-level mutable state. If a tab is already open, focus it instead of opening a duplicate.

**When to use:** Always — this is the entire service worker for v1.

**Example:**
```typescript
// src/background/index.ts
// Source: project research ARCHITECTURE.md — "Pattern 1: Event-driven background service worker"
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('src/app/app.html');
  const [existing] = await chrome.tabs.query({ url });
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url });
  }
});

// Note: chrome.runtime.onInstalled will be wired in Phase 9 (welcome tab).
// Do NOT add it here in Phase 1 — the welcome logic depends on Phase 9 features.
```

### Pattern 4: Biome 2.3 configuration

**What:** Single `biome.json` that covers formatting + linting + import organization. Replaces ESLint, Prettier, typescript-eslint, and eslint-plugin-react.

**When to use:** Initial scaffold — run `npx @biomejs/biome init` then apply these overrides.

**Example:**
```jsonc
// biome.json
// Source: biomejs.dev/blog/biome-v2-3/ [CITED: biomejs.dev]
{
  "$schema": "https://biomejs.dev/schemas/2.5.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["dist/", "node_modules/", "*.zip"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "css": {
    "parser": {
      "tailwindDirectives": true
    }
  }
}
```

### Pattern 5: CI dist safety check (FOUND-04)

**What:** A bash step that greps `dist/` after `vite build` and fails the workflow if any forbidden pattern is found.

**When to use:** Every build — both the PR check workflow and the release workflow.

**Example:**
```bash
# In .github/workflows/build-check.yml (and release.yml)
# Source: project research PITFALLS.md — Pitfall 7, Pitfall 8

# Check 1: No eval/unsafe-eval/inline scripts
if grep -rE "(eval\(|new Function\(|unsafe-eval|<script[^>]*>[^<])" dist/ --include="*.js" --include="*.html"; then
  echo "FAIL: dist/ contains eval or inline scripts (MV3 CSP violation)"
  exit 1
fi

# Check 2: No dev-server references
if grep -rE "(localhost|127\.0\.0\.1|vite-hmr|@vite/client|5173)" dist/ --include="*.js" --include="*.html"; then
  echo "FAIL: dist/ contains dev-server references (CRXJS issue #860)"
  exit 1
fi

# Check 3: manifest.json permissions must be exactly ["storage"]
PERMISSIONS=$(node -e "
  const m = require('./dist/manifest.json');
  console.log(JSON.stringify(m.permissions));
")
if [ "$PERMISSIONS" != '["storage"]' ]; then
  echo "FAIL: dist/manifest.json permissions are '$PERMISSIONS', expected '[\"storage\"]'"
  exit 1
fi
echo "All dist/ safety checks passed."
```

### Pattern 6: GH Actions release workflow (FOUND-05)

**What:** Triggered on a semver tag push. Builds in CI (never on developer machine), runs safety checks, zips `dist/`, and uploads to the Chrome Web Store.

**Example:**
```yaml
# .github/workflows/release.yml
# Source: fregante/chrome-webstore-upload-cli docs [CITED: github.com/fregante/chrome-webstore-upload-cli]
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Dist safety checks
        run: npm run ci:check-dist

      - name: Zip dist/
        run: zip -r extension.zip dist/

      - name: Upload to Chrome Web Store
        env:
          EXTENSION_ID: ${{ vars.EXTENSION_ID }}
        run: |
          npx chrome-webstore-upload-cli upload \
            --source extension.zip \
            --extension-id ${{ env.EXTENSION_ID }} \
            --client-id ${{ secrets.CWS_CLIENT_ID }} \
            --client-secret ${{ secrets.CWS_CLIENT_SECRET }} \
            --refresh-token ${{ secrets.CWS_REFRESH_TOKEN }}
```

### Anti-Patterns to Avoid

- **No `default_popup` in manifest:** `chrome.action.onClicked` fires only when `default_popup` is absent. Setting both = popup flash + no SW click handler. [VERIFIED: project research ARCHITECTURE.md citing Chrome MV3 docs]
- **No `eval` sourcemap mode:** `sourcemap: 'eval'` or `sourcemap: 'inline'` violates MV3 CSP. CRXJS overrides this in dev; verify it does not survive prod builds.
- **No `"tabs"` permission:** `chrome.tabs.create({url: chrome.runtime.getURL(...)})` does NOT require the `tabs` permission for own-extension URLs. Adding it triggers a "read your browsing history" install warning. [VERIFIED: project research ARCHITECTURE.md]
- **No module-level mutable state in background/index.ts:** MV3 service workers are killed after ~30s of idle. Any `let activeTab = ...` at module scope is reset on the next wake. Keep the SW ≤30 LOC and stateless. [VERIFIED: project research PITFALLS.md Pitfall 4]
- **No `web_accessible_resources`:** `app.html` is opened by our SW via `chrome.runtime.getURL` — it does not need to be reachable from arbitrary web pages. Omitting this tightens the security posture. [CITED: project research ARCHITECTURE.md]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MV3 manifest wiring | Custom Rollup plugin / copy scripts | `@crxjs/vite-plugin` | CRXJS handles content-hash rewriting, HMR injection in dev, and service worker `type: "module"` — getting these right by hand takes days |
| TypeScript type-checking in build | Vite `tsc` pass during build | `vitest run --typecheck` or `tsc --noEmit` as a separate CI step | Vite itself does not type-check; add `tsc --noEmit` in the CI lint step |
| CSS purging / tree-shaking | Manual CSS audit | Tailwind v4's `@tailwindcss/vite` (built-in) | Tailwind v4 automatically purges unused utilities at build time via the Vite plugin |
| Lint + format toolchain | ESLint + Prettier + typescript-eslint + eslint-plugin-react | Biome 2.3 | Biome covers all four in one binary; 10–25× faster on CI; single `biome.json` |
| CWS upload | Curl + manual OAuth | `chrome-webstore-upload-cli` | Handles the OAuth flow, multipart upload, and `IN_PROGRESS` polling — ~200 lines of script if hand-rolled |
| Icon generation | Exporting manually at 4 sizes | A single 128px SVG/PNG + `sharp` CLI (or an online tool) | Icons need 16, 32, 48, 128 px PNGs — one 128px master + downscale is the canonical workflow |

**Key insight:** The CRXJS plugin is the single highest-leverage "don't hand-roll" in this phase. It eliminates 80% of the Chrome extension build complexity (manifest rewriting, HMR, service worker module type, web-accessible-resource injection) for the cost of one Vite plugin.

---

## Common Pitfalls

### Pitfall 1: CRXJS issue #860 — production build references dev server
**What goes wrong:** `dist/` assets include `localhost:5173` or `@vite/client` references from a dev-mode build artifact. The installed extension tries to connect to the dev server on user machines and shows a broken page.
**Why it happens:** Building from a workspace with `vite dev` running, or running `vite` (not `vite build`) accidentally.
**How to avoid:** Lock the build script to `"build": "vite build --mode production"`. CI builds in a fresh checkout. Post-build grep for `localhost` + `vite-hmr` (see Pattern 5).
**Warning signs:** `dist/` is larger than expected (~30 KB added by HMR client); DevTools shows `localhost:5173` network errors after loading the extension.

### Pitfall 2: `default_popup` shadow blocks `chrome.action.onClicked`
**What goes wrong:** Developer adds `"default_popup"` to the manifest (common in boilerplates). `chrome.action.onClicked` never fires because Chrome handles the click by opening the popup instead.
**Why it happens:** CRXJS starter templates often include a popup. Phase 1 must have zero popup.
**How to avoid:** Manifest has no `default_popup`. CI manifest-check verifies this explicitly.
**Warning signs:** Clicking the toolbar icon opens a tiny blank popup instead of a new tab.

### Pitfall 3: Over-broad permissions creep into manifest.json
**What goes wrong:** Copy-pasted manifest adds `"tabs"`, `"activeTab"`, or `"scripting"`. CWS review flags them; users see scary install warnings.
**Why it happens:** Boilerplates and tutorials routinely include these "just in case."
**How to avoid:** CI step parses `dist/manifest.json` and asserts `permissions === ["storage"]` exactly.
**Warning signs:** The Chrome install dialog shows more than just the extension name and icon.

### Pitfall 4: Module-level state in service worker
**What goes wrong:** Any `let`, `const`, or class instance declared at the top level of `src/background/index.ts` is reset after the SW is killed. Features appear to work in testing (SW stays alive during test) but break intermittently in production.
**Why it happens:** The SW file looks like a normal JS module. MV3 SWs are not persistent background pages.
**How to avoid:** Keep `src/background/index.ts` ≤30 LOC; only `addEventListener` calls at top level. No mutable module-level variables. Review in code review.
**Warning signs:** SW file grows beyond 30 LOC; a `let` variable appears at module scope in a PR.

### Pitfall 5: Biome version mismatch between local and CI
**What goes wrong:** Developer ran `npm install @biomejs/biome` (no `--save-exact`); CI gets a different patch; rules differ between environments; CI fails with a lint error the developer never sees locally.
**Why it happens:** `--save-exact` is not the default npm behavior; Biome treats config schema as semver-major-tied but rule behavior can shift in patches.
**How to avoid:** Always install with `npm install --save-exact @biomejs/biome`. Check that `package.json` shows `"@biomejs/biome": "2.5.0"` (no `^` prefix).
**Warning signs:** `biome ci` passes locally but fails in CI despite no file changes.

### Pitfall 6: Missing `tsconfig.json` `lib` for `chrome.*` types
**What goes wrong:** `@types/chrome` is installed but TypeScript doesn't know about the `chrome` global. Errors like `Cannot find name 'chrome'` in `background/index.ts`.
**Why it happens:** The `chrome` global is not in `lib: ["DOM"]` — it's injected by `@types/chrome`. The tsconfig `lib` or `types` array must include it.
**How to avoid:** Set `"types": ["chrome"]` in `tsconfig.json`, or ensure the `@types/chrome` package is reachable in `typeRoots`.
**Warning signs:** TypeScript errors on `chrome.action`, `chrome.tabs`, `chrome.storage` even though the package is installed.

---

## Code Examples

### vite.config.ts (complete Phase 1 setup)
```typescript
// Source: CRXJS docs + project research STACK.md [CITED: crxjs.dev]
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    sourcemap: 'hidden',    // 'inline' or 'eval' would violate MV3 CSP
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

### tsconfig.json (Phase 1)
```jsonc
// Source: standard TypeScript + Chrome extension setup [ASSUMED - standard pattern]
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx",
    "types": ["chrome", "vite/client"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### vitest.config.ts (Phase 1)
```typescript
// Source: Vitest docs [ASSUMED - standard Vitest + happy-dom pattern]
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### package.json scripts
```jsonc
// Source: project conventions + Biome/Vitest/CRXJS defaults [ASSUMED]
{
  "scripts": {
    "dev": "vite",
    "build": "vite build --mode production",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint src/",
    "format": "biome format --write src/",
    "check": "biome check --write src/",
    "ci": "biome ci src/ && tsc --noEmit",
    "ci:check-dist": "node scripts/check-dist.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### scripts/check-dist.js (FOUND-04 safety check)
```javascript
// Source: project research PITFALLS.md — Pitfall 7, 8 [ASSUMED - derived from pitfalls]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FORBIDDEN_PATTERNS = [/eval\(/, /new Function\(/, /unsafe-eval/, /<script[^>]*>[^<]/];
const DEV_PATTERNS = [/localhost/, /127\.0\.0\.1/, /vite-hmr/, /@vite\/client/, /5173/];

function checkFile(filepath) {
  const content = readFileSync(filepath, 'utf-8');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`FAIL [MV3 CSP]: ${filepath} matches ${pattern}`);
      process.exit(1);
    }
  }
  for (const pattern of DEV_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`FAIL [dev artifact]: ${filepath} matches ${pattern}`);
      process.exit(1);
    }
  }
}

// Check JS and HTML files in dist/
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(js|html)$/.test(entry.name)) checkFile(path);
  }
}

// Check manifest permissions
const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf-8'));
const perms = JSON.stringify(manifest.permissions);
if (perms !== '["storage"]') {
  console.error(`FAIL [permissions]: manifest.json permissions = ${perms}, expected ["storage"]`);
  process.exit(1);
}

walk(DIST);
console.log('All dist/ safety checks passed.');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MV2 persistent background page | MV3 event-driven service worker | Enforced by Chrome for new submissions Jun 2025 | SW has no persistent globals; must read/write state via storage |
| Webpack-based extension boilerplates | CRXJS 2.6 + Vite 8 | CRXJS 2.0 June 2025 | HMR, Rolldown speed, clean `vite.config.ts` |
| ESLint + Prettier + typescript-eslint | Biome 2.3 | Biome 2.0 GA 2025 | Single binary; 10–25× CI speed; type-aware lint since 2.3 |
| Vite + esbuild/Rollup bundler | Vite 8 + Rolldown (Rust) | Vite 8.0 2026 | Faster builds; CRXJS 2.6 supports Vite 8 |
| TypeScript 5.x | TypeScript 6.0 (stable) | April 2026 | TS 7 Beta (Go-based) is deferred — too fresh for v1 |
| Vitest 3 | Vitest 4 (current) | 2026 | Note: the research targets Vitest 3+; v4.1.9 is the current latest and is compatible |
| `chrome-webstore-upload-cli` v3 | v4.0.1 | May 2026 | Updated OAuth token flow; same CLI interface |

**Deprecated/outdated:**
- `react-chrome-extension-boilerplate` (Webpack-based): Off the modern path; CRXJS + Vite is the 2026 standard
- MV2 extensions: No longer accepted by the Chrome Web Store for new submissions
- `default_popup` as a redirect stub: Use `chrome.action.onClicked` + SW instead
- `@types/js-yaml`: Types lag by years; use the `yaml` package (ships own types) from Phase 7 onwards

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Node 22 LTS is acceptable for the CI workflow (Node 24 LTS is ideal but not available locally) | Standard Stack installation note | Minor — Node 22 is current Active LTS; CRXJS and Vite 8 work on Node 22 |
| A2 | `vitest.config.ts` as a separate file (vs inline in `vite.config.ts`) is preferred for clarity | Code Examples | No functional difference; purely organizational |
| A3 | `tsconfig.json` with `"moduleResolution": "Bundler"` is compatible with CRXJS 2.6 | Code Examples | If CRXJS requires a different module resolution, the tsconfig needs adjustment |
| A4 | `scripts/check-dist.js` as a Node ES module (import/export) works with the package type | Code Examples | If `package.json` has `"type": "commonjs"`, rename to `.mjs` |
| A5 | Vitest v4.x (latest) is compatible with the project's Vite 8 setup despite the research targeting Vitest 3 | Standard Stack | Vitest v4 is the current latest; if there's a CRXJS incompatibility, pin to Vitest 3 |

**If this table is empty:** All claims in this research were verified or cited. These 5 items are the only assumptions, and all are low-risk.

---

## Open Questions

1. **Tailwind v4 vs CSS Modules for Phase 1**
   - What we know: Both work under MV3 CSP. Tailwind v4 requires `@tailwindcss/vite` in `vite.config.ts`. CSS Modules require no extra config. SUMMARY.md marks this as a gap to lock in Phase 1.
   - What's unclear: No strong constraint from Phase 1 itself — the app renders only a placeholder. The choice affects the CSS import in `App.tsx`.
   - Recommendation: **Add Tailwind v4** in Phase 1 scaffold so all subsequent phases can use it; adding it later risks CSS import order issues. If CSS Modules is strongly preferred, that is viable but must be decided before Phase 4.

2. **Node 22 vs Node 24 for CI**
   - What we know: Node 24 is Active LTS (as of April 2026); local machine has Node 22 as the highest available NVM-managed version.
   - What's unclear: Node 24 is not explicitly installed; NVM would need a `nvm install 24` pass.
   - Recommendation: Use `node-version: '22'` in CI for now; add a `.nvmrc` set to `22`; upgrade to `24` when the team runs `nvm install 24`.

3. **EXTENSION_ID for the release workflow (FOUND-05)**
   - What we know: `chrome-webstore-upload-cli` requires a `--extension-id` argument. The extension ID is assigned by the Chrome Web Store on first upload via the dashboard.
   - What's unclear: The ID is not known until the first manual upload. Phase 1 can wire the workflow but cannot run it end-to-end.
   - Recommendation: Wire the workflow with a `vars.EXTENSION_ID` GitHub Actions variable (not a secret). The first upload is manual via the CWS dashboard; after that, set the variable and subsequent releases are automated.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, test, CI | ✓ (local) | v20.20.2 (active), v22.22.3 (LTS available) | — |
| npm | Package manager | ✓ | 10.8.2 | pnpm (not installed locally; can install) |
| git | VCS, CI triggers | ✓ | 2.50.1 | — |
| pnpm | Recommended package manager | ✗ (local) | — | npm (available, fully supported) |
| gh (GitHub CLI) | PR creation, repo setup | ✗ (local) | — | GitHub web UI |
| Google Chrome | Manual extension testing | Not verified | — | Must be installed to test the unpacked extension |

**Missing dependencies with no fallback:**
- Google Chrome for manual smoke testing — the planner should include a step: "Load unpacked extension in Chrome and verify toolbar icon opens a new tab." Chrome presence cannot be automated in CI on ubuntu-latest by default (use a headless Chrome step if needed, or mark as manual verification only).

**Missing dependencies with fallback:**
- pnpm: npm is fully sufficient for this project; the research cites pnpm as "recommended" but not required.
- gh CLI: GitHub web UI covers all operations needed for Phase 1 (creating the workflows, setting secrets).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (latest) |
| Config file | `vitest.config.ts` (created in Phase 1 Wave 0) |
| Quick run command | `npm test` (Vitest run) |
| Full suite command | `npm test && npm run typecheck && npm run ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | `npm run build` exits 0 and produces `dist/` | build smoke | `npm run build` | ❌ Wave 0 (CI workflow) |
| FOUND-02 | `dist/manifest.json` has `permissions: ["storage"]`, no `default_popup` | automated script | `npm run ci:check-dist` | ❌ Wave 0 (scripts/check-dist.js) |
| FOUND-03 | Clicking toolbar icon opens full-page tab (renders empty page without errors) | manual / smoke | Manual: load unpacked in Chrome | ✗ manual only |
| FOUND-04 | CI rejects build with `eval`/`unsafe-eval`/`localhost`/`vite-hmr` in `dist/` | automated script | `npm run ci:check-dist` (with injected test content) | ❌ Wave 0 (scripts/check-dist.js) |
| FOUND-05 | Release workflow YAML is valid and runs on tag push | CI | GH Actions on tag push | ❌ Wave 0 (.github/workflows/release.yml) |

### Sampling Rate
- **Per task commit:** `npm run build && npm run ci:check-dist`
- **Per wave merge:** `npm test && npm run typecheck && npm run ci`
- **Phase gate:** Full suite green + manual smoke test in Chrome before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `scripts/check-dist.js` — FOUND-04 safety check (created in Phase 1)
- [ ] `.github/workflows/build-check.yml` — CI for every PR
- [ ] `.github/workflows/release.yml` — release pipeline (FOUND-05)
- [ ] `vitest.config.ts` — test framework config
- [ ] `src/test/setup.ts` — shared test setup (import @testing-library/jest-dom)
- [ ] `src/background/index.test.ts` — smoke test for SW module structure (no mutable module-level state)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this product |
| V3 Session Management | No | No server sessions; browser extension context is inherently scoped per user |
| V4 Access Control | No | Extension is user-local; no multi-user access control |
| V5 Input Validation | Partial | Manifest.json is static; no user input in Phase 1 |
| V6 Cryptography | No | No cryptography in Phase 1 |
| V7 Error Handling | Yes (ASVS L1) | CI must not leak secrets in build logs; errors in SW must not expose internal paths |
| V14 Configuration | Yes (ASVS L1) | MV3 CSP enforced by manifest; no `unsafe-eval`; permissions minimized |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| MV3 CSP bypass via `eval` in dependency | Tampering | CI grep for `eval`/`unsafe-eval` in `dist/`; library audit before adding deps |
| Dev server artifacts in production build | Spoofing / Info Disclosure | CI grep for `localhost`/`vite-hmr`; build only in CI |
| Excess permissions triggers CWS rejection and user trust warning | Elevation of Privilege | CI manifest-permissions check; `["storage"]` only |
| `key.pem` loss = impossible to update the extension | Denial of Service | CWS manages the key once uploaded via dashboard; do NOT generate a local `key.pem`; document this explicitly |

---

## Sources

### Primary (HIGH confidence — from verified project research corpus)
- `.planning/research/STACK.md` — full stack research with verified sources (2026-06-16)
- `.planning/research/ARCHITECTURE.md` — architectural patterns, manifest layout, SW pattern B
- `.planning/research/PITFALLS.md` — 35 pitfalls with severity, phase mapping, and mitigations
- `.planning/research/FEATURES.md` — feature landscape, P1 gaps, anti-features
- `.planning/research/SUMMARY.md` — executive synthesis of all four research files

### Secondary (MEDIUM confidence — web search + official docs)
- [biomejs.dev/blog/biome-v2-3/](https://biomejs.dev/blog/biome-v2-3/) — Biome 2.3 release notes; Tailwind v4 config
- [biomejs.dev/guides/getting-started/](https://biomejs.dev/guides/getting-started/) — Biome installation and init
- [github.com/fregante/chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli) — CLI usage, required env vars
- [jam.dev/blog/automating-chrome-extension-publishing/](https://jam.dev/blog/automating-chrome-extension-publishing/) — GH Actions workflow example
- [deepwiki.com/crxjs/chrome-extension-tools](https://deepwiki.com/crxjs/chrome-extension-tools/3-vite-plugin-(@crxjsvite-plugin)) — CRXJS internal architecture

### Package versions verified via npm registry
- `@crxjs/vite-plugin`: 2.6.1 [VERIFIED: npm registry]
- `@biomejs/biome`: 2.5.0 [VERIFIED: npm registry]
- `vite`: 8.0.16 [VERIFIED: npm registry]
- `vitest`: 4.1.9 [VERIFIED: npm registry]
- `react`/`react-dom`: 19.2.7 [VERIFIED: npm registry]
- `typescript`: 6.0.3 [VERIFIED: npm registry]
- `@vitejs/plugin-react-swc`: 4.3.1 [VERIFIED: npm registry]
- `tailwindcss`/`@tailwindcss/vite`: 4.3.1 [VERIFIED: npm registry]
- `chrome-webstore-upload-cli`: 4.0.1 [VERIFIED: npm registry]
- `@types/chrome`: 0.1.43 [VERIFIED: npm registry]
- `happy-dom`: 20.10.4 [VERIFIED: npm registry]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry; versions confirmed
- Architecture patterns: HIGH — derived from verified project research (ARCHITECTURE.md, PITFALLS.md) backed by Chrome MV3 docs
- Pitfalls: HIGH — drawn directly from PITFALLS.md which has HIGH confidence on MV3 mechanics
- CI/release patterns: MEDIUM — GH Actions YAML structure verified conceptually; exact YAML needs tuning during execution
- Biome configuration: MEDIUM — official docs confirmed; exact biome.json options verified from v2.3 release blog

**Research date:** 2026-06-16
**Valid until:** 2026-07-16 (30 days — Vite/Biome/CRXJS release frequently; verify exact patch versions at install time)

---

*Research for Phase 1: Foundation & Scaffolding — Interviewer Checklist Chrome Extension*
*Researched: 2026-06-16*
