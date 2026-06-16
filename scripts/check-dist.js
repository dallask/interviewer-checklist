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
