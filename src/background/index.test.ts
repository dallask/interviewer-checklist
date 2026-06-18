import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

// Patch chrome.action into the global vitest-chrome mock so that importing
// index.ts (which calls chrome.action.onClicked.addListener at module scope)
// does not throw. vitest-chrome is MV2-era and lacks chrome.action (MV3).
const mockActionOnClicked = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  hasListener: vi.fn(),
  hasListeners: vi.fn(() => false),
  clearListeners: vi.fn(),
  callListeners: vi.fn(),
};
// @ts-expect-error vitest-chrome types do not expose chrome.action (MV3)
globalThis.chrome.action = { onClicked: mockActionOnClicked };

describe('service worker structural constraints (src/background/index.ts)', () => {
  it('registers chrome.action.onClicked.addListener', () => {
    expect(src).toContain('chrome.action.onClicked.addListener');
  });

  it('contains chrome.tabs.query for tab deduplication', () => {
    expect(src).toContain('chrome.tabs.query');
  });

  it('registers chrome.runtime.onInstalled.addListener (Phase 9)', () => {
    expect(src).toContain('chrome.runtime.onInstalled');
  });

  it('onInstalled handler stores lastSeenVersion', () => {
    expect(src).toContain('lastSeenVersion');
  });

  it('onInstalled handler opens welcome tab on install', () => {
    expect(src).toContain('welcome.html');
  });

  it('does NOT contain top-level mutable variable declarations (let at module scope)', () => {
    // Check for module-level let declarations (not inside functions/blocks)
    // The service worker must be stateless — no mutable module-level state
    const moduleTopLevelLetPattern = /^let\s+/m;
    expect(src).not.toMatch(moduleTopLevelLetPattern);
  });
});

describe('service worker onInstalled behavioral tests', () => {
  // Import module once so listeners are registered for all tests.
  // ES module caching means subsequent import() calls are no-ops, so we must
  // use beforeAll here and reset mocks (not listeners) in beforeEach.
  beforeAll(async () => {
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.0.0',
    } as chrome.runtime.Manifest);
    await import('./index.js');
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply getManifest mock after clearAllMocks resets it
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.0.0',
    } as chrome.runtime.Manifest);
    // Default mock for storage.local.set (used by all tests)
    chrome.storage.local.set.mockImplementation(
      (_items: Record<string, unknown>, callback?: () => void) => {
        if (callback) callback();
        return Promise.resolve();
      },
    );
  });

  it('on reason=install with hasSeenWelcome=false: opens welcome tab', async () => {
    chrome.storage.local.get.mockImplementation(
      (
        _keys: string | string[] | Record<string, unknown> | null,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback({ hasSeenWelcome: false });
        return Promise.resolve({ hasSeenWelcome: false });
      },
    );
    chrome.runtime.getURL.mockImplementation((path: string) => `chrome-extension://abc/${path}`);
    chrome.tabs.create.mockResolvedValue({ id: 1 } as chrome.tabs.Tab);

    chrome.runtime.onInstalled.callListeners({
      reason: 'install',
      previousVersion: undefined,
      id: undefined,
    });

    await vi.waitFor(() => {
      expect(chrome.tabs.create).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('welcome.html') }),
      );
    });
  });

  it('on reason=install with hasSeenWelcome=true: does NOT open welcome tab', async () => {
    chrome.storage.local.get.mockImplementation(
      (
        _keys: string | string[] | Record<string, unknown> | null,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback({ hasSeenWelcome: true });
        return Promise.resolve({ hasSeenWelcome: true });
      },
    );
    chrome.runtime.getURL.mockImplementation((path: string) => `chrome-extension://abc/${path}`);
    chrome.tabs.create.mockResolvedValue({ id: 1 } as chrome.tabs.Tab);

    chrome.runtime.onInstalled.callListeners({
      reason: 'install',
      previousVersion: undefined,
      id: undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });

  it('on update: does NOT touch lastSeenVersion (CR-01) — UpdateBanner needs the stale value', async () => {
    chrome.storage.local.get.mockImplementation(
      (
        _keys: string | string[] | Record<string, unknown> | null,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback({ hasSeenWelcome: true });
        return Promise.resolve({ hasSeenWelcome: true });
      },
    );

    chrome.runtime.onInstalled.callListeners({
      reason: 'update',
      previousVersion: '0.9.0',
      id: undefined,
    });

    // Give the (now-IIFE-wrapped, WR-06) async body a moment to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const setCalls = (chrome.storage.local.set as ReturnType<typeof vi.fn>).mock.calls;
    const hasLastVersion = setCalls.some(
      (call: unknown[]) =>
        call[0] !== null &&
        typeof call[0] === 'object' &&
        'lastSeenVersion' in (call[0] as object),
    );
    expect(hasLastVersion).toBe(false);
  });

  it('on reason=update: chrome.tabs.create is NOT called', async () => {
    chrome.storage.local.get.mockImplementation(
      (
        _keys: string | string[] | Record<string, unknown> | null,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        if (callback) callback({ hasSeenWelcome: true });
        return Promise.resolve({ hasSeenWelcome: true });
      },
    );
    chrome.tabs.create.mockResolvedValue({ id: 1 } as chrome.tabs.Tab);

    chrome.runtime.onInstalled.callListeners({
      reason: 'update',
      previousVersion: '0.9.0',
      id: undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });
});
