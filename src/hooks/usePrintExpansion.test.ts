import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/app.js';
import { usePrintExpansion } from './usePrintExpansion.js';

/**
 * POLISH-05: print expansion hook tests.
 *
 * The hook listens for `beforeprint` and `afterprint` window events. We fire
 * those events synchronously via `window.dispatchEvent` and assert on real
 * store state.
 */
describe('usePrintExpansion', () => {
  beforeEach(() => {
    useAppStore.setState({
      topicOpen: { topicA: false, topicB: true },
      sectionOpen: { sectionX: false },
      printMode: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('beforeprint expands all topics, opens all sections, and sets printMode=true', () => {
    renderHook(() => usePrintExpansion());

    window.dispatchEvent(new Event('beforeprint'));

    // WR-02 fix: a single coalesced setState now writes topicOpen,
    // sectionOpen, and printMode together (no expandAll() call). Assert
    // on the observable result rather than the method invocation.
    expect(useAppStore.getState().printMode).toBe(true);
    // sectionOpen is reset to {} so every section renders open.
    expect(useAppStore.getState().sectionOpen).toEqual({});
    // topicOpen should be a non-empty record with every value === true.
    const topicOpen = useAppStore.getState().topicOpen;
    const values = Object.values(topicOpen);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((v) => v === true)).toBe(true);
  });

  it('afterprint restores topicOpen and sectionOpen and clears printMode', () => {
    const initialTopicOpen = { topicA: false, topicB: true };
    const initialSectionOpen = { sectionX: false };
    useAppStore.setState({
      topicOpen: initialTopicOpen,
      sectionOpen: initialSectionOpen,
    });
    renderHook(() => usePrintExpansion());

    // Simulate a print cycle.
    window.dispatchEvent(new Event('beforeprint'));
    // After beforeprint, state should be expanded.
    expect(useAppStore.getState().printMode).toBe(true);

    window.dispatchEvent(new Event('afterprint'));

    expect(useAppStore.getState().printMode).toBe(false);
    expect(useAppStore.getState().topicOpen).toEqual(initialTopicOpen);
    expect(useAppStore.getState().sectionOpen).toEqual(initialSectionOpen);
  });

  it('removes both event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePrintExpansion());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeprint', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('afterprint', expect.any(Function));
  });
});
