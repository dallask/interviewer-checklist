// src/storage/adapter.ts
// Single I/O owner for all chrome.storage.local operations.
// Implements STORE-01, STORE-04, STORE-05, STORE-06.
// Public API: read(), write(), flushPending(), snapshot().

const QUOTA_WARNING_THRESHOLD = 0.8; // 80% of QUOTA_BYTES
const QUOTA_BYTES = 10_485_760; // chrome.storage.local.QUOTA_BYTES (10 MB)
const DEBOUNCE_MS = 300;

export class StorageAdapter {
  #dirty = false;
  #pendingData: Record<string, unknown> | null = null;
  #debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Reads values for the given keys from chrome.storage.local.
   * On error: logs to console.error and returns {}.
   */
  async read(keys: string[]): Promise<Record<string, unknown>> {
    try {
      return await chrome.storage.local.get(keys);
    } catch (err) {
      console.error('[StorageAdapter] read error:', err);
      return {};
    }
  }

  /**
   * Merges data into the pending write buffer, marks dirty, and schedules
   * a 300ms debounced flush. Rapid calls coalesce into a single set().
   */
  write(data: Record<string, unknown>): void {
    this.#pendingData = { ...this.#pendingData, ...data };
    this.#dirty = true;
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
    }
    this.#debounceTimer = setTimeout(() => {
      void this.#flush();
    }, DEBOUNCE_MS);
  }

  /**
   * Synchronously initiates a flush when dirty=true.
   * Fire-and-forget: called from pagehide/visibilitychange handlers where
   * async completion cannot be guaranteed before page teardown.
   * No-op when dirty=false (prevents double-flush on rapid hide/restore).
   */
  flushPending(): void {
    if (!this.#dirty || this.#pendingData === null) return;
    if (this.#debounceTimer !== null) {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = null;
    }
    void this.#flush();
  }

  /**
   * Captures current pending data, clears dirty state, checks quota,
   * then writes to chrome.storage.local. On write error: restores dirty state
   * and merges data back so the next write/flush can retry.
   */
  async #flush(): Promise<void> {
    if (this.#pendingData === null) return;
    // Capture and clear pending state before awaiting
    const data = this.#pendingData;
    this.#pendingData = null;
    this.#dirty = false;
    await this.#checkQuota();
    try {
      await chrome.storage.local.set(data);
    } catch (err) {
      console.error('[StorageAdapter] write error:', err);
      // Re-dirty: restore pending data so next write/flush can retry
      this.#dirty = true;
      this.#pendingData = { ...data, ...(this.#pendingData ?? {}) };
    }
  }

  /**
   * Checks storage usage; dispatches 'storage-quota-warning' CustomEvent on
   * window when getBytesInUse() exceeds 80% of QUOTA_BYTES (10 MB).
   * Failure is non-blocking (silent catch).
   */
  async #checkQuota(): Promise<void> {
    try {
      const used = await chrome.storage.local.getBytesInUse(null);
      if (used > QUOTA_BYTES * QUOTA_WARNING_THRESHOLD) {
        window.dispatchEvent(
          new CustomEvent('storage-quota-warning', {
            detail: { usedBytes: used, quotaBytes: QUOTA_BYTES },
          }),
        );
      }
    } catch {
      // getBytesInUse failure is non-blocking — quota check is best-effort
    }
  }

  /**
   * Reads current session state and writes it under snapshot:<sessionId>:<timestamp>.
   * Guard: if no session data exists, returns early without writing.
   * Triggers FIFO trim to keep only the last 3 snapshots.
   */
  async snapshot(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    const data = await this.read([key]);
    if (!data[key]) return;
    const snapshotKey = `snapshot:${sessionId}:${Date.now()}`;
    await chrome.storage.local.set({ [snapshotKey]: data[key] });
    await this.#trimSnapshots(sessionId);
  }

  /**
   * Trims snapshots for the given sessionId to the last 3.
   * Uses chrome.storage.local.get(null) to retrieve all stored items and filters
   * by the 'snapshot:<sessionId>:' prefix. Avoids chrome.storage.local.getKeys()
   * which is Chrome 117+ only and may be absent from @types/chrome 0.1.43.
   */
  async #trimSnapshots(sessionId: string): Promise<void> {
    const prefix = `snapshot:${sessionId}:`;
    // get(null) returns all stored items as Record<string, unknown>
    const all = await chrome.storage.local.get(null);
    const snapKeys = Object.keys(all)
      .filter((k) => k.startsWith(prefix))
      .sort(); // ISO/numeric timestamp suffix sorts lexicographically ascending

    // Keep only the last 3 snapshots; remove all older ones
    if (snapKeys.length > 3) {
      const toRemove = snapKeys.slice(0, snapKeys.length - 3);
      await chrome.storage.local.remove(toRemove);
    }
  }
}

/** Singleton exported for use by lifecycle.ts and bootstrap.ts */
export const storageAdapter = new StorageAdapter();
