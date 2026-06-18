import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/app.js';
import { useKeyboardShortcuts } from './useKeyboardShortcuts.js';

/**
 * POLISH-03: Document-level keyboard shortcut hook tests.
 *
 * The hook uses `useAppStore.getState()` at event time (not selector
 * subscriptions), so the tests mutate the real store and assert that the
 * keydown handler routes correctly via spies on store actions.
 */
describe('useKeyboardShortcuts', () => {
  let setSidebarOpenSpy: ReturnType<typeof vi.spyOn>;
  let setSearchQuerySpy: ReturnType<typeof vi.spyOn>;
  let hookResult: ReturnType<typeof renderHook<void, unknown>> | undefined;

  beforeEach(() => {
    useAppStore.setState({
      sidebarOpen: true,
      searchQuery: '',
    });
    setSidebarOpenSpy = vi.spyOn(useAppStore.getState(), 'setSidebarOpen');
    setSearchQuerySpy = vi.spyOn(useAppStore.getState(), 'setSearchQuery');
    // vi.spyOn on an already-spied property returns the existing spy with
    // accumulated calls from prior tests — clear them so each test starts at 0.
    setSidebarOpenSpy.mockClear();
    setSearchQuerySpy.mockClear();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  afterEach(() => {
    hookResult?.unmount();
    hookResult = undefined;
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('"/" key focuses the search input (queried by aria-label)', () => {
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Search questions');
    document.body.appendChild(input);
    const focusSpy = vi.spyOn(input, 'focus');

    hookResult = renderHook(() => useKeyboardShortcuts());
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    document.dispatchEvent(event);

    expect(focusSpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('"\\" key toggles sidebar via setSidebarOpen with the negated value', () => {
    useAppStore.setState({ sidebarOpen: true });
    hookResult = renderHook(() => useKeyboardShortcuts());
    const event = new KeyboardEvent('keydown', { key: '\\', cancelable: true });
    document.dispatchEvent(event);
    expect(setSidebarOpenSpy).toHaveBeenCalledTimes(1);
    expect(setSidebarOpenSpy).toHaveBeenCalledWith(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it('"\\" reads sidebarOpen via getState (no stale closure)', () => {
    useAppStore.setState({ sidebarOpen: false });
    hookResult = renderHook(() => useKeyboardShortcuts());
    // Mutate AFTER hook registration — getState() should see the new value.
    useAppStore.setState({ sidebarOpen: true });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\' }));
    expect(setSidebarOpenSpy).toHaveBeenCalledWith(false);
  });

  it('"Escape" calls setSearchQuery("")', () => {
    hookResult = renderHook(() => useKeyboardShortcuts());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(setSearchQuerySpy).toHaveBeenCalledWith('');
  });

  it('"/" is suppressed when activeElement is an INPUT', () => {
    const focusedInput = document.createElement('input');
    document.body.appendChild(focusedInput);
    focusedInput.focus();

    const searchInput = document.createElement('input');
    searchInput.setAttribute('aria-label', 'Search questions');
    document.body.appendChild(searchInput);
    const focusSpy = vi.spyOn(searchInput, 'focus');

    hookResult = renderHook(() => useKeyboardShortcuts());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('"/" is suppressed when activeElement is a TEXTAREA', () => {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();

    const searchInput = document.createElement('input');
    searchInput.setAttribute('aria-label', 'Search questions');
    document.body.appendChild(searchInput);
    const focusSpy = vi.spyOn(searchInput, 'focus');

    hookResult = renderHook(() => useKeyboardShortcuts());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('"/" is suppressed when activeElement is contenteditable', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();

    const searchInput = document.createElement('input');
    searchInput.setAttribute('aria-label', 'Search questions');
    document.body.appendChild(searchInput);
    const focusSpy = vi.spyOn(searchInput, 'focus');

    hookResult = renderHook(() => useKeyboardShortcuts());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('"\\" is suppressed when a dialog[open] is present', () => {
    hookResult = renderHook(() => useKeyboardShortcuts());

    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\' }));
    expect(setSidebarOpenSpy).not.toHaveBeenCalled();
  });

  it('removes the keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
