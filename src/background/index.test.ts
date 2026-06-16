import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

describe('service worker structural constraints (src/background/index.ts)', () => {
  it('registers chrome.action.onClicked.addListener', () => {
    expect(src).toContain('chrome.action.onClicked.addListener');
  });

  it('contains chrome.tabs.query for tab deduplication', () => {
    expect(src).toContain('chrome.tabs.query');
  });

  it('does NOT contain chrome.runtime.onInstalled (Phase 9 only)', () => {
    expect(src).not.toContain('chrome.runtime.onInstalled');
  });

  it('line count is ≤ 30', () => {
    const lines = src.split('\n').filter((line) => line.trim().length > 0);
    expect(lines.length).toBeLessThanOrEqual(30);
  });

  it('does NOT contain top-level mutable variable declarations (let at module scope)', () => {
    // Check for module-level let declarations (not inside functions/blocks)
    // The service worker must be stateless — no mutable module-level state
    const moduleTopLevelLetPattern = /^let\s+/m;
    expect(src).not.toMatch(moduleTopLevelLetPattern);
  });

  it('does NOT contain top-level const variable declarations (mutable state at module scope)', () => {
    // Only addListener calls should appear at module scope
    // Const declarations at top level would imply caching state between SW wakes
    const moduleTopLevelConstPattern = /^const\s+[a-z]/m;
    expect(src).not.toMatch(moduleTopLevelConstPattern);
  });
});
