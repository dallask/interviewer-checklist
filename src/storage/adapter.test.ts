import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { StorageAdapter, storageAdapter } from './adapter.js';
import type { V2Session } from './types.js';

// ---------------------------------------------------------------------------
// StorageAdapter.read
// ---------------------------------------------------------------------------

describe('StorageAdapter.read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls chrome.storage.local.get with the provided keys and returns the result', async () => {
    const mockResult = {
      manifest: { version: 2, activeSessionId: 'abc', sessions: [] },
    };
    chrome.storage.local.get.mockImplementation(
      (
        _keys: unknown,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        callback?.(mockResult);
        return Promise.resolve(mockResult);
      },
    );

    const adapter = new StorageAdapter();
    const result = await adapter.read(['manifest']);

    expect(chrome.storage.local.get).toHaveBeenCalledWith(['manifest']);
    expect(result).toEqual(mockResult);
  });

  it('catches chrome.storage.local.get rejection, logs to console.error, and returns {}', async () => {
    chrome.storage.local.get.mockImplementation(() => {
      return Promise.reject(new Error('storage error'));
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const adapter = new StorageAdapter();
    const result = await adapter.read(['manifest']);

    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter.write + debounce
// ---------------------------------------------------------------------------

describe('StorageAdapter.write + debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Default: getBytesInUse returns 0 (below quota)
    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(0);
        return Promise.resolve(0);
      },
    );
    // Default: set resolves immediately
    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets dirty=true and schedules a setTimeout after DEBOUNCE_MS (300ms)', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });

    // Should not have called set yet
    expect(chrome.storage.local.set).not.toHaveBeenCalled();

    // Advance time past debounce
    await vi.advanceTimersByTimeAsync(300);

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' });
  });

  it('coalesces two rapid write calls into a single chrome.storage.local.set call', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key1: 'value1' });
    adapter.write({ key2: 'value2' });

    await vi.advanceTimersByTimeAsync(300);

    // Only one set call (debounce coalesced)
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
  });

  it('merges two write payloads — single set call contains both keys', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key1: 'value1' });
    adapter.write({ key2: 'value2' });

    await vi.advanceTimersByTimeAsync(300);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      key1: 'value1',
      key2: 'value2',
    });
  });

  it('after flush: dirty=false, pendingData=null, chrome.storage.local.set called once', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ foo: 'bar' });

    await vi.advanceTimersByTimeAsync(300);

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);

    // After flush, a second write should trigger a new debounce (not a stale one)
    vi.clearAllMocks();
    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(0);
        return Promise.resolve(0);
      },
    );
    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );

    adapter.write({ baz: 'qux' });
    await vi.advanceTimersByTimeAsync(300);

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ baz: 'qux' });
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter.flushPending
// ---------------------------------------------------------------------------

describe('StorageAdapter.flushPending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(0);
        return Promise.resolve(0);
      },
    );
    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a no-op when dirty=false (chrome.storage.local.set not called)', () => {
    const adapter = new StorageAdapter();
    adapter.flushPending();
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('synchronously initiates chrome.storage.local.set when dirty=true', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });

    adapter.flushPending();

    // Let microtasks run
    await vi.runAllTimersAsync();

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' });
  });

  it('clears the pending debounce timer (no double-flush after flushPending)', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });

    adapter.flushPending();

    // Advance past debounce delay — the timer should have been cleared
    await vi.advanceTimersByTimeAsync(300);

    // Should have been called exactly once (from flushPending, not again from timer)
    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
  });

  it('second flushPending call is no-op when dirty already false after first call', async () => {
    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });

    adapter.flushPending();
    adapter.flushPending(); // second call — dirty is already false from first

    await vi.runAllTimersAsync();

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter.remove
// ---------------------------------------------------------------------------

describe('StorageAdapter.remove', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(0);
        return Promise.resolve(0);
      },
    );
    chrome.storage.local.remove.mockImplementation(
      (_keys: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes pending writes before removing and then calls chrome.storage.local.remove', async () => {
    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );

    const adapter = new StorageAdapter();
    adapter.write({ pendingKey: 'pendingValue' });

    await adapter.remove(['pendingKey']);

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      pendingKey: 'pendingValue',
    });
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(['pendingKey']);
  });

  it('throws when flush fails (dirty remains true after flush), and does NOT call chrome.storage.local.remove', async () => {
    // Simulate chrome.storage.local.set failure so #flush restores dirty state
    chrome.storage.local.set.mockImplementation(() => {
      return Promise.reject(new Error('quota exceeded'));
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const adapter = new StorageAdapter();
    adapter.write({ importantKey: 'value' });

    await expect(adapter.remove(['importantKey'])).rejects.toThrow(
      'StorageAdapter.remove: pending writes could not be flushed',
    );

    // Must NOT proceed to remove when flush left data dirty
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('skips flush and calls remove directly when there are no pending writes', async () => {
    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );

    const adapter = new StorageAdapter();
    // No write() call — nothing pending

    await adapter.remove(['someKey']);

    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(['someKey']);
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter quota check
// ---------------------------------------------------------------------------

describe('StorageAdapter quota check', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches storage-quota-warning CustomEvent when getBytesInUse > 80% of QUOTA_BYTES', async () => {
    // 10MB * 0.8 = 8,388,608 bytes; set usage just above threshold
    const usedBytes = 10_485_760 * 0.85;

    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(usedBytes);
        return Promise.resolve(usedBytes);
      },
    );

    const events: CustomEvent[] = [];
    const handler = (e: Event) => {
      events.push(e as CustomEvent);
    };
    window.addEventListener('storage-quota-warning', handler);

    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });
    await vi.advanceTimersByTimeAsync(300);

    window.removeEventListener('storage-quota-warning', handler);

    expect(events).toHaveLength(1);
    expect(events[0].detail.usedBytes).toBe(usedBytes);
    expect(events[0].detail.quotaBytes).toBe(10_485_760);
  });

  it('does NOT dispatch storage-quota-warning when getBytesInUse <= 80% of QUOTA_BYTES', async () => {
    // Below threshold
    const usedBytes = 10_485_760 * 0.5;

    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(usedBytes);
        return Promise.resolve(usedBytes);
      },
    );

    const events: CustomEvent[] = [];
    const handler = (e: Event) => {
      events.push(e as CustomEvent);
    };
    window.addEventListener('storage-quota-warning', handler);

    const adapter = new StorageAdapter();
    adapter.write({ key: 'value' });
    await vi.advanceTimersByTimeAsync(300);

    window.removeEventListener('storage-quota-warning', handler);

    expect(events).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter.snapshot + FIFO trim
// ---------------------------------------------------------------------------

describe('StorageAdapter.snapshot + FIFO trim', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    chrome.storage.local.set.mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
    chrome.storage.local.remove.mockImplementation(
      (_keys: unknown, callback?: () => void) => {
        callback?.();
        return Promise.resolve();
      },
    );
    chrome.storage.local.getBytesInUse.mockImplementation(
      (_keys: unknown, callback?: (result: number) => void) => {
        callback?.(0);
        return Promise.resolve(0);
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads session data under session:sessionId and writes it under snapshot:sessionId:<timestamp>', async () => {
    const sessionId = 'test-session-abc';
    const sessionData: V2Session = {
      version: 2,
      id: sessionId,
      questionScore: { q1: 8 },
      topicOverride: {},
      cardComment: {},
      questionComment: {},
      candidate: { name: 'Alice' },
      customQuestions: {},
      customSeq: 0,
    };

    chrome.storage.local.get.mockImplementation(
      (keys: unknown, callback?: (result: Record<string, unknown>) => void) => {
        const keysArr = keys as string[] | null;
        if (keysArr === null) {
          // get(null) for trimSnapshots — return no existing snapshots
          const result: Record<string, unknown> = {
            [`session:${sessionId}`]: sessionData,
          };
          callback?.(result);
          return Promise.resolve(result);
        }
        const result: Record<string, unknown> = {};
        for (const k of keysArr) {
          if (k === `session:${sessionId}`) result[k] = sessionData;
        }
        callback?.(result);
        return Promise.resolve(result);
      },
    );

    const nowBefore = Date.now();
    const adapter = new StorageAdapter();
    await adapter.snapshot(sessionId);
    const nowAfter = Date.now();

    const setCall = (chrome.storage.local.set as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    const snapshotKey = Object.keys(setCall)[0];

    expect(snapshotKey).toMatch(/^snapshot:test-session-abc:\d+$/);
    const ts = Number(snapshotKey.split(':')[2]);
    expect(ts).toBeGreaterThanOrEqual(nowBefore);
    expect(ts).toBeLessThanOrEqual(nowAfter);
    expect(setCall[snapshotKey]).toEqual(sessionData);
  });

  it('trims to last 3 snapshots when 4 existing snapshots exist (removes oldest)', async () => {
    const sessionId = 'trim-session';
    const sessionData: V2Session = {
      version: 2,
      id: sessionId,
      questionScore: {},
      topicOverride: {},
      cardComment: {},
      questionComment: {},
      candidate: {},
      customQuestions: {},
      customSeq: 0,
    };

    // 4 existing snapshots — sorted ascending by timestamp suffix
    const existingSnapshots: Record<string, unknown> = {
      [`snapshot:${sessionId}:1000`]: sessionData,
      [`snapshot:${sessionId}:2000`]: sessionData,
      [`snapshot:${sessionId}:3000`]: sessionData,
      [`snapshot:${sessionId}:4000`]: sessionData,
    };

    chrome.storage.local.get.mockImplementation(
      (keys: unknown, callback?: (result: Record<string, unknown>) => void) => {
        const keysArr = keys as string[] | null;
        if (keysArr === null) {
          // get(null) returns all stored items including existing snapshots + session
          const result: Record<string, unknown> = {
            [`session:${sessionId}`]: sessionData,
            ...existingSnapshots,
          };
          callback?.(result);
          return Promise.resolve(result);
        }
        const result: Record<string, unknown> = {};
        for (const k of keysArr) {
          if (k === `session:${sessionId}`) result[k] = sessionData;
        }
        callback?.(result);
        return Promise.resolve(result);
      },
    );

    const adapter = new StorageAdapter();
    await adapter.snapshot(sessionId);

    // After writing a 5th snapshot, oldest (snapshot:trim-session:1000) should be removed
    expect(chrome.storage.local.remove).toHaveBeenCalledTimes(1);
    const removedKeys = (
      chrome.storage.local.remove as ReturnType<typeof vi.fn>
    ).mock.calls[0][0] as string[];
    expect(removedKeys).toContain(`snapshot:${sessionId}:1000`);
    expect(removedKeys).not.toContain(`snapshot:${sessionId}:4000`);
  });

  it('does NOT write a snapshot when no session data exists for sessionId (guard on empty)', async () => {
    const sessionId = 'empty-session';

    chrome.storage.local.get.mockImplementation(
      (
        _keys: unknown,
        callback?: (result: Record<string, unknown>) => void,
      ) => {
        callback?.({});
        return Promise.resolve({});
      },
    );

    const adapter = new StorageAdapter();
    await adapter.snapshot(sessionId);

    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// storageAdapter singleton
// ---------------------------------------------------------------------------

describe('storageAdapter singleton', () => {
  it('is an instance of StorageAdapter', () => {
    expect(storageAdapter).toBeInstanceOf(StorageAdapter);
  });
});
