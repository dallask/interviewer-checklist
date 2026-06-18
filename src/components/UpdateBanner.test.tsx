import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { UpdateBanner } from './UpdateBanner.js';

/**
 * POLISH-07: UpdateBanner tests.
 *
 * The banner reads `chrome.runtime.getManifest().version` synchronously
 * and queries `chrome.storage.local` for `lastSeenVersion` and
 * `dismissedUpdateVersion`. We mock both per scenario.
 *
 * CRITICAL: the component must use the LOCAL CONST version captured in
 * useEffect — NOT the React state value — for the comparison inside the
 * storage callback. These tests cover the comparison branch via the
 * mismatched `lastSeenVersion` scenario.
 */

// vitest-chrome's chrome.storage.local.get is typed with strict overloads
// that the project's tsconfig rejects when used with vi.spyOn().mockImpl.
// Cast through `any` to a permissive signature for test stubbing.
// biome-ignore lint/suspicious/noExplicitAny: test stubbing helper
type GetCallback = (result: Record<string, unknown>) => void;
function mockGet(result: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: cast through unknown
  (chrome.storage.local.get as unknown as { mockImplementation: Function })
    .mockImplementation((_keys: unknown, callback?: GetCallback) => {
      if (callback) callback(result);
      return Promise.resolve(result);
    });
}

function mockSet() {
  // biome-ignore lint/suspicious/noExplicitAny: cast through unknown
  (chrome.storage.local.set as unknown as { mockImplementation: Function })
    .mockImplementation((_items: unknown, callback?: () => void) => {
      if (callback) callback();
      return Promise.resolve();
    });
}

describe('UpdateBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.runtime.getManifest.mockReturnValue({
      name: 'Interviewer Checklist',
      manifest_version: 3,
      version: '1.1.0',
    } as chrome.runtime.Manifest);
    mockSet();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when lastSeenVersion is undefined (first-run case)', async () => {
    mockGet({});
    const { container } = render(<UpdateBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('renders banner when lastSeenVersion !== currentVersion and dismissedUpdateVersion !== currentVersion', async () => {
    mockGet({ lastSeenVersion: '1.0.0' });
    const { container, getByText } = render(<UpdateBanner />);
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).not.toBeNull();
    });
    expect(getByText(/Updated to v1\.1\.0/)).toBeInTheDocument();
  });

  it('does NOT render banner when dismissedUpdateVersion === currentVersion', async () => {
    mockGet({ lastSeenVersion: '1.0.0', dismissedUpdateVersion: '1.1.0' });
    const { container } = render(<UpdateBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('clicking dismiss writes dismissedUpdateVersion=currentVersion to storage and hides the banner', async () => {
    mockGet({ lastSeenVersion: '1.0.0' });
    const { container, getByLabelText } = render(<UpdateBanner />);
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).not.toBeNull();
    });

    const dismissBtn = getByLabelText('Dismiss update banner');
    fireEvent.click(dismissBtn);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ dismissedUpdateVersion: '1.1.0' }),
    );
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it('clicking "What\'s new" dispatches the open-changelog CustomEvent', async () => {
    mockGet({ lastSeenVersion: '1.0.0' });
    const eventSpy = vi.fn();
    window.addEventListener('open-changelog', eventSpy);
    try {
      const { getByText } = render(<UpdateBanner />);
      await waitFor(() => {
        expect(getByText("What's new")).toBeInTheDocument();
      });
      fireEvent.click(getByText("What's new"));
      expect(eventSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('open-changelog', eventSpy);
    }
  });

  it('renders nothing when chrome.runtime.lastError is set on the storage callback', async () => {
    const lastErrorDescriptor = Object.getOwnPropertyDescriptor(
      chrome.runtime,
      'lastError',
    );
    Object.defineProperty(chrome.runtime, 'lastError', {
      configurable: true,
      get: () => ({ message: 'simulated error' }) as chrome.runtime.LastError,
    });
    mockGet({ lastSeenVersion: '1.0.0' });
    const { container } = render(<UpdateBanner />);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('[role="status"]')).toBeNull();

    if (lastErrorDescriptor) {
      Object.defineProperty(chrome.runtime, 'lastError', lastErrorDescriptor);
    } else {
      Object.defineProperty(chrome.runtime, 'lastError', {
        configurable: true,
        value: undefined,
        writable: true,
      });
    }
  });
});
