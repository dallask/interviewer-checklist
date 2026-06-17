// src/storage/lifecycle.ts
// Registers and unregisters page lifecycle event listeners that trigger
// storageAdapter.flushPending() to persist buffered writes before teardown.
// Uses module-level named function references so removeEventListener can
// identify the same handler references (not inline lambdas).

import { storageAdapter } from './adapter.js';

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    storageAdapter.flushPending();
  }
}

function onPageHide(): void {
  storageAdapter.flushPending();
}

/**
 * Registers visibilitychange and pagehide handlers on window.
 * Call once at app startup after bootstrap() resolves.
 */
export function registerLifecycleListeners(): void {
  window.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);
}

/**
 * Removes the visibilitychange and pagehide handlers.
 * Uses the same named function references to ensure correct handler removal.
 */
export function unregisterLifecycleListeners(): void {
  window.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', onPageHide);
}
