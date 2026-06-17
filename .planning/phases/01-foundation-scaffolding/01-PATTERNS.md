# Phase 1: Foundation & Scaffolding - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 16 new files
**Analogs found:** 0 / 16 (greenfield — all patterns sourced from ecosystem standards)

---

## Note on Greenfield Status

This is a brand-new repository with no existing `src/` tree. There are no in-codebase analogs to copy from. Every pattern below is sourced from:

- RESEARCH.md — concrete code examples derived from project research corpus (ARCHITECTURE.md, PITFALLS.md, STACK.md)
- Chrome MV3 + CRXJS 2.6 + Vite 8 + React 19 + TypeScript 6 ecosystem conventions

The planner must treat every "Analog" reference as "standard ecosystem pattern" rather than a path to copy from the working tree.

---

## File Classification

| New File | Role | Data Flow | Closest Analog (ecosystem) | Match Quality |
|----------|------|-----------|-----------------------------|---------------|
| `package.json` | config | — | Standard npm package with Vite scripts | exact (ecosystem) |
| `manifest.json` | config | — | Chrome MV3 minimal manifest | exact (ecosystem) |
| `vite.config.ts` | config | — | CRXJS + Vite 8 plugin config | exact (ecosystem) |
| `tsconfig.json` | config | — | TypeScript Bundler-mode config | exact (ecosystem) |
| `tsconfig.node.json` | config | — | TypeScript config for Vite node context | exact (ecosystem) |
| `biome.json` | config | — | Biome 2.x lint + format config | exact (ecosystem) |
| `vitest.config.ts` | config | — | Vitest + happy-dom config | exact (ecosystem) |
| `.nvmrc` | config | — | Single-line Node version pin | exact (ecosystem) |
| `.gitignore` | config | — | Node/Vite/Chrome extension ignores | exact (ecosystem) |
| `src/background/index.ts` | service-worker | event-driven | Chrome MV3 Pattern B (action → tab) | exact (ecosystem) |
| `src/app/app.html` | config | — | CRXJS HTML entry point | exact (ecosystem) |
| `src/app/main.tsx` | component | request-response | React 19 root mount | exact (ecosystem) |
| `src/app/App.tsx` | component | request-response | React 19 top-level component | exact (ecosystem) |
| `src/test/setup.ts` | test | — | Vitest + @testing-library/jest-dom setup | exact (ecosystem) |
| `scripts/check-dist.js` | utility | batch | Node FS scan + exit-code guard | exact (ecosystem) |
| `.github/workflows/build-check.yml` | config | — | GH Actions build + safety check workflow | exact (ecosystem) |
| `.github/workflows/release.yml` | config | — | GH Actions release + CWS upload workflow | exact (ecosystem) |

---

## Pattern Assignments

### `package.json` (config)

**Source:** RESEARCH.md "Code Examples — package.json scripts" + standard npm init

**Scripts pattern:**
```jsonc
{
  "type": "module",
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

**Key constraints:**
- `"type": "module"` required so `scripts/check-dist.js` can use ES `import` syntax
- `@biomejs/biome` must be pinned with `--save-exact` (no `^` prefix) to prevent version drift between local and CI
- `chrome-webstore-upload-cli` is a dev dependency only (release pipeline uses it; not bundled)

**Dev dependency install commands (exact versions):**
```bash
npm install --save-dev vite@^8 @vitejs/plugin-react-swc @crxjs/vite-plugin@^2.6
npm install react@19 react-dom@19
npm install --save-dev typescript@~6.0 @types/react @types/react-dom @types/chrome
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom happy-dom
npm install --save-dev --save-exact @biomejs/biome
npm install --save-dev chrome-webstore-upload-cli
npm install --save-dev @tailwindcss/vite tailwindcss
```

---

### `manifest.json` (config)

**Source:** RESEARCH.md "Pattern 2: manifest.json (MV3 minimal)"

**Complete pattern:**
```jsonc
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
  },
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "permissions": ["storage"],
  "minimum_chrome_version": "116"
}
```

**Critical omissions (intentional):**
- NO `default_popup` — its presence silences `chrome.action.onClicked` in the SW
- NO `host_permissions` — extension is fully local, no external requests
- NO `"tabs"` in permissions — `chrome.tabs.create` with an extension URL does not require it
- NO `"scripting"` — no content scripts in v1
- NO `web_accessible_resources` — SW opens the page via `chrome.runtime.getURL`; no web-origin access needed

---

### `vite.config.ts` (config)

**Source:** RESEARCH.md "Pattern 1: CRXJS vite.config.ts" + "Code Examples — vite.config.ts"

**Complete pattern:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  build: {
    // 'inline' or 'eval' violates MV3 CSP — never use those modes
    sourcemap: 'hidden',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

**Notes:**
- Plugin order matters: `react()` before `tailwindcss()` before `crx()`
- `crx({ manifest })` reads `manifest.json` as the Vite entry point; it rewrites content-hashed filenames in `dist/manifest.json` automatically
- `sourcemap: 'hidden'` generates `.map` files without referencing them from bundles — safe for MV3 CSP

---

### `tsconfig.json` (config)

**Source:** RESEARCH.md "Code Examples — tsconfig.json (Phase 1)"

**Complete pattern:**
```jsonc
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

**Notes:**
- `"types": ["chrome"]` is required — without it `chrome.*` globals are not visible even with `@types/chrome` installed (Pitfall 6)
- `"moduleResolution": "Bundler"` is the correct mode for Vite 8; not `"node16"` or `"nodenext"`
- `"allowImportingTsExtensions": true` allows `import './foo.ts'` in source; Vite/CRXJS resolves these

---

### `tsconfig.node.json` (config)

**Source:** Standard Vite TypeScript setup

**Complete pattern:**
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "scripts"]
}
```

**Notes:**
- Covers `vite.config.ts` and `vitest.config.ts` which run in Node context, not browser
- `"include": ["scripts"]` covers `scripts/check-dist.js` type inference if it were TS (it is JS)

---

### `biome.json` (config)

**Source:** RESEARCH.md "Pattern 4: Biome 2.3 configuration"

**Complete pattern:**
```jsonc
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

**Notes:**
- The `$schema` version must match the installed `@biomejs/biome` version exactly (pinned to `2.5.0`)
- `"useIgnoreFile": true` makes Biome respect `.gitignore` automatically
- `"tailwindDirectives": true` prevents Biome from flagging `@tailwind` directives as unknown CSS

---

### `vitest.config.ts` (config)

**Source:** RESEARCH.md "Code Examples — vitest.config.ts (Phase 1)"

**Complete pattern:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**Notes:**
- `globals: true` enables `describe`, `it`, `expect` without explicit imports (Jest-compatible)
- `environment: 'happy-dom'` is ~3x faster than jsdom; fall back to `jsdom` only if a test hits an unimplemented API
- `setupFiles` runs before every test file; used to import `@testing-library/jest-dom` matchers

---

### `.nvmrc` (config)

**Pattern:**
```
22
```

Single line. Node 22 LTS. Upgrade to `24` when the dev environment has it.

---

### `.gitignore` (config)

**Pattern:**
```gitignore
# Build output
dist/
*.zip

# Dependencies
node_modules/

# Local env / secrets
.env
.env.local

# OS
.DS_Store

# Editor
.vscode/
.idea/

# Chrome extension key (never commit — CWS manages it after first upload)
*.pem
key.pem
```

**Critical:** `key.pem` must be gitignored. Loss of the CWS-managed key is recoverable; committing it is a security incident.

---

### `src/background/index.ts` (service-worker, event-driven)

**Source:** RESEARCH.md "Pattern 3: Background service worker (≤30 LOC, stateless)"

**Complete pattern:**
```typescript
// src/background/index.ts
// ≤30 LOC — stateless MV3 service worker
// Only job: open app.html when toolbar icon is clicked
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
```

**Critical constraints:**
- NO module-level mutable variables (`let`, `const` holding state) — SW is killed after ~30s idle and all module-level state is reset (Pitfall 4)
- Only `addEventListener` calls at module top level
- `chrome.runtime.onInstalled` is intentionally omitted — welcome-tab logic is Phase 9
- NO `import` statements in Phase 1 — single-file, no dependencies

---

### `src/app/app.html` (config — CRXJS HTML entry point)

**Source:** Standard CRXJS full-page extension tab HTML entry

**Complete pattern:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interviewer Checklist</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Notes:**
- CRXJS reads this file as a Vite entry; it rewrites the `<script src>` to point to the content-hashed bundle in `dist/`
- NO inline `<style>` or `<script>` blocks — MV3 CSP blocks inline scripts
- `type="module"` on the script tag is required for CRXJS HMR injection in dev mode

---

### `src/app/main.tsx` (component, request-response)

**Source:** Standard React 19 root mount pattern

**Complete pattern:**
```tsx
// src/app/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Notes:**
- `StrictMode` is enabled in Phase 1; remove only if a third-party library has strict-mode incompatibilities (none expected in v1)
- Explicit null check with `throw` rather than `!` non-null assertion — catches misconfigured HTML at runtime
- No CSS import here in Phase 1 placeholder — add `import './index.css'` in Phase 4 when Tailwind is wired

---

### `src/app/App.tsx` (component, request-response)

**Source:** Standard React 19 top-level component (Phase 1 placeholder)

**Complete pattern:**
```tsx
// src/app/App.tsx
export function App() {
  return (
    <div>
      <h1>Interviewer Checklist</h1>
      <p>Phase 1 scaffold — feature work begins in Phase 2.</p>
    </div>
  );
}
```

**Notes:**
- Named export (`export function App`) not default export — consistent with the import in `main.tsx` and easier to tree-shake
- Minimal placeholder; Phase 2+ will replace the body entirely
- No CSS class names in Phase 1; Tailwind is added in Phase 4

---

### `src/test/setup.ts` (test)

**Source:** Standard Vitest + @testing-library/jest-dom setup file

**Complete pattern:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

**Notes:**
- Single import extends Vitest's `expect` with DOM matchers (`toBeInTheDocument`, `toHaveTextContent`, etc.)
- `vitest.config.ts` references this via `setupFiles: ['./src/test/setup.ts']`

---

### `scripts/check-dist.js` (utility, batch)

**Source:** RESEARCH.md "Code Examples — scripts/check-dist.js (FOUND-04 safety check)"

**Complete pattern:**
```javascript
// scripts/check-dist.js
// Runs after `npm run build`; called by `npm run ci:check-dist`
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

// Check for default_popup (must be absent)
if (manifest.action?.default_popup) {
  console.error(`FAIL [manifest]: action.default_popup is present — chrome.action.onClicked will not fire`);
  process.exit(1);
}

walk(DIST);
console.log('All dist/ safety checks passed.');
```

**Notes:**
- Uses `node:` prefix for built-in imports — required style for ES modules with `"type": "module"` in `package.json`
- Adds `default_popup` check (beyond what RESEARCH.md showed) — catches Pitfall 2
- `process.exit(1)` immediately on first failure; does not accumulate errors

---

### `.github/workflows/build-check.yml` (config)

**Source:** RESEARCH.md "Pattern 5: CI dist safety check" + standard GH Actions Node workflow

**Complete pattern:**
```yaml
# .github/workflows/build-check.yml
name: Build & Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint & type-check
        run: npm run ci

      - name: Build (production)
        run: npm run build

      - name: Dist safety checks
        run: npm run ci:check-dist
```

**Notes:**
- `npm ci` (not `npm install`) — uses lockfile exactly; fails if lockfile is out of sync
- `npm run ci` runs `biome ci src/ && tsc --noEmit` — lint + typecheck in one step
- Safety checks run AFTER build; if build fails, safety checks are skipped (correct — no dist to check)
- No artifact upload in this workflow (only build-check, not release)

---

### `.github/workflows/release.yml` (config)

**Source:** RESEARCH.md "Pattern 6: GH Actions release workflow (FOUND-05)"

**Complete pattern:**
```yaml
# .github/workflows/release.yml
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

      - name: Lint & type-check
        run: npm run ci

      - name: Build (production)
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

**Notes:**
- `vars.EXTENSION_ID` is a GH Actions variable (not a secret) — set it after the first manual CWS dashboard upload
- `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` are GH Actions secrets — OAuth credentials from Google Cloud Console
- Phase 1 can wire this workflow but cannot run it end-to-end until the extension is uploaded manually once to get the ID
- Safety checks are repeated here (do not assume the build-check workflow passed — tags can be pushed independently)

---

## Shared Patterns

### MV3 CSP Compliance
**Apply to:** `vite.config.ts`, `src/app/app.html`, `scripts/check-dist.js`, both CI workflows

The following are universally forbidden in any file that ends up in `dist/`:
- `eval(` — direct eval call
- `new Function(` — indirect eval
- `unsafe-eval` — CSP directive string
- Inline `<script>` blocks with content (not `type="module"` with src)
- `localhost`, `127.0.0.1`, `vite-hmr`, `@vite/client`, `5173` — dev server artifacts

Enforcement chain: `vite.config.ts` sets `sourcemap: 'hidden'` → `scripts/check-dist.js` greps `dist/` → both CI workflows call `npm run ci:check-dist`.

### Minimal Permissions Posture
**Apply to:** `manifest.json`, `scripts/check-dist.js`

`permissions` must equal exactly `["storage"]`. No other permission may be added without a code-review justification and CI check update. The check-dist script validates this on every build.

### ES Module Style
**Apply to:** All `.ts`, `.tsx`, `.js` files

- Named exports preferred over default exports for components and utilities
- `node:` prefix for Node built-in imports in scripts (e.g., `node:fs`, `node:path`)
- No CommonJS (`require`, `module.exports`) — `"type": "module"` in `package.json` enforces this

### TypeScript Strict Mode
**Apply to:** All `.ts` and `.tsx` files

`"strict": true` in `tsconfig.json` enables: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`. No `// @ts-ignore` comments; address type errors at source.

---

## No Analog Found

All files in this phase are greenfield — no in-repo analogs exist. The table below lists files where the ecosystem standard is well-established (high confidence) vs. where assumptions are noted:

| File | Confidence | Assumption |
|------|------------|------------|
| `package.json` | HIGH | `"type": "module"` confirmed compatible with all dev deps |
| `manifest.json` | HIGH | Derived from Chrome MV3 docs + ARCHITECTURE.md |
| `vite.config.ts` | HIGH | CRXJS 2.6 + Vite 8 confirmed compatible |
| `tsconfig.json` | HIGH | `"moduleResolution": "Bundler"` confirmed for Vite 8 |
| `tsconfig.node.json` | HIGH | Standard Vite pattern |
| `biome.json` | MEDIUM | CSS `tailwindDirectives` option — verify against Biome 2.5 schema |
| `vitest.config.ts` | HIGH | Vitest 4.x compatible with Vite 8 |
| `.nvmrc` | HIGH | — |
| `.gitignore` | HIGH | — |
| `src/background/index.ts` | HIGH | Derived from ARCHITECTURE.md Pattern B |
| `src/app/app.html` | HIGH | Standard CRXJS HTML entry |
| `src/app/main.tsx` | HIGH | Standard React 19 root mount |
| `src/app/App.tsx` | HIGH | Placeholder only |
| `src/test/setup.ts` | HIGH | Standard @testing-library/jest-dom pattern |
| `scripts/check-dist.js` | HIGH | Derived from PITFALLS.md + RESEARCH.md examples |
| `.github/workflows/build-check.yml` | MEDIUM | GH Actions YAML structure; exact step names may need tuning |
| `.github/workflows/release.yml` | MEDIUM | Requires manual first-upload + secret/var wiring |

---

## Metadata

**Analog search scope:** No codebase tree to search — greenfield project
**Files scanned:** 0 (no src/ tree exists)
**Pattern sources:** RESEARCH.md (project-specific research corpus), Chrome MV3 + CRXJS + Vite 8 + React 19 + Biome 2.x + Vitest 4 ecosystem documentation
**Pattern extraction date:** 2026-06-16
