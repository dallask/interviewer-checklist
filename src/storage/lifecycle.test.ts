import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageAdapter } from './adapter.js';
import {
  registerLifecycleListeners,
  unregisterLifecycleListeners,
} from './lifecycle.js';

describe('lifecycle event handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure clean handler state before each test
    unregisterLifecycleListeners();
    registerLifecycleListeners();
  });

  it('calls storageAdapter.flushPending() when visibilitychange fires with hidden state', () => {
    const flushSpy = vi.spyOn(storageAdapter, 'flushPending');

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    window.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).toHaveBeenCalledTimes(1);

    // Restore
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });

  it('does NOT call storageAdapter.flushPending() when visibilitychange fires with visible state', () => {
    const flushSpy = vi.spyOn(storageAdapter, 'flushPending');

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    window.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('calls storageAdapter.flushPending() when pagehide event fires', () => {
    const flushSpy = vi.spyOn(storageAdapter, 'flushPending');

    window.dispatchEvent(new Event('pagehide'));

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT call storageAdapter.flushPending() after unregisterLifecycleListeners()', () => {
    const flushSpy = vi.spyOn(storageAdapter, 'flushPending');

    unregisterLifecycleListeners();
    window.dispatchEvent(new Event('pagehide'));

    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('does NOT call storageAdapter.flushPending() on visibilitychange=hidden after unregister', () => {
    const flushSpy = vi.spyOn(storageAdapter, 'flushPending');

    unregisterLifecycleListeners();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    window.dispatchEvent(new Event('visibilitychange'));

    expect(flushSpy).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
  });
});
